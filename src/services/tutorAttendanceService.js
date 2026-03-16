const { all, get, run } = require('../database/db');
const { getCurrentDateTimeParts, getDurationMinutes } = require('../utils/dateUtils');

async function findOpenTutorRecord(campus, runValue) {
  return get(
    `SELECT * FROM tutor_attendance_records
     WHERE campus = ? AND run = ? AND fecha = ? AND hora_entrada IS NOT NULL AND (hora_salida IS NULL OR hora_salida = '')
     ORDER BY id DESC LIMIT 1`,
    [campus, runValue, getCurrentDateTimeParts().fecha]
  );
}

async function registerTutorAttendance(payload) {
  const now = getCurrentDateTimeParts();
  const existingOpen = await findOpenTutorRecord(payload.campus, payload.run);

  if (!existingOpen) {
    const result = await run(
      `INSERT INTO tutor_attendance_records (
        campus, fecha, run, dv, nombre, tipo, observaciones,
        hora_entrada, hora_salida, estado, duracion_minutos, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, NULL, ?, NULL, ?)`,
      [
        payload.campus,
        now.fecha,
        payload.run,
        payload.dv,
        payload.nombre,
        payload.tipo,
        payload.observaciones,
        now.hora,
        'abierto',
        now.iso
      ]
    );

    return {
      type: 'entrada',
      message: `Entrada de tutor registrada correctamente (${now.hora}).`,
      recordId: result.id
    };
  }

  const duration = getDurationMinutes(existingOpen.hora_entrada, now.hora);

  await run(
    `UPDATE tutor_attendance_records
     SET hora_salida = ?, estado = ?, duracion_minutos = ?,
         nombre = CASE WHEN nombre = '' THEN ? ELSE nombre END,
         tipo = CASE WHEN tipo = '' THEN ? ELSE tipo END,
         observaciones = CASE WHEN observaciones = '' THEN ? ELSE observaciones END
     WHERE id = ?`,
    [now.hora, 'cerrado', duration, payload.nombre, payload.tipo, payload.observaciones, existingOpen.id]
  );

  return {
    type: 'salida',
    message: `Salida de tutor registrada correctamente (${now.hora}).`,
    recordId: existingOpen.id
  };
}

async function closeOpenTutorRecordById(campus, recordId) {
  const now = getCurrentDateTimeParts();

  const openRecord = await get(
    `SELECT id, hora_entrada, run
     FROM tutor_attendance_records
     WHERE id = ? AND campus = ? AND hora_entrada IS NOT NULL AND (hora_salida IS NULL OR hora_salida = '')
     LIMIT 1`,
    [recordId, campus]
  );

  if (!openRecord) {
    return {
      ok: false,
      message: 'No se encontró un registro de tutor abierto para cerrar.'
    };
  }

  const duration = getDurationMinutes(openRecord.hora_entrada, now.hora);

  await run(
    `UPDATE tutor_attendance_records
     SET hora_salida = ?, estado = ?, duracion_minutos = ?
     WHERE id = ?`,
    [now.hora, 'cerrado', duration, openRecord.id]
  );

  return {
    ok: true,
    type: 'salida_manual',
    message: `Salida registrada correctamente para tutor RUN ${openRecord.run} (${now.hora}).`,
    recordId: openRecord.id
  };
}

async function getLatestTodayTutorRecords(campus) {
  const now = getCurrentDateTimeParts();
  return all(
    `SELECT id, hora_entrada, hora_salida, run, nombre, tipo, estado
     FROM tutor_attendance_records
     WHERE campus = ? AND fecha = ?
     ORDER BY id DESC
     LIMIT 20`,
    [campus, now.fecha]
  );
}

async function getTutorProfileByRun(runValue) {
  return get(
    `SELECT nombre, tipo, dv
     FROM tutor_attendance_records
     WHERE run = ?
     ORDER BY id DESC
     LIMIT 1`,
    [runValue]
  );
}

async function getHistoricTutorRecords() {
  return all(
    `SELECT id, campus, fecha, run, dv, nombre, tipo, observaciones,
            hora_entrada, hora_salida, estado, duracion_minutos, created_at
     FROM tutor_attendance_records
     ORDER BY fecha ASC, hora_entrada ASC, id ASC`
  );
}

module.exports = {
  registerTutorAttendance,
  closeOpenTutorRecordById,
  getLatestTodayTutorRecords,
  getTutorProfileByRun,
  getHistoricTutorRecords
};
