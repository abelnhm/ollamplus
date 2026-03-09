# Scripts de Desarrollo

## Resumen

El proyecto usa **TypeScript** en tres paquetes: servidor, cliente y tipos compartidos. Para el desarrollo se configuraron scripts con **modo watch** que recompilan automáticamente al detectar cambios.

---

## Scripts disponibles

| Script | Comando | Descripción |
|--------|---------|-------------|
| `dev` | `npm run dev` | Ejecuta servidor y cliente en modo watch simultáneamente |
| `dev:server` | `npm run dev:server` | Solo el servidor en modo watch (tsx --watch) |
| `dev:client` | `npm run dev:client` | Solo el cliente en modo watch (tsc --watch) |
| `build` | `npm run build` | Compila todo (shared + server + client) |
| `build:shared` | `npm run build:shared` | Solo tipos compartidos |
| `build:server` | `npm run build:server` | Solo el servidor |
| `build:client` | `npm run build:client` | Solo el cliente |
| `start` | `npm start` | Inicia el servidor compilado (`node server/dist/index.js`) |

---

## Desarrollo (modo watch)

### Ejecutar todo junto

```bash
npm run dev
```

Esto usa [`concurrently`](https://www.npmjs.com/package/concurrently) para ejecutar en paralelo:

- **`[server]`** (azul): `tsx server/src/index.ts` — ejecuta y reinicia el servidor automáticamente.
- **`[client]`** (verde): `tsc --watch -p client` — recompila el cliente automáticamente.

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
Fuente                              →  Compilado
─────────────────────────────────────────────────────────────────
shared/types/*.ts                  →  shared/dist/*.js
server/src/**/*.ts                 →  server/dist/**/*.js
client/src/**/*.ts                 →  public/**/*.js
```

### Paquetes TypeScript

| Paquete | tsconfig | Entrada | Salida |
|---------|----------|---------|--------|
| `shared/` | `shared/tsconfig.json` | `shared/types/*.ts` | `shared/dist/*.js` |
| `server/` | `server/tsconfig.json` | `server/src/**/*.ts` | `server/dist/**/*.js` |
| `client/` | `client/tsconfig.json` | `client/src/**/*.ts` | `public/**/*.js` |

---

## Dependencias de desarrollo

| Paquete | Para qué se usa |
|---------|-----------------|
| `typescript` | Compilador de TypeScript |
| `tsx` | Ejecuta TypeScript directamente con soporte de watch y ESM |
| `concurrently` | Ejecuta múltiples comandos en paralelo con etiquetas y colores |
| `@types/node` | Tipos de TypeScript para Node.js |
| `@types/express` | Tipos de TypeScript para Express |
| `@types/better-sqlite3` | Tipos de TypeScript para SQLite |

---

## Orden de compilación

Al ejecutar `npm run build`, el orden es:

1. **`build:shared`** — Compila los tipos compartidos primero
2. **`build:server`** — Compila el servidor (depende de shared)
3. **`build:client`** — Compila el cliente

Esto es importante porque:
- El servidor importa tipos de `shared/`
- El cliente puede importar tipos de `shared/` (actualmente duplicados en `client/types.ts`)

---

## Producción

Para ejecutar en producción:

```bash
# Compilar todo
npm run build

# Iniciar servidor
npm start
```

El servidor serve los archivos estáticos desde `public/` y la API está en `/api/*`.
