import { db } from "../services/database.js";

export interface Migration {
  name: string;
  up: () => void;
}

const migrations: Migration[] = [
  {
    name: "001_initial_schema",
    up: () => {
      db.exec(`
        CREATE TABLE IF NOT EXISTS app_config (
          key TEXT PRIMARY KEY,
          value TEXT NOT NULL,
          updated_at TEXT NOT NULL
        );

        CREATE TABLE IF NOT EXISTS chats (
          id TEXT PRIMARY KEY,
          title TEXT NOT NULL,
          model TEXT NOT NULL,
          instructions TEXT DEFAULT '',
          parameters TEXT DEFAULT '{}',
          model_info TEXT DEFAULT '{}',
          created_at TEXT NOT NULL,
          last_message_at TEXT NOT NULL,
          pinned INTEGER DEFAULT 0
        );

        CREATE TABLE IF NOT EXISTS messages (
          id TEXT PRIMARY KEY,
          chat_id TEXT NOT NULL,
          role TEXT NOT NULL,
          content TEXT NOT NULL,
          timestamp TEXT NOT NULL,
          token_count INTEGER,
          duration_ms INTEGER,
          tokens_per_second REAL,
          FOREIGN KEY (chat_id) REFERENCES chats(id) ON DELETE CASCADE
        );

        CREATE INDEX IF NOT EXISTS idx_messages_chat_id ON messages(chat_id);
        CREATE INDEX IF NOT EXISTS idx_chats_last_message_at ON chats(last_message_at);
      `);
    },
  },
];

export function runMigrations(): void {
  const tableExists = db
    .prepare("SELECT name FROM sqlite_master WHERE type='table' AND name='migrations'")
    .get();

  if (!tableExists) {
    db.exec(`
      CREATE TABLE migrations (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL UNIQUE,
        applied_at TEXT NOT NULL
      );
    `);
  }

  const appliedMigrations = db
    .prepare("SELECT name FROM migrations")
    .all() as { name: string }[];

  const appliedNames = new Set(appliedMigrations.map((m) => m.name));

  for (const migration of migrations) {
    if (!appliedNames.has(migration.name)) {
      console.log(`📦 Applying migration: ${migration.name}`);
      migration.up();
      db.prepare("INSERT INTO migrations (name, applied_at) VALUES (?, ?)").run(
        migration.name,
        new Date().toISOString(),
      );
      console.log(`✅ Migration applied: ${migration.name}`);
    }
  }
}
