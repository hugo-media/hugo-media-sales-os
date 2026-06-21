# Hugo Media Sales OS

Приватна внутрішня CRM-система для Hugo Media Group. Це не AI-агент, не генератор текстів і не система масових розсилок. Це робочий dashboard для щоденного контролю лідів, follow-up, задач, контенту, шаблонів і pipeline.

## Стек

- Next.js App Router
- TypeScript
- Tailwind CSS
- Supabase-ready SQL schema
- Vercel-ready структура

## Запуск локально

```bash
pnpm install
pnpm dev
```

Відкрийте `http://localhost:3000`.

## Supabase

1. Створіть Supabase project.
2. В SQL editor виконайте `supabase/schema.sql`.
3. Для демо-даних виконайте `supabase/seed.sql`.
4. Для реальної синхронізації додайте `.env.local` локально або Environment Variables у Vercel:

```bash
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
```

Без цих змінних система автоматично працює з локальним збереженням у браузері (`localStorage`), тому зміни не зникають після reload на тому самому пристрої. Коли Supabase env-змінні додані, UI читає і записує `leads`, `tasks`, `content_items`, `templates` і `status_history` у Supabase. Auth/password protection навмисно не додано.

## Реалізовано

- Темний адаптивний dashboard українською мовою
- Sidebar з позиціонуванням Hugo Media Group
- Статистика, задачі на сьогодні, follow-up, останні ліди, pipeline
- CRUD лідів у браузері, фільтри, пошук, статуси, lead detail
- Follow-up правила при зміні статусів
- Автостворення задач для КП, дзвінка і виграної угоди
- Tasks, Follow-ups, Calendar, Content Plan, Scripts/Templates, Analytics, Settings
- Автозбереження у браузері без auth
- Supabase sync при наявності `NEXT_PUBLIC_SUPABASE_URL` і `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- Supabase tables: leads, tasks, content_items, templates, status_history, settings

## Деплой на Vercel

```bash
pnpm build
```

Після підключення репозиторію до Vercel встановіть змінні Supabase у Project Settings → Environment Variables.
