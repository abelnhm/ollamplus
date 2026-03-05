# 📚 REFACTOR - Arquitectura Hexagonal

## 🎯 Resumen de la Refactorización

Este documento describe la refactorización completa del proyecto **OllamaUI** aplicando **Arquitectura Hexagonal**, principios **SOLID** y **Clean Code**.

### Versión

- **Anterior**: 1.0.0 (Código monolítico)
- **Actual**: 2.0.0 (Arquitectura Hexagonal)

---

## 🏗️ Arquitectura Hexagonal (Puertos y Adaptadores)

La arquitectura hexagonal separa la lógica de negocio del código de infraestructura, permitiendo:

- ✅ Testabilidad mejorada
- ✅ Independencia de frameworks
- ✅ Flexibilidad para cambiar implementaciones
- ✅ Código más mantenible y escalable

### Estructura de Capas

```
┌─────────────────────────────────────────────┐
│         Presentation Layer (UI/HTTP)        │
│  ┌──────────────────────────────────────┐  │
│  │  Controllers │ Routes │ Middlewares  │  │
│  └──────────────────────────────────────┘  │
└─────────────────┬───────────────────────────┘
                  │
┌─────────────────▼───────────────────────────┐
│         Application Layer (Use Cases)       │
│  ┌──────────────────────────────────────┐  │
│  │  CreateChat │ SendMessage │ GetModels│  │
│  └──────────────────────────────────────┘  │
└─────────────────┬───────────────────────────┘
                  │
┌─────────────────▼───────────────────────────┐
│         Domain Layer (Business Logic)       │
│  ┌──────────────────────────────────────┐  │
│  │  Entities │ Value Objects │ Interfaces│  │
│  │  Chat │ Message │ MessageId │ ChatId │  │
│  └──────────────────────────────────────┘  │
└─────────────────┬───────────────────────────┘
                  │
┌─────────────────▼───────────────────────────┐
│      Infrastructure Layer (Adapters)        │
│  ┌──────────────────────────────────────┐  │
│  │  Ollama │ InMemoryRepo │ Express      │  │
│  └──────────────────────────────────────┘  │
└─────────────────────────────────────────────┘
```

---

## 📁 Nueva Estructura del Proyecto

```
IAS-PROYECT/
├── src/
│   ├── domain/                    # Capa de Dominio (Reglas de negocio)
│   │   ├── entities/
│   │   │   ├── Chat.js           # Entidad Chat (Aggregate Root)
│   │   │   └── Message.js        # Entidad Message
│   │   ├── value-objects/
│   │   │   ├── ChatId.js         # Identificador de Chat
│   │   │   ├── MessageId.js      # Identificador de Mensaje
│   │   │   ├── ModelName.js      # Nombre del modelo IA
│   │   │   └── MessageRole.js    # Rol del mensaje (user/assistant)
│   │   └── repositories/         # Interfaces (Ports)
│   │       ├── ChatRepository.js # Interfaz para persistencia
│   │       └── AIProvider.js     # Interfaz para proveedor IA
│   │
│   ├── application/               # Capa de Aplicación (Casos de Uso)
│   │   └── use-cases/
│   │       ├── CreateChatUseCase.js
│   │       ├── SendMessageUseCase.js
│   │       ├── GetAvailableModelsUseCase.js
│   │       ├── GetAllChatsUseCase.js
│   │       └── GetChatByIdUseCase.js
│   │
│   ├── infrastructure/            # Capa de Infraestructura (Adaptadores)
│   │   ├── repositories/
│   │   │   └── InMemoryChatRepository.js  # Implementación en memoria
│   │   ├── ai-providers/
│   │   │   └── OllamaAIProvider.js        # Implementación Ollama
│   │   └── http/
│   │       ├── ExpressServer.js           # Configuración Express
│   │       └── DependencyContainer.js     # Inyección de dependencias
│   │
│   └── presentation/              # Capa de Presentación (HTTP)
│       ├── controllers/
│       │   ├── ChatController.js          # Controlador de chats
│       │   └── ModelController.js         # Controlador de modelos
│       ├── routes/
│       │   ├── chatRoutes.js              # Rutas de chats
│       │   └── modelRoutes.js             # Rutas de modelos
│       └── middlewares/
│           ├── errorHandler.js            # Manejo de errores
│           └── logger.js                  # Logging HTTP
│
├── public/                        # Frontend (PWA)
│   ├── js/
│   │   ├── services/              # Servicios HTTP
│   │   │   ├── ChatService.js
│   │   │   └── ModelService.js
│   │   ├── ui/                    # Componentes UI
│   │   │   ├── ChatUI.js
│   │   │   └── ModelSelector.js
│   │   └── utils/                 # Utilidades
│   │       ├── LocalStorage.js
│   │       └── MarkdownRenderer.js
│   ├── app.js                     # Aplicación principal frontend
│   ├── index.html
│   ├── style.css
│   ├── manifest.json              # PWA Manifest
│   ├── sw.js                      # Service Worker
│   └── icons/
│
├── index.js                       # Punto de entrada
├── package.json
├── .env
└── README-REFACTOR.md            # Este archivo
```

---

## 🎨 Principios SOLID Aplicados

### 1. **S** - Single Responsibility Principle (SRP)

**Cada clase tiene una única responsabilidad**

**Antes:**

```javascript
// ❌ Una clase hacía TODO
class OllamaChat {
  sendMessage() {
    /* lógica de negocio + HTTP + persistencia */
  }
  listModels() {
    /* ... */
  }
  startServer() {
    /* ... */
  }
}
```

**Después:**

```javascript
// ✅ Responsabilidades separadas
class Message {
  /* Solo datos del mensaje */
}
class Chat {
  /* Solo lógica de chat */
}
class ChatRepository {
  /* Solo persistencia */
}
class ChatController {
  /* Solo HTTP */
}
class SendMessageUseCase {
  /* Solo caso de uso */
}
```

### 2. **O** - Open/Closed Principle (OCP)

**Abierto para extensión, cerrado para modificación**

```javascript
// ✅ Fácil agregar nuevos providers sin modificar código existente
export class AIProvider {
  /* Interfaz base */
}
export class OllamaAIProvider extends AIProvider {
  /* Implementación Ollama */
}
// Futuro: export class OpenAIProvider extends AIProvider { }
```

### 3. **L** - Liskov Substitution Principle (LSP)

**Las implementaciones pueden sustituir a sus interfaces**

```javascript
// ✅ Cualquier implementación de ChatRepository funciona igual
const repo1 = new InMemoryChatRepository();
const repo2 = new MongoDBChatRepository(); // Futuro
const repo3 = new PostgreSQLChatRepository(); // Futuro

// Todas son intercambiables sin romper el código
new CreateChatUseCase(repo1); // ✅
new CreateChatUseCase(repo2); // ✅
```

### 4. **I** - Interface Segregation Principle (ISP)

**Interfaces específicas y pequeñas**

```javascript
// ✅ Interfaces específicas, no una gigante
export class ChatRepository {
  /* Solo métodos de chats */
}
export class AIProvider {
  /* Solo métodos de IA */
}
// NO: export class Repository { /* Todo mezclado ❌ */ }
```

### 5. **D** - Dependency Inversion Principle (DIP)

**Depender de abstracciones, no de implementaciones concretas**

**Antes:**

```javascript
// ❌ Dependencia directa de implementación
import ollama from "ollama";
class ChatService {
  async send() {
    await ollama.chat(/*...*/); // Acoplado a Ollama
  }
}
```

**Después:**

```javascript
// ✅ Depende de abstracción (interfaz)
class SendMessageUseCase {
  constructor(chatRepository, aiProvider) {
    // Interfaces
    this.repo = chatRepository;
    this.ai = aiProvider;
  }
  // No sabe qué implementación concreta usa
}
```

---

## 🔄 Patrones de Diseño Implementados

### 1. **Repository Pattern**

Abstrae el acceso a datos

```javascript
// Interfaz (puerto)
export class ChatRepository {
  async save(chat) {
    throw new Error("Not implemented");
  }
}

// Adaptador (implementación)
export class InMemoryChatRepository extends ChatRepository {
  async save(chat) {
    /* Implementación real */
  }
}
```

### 2. **Dependency Injection**

Inyección de dependencias centralizada

```javascript
export class DependencyContainer {
  constructor() {
    // Crea todas las dependencias
    this.repo = new InMemoryChatRepository();
    this.aiProvider = new OllamaAIProvider();
    this.useCase = new CreateChatUseCase(this.repo);
    this.controller = new ChatController(this.useCase);
  }
}
```

### 3. **Value Object Pattern**

Objetos inmutables que representan valores

```javascript
export class MessageId {
  #value; // Privado, inmutable

  constructor(value) {
    this.#value = value; // No puede cambiarse después
  }

  equals(other) {
    return other.#value === this.#value;
  }
}
```

### 4. **Aggregate Pattern**

Chat es el Aggregate Root que gestiona Messages

```javascript
export class Chat {
  // Aggregate Root
  #messages = [];

  addMessage(message) {
    this.#messages.push(message);
    this.#lastMessageAt = new Date();
  }
  // Mantiene la consistencia interna
}
```

---

## 🆕 Mejoras Implementadas

### Backend

#### ✅ Separación de Responsabilidades

- **Domain**: Entidades y lógica de negocio pura
- **Application**: Casos de uso (orquestación)
- **Infrastructure**: Detalles técnicos (Ollama, HTTP)
- **Presentation**: Controllers y routes HTTP

#### ✅ Testabilidad

```javascript
// Fácil de testear con mocks
const mockRepo = { save: jest.fn() };
const mockAI = { sendMessage: jest.fn() };
const useCase = new SendMessageUseCase(mockRepo, mockAI);
```

#### ✅ Independencia de Framework

- El dominio NO conoce Express ni Ollama
- Fácil migrar a Fastify, Koa, etc.
- Fácil cambiar a OpenAI, Anthropic, etc.

#### ✅ Validaciones en el Dominio

```javascript
constructor(content) {
  if (!content || content.trim().length === 0) {
    throw new Error('content no puede estar vacío');
  }
}
```

### Frontend

#### ✅ Modularización

- **Services**: Comunicación HTTP
- **UI**: Componentes de interfaz
- **Utils**: Utilidades reutilizables

#### ✅ Separación de Concerns

```javascript
// Antes: Todo mezclado en app.js ❌
// Después: Responsabilidades separadas ✅
import { ChatService } from "./services/ChatService.js";
import { ChatUI } from "./ui/ChatUI.js";
import { LocalStorage } from "./utils/LocalStorage.js";
```

---

## 📊 Comparación Antes vs Después

| Aspecto                         | Antes                    | Después                     |
| ------------------------------- | ------------------------ | --------------------------- |
| **Líneas en archivo principal** | 328 líneas               | ~50 líneas                  |
| **Archivos**                    | 1 archivo monolítico     | 25+ archivos especializados |
| **Testabilidad**                | Difícil                  | Fácil (mocks simples)       |
| **Acoplamiento**                | Alto                     | Bajo                        |
| **Cambiar DB**                  | Reescribir código        | Crear nuevo adapter         |
| **Cambiar IA**                  | Modificar toda la lógica | Crear nuevo provider        |
| **Violaciones SOLID**           | Múltiples                | Ninguna                     |
| **Principios aplicados**        | 0                        | 10+ patrones y principios   |

---

## 🚀 Cómo Usar la Nueva Arquitectura

### Iniciar el Servidor

```bash
npm start
```

El servidor inicia usando el **DependencyContainer** que gestiona toda la inyección de dependencias.

### Agregar un Nuevo Caso de Uso

1. **Crear el Use Case** en `src/application/use-cases/`:

```javascript
export class DeleteChatUseCase {
  constructor(chatRepository) {
    this.repo = chatRepository;
  }

  async execute({ chatId }) {
    await this.repo.delete(new ChatId(chatId));
  }
}
```

2. **Registrar en DependencyContainer**:

```javascript
this.deleteChatUseCase = new DeleteChatUseCase(this.chatRepository);
```

3. **Crear Controller Method**:

```javascript
deleteChat = async (req, res) => {
  await this.deleteChatUseCase.execute({ chatId: req.params.chatId });
  res.json({ success: true });
};
```

### Cambiar de Proveedor de IA

Solo necesitas crear un nuevo adapter:

```javascript
// src/infrastructure/ai-providers/OpenAIProvider.js
export class OpenAIProvider extends AIProvider {
  async sendMessage(model, messages, url, onChunk) {
    // Implementación con OpenAI
  }
}

// En DependencyContainer.js
this.aiProvider = new OpenAIProvider(); // ¡Solo cambiar esta línea!
```

---

## 🧪 Testing

La arquitectura facilita enormemente el testing:

```javascript
// Test de Use Case
describe("CreateChatUseCase", () => {
  it("should create a chat", async () => {
    const mockRepo = {
      save: jest.fn(),
    };

    const useCase = new CreateChatUseCase(mockRepo);
    const result = await useCase.execute({
      model: "llama2",
      title: "Test Chat",
    });

    expect(mockRepo.save).toHaveBeenCalled();
    expect(result.title).toBe("Test Chat");
  });
});
```

---

## 📖 Recursos y Referencias

### Arquitectura Hexagonal

- [Hexagonal Architecture by Alistair Cockburn](https://alistair.cockburn.us/hexagonal-architecture/)
- [DDD, Hexagonal, Onion, Clean, CQRS](https://herbertograca.com/2017/11/16/explicit-architecture-01-ddd-hexagonal-onion-clean-cqrs-how-i-put-it-all-together/)

### SOLID

- [SOLID Principles](https://en.wikipedia.org/wiki/SOLID)
- [Clean Architecture by Robert C. Martin](https://blog.cleancoder.com/uncle-bob/2012/08/13/the-clean-architecture.html)

### Patrones

- [Domain-Driven Design by Eric Evans](https://www.domainlanguage.com/ddd/)
- [Patterns of Enterprise Application Architecture](https://martinfowler.com/eaaCatalog/)

---

## 🎓 Conceptos Clave

### Value Objects

Objetos inmutables que representan valores del dominio:

- `MessageId`, `ChatId`: Identificadores tipados
- `ModelName`: Nombre de modelo validado
- `MessageRole`: Enum type-safe

### Entities

Objetos con identidad que pueden cambiar:

- `Message`: Un mensaje individual
- `Chat`: Conversación completa (Aggregate Root)

### Repositories

Interfaces que abstraen la persistencia:

- El dominio define QUÉ necesita
- La infraestructura define CÓMO lo hace

### Use Cases

Casos de uso que orquestan la lógica de negocio:

- Un caso de uso = una acción del usuario
- Coordinan entities, repositories y services

---

## 💡 Beneficios de esta Refactorización

1. **Mantenibilidad** ⬆️
   - Código organizado y fácil de encontrar
   - Cambios localizados en módulos específicos

2. **Testabilidad** ⬆️⬆️
   - Fácil mockear dependencias
   - Tests unitarios simples y rápidos

3. **Escalabilidad** ⬆️⬆️⬆️
   - Agregar features sin romper código existente
   - Múltiples desarrolladores sin conflictos

4. **Flexibilidad** ⬆️⬆️
   - Cambiar tecnologías sin reescribir
   - Reutilizar lógica en diferentes contextos

5. **Calidad** ⬆️⬆️⬆️
   - Menos bugs (validaciones en dominio)
   - Código autodocumentado

---

## 🔮 Próximos Pasos Sugeridos

### Corto Plazo

- [ ] Agregar tests unitarios
- [ ] Implementar persistencia real (MongoDB/PostgreSQL)
- [ ] Agregar más validaciones en el dominio

### Medio Plazo

- [ ] Implementar CQRS (separar comandos de consultas)
- [ ] Agregar eventos de dominio
- [ ] Implementar caching

### Largo Plazo

- [ ] Migrar a microservicios
- [ ] Agregar autenticación y autorización
- [ ] Implementar event sourcing

---

## 📝 Conclusión

Esta refactorización transforma un proyecto monolítico en una aplicación profesional con:

✅ **Arquitectura clara y mantenible**
✅ **Principios SOLID aplicados correctamente**
✅ **Código limpio y autodocumentado**
✅ **Fácil de testear y extender**
✅ **Independiente de frameworks y librerías**

El código ahora está preparado para crecer y evolucionar sin convertirse en un "big ball of mud".

---

**Autor**: Refactorización aplicada en enero 2026
**Versión**: 2.0.0
