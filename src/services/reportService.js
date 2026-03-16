const { all, get } = require('../database/db');

function toNumber(value) {
  const number = Number(value);
  return Number.isFinite(number) ? number : 0;
}

function formatHours(minutes) {
  const safeMinutes = Math.max(0, toNumber(minutes));
  return Number((safeMinutes / 60).toFixed(2));
}

function buildSemestreEstimado(anioIngreso) {
  const year = Number(String(anioIngreso || '').replace(/[^0-9]/g, '').slice(0, 4));
  const currentYear = new Date().getFullYear();

  if (!Number.isInteger(year) || year < 1900 || year > currentYear + 1) {
    return null;
  }

  const currentMonth = new Date().getMonth() + 1;
  const semestreActual = currentMonth <= 6 ? 1 : 2;
  const semestreEstimado = ((currentYear - year) * 2) + semestreActual;

  if (!Number.isInteger(semestreEstimado) || semestreEstimado < 1) {
    return null;
  }

  return semestreEstimado;
}

async function getReportSummary() {
  const kpis = get(
    `SELECT
      COUNT(*) AS total_registros,
      COALESCE(SUM(CASE WHEN duracion_minutos IS NULL OR duracion_minutos < 0 THEN 0 ELSE duracion_minutos END), 0) AS minutos_acumulados,
      COALESCE(AVG(CASE WHEN duracion_minutos IS NULL OR duracion_minutos < 0 THEN NULL ELSE duracion_minutos END), 0) AS promedio_minutos,
      COUNT(DISTINCT CASE WHEN TRIM(COALESCE(carrera, '')) <> '' THEN carrera END) AS carreras_distintas
    FROM attendance_records`
  );

  const usoPorActividad = all(
    `SELECT CASE WHEN TRIM(COALESCE(actividad, '')) = '' THEN 'Sin actividad' ELSE actividad END AS label,
            COUNT(*) AS registros
     FROM attendance_records
     GROUP BY label
     ORDER BY registros DESC, label ASC`
  );

  const usoPorTematica = all(
    `SELECT CASE WHEN TRIM(COALESCE(tematica, '')) = '' THEN 'Sin temática' ELSE tematica END AS label,
            COUNT(*) AS registros
     FROM attendance_records
     GROUP BY label
     ORDER BY registros DESC, label ASC`
  );

  const topCarreras = all(
    `SELECT CASE WHEN TRIM(COALESCE(carrera, '')) = '' THEN 'Sin carrera' ELSE carrera END AS carrera,
            COUNT(*) AS registros
     FROM attendance_records
     GROUP BY carrera
     ORDER BY registros DESC, carrera ASC
     LIMIT 5`
  );

  const usoPorCampus = all(
    `SELECT CASE WHEN TRIM(COALESCE(campus, '')) = '' THEN 'Sin sede' ELSE campus END AS label,
            COUNT(*) AS registros
     FROM attendance_records
     GROUP BY label
     ORDER BY registros DESC, label ASC`
  );

  const semestreRows = all(
    `SELECT anio_ingreso
     FROM attendance_records`
  );

  const semestreMap = new Map();
  semestreRows.forEach((row) => {
    const key = buildSemestreEstimado(row.anio_ingreso);
    if (!key) {
      return;
    }

    semestreMap.set(key, (semestreMap.get(key) || 0) + 1);
  });

  const distribucionSemestre = Array.from(semestreMap.entries())
    .map(([semestre, registros]) => ({
      semestre,
      label: `Semestre ${semestre}`,
      registros
    }))
    .sort((a, b) => a.semestre - b.semestre);

  const tablaCarreras = all(
    `SELECT
      CASE WHEN TRIM(COALESCE(carrera, '')) = '' THEN 'Sin carrera' ELSE carrera END AS carrera,
      COUNT(*) AS registros,
      COALESCE(SUM(CASE WHEN duracion_minutos IS NULL OR duracion_minutos < 0 THEN 0 ELSE duracion_minutos END), 0) AS minutos_acumulados,
      COALESCE(AVG(CASE WHEN duracion_minutos IS NULL OR duracion_minutos < 0 THEN NULL ELSE duracion_minutos END), 0) AS promedio_minutos
    FROM attendance_records
    GROUP BY carrera
    ORDER BY registros DESC, carrera ASC`
  ).map((row) => ({
    carrera: row.carrera,
    registros: toNumber(row.registros),
    horas_acumuladas: formatHours(row.minutos_acumulados),
    promedio_duracion: Number(toNumber(row.promedio_minutos).toFixed(2))
  }));

  return {
    kpis: {
      totalRegistros: toNumber(kpis?.total_registros),
      totalHorasAcumuladas: formatHours(kpis?.minutos_acumulados),
      promedioDuracionMinutos: Number(toNumber(kpis?.promedio_minutos).toFixed(2)),
      carrerasDistintas: toNumber(kpis?.carreras_distintas)
    },
    usoPorActividad: usoPorActividad.map((row) => ({ label: row.label, registros: toNumber(row.registros) })),
    usoPorTematica: usoPorTematica.map((row) => ({ label: row.label, registros: toNumber(row.registros) })),
    topCarreras: topCarreras.map((row) => ({ carrera: row.carrera, registros: toNumber(row.registros) })),
    usoPorCampus: usoPorCampus.map((row) => ({ label: row.label, registros: toNumber(row.registros) })),
    distribucionSemestre,
    tablaCarreras
  };
}

module.exports = {
  getReportSummary
};
