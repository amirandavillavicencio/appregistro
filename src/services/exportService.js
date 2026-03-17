const fs = require('fs');
const path = require('path');
const xlsx = require('xlsx');

const { getHistoricTutorRecords } = require('./tutorAttendanceService');

function mapRecordToExcelRow(item) {
  const rawRun = String(item.run || '').trim();
  const normalizedDv = String(item.dv || '').trim().toUpperCase();
  const runWithoutDv = rawRun.replace(/\./g, '').replace(/[^0-9]/g, '');
  const espacioValue = item.espacio ?? item.ubicacion ?? item.lugar ?? '';

  return {
    Día: item.fecha || '',
    'Hora Entrada': item.hora_entrada || '',
    'Hora Salida': item.hora_salida || '',
    RUN: runWithoutDv,
    'Dígito V': normalizedDv,
    Nombre: item.nombre || '',
    Carrera: item.carrera || '',
    Sede: item.campus || '',
    'Año Ingreso': item.anio_ingreso || '',
    Jornada: item.jornada || '',
    Actividad: item.actividad || '',
    Temática: item.tematica || '',
    Espacio: espacioValue,
    Observaciones: item.observaciones || ''
  };
}

function mapTutorRecordToExcelRow(item) {
  const rawRun = String(item.run || '').trim();
  const normalizedDv = String(item.dv || '').trim().toUpperCase();
  const runWithoutDv = rawRun.replace(/\./g, '').replace(/[^0-9]/g, '');

  return {
    Día: item.fecha || '',
    'Hora Entrada': item.hora_entrada || '',
    'Hora Salida': item.hora_salida || '',
    RUN: runWithoutDv,
    'Dígito V': normalizedDv,
    Nombre: item.nombre || '',
    Tipo: item.tipo || '',
    Campus: item.campus || '',
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
    'Nombre',
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

function buildTutorsWorksheet(records = []) {
  const headers = [
    'Día',
    'Hora Entrada',
    'Hora Salida',
    'RUN',
    'Dígito V',
    'Nombre',
    'Tipo',
    'Campus',
    'Observaciones'
  ];

  const rows = records.map(mapTutorRecordToExcelRow);

  return xlsx.utils.json_to_sheet(rows, {
    header: headers,
    skipHeader: false
  });
}

function ensureOutputDir() {
  const outputDir = path.join(__dirname, '..', '..', 'data');

  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  return outputDir;
}

function exportToExcel({ records, outputDir }) {
  const workbook = xlsx.utils.book_new();
  const worksheet = buildMainWorksheet(records);
  xlsx.utils.book_append_sheet(workbook, worksheet, 'Histórico CIAC');

  const filename = 'registro_ciac_historico.xlsx';
  const targetDir = outputDir || ensureOutputDir();

  if (!fs.existsSync(targetDir)) {
    fs.mkdirSync(targetDir, { recursive: true });
  }

  const outputPath = path.join(targetDir, filename);
  xlsx.writeFile(workbook, outputPath);

  return {
    filename,
    outputPath
  };
}

async function exportTutorsToExcel() {
  const workbook = xlsx.utils.book_new();
  const tutorRecords = await getHistoricTutorRecords();
  const worksheet = buildTutorsWorksheet(tutorRecords);
  xlsx.utils.book_append_sheet(workbook, worksheet, 'Asistencia Tutores');

  const filename = 'registro_tutores_historico.xlsx';
  const outputPath = path.join(ensureOutputDir(), filename);
  xlsx.writeFile(workbook, outputPath);

  return {
    filename,
    outputPath
  };
}

module.exports = {
  exportToExcel,
  exportTutorsToExcel
};
