const fs = require('fs');
const path = require('path');
const xlsx = require('xlsx');

function sanitizeCampus(campus) {
  return String(campus || 'campus').trim().toLowerCase().replace(/\s+/g, '_');
}

function exportToExcel({ campus, fecha, records }) {
  const workbook = xlsx.utils.book_new();
  const sheetRows = records.map((item) => ({
    campus: item.campus,
    fecha: item.fecha,
    run: item.run,
    dv: item.dv,
    carrera: item.carrera,
    jornada: item.jornada,
    anio_ingreso: item.anio_ingreso,
    actividad: item.actividad,
    tematica: item.tematica,
    observaciones: item.observaciones,
    hora_entrada: item.hora_entrada,
    hora_salida: item.hora_salida,
    estado: item.estado,
    duracion_minutos: item.duracion_minutos,
    created_at: item.created_at
  }));

  const worksheet = xlsx.utils.json_to_sheet(sheetRows);
  xlsx.utils.book_append_sheet(workbook, worksheet, 'Registros');

  const filename = `registro_ciac_${sanitizeCampus(campus)}_${fecha}.xlsx`;
  const outputDir = path.join(__dirname, '..', '..', 'data');

  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  const outputPath = path.join(outputDir, filename);
  xlsx.writeFile(workbook, outputPath);

  return {
    filename,
    outputPath
  };
}

module.exports = {
  exportToExcel
};
