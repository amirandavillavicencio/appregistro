const fs = require('fs');
const path = require('path');
const sqlite3 = require('sqlite3').verbose();

const dataDir = path.join(__dirname, '..', '..', 'data');
const dbPath = path.join(dataDir, 'ciac_registro.db');

if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

const db = new sqlite3.Database(dbPath);

function run(sql, params = []) {
  return new Promise((resolve, reject) => {
    db.run(sql, params, function onRun(err) {
      if (err) {
        reject(err);
        return;
      }
      resolve({ id: this.lastID, changes: this.changes });
    });
  });
}

function get(sql, params = []) {
  return new Promise((resolve, reject) => {
    db.get(sql, params, (err, row) => {
      if (err) {
        reject(err);
        return;
      }
      resolve(row);
    });
  });
}

function all(sql, params = []) {
  return new Promise((resolve, reject) => {
    db.all(sql, params, (err, rows) => {
      if (err) {
        reject(err);
        return;
      }
      resolve(rows);
    });
  });
}

async function initDb() {
  await run(`
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
      estado TEXT NOT NULL,
      duracion_minutos INTEGER,
      created_at TEXT NOT NULL
    )
  `);

  await run('CREATE INDEX IF NOT EXISTS idx_attendance_run ON attendance_records(run)');
  await run('CREATE INDEX IF NOT EXISTS idx_attendance_fecha ON attendance_records(fecha)');
}

module.exports = {
  dbPath,
  initDb,
  run,
  get,
  all
};
