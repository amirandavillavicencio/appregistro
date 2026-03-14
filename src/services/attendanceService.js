const { all, get, run } = require('../database/db');
const { getCurrentDateTimeParts, getDurationMinutes } = require('../utils/dateUtils');

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
  getTodayCampusRecords
};
