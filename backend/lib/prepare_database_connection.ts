import Database from 'better-sqlite3';

export function prepareDatabaseConnection(): Database.Database {
  const databaseFilePath = process.env.DATABASE_FILE_PATH ?? ':memory:';

  if (databaseFilePath === ':memory:') {
    console.warn('Database is stored in memory.');
  }

  const db = new Database(databaseFilePath);

  createTables(db);

  return db;
}

function createTables(db: Database.Database) {
  db.exec(`
    CREATE TABLE IF NOT EXISTS events(
      id TEXT PRIMARY KEY,
      device_id TEXT,
      event_kind TEXT,
      created_at INTEGER
    ) STRICT
  `);

  db.exec(`
    CREATE TABLE IF NOT EXISTS event_parameters(
      event_id TEXT,
      parameter_kind TEXT,
      value TEXT
    ) STRICT
  `);
}
