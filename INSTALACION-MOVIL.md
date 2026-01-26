# 📱 Instalación en Móvil Android

## Requisitos Previos

- Servidor corriendo (ejecutar `npm start`)
- Teléfono Android con Chrome o navegador compatible con PWA
- Estar en la misma red WiFi (o usar ngrok/serveo para acceso público)

## Paso 1: Generar Iconos

Primero, necesitas generar los iconos para la aplicación:

```bash
# Instalar dependencia para generar iconos
npm install canvas

# Generar los iconos
node generate-icons.js
```

**Alternativa rápida:** Si tienes problemas con canvas, puedes crear manualmente un archivo PNG de 512x512 y guardarlo en `public/icons/icon-512x512.png`. Luego usa un generador online como [PWA Asset Generator](https://www.pwabuilder.com/imageGenerator) para crear todos los tamaños.

## Paso 2: Iniciar el Servidor

```bash
npm start
```

El servidor estará disponible en `http://localhost:3000`

## Paso 3: Acceder desde tu Móvil

### Opción A: Acceso Local (Misma Red WiFi)

1. Encuentra tu IP local:

   ```bash
   # En Windows PowerShell
   ipconfig
   # Busca "Dirección IPv4" (ejemplo: 192.168.1.100)
   ```

2. En tu móvil Android, abre Chrome y ve a:
   ```
   http://TU_IP_LOCAL:3000
   ```
   Ejemplo: `http://192.168.1.100:3000`

### Opción B: Acceso Público (Usando ngrok)

1. Instala [ngrok](https://ngrok.com/download)

2. Ejecuta:

   ```bash
   ngrok http 3000
   ```

3. Usa la URL pública que te proporciona ngrok en tu móvil

## Paso 4: Instalar la PWA en Android

1. **Abre la URL** en Chrome en tu móvil Android

2. **Busca el banner de instalación** que aparece en la parte inferior de la pantalla, o:

3. **Instalación manual:**
   - Toca el menú de tres puntos (⋮) en la esquina superior derecha
   - Selecciona "Agregar a pantalla de inicio" o "Instalar aplicación"
   - Confirma la instalación

4. **¡Listo!** La aplicación aparecerá en tu pantalla de inicio como una app nativa

## Características de la PWA

✅ **Funciona offline** - Gracias al Service Worker
✅ **Pantalla completa** - Sin barra de navegador
✅ **Icono en pantalla de inicio** - Como una app nativa
✅ **Splash screen** - Pantalla de carga personalizada
✅ **Optimizada para móvil** - Interfaz responsive

## Configuración de Ollama para Acceso Remoto

Si quieres que tu móvil se conecte a Ollama en tu PC:

1. **En tu PC, inicia Ollama con acceso remoto:**

   Windows (PowerShell):

   ```powershell
   $env:OLLAMA_HOST="0.0.0.0:11434"
   ollama serve
   ```

2. **En la aplicación móvil:**
   - Toca el botón de configuración (⚙️)
   - Cambia la URL de Ollama a: `http://TU_IP_LOCAL:11434`
   - Guarda los cambios

## Solución de Problemas

### La app no se puede instalar

- Asegúrate de estar usando HTTPS o localhost
- Verifica que el archivo `manifest.json` sea accesible
- Revisa que los iconos estén en la carpeta correcta

### No puedo conectarme desde el móvil

- Verifica que ambos dispositivos estén en la misma red WiFi
- Desactiva temporalmente el firewall de Windows
- Asegúrate de usar la IP correcta

### Service Worker no se registra

- Abre las DevTools en Chrome móvil: chrome://inspect
- Verifica errores en la consola
- Asegúrate de que `sw.js` sea accesible

## Actualización de la App

Cuando hagas cambios:

1. Incrementa la versión del cache en `sw.js`:

   ```javascript
   const CACHE_NAME = "ollamaui-v2"; // Cambiar versión
   ```

2. Los usuarios recibirán la actualización automáticamente la próxima vez que abran la app

## Desinstalación

Para desinstalar la PWA:

1. Mantén presionado el icono de la app
2. Selecciona "Desinstalar" o "Eliminar"
