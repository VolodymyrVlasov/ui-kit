# ui-kit

Дизайн-система на **чистому CSS**, що не залежить від фреймворку, побудована
на токенах shadcn/ui. Без build-кроку, без npm, без залежностей — три
звичайні CSS-файли плюс локальні файли шрифтів, які можна підключити до
будь-якого веб-проєкту (або вбудувати в десктопну оболонку на кшталт
pywebview) і одразу почати користуватися.

Відкрийте [`index.html`](index.html), щоб побачити живу галерею всіх
токенів і компонентів.

## Структура папок

```
ui-kit/
├── index.html                Галерея компонентів / living style guide (демо-сайт)
├── css/
│   ├── theme.css              Токени дизайну: :root / [data-theme="dark"] змінні + @font-face
│   ├── components.css         Фасад — імпортує всі файли з components/
│   ├── components/
│   │   ├── buttons.css          Кнопки (+ глобальний base-скидання)
│   │   ├── forms.css            Поля форм: label, input, textarea, checkbox, radio
│   │   ├── selects.css          .select та .select-search
│   │   ├── labels.css           .label-text та .label-field
│   │   ├── cards.css            Картки та панелі
│   │   ├── badges.css           Бейджі
│   │   ├── tabs.css             Вкладки
│   │   ├── tables.css           Таблиці + варіанти стилів
│   │   ├── alerts.css           Алерти та toast
│   │   ├── preview.css          SVG preview-область
│   │   └── layouts.css          Готові лейаут-патерни
│   ├── layout.css              Flexbox/grid-утиліти, відступи, текстові хелпери, .container
│   └── gallery.css              Стилі лише для галереї-демо (НЕ копіювати в інші проєкти)
├── fonts/
│   └── Montserrat/
│       ├── Montserrat-Regular.woff2
│       ├── Montserrat-Medium.woff2
│       ├── Montserrat-SemiBold.woff2
│       └── Montserrat-Bold.woff2
├── README.md
└── .gitignore
```

## Використання в іншому проєкті

Скопіюйте `css/theme.css`, `css/components.css`, `css/components/` (уся
папка), `css/layout.css` та `fonts/` у свій проєкт (зберігаючи їхнє
взаємне розташування — `theme.css` посилається на шрифти через відносний
шлях `../fonts/Montserrat/...`), після чого підключіть три стилі в такому
порядку:

```html
<link rel="stylesheet" href="css/theme.css" />
<link rel="stylesheet" href="css/components.css" />
<link rel="stylesheet" href="css/layout.css" />
```

`theme.css` має завантажуватись першим — він визначає CSS-змінні, якими
користуються `components.css` і `layout.css`. Самі стилі не мають
залежності від JS; невеликий inline-скрипт в `index.html` потрібен лише
для демо-поведінки вкладок/кнопок копіювання/перемикача теми в галереї і
не є обов'язковим для повторного використання.

`css/gallery.css` та `index.html` — це виключно демо-сайт галереї, їх
**не потрібно** копіювати в інший проєкт.

## Теми

Перемикання теми відбувається через один атрибут `data-theme` на елементі
`<html>`:

- Без атрибута (або з будь-яким значенням, відмінним від `"dark"`) →
  світла тема (за замовчуванням, визначена на `:root`)
- `data-theme="dark"` → перевизначення для темної теми

```html
<html data-theme="dark">
```

Перемикання з JS:

```js
document.documentElement.setAttribute("data-theme", "dark");
document.documentElement.removeAttribute("data-theme");
```

Усі кольори компонентів виражені через `hsl(var(--token))`, тож зміна
атрибута миттєво перефарбовує кожен компонент без повторного рендеру.

## CSS-змінні (`theme.css`)

| Категорія   | Змінні |
|-------------|--------|
| Колір       | `--background`, `--foreground`, `--card`, `--card-foreground`, `--primary`, `--primary-foreground`, `--secondary`, `--secondary-foreground`, `--muted`, `--muted-foreground`, `--accent`, `--accent-foreground`, `--destructive`, `--destructive-foreground`, `--success`, `--success-foreground`, `--warning`, `--warning-foreground`, `--border`, `--input`, `--ring` |
| Радіус      | `--radius-sm`, `--radius`, `--radius-lg`, `--radius-full` |
| Типографіка | `--font-sans`, `--font-mono` |
| Тінь        | `--shadow-sm`, `--shadow`, `--shadow-md`, `--shadow-lg` |

Кольорові змінні зберігаються як трійки каналів `H S% L%` (конвенція
shadcn/ui) — завжди використовуйте їх обгорнутими в `hsl()`, наприклад
`background-color: hsl(var(--primary));`, або з альфа-модифікатором
`hsl(var(--primary) / 0.5)`.

**Важливо:** значення в `theme.css` — робочі й перевірені; не змінюйте їх
без свідомого наміру, оскільки від них залежать усі компоненти.

## Класи компонентів (`css/components/`)

- **Кнопки** (`buttons.css`): `btn`, `btn-primary`, `btn-secondary`,
  `btn-outline`, `btn-ghost`, `btn-destructive`, `btn-sm`, `btn-lg`,
  `btn-icon` (комбінуйте клас-варіант із класом розміру; стан `:disabled`
  обробляється автоматично)
- **Форми** (`forms.css`): `field`, `label`, `field-hint`, `input`,
  `textarea`, `checkbox`, `radio`
- **Селекти** (`selects.css`): `select` (нативний `<select>`, стилізований
  під `.input`), `select-search` / `select-search-input` /
  `select-search-list` / `select-search-option` (пошуковий
  комбобокс-патерн на чистих HTML/CSS/JS)
- **Лейбли** (`labels.css`): `label-text` (текст лише для читання),
  `label-field` (пара "підпис + значення") з модифікаторами
  `label-field--row` / `label-field--col`
- **Картки та панелі** (`cards.css`): `card`, `card-header`,
  `card-title`, `card-description`, `card-content`, `card-footer`,
  `panel`, `divider`
- **Бейджі** (`badges.css`): `badge`, `badge-secondary`, `badge-outline`,
  `badge-destructive`, `badge-success`
- **Вкладки** (`tabs.css`): `tabs`, `tabs-list`, `tab-trigger` (+
  `.is-active`), `tab-content` (+ `.is-active`) — прив'язуйте поведінку
  кліків за патерном `initTabs()` з `index.html` (будь-який контейнер
  `.tabs` виявляється автоматично, ідентифікатори не потрібні)
- **Таблиці** (`tables.css`): `table-wrapper`, `table`, а також варіанти
  `table-striped`, `table-bordered`, `table-compact` та статичний
  індикатор сортованого стовпця `th.sortable` (+ `.sort-asc` /
  `.sort-desc`)
- **Алерти та toast** (`alerts.css`): `alert`, `alert-destructive`,
  `alert-success`, `alert-warning`, `toast` (+ `.is-visible`)
- **Preview** (`preview.css`): `preview-area`, `preview-svg`
- **Лейаути** (`layouts.css`): `layout-row`, `layout-col`, `layout-full`,
  `layout-sidebar` (+ `layout-sidebar-aside` / `layout-sidebar-content`,
  ширина бічної панелі задається змінною `--layout-sidebar-width`),
  `layout-split`

## Утиліти лейауту (`layout.css`)

- Flex: `flex`, `flex-col`, `flex-wrap`, `items-center`, `items-start`,
  `items-end`, `justify-between`, `justify-center`, `justify-start`,
  `justify-end`
- Grid: `grid`, `grid-2`, `grid-3`, `grid-4`
- Відступ між елементами (flex або grid): `gap-1` … `gap-6`
- Внутрішні/зовнішні відступи: `p-0`…`p-6`, `px-0`…`px-6`, `py-0`…`py-6`,
  `m-0`…`m-6`, `mt-0`…`mt-6`, `mb-0`…`mb-6`
- Текст: `text-sm`, `text-lg`, `font-semibold`, `font-mono`, `text-muted`
- Лейаут: `container`

## Адаптивність (Responsive)

Кіт адаптивний за трьома брейкпоінтами (визначені як коментар-константа на
початку `css/layout.css`, ці ж пікселі використовуються послідовно в усіх
медіа-запитах кіту):

| Брейкпоінт         | Ширина viewport | Що змінюється |
|--------------------|-----------------|---------------|
| Mobile portrait    | `<480px`        | `.grid-2` стає одноколонковим; `.layout-split` стається у стовпчик; `.container` отримує менший горизонтальний відступ; кнопки/`.input`/`.select` отримують мінімальну висоту дотику ~44px |
| Mobile landscape   | `480–767px`     | `.grid-2` повертається до 2 колонок; `.grid-3`/`.grid-4` лишаються одноколонковими; `.layout-row` дозволяє перенесення (`flex-wrap: wrap`); кнопки/`.input`/`.select` усе ще ~44px |
| Tablet             | `768–1023px`    | `.grid-3`/`.grid-4` стають дво-колонковими; `.layout-sidebar` усе ще стек (бічна панель на весь рядок над контентом) — розгортається в дві колонки лише на десктопі |
| Desktop            | `>=1024px`      | Оригінальний, немодифікований лейаут: `.grid-3`/`.grid-4` — 4/3 колонки, `.layout-sidebar` — бічна панель фіксованої ширини поруч із контентом |

Додатково, незалежно від брейкпоінта:
- `.table-wrapper` завжди має `overflow-x: auto` — вузькі екрани скролять таблицю горизонтально замість стискання колонок
- Заголовки `h1`–`h3` масштабуються плавно через `clamp()` між мобільним і десктопним viewport, без стрибків на конкретних брейкпоінтах
- Головна навігація галереї (`.tabs-list` з 14 вкладками) скролиться горизонтально на mobile/tablet, не переносячись і не ламаючи лейаут

Реалізовано виключно медіа-запитами та `clamp()` — без `transform: scale`/`zoom`,
щоб текст лишався різким, а координати кліків — коректними на будь-якій ширині.

## Шрифти

Montserrat (Regular/400, Medium/500, SemiBold/600, Bold/700) вбудований
локально у вигляді статичних `.woff2`-файлів в `fonts/Montserrat/` і
підключається через `@font-face` в `theme.css`. Зовнішніх запитів до
шрифтів немає (жодного CDN Google Fonts, жодного `<link>` на віддалений
стиль) — усе резолвиться з локальної файлової системи, що робить цей
кіт безпечним для вбудовування в pywebview чи іншу офлайн/десктопну
оболонку.
