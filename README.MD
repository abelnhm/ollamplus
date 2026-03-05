# OllamaUI — Chat con IA usando Arquitectura por Capas

## ¿Qué es este proyecto?

Una aplicación web **completa** (frontend + backend) que te permite chatear con modelos de inteligencia artificial ejecutados localmente con [Ollama](https://ollama.com). Funciona como un "ChatGPT local" en tu propia máquina.

**Características:**

- Múltiples conversaciones simultáneas
- Respuestas en tiempo real (streaming)
- Selección de modelos de IA instalados
- Exportar conversaciones a Markdown
- Interfaz responsiva (móvil y escritorio)
- Modo oscuro
- PWA (Progressive Web App)

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
├── index.js                    # Punto de entrada — arranca el servidor
├── package.json                # Dependencias y scripts de npm
│
├── src/                        # === BACKEND (Node.js + Express) ===
│   │
│   ├── server.js               # Configura Express y conecta todas las capas
│   │
│   ├── models/                 # CAPA 1: Modelos de datos
│   │   ├── Chat.js             #   → Estructura de una conversación
│   │   └── Message.js          #   → Estructura de un mensaje
│   │
│   ├── services/               # CAPA 2: Lógica de negocio
│   │   ├── ChatService.js      #   → CRUD de chats + agregar mensajes
│   │   └── OllamaService.js    #   → Comunicación con la API de Ollama
│   │
│   ├── routes/                 # CAPA 3: Rutas HTTP (endpoints)
│   │   ├── chatRoutes.js       #   → POST/GET/DELETE para chats
│   │   └── modelRoutes.js      #   → POST para obtener modelos
│   │
│   └── middlewares/            # Funciones auxiliares de Express
│       ├── logger.js           #   → Registra cada petición en consola
│       └── errorHandler.js     #   → Captura errores y responde JSON
│
└── public/                     # === FRONTEND (HTML/CSS/JS) ===
    ├── index.html              # Página principal
    ├── app.js                  # Lógica del frontend (DOM, eventos, fetch)
    ├── style.css               # Estilos (diseño responsivo, dark mode)
    ├── sw.js                   # Service Worker (cache para PWA)
    ├── manifest.json           # Configuración PWA
    └── icons/                  # Iconos de la aplicación
```

---

## Explicación Capa por Capa

### CAPA 1: Modelos (`src/models/`)

Los modelos definen **la forma de los datos**. No tienen lógica compleja, solo representan "cosas" del mundo real.

#### `Chat.js` — Una conversación

```javascript
// Un chat tiene:
//   - id: identificador único (UUID generado automáticamente)
//   - model: nombre del modelo de IA (ej: "llama2")
//   - title: título de la conversación
//   - messages: array de mensajes
//   - createdAt: fecha de creación
//   - lastMessageAt: fecha del último mensaje

const chat = new Chat({ model: "llama2", title: "Mi primer chat" });
chat.addMessage(message); // Agregar un mensaje
chat.getHistory(); // Obtener historial para Ollama
chat.toJSON(); // Convertir a objeto plano (para HTTP)
```

#### `Message.js` — Un mensaje

```javascript
// Un mensaje tiene:
//   - id: identificador único
//   - role: "user" | "assistant" | "system"
//   - content: texto del mensaje
//   - timestamp: fecha y hora

const msg = new Message({ role: "user", content: "Hola, ¿cómo estás?" });
msg.toJSON(); // { id: "abc-123", role: "user", content: "Hola...", timestamp: "..." }
```

**Pregunta para pensar**: ¿Por qué `Chat.toJSON()` convierte las fechas a string con `.toISOString()`? Porque JSON no puede representar objetos `Date` directamente — necesitan convertirse a texto.

---

### CAPA 2: Servicios (`src/services/`)

Los servicios contienen **la lógica de negocio**. Aquí ocurren las operaciones importantes: crear chats, enviar mensajes, comunicarse con Ollama.

#### `ChatService.js` — Gestión de chats

```javascript
const chatService = new ChatService();

// Crear un chat
const chat = chatService.create("llama2", "Mi chat");

// Obtener un chat por ID
const found = chatService.getById("abc-123");

// Listar todos los chats
const all = chatService.getAll();

// Agregar un mensaje a un chat
chatService.addMessage("abc-123", "user", "Hola");

// Eliminar un chat
chatService.delete("abc-123");
```

Internamente usa un `Map()` como almacenamiento en memoria. En un proyecto real, esto se reemplazaría por una base de datos (MongoDB, PostgreSQL, etc.).

#### `OllamaService.js` — Comunicación con la IA

```javascript
const ollamaService = new OllamaService();

// Obtener modelos instalados
const models = await ollamaService.listModels("http://localhost:11434");
// → [{ name: "llama2", size: 3826793472, modified_at: "..." }]

// Enviar mensaje con streaming
const response = await ollamaService.sendMessage(
  "llama2", // modelo
  [{ role: "user", content: "Hola" }], // historial
  "http://localhost:11434", // URL de Ollama
  (chunk) => console.log(chunk), // callback por cada fragmento
);
```

**Concepto clave — Streaming**: En lugar de esperar a que el modelo genere TODA la respuesta (que puede tardar segundos o minutos), recibimos la respuesta **palabra por palabra** usando `for await...of`. Esto permite mostrarla en tiempo real en la interfaz.

---

### CAPA 3: Rutas (`src/routes/`)

Las rutas traducen **peticiones HTTP → llamadas a servicios → respuestas JSON**.

#### `chatRoutes.js` — API de chats

| Método   | Ruta                        | Descripción                   |
| -------- | --------------------------- | ----------------------------- |
| `POST`   | `/api/new-chat`             | Crea un nuevo chat            |
| `POST`   | `/api/chat/:chatId/message` | Envía mensaje (streaming SSE) |
| `GET`    | `/api/chats`                | Lista todos los chats         |
| `GET`    | `/api/chats/:chatId`        | Obtiene un chat por ID        |
| `DELETE` | `/api/chats/:chatId`        | Elimina un chat               |

#### `modelRoutes.js` — API de modelos

| Método | Ruta          | Descripción                         |
| ------ | ------------- | ----------------------------------- |
| `POST` | `/api/models` | Lista modelos de Ollama disponibles |

#### Ejemplo de flujo completo

```
1. El usuario escribe "Hola" en el navegador
2. El frontend hace: POST /api/chat/abc-123/message { content: "Hola" }
3. La RUTA (chatRoutes.js) recibe la petición
4. La ruta llama al SERVICIO: chatService.addMessage("abc-123", "user", "Hola")
5. La ruta llama al SERVICIO: ollamaService.sendMessage(...)
6. Ollama responde en streaming → la ruta reenvía cada fragmento al frontend
7. La ruta llama al SERVICIO: chatService.addMessage("abc-123", "assistant", respuesta)
8. El frontend muestra la respuesta palabra por palabra
```

---

### Middlewares (`src/middlewares/`)

Los middlewares son funciones que se ejecutan **antes** (o después) de cada petición. Express los ejecuta en orden.

```
Petición → logger → cors → json → RUTA → errorHandler → Respuesta
```

- **`logger.js`**: Imprime en consola cada petición (método, ruta, código de estado, duración).
- **`errorHandler.js`**: Si alguna ruta lanza un error no manejado, este middleware lo captura y devuelve una respuesta JSON con el error. Debe registrarse **siempre al final**.

---

### `server.js` — El pegamento

Este archivo conecta todas las capas:

```javascript
// 1. Crear la app Express
const app = express();

// 2. Registrar middlewares
app.use(cors()); // Permitir peticiones de otros orígenes
app.use(express.json()); // Parsear body JSON de las peticiones
app.use(logger); // Registrar peticiones en consola
app.use(express.static("public")); // Servir el frontend

// 3. Crear servicios (CAPA 2)
const chatService = new ChatService();
const ollamaService = new OllamaService();

// 4. Crear rutas pasándoles los servicios (CAPA 3 usa CAPA 2)
app.use("/api", createChatRoutes(chatService, ollamaService));
app.use("/api", createModelRoutes(ollamaService));

// 5. Manejo de errores (siempre al final)
app.use(errorHandler);

// 6. Arrancar
app.listen(port);
```

---

## ¿Cómo funciona el Frontend?

El frontend es una aplicación **HTML/CSS/JavaScript pura** (sin frameworks). Vive en la carpeta `public/` y Express la sirve como archivos estáticos.

### `index.html`

Estructura HTML con sidebar de chats, selector de modelos, área de mensajes, input de texto y modal de configuración.

### `app.js`

Toda la lógica del frontend en un solo archivo:

- **Eventos DOM**: Clicks en botones, envío con Enter, cambio de modelo
- **Fetch API**: Comunicación con el backend (`/api/chats`, `/api/models`, etc.)
- **Streaming con ReadableStream**: Lee la respuesta del servidor palabra por palabra
- **Renderizado Markdown**: Usa `marked.js` y `highlight.js` para formatear respuestas
- **Dark mode**: Alterna entre temas claro y oscuro con localStorage
- **Configuración de Ollama**: Permite cambiar host/puerto de conexión

### `style.css`

Diseño responsivo mobile-first con variables CSS al estilo shadcn/ui. Soporta modo claro y oscuro.

### `sw.js`

Service Worker que cachea archivos para funcionamiento offline (PWA).

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

Los servicios se crean en `server.js` y se pasan como parámetros a las rutas:

```javascript
createChatRoutes(chatService, ollamaService);
```

Las rutas no crean sus propias dependencias — las reciben. Esto permite:

- Testear las rutas con servicios "falsos" (mocks)
- Cambiar la implementación sin modificar las rutas

### 3. Separación Frontend / Backend

El frontend es 100% estático (HTML/CSS/JS) y se comunica con el backend solo mediante `fetch()` a la API REST. Podrías reemplazar el frontend por React, Vue o cualquier otro framework sin tocar el backend.

### 4. Map como almacenamiento temporal

```javascript
#chats = new Map();
```

`Map` es una estructura de datos de JavaScript ideal para almacenamiento clave-valor. Es más rápido que un objeto para operaciones frecuentes de inserción/eliminación. Los datos se pierden al reiniciar el servidor — en producción se usaría una base de datos.

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

# 2. Iniciar en modo desarrollo (con auto-reload)
npm run dev

# 3. Abrir en el navegador
# http://localhost:3000
```

### Scripts disponibles

| Script  | Comando       | Descripción                                         |
| ------- | ------------- | --------------------------------------------------- |
| `dev`   | `npm run dev` | Inicia con `--watch` (reinicia al cambiar archivos) |
| `start` | `npm start`   | Inicia en modo producción                           |

---

## Ejercicios para Practicar

### Nivel Básico

1. **Agrega un endpoint** `GET /api/chats/count` que devuelva el número total de chats.
2. **Agrega una propiedad** `updatedAt` al modelo `Chat` que se actualice cada vez que se modifica el título.
3. **Modifica el logger** para que muestre también la IP del cliente (`req.ip`).

### Nivel Intermedio

4. **Implementa un método** `clearMessages(chatId)` en `ChatService` que elimine todos los mensajes de un chat sin borrar el chat.
5. **Agrega validaciones** al crear un chat: el título debe tener entre 3 y 100 caracteres, y el nombre del modelo no puede estar vacío.
6. **Crea un nuevo endpoint** `PUT /api/chats/:chatId` en `chatRoutes.js` que permita renombrar un chat (cambiar su título).

### Nivel Avanzado

7. **Reemplaza el Map** del `ChatService` por una base de datos SQLite usando la librería `better-sqlite3`.
8. **Agrega autenticación** básica con un middleware que verifique un token en el header `Authorization`.
9. **Escribe tests unitarios** para `ChatService` usando Node.js test runner (`node --test`).

---

## Dependencias del Proyecto

| Paquete   | Para qué se usa                                         |
| --------- | ------------------------------------------------------- |
| `express` | Framework web para crear el servidor HTTP y las rutas   |
| `cors`    | Permitir peticiones desde otros orígenes (Cross-Origin) |
| `ollama`  | Librería oficial para comunicarse con la API de Ollama  |
| `dotenv`  | Cargar variables de entorno desde un archivo `.env`     |
| `canvas`  | Generación de iconos para la PWA                        |
| `openai`  | Disponible para integración futura con OpenAI           |

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
                                                          │  Chat.js     │
                                                          │  Message.js  │
                                                          └──────────────┘
```
