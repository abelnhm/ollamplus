# OllamaUI — Arquitectura Hexagonal

Guía completa del proyecto: estructura, arquitectura hexagonal y cambios aplicados en el refactor.

---

## Índice

1. [¿Qué es la Arquitectura Hexagonal?](#1-qué-es-la-arquitectura-hexagonal)
2. [Los tres conceptos clave](#2-los-tres-conceptos-clave)
3. [Estructura completa del proyecto](#3-estructura-completa-del-proyecto)
4. [Capas explicadas en detalle](#4-capas-explicadas-en-detalle)
   - [Domain (Núcleo)](#41-domain--el-núcleo)
   - [Application (Casos de uso)](#42-application--casos-de-uso)
   - [Infrastructure (Adaptadores secundarios)](#43-infrastructure--adaptadores-secundarios)
   - [Presentation (Adaptadores primarios)](#44-presentation--adaptadores-primarios)
5. [Flujo completo de una petición](#5-flujo-completo-de-una-petición)
6. [API REST disponible](#6-api-rest-disponible)
7. [Cómo arrancar el proyecto](#7-cómo-arrancar-el-proyecto)
8. [Cambios aplicados en el refactor](#8-cambios-aplicados-en-el-refactor)
9. [Guía para extender el proyecto](#9-guía-para-extender-el-proyecto)

---

## 1. ¿Qué es la Arquitectura Hexagonal?

La **Arquitectura Hexagonal** (también llamada _Ports & Adapters_, creada por Alistair Cockburn) es un patrón de diseño cuyo objetivo es **desacoplar el núcleo de negocio de cualquier tecnología externa**: bases de datos, frameworks HTTP, interfaces de usuario, APIs de terceros, etc.

La idea central es representar la aplicación como un hexágono donde:

- El **interior del hexágono** contiene toda la lógica de negocio pura. No sabe nada de Express, de Ollama ni de MongoDB.
- El **exterior del hexágono** son los actores que interactúan con esa lógica: navegadores, consola, servicios externos.
- Las **aristas del hexágono** son los **puertos** — interfaces que definen _cómo_ conectarse al núcleo.
- Los **adaptadores** son las implementaciones concretas de esos puertos: el controlador HTTP es un adaptador, el repositorio en memoria es otro.

```
                        ┌─────────────────────────────┐
  Usuario/Browser  ─────►  Adaptador HTTP (Controller) │
                        │                              │
  CLI / Terminal   ─────►  Adaptador CLI               │   ← Adaptadores PRIMARIOS
                        │                              │     (conducen la aplicación)
                        │   ┌──────────────────────┐   │
                        │   │     APPLICATION      │   │
                        │   │   (Casos de Uso)     │   │
                        │   │                      │   │
                        │   │   ┌──────────────┐   │   │
                        │   │   │    DOMAIN    │   │   │
                        │   │   │  (Entidades  │   │   │
                        │   │   │   Puertos)   │   │   │
                        │   │   └──────────────┘   │   │
                        │   └──────────────────────┘   │
                        │                              │
                        │  Adaptador OllamaAIProvider  ├─────► Ollama API
                        │                              │
  Adaptadores SECUNDARIOS  InMemoryChatRepository      ├─────► (Memoria/BD)
  (sirven a la aplicación) └─────────────────────────────┘
```

### ¿Por qué usarla?

| Beneficio                      | Explicación                                                                                  |
| ------------------------------ | -------------------------------------------------------------------------------------------- |
| **Testabilidad**               | Se puede probar toda la lógica de negocio sin levantar un servidor HTTP ni conectar a Ollama |
| **Intercambiabilidad**         | Se puede cambiar Ollama por OpenAI, o la memoria por MongoDB, sin tocar un solo caso de uso  |
| **Independencia de Framework** | Si Express se deprecase, el núcleo de la app no necesita cambiar                             |
| **Claridad**                   | Cada archivo tiene una única responsabilidad; es obvio dónde añadir cada cosa nueva          |

---

## 2. Los tres conceptos clave

### Puerto (Port)

Un **puerto** es una _interfaz_: un contrato que define qué operaciones se pueden hacer, sin decir cómo. En JavaScript se implementa con clases base que lanzan `throw new Error()` si no son sobreescritas.

Ejemplo — `src/domain/repositories/AIProvider.js`:

```js
export class AIProvider {
  async listModels(url) {
    throw new Error("Debe implementarse");
  }
  async sendMessage(model, messages, url, onChunk) {
    throw new Error("Debe implementarse");
  }
}
```

### Adaptador (Adapter)

Un **adaptador** implementa un puerto concreto. Si el puerto dice _"sé listar modelos"_, el adaptador dice _"para listarlos, llamo a la API de Ollama"_.

Ejemplo — `src/infrastructure/ai-providers/OllamaAIProvider.js`:

```js
export class OllamaAIProvider extends AIProvider {
  async listModels(url) {
    const response = await ollama.list({ host: url });
    return response.models.map(m => ({ name: m.name, ... }));
  }
}
```

### Caso de Uso (Use Case)

Un **caso de uso** orquesta la lógica de negocio. Recibe datos del mundo exterior, interactúa con entidades del dominio a través de los puertos, y devuelve un resultado. Nunca sabe con qué tecnología se ejecuta.

Ejemplo — `SendMessageUseCase` recibe un `chatId` y un `content`, busca el chat en el repositorio, llama al proveedor de IA, guarda el resultado y devuelve los mensajes. No sabe si viene de HTTP o de la consola.

---

## 3. Estructura completa del proyecto

```
IAS-PROJECT/
│
├── index.js                          ← Punto de entrada: arranca el DependencyContainer
├── package.json
│
├── src/                              ← TODO el backend en arquitectura hexagonal
│   │
│   ├── domain/                       ── NÚCLEO ── No depende de nada externo
│   │   ├── entities/
│   │   │   ├── Chat.js               ← Entidad principal: un chat con mensajes
│   │   │   └── Message.js            ← Entidad: un mensaje (rol + contenido)
│   │   ├── repositories/             ← PUERTOS DE SALIDA (interfaces)
│   │   │   ├── AIProvider.js         ← Puerto: contrato para proveedores de IA
│   │   │   └── ChatRepository.js     ← Puerto: contrato para persistir chats
│   │   └── value-objects/            ← Tipos con identidad por su valor
│   │       ├── ChatId.js             ← ID único de chat (UUID)
│   │       ├── MessageId.js          ← ID único de mensaje (UUID)
│   │       ├── MessageRole.js        ← Enum: "user" | "assistant"
│   │       └── ModelName.js          ← Nombre validado de un modelo Ollama
│   │
│   ├── application/                  ── CASOS DE USO ── Orquesta el dominio
│   │   └── use-cases/
│   │       ├── CreateChatUseCase.js          ← Crea un chat nuevo y lo persiste
│   │       ├── DeleteChatUseCase.js          ← Elimina un chat existente
│   │       ├── GetAllChatsUseCase.js         ← Devuelve todos los chats
│   │       ├── GetAvailableModelsUseCase.js  ← Consulta los modelos de Ollama
│   │       ├── GetChatByIdUseCase.js         ← Devuelve un chat por su ID
│   │       └── SendMessageUseCase.js         ← Envía mensaje y recibe respuesta IA
│   │
│   ├── infrastructure/               ── ADAPTADORES SECUNDARIOS ── Sirven al dominio
│   │   ├── ai-providers/
│   │   │   └── OllamaAIProvider.js   ← Implementa AIProvider usando la librería `ollama`
│   │   ├── http/
│   │   │   ├── DependencyContainer.js ← Ensamblador: crea y conecta todas las piezas
│   │   │   └── ExpressServer.js       ← Configura Express, middlewares y archivos estáticos
│   │   └── repositories/
│   │       └── InMemoryChatRepository.js ← Implementa ChatRepository con un Map en RAM
│   │
│   └── presentation/                 ── ADAPTADORES PRIMARIOS ── Conducen la aplicación
│       ├── cli/
│       │   └── CLIChatAdapter.js     ← Adaptador de consola (readline interactivo)
│       ├── controllers/
│       │   ├── ChatController.js     ← Maneja las rutas HTTP de chat
│       │   └── ModelController.js    ← Maneja las rutas HTTP de modelos
│       ├── middlewares/
│       │   ├── errorHandler.js       ← Captura y formatea errores globalmente
│       │   └── logger.js             ← Loguea cada petición con método/ruta/tiempo
│       └── routes/
│           ├── chatRoutes.js         ← Registra las rutas de chat en el router Express
│           └── modelRoutes.js        ← Registra la ruta de modelos en el router Express
│
├── public/                           ← Frontend estático (PWA)
│   ├── index.html                    ← HTML de la SPA
│   ├── app.js                        ← Lógica del frontend (vanilla JS)
│   ├── style.css                     ← Estilos
│   ├── manifest.json                 ← Manifiesto PWA
│   ├── sw.js                         ← Service Worker (caché offline)
│   ├── icons/                        ← Iconos PWA en distintos tamaños
│   └── js/                           ← Módulos frontend (actualmente no usados por app.js)
│       ├── services/
│       │   ├── ChatService.js        ← Cliente HTTP para la API de chat
│       │   └── ModelService.js       ← Cliente HTTP para la API de modelos
│       └── ui/
│           ├── ChatUI.js             ← Componente UI para renderizar mensajes
│           ├── ModelSelector.js      ← Componente UI para el selector de modelos
│           └── utils/
│               ├── LocalStorage.js   ← Utilidades de persistencia en el navegador
│               └── MarkdownRenderer.js ← Renderizador de markdown para mensajes
│
└── generate-icons.js                 ← Script para generar iconos PWA con canvas
```

---

## 4. Capas explicadas en detalle

### 4.1 `domain/` — El núcleo

Es la capa más interna. **No importa nada externo**: ni Express, ni Ollama, ni dotenv. Solo JavaScript puro.

#### Entidades

Las entidades son los objetos con identidad y ciclo de vida propios.

**`Chat.js`**
Representa una conversación. Contiene:

- `id` (ChatId), `model` (ModelName), `title`, `messages[]`, `createdAt`, `lastMessageAt`
- `addMessage(message)` — añade un mensaje y actualiza `lastMessageAt`
- `getOllamaHistory()` — convierte los mensajes al formato que espera Ollama `[{role, content}]`
- `toPrimitives()` — serializa a objeto plano para la respuesta HTTP
- `Chat.create(model, title)` — factory para crear un chat nuevo con ID generado

**`Message.js`**
Representa un mensaje individual:

- `id` (MessageId), `role` (MessageRole), `content`, `timestamp`
- `toOllamaFormat()` — devuelve `{role, content}` para la API de Ollama
- `toPrimitives()` — serializa a objeto plano

#### Value Objects

Los value objects no tienen identidad propia: dos objetos con el mismo valor son iguales.

| Archivo          | Qué valida                                                       |
| ---------------- | ---------------------------------------------------------------- |
| `ChatId.js`      | Que sea un UUID v4 válido (genera uno con `crypto.randomUUID()`) |
| `MessageId.js`   | Igual que ChatId pero para mensajes                              |
| `MessageRole.js` | Que el rol sea exactamente `"user"` o `"assistant"`              |
| `ModelName.js`   | Que el nombre del modelo sea un string no vacío                  |

#### Puertos (interfaces)

**`ChatRepository.js`** — define qué operaciones de persistencia existen:

- `save(chat)`, `findById(chatId)`, `findAll()`, `delete(chatId)`, `exists(chatId)`

**`AIProvider.js`** — define qué operaciones de IA existen:

- `listModels(url)` — listar modelos disponibles
- `sendMessage(model, messages, url, onChunk)` — enviar mensaje con streaming

> La clave: el dominio **define** estos contratos, la infraestructura los **implementa**. Nunca al revés.

---

### 4.2 `application/` — Casos de Uso

Cada archivo es un caso de uso: una acción de usuario concreta. Reciben sus dependencias por inyección (repositorios, proveedores) y orquestan entidades del dominio.

| Caso de Uso                 | Qué hace                                                                                                                                                   |
| --------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `CreateChatUseCase`         | Valida `model` y `title`, crea `Chat.create(...)`, lo guarda en el repositorio                                                                             |
| `DeleteChatUseCase`         | Verifica que el chat exista, luego llama a `repository.delete(chatId)`                                                                                     |
| `GetAllChatsUseCase`        | Llama a `repository.findAll()` y serializa los resultados                                                                                                  |
| `GetAvailableModelsUseCase` | Valida la URL, llama a `aiProvider.listModels(url)`                                                                                                        |
| `GetChatByIdUseCase`        | Llama a `repository.findById(chatId)`, retorna `null` si no existe                                                                                         |
| `SendMessageUseCase`        | Busca el chat, crea el mensaje de usuario, llama a `aiProvider.sendMessage(...)` con streaming, crea el mensaje del asistente y guarda el chat actualizado |

```
┌─────────────────────────────────────────────────────────┐
│                    SendMessageUseCase                    │
│                                                         │
│  1. chatRepository.findById(chatId)  → Chat            │
│  2. new Message(user, content)       → userMessage     │
│  3. chat.addMessage(userMessage)                        │
│  4. aiProvider.sendMessage(...)      → streaming        │
│  5. new Message(assistant, resp)     → assistantMessage│
│  6. chat.addMessage(assistantMessage)                   │
│  7. chatRepository.save(chat)                           │
│  8. return { userMessage, assistantMessage, chat }      │
└─────────────────────────────────────────────────────────┘
```

Los casos de uso **no saben** si el `chatRepository` es una base de datos o un `Map` en memoria, ni si `aiProvider` es Ollama u OpenAI.

---

### 4.3 `infrastructure/` — Adaptadores Secundarios

Implementan los puertos del dominio usando tecnologías concretas.

**`OllamaAIProvider.js`**
Implementa `AIProvider` usando la librería npm `ollama`:

- `listModels(url)` → `ollama.list({ host: url })`
- `sendMessage(model, messages, url, onChunk)` → `ollama.chat({ stream: true })` con iteración `for await`

**`InMemoryChatRepository.js`**
Implementa `ChatRepository` con un `Map<string, Chat>` en RAM.

- Perfecta para desarrollo y demos. Para producción se sustituiría por una implementación MongoDB/SQLite sin cambiar nada en la capa de aplicación.

**`ExpressServer.js`**
Encapsula la configuración de Express:

- Registra middlewares: `cors`, `express.json`, `logger`, `express.static("public")`
- Expone `registerRoutes(basePath, router)` y `registerErrorHandler()`
- Expone `start()` que llama a `app.listen()`

**`DependencyContainer.js`**
Es el ensamblador de toda la aplicación. Crea las instancias en el orden correcto e inyecta las dependencias:

```
InMemoryChatRepository
OllamaAIProvider
  ↓ inyectados en ↓
CreateChatUseCase, SendMessageUseCase, DeleteChatUseCase, ...
  ↓ inyectados en ↓
ChatController, ModelController
  ↓ registrados en ↓
ExpressServer (rutas /api)
```

> `DependencyContainer` es el único lugar de todo el proyecto donde se instancian dependencias concretas. Cambiar Ollama por OpenAI solo requiere modificar este archivo.

---

### 4.4 `presentation/` — Adaptadores Primarios

Son los puntos de entrada al sistema: reciben estímulos del exterior y los traducen a llamadas a los casos de uso.

**`ChatController.js`**
Maneja las peticiones HTTP relacionadas con chats. Cada método corresponde a una ruta:

| Método        | Ruta                             | Caso de Uso                          |
| ------------- | -------------------------------- | ------------------------------------ |
| `createChat`  | `POST /api/new-chat`             | `CreateChatUseCase`                  |
| `sendMessage` | `POST /api/chat/:chatId/message` | `SendMessageUseCase` (SSE streaming) |
| `getAllChats` | `GET /api/chats`                 | `GetAllChatsUseCase`                 |
| `getChatById` | `GET /api/chats/:chatId`         | `GetChatByIdUseCase`                 |
| `deleteChat`  | `DELETE /api/chats/:chatId`      | `DeleteChatUseCase`                  |

**`ModelController.js`**
Un único método `getModels` → `POST /api/models` → `GetAvailableModelsUseCase`.

**`CLIChatAdapter.js`**
Adaptador de consola interactiva. Usa `readline` de Node.js para leer mensajes del usuario y los pasa a `SendMessageUseCase`. Imprime la respuesta en streaming con `process.stdout.write()`. Equivale funcionalmente al antiguo `feature/Ollama/ollama-local.js`, pero ahora usa toda la arquitectura del dominio.

**`middlewares/logger.js`**
Intercepta cada petición y loguea: `GET /api/chats - 200 (12ms)`.

**`middlewares/errorHandler.js`**
Middleware de Express de cuatro parámetros (`err, req, res, next`). Captura cualquier error no controlado y responde con JSON. En entorno `development` incluye el stack trace.

**`routes/chatRoutes.js` y `routes/modelRoutes.js`**
Crean un `express.Router()` y registran los métodos del controlador correspondiente. Al ser funciones que reciben el controlador, se pueden reutilizar fácilmente en tests.

---

## 5. Flujo completo de una petición

### Ejemplo: el usuario escribe un mensaje y pulsa "Enviar"

```
Browser (public/app.js)
  │
  │  POST /api/chat/{chatId}/message
  │  Body: { content: "¿Qué es Docker?", ollamaUrl: "http://localhost:11434" }
  │
  ▼
ExpressServer (Express middleware pipeline)
  │  cors → express.json → logger
  ▼
chatRoutes.js
  │  router.post("/chat/:chatId/message", chatController.sendMessage)
  ▼
ChatController.sendMessage
  │  Configura cabeceras SSE (text/event-stream)
  │  Extrae chatId, content, ollamaUrl del request
  ▼
SendMessageUseCase.execute({ chatId, content, ollamaUrl, onChunk })
  │
  ├─► InMemoryChatRepository.findById(chatId)  → Chat entity
  │
  ├─► new Message(MessageId.generate(), MessageRole.USER, content)
  │
  ├─► chat.addMessage(userMessage)
  │
  ├─► OllamaAIProvider.sendMessage(model, history, ollamaUrl, onChunk)
  │     │
  │     │  for await (part of ollama.chat({ stream: true }))
  │     │    onChunk(part.message.content)
  │     │      │
  │     │      └──► ChatController escribe: data: {"chunk":"Do","done":false}\n\n
  │     │           (el browser va recibiendo y renderizando en tiempo real)
  │     │
  │     └──► devuelve fullResponse
  │
  ├─► new Message(MessageId.generate(), MessageRole.ASSISTANT, fullResponse)
  ├─► chat.addMessage(assistantMessage)
  └─► InMemoryChatRepository.save(chat)
  │
  ▼
ChatController escribe: data: {"done":true, "fullResponse":"..."}\n\n
  │
  ▼
Browser recibe "done:true" → actualiza la lista de chats en el sidebar
```

---

## 6. API REST disponible

### Chats

| Método   | Ruta                        | Body                      | Descripción                                |
| -------- | --------------------------- | ------------------------- | ------------------------------------------ |
| `POST`   | `/api/new-chat`             | `{ model, title }`        | Crea un chat nuevo                         |
| `GET`    | `/api/chats`                | —                         | Lista todos los chats                      |
| `GET`    | `/api/chats/:chatId`        | —                         | Obtiene un chat con sus mensajes           |
| `DELETE` | `/api/chats/:chatId`        | —                         | Elimina un chat                            |
| `POST`   | `/api/chat/:chatId/message` | `{ content, ollamaUrl? }` | Envía mensaje (responde con SSE streaming) |

### Modelos

| Método | Ruta          | Body            | Descripción                            |
| ------ | ------------- | --------------- | -------------------------------------- |
| `POST` | `/api/models` | `{ ollamaUrl }` | Lista los modelos instalados en Ollama |

### Formato de respuesta estándar

```json
// Éxito
{ "success": true, "chat": { "id": "...", "model": "llama3", "title": "...", "messages": [] } }

// Error
{ "error": "Descripción del error" }

// Streaming SSE (por fragmento)
data: {"chunk": "Ho", "done": false}
data: {"chunk": "la", "done": false}
data: {"done": true, "fullResponse": "Hola, ¿en qué puedo ayudarte?"}
```

---

## 7. Cómo arrancar el proyecto

### Requisitos previos

- Node.js 18+
- [Ollama](https://ollama.com/) instalado y corriendo: `ollama serve`
- Al menos un modelo descargado: `ollama pull llama3`

### Instalación

```bash
npm install
```

### Iniciar el servidor web

```bash
npm start
# o en modo watch (recarga automática):
npm run dev
```

Abre `http://localhost:3000` en el navegador.

### Variables de entorno (opcional)

Crea un archivo `.env` en la raíz:

```env
PORT=3000
OLLAMA_MODEL=llama3
```

### Modo CLI interactivo

Para usar el chat directamente desde la terminal sin navegador:

```js
// cli.js (crear este archivo en la raíz)
import { startInteractiveCLIChat } from "./src/presentation/cli/CLIChatAdapter.js";
startInteractiveCLIChat("llama3");
```

```bash
node cli.js
```

### Generar iconos PWA

```bash
npm run generate-icons
```

---

## 8. Cambios aplicados en el refactor

### El problema original

`index.js` arrancaba directamente `feature/Ollama/ollama-ui.js`, un servidor Express monolítico de ~200 líneas que mezclaba:

- Configuración HTTP (rutas, middlewares)
- Lógica de negocio (gestión de sesiones, histórico)
- Acceso directo a la librería `ollama`

Toda la arquitectura hexagonal que existía en `src/` **nunca se ejecutaba**: el `DependencyContainer` nunca se instanciaba.

Además, `DependencyContainer.js` y `ExpressServer.js` tenían imports con rutas incorrectas que producirían errores al intentar usarlos.

---

### Cambios archivo por archivo

#### `index.js` — Punto de entrada

**Antes:**

```js
import { startChatServer } from "./feature/Ollama/ollama-ui.js";
startChatServer(3000);
```

**Después:**

```js
import { DependencyContainer } from "./src/infrastructure/http/DependencyContainer.js";
const PORT = process.env.PORT || 3000;
const container = new DependencyContainer(PORT);
container.start();
```

El servidor ahora usa toda la arquitectura hexagonal. Se respeta la variable de entorno `PORT`.

---

#### `src/infrastructure/http/DependencyContainer.js` — Ensamblador

**Problema:** Todos los imports apuntaban a rutas que no existían (`../infrastructure/...` desde dentro de `infrastructure/`, `../presentation/...` desde `infrastructure/`).

**Corrección:** Todas las rutas relativas fueron corregidas:

- `../infrastructure/repositories/` → `../repositories/`
- `../infrastructure/ai-providers/` → `../ai-providers/`
- `../application/use-cases/` → `../../application/use-cases/`
- `../presentation/controllers/` → `../../presentation/controllers/`
- `../infrastructure/http/ExpressServer.js` → `./ExpressServer.js`

**Añadido:** Importa e inyecta el nuevo `DeleteChatUseCase`.

---

#### `src/infrastructure/http/ExpressServer.js` — Servidor HTTP

**Problema:** Los imports de middlewares apuntaban a `../presentation/middlewares/` (un nivel incorrecto).

**Corrección:** `../presentation/middlewares/` → `../../presentation/middlewares/`

---

#### `src/presentation/controllers/ChatController.js` — Controlador

**Antes:** No tenía `deleteChat`. `getAllChats` y `getChatById` devolvían `{ chats }` y `{ chat }` sin `success: true`.

**Después:**

- Constructor acepta un quinto argumento `deleteChatUseCase`
- Nuevo método `deleteChat` para `DELETE /api/chats/:chatId`
- `getAllChats` devuelve `{ success: true, chats }`
- `getChatById` devuelve `{ success: true, chat }`

El formato `{ success: true }` es necesario para que `public/app.js` identifique respuestas exitosas.

---

#### `src/presentation/routes/chatRoutes.js` — Rutas

**Añadido:**

```js
router.delete("/chats/:chatId", chatController.deleteChat);
```

---

#### `src/application/use-cases/DeleteChatUseCase.js` — Nuevo archivo

Caso de uso que verifica la existencia del chat y lo elimina del repositorio. Lanza error con el texto `"no encontrado"` si el ID no existe (el controlador lo mapea a HTTP 404).

---

#### `src/presentation/cli/CLIChatAdapter.js` — Nuevo archivo

Reemplaza la función `startInteractiveChat()` del antiguo `feature/Ollama/ollama-local.js`. A diferencia del original, **no llama a Ollama directamente**: delega en `CreateChatUseCase` y `SendMessageUseCase`, respetando la arquitectura hexagonal.

---

#### `public/app.js` — Frontend

Cuatro ajustes para adaptarse a la nueva API:

| #   | Cambio                                                                                     | Motivo                                                                                    |
| --- | ------------------------------------------------------------------------------------------ | ----------------------------------------------------------------------------------------- |
| 1   | `POST /api/chat` → `POST /api/chat/${sessionId}/message` con body `{ content, ollamaUrl }` | La nueva ruta incluye el `chatId` en la URL                                               |
| 2   | `createNewChatWithModel` usa el `id` retornado por el servidor como `sessionId`            | Antes generaba el ID en el cliente; ahora el servidor lo genera con `crypto.randomUUID()` |
| 3   | `clearChat` ya no llama a `POST /api/clear`                                                | El endpoint `/api/clear` no existe en la nueva API; limpiar la UI local es suficiente     |
| 4   | `loadChat` usa `chat.messages` en lugar de `chat.history`                                  | El campo en la respuesta del nuevo backend se llama `messages`                            |

---

#### `feature/` — Eliminado

El directorio `feature/Ollama/` fue eliminado completamente. Su lógica fue distribuida así:

| Archivo original                  | Destino                                                                |
| --------------------------------- | ---------------------------------------------------------------------- |
| `ollama-ui.js` (servidor HTTP)    | Sustituido por `DependencyContainer` + `ExpressServer` + controladores |
| `ollama-ui.js` (clase OllamaChat) | Sustituido por entidades `Chat` y `Message` del dominio                |
| `ollama-local.js` (chat CLI)      | Sustituido por `CLIChatAdapter.js`                                     |

---

## 9. Guía para extender el proyecto

### Añadir un nuevo proveedor de IA (ej. OpenAI)

1. Crear `src/infrastructure/ai-providers/OpenAIProvider.js` que extienda `AIProvider`
2. Implementar `listModels(url)` y `sendMessage(model, messages, url, onChunk)`
3. En `DependencyContainer.js`, cambiar `new OllamaAIProvider()` por `new OpenAIProvider()`

**Ninguna otra capa necesita cambiar.**

### Añadir persistencia real (ej. SQLite)

1. Crear `src/infrastructure/repositories/SQLiteChatRepository.js` que extienda `ChatRepository`
2. Implementar los métodos del puerto
3. En `DependencyContainer.js`, cambiar `new InMemoryChatRepository()` por `new SQLiteChatRepository()`

**Ningún caso de uso necesita cambiar.**

### Añadir un nuevo caso de uso (ej. renombrar chat)

1. Crear `src/application/use-cases/RenameChatUseCase.js`
2. Añadir el método `updateTitle(newTitle)` a la entidad `Chat` si no existe
3. Inyectarlo en `DependencyContainer` y pasarlo al controlador
4. Añadir el método en `ChatController` y la ruta en `chatRoutes.js`

### Añadir un adaptador WebSocket

1. Crear `src/presentation/websocket/WebSocketAdapter.js`
2. Recibir `sendMessageUseCase` por inyección
3. En cada mensaje WebSocket recibido, llamar a `sendMessageUseCase.execute(...)`

**El caso de uso no sabe si viene de HTTP, WebSocket o CLI.**
