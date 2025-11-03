# Memory Bank: Telegram Posts Summarization Service

## 1. Project Brief

Web service for managing scenarios to work with Telegram group posts. The system collects messages from user's Telegram groups via Telegram Client API and allows creating custom scenarios with prompts for processing these messages.

**Core functionality:**
- Telegram authentication and group access
- Message collection from selected groups/channels
- Scenario management with custom prompts
- Multi-chat scenario support
- Prompt copying with real messages
- Local data storage for posts and scenarios
- Dark theme support

**Target use case:** Users who need to organize and process messages from multiple Telegram groups using custom prompts and AI tools.

## 2. System Architecture

### Core Components

**Monolithic Application (SvelteKit SSR)**
- Single application combining frontend and backend
- Server-side rendering and API routes
- Reactive UI with Svelte components
- Built-in API endpoints via `+server.ts` files

**Frontend (Svelte + CSS)**
- Web UI for user interactions
- Telegram authentication flow
- Scenario creation and management
- Chat selection and configuration
- Prompt editing and copying

**Backend (SvelteKit API Routes)**
- REST API endpoints via `+server.ts` files
- Telegram Client API integration via GramJS
- Business logic in `src/lib/server/`
- Session management and authentication

**Database (SQLite + Prisma)**
- Local file-based storage (`database.db`)
- User sessions and authentication data
- Chat metadata and message storage
- Scenario configurations and history

**External Services**
- Telegram API for message retrieval

### Data Flow

```
User -> SvelteKit Frontend -> API Routes -> Telegram API -> Messages
                            -> Database (storage)
         <- UI Display <- API Response <-
```

### Key Design Decisions

- **Monolithic SvelteKit**: Single application for simplicity and easier deployment
- **SQLite for MVP**: Local file database, easy migration to PostgreSQL later
- **Telegram Client API**: Full access to user's chats and message history
- **No LLM integration**: Service only manages scenarios and fetches messages
- **Session-based auth**: Telegram session strings stored securely for API access
- **Singleton TelegramService**: Prevents AUTH_KEY_DUPLICATED errors

## 3. Project Structure

```
tg-posts-summarization/
├── frontend/                           # Monolithic SvelteKit application
│   ├── src/
│   │   ├── routes/
│   │   │   ├── +page.svelte           # Landing page
│   │   │   ├── auth/+page.svelte      # Telegram authentication
│   │   │   ├── chats/+page.svelte     # Chat selection
│   │   │   ├── scenarios/             # Scenario pages
│   │   │   │   ├── +page.svelte       # Scenarios list
│   │   │   │   ├── new/+page.svelte   # Create scenario
│   │   │   │   └── [id]/+page.svelte  # Edit scenario
│   │   │   └── api/                   # SvelteKit API routes
│   │   │       ├── auth/
│   │   │       │   ├── send-code/+server.ts
│   │   │       │   └── sign-in/+server.ts
│   │   │       ├── chats/
│   │   │       │   ├── +server.ts
│   │   │       │   └── [chatId]/messages/+server.ts
│   │   │       └── scenarios/
│   │   │           ├── +server.ts
│   │   │           └── [id]/+server.ts
│   │   ├── lib/
│   │   │   ├── components/            # Svelte components
│   │   │   │   ├── ChatInput.svelte
│   │   │   │   ├── ScenarioForm.svelte
│   │   │   │   └── Navigation.svelte
│   │   │   ├── server/                # Server-side logic
│   │   │   │   ├── config.ts          # Configuration
│   │   │   │   ├── scenario.ts        # Scenario service
│   │   │   │   ├── telegram-client.ts # Telegram client
│   │   │   │   ├── storage.ts         # Prisma client
│   │   │   │   └── types.ts           # Backend types
│   │   │   ├── api.ts                 # Frontend API client
│   │   │   └── types.ts               # Frontend types
│   │   └── app.html                   # HTML template
│   ├── prisma/
│   │   ├── schema.prisma              # Database schema
│   │   └── migrations/                # Database migrations
│   ├── static/
│   │   └── styles/
│   │       └── app.css                # Main CSS file
│   ├── database.db                    # SQLite database file
│   ├── .env                           # Environment variables
│   ├── package.json
│   └── svelte.config.js
│
├── backend/                            # DEPRECATED - can be removed
│
├── memorybank.md                       # Technical documentation
└── README.md
```

## 4. Patterns and Examples

### SvelteKit API Route Pattern

**Context**: All API endpoints follow this structure for type safety and consistent error handling.

```typescript
// frontend/src/routes/api/scenarios/+server.ts
import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { ScenarioService } from '$lib/server/scenario';

const scenarioService = new ScenarioService();

export const GET: RequestHandler = async ({ request }) => {
  try {
    const userId = request.headers.get('X-User-Id');
    if (!userId) {
      return json({ error: 'Unauthorized' }, { status: 401 });
    }

    const scenarios = await scenarioService.getAll(parseInt(userId));
    return json(scenarios);
  } catch (error) {
    console.error('Error getting scenarios:', error);
    return json({ error: 'Failed to get scenarios' }, { status: 500 });
  }
};

export const POST: RequestHandler = async ({ request }) => {
  try {
    const userId = request.headers.get('X-User-Id');
    if (!userId) {
      return json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    // Validation logic
    const scenario = await scenarioService.create(parseInt(userId), body);
    return json(scenario, { status: 201 });
  } catch (error) {
    console.error('Error creating scenario:', error);
    return json({ error: 'Failed to create scenario' }, { status: 500 });
  }
};
```

### Telegram Client Service Pattern (Singleton)

**Context**: Manages Telegram client instances per user with session persistence. Uses singleton pattern to prevent AUTH_KEY_DUPLICATED errors.

```typescript
// frontend/src/lib/server/telegram-client.ts
export class TelegramService {
  private static instance: TelegramService;
  private clients: Map<number, TelegramClient> = new Map();
  private pendingAuths: Map<string, PendingAuth> = new Map();

  static getInstance(): TelegramService {
    if (!TelegramService.instance) {
      TelegramService.instance = new TelegramService();
    }
    return TelegramService.instance;
  }

  async getClient(userId: number, sessionString: string) {
    const existingClient = this.clients.get(userId);
    if (existingClient && existingClient.connected) {
      return existingClient;
    }
    return this.createClient(userId, sessionString);
  }

  async createClient(userId: number, sessionString: string) {
    const maxRetries = 3;
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      const session = new StringSession(sessionString);
      const client = new TelegramClient(session, apiId, apiHash, options);
      
      try {
        await client.connect();
        this.clients.set(userId, client);
        return client;
      } catch (error: any) {
        if (error.errorMessage === 'AUTH_KEY_DUPLICATED') {
          await client.disconnect();
          if (attempt < maxRetries) {
            await new Promise(resolve => setTimeout(resolve, 2000 * attempt));
            continue;
          }
        }
        throw error;
      }
    }
  }
}
```

### Prisma Database Pattern

**Context**: Type-safe database operations with error handling and data transformation.

```typescript
// frontend/src/lib/server/scenario.ts
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export class ScenarioService {
  async create(userId: number, data: CreateScenarioBody) {
    const scenario = await prisma.scenario.create({
      data: {
        userId,
        name: data.name,
        description: data.description,
        prompt: data.prompt,
        model: data.model,
        chatConfigs: {
          create: data.chatConfigs.map((config) => ({
            chatId: config.chatId,
            days: config.days
          }))
        }
      },
      include: {
        chatConfigs: {
          include: {
            chat: {
              select: {
                chatId: true,
                title: true,
                type: true,
                photoUrl: true
              }
            }
          }
        }
      }
    });
    return scenario;
  }
}
```

### Svelte Component Pattern

**Context**: Standard structure for Svelte pages with reactive data and component composition.

```svelte
<!-- frontend/src/routes/scenarios/[id]/+page.svelte -->
<script lang="ts">
  import { onMount } from 'svelte';
  import { page } from '$app/stores';
  import { api } from '$lib/api';
  import ChatInput from '$lib/components/ChatInput.svelte';
  import ScenarioForm from '$lib/components/ScenarioForm.svelte';

  let scenario: Scenario | null = null;
  let loading = true;

  onMount(async () => {
    const scenarioId = parseInt($page.params.id);
    try {
      scenario = await api.getScenario(scenarioId);
    } finally {
      loading = false;
    }
  });

  async function handleSave(event: CustomEvent) {
    const data = event.detail;
    await api.updateScenario(scenario.id, data);
  }
</script>

<div class="container">
  {#if loading}
    <p>Загрузка...</p>
  {:else if scenario}
    <ScenarioForm {scenario} on:save={handleSave} />
    <ChatInput 
      bind:prompt={scenario.prompt}
      on:beforecopy={handleSave}
    />
  {/if}
</div>
```

### API Client Pattern

**Context**: Frontend-backend communication with authentication headers.

```typescript
// frontend/src/lib/api.ts
const API_URL = '/api';  // Local SvelteKit API routes

function getHeaders() {
  const userId = localStorage.getItem('userId');
  return {
    'Content-Type': 'application/json',
    'X-User-Id': userId || '',
  };
}

export const api = {
  async getScenarios() {
    const res = await fetch(`${API_URL}/scenarios`, {
      headers: getHeaders(),
    });
    return res.json();
  },

  async createScenario(data: CreateScenarioData) {
    const res = await fetch(`${API_URL}/scenarios`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(data),
    });
    return res.json();
  },

  async getMessages(chatId: string, days: number) {
    const res = await fetch(
      `${API_URL}/chats/${chatId}/messages?days=${days}`,
      { headers: getHeaders() }
    );
    return res.json();
  },
};
```

### Component Composition Pattern

**Context**: Reusable components with event dispatching and slots.

```svelte
<!-- frontend/src/lib/components/ChatInput.svelte -->
<script lang="ts">
  import { createEventDispatcher } from 'svelte';

  export let prompt: string = '';
  export let fullPrompt: string = '';

  const dispatch = createEventDispatcher();

  async function handleCopyPrompt() {
    dispatch('beforecopy');
    await new Promise(resolve => setTimeout(resolve, 100));
    
    const textToCopy = fullPrompt || prompt;
    await navigator.clipboard.writeText(textToCopy);
    window.open('https://alice.yandex.ru/');
  }
</script>

<div class="chat-input-section">
  <textarea bind:value={prompt} />
  <button on:click={handleCopyPrompt}>📋</button>
</div>
```

## 5. Database Schema

### Core Models

**User Model**
```prisma
model User {
  id            Int       @id @default(autoincrement())
  telegramId    String    @unique
  username      String?
  firstName     String?
  lastName      String?
  phoneNumber   String?
  sessionString String?
  createdAt     DateTime  @default(now())
  updatedAt     DateTime  @updatedAt
  
  summaries     Summary[]
  scenarios     Scenario[]
}
```

**Chat Model**
```prisma
model Chat {
  id          Int      @id @default(autoincrement())
  chatId      String   @unique
  title       String
  type        String
  photoUrl    String?
  lastSync    DateTime?
  createdAt   DateTime @default(now())
  
  posts           Post[]
  summaries       Summary[]
  scenarioConfigs ScenarioChatConfig[]
}
```

**Post Model**
```prisma
model Post {
  id          Int      @id @default(autoincrement())
  messageId   String
  chatId      String
  authorId    String?
  authorName  String?
  text        String
  date        DateTime
  createdAt   DateTime @default(now())
  
  chat        Chat     @relation(fields: [chatId], references: [chatId])
  
  @@unique([chatId, messageId])
  @@index([chatId, date])
}
```

**Scenario Model**
```prisma
model Scenario {
  id          Int      @id @default(autoincrement())
  userId      Int
  name        String
  description String?
  prompt      String
  model       String   @default("yandexgpt")
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
  
  user        User     @relation(fields: [userId], references: [id])
  chatConfigs ScenarioChatConfig[]
  
  @@index([userId])
}
```

**ScenarioChatConfig Model**
```prisma
model ScenarioChatConfig {
  id          Int      @id @default(autoincrement())
  scenarioId  Int
  chatId      String
  days        Int
  createdAt   DateTime @default(now())
  
  scenario    Scenario @relation(fields: [scenarioId], references: [id], onDelete: Cascade)
  chat        Chat     @relation(fields: [chatId], references: [chatId])
  
  @@unique([scenarioId, chatId])
  @@index([scenarioId])
}
```

### Key Relationships

- **User -> Scenario**: One-to-many (user can have multiple scenarios)
- **Scenario -> ScenarioChatConfig**: One-to-many (scenario can have multiple chat configs)
- **Chat -> ScenarioChatConfig**: One-to-many (chat can be in multiple scenarios)
- **Chat -> Post**: One-to-many (chat contains multiple posts)

### Database Operations

**Migration Commands**
```bash
cd frontend
npm run prisma:generate
npm run prisma:migrate
npm run prisma:studio  # GUI for data viewing
```

## 6. API Documentation

### Authentication Endpoints

**POST /api/auth/send-code**
```typescript
Request: { phoneNumber: string }
Response: { phoneCodeHash: string } | { error: string }
```

**POST /api/auth/sign-in**
```typescript
Request: { 
  phoneNumber: string, 
  code: string, 
  phoneCodeHash: string,
  password?: string 
}
Response: { 
  telegramId: string,
  username?: string,
  firstName?: string,
  sessionString: string
} | { error: string }
```

### Chat Management Endpoints

**GET /api/chats**
```typescript
Headers: { "X-User-Id": string }
Response: Array<{ 
  id: string, 
  title: string, 
  type: string,
  photoUrl?: string 
}>
```

**GET /api/chats/[chatId]/messages?days=N**
```typescript
Headers: { "X-User-Id": string }
Query: { days: number }
Response: Array<{
  messageId: number,
  authorId?: string,
  authorName?: string,
  text: string,
  date: Date
}>
```

### Scenario Management Endpoints

**GET /api/scenarios**
```typescript
Headers: { "X-User-Id": string }
Response: Array<Scenario>
```

**POST /api/scenarios**
```typescript
Headers: { "X-User-Id": string }
Request: {
  name: string,
  description?: string,
  prompt: string,
  model: string,
  chatConfigs: Array<{ chatId: string, days: number }>
}
Response: Scenario | { error: string }
```

**GET /api/scenarios/[id]**
```typescript
Headers: { "X-User-Id": string }
Response: Scenario | { error: string }
```

**PUT /api/scenarios/[id]**
```typescript
Headers: { "X-User-Id": string }
Request: {
  name?: string,
  description?: string,
  prompt?: string,
  model?: string,
  chatConfigs?: Array<{ chatId: string, days: number }>
}
Response: Scenario | { error: string }
```

**DELETE /api/scenarios/[id]**
```typescript
Headers: { "X-User-Id": string }
Response: { success: true } | { error: string }
```

### Error Response Format

All endpoints return errors in consistent format:
```typescript
{
  error: string  // Human-readable error message
}
```

### Authentication Flow

1. User enters phone number -> `POST /api/auth/send-code`
2. Telegram sends code to user's phone
3. User enters code -> `POST /api/auth/sign-in`
4. Backend returns user data and `sessionString`
5. Frontend stores `userId` and `sessionString` in localStorage
6. All subsequent requests include `X-User-Id` header

## 7. Key Features

### Scenario Management
- Create, read, update, delete scenarios
- Multi-chat support per scenario
- Custom prompts for each scenario
- Configurable time periods (1-30 days) per chat

### Prompt Copying
- Copy full prompt with real messages from Telegram
- Auto-save prompts on copy
- Opens Yandex Alice in new tab
- Visual feedback with checkmark

### UI/UX Features
- Dark theme support via CSS media queries
- Mobile responsive design
- Burger menu for mobile navigation
- Sticky chat input interface
- Component-based architecture

### Technical Features
- Singleton TelegramService prevents AUTH_KEY_DUPLICATED
- Type-safe API with TypeScript
- Prisma ORM for database operations
- SvelteKit SSR for better performance
- Local SQLite database

## 8. Migration History

### From Separate Backend to Monolithic SvelteKit

**Previous Architecture:**
- Separate Fastify backend (port 3000)
- Separate SvelteKit frontend (port 5173)
- HTTP communication between services

**Current Architecture:**
- Single SvelteKit application
- API routes via `+server.ts` files
- Server logic in `src/lib/server/`
- Single port (5173 in dev)

**Migration Steps:**
1. Copied Prisma schema and migrations to frontend
2. Copied services to `frontend/src/lib/server/`
3. Created SvelteKit API routes in `frontend/src/routes/api/`
4. Updated API client to use local routes (`/api` instead of `http://localhost:3000/api`)
5. Fixed imports and TypeScript errors
6. Installed dependencies and generated Prisma Client
7. Tested application

**Benefits:**
- Simpler deployment (single application)
- Better type safety (shared types)
- Easier development (single dev server)
- Reduced complexity (no CORS, no separate ports)

## 9. Development Workflow

### Starting Development
```bash
cd frontend
npm install
npm run prisma:generate
npm run dev
```

### Database Management
```bash
# Generate Prisma Client
npm run prisma:generate

# Create migration
npm run prisma:migrate

# View database
npm run prisma:studio
```

### Type Checking
```bash
npm run check
```

### Building for Production
```bash
npm run build
npm run preview
```

## 10. Common Issues and Solutions

### AUTH_KEY_DUPLICATED Error
**Problem**: Multiple Telegram client instances with same session
**Solution**: Implemented singleton TelegramService with retry logic

### TypeScript Errors in setTimeout
**Problem**: `setTimeout` returns `NodeJS.Timeout` in Node.js
**Solution**: Use `ReturnType<typeof setTimeout>` for type

### Import Path Issues
**Problem**: `.js` extensions in imports don't work in SvelteKit
**Solution**: Remove `.js` extensions, use relative paths without extensions

### Prisma Client Not Found
**Problem**: Prisma Client not generated after schema changes
**Solution**: Run `npm run prisma:generate` after schema changes

### API Routes Not Working
**Problem**: API routes return 404
**Solution**: Ensure `+server.ts` files are in correct location under `src/routes/api/`