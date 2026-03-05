# OllamaUI — Chat con IA usando Arquitectura por Capas (TypeScript)

## ¿Qué es este proyecto?

Una aplicación web **completa** (frontend + backend) que te permite chatear con modelos de inteligencia artificial ejecutados localmente con [Ollama](https://ollama.com). Funciona como un "ChatGPT local" en tu propia máquina.

Todo el proyecto está escrito en **TypeScript**, tanto el servidor (Node.js + Express) como el cliente (DOM). Esto proporciona tipado estático, interfaces bien definidas y mejor experiencia de desarrollo.

**Características:**

- Múltiples conversaciones simultáneas
- Respuestas en tiempo real (streaming)
- Selección de modelos de IA instalados
- Exportar conversaciones a Markdown
- Interfaz responsiva (móvil y escritorio)
- Modo oscuro

---

## Arquitectura por Capas

Este proyecto está organizado en **3 capas** bien definidas. Cada capa tiene una responsabilidad única y solo se comunica con la capa inmediatamente inferior.

```
┌─────────────────────────────────────────────┐
│            CAPA 3: RUTAS (HTTP)             │  ← Recibe peticiones del navegador
│         src/routes/                         │
├─────────────────────────────────────────────┤
│         CAPA 2: SERVICIOS (Negocio)         │  ← Lógica y reglas de la aplicación
│         src/services/                       │
├─────────────────────────────────────────────┤
│         CAPA 1: MODELOS (Datos)             │  ← Estructura de los datos
│         src/models/                         │
└─────────────────────────────────────────────┘
```

### ¿Por qué capas?

1. **Separación de responsabilidades**: Cada archivo hace UNA sola cosa.
2. **Facilidad para entender**: Sabes dónde buscar según lo que necesites.
3. **Mantenibilidad**: Puedes cambiar la base de datos sin tocar las rutas, o agregar endpoints nuevos sin modificar la lógica de negocio.

---

## Estructura de Archivos

```
IAS-PROJECT/
│
├── index.ts                    # Punto de entrada — arranca el servidor
├── package.json                # Dependencias y scripts de npm
├── tsconfig.json               # Configuración TypeScript del servidor
│
├── src/                        # === BACKEND (Node.js + Express + TypeScript) ===
│   │
│   ├── server.ts               # Configura Express y conecta todas las capas
│   │
│   ├── models/                 # CAPA 1: Modelos de datos
│   │   ├── Chat.ts             #   → Clase + interfaz ChatData
│   │   └── Message.ts          #   → Clase + interfaz MessageData
│   │
│   ├── services/               # CAPA 2: Lógica de negocio
│   │   ├── ChatService.ts      #   → CRUD de chats + agregar mensajes
│   │   └── OllamaService.ts    #   → Comunicación con la API de Ollama
│   │
│   ├── routes/                 # CAPA 3: Rutas HTTP (endpoints)
│   │   ├── chatRoutes.ts       #   → POST/GET/DELETE para chats
│   │   └── modelRoutes.ts      #   → POST para obtener modelos
│   │
│   └── middlewares/            # Funciones auxiliares de Express
│       ├── logger.ts           #   → Registra cada petición en consola
│       └── errorHandler.ts     #   → Captura errores y responde JSON
│
├── client/                     # === FRONTEND (TypeScript del cliente) ===
│   ├── app.ts                  # Código fuente TS del frontend
│   └── tsconfig.json           # Configuración TypeScript del cliente
│
├── public/                     # === ARCHIVOS ESTÁTICOS (servidos por Express) ===
│   ├── index.html              # Página principal
│   ├── app.js                  # ← Compilado automáticamente desde client/app.ts
│   └── style.css               # Estilos (diseño responsivo, dark mode)
│
└── dist/                       # ← Compilado del servidor (generado por tsc)
    ├── index.js
    └── src/
```

---

## TypeScript en el Proyecto

### ¿Por qué TypeScript?

TypeScript añade **tipado estático** a JavaScript. Esto permite:

- **Detectar errores antes de ejecutar** el código (en tiempo de compilación).
- **Autocompletado inteligente** en el editor (VS Code).
- **Interfaces** que documentan la forma de los datos.
- **Refactorización segura**: renombrar una propiedad actualiza todas las referencias.

### Dos configuraciones de TypeScript

El proyecto tiene **dos archivos `tsconfig.json`** porque servidor y cliente tienen necesidades diferentes:

| Aspecto      | Servidor (`tsconfig.json`) | Cliente (`client/tsconfig.json`)       |
| ------------ | -------------------------- | -------------------------------------- |
| **Módulos**  | `Node16` (ESM con Node.js) | `None` (script global en el navegador) |
| **Libs**     | Predeterminadas de Node.js | `DOM`, `DOM.Iterable`, `ES2022`        |
| **Salida**   | `dist/`                    | `public/`                              |
| **Archivos** | `src/**/*`, `index.ts`     | `client/**/*`                          |

### Interfaces y tipos

Las **interfaces** definen la forma de los datos. Cada modelo exporta su interfaz junto con la clase:

```typescript
// src/models/Chat.ts
export interface ChatData {
  id?: string; // Opcional: se genera automáticamente si no se pasa
  model: string;
  title: string;
  messages?: Message[];
  createdAt?: Date;
  lastMessageAt?: Date;
}

export class Chat {
  constructor({
    id,
    model,
    title,
    messages = [],
    createdAt,
    lastMessageAt,
  }: ChatData) {
    // ...
  }
}
```

```typescript
// src/models/Message.ts
export interface MessageData {
  id?: string;
  role: string; // "user" | "assistant" | "system"
  content: string;
  timestamp?: Date;
}
```

```typescript
// src/services/OllamaService.ts
export interface OllamaModel {
  name: string;
  size: number;
  modified_at: string;
}
```

### Campos privados con `#`

`ChatService` usa un **campo privado nativo** de JavaScript:

```typescript
export class ChatService {
  #chats = new Map<string, Chat>(); // Map tipado: clave string, valor Chat
  // ...
}
```

El `#` hace que `#chats` sea inaccesible desde fuera de la clase — ni siquiera desde subclases. Es más estricto que `private` de TypeScript.

### Tipado del frontend

El código del cliente (`client/app.ts`) también usa TypeScript:

```typescript
// Interfaces para los datos que recibe del backend
interface ChatJSON {
  id: string;
  model: string;
  title: string;
  messages: MessageJSON[];
  createdAt: string;
  lastMessageAt: string;
  messageCount: number;
}

// Helper con genéricos para peticiones tipadas
async function apiPost<T>(path: string, body: object): Promise<T> {
  const res = await fetch(path, {
    /* ... */
  });
  return res.json();
}

// Uso: el resultado ya tiene el tipo correcto
const data = await apiPost<{ chat: ChatJSON }>("/api/new-chat", {
  model,
  title,
});
data.chat.id; // ← TypeScript sabe que esto es string
```

Se compila a `public/app.js` con `module: "None"` porque se ejecuta directamente en el navegador como script global (sin bundler).

---

## Explicación Capa por Capa

### CAPA 1: Modelos (`src/models/`)

Los modelos definen **la forma de los datos** usando clases e interfaces TypeScript.

#### `Chat.ts` — Una conversación

```typescript
import { randomUUID } from "crypto";
import { Message } from "./Message.js";

const chat = new Chat({ model: "llama2", title: "Mi primer chat" });
chat.addMessage(message); // Agregar un mensaje (tipado como Message)
chat.getHistory(); // { role: string; content: string }[]
chat.toJSON(); // Objeto plano serializable a JSON
```

`toJSON()` convierte las fechas a string con `.toISOString()` porque JSON no puede representar objetos `Date` directamente.

#### `Message.ts` — Un mensaje

```typescript
import { randomUUID } from "crypto";

const msg = new Message({ role: "user", content: "Hola, ¿cómo estás?" });
msg.toJSON(); // { id: string, role: string, content: string, timestamp: string }
```

---

### CAPA 2: Servicios (`src/services/`)

Los servicios contienen **la lógica de negocio**. Las operaciones importantes ocurren aquí.

#### `ChatService.ts` — Gestión de chats

```typescript
const chatService = new ChatService();

const chat = chatService.create("llama2", "Mi chat"); // → Chat
const found = chatService.getById("abc-123"); // → Chat | null
const all = chatService.getAll(); // → Chat[]
chatService.addMessage("abc-123", "user", "Hola"); // → Message
chatService.delete("abc-123"); // → void (lanza Error si no existe)
```

Internamente usa `Map<string, Chat>` como almacenamiento en memoria. En producción, se reemplazaría por una base de datos.

#### `OllamaService.ts` — Comunicación con la IA

```typescript
const ollamaService = new OllamaService();

// Obtener modelos instalados
const models: OllamaModel[] = await ollamaService.listModels(
  "http://localhost:11434",
);

// Enviar mensaje con streaming (callback tipado)
const response: string = await ollamaService.sendMessage(
  "llama2",
  [{ role: "user", content: "Hola" }],
  "http://localhost:11434",
  (chunk: string) => console.log(chunk), // callback por cada fragmento
);
```

**Streaming**: Usa `for await...of` sobre la respuesta de Ollama para recibir la respuesta **palabra por palabra** en tiempo real.

---

### CAPA 3: Rutas (`src/routes/`)

Las rutas traducen **peticiones HTTP → llamadas a servicios → respuestas JSON**. Todas las funciones de ruta reciben tipos `Request` y `Response` de Express.

#### `chatRoutes.ts` — API de chats

| Método   | Ruta                        | Descripción                   |
| -------- | --------------------------- | ----------------------------- |
| `POST`   | `/api/new-chat`             | Crea un nuevo chat            |
| `POST`   | `/api/chat/:chatId/message` | Envía mensaje (streaming SSE) |
| `GET`    | `/api/chats`                | Lista todos los chats         |
| `GET`    | `/api/chats/:chatId`        | Obtiene un chat por ID        |
| `DELETE` | `/api/chats/:chatId`        | Elimina un chat               |

#### `modelRoutes.ts` — API de modelos

| Método | Ruta          | Descripción                         |
| ------ | ------------- | ----------------------------------- |
| `POST` | `/api/models` | Lista modelos de Ollama disponibles |

#### Ejemplo de flujo completo

```
1. El usuario escribe "Hola" en el navegador
2. El frontend hace: POST /api/chat/abc-123/message { content: "Hola" }
3. La RUTA (chatRoutes.ts) recibe la petición
4. La ruta llama al SERVICIO: chatService.addMessage("abc-123", "user", "Hola")
5. La ruta llama al SERVICIO: ollamaService.sendMessage(...)
6. Ollama responde en streaming → la ruta reenvía cada fragmento al frontend
7. La ruta llama al SERVICIO: chatService.addMessage("abc-123", "assistant", respuesta)
8. El frontend muestra la respuesta palabra por palabra
```

---

### Middlewares (`src/middlewares/`)

Los middlewares son funciones tipadas con `(req: Request, res: Response, next: NextFunction)`.

```
Petición → logger → cors → json → RUTA → errorHandler → Respuesta
```

- **`logger.ts`**: Registra cada petición (método, ruta, código de estado, duración en ms).
- **`errorHandler.ts`**: Middleware de error con 4 parámetros `(err, req, res, next)`. Captura errores no manejados y responde JSON. Usa un tipo extendido `Error & { status?: number }`.

---

### `server.ts` — El pegamento

Conecta todas las capas y exporta la función `createServer`:

```typescript
import express, { Express } from "express";
import cors from "cors";
import { logger } from "./middlewares/logger.js";
import { errorHandler } from "./middlewares/errorHandler.js";
import { ChatService } from "./services/ChatService.js";
import { OllamaService } from "./services/OllamaService.js";
import { createChatRoutes } from "./routes/chatRoutes.js";
import { createModelRoutes } from "./routes/modelRoutes.js";

export function createServer(port: number = 3000): Express {
  const app = express();

  app.use(cors());
  app.use(express.json());
  app.use(logger);
  app.use(express.static("public"));

  const chatService = new ChatService();
  const ollamaService = new OllamaService();

  app.use("/api", createChatRoutes(chatService, ollamaService));
  app.use("/api", createModelRoutes(ollamaService));

  app.use(errorHandler);

  app.listen(port, () => {
    console.log(`Servidor iniciado en http://localhost:${port}`);
  });

  return app;
}
```

**Nota sobre imports**: Los imports usan extensión `.js` (ej: `./Message.js`) aunque los archivos fuente son `.ts`. Esto es necesario para ESM con Node16 — TypeScript resuelve el `.js` al `.ts` correspondiente en compilación.

---

## ¿Cómo funciona el Frontend?

El frontend vive en dos lugares:

- **`client/app.ts`** → Código fuente TypeScript
- **`public/`** → Archivos estáticos servidos por Express (HTML, CSS, y el `app.js` compilado)

### `client/app.ts`

Toda la lógica del frontend en un solo archivo TypeScript:

- **Interfaces** (`ChatJSON`, `MessageJSON`, `OllamaModel`) para tipar los datos del backend
- **Helpers genéricos** (`apiPost<T>`, `apiGet<T>`, `apiDelete`) para peticiones HTTP tipadas
- **Streaming con ReadableStream**: Lee la respuesta SSE del servidor palabra por palabra
- **Renderizado Markdown**: Usa `marked.js` y `highlight.js` (cargados desde CDN, accedidos via `window as any`)
- **Dark mode**: Alterna entre temas con `localStorage`
- **Configuración de Ollama**: Permite cambiar host/puerto de conexión

### `public/index.html`

Estructura HTML con sidebar de chats, selector de modelos, área de mensajes, input de texto y modal de configuración.

### `public/style.css`

Diseño responsivo mobile-first con variables CSS. Soporta modo claro y oscuro.

---

## Conceptos Clave para Estudiar

### 1. Server-Sent Events (SSE)

El streaming de respuestas usa SSE. El servidor envía datos línea por línea:

```
data: {"chunk": "Hola", "done": false}

data: {"chunk": " mundo", "done": false}

data: {"done": true, "fullResponse": "Hola mundo"}
```

El frontend los lee con `ReadableStream` y `TextDecoder`.

### 2. Inyección de dependencias (simple)

Los servicios se crean en `server.ts` y se pasan como parámetros tipados a las funciones de rutas:

```typescript
export function createChatRoutes(
  chatService: ChatService,
  ollamaService: OllamaService,
): Router {
  /* ... */
}
```

Las rutas no crean sus propias dependencias — las reciben. Esto permite testear con mocks y cambiar implementaciones sin tocar las rutas.

### 3. Separación Frontend / Backend

El frontend es 100% estático y se comunica con el backend solo mediante `fetch()` a la API REST. Podrías reemplazar el frontend por React, Vue o cualquier otro framework sin tocar el backend.

### 4. Map tipado como almacenamiento temporal

```typescript
#chats = new Map<string, Chat>();
```

`Map<string, Chat>` garantiza que las claves son `string` y los valores son instancias de `Chat`. Los datos se pierden al reiniciar el servidor — en producción se usaría una base de datos.

### 5. Genéricos en TypeScript

Los helpers del frontend usan **genéricos** para tipar las respuestas:

```typescript
async function apiPost<T>(path: string, body: object): Promise<T> {
  // ...
  return res.json();
}

// T se infiere como { models: OllamaModel[] }
const data = await apiPost<{ models: OllamaModel[] }>("/api/models", {
  ollamaUrl,
});
```

---

## Instalación y Ejecución

### Requisitos previos

1. [Node.js](https://nodejs.org) (v18 o superior)
2. [Ollama](https://ollama.com) instalado y ejecutándose
3. Al menos un modelo descargado (`ollama pull llama2`)

### Pasos

```bash
# 1. Instalar dependencias
npm install

# 2. Iniciar en modo desarrollo (servidor + cliente en watch)
npm run dev

# 3. Abrir en el navegador
# http://localhost:3000
```

### Scripts disponibles

| Script         | Comando                | Descripción                                              |
| -------------- | ---------------------- | -------------------------------------------------------- |
| `dev`          | `npm run dev`          | Ejecuta servidor y cliente en modo watch simultáneamente |
| `dev:server`   | `npm run dev:server`   | Solo el servidor en modo watch (`tsx --watch`)           |
| `dev:client`   | `npm run dev:client`   | Solo el cliente en modo watch (`tsc --watch`)            |
| `build`        | `npm run build`        | Compila servidor y cliente para producción               |
| `build:server` | `npm run build:server` | Solo compila el servidor                                 |
| `build:client` | `npm run build:client` | Solo compila el cliente                                  |
| `start`        | `npm start`            | Inicia en modo producción (`node dist/index.js`)         |

---

## Ejercicios para Practicar

### Nivel Básico

1. **Agrega un endpoint** `GET /api/chats/count` que devuelva el número total de chats.
2. **Agrega una propiedad** `updatedAt` al modelo `Chat` (y a la interfaz `ChatData`) que se actualice cada vez que se modifica el título.
3. **Modifica el logger** para que muestre también la IP del cliente (`req.ip`).

### Nivel Intermedio

4. **Implementa un método** `clearMessages(chatId: string): void` en `ChatService` que elimine todos los mensajes de un chat sin borrar el chat.
5. **Agrega validaciones** al crear un chat: el título debe tener entre 3 y 100 caracteres, y el nombre del modelo no puede estar vacío. Crea un tipo `Role = "user" | "assistant" | "system"` para tipar el campo `role` de `Message`.
6. **Crea un nuevo endpoint** `PUT /api/chats/:chatId` en `chatRoutes.ts` que permita renombrar un chat.

### Nivel Avanzado

7. **Reemplaza el Map** del `ChatService` por una base de datos SQLite usando la librería `better-sqlite3` (con `@types/better-sqlite3`).
8. **Agrega autenticación** básica con un middleware tipado que verifique un token en el header `Authorization`.
9. **Escribe tests unitarios** para `ChatService` usando Node.js test runner (`node --test`).

---

## Dependencias del Proyecto

### Producción

| Paquete   | Para qué se usa                                         |
| --------- | ------------------------------------------------------- |
| `express` | Framework web para crear el servidor HTTP y las rutas   |
| `cors`    | Permitir peticiones desde otros orígenes (Cross-Origin) |
| `ollama`  | Librería oficial para comunicarse con la API de Ollama  |
| `dotenv`  | Cargar variables de entorno desde un archivo `.env`     |
| `openai`  | Disponible para integración futura con OpenAI           |

### Desarrollo

| Paquete          | Para qué se usa                                                |
| ---------------- | -------------------------------------------------------------- |
| `typescript`     | Compilador de TypeScript                                       |
| `tsx`            | Ejecuta TypeScript directamente con soporte de watch y ESM     |
| `concurrently`   | Ejecuta múltiples comandos en paralelo (watch server + client) |
| `@types/node`    | Tipos de TypeScript para Node.js                               |
| `@types/express` | Tipos de TypeScript para Express                               |
| `@types/cors`    | Tipos de TypeScript para el middleware CORS                    |

---

## Resolución de Problemas

### El servidor no inicia

- Verifica que el puerto 3000 esté disponible
- Asegúrate de tener todas las dependencias: `npm install`

### No recibo respuestas de la IA

- Verifica que Ollama esté en ejecución: `ollama serve`
- Confirma que tienes un modelo instalado: `ollama list`
- Revisa la URL de conexión en la configuración de la app

### Error "Cannot connect to Ollama"

- Si usas Ollama en otra máquina de la red, configura la IP desde el botón de configuración en la interfaz
- Verifica que el firewall no bloquee el puerto 11434

### Errores de compilación TypeScript

- Ejecuta `npm run build` para ver errores detallados
- Verifica que los imports usen extensión `.js` (requerido por ESM con Node16)
- Asegúrate de que las interfaces coincidan con los datos que estás pasando

---

## Resumen Visual del Flujo

```
┌──────────┐     HTTP      ┌──────────────┐    lógica     ┌──────────────┐
│          │  ──────────►  │              │  ──────────►  │              │
│ Frontend │    fetch()    │    Rutas     │   métodos()   │  Servicios   │
│ (public) │  ◄──────────  │  (routes/)   │  ◄──────────  │ (services/)  │
│          │     JSON      │              │    datos      │              │
└──────────┘               └──────────────┘               └──────┬───────┘
                                                                 │
                                                                 │ usa
                                                                 ▼
                                                          ┌──────────────┐
                                                          │   Modelos    │
                                                          │  (models/)   │
                                                          │  Chat.ts     │
                                                          │  Message.ts  │
                                                          └──────────────┘
```

### Flujo de compilación

```
client/app.ts  ──tsc -p client──►  public/app.js    (navegador)
index.ts + src/**/*.ts  ──tsc──►  dist/**/*.js      (Node.js)
```
