import { config } from "dotenv";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

config({ path: join(__dirname, "..", "..", ".env") });

export const config_ = {
  port: parseInt(process.env.PORT || "3000", 10),
  ollamaHost: process.env.OLLAMA_HOST || "http://localhost:11434",
  dbPath: process.env.DB_PATH || "./data/ollama.db",
  nodeEnv: process.env.NODE_ENV || "development",
  logLevel: process.env.LOG_LEVEL || "info",
};
