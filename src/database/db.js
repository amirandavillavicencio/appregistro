const { app } = require('electron');
const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs');

function getDatabasePath() {
  const userDataPath = app.getPath('userData');
  if (!fs.existsSync(userDataPath)) {
    fs.mkdirSync(userDataPath, { recursive: true });
  }
  return path.join(userDataPath, 'ciac-registro.db');
}

const dbPath = getDatabasePath();
const db = new Database(dbPath);

db.exec(`
  CREATE TABLE IF NOT EXISTS attendance_records (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    campus TEXT NOT NULL,
    fecha TEXT NOT NULL,
    run TEXT NOT NULL,
    dv TEXT NOT NULL,
    carrera TEXT,
    jornada TEXT,
    anio_ingreso TEXT,
    actividad TEXT,
    tematica TEXT,
    observaciones TEXT,
    hora_entrada TEXT,
    hora_salida TEXT,
    estado TEXT,
    duracion_minutos INTEGER,
    created_at TEXT NOT NULL
  );

  CREATE INDEX IF NOT EXISTS idx_attendance_run ON attendance_records(run);
  CREATE INDEX IF NOT EXISTS idx_attendance_fecha ON attendance_records(fecha);
`);

module.exports = db;
