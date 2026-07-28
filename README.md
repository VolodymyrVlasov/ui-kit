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
│   │   ├── layouts.css          Готові лейаут-патерни
│   │   ├── upload.css           .dropzone — файловий дропзон (UI/стан, без мережевої логіки)
│   │   └── loaders.css          Спінери, .loader-inline/.loader-progress, .progress
│   ├── layout.css              Flexbox/grid-утиліти, відступи, текстові хелпери, .container
│   └── gallery.css              Стилі лише для галереї-демо (НЕ копіювати в інші проєкти)
├── js/
│   ├── kit.js                   UIKit — вкладки, toast, дропзон, лоадери, розширені інпути (перевикористовуваний)
│   ├── gallery.js               Скрипт лише для галереї-демо (НЕ копіювати в інші проєкти)
│   └── builder.js               Конструктор теми/експорт .zip — dev-інструмент (НЕ копіювати в інші проєкти)
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
папка), `css/layout.css`, `js/kit.js` та `fonts/` у свій проєкт (зберігаючи
їхнє взаємне розташування — `theme.css` посилається на шрифти через
відносний шлях `../fonts/Montserrat/...`), після чого підключіть:

```html
<link rel="stylesheet" href="css/theme.css" />
<link rel="stylesheet" href="css/components.css" />
<link rel="stylesheet" href="css/layout.css" />
<script src="js/kit.js"></script>
```

`theme.css` має завантажуватись першим — він визначає CSS-змінні, якими
користуються `components.css` і `layout.css`. `js/kit.js` не обов'язковий,
якщо ви використовуєте лише статичні компоненти (картки, бейджі, алерти
тощо), але потрібен для будь-якого інтерактивного компонента (вкладки,
toast, dropzone, лоадери з кроками, розширені інпути) — він самостійно
ініціалізується на `DOMContentLoaded`, жодних ручних викликів не потрібно.

`css/gallery.css`, `js/gallery.js` та `index.html` — це виключно демо-сайт
галереї, їх **не потрібно** копіювати в інший проєкт.

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
| Типографіка | `--font-sans`, `--font-mono`, `--font-heading` (за замовчуванням = `--font-sans`), `--font-size-base`, `--h1-min`/`--h1-max`, `--h2-min`/`--h2-max`, `--h3-min`/`--h3-max` (межі `clamp()` для h1–h3) |
| Тінь        | `--shadow-sm`, `--shadow`, `--shadow-md`, `--shadow-lg` |
| Лейаут       | `--spacing-unit` (крок усіх `.p-*`/`.m-*`/`.gap-*` утиліт — `calc(var(--spacing-unit) * N)`), `--border-width`, `--transition-duration`, `--container-max-width` |

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
  `textarea`, `checkbox`, `radio`, а також розширені інпути:
  `input-search` (+ `input-search-field` / `input-search-icon` /
  `input-search-clear`), `input-number` (+ `input-number-field` /
  `input-number-btn`), `input-color` (+ `input-color-swatch` /
  `input-color-value`, поруч — окремий блок `color-swatches` з
  `color-swatch`), `textarea-auto` (модифікатор `.textarea`, що росте з
  вмістом)
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
- **Файловий дропзон** (`upload.css`): `dropzone` (+ `.dropzone--active`
  під час перетягування, `.dropzone--error` — виставляється вручну
  застосунком), `dropzone-hint`, `dropzone-list` (+
  `dropzone-list-item` / `dropzone-list-name` / `dropzone-list-size` /
  `dropzone-list-remove`) — прив'язуйте через `UIKit.initDropzone()`
  (автоматично для будь-якого `[data-dropzone]`)
- **Лоадери** (`loaders.css`): `spinner` (+ `spinner-sm` / `spinner-lg`,
  чиста CSS-анімація), `loader-inline`, `loader-progress` (+
  `loader-progress-text`, оновлюється через `UIKit.setLoaderStep()`),
  `progress` + `progress-bar` (детермінована смуга прогресу, ширина —
  через CSS-змінну `--progress`)

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

## JavaScript (`js/kit.js`)

Один глобальний об'єкт `UIKit` без залежностей. Викликається автоматично на
`DOMContentLoaded` (`UIKit.autoInit()`) — ручні виклики потрібні лише якщо
ви додаєте розмітку компонента динамічно, вже після завантаження сторінки.

| Функція | Що робить |
|---------|-----------|
| `UIKit.initTabs(root)` | Вмикає перемикання для кожного `.tabs`-контейнера всередині `root` (за замовчуванням — увесь `document`) |
| `UIKit.showToast(message, type)` | Показує спливне повідомлення в елементі `#toast`; `type` — необов'язковий модифікатор |
| `UIKit.initDropzone(el)` | Прив'язує drag-and-drop/клік-вибір файлів до `el`, рендерить список у сусідній `.dropzone-list`, генерує подію `uikit:files-selected` |
| `UIKit.setLoaderStep(el, text)` | Оновлює текст поточного кроку всередині `.loader-progress`-елемента `el` |
| `UIKit.initSearchInput(el)` | Прив'язує кнопку очищення `.input-search-clear` до `.input-search`-обгортки `el` |
| `UIKit.initNumberStepper(el)` | Прив'язує кнопки −/+ до `.input-number`-обгортки `el`, з урахуванням `min`/`max`/`step` |
| `UIKit.initColorInput(el)` | Синхронізує текстовий hex-readout і кнопки `.color-swatches` з нативним `input[type=color]` усередині `.input-color`-обгортки `el` |
| `UIKit.initAutoResizeTextarea(el)` | Підганяє висоту `el` під вміст під час вводу |
| `UIKit.autoInit()` | Викликає всі ініціалізатори вище для кожного відповідного елемента в документі |

`UIKit.autoInit()` шукає елементи за селекторами `.tabs`,
`[data-dropzone]`, `.input-search`, `.input-number`, `.input-color` та
`.textarea-auto` — досить додати потрібний клас/атрибут у розмітку.

## Конструктор (`js/builder.js`, вкладка «Конструктор»)

Dev-інструмент у галереї (не входить у список файлів для копіювання в інший
проєкт — див. вкладку «Налаштування»). Дозволяє наживо налаштувати тему й
вивантажити готову кастомізовану копію кіту, не редагуючи CSS вручну:

- **Кольори** — 9 `.input-color`-пікерів (primary/secondary/accent/
  destructive/background/foreground/muted/border/ring), кожен одразу
  записує обране значення у відповідну CSS-змінну на `<html>` — оновлення
  видно миттєво на будь-якій вже відкритій вкладці.
- **Типографіка** — два незалежні пікери шрифтів з Google Fonts (тіло
  тексту / заголовки, окрема змінна `--font-heading`), а також числові
  поля для `--font-size-base` і меж `clamp()` заголовків (`--h1-min`/
  `--h1-max` тощо).
- **Відступи та форма** — `--spacing-unit`, `--radius`, `--border-width`,
  `--container-max-width`, `--transition-duration`.
- **Генератор таблиць** — варіант (звичайна/striped/bordered/compact) +
  кількість колонок і рядків → жива прев'ю-таблиця й кнопка «Скопіювати
  HTML».
- **Генератор лейаут-співвідношень** — рядок на кшталт `30/70` або
  `25/25/50` → прев'ю колонок у відповідній пропорції, копіювання HTML і
  чистого CSS-значення `grid-template-columns`.
- **Зберегти/Завантажити налаштування** — експортує/імпортує `config.json`
  з усіма поточними значеннями. **Скинути** повертає все до значень зі
  старту сторінки.
- **Експортувати збірку (.zip)** — збирає самодостатню копію кіту:
  `theme.css` з «запеченими» (а не runtime-override) поточними
  значеннями токенів, усі незмінені `layout.css`/`components.css`/
  `components/*.css`, `js/kit.js`, шрифти (Montserrat завжди + будь-який
  підключений Google Font під `fonts/<slug>/`) та `starter.html` з
  прикладом згенерованої таблиці й лейаут-співвідношення. ZIP збирається
  вручну на чистому JS (STORE-метод, без стиснення, власна реалізація
  CRC32) — жодної zip-бібліотеки.

**Вимога локального сервера:** завантаження шрифтів з Google Fonts і
експорт .zip виконують реальні `fetch()`-запити до файлів проєкту, що
браузери блокують для протоколу `file://`. Відкрийте галерею через:

```
python3 -m http.server 8000
```

і перейдіть на `http://localhost:8000` — після цього обидві функції
працюють. Якщо сервера немає, обидві дії показують видиму помилку в
самому інтерфейсі (не лише в консолі).

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
- Головна навігація галереї (`.tabs-list` з 18 вкладками) скролиться горизонтально на mobile/tablet, не переносячись і не ламаючи лейаут

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
