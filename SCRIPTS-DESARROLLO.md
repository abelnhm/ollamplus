# Scripts de Desarrollo

## Resumen

El proyecto usa **TypeScript** tanto en el servidor como en el cliente. Para el desarrollo se configuraron scripts con **modo watch** que recompilan automáticamente al detectar cambios.

---

## Scripts disponibles

| Script           | Comando                  | Descripción                                              |
| ---------------- | ------------------------ | -------------------------------------------------------- |
| `dev`            | `npm run dev`            | Ejecuta servidor y cliente en modo watch simultáneamente |
| `dev:server`     | `npm run dev:server`     | Solo el servidor en modo watch (tsx --watch)             |
| `dev:client`     | `npm run dev:client`     | Solo el cliente en modo watch (tsc --watch)              |
| `build`          | `npm run build`          | Compila servidor y cliente para producción               |
| `build:server`   | `npm run build:server`   | Solo compila el servidor                                 |
| `build:client`   | `npm run build:client`   | Solo compila el cliente                                  |
| `start`          | `npm start`              | Inicia el servidor compilado (`dist/index.js`)           |
| `generate-icons` | `npm run generate-icons` | Genera los iconos de la PWA                              |

---

## Desarrollo (modo watch)

### Ejecutar todo junto

```bash
npm run dev
```

Esto usa [`concurrently`](https://www.npmjs.com/package/concurrently) para ejecutar en paralelo:

- **`[server]`** (azul): `tsx --watch index.ts` — ejecuta y reinicia el servidor automáticamente al detectar cambios en los archivos TypeScript del backend.
- **`[client]`** (verde): `tsc --watch -p client` — recompila el TypeScript del cliente (`client/app.ts`) a JavaScript (`public/app.js`) automáticamente al detectar cambios.

### Ejecutar por separado

Si prefieres ejecutar cada parte en terminales independientes:

```bash
# Terminal 1 — Servidor
npm run dev:server

# Terminal 2 — Cliente
npm run dev:client
```

---

## Estructura de compilación

```
Fuente                    →  Compilado
─────────────────────────────────────────
index.ts                  →  dist/index.js
src/**/*.ts               →  dist/src/**/*.js
client/app.ts             →  public/app.js
```

- El **servidor** se compila con el `tsconfig.json` raíz (salida en `dist/`).
- El **cliente** se compila con `client/tsconfig.json` (salida en `public/`).

---

## Dependencias de desarrollo

| Paquete          | Para qué se usa                                                |
| ---------------- | -------------------------------------------------------------- |
| `typescript`     | Compilador de TypeScript                                       |
| `tsx`            | Ejecuta TypeScript directamente con soporte de watch y ESM     |
| `concurrently`   | Ejecuta múltiples comandos en paralelo con etiquetas y colores |
| `@types/node`    | Tipos de TypeScript para Node.js                               |
| `@types/express` | Tipos de TypeScript para Express                               |
| `@types/cors`    | Tipos de TypeScript para el middleware CORS                    |
