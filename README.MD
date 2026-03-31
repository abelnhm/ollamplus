# OllamPlus — Chat con IA usando Arquitectura por Capas (TypeScript)

## ¿Qué es este proyecto?

Una aplicación web **completa** (frontend + backend) que te permite chatear con modelos de inteligencia artificial ejecutados localmente con [Ollama](https://ollama.com). Funciona como un "ChatGPT local" en tu propia máquina.

Todo el proyecto está escrito en **TypeScript**, tanto el servidor (Node.js + Express + SQLite) como el cliente (DOM). Esto proporciona tipado estático, interfaces bien definidas y mejor experiencia de desarrollo.

**Características:**

- Logo personalizado en la cabecera y sidebar
- Múltiples conversaciones simultáneas
- Fecha y hora en cada chat de la lista
- Respuestas en tiempo real (streaming)
- Selección de modelos de IA instalados
- Exportar conversaciones a Markdown/JSON/HTML
- Importar conversaciones desde ChatGPT/NousSave
- Interfaz responsiva (móvil y escritorio)
- Modo oscuro (configurable desde ajustes)
- Persistencia de datos con SQLite
- Parámetros configurables del modelo (temperature, top_p, etc.)
- System prompt personalizable
- Plantillas de prompts
- Conteo de tokens
- Configuración de Ollama persistida en SQLite
- Zona de peligro para borrar todos los chats
- Confirmación de eliminación de chat
- **Texto a voz (TTS)** - Reproducir respuestas en audio
  - Botón de lectura en cada mensaje del asistente
  - Selector de voz en configuración
  - Control de velocidad de lectura (0.5x - 1.5x)
  - Auto-hablar respuestas (toggle switch en selector de modelo)
- **Voz a texto (STT)** - Transcribir audio a texto
  - Botón de micrófono para grabar audio
  - Transcripción en tiempo real usando Web Speech API
  - Indicador de grabación con tiempo
  - **Auto enviar**: Envía automáticamente al detectar silencio (2 segundos)
  - **Auto voz**: Activa el micrófono automáticamente después de reproducir audio TTS
  - Flujo completo manos libres: Auto audio → Auto voz → Auto enviar
- **Archivos adjuntos** - Adjuntar archivos de texto/código a los mensajes
  - Icono y nombre del archivo junto al mensaje enviado
  - Botones de adjunto y plantillas sobre el campo de entrada

---

## Estructura del Proyecto

El proyecto sigue una arquitectura de **workspaces simple** con separación clara entre cliente, servidor, tipos compartidos y archivos estáticos:

```
OllamPlus/
├── package.json              # Dependencias y scripts
├── .env.example              # Template de variables de entorno
│
├── server/                   # === BACKEND (Node.js + Express + SQLite) ===
│   ├── src/
│   │   ├── index.ts         # Entry point — arrancar el servidor
│   │   ├── config.ts        # Carga de variables de entorno
│   │   │
│   │   ├── models/          # Modelos de datos (Chat, Message)
│   │   │   ├── Chat.ts
│   │   │   └── Message.ts
│   │   │
│   │   ├── services/        # Lógica de negocio
│   │   │   ├── ChatService.ts      # CRUD de chats + mensajes
│   │   │   ├── OllamaService.ts    # Comunicación con Ollama
│   │   │   └── database.ts         # SQLite + inicialización
│   │   │
│   │   ├── routes/          # Endpoints HTTP
│   │   │   ├── chatRoutes.ts
│   │   │   └── modelRoutes.ts
│   │   │
│   │   ├── validators/      # Validación de inputs con Zod
│   │   │   └── chatValidator.ts
│   │   │
│   │   ├── db/              # Base de datos y migraciones
│   │   │   └── migrations.ts
│   │   │
│   │   └── middlewares/     # Express middlewares
│   │       ├── logger.ts    # Logging con Pino
│   │       └── errorHandler.ts
│   │
│   └── dist/                # Compilados del servidor
│
├── client/                  # === FRONTEND (TypeScript - código fuente) ===
│   ├── app.ts              # Entry point
│   ├── types.ts            # Interfaces del cliente
│   ├── state.ts            # Estado global
│   ├── api.ts              # Cliente HTTP
│   ├── utils.ts            # Utilidades
│   │
│   ├── ui/                 # Capa de presentación
│   │   ├── elements.ts
│   │   ├── messages.ts
│   │   ├── sidebar.ts
│   │   ├── theme.ts
│   │   ├── settings.ts
│   │   └── modalAlert.ts   # Modal de alertas
│   │
│   ├── services/           # Lógica del cliente
│   │   ├── chatService.ts
│   │   ├── modelService.ts
│   │   ├── modelParams.ts
│   │   ├── systemPrompt.ts
│   │   ├── tokenService.ts
│   │   ├── exportService.ts
│   │   ├── importService.ts
│   │   ├── templateService.ts
│   │   ├── ttsService.ts   # Texto a voz
│   │   ├── ttsVoices.ts   # Gestión de voces TTS
│   │   ├── sttService.ts  # Voz a texto (Speech Recognition)
│   │   └── fileAttachment.ts
│   │
│   └── tsconfig.json
│
├── shared/                  # === TIPOS COMPARTIDOS ===
│   ├── types/
│   │   ├── chat.ts
│   │   ├── message.ts
│   │   ├── api.ts
│   │   └── index.ts
│   ├── dist/               # Compilados (para imports)
│   └── tsconfig.json
│
├── public/                 # === ARCHIVOS ESTÁTICOS (servidos por Express) ===
│   ├── index.html         # HTML principal
│   ├── style.css          # Estilos CSS
│   ├── app.js             # JS compilado del cliente
│   ├── types.js           # Tipos compilados
│   ├── state.js           # Estado compilado
│   ├── api.js             # API compilada
│   ├── utils.js           # Utilidades compiladas
│   │
│   └── services/          # Servicios compilados
│   │   ├── chatService.js
│   │   ├── sttService.js
│   │   ├── ttsService.js
│   │   └── ...
│   │
│   └── img/               # Imágenes y recursos
│       ├── logo4.png      # Logo de la aplicación
│       ├── logo3.png
│       ├── logo2.png
│       └── logo1.png
│
├── data/                   # Base de datos SQLite
│   └── ollama.db
│
├── vitest.config.ts        # Configuración de tests
└── tsconfig.json          # Configuración base de TypeScript
```

---

## Arquitectura por Capas

Este proyecto está organizado en **3 capas** bien definidas. Cada capa tiene una responsabilidad única y solo se comunica con la capa inmediatamente inferior.

```
┌─────────────────────────────────────────────┐
│            CAPA 3: RUTAS (HTTP)             │  ← Recibe peticiones del navegador
│         server/src/routes/                   │
├─────────────────────────────────────────────┤
│         CAPA 2: SERVICIOS (Negocio)         │  ← Lógica y reglas de la aplicación
│         server/src/services/                 │
├─────────────────────────────────────────────┤
│         CAPA 1: MODELOS (Datos)             │  ← Estructura de los datos
│         server/src/models/                   │
└─────────────────────────────────────────────┘
```

### ¿Por qué capas?

1. **Separación de responsabilidades**: Cada archivo hace UNA sola cosa.
2. **Facilidad para entender**: Sabes dónde buscar según lo que necesites.
3. **Mantenibilidad**: Puedes cambiar la base de datos sin tocar las rutas, o agregar endpoints nuevos sin modificar la lógica de negocio.

---

## Base de Datos (SQLite)

### Esquema

```sql
-- Configuración global de la aplicación
CREATE TABLE app_config (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

-- Chats con parámetros e información del modelo
CREATE TABLE chats (
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

-- Mensajes (solo contenido, métricas separadas)
CREATE TABLE messages (
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

-- Índices para optimización
CREATE INDEX idx_messages_chat_id ON messages(chat_id);
CREATE INDEX idx_chats_last_message_at ON chats(last_message_at);
```

### Campos del modelo Chat

| Campo             | Tipo    | Descripción                               |
| ----------------- | ------- | ----------------------------------------- |
| `id`              | TEXT    | UUID único del chat                       |
| `title`           | TEXT    | Título del chat                           |
| `model`           | TEXT    | Modelo de Ollama usado                    |
| `instructions`    | TEXT    | Instrucciones del sistema (system prompt) |
| `parameters`      | TEXT    | JSON con parámetros del modelo            |
| `model_info`      | TEXT    | JSON con información del modelo           |
| `created_at`      | TEXT    | Fecha de creación (ISO)                   |
| `last_message_at` | TEXT    | Fecha del último mensaje (ISO)            |
| `pinned`          | INTEGER | 1 si está anclado, 0 si no                |

### Campos del modelo Message

| Campo               | Tipo    | Descripción                             |
| ------------------- | ------- | --------------------------------------- |
| `id`                | TEXT    | UUID único del mensaje                  |
| `chat_id`           | TEXT    | Referencia al chat padre                |
| `role`              | TEXT    | "user", "assistant" o "system"          |
| `content`           | TEXT    | Contenido del mensaje                   |
| `timestamp`         | TEXT    | Fecha del mensaje (ISO)                 |
| `token_count`       | INTEGER | Tokens de la respuesta (solo assistant) |
| `duration_ms`       | INTEGER | Duración de la generación (ms)          |
| `tokens_per_second` | REAL    | Velocidad de generación                 |

### Tabla app_config

Almacena configuración global de la aplicación:

| Campo        | Tipo | Descripción                   |
| ------------ | ---- | ----------------------------- |
| `key`        | TEXT | Clave de configuración        |
| `value`      | TEXT | Valor guardado                |
| `updated_at` | TEXT | Fecha de última actualización |

**Usos actuales:**

- `ollamaHost` - Host de Ollama
- `ollamaPort` - Puerto de Ollama

---

## TypeScript en el Proyecto

### ¿Por qué TypeScript?

TypeScript añade **tipado estático** a JavaScript. Esto permite:

- **Detectar errores antes de ejecutar** el código (en tiempo de compilación).
- **Autocompletado inteligente** en el editor (VS Code).
- **Interfaces** que documentan la forma de los datos.
- **Refactorización segura**: renombrar una propiedad actualiza todas las referencias.

### Tres configuraciones de TypeScript

El proyecto tiene **tres paquetes TypeScript** porque cada uno tiene necesidades diferentes:

| Paquete   | Módulos  | Salida         | Propósito          |
| --------- | -------- | -------------- | ------------------ |
| `server/` | `Node16` | `server/dist/` | Backend Node.js    |
| `client/` | `ES2022` | `public/`      | Frontend navegador |
| `shared/` | `Node16` | `shared/dist/` | Tipos compartidos  |

### Tipos compartidos (`shared/`)

Los tipos definidos en `shared/` se usan tanto en el servidor como en el cliente:

```typescript
// shared/types/chat.ts
export interface ChatJSON {
  id: string;
  model: string;
  title: string;
  instructions?: string;
  parameters?: ChatParameters;
  modelInfo?: ModelInfo;
  messages: MessageJSON[];
  createdAt: string;
  lastMessageAt: string;
  messageCount: number;
  pinned: boolean;
}

export interface ChatParameters {
  temperature?: number;
  topP?: number;
  topK?: number;
  numCtx?: number;
  numKeep?: number;
  seed?: number;
  repeatPenalty?: number;
  repeatLastN?: number;
  numGPU?: number;
  numThread?: number;
  stop?: string[];
}
```

---

## Explicación Capa por Capa

### CAPA 1: Modelos (`/models/`)

Losserver/src modelos definen **la forma de los datos** usando clases e interfaces TypeScript.

#### `Chat.ts` — Una conversación

```typescript
const chat = new Chat({ model: "llama3.1", title: "Mi primer chat" });
chat.addMessage(message);
chat.getHistory(); // { role: string; content: string }[]
chat.toJSON(); // Objeto plano serializable a JSON
```

#### `Message.ts` — Un mensaje

```typescript
const msg = new Message({ role: "user", content: "Hola" });
msg.toJSON(); // { id, role, content, timestamp, metrics? }
```

---

### CAPA 2: Servicios (`server/src/services/`)

#### `ChatService.ts` — Gestión de chats con SQLite

```typescript
const chatService = new ChatService();

const chat = chatService.create("llama3.1", "Mi chat");
const found = chatService.getById("abc-123");
const all = chatService.getAll();
chatService.addMessage("abc-123", "user", "Hola");
chatService.delete("abc-123");
chatService.rename("abc-123", "Nuevo título");
chatService.togglePin("abc-123");
chatService.search("búsqueda");
```

#### `database.ts` — SQLite

Inicializa la base de datos y crea las tablas si no existen. Usa `better-sqlite3` para operaciones síncronas optimizadas.

#### `OllamaService.ts` — Comunicación con la IA

```typescript
const ollamaService = new OllamaService();

const models = await ollamaService.listModels("http://localhost:11434");
const modelInfo = await ollamaService.showModel(
  "llama3.1",
  "http://localhost:11434",
);

const response = await ollamaService.sendMessage(
  "llama3.1",
  [{ role: "user", content: "Hola" }],
  "http://localhost:11434",
  (chunk) => console.log(chunk), // callback streaming
);
```

---

### CAPA 3: Rutas (`server/src/routes/`)

#### `chatRoutes.ts` — API de chats

| Método   | Ruta                                 | Descripción                    |
| -------- | ------------------------------------ | ------------------------------ |
| `POST`   | `/api/new-chat`                      | Crear un nuevo chat            |
| `POST`   | `/api/chat/:chatId/message`          | Enviar mensaje (streaming SSE) |
| `GET`    | `/api/chats`                         | Listar todos los chats         |
| `GET`    | `/api/chats/:chatId`                 | Obtener un chat por ID         |
| `GET`    | `/api/chats/search?q=`               | Buscar chats                   |
| `PATCH`  | `/api/chats/:chatId`                 | Renombrar chat                 |
| `PATCH`  | `/api/chats/:chatId/model`           | Cambiar modelo                 |
| `PATCH`  | `/api/chats/:chatId/pin`             | Anclar/desanclar               |
| `DELETE` | `/api/chats/:chatId`                 | Eliminar chat                  |
| `DELETE` | `/api/chats/:chatId/last-message`    | Eliminar último mensaje        |
| `PUT`    | `/api/chats/:chatId/messages/:msgId` | Editar mensaje                 |
| `POST`   | `/api/import-chat`                   | Importar conversación          |
| `DELETE` | `/api/chats`                         | Borrar todos los chats         |

#### `configRoutes.ts` — API de configuración

| Método | Ruta               | Descripción                    |
| ------ | ------------------ | ------------------------------ |
| `GET`  | `/api/config/:key` | Obtener valor de configuración |
| `PUT`  | `/api/config/:key` | Guardar valor de configuración |

#### `modelRoutes.ts` — API de modelos

| Método | Ruta          | Descripción                |
| ------ | ------------- | -------------------------- |
| `POST` | `/api/models` | Listar modelos disponibles |

---

## Frontend (Client)

### Arquitectura del Cliente

```
┌─────────────────────────────────────────────────────────┐
│              ENTRY POINT: app.ts                        │
│     Importa todos los módulos, conecta eventos,          │
│     resuelve dependencias circulares, inicializa       │
├─────────────────────────────────────────────────────────┤
│           CAPA SERVICIOS: services/                     │
│  chatService · modelService · modelParams               │
│  systemPrompt · tokenService · exportService            │
│  importService · templateService · sttService          │
│  ttsService · ttsVoices · fileAttachment               │
├─────────────────────────────────────────────────────────┤
│           CAPA UI: ui/                                  │
│  elements · messages · sidebar · theme · settings       │
│  modalAlert                                             │
├─────────────────────────────────────────────────────────┤
│           CAPA BASE                                     │
│  types.ts · state.ts · api.ts · utils.ts                │
└─────────────────────────────────────────────────────────┘
```

### Módulos del cliente

| Capa          | Módulo                        | Responsabilidad                              |
| ------------- | ----------------------------- | -------------------------------------------- |
| **Base**      | `types.ts`                    | Interfaces (`ChatJSON`, `MessageJSON`, etc.) |
| **Base**      | `state.ts`                    | Estado global reactivo (incluye config TTS)   |
| **Base**      | `api.ts`                      | Cliente HTTP genérico                        |
| **Base**      | `utils.ts`                    | Utilidades (`formatMarkdown`, `escapeHtml`)  |
| **UI**        | `ui/elements.ts`              | Referencias DOM                              |
| **UI**        | `ui/messages.ts`              | Renderizado de mensajes, streaming           |
| **UI**        | `ui/sidebar.ts`               | Sidebar de chats                             |
| **UI**        | `ui/theme.ts`                 | Modo oscuro/claro                            |
| **UI**        | `ui/settings.ts`              | Configuración de Ollama + TTS                |
| **UI**        | `ui/modalAlert.ts`            | Modal de alertas y errores                   |
| **Servicios** | `services/chatService.ts`     | Core: envío, streaming, CRUD                |
| **Servicios** | `services/modelService.ts`    | Modelos de Ollama                            |
| **Servicios** | `services/modelParams.ts`    | Parámetros del modelo                        |
| **Servicios** | `services/systemPrompt.ts`    | System prompt                                |
| **Servicios** | `services/tokenService.ts`    | Conteo de tokens                             |
| **Servicios** | `services/exportService.ts`  | Exportar a MD/JSON/HTML                      |
| **Servicios** | `services/importService.ts`   | Importar desde otros formatos                |
| **Servicios** | `services/templateService.ts` | Plantillas de prompts                        |
| **Servicios** | `services/ttsService.ts`     | Texto a voz (Web Speech API)                 |
| **Servicios** | `services/ttsVoices.ts`      | Gestión de voces disponibles                 |
| **Servicios** | `services/sttService.ts`     | Voz a texto (Speech Recognition API)        |
| **Servicios** | `services/fileAttachment.ts` | Adjuntar archivos al chat                   |

---

## Conceptos Clave

### 1. Server-Sent Events (SSE)

El streaming de respuestas usa SSE:

```
data: {"chunk": "Hola", "done": false}
data: {"chunk": " mundo", "done": false}
data: {"done": true, "fullResponse": "Hola mundo"}
```

### 2. Inyección de dependencias

```typescript
export function createChatRoutes(
  chatService: ChatService,
  ollamaService: OllamaService,
): Router {
  // Las rutas reciben los servicios como parámetros
}
```

### 3. ES Modules

- **Servidor**: `Node16` con imports `.js`
- **Cliente**: `ES2022` nativo del navegador
- **Build**: Sin bundler (Webpack/Vite), solo `tsc`

---

## Instalación y Ejecución

### Requisitos previos

1. [Node.js](https://nodejs.org) (v18 o superior)
2. [Ollama](https://ollama.com) instalado y ejecutándose
3. Al menos un modelo descargado (`ollama pull llama3.1`)

### Pasos

```bash
# 1. Instalar dependencias
npm install

# 2. Copiar archivo de configuración
cp .env.example .env

# 3. Iniciar en modo desarrollo
npm run dev

# 4. Abrir en el navegador
# http://localhost:3000
```

### Configuración

El proyecto usa variables de entorno configuradas en `.env`:

| Variable      | Default                | Descripción                      |
| ------------- | ---------------------- | -------------------------------- |
| `PORT`        | 3000                   | Puerto del servidor              |
| `OLLAMA_HOST` | http://localhost:11434 | URL de Ollama                    |
| `DB_PATH`     | ./data/ollama.db       | Ruta de la base de datos         |
| `NODE_ENV`    | development            | Entorno (development/production) |
| `LOG_LEVEL`   | info                   | Nivel de logging                 |

### Scripts disponibles

| Script          | Comando                 | Descripción                              |
| --------------- | ----------------------- | ---------------------------------------- |
| `dev`           | `npm run dev`           | Servidor + cliente en watch              |
| `dev:server`    | `npm run dev:server`    | Solo servidor en watch                   |
| `dev:client`    | `npm run dev:client`    | Solo cliente en watch                    |
| `build`         | `npm run build`         | Compila todo (shared + server + client)  |
| `build:shared`  | `npm run build:shared`  | Solo tipos compartidos                   |
| `build:server`  | `npm run build:server`  | Solo servidor                            |
| `build:client`  | `npm run build:client`  | Solo cliente                             |
| `start`         | `npm start`             | Producción (`node server/dist/index.js`) |
| `test`          | `npm test`              | Ejecutar tests unitarios                 |
| `test:watch`    | `npm run test:watch`    | Ejecutar tests en modo watch             |
| `test:coverage` | `npm run test:coverage` | Ejecutar tests con cobertura             |

---

## Testing

El proyecto incluye tests unitarios con **Vitest**.

### Ejecutar tests

```bash
# Ejecutar todos los tests
npm test

# Modo watch (recompila automáticamente)
npm run test:watch

# Con cobertura de código
npm run test:coverage

# Tests específicos por tipo
npm run test:server      # Solo tests del servidor
npm run test:client     # Solo tests del cliente
npm run test:unit       # Solo tests unitarios
npm run test:integration # Solo tests de integración
npm run test:e2e        # Solo tests end-to-end
```

### Estructura de los tests

Los tests están organizados en el directorio `tests/`:

```
tests/
├── server/
│   ├── unit/             # Tests unitarios (Chat, Message, validators, middlewares, config)
│   ├── integration/      # Tests de integración (ChatService, routes, database, API)
│   └── e2e/             # Tests end-to-end (Ollama)
│
├── client/
│   └── unit/            # Tests unitarios del cliente (state, tts)
│
└── setup-global.ts      # Configuración global
```

### Cobertura actual

Los tests cubren:

- **Modelos** (Chat, Message): ~100%
- **Validators** (Zod): 100%
- **Estado cliente** (state.ts): Funciones de gestión
- **TTS** (servicio + voces): Funcionalidad de texto a voz

### Añadir nuevos tests

1. Crea un archivo `.test.ts` en `server/src/test/`
2. Sigue el patrón AAA (Arrange, Act, Assert)
3. Ejecuta `npm test` para verificar

Consulta [TESTING.md](./TESTING.md) para una guía completa sobre cómo escribir tests.

---

## Dependencias del Proyecto

### Producción

| Paquete          | Para qué se usa               |
| ---------------- | ----------------------------- |
| `express`        | Framework web HTTP            |
| `better-sqlite3` | Base de datos SQLite          |
| `ollama`         | Cliente de Ollama             |
| `cors`           | Cross-Origin                  |
| `dotenv`         | Variables de entorno          |
| `zod`            | Validación de schemas         |
| `pino`           | Logging estructurado          |
| `openai`         | Integración futura con OpenAI |

### Desarrollo

| Paquete                 | Para qué se usa               |
| ----------------------- | ----------------------------- |
| `typescript`            | Compilador                    |
| `tsx`                   | Ejecutar TS directamente      |
| `concurrently`          | Ejecutar múltiples comandos   |
| `vitest`                | Framework de testing          |
| `@vitest/coverage-v8`   | Cobertura de código           |
| `jsdom`                 | Simulación del DOM para tests |
| `@types/node`           | Tipos Node.js                 |
| `@types/express`        | Tipos Express                 |
| `@types/better-sqlite3` | Tipos SQLite                  |

---

## Resolución de Problemas

### El servidor no inicia

- Verifica que el puerto 3000 esté disponible
- Asegúrate de tener todas las dependencias: `npm install`
- Revisa que la carpeta `data/` exista o puede ser creada

### No recibo respuestas de la IA

- Verifica que Ollama esté en ejecución: `ollama serve`
- Confirma que tienes un modelo instalado: `ollama list`
- Revisa la URL de conexión en la configuración

### Error "Cannot connect to Ollama"

- Si usas Ollama en otra máquina, configura la IP desde la interfaz
- Verifica que el firewall no bloquee el puerto 11434

### Error de micrófono (Speech Recognition)

Si al usar el botón de micrófono aparece un error:

1. **Permiso denegado**: El navegador necesita permiso de micrófono
   - Haz clic en el icono de cámara/micrófono en la barra de direcciones
   - O ve a Configuración → Privacidad → Permisos de micrófono
   - Luego recarga la página e intenta de nuevo

2. **Sin dispositivo de audio**: No hay micrófono conectado
   - Conecta un micrófono (externo o integrado)
   - Verifica en la configuración del sistema que el micrófono esté activo

La aplicación mostrará un modal con instrucciones cuando ocurra este error.

### Errores de compilación

- Ejecuta `npm run build` para ver errores detallados
- Verifica que los imports usen extensión `.js` (requerido por ESM)

---

## Ver la Base de Datos

```bash
# Usando sqlite3 CLI
sqlite3 data/ollama.db

# Ver todas las tablas
.schema

# Ver chats
SELECT * FROM chats;

# Ver mensajes de un chat
SELECT * FROM messages WHERE chat_id = 'id-del-chat';

# Salir
.quit
```

O usa **DB Browser for SQLite** (https://sqlitebrowser.org/).

---

## Flujo Visual

```
┌──────────┐     HTTP      ┌──────────────┐    lógica     ┌──────────────┐
│          │  ──────────►  │              │  ──────────►  │              │
│ Frontend │    fetch()    │    Rutas     │   métodos()   │  Servicios   │
│ (client) │  ◄──────────  │  (routes/)   │  ◄──────────  │ (services/)  │
│          │     JSON      │              │    datos      │              │
└──────────┘               └──────────────┘               └──────┬───────┘
                                                                  │
                                                                  │ usa
                                                                  ▼
                                                           ┌──────────────┐
                                                           │   Modelos    │
                                                           │  (models/)   │
                                                           │  + SQLite    │
                                                           └──────────────┘
```

### Flujo de compilación

```
shared/types/*.ts  ──tsc -p shared──►  shared/dist/*.js

server/src/**/*.ts  ──tsc -p server──►  server/dist/**/*.js

client/src/**/*.ts  ──tsc -p client──►  public/**/*.js
```
