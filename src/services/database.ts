import Database, { type Database as DatabaseType } from "better-sqlite3";
import { fileURLToPath } from "url";
import { dirname, join } from "path";
import { mkdirSync } from "fs";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const dataDir = join(__dirname, "..", "..", "data");
mkdirSync(dataDir, { recursive: true });

const dbPath = join(dataDir, "ollama.db");

const database = new Database(dbPath);
export const db: DatabaseType = database;

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

export interface AppConfigRow {
  key: string;
  value: string;
  updated_at: string;
}

export interface ChatRow {
  id: string;
  title: string;
  model: string;
  instructions: string;
  parameters: string;
  model_info: string;
  created_at: string;
  last_message_at: string;
  pinned: number;
}

export interface MessageRow {
  id: string;
  chat_id: string;
  role: string;
  content: string;
  timestamp: string;
  token_count: number | null;
  duration_ms: number | null;
  tokens_per_second: number | null;
}
