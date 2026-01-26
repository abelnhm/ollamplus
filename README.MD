# 🤖 IAS-PROYECT - Chat Web con Ollama

Proyecto de chat interactivo en tiempo real con modelos de IA locales usando Ollama. Interfaz web moderna con streaming de respuestas y gestión de múltiples sesiones.

## 📋 Descripción

Sistema de chat web completo que permite interactuar con modelos de IA locales a través de Ollama. Implementa una arquitectura cliente-servidor con streaming en tiempo real, manteniendo el contexto de conversación y permitiendo múltiples sesiones simultáneas.

## ✨ Características Principales

- 💬 **Chat en tiempo real** con streaming de respuestas
- 🔄 **Historial de conversación** persistente por sesión
- 👥 **Múltiples sesiones** simultáneas e independientes
- 🎨 **Interfaz web moderna** con diseño responsive
- ⚡ **Streaming con SSE** (Server-Sent Events)
- 🧹 **Limpieza de historial** individual por sesión
- 📱 **Diseño responsive** adaptable a dispositivos móviles
- 🎯 **Indicadores visuales** de estado y procesamiento

## 🛠️ Requisitos Previos

- **Node.js** v16 o superior
- **Ollama** instalado y en ejecución
- Un modelo de Ollama descargado (ej: llama2, mistral, codellama)

### Instalar Ollama

1. Descarga Ollama desde [ollama.ai](https://ollama.ai)
2. Instala y ejecuta el servicio
3. Descarga un modelo:
   ```bash
   ollama pull llama2
   ```

## 📦 Instalación

1. **Clonar o descargar el proyecto**

2. **Instalar dependencias**

   ```bash
   npm install
   ```

3. **Configurar variables de entorno**

   Crea un archivo `.env` en la raíz del proyecto:

   ```env
   OLLAMA_MODEL=llama2
   ```

   Puedes cambiar `llama2` por cualquier modelo que tengas instalado en Ollama.

## 🚀 Uso

### Iniciar el servidor web

```bash
node index-local.js
```

El servidor se iniciará en `http://localhost:3000`

### Acceder a la interfaz

Abre tu navegador web en:

```
http://localhost:3000
```

### Interacción

1. **Escribir mensaje**: Escribe en el campo de texto
2. **Enviar**: Presiona `Enter` o haz clic en "Enviar"
3. **Nueva línea**: Usa `Shift + Enter` para saltos de línea
4. **Limpiar chat**: Haz clic en "🗑️ Limpiar chat" para reiniciar la conversación

## 📁 Estructura del Proyecto

```
IAS-PROYECT/
├── feature/
│   ├── Ollama/
│   │   ├── ollama-local.js      # Implementación de chat en consola
│   │   └── ollama-ui.js         # Servidor web con API REST
│   └── deep-seek/
│       └── deepseek.js          # Integración con DeepSeek
├── public/
│   ├── index.html               # Interfaz de usuario
│   ├── style.css                # Estilos de la aplicación
│   └── app.js                   # Lógica del cliente
├── index-local.js               # Punto de entrada del servidor web
├── index.js                     # Punto de entrada principal
├── package.json                 # Dependencias del proyecto
├── .env                         # Variables de entorno
└── README.md                    # Documentación
```

## 🌐 API REST

### Servidor Express

El servidor Express escucha en el puerto `3000` y proporciona los siguientes endpoints:

#### **POST** `/api/chat`

Envía un mensaje al modelo de IA con streaming en tiempo real.

**Request Body:**

```json
{
  "message": "Tu mensaje aquí",
  "sessionId": "user_abc123" // Opcional, default: "default"
}
```

**Response:**

Streaming SSE (Server-Sent Events):

```
data: {"chunk": "Hola"}
data: {"chunk": " mundo"}
data: {"done": true}
```

**Ejemplo con JavaScript:**

```javascript
const response = await fetch("/api/chat", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    message: "¿Qué es JavaScript?",
    sessionId: "user_123",
  }),
});

const reader = response.body.getReader();
const decoder = new TextDecoder();

while (true) {
  const { done, value } = await reader.read();
  if (done) break;

  const chunk = decoder.decode(value);
  // Procesar chunk...
}
```

---

#### **POST** `/api/clear`

Limpia el historial de conversación de una sesión específica.

**Request Body:**

```json
{
  "sessionId": "user_abc123" // Opcional, default: "default"
}
```

**Response:**

```json
{
  "success": true
}
```

**Ejemplo:**

```javascript
await fetch("/api/clear", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ sessionId: "user_123" }),
});
```

---

#### **GET** `/api/history`

Obtiene el historial de conversación de una sesión.

**Query Parameters:**

- `sessionId` (opcional): ID de la sesión, default: "default"

**Response:**

```json
{
  "history": [
    {
      "role": "user",
      "content": "¿Qué es JavaScript?"
    },
    {
      "role": "assistant",
      "content": "JavaScript es un lenguaje de programación..."
    }
  ]
}
```

**Ejemplo:**

```javascript
const response = await fetch("/api/history?sessionId=user_123");
const data = await response.json();
console.log(data.history);
```

---

### Gestión de Sesiones

- Cada usuario tiene un **sessionId único** generado automáticamente
- Las sesiones son **independientes** y no se cruzan entre usuarios
- El historial de conversación se **mantiene en memoria** durante la vida del servidor
- Múltiples usuarios pueden chatear **simultáneamente** sin interferencias

### Streaming con SSE

El servidor utiliza **Server-Sent Events** para transmitir las respuestas en tiempo real:

1. Cliente envía mensaje vía POST
2. Servidor inicia streaming SSE
3. Respuesta se envía chunk por chunk
4. Cliente muestra texto en tiempo real
5. Servidor envía señal de finalización

**Ventajas:**

- Respuestas instantáneas
- Mejor experiencia de usuario
- Uso eficiente de recursos
- Comunicación unidireccional optimizada

## 🏗️ Arquitectura

### Backend (Node.js + Express)

```
┌─────────────────────────────────────┐
│     Express Server (Port 3000)      │
├─────────────────────────────────────┤
│  ┌──────────────────────────────┐   │
│  │   Session Manager (Map)      │   │
│  │  - user_1: OllamaChat        │   │
│  │  - user_2: OllamaChat        │   │
│  │  - user_N: OllamaChat        │   │
│  └──────────────────────────────┘   │
│  ┌──────────────────────────────┐   │
│  │      API Endpoints           │   │
│  │  /api/chat    (POST + SSE)   │   │
│  │  /api/clear   (POST)         │   │
│  │  /api/history (GET)          │   │
│  └──────────────────────────────┘   │
│  ┌──────────────────────────────┐   │
│  │    Static File Serving       │   │
│  │  /public/* (HTML/CSS/JS)     │   │
│  └──────────────────────────────┘   │
└────────────┬────────────────────────┘
             │
             ▼
    ┌────────────────┐
    │  Ollama API    │
    │  (Local Model) │
    └────────────────┘
```

### Frontend (Vanilla JavaScript)

```
┌─────────────────────────────────────┐
│         Browser (Client)            │
├─────────────────────────────────────┤
│  ┌──────────────────────────────┐   │
│  │      index.html              │   │
│  │  - Chat container            │   │
│  │  - Message list              │   │
│  │  - Input form                │   │
│  └──────────────────────────────┘   │
│  ┌──────────────────────────────┐   │
│  │      style.css               │   │
│  │  - Modern gradient design    │   │
│  │  - Responsive layout         │   │
│  │  - Animations                │   │
│  └──────────────────────────────┘   │
│  ┌──────────────────────────────┐   │
│  │      app.js                  │   │
│  │  - Fetch API                 │   │
│  │  - SSE reader                │   │
│  │  - UI updates                │   │
│  └──────────────────────────────┘   │
└────────────┬────────────────────────┘
             │
             ▼ HTTP/SSE
    ┌────────────────┐
    │  Express API   │
    └────────────────┘
```

## 🔧 Componentes Principales

### OllamaChat (Class)

Gestiona una conversación individual con el modelo de IA.

**Propiedades:**

- `conversationHistory`: Array de mensajes (user/assistant)

**Métodos:**

- `sendMessage(userMessage, streamCallback)`: Envía mensaje y recibe respuesta
- `clearHistory()`: Limpia el historial de conversación

### startChatServer(port)

Inicia el servidor Express con todos los endpoints configurados.

**Parámetros:**

- `port`: Puerto de escucha (default: 3000)

**Retorna:**

- Instancia de la aplicación Express

## 📝 Cambios Realizados

### 1. **Modificación de `ollama-ui.js`**

- ✅ Añadido soporte para **streaming con callback**
- ✅ Implementado **servidor Express** con API REST
- ✅ Creado sistema de **gestión de sesiones múltiples**
- ✅ Configurado **CORS** para peticiones cross-origin
- ✅ Implementado **SSE** (Server-Sent Events) para streaming
- ✅ Añadidos endpoints `/api/chat`, `/api/clear`, `/api/history`

### 2. **Actualización de `index-local.js`**

- ✅ Cambiado de modo consola a **modo servidor web**
- ✅ Importación de `startChatServer` desde `ollama-ui.js`
- ✅ Inicio automático del servidor en puerto 3000

### 3. **Creación de Interfaz Web (`public/`)**

**`index.html`:**

- ✅ Estructura HTML5 semántica
- ✅ Header con título y botón de limpieza
- ✅ Área de mensajes scrollable
- ✅ Input con textarea auto-expandible
- ✅ Botón de envío con estados

**`style.css`:**

- ✅ Diseño moderno con gradientes
- ✅ Animaciones suaves (fadeIn, typing)
- ✅ Estilos diferenciados para user/assistant
- ✅ Responsive design (mobile-first)
- ✅ Custom scrollbar
- ✅ Estados hover y disabled

**`app.js`:**

- ✅ Generación de sessionId único
- ✅ Manejo de eventos (Enter, Shift+Enter)
- ✅ Fetch API con SSE reader
- ✅ Streaming en tiempo real
- ✅ Auto-scroll automático
- ✅ Indicador de escritura (typing)
- ✅ Manejo de errores
- ✅ Auto-resize del textarea

### 4. **Actualización de Dependencias**

- ✅ `express@5.2.1` - Servidor web
- ✅ `cors@2.8.6` - CORS middleware

## 🎨 Capturas de Interfaz

### Características visuales:

- 🎨 Gradiente morado/azul en header
- 💬 Mensajes del usuario alineados a la derecha (gradiente)
- 🤖 Mensajes del asistente alineados a la izquierda (blanco)
- ⏳ Indicador de "escribiendo..." con puntos animados
- 🗑️ Botón de limpieza en el header
- 📱 Diseño responsive que se adapta a móviles

## 🚀 Próximas Mejoras

- [ ] Persistencia de conversaciones en base de datos
- [ ] Autenticación de usuarios
- [ ] Soporte para adjuntar archivos/imágenes
- [ ] Exportar conversaciones (TXT, JSON)
- [ ] Modo oscuro/claro
- [ ] Selección de modelo desde la UI
- [ ] WebSocket para comunicación bidireccional
- [ ] Historial de conversaciones anteriores
- [ ] Markdown rendering en respuestas
- [ ] Copiar respuestas al portapapeles

## 🤝 Contribuciones

Las contribuciones son bienvenidas. Para cambios importantes:

1. Fork el proyecto
2. Crea una rama para tu feature (`git checkout -b feature/AmazingFeature`)
3. Commit tus cambios (`git commit -m 'Add some AmazingFeature'`)
4. Push a la rama (`git push origin feature/AmazingFeature`)
5. Abre un Pull Request

## 📄 Licencia

ISC License - Este proyecto es de código abierto.

## 🐛 Resolución de Problemas

### El servidor no inicia

- Verifica que el puerto 3000 esté disponible
- Asegúrate de tener todas las dependencias instaladas: `npm install`

### No recibo respuestas

- Verifica que Ollama esté en ejecución: `ollama serve`
- Confirma que el modelo esté instalado: `ollama list`
- Revisa que el `.env` tenga el modelo correcto

### Errores de CORS

- El middleware CORS está configurado, pero verifica que el frontend acceda desde `http://localhost:3000`

### Streaming no funciona

- Asegúrate de usar un navegador moderno con soporte para SSE
- Revisa la consola del navegador para errores

## 📞 Soporte

Para problemas o preguntas, abre un issue en el repositorio del proyecto.

---

## 📚 Referencias API

### DeepSeek API

https://api-docs.deepseek.com/api/deepseek-api

### Ollama API

- Documentación: https://github.com/ollama/ollama/blob/main/docs/api.md
- JavaScript SDK: https://github.com/ollama/ollama-js

#### Ejemplo de respuesta Ollama:

```json
{
  "model": "granite3.3:2b",
  "created_at": "2026-01-26T12:36:27.2894708Z",
  "message": {
    "role": "assistant",
    "content": "Greetings! How can I assist you today?"
  },
  "done": true,
  "done_reason": "stop",
  "total_duration": 595989400,
  "load_duration": 100032200,
  "prompt_eval_count": 21,
  "prompt_eval_duration": 96243600,
  "eval_count": 12,
  "eval_duration": 379641700
}
```

---

**Desarrollado con ❤️ usando Node.js, Express y Ollama**
