import { DependencyContainer } from "./src/infrastructure/http/DependencyContainer.js";

const PORT = process.env.PORT || 3000;
const container = new DependencyContainer(PORT);
container.start();
