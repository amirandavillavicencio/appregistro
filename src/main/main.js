const path = require('path');
const { app, BrowserWindow, ipcMain } = require('electron');

const { initDb } = require('../database/db');
const { getCurrentDateTimeParts } = require('../utils/dateUtils');
const { validateRunDv } = require('../utils/validation');
const { parseScannedInput } = require('../utils/scanner');
const {
  registerAttendance,
  closeOpenRecordById,
  getLatestTodayRecords,
  getAutocompleteProfileByRun,
  getTodayCampusRecords
} = require('../services/attendanceService');
const { exportToExcel } = require('../services/exportService');

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

ipcMain.handle('attendance:register', async (_event, payload) => {
  const validation = validateRunDv(payload.run, payload.dv);

  if (!validation.valid) {
    return { ok: false, message: validation.message };
  }

  const aniosIngresoPermitidos = buildAniosIngresoPermitidos();

  const result = await registerAttendance({
    campus: payload.campus,
    run: validation.run,
    dv: validation.dv,
    carrera: normalizeSelectValue(payload.carrera, CARRERAS_SAN_JOAQUIN),
    jornada: payload.jornada || '',
    anioIngreso: normalizeSelectValue(payload.anioIngreso, aniosIngresoPermitidos),
    actividad: normalizeSelectValue(payload.actividad, ACTIVIDADES_PERMITIDAS),
    tematica: payload.tematica || '',
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

ipcMain.handle('scanner:parse', async (_event, rawInput) => parseScannedInput(rawInput));

ipcMain.handle('attendance:export-today', async (_event, campus) => {
  const records = await getTodayCampusRecords(campus);
  const { fecha } = getCurrentDateTimeParts();

  const output = exportToExcel({
    campus,
    fecha,
    records
  });

  return {
    ok: true,
    message: `Archivo Excel exportado: ${output.filename}`,
    ...output
  };
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
