const fs = require('fs');
const path = require('path');
const xlsx = require('xlsx');

function mapRecordToExcelRow(item) {
  const rawRun = String(item.run || '').trim();
  const normalizedDv = String(item.dv || '').trim().toUpperCase();
  const runWithoutDv = rawRun.replace(/\./g, '').replace(/[^0-9]/g, '');

  return {
    Día: item.fecha || '',
    'Hora Entrada': item.hora_entrada || '',
    'Hora Salida': item.hora_salida || '',
    RUN: runWithoutDv,
    'Dígito V': normalizedDv,
    Carrera: item.carrera || '',
    Sede: item.campus || '',
    'Año Ingreso': item.anio_ingreso || '',
    Jornada: item.jornada || '',
    Actividad: item.actividad || '',
    Temática: item.tematica || '',
    Espacio: item.espacio || '',
    Observaciones: item.observaciones || ''
  };
}

function buildMainWorksheet(records = []) {
  const headers = [
    'Día',
    'Hora Entrada',
    'Hora Salida',
    'RUN',
    'Dígito V',
    'Carrera',
    'Sede',
    'Año Ingreso',
    'Jornada',
    'Actividad',
    'Temática',
    'Espacio',
    'Observaciones'
  ];

  const rows = records.map(mapRecordToExcelRow);

  return xlsx.utils.json_to_sheet(rows, {
    header: headers,
    skipHeader: false
  });
}

function exportToExcel({ records }) {
  const workbook = xlsx.utils.book_new();
  const worksheet = buildMainWorksheet(records);
  xlsx.utils.book_append_sheet(workbook, worksheet, 'Histórico CIAC');

  const filename = 'registro_ciac_historico.xlsx';
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
