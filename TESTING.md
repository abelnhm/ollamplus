# Guía Completa de Testing

Este documento te enseña todo sobre testing en el proyecto OllamPlus, desde lo más básico hasta técnicas avanzadas.

## Tabla de Contenidos

1. [Fundamentos de Testing](#fundamentos-de-testing)
2. [Herramientas del Proyecto](#herramientas-del-proyecto)
3. [Estructura de Tests](#estructura-de-tests)
4. [Tipos de Tests en Este Proyecto](#tipos-de-tests-en-este-proyecto)
5. [Comandos Disponibles](#comandos-disponibles)
6. [Guía de Asserts](#guía-de-asserts)
7. [Ejemplos por Tipo de Test](#ejemplos-por-tipo-de-test)
8. [Conceptos Avanzados](#conceptos-avanzados)
9. [Mejores Prácticas](#mejores-prácticas)
10. [Recursos](#recursos)

---

## Fundamentos de Testing

### ¿Por qué hacer tests?

Los tests son fundamentales para:

- **Detectar errores antes de producción** - Los bugs se encuentran antes de que lleguen a producción
- **Documentar el código** - Los tests demuestran cómo se usa el código
- **Refactorizar con confianza** - Puedes cambiar código sabiendo que si los tests pasan, todo funciona
- **Colaboración** - Otros desarrolladores pueden entender tu código más fácilmente
- **CI/CD** - Automatizan la verificación de código en cada commit

### Conceptos Clave

#### Unit Tests (Tests Unitarios)

Prueban una sola función, clase o módulo de forma aislada. Son rápidos y no dependen de sistemas externos.

**Ejemplo**: Probar que `Chat.create()` genera un ID único

#### Integration Tests (Tests de Integración)

Prueban cómo múltiples componentes trabajan juntos. Usan mocks para simular dependencias.

**Ejemplo**: Probar que las rutas de Express responden correctamente a requests HTTP

#### End-to-End Tests (Tests E2E)

Prueban el sistema completo desde la interfaz hasta la base de datos. Requieren servicios reales.

**Ejemplo**: Probar que Ollama responde correctamente a una solicitud de chat

---

## Herramientas del Proyecto

### Vitest

Framework de testing moderno y rápido (similar a Jest pero más rápido). Incluye:

- **Hot Module Replacement (HMR)** - Recarga automática en desarrollo
- **Watch mode** - Ejecuta tests automáticamente cuando cambias código
- **Coverage integrado** - Medición de cobertura de código

### TypeScript

Los tests están escritos en TypeScript para:

- Type safety
- Autocomplete en el IDE
- Detectar errores en tiempo de desarrollo

### Supertest

Librería para testing de aplicaciones Express. Permite hacer requests HTTP a tu app sin necesidad de levantarla.

```typescript
import request from "supertest";
const response = await request(app).get("/api/chats");
```

### Mocks (vi.fn())

Vitest incluye funciones para crear mocks:

- `vi.fn()` - Crea una función simulada
- `vi.mock()` - Simula módulos completos
- `vi.spyOn()` - Espía métodos existentes

---

## Estructura de Tests

### Ubicación

Los tests se encuentran en: `server/src/test/`

```
server/src/test/
├── Chat.test.ts              # Tests del modelo Chat (Unit tests)
├── Message.test.ts           # Tests del modelo Message (Unit tests)
├── validators.test.ts        # Tests de validadores Zod (Unit tests)
├── database.test.ts          # Tests de base de datos (Integration tests)
├── config.test.ts            # Tests de configuración (Unit tests)
├── middlewares.test.ts       # Tests de middlewares (Unit tests)
├── routes.test.ts            # Tests de rutas (Unit tests con mocks)
├── ChatService.test.ts       # Tests del servicio (Integration tests)
├── integration.test.ts       # Tests de API con supertest (Integration tests)
└── ollamaIntegration.test.ts # Tests con Ollama real (E2E tests)
```

### Anatomía de un Test

```typescript
import { describe, it, expect, beforeEach } from "vitest";
import { MiClase } from "../models/MiClase.js";

// describe: Agrupa tests relacionados
describe("MiClase", () => {
  // beforeEach: Se ejecuta antes de CADA test
  beforeEach(() => {
    // Configuración inicial
  });

  // describe anidado: Agrupa tests de un método específico
  describe("método1", () => {
    // it: Define un test individual
    it("debería hacer algo específico", () => {
      // AAA Pattern:

      // 1. Arrange - Preparar los datos
      const entrada = "valor de prueba";
      const instancia = new MiClase();

      // 2. Act - Ejecutar la función
      const resultado = instancia.metodo1(entrada);

      // 3. Assert - Verificar el resultado
      expect(resultado).toBe("valor esperado");
    });

    it("debería lanzar error con entrada inválida", () => {
      expect(() => instancia.metodo1("")).toThrow();
    });
  });
});
```

---

## Tipos de Tests en Este Proyecto

### 1. Unit Tests (Modelos) - Chat.test.ts y Message.test.ts

Los **modelos** son las clases fundamentales que representan datos. Los unit tests verifican que funcionam correctamente de forma aislada.

**Ejemplo de Chat.test.ts:**

```typescript
describe("Chat Model", () => {
  describe("constructor", () => {
    it("should create a chat with required fields", () => {
      const chat = new Chat({
        model: "llama3.1",
        title: "My Chat",
      });

      expect(chat.model).toBe("llama3.1");
      expect(chat.title).toBe("My Chat");
      expect(chat.id).toBeDefined(); // Verifica que existe
      expect(chat.messages).toEqual([]); // Array vacío por defecto
    });
  });
});
```

**Qué prueban:**

- Creación de instancias con diferentes parámetros
- Valores por defecto
- Métodos como `addMessage()`, `getHistory()`, `toJSON()`
- Serialización a JSON

### 2. Unit Tests (Validadores) - validators.test.ts

Los **validadores** usan Zod para validar datos de entrada. Los tests verifican que las reglas de validación funcionan.

**Ejemplo:**

```typescript
describe("Validators", () => {
  describe("createChatSchema", () => {
    it("should validate a correct chat creation", () => {
      const data = { model: "llama3.1", title: "My Chat" };

      // safeParse no lanza error, retorna un objeto con success
      const result = createChatSchema.safeParse(data);
      expect(result.success).toBe(true);
    });

    it("should fail without model", () => {
      const data = { title: "My Chat" };
      const result = createChatSchema.safeParse(data);
      expect(result.success).toBe(false);
    });
  });
});
```

**Qué prueban:**

- Datos válidos son aceptados
- Datos inválidos son rechazados
- Mensajes de error específicos
- Campos opcionales vs obligatorios

### 3. Unit Tests (Configuración) - config.test.ts

Los tests de configuración verifican que las variables de entorno se leen correctamente.

**Ejemplo:**

```typescript
describe("Config", () => {
  beforeEach(() => {
    vi.resetModules(); // Limpia el cache de módulos
  });

  afterEach(() => {
    process.env = { ...originalEnv }; // Restaura variables de entorno
  });

  it("should have correct default port", async () => {
    delete process.env.PORT; // Elimina la variable
    const { config_ } = await import("../config.js");
    expect(config_.port).toBe(3000); // Verifica valor por defecto
  });

  it("should use custom nodeEnv when set", async () => {
    process.env.NODE_ENV = "production";
    const { config_ } = await import("../config.js");
    expect(config_.nodeEnv).toBe("production");
  });
});
```

**Técnicas usadas:**

- `vi.resetModules()` - Limpia el cache para reimportar con nuevos valores
- `beforeEach`/`afterEach` - Setup y cleanup
- Manipulación de `process.env` - Simula diferentes entornos

### 4. Unit Tests (Middlewares) - middlewares.test.ts

Los **middlewares** procesan requests antes de llegar a las rutas. Los tests verifican que responden correctamente.

**Ejemplo:**

```typescript
describe("Error Handler Middleware", () => {
  it("should handle error with status", () => {
    const req = {} as Request;
    const res = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn(),
    } as unknown as Response;
    const next = vi.fn() as NextFunction;

    const error = new Error("Test error") as Error & { status: number };
    error.status = 404;

    errorHandler(error, req, res, next);

    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith({ error: "Test error" });
  });
});
```

**Técnicas usadas:**

- **Mocks de objetos Response** - `vi.fn()` crea funciones simuladas
- **Spies** - Espían llamadas a métodos sin modificarlos
- **Type casting** - `as unknown as Response` para tipos complidos

### 5. Unit Tests (Rutas) - routes.test.ts

Los tests de rutas verifican que las rutas de Express están definidas correctamente.

**Ejemplo:**

```typescript
describe("Chat Routes", () => {
  it("should have POST /new-chat route", () => {
    const newChatRoute = router.stack.find(
      (layer: any) =>
        layer.route &&
        layer.route.path === "/new-chat" &&
        layer.route.methods.post,
    );
    expect(newChatRoute).toBeDefined();
  });
});
```

**Qué prueban:**

- Las rutas HTTP correctas existen
- Los métodos HTTP correctos están definidos
- La estructura del router

### 6. Integration Tests (Servicios) - ChatService.test.ts

Los **servicios** contienen lógica de negocio y usan la base de datos. Los integration tests verifican que funcionan correctamente con dependencias reales (base de datos).

**Ejemplo:**

```typescript
describe("ChatService", () => {
  beforeEach(() => {
    chatService = new ChatService();
    // Limpia la base de datos antes de cada test
    db.prepare("DELETE FROM messages").run();
    db.prepare("DELETE FROM chats").run();
  });

  describe("create", () => {
    it("should create a new chat", () => {
      const chat = chatService.create("llama2", "Test Chat");

      expect(chat).toBeDefined();
      expect(chat.id).toBeDefined();
      expect(chat.model).toBe("llama2");
    });
  });
});
```

**Qué prueban:**

- Creación de entidades en la base de datos
- Recuperación, actualización, eliminación
- Integridad referencial (borrar chat borra mensajes)
- Búsquedas

### 7. Integration Tests (API con Supertest) - integration.test.ts

Los tests de integración con **Supertest** crean una app Express real y hacen requests HTTP. Esto prueba el flujo completo: request → middleware → route → service → response.

**¿Por qué usar Supertest?**

- No necesitas levantar el servidor
- Tests más rápidos que E2E
- Verifica que las rutas responden correctamente
- Puede usar mocks para servicios externos

**Ejemplo completo:**

```typescript
import request from "supertest";
import express from "express";

// 1. Crear mocks de servicios
const mockChatService = {
  create: vi.fn((model, title) => ({
    id: "chat-1",
    model,
    title,
    toJSON: () => ({ id: "chat-1", model, title }),
  })),
  getAll: vi.fn().mockReturnValue([]),
  // ... otros métodos
};

// 2. Mockear los módulos reales
vi.mock("../services/ChatService.js", () => ({
  ChatService: function () {
    return mockChatService;
  },
}));

// 3. Crear app Express y configurar rutas
describe("API Integration Tests", () => {
  let app: Express;

  beforeEach(async () => {
    const { createChatRoutes } = await import("../routes/chatRoutes.js");
    const { ChatService } = await import("../services/ChatService.js");

    app = express();
    app.use(express.json()); // Middleware para parsear JSON

    const chatService = new ChatService();
    app.use("/api", createChatRoutes(chatService, ollamaService));
  });

  // 4. Hacer requests HTTP y verificar respuestas
  describe("POST /api/new-chat", () => {
    it("should create a new chat", async () => {
      const response = await request(app)
        .post("/api/new-chat")
        .send({ model: "llama2", title: "Test Chat" });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
    });

    it("should return 400 when model is missing", async () => {
      const response = await request(app)
        .post("/api/new-chat")
        .send({ title: "Test" }); // Falta model

      expect(response.status).toBe(400);
    });
  });
});
```

**Flujo de un test con Supertest:**

```
request(app)
  .post('/api/new-chat')           // 1. Hacer request HTTP
  .send({ model: 'llama2' })       // 2. Enviar body
  .then(response => {               // 3. Recibir respuesta
    expect(response.status).toBe(200);  // 4. Verificar status
    expect(response.body).toHaveProperty('success');  // 5. Verificar body
  });
```

**Métodos disponibles en Supertest:**

```typescript
// Métodos HTTP
request(app).get("/ruta");
request(app).post("/ruta");
request(app).put("/ruta");
request(app).patch("/ruta");
request(app)
  .delete("/ruta")

  // Enviar datos
  .send({ key: "value" }) // JSON body
  .type("form")
  .query({ key: "value" }) // Query params
  .set("Authorization", "Bearer...") // Headers
  .attach("file", path); // Archivos
```

### 8. End-to-End Tests (Ollama Real) - ollamaIntegration.test.ts

Los tests E2E se conectan a servicios reales. En este caso, al servidor Ollama.

**Desafío:** ¿Qué pasa si Ollama no está instalado?

**Solución:** Detectar automáticamente y saltar los tests:

```typescript
const checkOllamaAvailable = async () => {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 3000);
    await fetch(`${OLLAMA_URL}/api/tags`, { signal: controller.signal });
    clearTimeout(timeoutId);
    return true;
  } catch {
    return false;
  }
};

const isOllamaAvailable = await checkOllamaAvailable();

// Si Ollama está disponible, ejecutar tests
// Si no, saltar
(isOllamaAvailable ? describe : describe.skip)("sendMessage", () => {
  it("should send message and receive response", async () => {
    const result = await service.sendMessage(
      "llama3.2",
      [{ role: "user", content: "Hi" }],
      OLLAMA_URL,
    );
    expect(result).toHaveProperty("response");
  });
});
```

**Tests que siempre se ejecutan (sin Ollama):**

```typescript
// Estos tests prueban manejo de errores - no necesitan Ollama
describe("countTokens", () => {
  it("should handle error during counting", async () => {
    // URL inválida - no necesita Ollama real
    try {
      await service.countTokens("model", messages, "http://invalid:9999");
    } catch (error: any) {
      expect(error.message).toContain("Error al contar tokens");
    }
  });
});
```

---

## Comandos Disponibles

```bash
# Ejecutar todos los tests
npm test

# Ejecutar tests en modo watch (recompila automáticamente)
npm run test:watch

# Ejecutar tests con cobertura
npm run test:coverage

# Ejecutar un archivo específico
npx vitest run server/src/test/Message.test.ts

# Ejecutar un test específico por nombre
npx vitest run -t "should create a message"

# Modo watch para un archivo
npx vitest run server/src/test/validators.test.ts --watch
```

---

## Guía de Asserts

### Funciones de aserción más comunes

```typescript
// === IGUALDAD ===
expect(valor).toBe(valorEsperado)          // Comparación estricta (===)
expect(valor).toEqual(objetoEsperado)        // Comparación profunda
expect(valor).toStrictEqual(objetoEsperado) // Comparación estricta de objetos

// === VERDAD/FALSO ===
expect(valor).toBeTruthy()    // Truthy (not null, not false, not 0)
expect(valor).toBeFalsy()     // Falsy (null, false, 0, '')
expect(valor).toBe(true)      // Boolean exacto
expect(valor).toBe(true)      // Boolean exacto

// === NULOS ===
expect(valor).toBeNull()      // Exactamente null
expect(valor).toBeUndefined()  // Exactamente undefined
expect(valor).toBeDefined()    // No undefined

// === NÚMEROS ===
expect(valor).toBeGreaterThan(10)            // >
expect(valor).toBeGreaterThanOrEqual(10)     // >=
expect(valor).toBeLessThan(10)               // <
expect(valor).toBeLessThanOrEqual(10)        // <=
expect(valor).toBeCloseTo(3.14, 2)           // Aproximado (decimal)

// === STRINGS ===
expect(texto).toContain('subcadena')         // Contiene
expect(texto).toMatch(/expresion regular/)   // Regex
expect(texto).toHaveLength(5)                 // Longitud

// === ARRAYS ===
expect(array).toHaveLength(3)                 // Longitud
expect(array).toContain(elemento)             // Contiene elemento
expect(array).toEqual(expect.arrayContaining([...]))  // Contiene algunos

// === OBJETOS ===
expect(obj).toHaveProperty('clave')                    // Tiene propiedad
expect(obj).toHaveProperty('clave', valor)            // Con valor específico
expect(obj).toMatchObject({ clave: valor })            // Contiene propiedades
expect(obj).toEqual(expect.objectContaining({ ... })) // Contiene algunas

// === ERRORES ===
expect(() => fn()).toThrow()                           // Lanza cualquier error
expect(() => fn()).toThrow('mensaje')                 // Con mensaje específico
expect(() => fn()).toThrow(Error)                     // Tipo de error específico

// === MOCKS Y SPYS ===
expect(fn).toHaveBeenCalled()                          // Fue llamada
expect(fn).toHaveBeenCalledTimes(3)                    // Veces llamada
expect(fn).toHaveBeenCalledWith(arg1, arg2)           // Con argumentos
expect(fn).toHaveBeenLastCalledWith(arg1, arg2)        // Última vez con args

// === NEGACIONES ===
expect(valor).not.toBe(otro)                          // No es igual
expect(array).not.toContain(elemento)                 // No contiene
```

---

## Ejemplos por Tipo de Test

### Ejemplo 1: Test de Modelo (Unit)

```typescript
// Chat.test.ts
import { describe, it, expect } from "vitest";
import { Chat } from "../models/Chat.js";
import { Message } from "../models/Message.js";

describe("Chat Model", () => {
  describe("constructor", () => {
    it("should create a chat with required fields", () => {
      const chat = new Chat({
        model: "llama3.1",
        title: "My Chat",
      });

      expect(chat.model).toBe("llama3.1");
      expect(chat.title).toBe("My Chat");
      expect(chat.id).toBeDefined();
      expect(chat.messages).toEqual([]);
    });

    it("should use default title when not provided", () => {
      const chat = new Chat({ model: "llama3.1" });
      expect(chat.title).toBe("Nuevo chat");
    });

    it("should create a pinned chat", () => {
      const chat = new Chat({
        model: "llama3.1",
        title: "Pinned",
        pinned: true,
      });
      expect(chat.pinned).toBe(true);
    });
  });

  describe("addMessage", () => {
    it("should add a message to the chat", () => {
      const chat = new Chat({ model: "llama3.1", title: "Test" });
      const message = new Message({ role: "user", content: "Hello" });

      chat.addMessage(message);

      expect(chat.messages).toHaveLength(1);
    });
  });

  describe("toJSON", () => {
    it("should serialize chat to JSON", () => {
      const chat = new Chat({
        id: "chat-1",
        model: "llama3.1",
        title: "Test",
      });
      chat.addMessage(new Message({ role: "user", content: "Hi" }));

      const json = chat.toJSON();

      expect(json.id).toBe("chat-1");
      expect(json.messages).toHaveLength(1);
      expect(json.messageCount).toBe(1);
    });
  });
});
```

### Ejemplo 2: Test de Validador (Unit)

```typescript
// validators.test.ts
import { describe, it, expect } from "vitest";
import {
  createChatSchema,
  sendMessageSchema,
} from "../validators/chatValidator.js";

describe("Validators", () => {
  describe("createChatSchema", () => {
    it("should validate correct data", () => {
      const data = { model: "llama3.1", title: "My Chat" };
      const result = createChatSchema.safeParse(data);
      expect(result.success).toBe(true);
    });

    it("should validate without title (optional)", () => {
      const data = { model: "llama3.1" };
      const result = createChatSchema.safeParse(data);
      expect(result.success).toBe(true);
    });

    it("should fail without model (required)", () => {
      const data = { title: "My Chat" };
      const result = createChatSchema.safeParse(data);
      expect(result.success).toBe(false);
    });

    it("should fail with empty model", () => {
      const data = { model: "", title: "My Chat" };
      const result = createChatSchema.safeParse(data);
      expect(result.success).toBe(false);
    });

    it("should return error details when invalid", () => {
      const data = { title: "Test" };
      const result = createChatSchema.safeParse(data);

      if (!result.success) {
        expect(result.error.issues).toBeDefined();
        expect(result.error.issues[0].path).toContain("model");
      }
    });
  });

  describe("sendMessageSchema", () => {
    it("should validate message with content", () => {
      const data = { content: "Hello world" };
      const result = sendMessageSchema.safeParse(data);
      expect(result.success).toBe(true);
    });

    it("should validate without content (for regeneration)", () => {
      const data = {};
      const result = sendMessageSchema.safeParse(data);
      expect(result.success).toBe(true);
    });

    it("should accept valid URL", () => {
      const data = { content: "Hi", ollamaUrl: "http://localhost:11434" };
      const result = sendMessageSchema.safeParse(data);
      expect(result.success).toBe(true);
    });

    it("should reject invalid URL", () => {
      const data = { content: "Hi", ollamaUrl: "not-a-url" };
      const result = sendMessageSchema.safeParse(data);
      expect(result.success).toBe(false);
    });
  });
});
```

### Ejemplo 3: Test de Middleware (Unit)

```typescript
// middlewares.test.ts
import { describe, it, expect, vi } from "vitest";
import { errorHandler } from "../middlewares/errorHandler.js";
import { Request, Response, NextFunction } from "express";

describe("Error Handler Middleware", () => {
  it("should handle error with custom status", () => {
    const req = {} as Request;
    const res = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn(),
    } as unknown as Response;
    const next = vi.fn() as NextFunction;

    const error = new Error("Not Found") as Error & { status: number };
    error.status = 404;

    errorHandler(error, req, res, next);

    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith({ error: "Not Found" });
  });

  it("should default to 500 for errors without status", () => {
    const req = {} as Request;
    const res = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn(),
    } as unknown as Response;
    const next = vi.fn() as NextFunction;

    const error = new Error("Internal error");

    errorHandler(error, req, res, next);

    expect(res.status).toHaveBeenCalledWith(500);
  });
});
```

### Ejemplo 4: Test de Servicio (Integration)

```typescript
// ChatService.test.ts
import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { ChatService } from "../services/ChatService.js";
import { db } from "../services/database.js";

describe("ChatService", () => {
  let chatService: ChatService;

  beforeEach(() => {
    chatService = new ChatService();
    // Limpiar DB antes de cada test
    db.prepare("DELETE FROM messages").run();
    db.prepare("DELETE FROM chats").run();
  });

  afterEach(() => {
    // Limpiar después de cada test
    db.prepare("DELETE FROM messages").run();
    db.prepare("DELETE FROM chats").run();
  });

  describe("create", () => {
    it("should create a new chat", () => {
      const chat = chatService.create("llama2", "Test Chat");

      expect(chat).toBeDefined();
      expect(chat.id).toBeDefined();
      expect(chat.model).toBe("llama2");
      expect(chat.title).toBe("Test Chat");
    });

    it("should persist chat to database", () => {
      const chat = chatService.create("llama2", "Test");

      const found = chatService.getById(chat.id);
      expect(found).toBeDefined();
      expect(found?.id).toBe(chat.id);
    });
  });

  describe("delete", () => {
    it("should delete a chat", () => {
      const chat = chatService.create("llama2", "Test");
      chatService.delete(chat.id);

      const found = chatService.getById(chat.id);
      expect(found).toBeNull();
    });

    it("should delete messages when chat is deleted", () => {
      const chat = chatService.create("llama2", "Test");
      chatService.addMessage(chat.id, "user", "Hello");

      chatService.delete(chat.id);

      const messages = db
        .prepare("SELECT * FROM messages WHERE chat_id = ?")
        .all(chat.id);
      expect(messages.length).toBe(0);
    });
  });

  describe("search", () => {
    it("should search by title", () => {
      chatService.create("llama2", "My Test Chat");
      chatService.create("llama2", "Other Chat");

      const results = chatService.search("test");

      expect(results.length).toBe(1);
      expect(results[0].title).toBe("My Test Chat");
    });

    it("should search by message content", () => {
      const chat = chatService.create("llama2", "Chat");
      chatService.addMessage(chat.id, "user", "Hello world");

      const results = chatService.search("hello");

      expect(results.length).toBe(1);
    });
  });
});
```

### Ejemplo 5: Test de API con Supertest (Integration)

```typescript
// integration.test.ts
import { describe, it, expect, vi, beforeEach } from "vitest";
import request from "supertest";
import express, { type Express } from "express";

// 1. Crear mocks de servicios
const mockChatService = {
  create: vi.fn((model, title) => ({
    id: "chat-1",
    model,
    title,
    toJSON: () => ({ id: "chat-1", model, title }),
  })),
  getById: vi.fn(),
  getAll: vi.fn().mockReturnValue([]),
  delete: vi.fn(),
  rename: vi.fn(),
  // ... todos los métodos
};

const mockOllamaService = {
  listModels: vi.fn().mockResolvedValue([{ name: "llama2", size: 3826793472 }]),
  showModel: vi.fn().mockResolvedValue({
    family: "llama",
    parameter_size: "7B",
  }),
  sendMessage: vi.fn().mockResolvedValue({
    response: "Test response",
    promptTokens: 10,
    responseTokens: 20,
  }),
};

// 2. Mockear los módulos
vi.mock("../services/ChatService.js", () => ({
  ChatService: function () {
    return mockChatService;
  },
}));

vi.mock("../services/OllamaService.js", () => ({
  OllamaService: function () {
    return mockOllamaService;
  },
}));

// 3. Crear tests
describe("API Integration Tests", () => {
  let app: Express;

  beforeEach(async () => {
    vi.clearAllMocks();

    const { createChatRoutes } = await import("../routes/chatRoutes.js");
    const { createModelRoutes } = await import("../routes/modelRoutes.js");
    const { ChatService } = await import("../services/ChatService.js");
    const { OllamaService } = await import("../services/OllamaService.js");

    app = express();
    app.use(express.json());

    const chatService = new ChatService();
    const ollamaService = new OllamaService();

    app.use("/api", createChatRoutes(chatService, ollamaService));
    app.use("/api", createModelRoutes(ollamaService));
  });

  describe("POST /api/new-chat", () => {
    it("should create a new chat", async () => {
      const response = await request(app)
        .post("/api/new-chat")
        .send({ model: "llama2", title: "Test Chat" });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
    });

    it("should return 400 when model is missing", async () => {
      const response = await request(app)
        .post("/api/new-chat")
        .send({ title: "Test" });

      expect(response.status).toBe(400);
    });

    it("should return 400 when title is missing", async () => {
      const response = await request(app)
        .post("/api/new-chat")
        .send({ model: "llama2" });

      expect(response.status).toBe(400);
    });
  });

  describe("GET /api/chats", () => {
    it("should return all chats", async () => {
      const response = await request(app).get("/api/chats");

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
    });
  });

  describe("POST /api/models", () => {
    it("should return list of models", async () => {
      const response = await request(app)
        .post("/api/models")
        .send({ ollamaUrl: "http://localhost:11434" });

      expect(response.status).toBe(200);
      expect(response.body.models).toBeDefined();
    });

    it("should return 400 for invalid URL", async () => {
      const response = await request(app)
        .post("/api/models")
        .send({ ollamaUrl: "invalid" });

      expect(response.status).toBe(400);
    });
  });

  describe("DELETE /api/chats", () => {
    it("should delete all chats", async () => {
      const response = await request(app).delete("/api/chats");

      expect(response.status).toBe(200);
    });
  });
});
```

### Ejemplo 6: Test E2E con Ollama

```typescript
// ollamaIntegration.test.ts
import { describe, it, expect, beforeEach } from "vitest";
import { OllamaService } from "../services/OllamaService.js";

const OLLAMA_URL = process.env.OLLAMA_URL || "http://localhost:11434";

// Detectar si Ollama está disponible
const checkOllamaAvailable = async () => {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 3000);
    await fetch(`${OLLAMA_URL}/api/tags`, { signal: controller.signal });
    clearTimeout(timeoutId);
    return true;
  } catch {
    return false;
  }
};

const isOllamaAvailable = await checkOllamaAvailable();

describe("OllamaService - Integración Real", () => {
  let service: OllamaService;

  beforeEach(() => {
    service = new OllamaService();
  });

  // Solo ejecutar si Ollama está disponible
  (isOllamaAvailable ? describe : describe.skip)("sendMessage", () => {
    it("should send message and receive response", async () => {
      const result = await service.sendMessage(
        "llama3.2",
        [{ role: "user", content: 'Say "Hello"' }],
        OLLAMA_URL,
      );

      expect(result).toHaveProperty("response");
      expect(result).toHaveProperty("promptTokens");
      expect(result).toHaveProperty("responseTokens");
      expect(result).toHaveProperty("tokensPerSecond");
    }, 120000); // Timeout de 2 minutos

    it("should calculate tokens per second correctly", async () => {
      const result = await service.sendMessage(
        "llama3.2",
        [{ role: "user", content: "What is 1+1?" }],
        OLLAMA_URL,
      );

      expect(result.tokensPerSecond).toBeGreaterThanOrEqual(0);
    }, 120000);
  });

  // Tests de error - siempre se ejecutan (no necesitan Ollama)
  describe("countTokens", () => {
    it("should handle error during counting", async () => {
      try {
        await service.countTokens(
          "llama3.2",
          [{ role: "user", content: "test" }],
          "http://invalid:9999", // URL inválida
        );
        expect(true).toBe(false); // No debería llegar aquí
      } catch (error: any) {
        expect(error.message).toContain("Error al contar tokens");
      }
    }, 10000);
  });
});
```

---

## Conceptos Avanzados

### 1. Mocks con vi.mock()

**Mockear un módulo completo:**

```typescript
vi.mock("../services/ChatService.js", () => ({
  ChatService: vi.fn().mockImplementation(() => ({
    create: vi.fn().mockReturnValue({ id: "test", model: "llama2" }),
    getAll: vi.fn().mockReturnValue([]),
  })),
}));
```

**Mockear con implementación real pero espiar:**

```typescript
import { ChatService } from "../services/ChatService.js";

const spy = vi.spyOn(ChatService.prototype, "create");
```

### 2. Testing de Errores

```typescript
// Probar que se lanza un error
it("should throw error for invalid input", () => {
  expect(() => myFunction("")).toThrow("Input no puede estar vacío");
});

// Probar errores asíncronos
it("should throw error on failed API call", async () => {
  await expect(asyncFunction()).rejects.toThrow("Error message");
});
```

### 3. Cleanup entre Tests

```typescript
beforeEach(() => {
  // Limpiar mocks
  vi.clearAllMocks();

  // Limpiar módulos cacheados
  vi.resetModules();

  // Restaurar implementaciones
  vi.restoreAllMocks();
});
```

### 4. Timeout en Tests Lentos

```typescript
// Test con timeout personalizado (por defecto es 5s)
it("should take a long time", async () => {
  // Este test puede tomar hasta 30 segundos
}, 30000);

// Test E2E con Ollama puede tomar hasta 2 minutos
it("should send message to Ollama", async () => {
  // ...
}, 120000);
```

### 5. Skip y Only

```typescript
// Skip: Saltar un test
it.skip("this test is skipped", () => {
  expect(true).toBe(false);
});

// Only: Ejecutar solo este test
it.only("this is the only test that runs", () => {
  expect(true).toBe(true);
});

// Skip: Saltar describe completo
describe.skip("skipped describe", () => {});
```

---

## Mejores Prácticas

### 1. Nombra los tests descriptivamente

```typescript
// ❌ Malo
it("test 1", () => {});
it("create user", () => {});

// ✅ Bueno
it("should return the user when valid id is provided", () => {});
it("should create a new chat with the provided model and title", () => {});
```

### 2. Sigue el patrón AAA

```typescript
it("should calculate total correctly", () => {
  // Arrange
  const items = [{ price: 10 }, { price: 20 }];

  // Act
  const total = calculateTotal(items);

  // Assert
  expect(total).toBe(30);
});
```

### 3. Un solo concepto por test

```typescript
// ❌ Malo - Múltiples conceptos
it('creates user and updates stats and sends email', () => { ... })

// ✅ Bueno - Un concepto por test
it('creates user with default values', () => { ... })
it('saves user to database', () => { ... })
it('sends welcome email', () => { ... })
```

### 4. Tests independientes

```typescript
// ❌ Malo - Dependencia entre tests
it("creates user", () => {
  user = createUser();
  expect(user.id).toBeDefined();
});
it("updates user", () => {
  updateUser(user.id, { name: "New" }); // Depende del anterior
});

// ✅ Bueno - Cada test es independiente
it("creates user with id", () => {
  const user = createUser();
  expect(user.id).toBeDefined();
});

it("updates user name", () => {
  const user = createUser();
  const updated = updateUser(user.id, { name: "New" });
  expect(updated.name).toBe("New");
});
```

### 5. Limpia el estado entre tests

```typescript
beforeEach(() => {
  // Limpiar base de datos
  db.prepare("DELETE FROM messages").run();
  db.prepare("DELETE FROM chats").run();

  // Limpiar mocks
  vi.clearAllMocks();
});
```

### 6. Cobertura de código objetivo

- **Modelos**: 100% - Son la base de todo
- **Validadores**: 100% - Lógica de validación crítica
- **Servicios**: 80%+ - Lógica de negocio crítica
- **Rutas**: 70%+ - Endpoints principales
- **Utils**: 100% - Funciones puras

---

## Recursos

### Documentación Oficial

- [Vitest Docs](https://vitest.dev/)
- [Vitest API](https://vitest.dev/api/)
- [Supertest Docs](https://github.com/ladjs/supertest)
- [Zod Docs](https://zod.dev/)

### Testing Library

- [Testing Best Practices](https://testing-library.com/docs/)
- [Common Mistakes](https://kentcdodds.com/blog/common-mistakes-with-react-testing-library)

### Artículos

- [AAA Testing Pattern](https://medium.com/@pjbgf/title-the-aaa-pattern-4554e7e1ad64)
- [When to Mock](https://martinfowler.com/articles/mocksArentStubs.html)

---

## Próximos Pasos

1. **Ejecuta los tests existentes**: `npm test`
2. **Revisa la cobertura**: `npm run test:coverage`
3. **Añade un test nuevo**: Crea un archivo `.test.ts` en `server/src/test/`
4. **Practica con Supertest**: Añade tests de integración para nuevas rutas
5. **Si tienes Ollama**: Ejecuta los tests E2E para verificar integración real
