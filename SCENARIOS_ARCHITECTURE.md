# Архитектура системы сценариев суммаризации

## Обзор

Система сценариев позволяет пользователям создавать, сохранять и повторно использовать конфигурации для суммаризации нескольких чатов с настраиваемыми параметрами.

## 1. Модель данных (Prisma Schema)

### 1.1 Scenario (Сценарий)
```prisma
model Scenario {
  id          Int      @id @default(autoincrement())
  userId      Int
  name        String   // Название сценария
  description String?  // Описание сценария
  prompt      String   // Кастомный промпт
  model       String   @default("yandexgpt") // Модель AI (пока только yandexgpt)
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
  
  user        User     @relation(fields: [userId], references: [id])
  chatConfigs ScenarioChatConfig[]
  executions  ScenarioExecution[]
  
  @@index([userId])
}
```

### 1.2 ScenarioChatConfig (Конфигурация чата в сценарии)
```prisma
model ScenarioChatConfig {
  id          Int      @id @default(autoincrement())
  scenarioId  Int
  chatId      String
  days        Int      // Количество дней для анализа
  createdAt   DateTime @default(now())
  
  scenario    Scenario @relation(fields: [scenarioId], references: [id], onDelete: Cascade)
  chat        Chat     @relation(fields: [chatId], references: [chatId])
  
  @@unique([scenarioId, chatId])
  @@index([scenarioId])
}
```

### 1.3 ScenarioExecution (История запусков)
```prisma
model ScenarioExecution {
  id          Int      @id @default(autoincrement())
  scenarioId  Int
  prompt      String   // Промпт на момент запуска (может отличаться от текущего)
  result      String   // Результат суммаризации
  status      String   // success, error
  error       String?  // Текст ошибки если status = error
  executedAt  DateTime @default(now())
  
  scenario    Scenario @relation(fields: [scenarioId], references: [id], onDelete: Cascade)
  
  @@index([scenarioId, executedAt])
}
```

### 1.4 Обновление существующих моделей
```prisma
// Добавить в модель User
scenarios   Scenario[]

// Добавить в модель Chat
scenarioConfigs ScenarioChatConfig[]
```

## 2. Backend API

### 2.1 Endpoints для сценариев

#### GET /api/scenarios
Получить все сценарии пользователя
```typescript
Response: Scenario[]
```

#### GET /api/scenarios/:id
Получить сценарий по ID с конфигурациями чатов
```typescript
Response: {
  id: number;
  name: string;
  description: string;
  prompt: string;
  model: string;
  createdAt: string;
  updatedAt: string;
  chatConfigs: Array<{
    id: number;
    chatId: string;
    days: number;
    chat: {
      id: string;
      title: string;
      type: string;
      photoUrl?: string;
    }
  }>;
}
```

#### POST /api/scenarios
Создать новый сценарий
```typescript
Request: {
  name: string;
  description?: string;
  prompt: string;
  model: string;
  chatConfigs: Array<{
    chatId: string;
    days: number;
  }>;
}
Response: Scenario
```

#### PUT /api/scenarios/:id
Обновить сценарий
```typescript
Request: {
  name?: string;
  description?: string;
  prompt?: string;
  model?: string;
  chatConfigs?: Array<{
    chatId: string;
    days: number;
  }>;
}
Response: Scenario
```

#### DELETE /api/scenarios/:id
Удалить сценарий
```typescript
Response: { success: boolean }
```

### 2.2 Endpoints для запуска сценариев

#### POST /api/scenarios/:id/execute
Запустить сценарий
```typescript
Response: {
  executionId: number;
  result: string;
  status: 'success' | 'error';
  error?: string;
}
```

### 2.3 Endpoints для истории

#### GET /api/scenarios/:id/executions
Получить историю запусков сценария
```typescript
Query params:
  - limit?: number (default: 20)
  - offset?: number (default: 0)

Response: {
  executions: Array<{
    id: number;
    prompt: string;
    result: string;
    status: string;
    error?: string;
    executedAt: string;
  }>;
  total: number;
}
```

#### GET /api/scenarios/executions/:executionId
Получить детали конкретного запуска
```typescript
Response: {
  id: number;
  scenarioId: number;
  scenarioName: string;
  prompt: string;
  result: string;
  status: string;
  error?: string;
  executedAt: string;
}
```

## 3. Backend Services

### 3.1 ScenarioService
```typescript
class ScenarioService {
  // CRUD операции
  async create(userId: number, data: CreateScenarioData): Promise<Scenario>
  async update(scenarioId: number, userId: number, data: UpdateScenarioData): Promise<Scenario>
  async delete(scenarioId: number, userId: number): Promise<void>
  async getById(scenarioId: number, userId: number): Promise<ScenarioWithChats>
  async getAll(userId: number): Promise<Scenario[]>
  
  // Запуск сценария
  async execute(scenarioId: number, userId: number): Promise<ExecutionResult>
  
  // История
  async getExecutions(scenarioId: number, userId: number, limit: number, offset: number): Promise<ExecutionHistory>
  async getExecutionById(executionId: number, userId: number): Promise<ExecutionDetail>
}
```

### 3.2 Модификация Summarizer
```typescript
class Summarizer {
  // Существующий метод для одного чата
  async summarize(messages: Message[], customPrompt?: string): Promise<string>
  
  // Новый метод для нескольких чатов
  async summarizeMultipleChats(
    chatsData: Array<{
      chatId: string;
      chatTitle: string;
      messages: Message[];
    }>,
    customPrompt: string
  ): Promise<string>
}
```

## 4. Frontend

### 4.1 Новые страницы

#### /scenarios
Список всех сценариев пользователя
- Карточки сценариев с названием, описанием, количеством чатов
- Кнопки: "Создать сценарий", "Запустить", "Редактировать", "Удалить"
- Показ последнего запуска (дата, статус)

#### /scenarios/new
Создание нового сценария
- Форма с полями:
  - Название сценария (обязательно)
  - Описание (опционально)
  - Выбор модели (пока только YandexGPT)
  - Кастомный промпт (textarea с дефолтным значением)
  - Список чатов с чекбоксами
  - Для каждого выбранного чата: поле "Количество дней"
- Кнопки: "Сохранить", "Отмена"

#### /scenarios/:id/edit
Редактирование сценария
- Та же форма что и при создании, но с предзаполненными данными
- Кнопки: "Сохранить изменения", "Отмена"

#### /scenarios/:id
Детали сценария и история запусков
- Информация о сценарии:
  - Название, описание
  - Модель
  - Список чатов с периодами
  - Промпт (свернутый, можно развернуть)
- Кнопка "Запустить сценарий"
- История запусков:
  - Таблица/список с колонками:
    - Дата и время
    - Статус (успех/ошибка)
    - Кнопка "Показать результат"
  - Пагинация
- Модальное окно для просмотра результата:
  - Дата запуска
  - Использованный промпт
  - Результат суммаризации
  - Кнопка "Закрыть"

### 4.2 Компоненты

#### ScenarioCard.svelte
Карточка сценария для списка
```typescript
Props:
  - scenario: Scenario
  - onRun: (id: number) => void
  - onEdit: (id: number) => void
  - onDelete: (id: number) => void
```

#### ScenarioForm.svelte
Форма создания/редактирования сценария
```typescript
Props:
  - scenario?: Scenario (для редактирования)
  - chats: Chat[]
  - onSubmit: (data: ScenarioFormData) => void
  - onCancel: () => void
```

#### ChatSelector.svelte
Компонент выбора чатов с настройкой периода
```typescript
Props:
  - chats: Chat[]
  - selectedChats: Array<{ chatId: string, days: number }>
  - onChange: (selected: Array<{ chatId: string, days: number }>) => void
```

#### ExecutionHistoryTable.svelte
Таблица истории запусков
```typescript
Props:
  - executions: Execution[]
  - onViewResult: (executionId: number) => void
  - total: number
  - currentPage: number
  - onPageChange: (page: number) => void
```

#### ExecutionResultModal.svelte
Модальное окно с результатом запуска
```typescript
Props:
  - execution: ExecutionDetail
  - onClose: () => void
```

### 4.3 API Client (frontend/src/lib/api.ts)
```typescript
// Добавить методы:
async getScenarios(): Promise<Scenario[]>
async getScenario(id: number): Promise<ScenarioWithChats>
async createScenario(data: CreateScenarioData): Promise<Scenario>
async updateScenario(id: number, data: UpdateScenarioData): Promise<Scenario>
async deleteScenario(id: number): Promise<void>
async executeScenario(id: number): Promise<ExecutionResult>
async getScenarioExecutions(id: number, limit?: number, offset?: number): Promise<ExecutionHistory>
async getExecutionDetail(executionId: number): Promise<ExecutionDetail>
```

### 4.4 Types (frontend/src/lib/types.ts)
```typescript
export interface Scenario {
  id: number;
  name: string;
  description?: string;
  prompt: string;
  model: string;
  createdAt: string;
  updatedAt: string;
}

export interface ScenarioChatConfig {
  id: number;
  chatId: string;
  days: number;
  chat: Chat;
}

export interface ScenarioWithChats extends Scenario {
  chatConfigs: ScenarioChatConfig[];
}

export interface CreateScenarioData {
  name: string;
  description?: string;
  prompt: string;
  model: string;
  chatConfigs: Array<{
    chatId: string;
    days: number;
  }>;
}

export interface UpdateScenarioData {
  name?: string;
  description?: string;
  prompt?: string;
  model?: string;
  chatConfigs?: Array<{
    chatId: string;
    days: number;
  }>;
}

export interface ScenarioExecution {
  id: number;
  prompt: string;
  result: string;
  status: 'success' | 'error';
  error?: string;
  executedAt: string;
}

export interface ExecutionResult {
  executionId: number;
  result: string;
  status: 'success' | 'error';
  error?: string;
}

export interface ExecutionHistory {
  executions: ScenarioExecution[];
  total: number;
}

export interface ExecutionDetail extends ScenarioExecution {
  scenarioId: number;
  scenarioName: string;
}
```

## 5. Навигация

Добавить в Header.svelte новую ссылку:
```svelte
<a href="/scenarios" class="nav-link">
  📋 Сценарии
</a>
```

## 6. План реализации (порядок задач)

### Этап 1: База данных и миграции
1. Обновить `schema.prisma` с новыми моделями
2. Создать миграцию
3. Применить миграцию

### Этап 2: Backend - Базовый CRUD
1. Создать типы в `backend/src/types/index.ts`
2. Создать `ScenarioService` в `backend/src/services/scenario.ts`
3. Создать роуты в `backend/src/api/routes/scenarios.ts`
4. Подключить роуты в `backend/src/api/server.ts`

### Этап 3: Backend - Логика запуска
1. Модифицировать `Summarizer` для работы с несколькими чатами
2. Реализовать метод `execute` в `ScenarioService`
3. Реализовать сохранение истории запусков

### Этап 4: Frontend - Типы и API
1. Добавить типы в `frontend/src/lib/types.ts`
2. Добавить методы API в `frontend/src/lib/api.ts`

### Этап 5: Frontend - Список сценариев
1. Создать страницу `/scenarios/+page.svelte`
2. Создать компонент `ScenarioCard.svelte`
3. Реализовать загрузку и отображение списка

### Этап 6: Frontend - Создание сценария
1. Создать страницу `/scenarios/new/+page.svelte`
2. Создать компонент `ScenarioForm.svelte`
3. Создать компонент `ChatSelector.svelte`
4. Реализовать логику создания

### Этап 7: Frontend - Редактирование
1. Создать страницу `/scenarios/[id]/edit/+page.svelte`
2. Переиспользовать `ScenarioForm.svelte`
3. Реализовать логику обновления

### Этап 8: Frontend - Детали и история
1. Создать страницу `/scenarios/[id]/+page.svelte`
2. Создать компонент `ExecutionHistoryTable.svelte`
3. Создать компонент `ExecutionResultModal.svelte`
4. Реализовать запуск сценария
5. Реализовать просмотр истории

### Этап 9: UI/UX улучшения
1. Добавить индикаторы загрузки
2. Добавить подтверждения удаления
3. Добавить валидацию форм
4. Добавить уведомления об успехе/ошибке

### Этап 10: Тестирование
1. Протестировать создание сценария
2. Протестировать запуск сценария
3. Протестировать редактирование
4. Протестировать удаление
5. Протестировать историю

## 7. Особенности реализации

### 7.1 Суммаризация нескольких чатов
При запуске сценария с несколькими чатами:
1. Для каждого чата загружаются сообщения за указанный период
2. Сообщения группируются по чатам
3. В промпт добавляется информация о том, из какого чата каждое сообщение
4. YandexGPT создает общую суммаризацию, учитывая контекст всех чатов

Пример формата промпта:
```
[Промпт пользователя]

Сообщения для анализа:

=== Чат: "Название чата 1" ===
[01.11 10:30] Сообщение 1
[01.11 11:45] Сообщение 2

=== Чат: "Название чата 2" ===
[01.11 09:15] Сообщение 3
[01.11 14:20] Сообщение 4
```

### 7.2 Сохранение промпта в истории
При каждом запуске сохраняется текущий промпт сценария, чтобы можно было видеть, какой именно промпт использовался для конкретного результата.

### 7.3 Каскадное удаление
При удалении сценария автоматически удаляются:
- Все конфигурации чатов (`ScenarioChatConfig`)
- Вся история запусков (`ScenarioExecution`)

### 7.4 Валидация
- Название сценария: обязательное, 3-100 символов
- Минимум 1 чат должен быть выбран
- Количество дней: 1-30 для каждого чата
- Промпт: обязательный, минимум 10 символов

## 8. Будущие улучшения

1. **Поддержка других моделей AI**
   - Claude
   - GPT-4
   - Llama

2. **Расписание запусков**
   - Автоматический запуск по расписанию (ежедневно, еженедельно)
   - Email-уведомления с результатами

3. **Экспорт результатов**
   - PDF
   - Markdown
   - HTML

4. **Шаблоны промптов**
   - Библиотека готовых промптов
   - Возможность сохранять свои промпты как шаблоны

5. **Аналитика**
   - Статистика использования сценариев
   - Графики активности чатов
   - Облако тегов из суммаризаций

6. **Совместная работа**
   - Возможность делиться сценариями с другими пользователями
   - Публичные сценарии

7. **Улучшенная история**
   - Сравнение результатов разных запусков
   - Поиск по истории
   - Фильтрация по датам и статусам