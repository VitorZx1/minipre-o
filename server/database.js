import Database from 'better-sqlite3';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

const appConfigDir = path.join(process.env.APPDATA || path.join(os.homedir(), '.config'), 'MiniPreco');
const configFile = path.join(appConfigDir, 'storage.json');
const defaultStorageDir = path.join(appConfigDir, 'dados');

const collections = ['products', 'suppliers', 'financeiro', 'users', 'compras', 'estoque', 'vendas', 'audit'];
let database;
let currentStorageDir;

function ensureDirectory(directory) {
  fs.mkdirSync(directory, { recursive: true });
}

function readConfig() {
  ensureDirectory(appConfigDir);
  try {
    const parsed = JSON.parse(fs.readFileSync(configFile, 'utf8'));
    return parsed.storageDirectory || defaultStorageDir;
  } catch {
    return defaultStorageDir;
  }
}

function writeConfig(storageDirectory) {
  ensureDirectory(appConfigDir);
  fs.writeFileSync(configFile, JSON.stringify({ storageDirectory }, null, 2));
}

function normalizeDate(value) {
  if (!value) return null;
  if (/^\d{4}-\d{2}-\d{2}/.test(value)) return value.slice(0, 10);
  const match = String(value).match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
  return match ? `${match[3]}-${match[2]}-${match[1]}` : null;
}

function recordDate(collection, record) {
  if (collection === 'audit') return normalizeDate(record.at);
  return normalizeDate(record.date || record.createdAt);
}

function createSchema(db) {
  db.pragma('journal_mode = WAL');
  db.pragma('foreign_keys = ON');
  db.exec(`
    CREATE TABLE IF NOT EXISTS schema_migrations (
      version INTEGER PRIMARY KEY,
      applied_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    );
    CREATE TABLE IF NOT EXISTS app_settings (
      key TEXT PRIMARY KEY,
      value TEXT NOT NULL,
      updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    );
  `);

  for (const table of collections) {
    db.exec(`
      CREATE TABLE IF NOT EXISTS ${table} (
        record_id TEXT PRIMARY KEY,
        event_date TEXT,
        payload TEXT NOT NULL,
        created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
      );
      CREATE INDEX IF NOT EXISTS idx_${table}_event_date ON ${table}(event_date);
      CREATE INDEX IF NOT EXISTS idx_${table}_updated_at ON ${table}(updated_at);
    `);
  }
  db.prepare('INSERT OR IGNORE INTO schema_migrations (version) VALUES (1)').run();
}

export function getDatabase() {
  if (!database) {
    currentStorageDir = readConfig();
    ensureDirectory(currentStorageDir);
    database = new Database(path.join(currentStorageDir, 'mini-preco.db'));
    createSchema(database);
  }
  return database;
}

export function getStorageInfo() {
  const db = getDatabase();
  const databasePath = path.join(currentStorageDir, 'mini-preco.db');
  const rowCounts = Object.fromEntries(collections.map(table => [
    table,
    db.prepare(`SELECT COUNT(*) AS total FROM ${table}`).get().total,
  ]));
  return {
    connected: true,
    storageDirectory: currentStorageDir,
    databasePath,
    databaseSize: fs.existsSync(databasePath) ? fs.statSync(databasePath).size : 0,
    rowCounts,
  };
}

export function changeStorageDirectory(requestedDirectory) {
  const resolved = path.resolve(requestedDirectory);
  ensureDirectory(resolved);
  fs.accessSync(resolved, fs.constants.R_OK | fs.constants.W_OK);

  const oldPath = path.join(currentStorageDir, 'mini-preco.db');
  const newPath = path.join(resolved, 'mini-preco.db');
  if (resolved === currentStorageDir) return getStorageInfo();

  database?.close();
  database = null;
  if (fs.existsSync(oldPath) && !fs.existsSync(newPath)) fs.copyFileSync(oldPath, newPath);
  writeConfig(resolved);
  currentStorageDir = resolved;
  database = new Database(newPath);
  createSchema(database);
  return getStorageInfo();
}

export function readCollection(collection, startDate, endDate) {
  if (!collections.includes(collection)) throw new Error('Coleção inválida');
  let sql = `SELECT payload FROM ${collection}`;
  const filters = [];
  const params = {};
  if (startDate) { filters.push('event_date >= @startDate'); params.startDate = startDate; }
  if (endDate) { filters.push('event_date <= @endDate'); params.endDate = endDate; }
  if (filters.length) sql += ` WHERE ${filters.join(' AND ')}`;
  sql += ' ORDER BY event_date DESC, updated_at DESC';
  return getDatabase().prepare(sql).all(params).map(row => JSON.parse(row.payload));
}

export function replaceCollection(collection, records) {
  if (!collections.includes(collection)) throw new Error('Coleção inválida');
  const db = getDatabase();
  const replace = db.prepare(`
    INSERT INTO ${collection} (record_id, event_date, payload, updated_at)
    VALUES (@id, @eventDate, @payload, CURRENT_TIMESTAMP)
    ON CONFLICT(record_id) DO UPDATE SET
      event_date = excluded.event_date,
      payload = excluded.payload,
      updated_at = CURRENT_TIMESTAMP
  `);
  const saveAll = db.transaction(items => {
    const ids = [];
    items.forEach((record, index) => {
      const id = String(record.id ?? record.login ?? `${collection}-${index}`);
      ids.push(id);
      replace.run({ id, eventDate: recordDate(collection, record), payload: JSON.stringify(record) });
    });
    if (!ids.length) db.prepare(`DELETE FROM ${collection}`).run();
    else {
      const placeholders = ids.map(() => '?').join(',');
      db.prepare(`DELETE FROM ${collection} WHERE record_id NOT IN (${placeholders})`).run(...ids);
    }
  });
  saveAll(records);
}

export function getSetting(key, fallback = null) {
  const row = getDatabase().prepare('SELECT value FROM app_settings WHERE key = ?').get(key);
  if (!row) return fallback;
  try { return JSON.parse(row.value); } catch { return row.value; }
}

export function setSetting(key, value) {
  getDatabase().prepare(`
    INSERT INTO app_settings (key, value, updated_at)
    VALUES (?, ?, CURRENT_TIMESTAMP)
    ON CONFLICT(key) DO UPDATE SET value = excluded.value, updated_at = CURRENT_TIMESTAMP
  `).run(key, JSON.stringify(value));
  return value;
}

export { collections };
