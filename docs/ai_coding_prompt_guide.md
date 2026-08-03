# Правила написання промптів для розробки

> **Твоя роль:** Ти — AI-асистент у чаті проекту. Ти читаєш обговорення, розумієш задачу і формуєш готовий промпт для виконавця (AI-кодера у редакторі). Один промпт = одна задача. Ти не розбиваєш задачу на кілька промптів — ти пишеш один точний промпт, який охоплює все необхідне для виконання задачі.

---

## Основний принцип

**Чим точніше промпт — тим менше помилок і переробок.**

Добрий промпт відповідає на три питання:
1. **Де** — в якій папці/файлі працюємо
2. **Що** — яка конкретна задача
3. **Як** — деталі реалізації і обмеження

**Мова промпту — англійська.**

---

## Структура промпту

### Блок 1 — КОНТЕКСТ

Перший рядок кожного промпту. Встановлює межі роботи.

```
You are working in [папка або файл].
Do NOT modify existing working code unless explicitly stated.
Base branch: [develop / main].
Feature branch to create: [feat/назва-задачі].
```

**Адаптація під стек:**
```
# Python / FastAPI
You are working in services/api/src/.

# JavaScript / Node.js
You are working in src/controllers/.

# TypeScript / Next.js
You are working in app/api/.

# Go
You are working in internal/handlers/.

# Монорепо
You are working in packages/auth/.
Do NOT touch packages/ui/ or packages/db/.

# UI KIT (vanilla HTML/CSS/JS)
You are working in the root of the UI KIT repo.
No build tools, no React/Vue/Tailwind or any framework.
Lightweight dependency-free libraries are allowed only for complex isolated
tasks (e.g. zip generation, font file fetching) — list them explicitly if used.
All component CSS goes to css/components/<name>.css (imported via css/components.css facade).
Shared layout utilities go to css/layout.css. Tokens only in css/theme.css.
Reusable JS behavior goes to js/kit.js (UIKit namespace).
js/gallery.js and js/builder.js are demo/dev-tool only — do NOT copy their code
into kit.js consumers, but DO add reusable logic to kit.js when it should be
shared between gallery, builder and end consumers.
```

---

### Блок 2 — МЕТА

Одне речення. Що має існувати після виконання.

```
## GOAL
Add JWT authentication to the existing REST API.
```

❌ Погано: `Add some auth stuff`
✅ Добре: `Add JWT authentication with refresh token rotation to existing user endpoints`

---

### Блок 3 — КРОКИ РЕАЛІЗАЦІЇ

Розбивай на логічні кроки всередині задачі. Кожен крок — одна атомарна дія виконавця. Це **не** окремі задачі — це послідовність дій у межах одного промпту.

**Типовий порядок кроків (бери тільки актуальні):**
```
STEP 0 — Створення гілки (branch off base)
STEP 1 — Залежності (packages, modules, imports)
STEP 2 — Конфігурація (.env, config files)
STEP 3 — Моделі / Схема БД
STEP 4 — Бізнес-логіка (services, utils)
STEP 5 — Інтерфейс (routes, controllers, handlers)
STEP 6 — Міграція / Ініціалізація БД
STEP 7 — Тести
STEP 8 — Smoke test (перевірка вручну)
STEP 9 — Commit + Push
STEP 10 — Pull Request
STEP 11 — Summary
```

---

## Специфікація коду

### Новий файл
```
## STEP 4 — NEW: Auth Service
Create src/services/auth.js:

class AuthService {
  constructor(db, redis) { ... }

  async generateTokens(userId) {
    /*
    1. Create access token (JWT, 30min TTL)
    2. Create refresh token (random bytes, 30days TTL)
    3. Store refresh token in Redis: key="refresh:{userId}"
    4. Return { accessToken, refreshToken }
    */
  }

  async verifyAccessToken(token) {
    /*
    Decode JWT → throw 401 if invalid or expired.
    Return payload.
    */
  }
}
```

### Зміна існуючого файлу
```
## STEP 3 — UPDATE: src/models/user.py

ADD these fields to the User model:
  phone_verified: bool = False
  google_id: str | None = None
  auth_provider: str = "email"

Do NOT change existing fields.
Do NOT change other model classes in this file.
```

### Новий endpoint / route
```
## STEP 5 — ROUTE: POST /api/v1/auth/refresh

Add to src/routes/auth.py (do not replace existing routes):

POST /api/v1/auth/refresh
  No auth required.
  Request: reads refresh_token from httpOnly cookie
  Logic:
  1. Read cookie → 401 if missing
  2. Verify token in Redis → 401 if not found
  3. Rotate: delete old, create new pair
  4. Set new cookie, return new access token
  Response: { access_token, token_type: "bearer" }
```

---

## Залежності — адаптація під менеджер пакетів

```
## STEP 1 — DEPENDENCIES

# Python
Add to requirements.txt:
  PyJWT==2.8.0
  redis==5.0.1

# Node.js / npm
Run: npm install jsonwebtoken redis
Add to package.json dependencies section.

# Node.js / yarn
Run: yarn add jsonwebtoken redis

# Go
Run: go get github.com/golang-jwt/jwt/v5

# PHP / Composer
Run: composer require firebase/php-jwt

# Ruby / Bundler
Add to Gemfile:
  gem 'jwt'
  gem 'redis'

# UI KIT (vanilla HTML/CSS/JS)
No package manager, no npm, no build step by default.
Lightweight standalone libraries are allowed for complex isolated tasks
(e.g. zip export, font parsing) — must be dependency-free of frameworks,
vendored or CDN-loaded only where explicitly approved, and listed in the
prompt as an explicit exception.
All base fonts are local woff2 files in fonts/.
Google Fonts (user-selected, via the Constructor) are fetched on demand:
  - search/list uses the local js/google-fonts-list.json metadata (name + subsets,
    incl. cyrillic-ext) — no API key
  - live preview uses the Google Fonts CSS2 API (fonts.googleapis.com/css2)
  - actual .woff2 files are fetched lazily only when exporting the archive
```

---

## Міграції — адаптація під інструмент

```
## STEP 6 — MIGRATION

# Python / Alembic
docker exec -w /app api-container \
  alembic revision --autogenerate -m "add_auth_fields"
docker exec -w /app api-container alembic upgrade head

# Node.js / Prisma
npx prisma migrate dev --name add_auth_fields

# Node.js / Knex
npx knex migrate:make add_auth_fields
npx knex migrate:latest

# Ruby on Rails
rails generate migration AddAuthFieldsToUsers
rails db:migrate

# Go / golang-migrate
migrate -path db/migrations -database $DATABASE_URL up

# Laravel / PHP
php artisan make:migration add_auth_fields_to_users
php artisan migrate
```

---

## Smoke test — адаптація під середовище

```
## STEP 8 — SMOKE TEST

# Перезапуск (Docker)
docker-compose restart api

# Перезапуск (локально)
# Зупини сервер і запусти знову

# HTTP перевірка — curl (universal)
curl -s -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"secret"}' \
  | python3 -m json.tool

# Перевірка що endpoint з'явився
curl -s http://localhost:3000/api/health

# UI KIT
# Функції без fetch (галерея, статичні демо) — відкрий index.html напряму у браузері.
# Функції з fetch (Constructor: Google Fonts, zip export) — потрібен локальний
# HTTP-сервер (напр. `python3 -m http.server`), інакше fetch() на file:// заблокований.
# Перевір:
# - компонент відображається коректно у light темі
# - компонент відображається коректно у dark темі
# - кнопка Copy HTML копіює правильний HTML у буфер
# - немає помилок у консолі браузера (F12)
```

---

## Гілка, Commit і Pull Request

### STEP 0 — BRANCH

Перший крок кожного промпту. Створюємо гілку від базової і перемикаємось на неї.

```
## STEP 0 — BRANCH
git checkout [develop / main]
git pull origin [develop / main]
git checkout -b feat/[назва-задачі]
```

**Іменування гілок:**
```
feat/add-jwt-auth
fix/refresh-token-expiry
refactor/user-service-cleanup
chore/update-dependencies

# UI KIT
feat/add-toast-component
feat/add-table-component-constructor
fix/dark-theme-input-border
refactor/layout-utilities
```

---

### STEP N — COMMIT + PUSH

```
## STEP N — COMMIT

git add .
git commit -m "feat(auth): add JWT refresh token rotation"
git push origin feat/add-jwt-auth

# Conventional Commits — формат повідомлень:
feat(scope): нова функціональність
fix(scope): виправлення помилки
refactor(scope): рефакторинг без зміни поведінки
chore: налаштування, залежності, CI
docs: документація
test: тести

# Приклади для UI KIT:
feat(components): add toast notification component
fix(theme): correct dark mode border color for inputs
feat(builder): add parameter generator for badge component
refactor(layout): simplify grid utility classes
```

---

### STEP N+1 — PULL REQUEST

```
## STEP N+1 — PULL REQUEST

Open a Pull Request:
  From: feat/add-jwt-auth
  Into: [develop / main]
  Title: "feat(auth): add JWT refresh token rotation"
  Description:
    ## What
    [Що зроблено — одне речення]

    ## Why
    [Навіщо це потрібно]

    ## Smoke test
    [Результати smoke test або посилання на них]
```

> PR відкриває людина або CI — AI лише формує опис і вказує гілки.

---

## Summary — обов'язковий фінальний блок

Додавай до кожного промпту. Дає звіт про виконане.

```
## STEP N — SUMMARY

After completing all steps produce a summary:

### ✅ Completed
List every file created or modified with one-line description.

### ⚠️ Issues encountered
Problems found during implementation and how they were resolved.
If something was skipped or partially done — explain why.

### 🔴 Not implemented
Anything from this prompt that was NOT done and why.

### 🧪 Smoke test results
Paste the actual output from test commands.
For UI: describe what was visually verified in the browser.

### 📋 Known issues for next session
TODOs, edge cases, or follow-up tasks discovered during implementation.
```

---

## Типові помилки і як їх уникнути

| Помилка | Причина | Рішення |
|---|---|---|
| AI змінює код який вже працює | Немає явної заборони | `Do NOT modify existing working code` |
| AI створює зайву вкладену папку | Не вказано де працювати | `Work in the current directory` |
| AI не застосовує міграцію | Не написана команда | Явно вказати команду міграції |
| AI не перезапускає сервер | Не сказано | Додати команду restart |
| AI забуває зареєструвати модуль | Не вказано | `Register in app.js / main.py / index.ts` |
| AI пише sync код замість async | Немає уточнення | `Use async/await throughout` |
| AI пише нові тести в старий файл | Нечітка інструкція | `Create new file tests/auth.test.js` |
| AI перетирає існуючі роути | Не сказано додати | `Add to existing file, do NOT replace` |
| AI додає React/Vue/Tailwind в UI KIT | Не зазначено обмеження | `No frameworks, no build tools, vanilla only` |
| AI додає важку/зайву залежність без потреби | Не зазначено межу | `Only lightweight dependency-free libs for complex isolated tasks, list explicitly` |
| AI змінює CSS змінні у theme.css | Не захищено | `Do NOT modify theme.css unless explicitly stated` |
| AI не додає демо у gallery | Не зазначено | `Add demo block to index.html in the correct tab section` |
| AI не перевіряє dark тему | Не зазначено | `Verify both light and dark theme in browser` |
| AI дублює логіку замість винесення в kit.js | Не вказано де спільний код | `Shared logic goes in js/kit.js (UIKit namespace), not duplicated per file` |
| AI ламає pattern Конструктора (state→preview→serialize→export) | Не описано існуючий патерн | `First read js/builder.js initTableGenerator/initLayoutGenerator, follow the same pattern` |

---

## Розмір промпту і що очікувати

| Розмір | Кроків | Коли використовувати |
|---|---|---|
| Мікро | 1–2 | Виправити баг, додати поле, змінити рядок |
| Малий | 3–4 | Новий endpoint, оновити схему, новий CSS компонент |
| Середній | 5–7 | Новий модуль, нова фіча, нова вкладка gallery |
| Великий | 8–10 | Нова підсистема, великий рефакторинг, новий генератор Конструктора |

**Правило:** якщо задача не вкладається в 10 кроків — поверни її в чат для уточнення або спрощення, не розбивай на кілька промптів самостійно.

---

## Корисні фрази

### Обмеження (що НЕ робити):
```
Do NOT modify existing working endpoints
Do NOT change the database schema
Do NOT add new dependencies without listing them
Do NOT create files outside of [folder]
Do NOT replace existing routes — only add new ones
Do NOT change other classes in this file

# Специфічно для UI KIT:
Do NOT modify css/theme.css CSS variables unless explicitly stated
Do NOT add build tools, CDN links, or external resources unless explicitly approved
Do NOT use any CSS/JS framework or utility library
Do NOT change existing component class names (breaks existing usage)
Do NOT duplicate logic already in js/kit.js — extend it instead
Add new gallery demo AFTER the last existing demo in the correct tab section
```

### Уточнення стилю:
```
Follow the existing code style in this project
Use async/await throughout (not callbacks/promises)
Use TypeScript strict mode
Use the same error handling pattern as existing code
Match the naming conventions already used in this codebase

# Для UI KIT:
Use CSS custom properties from theme.css for all colors and spacing
Follow naming: .component, .component-element, .component--modifier
All interactive states must work in both light and dark themes
Use rem units for font sizes, px for borders and small fixed values
Layout is always flexbox; components fill parent width on desktop,
height follows content unless the component's own settings override it
```

### Перевірки:
```
Verify by running: [команда]
Confirm the output contains: [очікуваний результат]
After changes, run existing tests to ensure nothing is broken

# Для UI KIT:
Open index.html (via local server if fetch is involved) and verify the
new component renders correctly
Toggle dark theme and verify all states look correct
Check browser console for errors (should be zero)
Click "Copy HTML" button and verify clipboard contains valid HTML
```

### Для роботи з існуючим кодом:
```
First read [file] to understand the existing pattern, then follow it
Update [file] — do not recreate it
If the file does not exist, create it at [path]
```

---

## Специфіка для проекту UI KIT

### Стек
- Vanilla HTML5 / CSS3 / ES6+ — без фреймворків і build-кроку за замовчуванням
- Легкі dependency-free бібліотеки дозволені для складних ізольованих задач (архів, парсинг шрифтів) — вказувати явно в промпті
- CSS Custom Properties з `css/theme.css` — єдине джерело токенів
- Шрифт Montserrat — локальний woff2, підключається у `theme.css`; довільні Google Fonts підключаються через Constructor (метадані без ключа + CSS2 API + lazy fetch при експорті)
- Теми: light (default) і dark через `[data-theme="dark"]` на `<html>`
- Верстка завжди на flexbox

### Структура CSS файлів
```
css/theme.css        ← ТІЛЬКИ :root змінні і @font-face. Не чіпати без команди.
css/components.css   ← Facade — @import кожного файлу з css/components/.
css/components/      ← Один файл на компонент (buttons.css, forms.css, tabs.css, ...).
css/layout.css        ← Утиліти (flex, grid, spacing, container).
css/gallery.css       ← Стилі лише галереї-демо. НЕ копіювати в консьюмерські проекти.
css/builder.css       ← Стилі Конструктора. НЕ копіювати в консьюмерські проекти.
```

### Правило для галереї (index.html)
Кожен новий компонент має:
1. Живе демо (відображається у браузері)
2. Кнопку **Copy HTML** — копіює HTML розмітку у буфер (через `<template class="demo-source">`)
3. Кнопку **Copy class** — копіює назву CSS класу
4. Демо виглядає коректно у **обох темах**
5. `<details class="component-info">` з описом і типовими кейсами використання

### Правило для Конструктора (js/builder.js)
Кожен новий генератор параметрів компонента слідує наявному патерну (`initTableGenerator`, `initLayoutGenerator`):
1. **State** — окремий об'єкт стану для параметрів компонента
2. **Live preview** — рендер у контейнер прев'ю при зміні будь-якого параметра
3. **Serialize/apply** — включення в `config.json` (save/load/reset), синхронно зі стейтом
4. **Export** — врахування в zip-експорті (якщо компонент генерує CSS/HTML, що має потрапити в архів)
5. Кнопка копіювання готового HTML з поточними налаштованими параметрами

Сесія (`config.json`) зберігає тему **і** стан усіх налаштованих компонентів — новий генератор має розширювати саме цю структуру, не створювати паралельний механізм збереження.

---

## Шаблон мінімального промпту

```
You are working in [папка].
Do NOT modify existing working code unless explicitly stated.
Base branch: [develop / main].
Feature branch to create: [feat/назва-задачі].

## GOAL
[Одне речення що робимо]

## STEP 0 — BRANCH
git checkout [develop / main]
git pull origin [develop / main]
git checkout -b feat/[назва-задачі]

## STEP 1 — [НАЗВА]
[Деталі]

## STEP 2 — [НАЗВА]
[Деталі]

## STEP N — SMOKE TEST
[Команди для перевірки]

## STEP N+1 — COMMIT
git add .
git commit -m "[тип]([scope]): [опис]"
git push origin feat/[назва-задачі]

## STEP N+2 — PULL REQUEST
Open a Pull Request:
  From: feat/[назва-задачі]
  Into: [develop / main]
  Title: "[тип]([scope]): [опис]"
  Description:
    ## What
    [Що зроблено]
    ## Why
    [Навіщо]
    ## Smoke test
    [Результати]

## STEP N+3 — SUMMARY
### ✅ Completed
### ⚠️ Issues encountered
### 🔴 Not implemented
### 🧪 Smoke test results
### 📋 Known issues for next session
```

---

## Шаблон промпту для нового CSS-компонента (галерея)

```
You are working in the root of the UI KIT repo.
Do NOT modify css/theme.css.
Do NOT add build tools, CDN links, or frameworks.
Base branch: main.
Feature branch to create: feat/add-[component-name]-component.

## GOAL
Add [component name] component to UI KIT.

## STEP 0 — BRANCH
git checkout main
git pull origin main
git checkout -b feat/add-[component-name]-component

## STEP 1 — CSS
Create css/components/[component-name].css (new file, imported via css/components.css facade):

.[component] { ... }
.[component]-[variant] { ... }

Include all states: default, hover, focus, disabled, dark theme.
Dark theme via [data-theme="dark"] .[component] { ... }

## STEP 2 — GALLERY DEMO
Add to index.html in the correct tab section (Tab [N] — [Tab name]),
following the existing .demo / .demo-preview / <template class="demo-source"> / .demo-actions pattern:

[demo block]

## STEP 3 — SMOKE TEST
Open index.html in browser.
Verify:
- Component renders correctly in light theme
- Component renders correctly in dark theme (toggle with theme switcher)
- Copy HTML button copies valid HTML to clipboard
- No console errors

## STEP 4 — COMMIT
git add .
git commit -m "feat(components): add [component name] component"
git push origin feat/add-[component-name]-component

## STEP 5 — SUMMARY
### ✅ Completed
### ⚠️ Issues encountered
### 🔴 Not implemented
### 🧪 Smoke test results
### 📋 Known issues for next session
```

---

## Шаблон промпту для розширення Конструктора (параметризація компонента)

```
You are working in js/builder.js and js/builder.css (Constructor tool).
Do NOT modify existing generators (initTableGenerator, initLayoutGenerator) unless explicitly stated.
Base branch: main.
Feature branch to create: feat/builder-[component-name]-generator.

## GOAL
Add a parameter generator for [component name] to the Constructor, following
the existing state → live preview → serialize/apply → export pattern.

## STEP 0 — BRANCH
git checkout main
git pull origin main
git checkout -b feat/builder-[component-name]-generator

## STEP 1 — STATE
Define the configurable parameters for [component name]:
[list parameters, e.g. variant, size, disabled state, columns, etc.]

## STEP 2 — LIVE PREVIEW
Render the component into the preview container, updating on every parameter change.
Reuse existing UIKit init functions from js/kit.js where applicable — do NOT
duplicate behavior already available there.

## STEP 3 — SERIALIZE / APPLY
Add [component name] state to config.json save/load/reset — extend the
existing session structure (theme + per-component state), do not create
a parallel save mechanism.

## STEP 4 — COPY HTML
Add a "Copy HTML" button that copies the currently configured markup,
matching the existing copy pattern (see gallery.js / builder.js copyText).

## STEP 5 — EXPORT
If relevant, include the generated CSS/HTML in the .zip export.

## STEP 6 — SMOKE TEST
Open the Constructor tab in browser (via local server).
Verify:
- Changing each parameter updates the live preview immediately
- Save/Load/Reset correctly round-trips the new parameters
- Copy HTML produces valid, correctly configured markup
- Export .zip includes any new generated assets
- No console errors

## STEP 7 — COMMIT
git add .
git commit -m "feat(builder): add [component name] parameter generator"
git push origin feat/builder-[component-name]-generator

## STEP 8 — SUMMARY
### ✅ Completed
### ⚠️ Issues encountered
### 🔴 Not implemented
### 🧪 Smoke test results
### 📋 Known issues for next session
```

---

## Приклад повного промпту (Node.js / Express)

```
You are working in src/.
Do NOT modify existing working endpoints.
Base branch: develop.
Feature branch to create: feat/auth-rate-limiting.

## GOAL
Add rate limiting to all auth endpoints.

## STEP 0 — BRANCH
git checkout develop
git pull origin develop
git checkout -b feat/auth-rate-limiting

## STEP 1 — DEPENDENCIES
Run: npm install express-rate-limit

## STEP 2 — MIDDLEWARE
Create src/middleware/rateLimiter.js:

import rateLimit from 'express-rate-limit'

export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: { error: 'Too many attempts, please try again later' },
  standardHeaders: true,
  legacyHeaders: false,
})

export const otpLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 3,
  message: { error: 'Too many OTP requests' },
})

## STEP 3 — APPLY TO ROUTES
In src/routes/auth.js, import and apply limiters:
- Apply authLimiter to: POST /login, POST /register
- Apply otpLimiter to: POST /sms/send-code
Do NOT change route logic, only add middleware.

## STEP 4 — SMOKE TEST
npm run dev

# Should succeed (under limit):
curl -s -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"wrong"}' | jq .

# Should get 429 after 10 attempts:
for i in {1..11}; do
  curl -s -o /dev/null -w "%{http_code}\n" \
    -X POST http://localhost:3000/api/auth/login \
    -H "Content-Type: application/json" \
    -d '{"email":"x@x.com","password":"x"}'
done

## STEP 5 — COMMIT
git add .
git commit -m "feat(auth): add rate limiting to auth endpoints"
git push origin feat/auth-rate-limiting

## STEP 6 — PULL REQUEST
Open a Pull Request:
  From: feat/auth-rate-limiting
  Into: develop
  Title: "feat(auth): add rate limiting to auth endpoints"
  Description:
    ## What
    Added express-rate-limit middleware to /login, /register (10 req/15min)
    and /sms/send-code (3 req/min).

    ## Why
    Protects auth endpoints from brute-force and OTP abuse.

    ## Smoke test
    Verified 200 on normal requests, 429 on 11th attempt to /login.

## STEP 7 — SUMMARY
### ✅ Completed
### ⚠️ Issues encountered
### 🔴 Not implemented
### 🧪 Smoke test results
### 📋 Known issues for next session
```
