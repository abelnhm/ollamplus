import { createServer } from "./src/server.js";

const PORT = process.env.PORT || 3000;
createServer(PORT);
