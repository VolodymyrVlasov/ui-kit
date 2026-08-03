# ui-kit — Технічний summary поточного стану

Документ для планування конструктора. Аналіз без правок коду.

## 1. Структура проекту

```
ui-kit/
├── index.html                  Галерея компонентів / living style guide (1714 рядків)
├── css/
│   ├── theme.css                 Токени: :root/[data-theme="dark"] змінні + @font-face (182 рядки)
│   ├── components.css             Фасад — 14 @import з components/ (22 рядки)
│   ├── layout.css                 Flex/grid-утиліти, spacing, text, .container (228 рядків)
│   ├── gallery.css                 Стилі лише галереї-демо (114 рядків, НЕ копіювати)
│   ├── builder.css                 Стилі Конструктора: toolbar, preview-картки (65 рядків, НЕ копіювати)
│   └── components/                 15 файлів, по одному на компонент (буде розшифровано в п.2)
├── js/
│   ├── kit.js                    UIKit — перевикористовувана поведінка (351 рядок)
│   ├── gallery.js                 Скрипт лише галереї: theme-toggle, nav-groups, copy-buttons, демо-тригери (245 рядків, НЕ копіювати)
│   ├── builder.js                 Конструктор теми + .zip export (1085 рядків, НЕ копіювати, dev-tool)
│   └── google-fonts-list.json     Локальний список із 104 назв Google Fonts для пошуку (НЕ копіювати)
├── fonts/Montserrat/               4 нарізки (400/500/600/700), woff2, ~18–19 КБ кожна
├── favicon.svg, assets/logo.svg    Приклади-заглушки (квадратна абстрактна іконка)
├── README.md                       Дуже детальна, актуальна документація (352 рядки, UA)
└── .gitignore                      Стандартний (OS/editor/*.log)
```

Немає build-кроку, немає package.json, немає npm-залежностей. Відкривається як звичайний HTML-файл; для Конструктора (Google Fonts fetch + .zip export) потрібен локальний HTTP-сервер через блокування `fetch()` на `file://`.

README.md — нетипово повний і синхронізований з кодом опис (структура файлів, токени, класи компонентів, JS API, брейкпоінти). Для планування конструктора README можна вважати достовірним джерелом істини нарівні з кодом.

## 2. CSS-архітектура

### theme.css — токени (усе перелічено як є)

**Кольори** (HSL-трійка каналів без `hsl()`-обгортки, конвенція shadcn/ui; окремо `:root` і `[data-theme="dark"]`):
`--background`, `--foreground`, `--card`, `--card-foreground`, `--primary`, `--primary-foreground`, `--secondary`, `--secondary-foreground`, `--muted`, `--muted-foreground`, `--accent`, `--accent-foreground`, `--destructive`, `--destructive-foreground`, `--success`, `--success-foreground`, `--warning`, `--warning-foreground`, `--border`, `--input`, `--ring`.

**Радіус:** `--radius-sm` (0.375rem), `--radius` (0.5rem), `--radius-lg` (0.625rem), `--radius-full` (9999px).

**Типографіка:** `--font-sans` (Montserrat + системний fallback), `--font-mono` (JetBrains Mono + fallback, **не підключений локально, лише системний/CDN-fallback — залежить від наявності шрифту в ОС**), `--font-heading` (за замовчуванням `var(--font-sans)`), `--font-size-base` (16px), `--h1-min`/`--h1-max`, `--h2-min`/`--h2-max`, `--h3-min`/`--h3-max` (межі clamp()).

**Тіні:** `--shadow-sm`, `--shadow`, `--shadow-md`, `--shadow-lg` (окремі значення для light/dark — темна тема має вищу непрозорість rgba).

**Layout/spacing:** `--spacing-unit` (0.25rem, крок усіх `.p-*`/`.m-*`/`.gap-*`), `--border-width` (1px), `--transition-duration` (150ms), `--container-max-width` (72rem).

**Додатково поза `:root`:** `--layout-sidebar-width` (16rem) визначений не в theme.css, а прямо в `components/layouts.css` — токен "живе" не там, де решта (дрібна непослідовність, див. п.6).

### components.css / components/ — усі компоненти й варіанти

| Файл | Класи-компоненти | Варіанти/модифікатори |
|---|---|---|
| buttons.css | `btn` (+ глобальний `*,box-sizing` reset, `html`, `body`) | `btn-primary/secondary/outline/ghost/destructive`, `btn-sm/lg/icon`, `:disabled`/`.is-disabled`, `:hover`/`:focus-visible` |
| forms.css | `field`, `label`, `field-hint`, `input`, `textarea`, `checkbox`, `radio` + розширені: `input-search(+field/icon/clear)`, `input-number(+field/btn)`, `input-color(+swatch/value)`, `color-swatches/color-swatch`, `textarea-auto`, `input-range(+field/value)` | hover/focus/disabled на всіх базових; `.has-value` на search |
| selects.css | `select`, `select-search(+input/list/option)` | `:hover/:focus/:disabled`, `.is-disabled`, `.is-hidden` на опціях |
| labels.css | `label-text`, `label-field(+caption/value)` | `--row`/`--col` |
| cards.css | `card(+header/title/description/content/footer)`, `panel`, `divider`, `card-divider(--vertical)` | — |
| badges.css | `badge` | `-secondary/-outline/-destructive/-success` |
| tabs.css | `tabs(+list/trigger/content)` | `.is-active`, `:disabled`, `tabs--vertical` |
| tables.css | `table-wrapper`, `table` | `table-striped/bordered/compact`, `th.sortable(.sort-asc/.sort-desc)` — **статичний індикатор, без реальної JS-логіки сортування** |
| alerts.css | `alert`, `toast` | `alert-destructive/success/warning`, `toast[data-toast-type]`, `toast-container--{7 позицій}` |
| preview.css | `preview-area`, `preview-svg` | — |
| layouts.css | `layout-row/col/full`, `layout-sidebar(+aside/content)`, `layout-split` | responsive-стек на mobile/tablet |
| upload.css | `dropzone(+hint/icon/list+item/name/size/remove)` | `--active`, `--error` (виставляється вручну) |
| loaders.css | `spinner`, `loader-inline`, `loader-progress(+text)`, `progress(+bar)` | `spinner-sm/lg`, `--progress` CSS-змінна |
| links.css | базовий `a`, `link`, `link-muted`, `link-underline` | hover/focus-visible/visited на всіх |
| accordion.css | `accordion(+item/trigger/content)` | працює на нативному `<details>`, без JS за замовчуванням |

Усього 15 файлів компонентів + facade. Порядок `@import` у `components.css` навмисно зберігає початковий каскад (buttons.css йде першим і несе на собі глобальний reset — нетипове місце для reset-правил, але задокументовано коментарем у самому файлі).

### layout.css — утиліти

Flex (`flex`, `flex-col`, `flex-wrap`, `items-*`, `justify-*`), Grid (`grid`, `grid-2/3/4` з responsive-колапсом на 1023/767/479px), Gap (`gap-1…6`), Padding/Margin (`p/px/py/m/mt/mb-0…6`), текст (`text-sm/lg`, `font-semibold/mono`, `text-muted`, `text-left/center/right/justify`), `.container` (max-width + responsive padding).

### Inline-стилі та дублювання

- **Inline `style="..."` в index.html:** 30 випадків. Здебільшого легітимні (демонстрація конкретного значення токена: `style="border-radius:var(--radius-sm)"` для показу радіусів; `style="--progress: 40%"` для CSS custom property, яка й задумана як inline-налаштування; `style="display:none"` для прихованих `<input type="file">` і для перемикання групи вкладок «Інструменти»). Немає хардкоджених кольорів/розмірів, які мали б бути токенами — окрім 5 демо `color-swatch` кнопок (`background-color: #7c3aed` тощо, п.5) — це навмисні приклади довільних кольорів, не токени.
- **Inline-стилі з JS:** `builder.js` пише інлайн `--{token}` через `setVar()`/`style.setProperty()` для живого прев'ю (навмисна, задокументована архітектура — раніше була через це помилка з протіканням кольору між темами, зараз виправлена окремими CSS-блоками замість `getComputedStyle`).
- **Дублювання логіки:** мінімальне. `gallery.js` і `builder.js` кожен має власну копію `copyText`/`copyPlainText` (ідентична за призначенням функція копіювання в буфер із fallback на `execCommand`, продубльована двічі замість винесення в `kit.js`). `serializeConfig()`/`applyConfig()` у `builder.js` — велика ручна відповідність DOM id ↔ CSS-змінна, крихка при додаванні нових полів (легко забути додати в один з трьох місць: `NUMBER_FIELDS`, HTML-розмітку, і не забути в config serialize/apply).

## 3. HTML/JS-функціонал

### Галерея (index.html)

Структура: `<header>` (лого + назва + theme-toggle) → перемикач "Компоненти"/"Інструменти" (два `.btn`, керує видимістю двох `.tabs`-контейнерів) → `#components-tabs` (17 вкладок компонентів) → `#tools-tabs` (2 вкладки: «Налаштування» — інструкція з інтеграції, «Конструктор» — dev-tool) → `<div class="toast" id="toast">` (єдиний toast-елемент на всю сторінку) → підключення `kit.js`/`gallery.js`/`builder.js`.

Кожна демо-секція — уніфікований патерн:
```html
<div class="demo">
  <div class="demo-preview"> ...живий рендер компонента... </div>
  <template class="demo-source"> ...чистий HTML для копіювання... </template>
  <div class="demo-actions">
    <button data-copy="html">Скопіювати HTML</button>
    <button data-copy-class="btn-primary">Скопіювати клас</button>
  </div>
</div>
```
Кожна вкладка компонента також має `<details class="component-info">` з описом призначення, нюансів і 2 типових кейсів використання (текстовий контент, не інтерактивний).

### Кнопка копіювання HTML

Реалізація в `gallery.js:52-90`:
- `[data-copy="html"]` → знаходить найближчий `.demo`, бере `.demo-source` (це `<template>`, тому вміст не рендериться на сторінці — чистий текст розмітки без класів `.demo-preview`), копіює `source.innerHTML.trim()`.
- `[data-copy-class]` → копіює буквально значення атрибута (наприклад, `"btn-primary""`) як текст.
- Копіювання через `navigator.clipboard.writeText`, з fallback на прихований `<textarea>` + `document.execCommand("copy")` для старих браузерів/незахищеного контексту.
- Візуальний фідбек: текст кнопки на 1.5с змінюється на «Скопійовано!» + toast-повідомлення знизу-справа.
- Дані копіювання — **статичний, заздалегідь написаний HTML у `<template>`**, не згенерований з поточного стану компонента (окрім генераторів таблиці/лейауту в Конструкторі, де джерело будується динамічно, п.3.4).

### Інша інтерактивність (kit.js — `UIKit`)

Реалізовано: `initTabs` (клік-перемикання, `:scope`-ізольовані контейнери, без URL/history), `showToast` (7 позицій, auto-hide 2.5с), `initDropzone` (drag&drop + клік, рендер списку файлів, подія `uikit:files-selected`), `initFileButton` (та сама подія без drag&drop chrome), `setLoaderStep`, `initSearchInput` (clear-кнопка), `initNumberStepper` (−/+ з min/max/step), `initColorInput` (синхронізація hex-readout + swatch-палітра), `initAutoResizeTextarea`, `initRangeInput` (readout значення), `initAccordion` (опційний single-open на нативних `<details>`), `autoInit` (авто-виявлення за селекторами/атрибутами на `DOMContentLoaded`).

**Відсутнє/не реалізовано:**
- Немає керованого (JS) dropdown/popover-компонента поза `<select>`/`.select-search` (немає generic `.dropdown-menu` патерна).
- Немає модального вікна/діалогу (`.modal`/`<dialog>`) — жодного компонента overlay, крім toast.
- Немає tooltip-компонента.
- Немає реальної логіки сортування таблиці — лише статичний CSS-індикатор (`th.sortable`), клік нічого не робить.
- Немає pagination-компонента.
- Немає keyboard-навігації для `.tabs` (стрілками) — лише клік; немає `role="tabpanel"`/`aria-controls` зв'язку (є лише `role="tab"`/`role="tablist"` частково).
- Немає breadcrumbs, немає stepper/wizard-компонента (лише `.loader-progress` як текстовий індикатор кроку завантаження, не навігаційний stepper).

### Налаштування параметрів на льоту

Так, є повноцінний **Конструктор** (`js/builder.js`, вкладка Інструменти → Конструктор) — це і є прототип майбутнього "конструктора" з завдання:

1. **Кольори** — 9 спільних color-picker'ів (primary/secondary/accent/destructive/background/foreground/muted/border/ring), перемикач «Світла/Темна тема» визначає, який із двох незалежних JS-станів (`state.light`/`state.dark`) редагується. Живе прев'ю через окремий `<style id="builder-live-preview">` (не inline на `<html>`, щоб уникнути протікання кольору між темами — задокументований і виправлений баг).
2. **Типографіка** — 2 незалежні пошукові пікери Google Fonts (тіло/заголовки) з локальним JSON-автокомплітом (104 назви) + числові поля `--font-size-base`, `--h1-min/max`, `--h2-min/max`, `--h3-min/max`.
3. **Простір/форма** — `--spacing-unit`, `--radius`, `--border-width`, `--container-max-width`, `--transition-duration`.
4. **Генератор таблиць** — варіант + кількість колонок/рядків → жива прев'ю-таблиця + копіювання HTML.
5. **Генератор лейаутів** — рядок-пропорція (`30/70`, `25/25/50`) → прев'ю-колонки + копіювання HTML/CSS.
6. **Save/Load/Reset** — `config.json` (light/dark як окремі top-level ключі + numbers/fonts/table/layoutRatio); Reset повертає до `DEFAULT_CONFIG`, знятого при завантаженні сторінки.
7. **Export .zip** — рахує "запечений" `theme.css` (light/dark блоки з фактичних значень) + всі незмінені CSS-файли компонентів + `kit.js` + шрифти (Montserrat завжди + будь-який підключений Google Font) + згенерований `starter.html`. ZIP збирається вручну на чистому JS (STORE-метод, власний CRC32, без бібліотек).

Все це вже існує й працює — це не gap, а фундамент, на якому конструктор явно вже будувався.

## 4. Шрифти

- **Montserrat** (400/500/600/700) — локальні `.woff2`-файли в `fonts/Montserrat/`, підключені через `@font-face` у `theme.css`. Жодних зовнішніх запитів для основного кіту — офлайн-безпечно (задокументована мета: сумісність з pywebview/десктоп-оболонками).
- **`--font-mono` (JetBrains Mono)** — **не має локального файлу й не підключений через `@font-face`**; покладається на fallback-ланцюжок `"JetBrains Mono", Consolas, monospace`, тобто рендериться лише якщо шрифт випадково є в ОС користувача. Це асиметрія відносно `--font-sans` — вартий уваги технічний нюанс, не помилка per se, але приховане очікування "локальний кіт = без зовнішніх запитів" не повністю виконується для моно-шрифту.
- **Довільний Google Font** — так, є повноцінний механізм у Конструкторі: `fetchGoogleFont()` (js/builder.js:337) робить `fetch` до `fonts.googleapis.com/css2`, парсить `@font-face`-блоки регексом, довантажує самі `.woff2` файли як `ArrayBuffer`, і або (а) рендерить прев'ю через blob-URL на сторінці живцем, або (б) при експорті — записує реальні файли шрифту в ZIP під `fonts/<slug>/` з відповідним `@font-face` в `theme.css`. Пошук назви — локальний автокомпліт по `js/google-fonts-list.json` (104 популярні назви, без API-запиту для самого пошуку). Обмеження: працює лише через HTTP-сервер (не `file://`), фіксований набір нарізок 400/500/600/700 (без italic, без інших ваг).

## 5. Компоненти — детальний перелік

| Компонент | Варіанти/стани | Параметризація |
|---|---|---|
| Button (`btn`) | primary/secondary/outline/ghost/destructive × sm/lg/icon; hover/focus-visible/disabled | Класами, повністю token-based |
| Input/Textarea | placeholder/hover/focus/disabled; окремо textarea-auto (авто-висота) | Класами; touch-target 44px на mobile |
| Checkbox/Radio | checked/hover/focus-visible/disabled | Класами, кастомний вигляд через `appearance:none` |
| Search input | має значення / clear-кнопка / disabled | Клас + `UIKit.initSearchInput()` |
| Number stepper | min/max/step, disabled | Клас + `UIKit.initNumberStepper()`, атрибути `min/max/step` на нативному input |
| Color input | hex-readout, палітра swatches, disabled | Клас + `UIKit.initColorInput()`, `data-color` на swatch-кнопках |
| Range input | readout значення, disabled | Клас + `UIKit.initRangeInput()` |
| Select (нативний) | hover/focus/disabled | Клас, кастомна стрілка через inline SVG в background |
| Select-search | фільтрація, disabled | Клас + JS у `gallery.js` (демо-рівень) — **немає в kit.js**, тобто UIKit не надає готового init для select-search, кожен застосунок має сам написати фільтрацію (як зроблено для демо) |
| Label-text/label-field | row/col orientation | Класами |
| Card/Panel | header/title/description/content/footer; divider (гор./верт.) | Композиція класів, без варіантів кольору/розміру картки |
| Badge | default/secondary/outline/destructive/success | Класами |
| Tabs | горизонтальні/вертикальні (`tabs--vertical`); is-active/disabled | Класи + `UIKit.initTabs()`, авто-виявлення `.tabs` |
| Table | striped/bordered/compact (комбінуються); sortable-індикатор (статичний) | Класами; сортування-логіка відсутня |
| Alert | default/destructive/success/warning | Класами |
| Toast | 4 типи кольору × 7 позицій = 28 комбінацій | JS API `UIKit.showToast(msg, type, position)`, один спільний `#toast` елемент на сторінку (не стек кількох toast одночасно) |
| Preview area | — | Лише контейнер, без варіантів |
| Layouts (row/col/sidebar/split) | responsive-стек на mobile/tablet | Класами, `--layout-sidebar-width` — єдина параметризована ширина |
| Link | default/muted/underline; hover/focus/visited | Класами |
| Accordion | single-open опційно | Клас/нативний `<details>` + `UIKit.initAccordion()` або `data-accordion`/`data-single-open` |
| Dropzone | active/error (error — вручну), список файлів з видаленням | Клас + `UIKit.initDropzone()`, подія `uikit:files-selected` |
| File button | — | `data-file-button` + `data-multiple`/`data-accept`, `UIKit.initFileButton()` |
| Spinner | sm/default/lg | Класами, чиста CSS-анімація |
| Loader inline/progress | текст кроку через JS | `UIKit.setLoaderStep()`, немає власного таймера |
| Progress bar | детермінований % | CSS-змінна `--progress` (inline style за задумом) |

## 6. Прогалини, незавершене, технічний борг

**TODO/FIXME:** відсутні в коді — жодних маркерів `TODO`/`FIXME`/`XXX`/`HACK` у css/js/html.

**Незавершене/непослідовне:**
- `--font-mono` (JetBrains Mono) не має локального файлу на відміну від `--font-sans` — асиметрія в "offline-first" обіцянці кіту (п.4).
- `--layout-sidebar-width` визначений у `components/layouts.css`, а не в `theme.css` разом з рештою layout-токенів — єдиний токен поза централізованим місцем.
- `UIKit` не має `initSelectSearch()` — фільтрація `.select-search` написана вручну лише в `gallery.js` (демо-рівень), тобто цей компонент **не є "перевикористовуваним із коробки"** попри те, що CSS для нього є в components/selects.css і він задокументований у README як частина кіту. Реальний застосунок, що підключає лише `kit.js`, мусить сам написати JS-фільтрацію.
- Дублювання `copyText`/`copyPlainText` між `gallery.js` і `builder.js` (ідентична логіка копіювання в буфер, не винесена в спільне місце — хоч це і "не копіювати"-файли, для майбутнього рефакторингу конструктора варто об'єднати).
- Toast — лише один глобальний елемент (`#toast`) на сторінку; немає стека кількох одночасних toast-повідомлень (нове показане повідомлення перериває/замінює попереднє через `clearTimeout`+перезапис тексту).
- Tabs без keyboard-навігації стрілками (лише click) і без повного набору ARIA (`aria-controls`, `aria-selected` виставляється, але `tab-content` не має `role="tabpanel"`/`id` зв'язку з тригером).
- Sortable-таблиця — суто візуальний індикатор, немає навіть заглушки JS-обробника кліку.

**Дублювання/суперечності найменування:** не виявлено серйозних — нейминг класів послідовний (`{component}-{part}`, модифікатори через другий клас або `--suffix` для вертикальних варіантів `tabs--vertical`/`card-divider--vertical`). Токен `--font-heading` дефолтиться на `var(--font-sans)` — коректний і задокументований підхід, не суперечність.

**Відсутні аналоги/стани:**
- Disabled-демо в галереї показано лише для 3 елементів (`btn:disabled` приклад, один `input:disabled`, кнопки в builder preview cards мають `pointer-events:none` для демонстрації) — селект, textarea, checkbox, radio, badge, tabs-disabled **не мають демо в галереї**, хоча CSS-стан для більшості з них існує (форми.css, tabs.css мають `:disabled` правила).
- Немає dark-mode-специфічних скріншотів/перевірки контрасту в самій галереї (лише глобальний theme-toggle).
- Немає мобільного/десктопного демо-перемикача viewport у самій галереї (адаптивність перевіряється лише реальним resize вікна браузера).

## 7. Згадки застарілих назв

Пошук за `paperfox`, `cutstudio` (та похідними, регістронезалежно) по всьому репозиторію (html/css/js/json/md/svg, включно з git-трекованими й робочими файлами) — **збігів не знайдено**. Історичні назви вже повністю відсутні в кодовій базі.

## 8. Загальний висновок

Проект **добре підготовлений** як основа для конструктора — фактично прототип конструктора вже існує й працює (`js/builder.js` + вкладка «Конструктор»): live-редагування кольорів (окремо light/dark, з виправленим багом протікання), шрифтів (включно з довільним Google Font), типографічної шкали, spacing/radius/border/transition, генератори таблиці й лейауту, save/load config.json, експорт готового `.zip` з "запеченими" значеннями. Це не MVP з нуля, а розширення наявного інструмента.

**Що вже готове й можна лишити як є:**
- Токенна система в `theme.css` — чиста, повна, без хардкоду в компонентах.
- Розбиття `components.css` на 15 файлів по компонентах — зручна база для вибіркового копіювання/експорту.
- Механізм копіювання HTML (`data-copy="html"`) — простий, надійний патерн (template → clipboard), легко розширюється на динамічно згенеровану розмітку (як уже зроблено для генераторів таблиці/лейауту).
- ZIP-export без залежностей — самодостатній, вже вміє включати кастомні шрифти.
- `UIKit` API — стабільний, чіткий контракт (`autoInit` + селектори), безпечно розширювати новими компонентами.

**Що доведеться доробити/переробити для повноцінного конструктора:**
1. Компонент-рівень параметризації в Конструкторі поки охоплює лише 2 генератори (таблиця, лейаут) — якщо мета "налаштування параметрів компонентів" ширша (наприклад, вибір варіанту кнопки/картки/бейджа з live-прев'ю й копіюванням), цього шару зараз немає, треба будувати за наявним патерном `initTableGenerator`/`initLayoutGenerator`.
2. `initSelectSearch` відсутній у `kit.js` — якщо конструктор має генерувати select-search розмітку для копіювання в інший проєкт, споживач зараз не отримає робочої поведінки без ручного JS.
3. Дублювання copy-логіки (`gallery.js`/`builder.js`) варто об'єднати перед тим, як розширювати конструктор новими копіювання-кнопками.
4. `--font-mono`/`--layout-sidebar-width` — дрібні неузгодженості токенів, варто вирішити (додати локальний mono-шрифт або прибрати обіцянку "0 зовнішніх запитів" для нього; перенести sidebar-width у theme.css) до того, як конструктор почне ці токени експортувати як "офіційні".
5. Відсутні keyboard-a11y для tabs і повний набір disabled-демо — не блокер для конструктора, але варто врахувати, якщо конструктор буде рекламуватись як production-ready design system.

Загалом — CSS-архітектура і export-механізм не потребують переробки, лише розширення; JS-шар конструктора має правильний патерн (state → live preview → serialize → export), просто вкритий не всіма компонентами кіту.
