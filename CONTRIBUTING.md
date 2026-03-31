# Guía de Contribuciones / Contributing Guide

## Versión en Español

¡Gracias por tu interés en contribuir a OllamPlus! Este documento te ayudará a empezar.

### Cómo Contribuir

1. **Haz un Fork** del repositorio
2. **Crea una rama** para tu feature o fix (`git checkout -b nombre-rama`)
3. **Haz tus cambios** y commitea (`git commit -m 'Descripción de cambios'`)
4. **Push a tu fork** (`git push origin nombre-rama`)
5. **Abre un Pull Request** en GitHub

### Requisitos

- Node.js v18 o superior
- Conocimientos básicos de TypeScript
- Capacidad de ejecutar el proyecto localmente

### Estilo de Código

- Usa **TypeScript** con strict mode
- Sigue las convenciones del proyecto existente
- Comenta el código cuando sea necesario
- Haz commits descriptivos

### Proceso de Revisión

1. Un mantenedor revisará tu PR
2. Puede que se soliciten cambios
3. Una vez aprobado, se hará merge

### Tipos de Contribuciones Bienvenidas

- 🐛 Reporte de bugs
- ✨ Nuevas features
- 📚 Documentación
- 🎨 Mejoras de UI/UX
- ⚡ Mejoras de rendimiento
- 🧪 Tests

---

## English Version

Thank you for your interest in contributing to OllamPlus! This document will help you get started.

### How to Contribute

1. **Fork** the repository
2. **Create a branch** for your feature or fix (`git checkout -b branch-name`)
3. **Make your changes** and commit (`git commit -m 'Description of changes'`)
4. **Push to your fork** (`git push origin branch-name`)
5. **Open a Pull Request** on GitHub

### Requirements

- Node.js v18 or higher
- Basic knowledge of TypeScript
- Ability to run the project locally

### Code Style

- Use **TypeScript** with strict mode
- Follow existing project conventions
- Comment code when necessary
- Make descriptive commits

### Review Process

1. A maintainer will review your PR
2. Changes may be requested
3. Once approved, it will be merged

### Types of Welcome Contributions

- 🐛 Bug reports
- ✨ New features
- 📚 Documentation
- 🎨 UI/UX improvements
- ⚡ Performance improvements
- 🧪 Tests

---

## Configuración para Desarrollo Local / Local Development Setup

```bash
# Clone el repositorio / Clone the repository
git clone https://github.com/abelnhm/ollamplus.git
cd ollamplus

# Instala dependencias / Install dependencies
npm install

# Copia el archivo de configuración / Copy config file
cp .env.example .env

# Inicia en modo desarrollo / Start in development mode
npm run dev
```

Para más información, consulta el [README.md](./README.md).
