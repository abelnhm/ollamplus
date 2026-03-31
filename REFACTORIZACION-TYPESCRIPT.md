# Documentación de Refactorización a TypeScript

## Índice

1. [Resumen](#resumen)
2. [Motivación](#motivación)
3. [Cambios Realizados](#cambios-realizados)
4. [Estructura del Proyecto](#estructura-del-proyecto)
5. [Configuración de TypeScript](#configuración-de-typescript)
6. [Frontend: client/ → public/app.js](#frontend-client--publicappjs)
7. [Dependencias Añadidas](#dependencias-añadidas)
8. [Scripts Actualizados](#scripts-actualizados)
9. [Detalle por Archivo](#detalle-por-archivo)
10. [Interfaces y Tipos Creados](#interfaces-y-tipos-creados)
11. [Cambios Técnicos Relevantes](#cambios-técnicos-relevantes)
12. [Cómo Compilar y Ejecutar](#cómo-compilar-y-ejecutar)

---

## Resumen

Se realizó la migración completa del backend del proyecto **IAS-PROJECT** de **JavaScript (ES Modules)** a **TypeScript**, manteniendo la misma arquitectura por capas y funcionalidad existente. Todos los archivos `.js` del servidor fueron reemplazados por sus equivalentes `.ts` con tipado estricto.

> **Nota:** El frontend también se migró a TypeScript. El código fuente está en `client/app.ts` y se compila a `public/app.js` mediante un `tsconfig.json` propio en `client/`. Los archivos estáticos restantes de `public/` (HTML, CSS, SW, manifest) no fueron modificados.

---

## Motivación

- **Seguridad de tipos:** Detectar errores en tiempo de compilación en lugar de en tiempo de ejecución.
- **Mejor autocompletado e IntelliSense:** Los editores (VS Code) ofrecen mejor soporte con TypeScript.
- **Documentación implícita:** Las interfaces y tipos sirven como documentación de las estructuras de datos.
- **Mantenibilidad:** Un proyecto tipado es más fácil de mantener y refactorizar a medida que crece.

---

## Cambios Realizados

### Archivos eliminados (JavaScript original)

| Archivo eliminado                 | Reemplazado por                   |
| --------------------------------- | --------------------------------- |
| `index.js`                        | `index.ts`                        |
| `generate-icons.js`               | `generate-icons.ts`               |
| `src/server.js`                   | `src/server.ts`                   |
| `src/models/Chat.js`              | `src/models/Chat.ts`              |
| `src/models/Message.js`           | `src/models/Message.ts`           |
| `src/services/ChatService.js`     | `src/services/ChatService.ts`     |
| `src/services/OllamaService.js`   | `src/services/OllamaService.ts`   |
| `src/routes/chatRoutes.js`        | `src/routes/chatRoutes.ts`        |
| `src/routes/modelRoutes.js`       | `src/routes/modelRoutes.ts`       |
| `src/middlewares/errorHandler.js` | `src/middlewares/errorHandler.ts` |
| `src/middlewares/logger.js`       | `src/middlewares/logger.ts`       |

### Archivos nuevos creados

| Archivo         | Descripción                             |
| --------------- | --------------------------------------- |
| `tsconfig.json` | Configuración del compilador TypeScript |

---

## Estructura del Proyecto

```
OllamPlus/
├── package.json                    ← Dependencias y scripts
├── tsconfig.json                   ← Configuración base TypeScript
├── .env.example                    ← Template de variables de entorno
│
├── server/                         ← Backend (Node.js + Express + SQLite)
│   ├── src/
│   │   ├── index.ts              ← Punto de entrada del servidor
│   │   ├── config.ts             ← Carga de variables de entorno
│   │   ├── models/               ← Modelos de datos
│   │   │   ├── Chat.ts
│   │   │   └── Message.ts
│   │   ├── services/             ← Lógica de negocio
│   │   │   ├── ChatService.ts
│   │   │   ├── OllamaService.ts
│   │   │   └── database.ts
│   │   ├── routes/               ← Endpoints HTTP
│   │   │   ├── chatRoutes.ts
│   │   │   └── modelRoutes.ts
│   │   ├── validators/           ← Validación con Zod
│   │   │   └── chatValidator.ts
│   │   ├── db/                   ← Base de datos y migraciones
│   │   │   └── migrations.ts
│   │   └── middlewares/          ← Express middlewares
│   │       ├── logger.ts
│   │       └── errorHandler.ts
│   └── dist/                     ← Backend compilado
│
├── client/                        ← Frontend (TypeScript → JS)
│   ├── app.ts                    ← Entry point
│   ├── types.ts                  ← Interfaces
│   ├── state.ts                  ← Estado global
│   ├── api.ts                    ← Cliente HTTP
│   ├── utils.ts                  ← Utilidades
│   ├── ui/                       ← Capa de presentación
│   │   ├── elements.ts
│   │   ├── messages.ts
│   │   ├── sidebar.ts
│   │   ├── theme.ts
│   │   ├── settings.ts
│   │   └── modalAlert.ts        ← Modal de alertas
│   ├── services/                ← Lógica del cliente
│   │   ├── chatService.ts
│   │   ├── modelService.ts
│   │   ├── modelParams.ts
│   │   ├── systemPrompt.ts
│   │   ├── tokenService.ts
│   │   ├── exportService.ts
│   │   ├── importService.ts
│   │   ├── templateService.ts
│   │   ├── ttsService.ts        ← Texto a voz
│   │   ├── ttsVoices.ts        ← Gestión de voces TTS
│   │   ├── sttService.ts       ← Voz a texto
│   │   └── fileAttachment.ts
│   └── tsconfig.json
│
├── shared/                       ← Tipos compartidos
│   ├── types/
│   │   ├── chat.ts
│   │   ├── message.ts
│   │   ├── api.ts
│   │   └── index.ts
│   └── dist/
│
├── public/                       ← Archivos estáticos servidos
│   ├── index.html
│   ├── style.css
│   ├── app.js                   ← ⚙️ Generado desde client/app.ts
│   ├── services/               ← ⚙️ Servicios compilados
│   │   ├── chatService.js
│   │   ├── sttService.js
│   │   ├── ttsService.js
│   │   └── ...
│   └── img/
│
├── data/                        ← Base de datos SQLite
│   └── ollama.db
│
├── vitest.config.ts             ← Configuración de tests
└── tsconfig.json               ← Configuración base TypeScript
```

---

## Configuración de TypeScript

Archivo `tsconfig.json`:

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "Node16",
    "moduleResolution": "Node16",
    "outDir": "./dist",
    "rootDir": ".",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "resolveJsonModule": true,
    "declaration": true,
    "declarationMap": true,
    "sourceMap": true
  },
  "include": ["src/**/*", "index.ts", "generate-icons.ts"],
  "exclude": ["node_modules", "dist", "public"]
}
```

> **Importante:** Este `tsconfig.json` excluye `public/` y `client/` — solo compila el backend. El frontend tiene su propia configuración en `client/tsconfig.json` (ver [sección 6](#frontend-client--publicappjs)).

### Opciones clave explicadas

| Opción             | Valor    | Razón                                                |
| ------------------ | -------- | ---------------------------------------------------- |
| `target`           | `ES2022` | Soporte para top-level await y features modernas     |
| `module`           | `Node16` | Compatible con ESM en Node.js (`"type": "module"`)   |
| `moduleResolution` | `Node16` | Resolución de módulos estilo Node.js moderno         |
| `strict`           | `true`   | Habilita todas las verificaciones estrictas de tipos |
| `esModuleInterop`  | `true`   | Permite importar módulos CommonJS con sintaxis ESM   |
| `outDir`           | `./dist` | Los archivos compilados se generan en `dist/`        |
| `declaration`      | `true`   | Genera archivos `.d.ts` para cada módulo             |
| `sourceMap`        | `true`   | Genera source maps para depuración                   |

---

## Frontend: client/ → public/app.js

El archivo `public/app.js` que carga el navegador **ya no se escribe a mano**. Se genera automáticamente compilando el código TypeScript en `client/app.ts`.

### ¿Por qué un tsconfig separado?

El backend y el frontend tienen necesidades de compilación incompatibles:

| Aspecto | Backend (`tsconfig.json`) | Frontend (`client/tsconfig.json`) |
| --- | --- | --- |
| **Módulos** | `Node16` (ESM en Node.js) | `None` (script global en navegador) |
| **Libs** | APIs de Node.js | `DOM`, `DOM.Iterable` |
| **Salida** | `dist/` | `public/` |
| **Entorno de ejecución** | Node.js (servidor) | Navegador |

Por eso existen dos configuraciones TypeScript independientes.

### Configuración: `client/tsconfig.json`

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "None",
    "lib": ["ES2022", "DOM", "DOM.Iterable"],
    "outDir": "../public",
    "rootDir": ".",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "sourceMap": true,
    "noEmitOnError": true
  },
  "include": ["./**/*"]
}
```

### Opciones clave del frontend

| Opción | Valor | Razón |
| --- | --- | --- |
| `module` | `None` | No usa sistema de módulos; genera un script global que `index.html` carga con `<script src="app.js">` |
| `lib` | `DOM`, `DOM.Iterable` | Habilita tipos del navegador (`document`, `fetch`, `localStorage`, etc.) |
| `outDir` | `../public` | Compila `client/app.ts` → `public/app.js` directamente |
| `sourceMap` | `true` | Permite depurar el TypeScript original en DevTools del navegador |
| `noEmitOnError` | `true` | No genera JS si hay errores de tipos |

### Flujo de compilación

```
client/app.ts  ──(tsc -p client)──►  public/app.js      ← lo carga el navegador
                                     public/app.js.map  ← source map para depuración
```

`public/index.html` lo referencia así:

```html
<script src="app.js"></script>
```

### Qué contiene `client/app.ts`

Es el código fuente TypeScript del frontend completo. Incluye:

- **Interfaces tipadas:** `ChatJSON`, `MessageJSON`, `OllamaModel` (reflejan las respuestas de la API)
- **Conexión con la API REST:** helpers `apiPost`, `apiGet`, `apiDelete` que llaman a los endpoints del backend
- **Streaming SSE:** lectura de `ReadableStream` para recibir respuestas del modelo en tiempo real
- **Gestión de chats:** crear, cargar, listar, eliminar chats desde la sidebar
- **Renderizado Markdown:** integración con `marked.js` + `highlight.js` (cargados desde CDN)
- **UI:** sidebar, modal de configuración, tema oscuro, auto-resize del textarea, exportar a `.txt`
- **Configuración de Ollama:** host/puerto guardados en `localStorage`, con prueba de conexión

### ⚠️ `public/app.js` no se debe editar manualmente

Este archivo es **generado automáticamente**. Cualquier cambio en el frontend debe hacerse en `client/app.ts` y luego compilar:

```bash
npm run build:client
```

---

## Dependencias Añadidas

Todas las nuevas dependencias son de desarrollo (`devDependencies`):

| Paquete          | Versión   | Propósito                                           |
| ---------------- | --------- | --------------------------------------------------- |
| `typescript`     | `^5.9.3`  | Compilador TypeScript                               |
| `@types/node`    | `^25.3.3` | Tipos para las APIs de Node.js (`crypto`, `fs`)     |
| `@types/express` | `^5.0.6`  | Tipos para Express (`Request`, `Response`, etc.)    |
| `@types/cors`    | `^2.8.19` | Tipos para el middleware CORS                       |
| `tsx`            | `^4.21.0` | Ejecutor de TypeScript en desarrollo (sin compilar) |

> Las dependencias de producción (`dependencies`) no se modificaron.

---

## Scripts Actualizados

| Script           | Antes (JS)               | Después (TS)                      | Descripción                          |
| ---------------- | ------------------------ | --------------------------------- | ------------------------------------ |
| `build`          | _(no existía)_           | `tsc && tsc -p client`            | Compila backend + frontend           |
| `build:server`   | _(no existía)_           | `tsc`                             | Compila solo el backend → `dist/`    |
| `build:client`   | _(no existía)_           | `tsc -p client`                   | Compila solo el frontend → `public/` |
| `start`          | `node index.js`          | `node dist/index.js`              | Ejecuta el código compilado          |
| `dev`            | `node --watch index.js`  | `tsx --watch index.ts`            | Desarrollo con hot-reload            |
| `generate-icons` | `node generate-icons.js` | `tsx generate-icons.ts`           | Genera iconos SVG para la PWA        |

---

## Detalle por Archivo

### `index.ts`

- Conversión de `process.env.PORT` con `Number()` para garantizar tipo `number`.
- Los imports mantienen extensión `.js` (requerido por Node16 module resolution).

```typescript
const PORT = Number(process.env.PORT) || 3000; // antes: process.env.PORT || 3000
```

### `src/server.ts`

- Parámetro `port` tipado como `number` con valor por defecto.
- Tipo de retorno explícito `Express`.
- Se importan los tipos `Express` de express.

```typescript
export function createServer(port: number = 3000): Express { ... }
```

### `src/models/Message.ts`

- Nueva interfaz `MessageData` para tipar el constructor.
- Propiedades de la clase tipadas explícitamente.

```typescript
export interface MessageData {
  id?: string;
  role: string;
  content: string;
  timestamp?: Date;
}
```

### `src/models/Chat.ts`

- Nueva interfaz `ChatData` para tipar el constructor.
- Método `addMessage` recibe `Message` tipado.
- Método `getHistory` retorna `{ role: string; content: string }[]`.

```typescript
export interface ChatData {
  id?: string;
  model: string;
  title: string;
  messages?: Message[];
  createdAt?: Date;
  lastMessageAt?: Date;
}
```

### `src/services/ChatService.ts`

- `Map` genérico tipado: `Map<string, Chat>`.
- Tipo de retorno `Chat | null` en `getById`.
- Todos los parámetros con tipos explícitos.

```typescript
#chats = new Map<string, Chat>();

getById(chatId: string): Chat | null { ... }
getAll(): Chat[] { ... }
addMessage(chatId: string, role: string, content: string): Message { ... }
```

### `src/services/OllamaService.ts`

- Nueva interfaz `OllamaModel` para tipar la respuesta de modelos.
- **Cambio arquitectónico:** Se reemplazó el import `default` de ollama por la clase `Ollama` importada con nombre. Se crea una instancia nueva por cada URL con `new Ollama({ host: url })` mediante el método privado `createClient()`.
- Callback `onChunk` tipado como `(chunk: string) => void`.

```typescript
import { Ollama } from "ollama";  // antes: import ollama from "ollama"

export interface OllamaModel {
  name: string;
  size: number;
  modified_at: string;
}

// Método privado para crear un cliente por URL
private createClient(url: string): Ollama {
  return new Ollama({ host: url });
}
```

> **Motivo del cambio:** La API tipada de la librería `ollama` no acepta `host` como parámetro en cada llamada (`list()`, `chat()`), sino en el constructor de la clase `Ollama`. Este cambio fue necesario para cumplir con el sistema de tipos.

### `src/routes/chatRoutes.ts`

- Parámetros de la función factory tipados: `chatService: ChatService`, `ollamaService: OllamaService`.
- Retorno explícito `Router`.
- Handlers tipados con `Request` y `Response` de Express.
- `req.params.chatId` casteado con `as string` (Express 5 puede devolver `string | string[]`).
- Errores casteados con `(error as Error).message`.
- Se eliminaron los `return res.status(...)` y se usó `res.status(...); return;` (Express 5 devuelve `void`).

### `src/routes/modelRoutes.ts`

- Mismos patrones de tipado que `chatRoutes.ts`.
- Errores casteados con `(error as Error)`.

### `src/middlewares/errorHandler.ts`

- Parámetro `err` tipado como `Error & { status?: number }` para soportar errores HTTP con código de estado.
- Parámetros Express tipados: `Request`, `Response`, `NextFunction`.

```typescript
export function errorHandler(
  err: Error & { status?: number },
  req: Request,
  res: Response,
  next: NextFunction,
): void { ... }
```

### `src/middlewares/logger.ts`

- Parámetros tipados con `Request`, `Response`, `NextFunction`.
- Tipo de retorno `void`.

### `generate-icons.ts`

- Función `generateIcons` con tipo de retorno `void`.
- Sin otros cambios significativos (usa solo APIs de Node.js ya tipadas).

---

## Interfaces y Tipos Creados

| Interfaz / Tipo | Archivo                         | Descripción                                  |
| --------------- | ------------------------------- | -------------------------------------------- |
| `MessageData`   | `src/models/Message.ts`         | Datos de entrada para crear un `Message`     |
| `ChatData`      | `src/models/Chat.ts`            | Datos de entrada para crear un `Chat`        |
| `OllamaModel`   | `src/services/OllamaService.ts` | Estructura de un modelo retornado por Ollama |

---

## Cambios Técnicos Relevantes

### 1. Extensiones `.js` en imports

Los imports dentro de archivos TypeScript mantienen la extensión `.js`:

```typescript
import { Message } from "./Message.js";
```

Esto es **requerido** por la resolución de módulos `Node16`. TypeScript resuelve `.js` → `.ts` en tiempo de compilación, pero el código compilado necesita la extensión `.js` para funcionar en Node.js con ESM.

### 2. Casting de `req.params`

Express 5 define `req.params` como `Record<string, string | string[]>`, por lo que se necesita casting:

```typescript
const chatId = req.params.chatId as string;
```

### 3. Instanciación de Ollama por URL

La librería `ollama` requiere pasar `host` en el constructor, no en cada método. Se creó un método `createClient(url)` que instancia un nuevo cliente por cada petición:

```typescript
private createClient(url: string): Ollama {
  return new Ollama({ host: url });
}
```

### 4. `Number()` para variables de entorno

Las variables de entorno son siempre `string | undefined`. Se usa `Number()` para convertir a `number`:

```typescript
const PORT = Number(process.env.PORT) || 3000;
```

---

## Cómo Compilar y Ejecutar

### Desarrollo (sin compilar)

```bash
npm run dev
```

Usa `tsx` para ejecutar TypeScript directamente con hot-reload.

### Producción

```bash
# 1. Compilar todo (backend + frontend)
npm run build

# 2. Ejecutar el código compilado
npm start
```

El backend compilado se genera en `dist/` y el frontend en `public/app.js`.

### Compilar solo el frontend

```bash
npm run build:client
```

Genera `public/app.js` + `public/app.js.map` a partir de `client/app.ts`.

### Compilar solo el backend

```bash
npm run build:server
```

Genera `dist/` con la misma estructura de directorios de `src/`.

### Generar iconos

```bash
npm run generate-icons
```
