# Guía de Testing

Este documento te enseña cómo escribir tests para el proyecto OllamaUI.

## ¿Por qué hacer tests?

Los tests son fundamentales para:
- **Detectar errores antes de producción** - Los bugs se encuentran antes de que lleguen a producción
- **Documentar el código** - Los tests demuestran cómo se usa el código
- **Refactorizar con confianza** - Puedes cambiar código sabiendo que si los tests pasan, todo funciona
- **Colaboración** - Otros desarrolladores pueden entender tu código más fácilmente

## Herramientas

Este proyecto usa:
- **Vitest** - Framework de testing (similar a Jest pero más rápido)
- **TypeScript** - Los tests están escritos en TypeScript
- **V8 Coverage** - Para medir la cobertura de código

## Estructura de los tests

Los tests se encuentran en:
```
server/src/test/
├── Chat.test.ts          # Tests del modelo Chat
├── Message.test.ts       # Tests del modelo Message
└── validators.test.ts   # Tests de los validadores Zod
```

## Comandos disponibles

```bash
# Ejecutar todos los tests
npm test

# Ejecutar tests en modo watch (recompile automáticamente)
npm run test:watch

# Ejecutar tests con cobertura
npm run test:coverage
```

## Anatomía de un test

### Estructura básica

```typescript
import { describe, it, expect, beforeEach } from 'vitest';
import { MiClase } from '../models/MiClase.js';

describe('MiClase', () => {
  // beforeEach se ejecuta antes de cada test
  beforeEach(() => {
    // Configuración inicial
  });

  describe('método1', () => {
    it('debería hacer algo específico', () => {
      // Arrange - Preparar los datos
      const entrada = 'valor de prueba';

      // Act - Ejecutar la función
      const resultado = miClase.metodo1(entrada);

      // Assert - Verificar el resultado
      expect(resultado).toBe('valor esperado');
    });

    it('debería lanzar error con entrada inválida', () => {
      expect(() => miClase.metodo1('')).toThrow();
    });
  });
});
```

### Funciones de aserción comunes

```typescript
// Igualdad
expect(valor).toBe(valorEsperado)
expect(valor).toEqual(objetoEsperado)

// Verdader/Falso
expect(valor).toBeTruthy()
expect(valor).toBeFalsy()
expect(valor).toBe(true)

// Nulos
expect(valor).toBeNull()
expect(valor).toBeUndefined()
expect(valor).toBeDefined()

// Números
expect(valor).toBeGreaterThan(10)
expect(valor).toBeLessThan(10)
expect(valor).toBeCloseTo(3.14, 2)

// Strings
expect(texto).toContain('subcadena')
expect(texto).toMatch(/expresion regular/)

// Arrays
expect(array).toHaveLength(3)
expect(array).toContain(elemento)

// Objetos
expect(obj).toHaveProperty('clave')
expect(obj).toMatchObject({ clave: valor })

// Errores
expect(() => fn()).toThrow()
expect(() => fn()).toThrow('mensaje de error')
```

## Ejemplos prácticos

### Ejemplo 1: Test de un modelo

```typescript
import { describe, it, expect } from 'vitest';
import { Chat } from '../models/Chat.js';
import { Message } from '../models/Message.js';

describe('Chat Model', () => {
  describe('constructor', () => {
    it('should create a chat with required fields', () => {
      const chat = new Chat({
        model: 'llama3.1',
        title: 'My Chat'
      });

      expect(chat.model).toBe('llama3.1');
      expect(chat.title).toBe('My Chat');
      expect(chat.id).toBeDefined(); // Verifica que existe
      expect(chat.messages).toEqual([]); // Array vacío por defecto
    });

    it('should use default values', () => {
      const chat = new Chat({
        model: 'llama3.1'
      });

      expect(chat.title).toBe('Nuevo chat'); // Valor por defecto
      expect(chat.pinned).toBe(false);
    });
  });

  describe('addMessage', () => {
    it('should add a message to the chat', () => {
      const chat = new Chat({
        model: 'llama3.1',
        title: 'Test'
      });

      const message = new Message({ role: 'user', content: 'Hello' });
      chat.addMessage(message);

      expect(chat.messages).toHaveLength(1);
      expect(chat.messages[0]).toEqual(message);
    });
  });
});
```

### Ejemplo 2: Test de validadores

```typescript
import { describe, it, expect } from 'vitest';
import { createChatSchema } from '../validators/chatValidator.js';

describe('Validators', () => {
  describe('createChatSchema', () => {
    it('should validate correct data', () => {
      const data = {
        model: 'llama3.1',
        title: 'My Chat'
      };

      const result = createChatSchema.safeParse(data);
      expect(result.success).toBe(true);
    });

    it('should fail without model', () => {
      const data = {
        title: 'My Chat'
      };

      const result = createChatSchema.safeParse(data);
      expect(result.success).toBe(false);
    });

    it('should return error details', () => {
      const data = { title: 'Test' };
      const result = createChatSchema.safeParse(data);

      if (!result.success) {
        expect(result.error.issues).toBeDefined();
      }
    });
  });
});
```

### Ejemplo 3: Test con dependencias (mock)

```typescript
import { describe, it, expect, vi } from 'vitest';

// Simulando un módulo externo
vi.mock('../services/ollamaService.js', () => ({
  OllamaService: vi.fn().mockImplementation(() => ({
    listModels: vi.fn().mockResolvedValue([
      { name: 'llama3.1', size: 4000000000 }
    ])
  }))
}));

describe('OllamaService', () => {
  it('should return list of models', async () => {
    const service = new OllamaService();
    const models = await service.listModels('http://localhost:11434');
    
    expect(models).toHaveLength(1);
    expect(models[0].name).toBe('llama3.1');
  });
});
```

## Mejores prácticas

### 1. Nombra los tests descriptivamente

```typescript
// ❌ Malo
it('test 1', () => {})

// ✅ Bueno
it('should return the user when valid id is provided', () => {})
```

### 2. Follow AAA Pattern

```typescript
it('should calculate total correctly', () => {
  // Arrange
  const items = [{ price: 10 }, { price: 20 }];
  
  // Act
  const total = calculateTotal(items);
  
  // Assert
  expect(total).toBe(30);
});
```

### 3. Un solo concepto por test

```typescript
// ❌ Malo - Múltiples conceptos
it('should create user and update stats and send email', () => { ... })

// ✅ Bueno - Un concepto por test
it('should create user with default values', () => { ... })
it('should save user to database', () => { ... })
```

### 4. Tests independientes

```typescript
// ❌ Malo - Dependencia entre tests
it('creates user', () => {
  user = createUser();
  expect(user.id).toBeDefined();
});
it('updates user', () => {
  updateUser(user.id, { name: 'New' }); // Depende del anterior
});

// ✅ Bueno - Cada test es independiente
it('creates user with id', () => {
  const user = createUser();
  expect(user.id).toBeDefined();
});

it('updates user name', () => {
  const user = createUser();
  const updated = updateUser(user.id, { name: 'New' });
  expect(updated.name).toBe('New');
});
```

### 5.覆盖目标

- **Modelos**: 100% - Son la base de todo
- **Servicios**: 80%+ - Lógica de negocio crítica
- **Rutas**: 70%+ - Endpoints principales
- **Utils**: 100% - Funciones puras

## Cobertura de código

Ejecuta `npm run test:coverage` para ver qué líneas de código están probadas.

```bash
# Ver cobertura en HTML
npm run test:coverage

# Abrir reporte
# El reporte se genera en coverage/index.html
```

### Entendiendo el reporte

```
File               | % Stmts | % Branch | % Funcs | % Lines 
-------------------|---------|----------|---------|----------
 server/src/models |   100   |    95    |   100   |   100    
```

- **% Stmts**: Porcentaje de statements ejecutados
- **% Branch**: Porcentaje de ramas (if/else) ejecutadas
- **% Funcs**: Porcentaje de funciones llamadas
- **% Lines**: Porcentaje de líneas ejecutadas

## Ejecutar tests específicos

```bash
# Solo un archivo
npx vitest run server/src/test/Message.test.ts

# Solo un test
npx vitest run -t "should create a message"

# Modo watch para un archivo
npx vitest run server/src/test/validators.test.ts --watch
```

## Integración continua

Agrega al package.json:

```json
{
  "scripts": {
    "test": "vitest run",
    "test:coverage": "vitest run --coverage",
    "test:ci": "vitest run --coverage --reporter=json --outputFile=coverage/results.json"
  }
}
```

## Próximos pasos

1. **Ejecuta los tests existentes**: `npm test`
2. **Añade un test nuevo**: Crea un archivo `.test.ts` en `server/src/test/`
3. **Aumenta la cobertura**: Busca funciones sin test en el reporte de coverage
4. **Practica**: Intenta escribir tests para el ChatService

## Recursos adicionales

- [Vitest Docs](https://vitest.dev/)
- [Vitest API](https://vitest.dev/api/)
- [Testing Best Practices](https://testing-library.com/docs/)
