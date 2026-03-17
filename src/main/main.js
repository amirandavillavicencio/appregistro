const path = require('path');
const { app, BrowserWindow, ipcMain } = require('electron');

const { initDb } = require('../database/db');
const { validateRunDv } = require('../utils/validation');
const { parseScannedInput } = require('../utils/scanner');
const {
  registerAttendance,
  closeOpenRecordById,
  getLatestTodayRecords,
  getAutocompleteProfileByRun,
  getHistoricRecords
} = require('../services/attendanceService');
const {
  registerTutorAttendance,
  closeOpenTutorRecordById,
  getLatestTodayTutorRecords,
  getTutorProfileByRun
} = require('../services/tutorAttendanceService');
const { exportToExcel, exportTutorsToExcel } = require('../services/exportService');
const { getReportSummary } = require('../services/reportService');

const CARRERAS_SAN_JOAQUIN = [
  'Plan Común de Ingenierías y Licenciaturas',
  'Ingeniería Civil',
  'Ingeniería Civil Eléctrica',
  'Ingeniería Civil Informática',
  'Ingeniería Civil Mecánica',
  'Ingeniería Civil de Minas',
  'Ingeniería Civil Química',
  'Ingeniería Civil Matemática',
  'Ingeniería Civil Telemática',
  'Ingeniería Civil Física',
  'Licenciatura en Astrofísica',
  'Licenciatura en Física',
  'Ingeniería en Diseño de Productos',
  'Técnico Universitario en Construcción',
  'Técnico Universitario en Control de Alimentos',
  'Técnico Universitario en Control del Medio Ambiente',
  'Técnico Universitario en Electricidad',
  'Técnico Universitario en Electrónica',
  'Técnico Universitario en Energías Renovables',
  'Técnico Universitario en Mantenimiento Industrial',
  'Técnico Universitario en Mecánica Automotriz',
  'Técnico Universitario en Mecánica Industrial',
  'Técnico Universitario en Informática',
  'Técnico Universitario en Proyectos de Ingeniería',
  'Técnico Universitario en Telecomunicaciones y Redes',
  'Técnico Universitario en Minería y Metalurgia',
  'Técnico Universitario en Química (mención Química Analítica)',
  'Técnico Universitario en Matricería para plásticos y metales',
  'Técnico Universitario en Prevención de Riesgos'
];

const ACTIVIDADES_PERMITIDAS = [
  'Estudio Personal',
  'Consultas',
  'Psicoeducativo Grupal',
  'Psicoeducativo Individual'
];

const TIPOS_TUTOR_PERMITIDOS = [
  'Tutor de Consultas',
  'Tutor de Reforzamiento',
  'Tutor Psicoeducativo',
  'Administrativo',
  'Coordinación',
  'Otro'
];


const JORNADAS_PERMITIDAS = ['Diurno', 'Vespertino'];

function normalizeJornada(value) {
  const normalized = String(value || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim();

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

const ESPACIOS_POR_CAMPUS = {
  'Campus Vitacura': ['Espacio Común CIAC'],
  'Campus San Joaquín': ['Sala 1', 'Sala 2', 'Sala 3', 'Sala 4', 'Sala 5', 'Sala 6', 'Espacio Común CIAC']
};

function buildAniosIngresoPermitidos() {
  const currentYear = new Date().getFullYear();
  const years = [];

  for (let year = 2020; year <= currentYear; year += 1) {
    years.push(String(year));
  }

  return years;
}

function normalizeSelectValue(value, allowedValues) {
  const normalized = String(value || '');
  if (!normalized) {
    return '';
  }

  return allowedValues.includes(normalized) ? normalized : '';
}

function createWindow() {
  const mainWindow = new BrowserWindow({
    width: 1200,
    height: 860,
    webPreferences: {
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.js')
    }
  });

  mainWindow.loadFile(path.join(__dirname, '..', 'renderer', 'index.html'));
}

function createReportWindow() {
  const reportWindow = new BrowserWindow({
    width: 1100,
    height: 780,
    title: 'Informe de uso CIAC',
    webPreferences: {
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.js')
    }
  });

  reportWindow.loadFile(path.join(__dirname, '..', 'renderer', 'report.html'));
}

ipcMain.handle('attendance:register', async (_event, payload) => {
  const validation = validateRunDv(payload.run, payload.dv);

  if (!validation.valid) {
    return { ok: false, message: validation.message };
  }

  const aniosIngresoPermitidos = buildAniosIngresoPermitidos();
  const espaciosPermitidos = ESPACIOS_POR_CAMPUS[payload.campus] || [];

  const result = await registerAttendance({
    campus: payload.campus,
    run: validation.run,
    dv: validation.dv,
    nombre: String(payload.nombre || '').trim(),
    carrera: normalizeSelectValue(payload.carrera, CARRERAS_SAN_JOAQUIN),
    jornada: normalizeSelectValue(normalizeJornada(payload.jornada), JORNADAS_PERMITIDAS),
    anioIngreso: normalizeSelectValue(payload.anioIngreso, aniosIngresoPermitidos),
    actividad: normalizeSelectValue(payload.actividad, ACTIVIDADES_PERMITIDAS),
    tematica: payload.tematica || '',
    espacio: normalizeSelectValue(payload.espacio, espaciosPermitidos),
    observaciones: payload.observaciones || ''
  });

  return { ok: true, ...result };
});

ipcMain.handle('attendance:list-today', async (_event, campus) => {
  const records = await getLatestTodayRecords(campus);
  return { ok: true, records };
});

ipcMain.handle('attendance:close-open-record', async (_event, payload) => {
  const recordId = Number(payload.recordId);

  if (!payload.campus || !Number.isInteger(recordId) || recordId <= 0) {
    return { ok: false, message: 'Solicitud inválida para cierre manual.' };
  }

  return closeOpenRecordById(payload.campus, recordId);
});

ipcMain.handle('attendance:profile-by-run', async (_event, runValue) => {
  const result = await getAutocompleteProfileByRun(runValue, CARRERAS_SAN_JOAQUIN);
  return { ok: true, ...result };
});

ipcMain.handle('tutor-attendance:register', async (_event, payload) => {
  const validation = validateRunDv(payload.run, payload.dv);

  if (!validation.valid) {
    return { ok: false, message: validation.message };
  }

  const result = await registerTutorAttendance({
    campus: payload.campus,
    run: validation.run,
    dv: validation.dv,
    nombre: payload.nombre || '',
    tipo: normalizeSelectValue(payload.tipo, TIPOS_TUTOR_PERMITIDOS),
    observaciones: payload.observaciones || ''
  });

  return { ok: true, ...result };
});

ipcMain.handle('tutor-attendance:list-today', async (_event, campus) => {
  const records = await getLatestTodayTutorRecords(campus);
  return { ok: true, records };
});

ipcMain.handle('tutor-attendance:close-open-record', async (_event, payload) => {
  const recordId = Number(payload.recordId);

  if (!payload.campus || !Number.isInteger(recordId) || recordId <= 0) {
    return { ok: false, message: 'Solicitud inválida para cierre manual.' };
  }

  return closeOpenTutorRecordById(payload.campus, recordId);
});

ipcMain.handle('tutor-attendance:profile-by-run', async (_event, runValue) => {
  const profile = await getTutorProfileByRun(runValue);
  return { ok: true, profile };
});

ipcMain.handle('scanner:parse', async (_event, rawInput) => parseScannedInput(rawInput));

ipcMain.handle('attendance:export-historic', async () => {
  try {
    const records = await getHistoricRecords();
    const output = exportToExcel({ records });

    return {
      ok: true,
      message: `Archivo Excel histórico exportado: ${output.filename}`,
      ...output
    };
  } catch (error) {
    console.error('[Export] Error exportando Excel:', error);
    return {
      ok: false,
      message: 'No fue posible exportar el archivo Excel. Intente nuevamente.'
    };
  }
});

ipcMain.handle('tutor-attendance:export-historic', async () => {
  try {
    const output = await exportTutorsToExcel();

    return {
      ok: true,
      message: `Archivo Excel de tutores exportado: ${output.filename}`,
      ...output
    };
  } catch (error) {
    console.error('[Export] Error exportando Excel de tutores:', error);
    return {
      ok: false,
      message: 'No fue posible exportar el archivo Excel de tutores. Intente nuevamente.'
    };
  }
});

ipcMain.handle('report:open-window', async () => {
  createReportWindow();
  return { ok: true };
});

ipcMain.handle('report:get-summary', async () => {
  try {
    const summary = await getReportSummary();
    return { ok: true, summary };
  } catch (error) {
    console.error('[Report] Error generando informe:', error);
    return { ok: false, message: 'No fue posible cargar el informe.' };
  }
});

app.whenReady().then(async () => {
  await initDb();
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});
