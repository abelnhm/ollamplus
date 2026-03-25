#!/bin/bash

# OllamPlus - Script de configuración inicial

echo "🔧 Configurando OllamPlus..."

# Verificar Node.js
if ! command -v node &> /dev/null; then
    echo "❌ Node.js no está instalado"
    exit 1
fi

echo "✅ Node.js encontrado: $(node --version)"

# Verificar npm
if ! command -v npm &> /dev/null; then
    echo "❌ npm no está instalado"
    exit 1
fi

echo "✅ npm encontrado: $(npm --version)"

# Crear directorio de datos
if [ ! -d "data" ]; then
    echo "📁 Creando directorio data/"
    mkdir -p data
else
    echo "✅ Directorio data/ ya existe"
fi

# Copiar .env.example a .env si no existe
if [ ! -f ".env" ]; then
    echo "📝 Copiando .env.example a .env"
    cp .env.example .env
else
    echo "✅ Archivo .env ya existe"
fi

# Instalar dependencias
echo "📦 Instalando dependencias..."
npm install

# Compilar proyecto
echo "🔨 Compilando proyecto..."
npm run build

echo ""
echo "✅ Configuración completada!"
echo "🚀 Para iniciar el servidor: npm run dev:server"
echo "🌐 Abre http://localhost:3000 en tu navegador"
