# Configuración de Ollama en Red Local

## Para usar Ollama desde otra máquina en la misma red

### 1. En la máquina donde está Ollama (servidor)

Por defecto, Ollama solo escucha en `localhost` (127.0.0.1). Para permitir conexiones desde otras máquinas:

#### Windows:

```powershell
# Establecer variable de entorno para permitir acceso desde la red
$env:OLLAMA_HOST="0.0.0.0:11434"

# Reiniciar Ollama
ollama serve
```

O configurar permanentemente:

1. Panel de Control → Sistema → Configuración avanzada del sistema
2. Variables de entorno
3. Agregar nueva variable de sistema:
   - Nombre: `OLLAMA_HOST`
   - Valor: `0.0.0.0:11434`
4. Reiniciar Ollama

#### Linux/Mac:

```bash
# Establecer variable de entorno
export OLLAMA_HOST="0.0.0.0:11434"

# O agregar a ~/.bashrc o ~/.zshrc para hacerlo permanente
echo 'export OLLAMA_HOST="0.0.0.0:11434"' >> ~/.bashrc

# Reiniciar Ollama
ollama serve
```

### 2. Verificar la IP de la máquina servidor

#### Windows:

```powershell
ipconfig
```

Busca la dirección IPv4 (ejemplo: 192.168.1.100)

#### Linux/Mac:

```bash
ifconfig
# o
ip addr show
```

### 3. Configurar el Firewall (si es necesario)

#### Windows:

```powershell
# Permitir puerto 11434 en el firewall
New-NetFirewallRule -DisplayName "Ollama" -Direction Inbound -LocalPort 11434 -Protocol TCP -Action Allow
```

#### Linux:

```bash
# UFW
sudo ufw allow 11434/tcp

# firewalld
sudo firewall-cmd --add-port=11434/tcp --permanent
sudo firewall-cmd --reload
```

### 4. En la aplicación OllamaUI

1. Haz clic en el botón de configuración (⚙️) en la esquina superior derecha
2. Ingresa la IP del servidor (ejemplo: `192.168.1.100`)
3. Verifica el puerto (por defecto: `11434`)
4. Haz clic en "Guardar"

### 5. Verificar la conexión

Desde la máquina cliente, verifica que puedas acceder:

```bash
curl http://192.168.1.100:11434/api/tags
```

Deberías recibir una respuesta JSON con la lista de modelos.

## Solución de problemas

### Error: "Unexpected token '<', "<!DOCTYPE "... is not valid JSON"

Este error indica que estás recibiendo una página HTML en lugar de una respuesta de API. Causas comunes:

1. **Ollama no está configurado para escuchar en la red**: Asegúrate de configurar `OLLAMA_HOST=0.0.0.0:11434`
2. **Dirección IP incorrecta**: Verifica la IP con `ipconfig` o `ifconfig`
3. **Firewall bloqueando**: Permite el puerto 11434 en el firewall
4. **Ollama no está corriendo**: Ejecuta `ollama serve`

### Verificar que Ollama escucha en todas las interfaces

```bash
# Windows
netstat -an | findstr "11434"

# Linux/Mac
netstat -an | grep 11434
# o
lsof -i :11434
```

Deberías ver algo como:

- `0.0.0.0:11434` (escuchando en todas las interfaces) ✅
- `127.0.0.1:11434` (solo localhost) ❌ necesitas configurar OLLAMA_HOST

### Probar la conexión manualmente

```bash
# Desde la máquina cliente
curl -X POST http://192.168.1.100:11434/api/tags

# Si funciona, deberías ver la lista de modelos instalados
```

## Seguridad

⚠️ **Importante**: Al configurar Ollama para escuchar en `0.0.0.0`, estás exponiendo el servicio a toda tu red local. Asegúrate de:

1. Estar en una red confiable
2. Usar firewall para limitar el acceso si es necesario
3. No exponer el puerto a Internet

## Ejemplo de configuración completa

**Servidor (donde está Ollama):**

- IP: 192.168.1.100
- Variable de entorno: `OLLAMA_HOST=0.0.0.0:11434`
- Firewall: Puerto 11434 abierto
- Comando: `ollama serve`

**Cliente (navegador):**

- Abrir OllamaUI: http://localhost:3000
- Configurar host: `192.168.1.100`
- Configurar puerto: `11434`
- URL completa usada: `http://192.168.1.100:11434`

## Variables de entorno

El proyecto usa un archivo `.env` para configuración. Copia `.env.example` a `.env` y ajusta los valores:

```bash
# Puerto del servidor
PORT=3000

# URL de Ollama
OLLAMA_HOST=http://localhost:11434

# Ruta de la base de datos
DB_PATH=./data/ollama.db

# Entorno
NODE_ENV=development
```

Estas variables se cargan automáticamente al iniciar el servidor.

## Estructura del proyecto

```
ollamaUI/
├── server/              # Backend (Node.js + Express + SQLite)
│   └── src/
│       ├── index.ts    # Entry point
│       ├── config.ts   # Variables de entorno
│       ├── routes/     # Endpoints API
│       ├── services/   # ChatService, OllamaService, database
│       ├── validators/ # Zod validators
│       ├── db/        # Migrations
│       └── models/     # Chat, Message
│
├── client/             # Frontend TypeScript
│   └── src/
│       ├── app.ts     # Entry point
│       ├── services/  # Lógica del cliente
│       └── ui/        # Componentes UI
│
├── shared/            # Tipos compartidos
│   └── types/         # Interfaces comunes
│
├── scripts/           # Scripts de utilidad
│   ├── setup.sh      # Configuración inicial
│   └── reset-db.sh   # Resetear base de datos
│
└── public/           # Archivos estáticos servidos
```
