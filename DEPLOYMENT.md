# Deployment Guide

Это руководство описывает процесс деплоя приложения на Vercel.

## Предварительные требования

1. Аккаунт на [Vercel](https://vercel.com)
2. Аккаунт на [GitHub](https://github.com)
3. Telegram API credentials (получить на https://my.telegram.org/apps)

## Шаг 1: Подготовка проекта

1. Убедитесь, что все изменения закоммичены в Git
2. Отправьте код на GitHub:
   ```bash
   git add .
   git commit -m "Prepare for deployment"
   git push origin main
   ```

## Шаг 2: Создание проекта на Vercel

### Вариант A: Через веб-интерфейс Vercel

1. Зайдите на [vercel.com](https://vercel.com) и войдите через GitHub
2. Нажмите "Add New Project"
3. Выберите ваш репозиторий `tg-posts-summarization`
4. Настройте проект:
   - **Framework Preset**: Other
   - **Root Directory**: `frontend`
   - **Build Command**: `npm run build`
   - **Output Directory**: `.svelte-kit`
   - **Install Command**: `npm install && npx prisma generate`

5. Добавьте переменные окружения (Environment Variables):
   ```
   DATABASE_URL=file:./prod.db
   TELEGRAM_API_ID=your_api_id
   TELEGRAM_API_HASH=your_api_hash
   ```

6. Нажмите "Deploy"

### Вариант B: Через Vercel CLI

1. Установите Vercel CLI:
   ```bash
   npm install -g vercel
   ```

2. Войдите в Vercel:
   ```bash
   vercel login
   ```

3. Перейдите в директорию frontend:
   ```bash
   cd frontend
   ```

4. Запустите деплой:
   ```bash
   vercel
   ```

5. Следуйте инструкциям CLI для настройки проекта

6. Добавьте переменные окружения:
   ```bash
   vercel env add DATABASE_URL
   vercel env add TELEGRAM_API_ID
   vercel env add TELEGRAM_API_HASH
   ```

7. Задеплойте в production:
   ```bash
   vercel --prod
   ```

## Шаг 3: Настройка GitHub Actions (опционально)

Для автоматического деплоя при каждом push в main:

1. Получите Vercel токен:
   - Зайдите в [Vercel Settings → Tokens](https://vercel.com/account/tokens)
   - Создайте новый токен

2. Получите Project ID и Org ID:
   ```bash
   cd frontend
   vercel link
   cat .vercel/project.json
   ```

3. Добавьте секреты в GitHub:
   - Зайдите в Settings → Secrets and variables → Actions
   - Добавьте секреты:
     - `VERCEL_TOKEN` - ваш Vercel токен
     - `VERCEL_ORG_ID` - из `.vercel/project.json`
     - `VERCEL_PROJECT_ID` - из `.vercel/project.json`

4. GitHub Actions автоматически задеплоит при push в main

## Шаг 4: Настройка базы данных

⚠️ **Важно**: SQLite на Vercel работает только в read-only режиме после деплоя.

Для production рекомендуется использовать:
- **PostgreSQL** (Vercel Postgres, Supabase, Neon)
- **MySQL** (PlanetScale)
- **MongoDB** (MongoDB Atlas)

### Миграция на PostgreSQL (рекомендуется)

1. Создайте PostgreSQL базу на [Vercel Postgres](https://vercel.com/docs/storage/vercel-postgres)

2. Обновите `frontend/prisma/schema.prisma`:
   ```prisma
   datasource db {
     provider = "postgresql"
     url      = env("DATABASE_URL")
   }
   ```

3. Создайте новую миграцию:
   ```bash
   cd frontend
   npx prisma migrate dev --name switch_to_postgres
   ```

4. Обновите переменную окружения `DATABASE_URL` на Vercel:
   ```
   DATABASE_URL=postgresql://user:password@host:5432/database
   ```

5. Задеплойте изменения:
   ```bash
   git add .
   git commit -m "Switch to PostgreSQL"
   git push origin main
   ```

## Проверка деплоя

После успешного деплоя:

1. Откройте URL вашего приложения (например, `https://your-app.vercel.app`)
2. Проверьте, что страница авторизации загружается
3. Попробуйте войти через Telegram
4. Проверьте создание и редактирование сценариев

## Troubleshooting

### Ошибка "Module not found"
- Убедитесь, что все зависимости указаны в `package.json`
- Проверьте, что `npx prisma generate` выполняется в build команде

### Ошибка с базой данных
- Проверьте переменную окружения `DATABASE_URL`
- Для production используйте PostgreSQL вместо SQLite

### Ошибка с Telegram API
- Проверьте переменные `TELEGRAM_API_ID` и `TELEGRAM_API_HASH`
- Убедитесь, что они добавлены в Environment Variables на Vercel

### Таймаут при выполнении функций
- Увеличьте `maxDuration` в `svelte.config.js`
- Для бесплатного плана максимум 10 секунд
- Для Pro плана можно увеличить до 60 секунд

## Полезные ссылки

- [Vercel Documentation](https://vercel.com/docs)
- [SvelteKit Adapter Vercel](https://kit.svelte.dev/docs/adapter-vercel)
- [Prisma with Vercel](https://www.prisma.io/docs/guides/deployment/deployment-guides/deploying-to-vercel)
- [Vercel Environment Variables](https://vercel.com/docs/concepts/projects/environment-variables)