const { app } = require('electron');
const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs');

let dbInstance = null;

function tableExists(db, tableName) {
  const row = db
    .prepare("SELECT name FROM sqlite_master WHERE type = 'table' AND name = ? LIMIT 1")
    .get(tableName);
  return Boolean(row);
}

function resolveMatrixSqlPath() {
  const candidates = [
    path.join(app.getAppPath(), 'data', 'matriz_estudiantes.sql'),
    path.join(process.cwd(), 'data', 'matriz_estudiantes.sql'),
    path.join(__dirname, '..', '..', 'data', 'matriz_estudiantes.sql')
  ];

  return candidates.find((candidatePath) => fs.existsSync(candidatePath));
}

function importMatrixIfMissing(db) {
  if (tableExists(db, 'matriz_estudiantes')) {
    return;
  }

  const matrixSqlPath = resolveMatrixSqlPath();

  if (!matrixSqlPath) {
    console.warn('[DB] No se encontró data/matriz_estudiantes.sql. Se mantiene autocompletado por fallback.');
    return;
  }

  try {
    const matrixSql = fs.readFileSync(matrixSqlPath, 'utf8');
    if (!matrixSql.trim()) {
      console.warn('[DB] data/matriz_estudiantes.sql está vacío. Se omite importación.');
      return;
    }

    db.exec('BEGIN');
    db.exec(matrixSql);
    db.exec('CREATE INDEX IF NOT EXISTS idx_matriz_rut ON matriz_estudiantes(rut);');
    db.exec('COMMIT');
    console.info('[DB] Matriz de estudiantes importada en base local SQLite.');
  } catch (error) {
    try {
      db.exec('ROLLBACK');
    } catch (_rollbackError) {
      // no-op
    }
    console.error('[DB] Error importando matriz_estudiantes:', error);
  }
}

function getDatabasePath() {
  const userDataPath = app.getPath('userData');

  if (!fs.existsSync(userDataPath)) {
    fs.mkdirSync(userDataPath, { recursive: true });
  }

  return path.join(userDataPath, 'ciac-registro.db');
}

function initDb() {
  if (dbInstance) {
    return dbInstance;
  }

  const dbPath = getDatabasePath();
  dbInstance = new Database(dbPath);

  dbInstance.exec(`
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

  importMatrixIfMissing(dbInstance);

  return dbInstance;
}

function getDb() {
  if (!dbInstance) {
    return initDb();
  }

  return dbInstance;
}

function normalizeParams(params = []) {
  if (Array.isArray(params)) {
    return params;
  }
  return [params];
}

function all(sql, params = []) {
  const db = getDb();
  const stmt = db.prepare(sql);
  return stmt.all(...normalizeParams(params));
}

function get(sql, params = []) {
  const db = getDb();
  const stmt = db.prepare(sql);
  return stmt.get(...normalizeParams(params));
}

function run(sql, params = []) {
  const db = getDb();
  const stmt = db.prepare(sql);
  const result = stmt.run(...normalizeParams(params));

  return {
    id: result.lastInsertRowid,
    changes: result.changes
  };
}

module.exports = {
  initDb,
  getDb,
  all,
  get,
  run,
  tableExists
};
