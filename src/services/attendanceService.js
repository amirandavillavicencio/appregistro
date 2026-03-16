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
        campus, fecha, run, dv, carrera, jornada, anio_ingreso, actividad, tematica, observaciones,
        hora_entrada, hora_salida, estado, duracion_minutos, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NULL, ?, NULL, ?)`,
      [
        payload.campus,
        now.fecha,
        payload.run,
        payload.dv,
        payload.carrera,
        payload.jornada,
        payload.anioIngreso,
        payload.actividad,
        payload.tematica,
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

async function getLatestTodayRecords(campus) {
  const now = getCurrentDateTimeParts();
  return all(
    `SELECT hora_entrada, hora_salida, run, carrera, actividad, estado
     FROM attendance_records
     WHERE campus = ? AND fecha = ?
     ORDER BY id DESC
     LIMIT 20`,
    [campus, now.fecha]
  );
}

async function getLastProfileByRun(runValue) {
  return get(
    `SELECT carrera, jornada, anio_ingreso
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

  return get(
    `SELECT rut, dv, carrera_ingreso, cohorte, emplazamiento
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
        carrera: mapMatrixCarrera(matrixStudent.carrera_ingreso, allowedCarreras),
        jornada: '',
        anio_ingreso: mapMatrixCohorteToAnioIngreso(matrixStudent.cohorte),
        campus_referencia: matrixStudent.emplazamiento || ''
      }
    };
  }

  const fallbackProfile = await getLastProfileByRun(runValue);

  return {
    source: 'attendance_records',
    profile: fallbackProfile
  };
}

async function getTodayCampusRecords(campus) {
  const now = getCurrentDateTimeParts();
  return all(
    `SELECT campus, fecha, run, dv, carrera, jornada, anio_ingreso, actividad, tematica, observaciones,
            hora_entrada, hora_salida, estado, duracion_minutos, created_at
     FROM attendance_records
     WHERE campus = ? AND fecha = ?
     ORDER BY id ASC`,
    [campus, now.fecha]
  );
}

module.exports = {
  registerAttendance,
  getLatestTodayRecords,
  getLastProfileByRun,
  getStudentFromMatrixByRun,
  getAutocompleteProfileByRun,
  getTodayCampusRecords
};
