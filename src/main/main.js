const path = require('path');
const { app, BrowserWindow, ipcMain } = require('electron');

const { initDb } = require('../database/db');
const { getCurrentDateTimeParts } = require('../utils/dateUtils');
const { validateRunDv } = require('../utils/validation');
const { parseScannedInput } = require('../utils/scanner');
const {
  registerAttendance,
  getLatestTodayRecords,
  getLastProfileByRun,
  getTodayCampusRecords
} = require('../services/attendanceService');
const { exportToExcel } = require('../services/exportService');

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

  const result = await registerAttendance({
    campus: payload.campus,
    run: validation.run,
    dv: validation.dv,
    carrera: payload.carrera || '',
    jornada: payload.jornada || '',
    anioIngreso: payload.anioIngreso || '',
    actividad: payload.actividad || '',
    tematica: payload.tematica || '',
    observaciones: payload.observaciones || ''
  });

  return { ok: true, ...result };
});

ipcMain.handle('attendance:list-today', async (_event, campus) => {
  const records = await getLatestTodayRecords(campus);
  return { ok: true, records };
});

ipcMain.handle('attendance:profile-by-run', async (_event, runValue) => {
  const profile = await getLastProfileByRun(runValue);
  return { ok: true, profile };
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
