#!/bin/bash

# OllamPlus - Script para resetear la base de datos

DB_PATH="./data/ollama.db"

echo "⚠️  Esto eliminará todos los chats y mensajes guardados."

if [ -f "$DB_PATH" ]; then
    echo "🗑️  Eliminando base de datos existente..."
    rm "$DB_PATH"
    echo "✅ Base de datos eliminada"
else
    echo "ℹ️  No existe base de datos previa"
fi

echo "✨ Listo. La base de datos se creará automáticamente al iniciar el servidor."
