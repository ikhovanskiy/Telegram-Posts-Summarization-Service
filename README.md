# Telegram Posts Summarization Service

Веб-сервис для создания сценариев работы с постами из Telegram-групп.

## 🎯 Возможности

- 🔐 Авторизация через Telegram Client API
- 📱 Доступ к вашим Telegram-группам и каналам
- 📊 Сбор постов за выбранный период (от 1 до 30 дней)
- 🎭 Создание и управление сценариями с кастомными промптами
- 📋 Копирование полных промптов с реальными сообщениями
- 💾 Локальное хранение данных
- 🌐 Удобный веб-интерфейс
- 🌓 Автоматическая поддержка темной темы

## 🏗️ Архитектура

```
┌─────────────────────────────────────┐
│         SvelteKit SSR               │
│  ┌──────────────┐  ┌──────────────┐ │
│  │   Frontend   │  │   Backend    │ │
│  │   (Svelte)   │  │  (API Routes)│ │
│  └──────────────┘  └──────────────┘ │
│         │                  │         │
│         └──────────────────┘         │
└─────────────────┬───────────────────┘
                  │
         ┌────────┴────────┐
         ▼                 ▼
  ┌──────────────┐  ┌─────────────┐
  │    SQLite    │  │  Telegram   │
  │   Database   │  │     API     │
  └──────────────┘  └─────────────┘
```

## 🛠️ Технологический стек

### Монолитное приложение (SvelteKit)
- **SvelteKit** - фулстек фреймворк с SSR
- **TypeScript** - типизированный JavaScript
- **Чистый CSS** - без фреймворков стилизации
- **Vite** - быстрый сборщик

### Backend (встроен в SvelteKit)
- **SvelteKit API Routes** - серверные эндпоинты
- **GramJS** - Telegram Client API
- **Prisma** - ORM для работы с БД
- **SQLite** - локальная файловая база данных

## 📦 Установка

### Требования

- Node.js 18+
- npm или yarn

### Клонирование репозитория

```bash
git clone <repository-url>
cd tg-posts-summarization
```

### Установка зависимостей

```bash
cd frontend
npm install
```

## ⚙️ Конфигурация

Создайте файл `frontend/.env`:

```bash
cd frontend
cp .env.example .env
```

Затем отредактируйте `.env` и заполните реальные значения:

```env
# Database
DATABASE_URL="file:./database.db"

# Telegram API (получить на https://my.telegram.org)
TELEGRAM_API_ID=your_api_id
TELEGRAM_API_HASH=your_api_hash

# Server
PORT=3000
```

#### Получение Telegram API ключей

1. Перейдите на https://my.telegram.org
2. Войдите с вашим номером телефона
3. Перейдите в "API development tools"
4. Создайте новое приложение
5. Скопируйте `api_id` и `api_hash`

**Важно:** Файл `.env` содержит секретные данные и не должен попадать в git (уже добавлен в `.gitignore`).

### Инициализация базы данных

```bash
cd frontend
npm run prisma:generate
npm run prisma:migrate
```

## 🚀 Запуск

### Режим разработки

```bash
cd frontend
npm run dev
```

Приложение будет доступно по адресу: http://localhost:5173

### Продакшен

```bash
cd frontend
npm run build
npm run preview
```

## 📖 Использование

1. **Авторизация**
   - Откройте http://localhost:5173
   - Нажмите "Войти через Telegram"
   - Введите номер телефона
   - Введите код из Telegram

2. **Создание сценария**
   - Перейдите в раздел "Сценарии"
   - Нажмите "Создать сценарий"
   - Заполните название и описание
   - Выберите чаты и укажите период
   - Напишите промпт для обработки сообщений

3. **Копирование промпта**
   - Откройте сценарий
   - Отредактируйте промпт при необходимости
   - Нажмите кнопку 📋 для копирования полного промпта с реальными сообщениями
   - Промпт автоматически сохранится в базу данных

## 📁 Структура проекта

```
tg-posts-summarization/
├── frontend/                    # Монолитное SvelteKit приложение
│   ├── src/
│   │   ├── routes/             # Страницы и API routes
│   │   │   ├── api/            # Серверные API эндпоинты
│   │   │   │   ├── auth/       # Авторизация
│   │   │   │   ├── chats/      # Работа с чатами
│   │   │   │   └── scenarios/  # Управление сценариями
│   │   │   ├── scenarios/      # Страницы сценариев
│   │   │   └── +page.svelte    # Главная страница
│   │   ├── lib/
│   │   │   ├── components/     # Svelte компоненты
│   │   │   ├── server/         # Серверная логика
│   │   │   │   ├── config.ts   # Конфигурация
│   │   │   │   ├── scenario.ts # Сервис сценариев
│   │   │   │   ├── telegram-client.ts # Telegram клиент
│   │   │   │   └── types.ts    # Типы
│   │   │   ├── api.ts          # API клиент
│   │   │   └── types.ts        # Фронтенд типы
│   │   └── app.html            # HTML шаблон
│   ├── prisma/
│   │   ├── schema.prisma       # Схема БД
│   │   └── migrations/         # Миграции
│   ├── static/
│   │   └── styles/             # CSS стили
│   ├── database.db             # SQLite файл
│   ├── .env                    # Переменные окружения
│   └── package.json
│
├── backend/                     # Устаревший backend (можно удалить)
├── memorybank.md               # Техническая документация
└── README.md
```

## 🔧 Разработка

### Просмотр базы данных

```bash
cd frontend
npm run prisma:studio
```

### Проверка типов

```bash
cd frontend
npm run check
```

### Работа с Prisma

```bash
# Генерация Prisma Client
npm run prisma:generate

# Создание миграции
npm run prisma:migrate

# Открыть Prisma Studio
npm run prisma:studio
```

## 📝 API Endpoints

### Авторизация
- `POST /api/auth/send-code` - Отправка кода
- `POST /api/auth/sign-in` - Вход

### Чаты
- `GET /api/chats` - Список чатов
- `GET /api/chats/[chatId]/messages?days=N` - Сообщения из чата

### Сценарии
- `GET /api/scenarios` - Список сценариев
- `POST /api/scenarios` - Создание сценария
- `GET /api/scenarios/[id]` - Получение сценария
- `PUT /api/scenarios/[id]` - Обновление сценария
- `DELETE /api/scenarios/[id]` - Удаление сценария

## 🎨 Особенности UI

- **Адаптивный дизайн** - работает на мобильных устройствах
- **Темная тема** - автоматическое переключение по системным настройкам
- **Burger menu** - на мобильных устройствах
- **Sticky chat interface** - фиксированный интерфейс ввода
- **Компонентная архитектура** - переиспользуемые компоненты

## 🔄 Миграция с раздельной архитектуры

Проект был мигрирован с раздельной архитектуры (backend + frontend) на монолитную (SvelteKit SSR):

**Было:**
- Отдельный Fastify backend на порту 3000
- Отдельный SvelteKit frontend на порту 5173
- Взаимодействие через HTTP API

**Стало:**
- Единое SvelteKit приложение
- API routes встроены в SvelteKit
- Серверная логика в `src/lib/server/`
- Все на одном порту (5173 в dev, настраивается в prod)

## 🤝 Вклад в проект

1. Fork репозитория
2. Создайте ветку для фичи (`git checkout -b feature/amazing-feature`)
3. Commit изменения (`git commit -m 'Add amazing feature'`)
4. Push в ветку (`git push origin feature/amazing-feature`)
5. Откройте Pull Request

## 📄 Лицензия

MIT

## 🙏 Благодарности

- [SvelteKit](https://kit.svelte.dev/)
- [Prisma](https://www.prisma.io/)
- [GramJS](https://gram.js.org/)