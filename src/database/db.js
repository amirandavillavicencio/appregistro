const fs = require('fs');
const path = require('path');
const Database = require('better-sqlite3');

const dataDir = path.join(__dirname, '..', '..', 'data');
const dbPath = path.join(dataDir, 'ciac_registro.db');

if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

const db = new Database(dbPath);

function run(sql, params = []) {
  return Promise.resolve().then(() => {
    const stmt = db.prepare(sql);
    const result = stmt.run(...params);
    return { id: Number(result.lastInsertRowid), changes: result.changes };
  });
}

function get(sql, params = []) {
  return Promise.resolve().then(() => {
    const stmt = db.prepare(sql);
    return stmt.get(...params);
  });
}

function all(sql, params = []) {
  return Promise.resolve().then(() => {
    const stmt = db.prepare(sql);
    return stmt.all(...params);
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
