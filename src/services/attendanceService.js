const { all, get, run, tableExists, getDb } = require('../database/db');
const { getCurrentDateTimeParts, getDurationMinutes } = require('../utils/dateUtils');

const CARRERA_EQUIVALENCIAS = {
  'ingeniería civil plan común': 'Plan Común de Ingenierías y Licenciaturas',
  'ingenieria civil plan comun': 'Plan Común de Ingenierías y Licenciaturas',
  'ingeniería civil en informática': 'Ingeniería Civil Informática',
  'ingenieria civil en informatica': 'Ingeniería Civil Informática',
  arquitectura: ''
};

function normalizeText(value) {
  return String(value || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim();
}

function mapMatrixCarrera(carreraIngreso, allowedCarreras = []) {
  const rawValue = String(carreraIngreso || '').trim();
  if (!rawValue) {
    return '';
  }

  const normalizedAllowed = new Map(
    allowedCarreras.map((carrera) => [normalizeText(carrera), carrera])
  );

  const normalizedRaw = normalizeText(rawValue);

  if (normalizedAllowed.has(normalizedRaw)) {
    return normalizedAllowed.get(normalizedRaw);
  }

  const equivalencia = CARRERA_EQUIVALENCIAS[normalizedRaw];
  if (equivalencia && normalizedAllowed.has(normalizeText(equivalencia))) {
    return normalizedAllowed.get(normalizeText(equivalencia));
  }

  return '';
}

function mapMatrixCohorteToAnioIngreso(cohorte) {
  if (cohorte === null || cohorte === undefined || cohorte === '') {
    return '';
  }

  const year = String(cohorte).replace(/[^0-9]/g, '').slice(0, 4);
  return /^\d{4}$/.test(year) ? year : '';
}

function mapJornadaValue(rawJornada) {
  const normalized = normalizeText(rawJornada);

  if (!normalized) {
    return '';
  }

  if (normalized.startsWith('diurn')) {
    return 'Diurno';
  }

  if (normalized.startsWith('vespertin')) {
    return 'Vespertino';
  }

  return '';
}

function pickMatrixNombre(studentRow) {
  if (!studentRow) {
    return '';
  }

  const candidateKeys = [
    'nombre',
    'nombres',
    'nombre_completo',
    'primer_apellido',
    'apellido_paterno'
  ];

  for (const key of candidateKeys) {
    const value = studentRow[key];
    if (value !== null && value !== undefined && String(value).trim()) {
      return String(value).trim();
    }
  }

  return '';
}

async function findOpenRecord(campus, runValue) {
  return get(
    `SELECT * FROM attendance_records
     WHERE campus = ? AND run = ? AND hora_entrada IS NOT NULL AND (hora_salida IS NULL OR hora_salida = '')
     ORDER BY id DESC LIMIT 1`,
    [campus, runValue]
  );
}

async function registerAttendance(payload) {
  const now = getCurrentDateTimeParts();

  const existingOpen = await findOpenRecord(payload.campus, payload.run);

  if (!existingOpen) {
    const result = await run(
      `INSERT INTO attendance_records (
        campus, fecha, run, dv, nombre, carrera, jornada, anio_ingreso, actividad, tematica, espacio, observaciones,
        hora_entrada, hora_salida, estado, duracion_minutos, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NULL, ?, NULL, ?)`,
      [
        payload.campus,
        now.fecha,
        payload.run,
        payload.dv,
        payload.nombre,
        payload.carrera,
        payload.jornada,
        payload.anioIngreso,
        payload.actividad,
        payload.tematica,
        payload.espacio,
        payload.observaciones,
        now.hora,
        'abierto',
        now.iso
      ]
    );

    return {
      type: 'entrada',
      message: `Entrada registrada correctamente (${now.hora}).`,
      recordId: result.id
    };
  }

  const duration = getDurationMinutes(existingOpen.hora_entrada, now.hora);

  await run(
    `UPDATE attendance_records
     SET hora_salida = ?, estado = ?, duracion_minutos = ?
     WHERE id = ?`,
    [now.hora, 'cerrado', duration, existingOpen.id]
  );

  return {
    type: 'salida',
    message: `Salida registrada correctamente (${now.hora}).`,
    recordId: existingOpen.id
  };
}

async function closeOpenRecordById(campus, recordId) {
  const now = getCurrentDateTimeParts();

  const openRecord = await get(
    `SELECT id, hora_entrada, run
     FROM attendance_records
     WHERE id = ? AND campus = ? AND hora_entrada IS NOT NULL AND (hora_salida IS NULL OR hora_salida = '')
     LIMIT 1`,
    [recordId, campus]
  );

  if (!openRecord) {
    return {
      ok: false,
      message: 'No se encontró un registro abierto para cerrar.'
    };
  }

  const duration = getDurationMinutes(openRecord.hora_entrada, now.hora);

  await run(
    `UPDATE attendance_records
     SET hora_salida = ?, estado = ?, duracion_minutos = ?
     WHERE id = ?`,
    [now.hora, 'cerrado', duration, openRecord.id]
  );

  return {
    ok: true,
    type: 'salida_manual',
    message: `Salida registrada correctamente para RUN ${openRecord.run} (${now.hora}).`,
    recordId: openRecord.id
  };
}

async function getLatestTodayRecords(campus) {
  const now = getCurrentDateTimeParts();
  return all(
    `SELECT id, hora_entrada, hora_salida, run, nombre, carrera, actividad, estado
     FROM attendance_records
     WHERE campus = ? AND fecha = ?
     ORDER BY id DESC
     LIMIT 20`,
    [campus, now.fecha]
  );
}

async function getLastProfileByRun(runValue) {
  return get(
    `SELECT nombre, carrera, jornada, anio_ingreso
     FROM attendance_records
     WHERE run = ?
     ORDER BY id DESC
     LIMIT 1`,
    [runValue]
  );
}

async function getStudentFromMatrixByRun(runValue) {
  if (!runValue) {
    return null;
  }

  const db = getDb();
  if (!tableExists(db, 'matriz_estudiantes')) {
    return null;
  }

  const matrixColumns = all('PRAGMA table_info(matriz_estudiantes)');
  const columnNames = new Set(matrixColumns.map((column) => column.name));

  const selectedColumns = [
    'rut',
    'dv',
    'carrera_ingreso',
    'cohorte',
    'emplazamiento'
  ];

  if (columnNames.has('nombre')) selectedColumns.push('nombre');
  if (columnNames.has('nombres')) selectedColumns.push('nombres');
  if (columnNames.has('nombre_completo')) selectedColumns.push('nombre_completo');
  if (columnNames.has('primer_apellido')) selectedColumns.push('primer_apellido');

  return get(
    `SELECT ${selectedColumns.join(', ')}
     FROM matriz_estudiantes
     WHERE rut = ?
     LIMIT 1`,
    [runValue]
  );
}

async function getAutocompleteProfileByRun(runValue, allowedCarreras = []) {
  const matrixStudent = await getStudentFromMatrixByRun(runValue);

  if (matrixStudent) {
    return {
      source: 'matriz_estudiantes',
      profile: {
        run: String(matrixStudent.rut || ''),
        dv: String(matrixStudent.dv || '').toUpperCase(),
        nombre: pickMatrixNombre(matrixStudent),
        carrera: mapMatrixCarrera(matrixStudent.carrera_ingreso, allowedCarreras),
        jornada: '',
        anio_ingreso: mapMatrixCohorteToAnioIngreso(matrixStudent.cohorte),
        cohorte: matrixStudent.cohorte,
        campus_referencia: matrixStudent.emplazamiento || ''
      }
    };
  }

  const fallbackProfile = await getLastProfileByRun(runValue);

  return {
    source: 'attendance_records',
    profile: fallbackProfile
      ? { ...fallbackProfile, jornada: mapJornadaValue(fallbackProfile.jornada) }
      : null
  };
}


async function getTodayCampusRecords(campus) {
  const now = getCurrentDateTimeParts();
  return all(
    `SELECT campus, fecha, run, dv, nombre, carrera, jornada, anio_ingreso, actividad, tematica, espacio, observaciones,
            hora_entrada, hora_salida, estado, duracion_minutos, created_at
     FROM attendance_records
     WHERE campus = ? AND fecha = ?
     ORDER BY id ASC`,
    [campus, now.fecha]
  );
}

async function getHistoricRecords() {
  return all(
    `SELECT id, campus, fecha, run, dv, nombre, carrera, jornada, anio_ingreso, actividad, tematica, espacio, observaciones,
            hora_entrada, hora_salida, estado, duracion_minutos, created_at
     FROM attendance_records
     ORDER BY fecha ASC, hora_entrada ASC, id ASC`
  );
}

module.exports = {
  registerAttendance,
  closeOpenRecordById,
  getLatestTodayRecords,
  getLastProfileByRun,
  getStudentFromMatrixByRun,
  getAutocompleteProfileByRun,
  getTodayCampusRecords,
  getHistoricRecords
};
