import { createServer } from "./src/server.js";

const PORT = Number(process.env.PORT) || 3000;
createServer(PORT);
