# UI KIT — План розширення конструктора

Базується на меті з `PROJECT.md` і знахідках `docs/CODE_SUMMARY.md`.

**Важливо:** з початкового підходу (1 — структура сторінки, 2 — вигляд сторінки компонента, 3 — параметри по кожному компоненту, 4 — завантаження теми) кроки 1, 2 і 4 вже реалізовані в наявному Конструкторі (`js/builder.js`) — live-редагування теми, патерн генератора на прикладі таблиці й лейауту, save/load/reset, zip-експорт. Основний обсяг роботи, що лишився, — це крок 3: розповсюдити той самий патерн на решту компонентів, плюс кілька технічних боргів перед масштабуванням.

---

## Фаза 0 — Фундамент (перед масштабуванням генераторів)

1. Об'єднати дубльовану `copyText`/`copyPlainText` (зараз окремо в `gallery.js` і `builder.js`) у `js/kit.js`, використовувати звідти в обох
2. Додати `initSelectSearch()` у `kit.js` (зараз фільтрація написана лише в `gallery.js` на демо-рівні) — без цього select-search не працює "з коробки" при копіюванні в інший проект
3. Вирішити долю `--font-mono`: додати локальний файл шрифту або зняти обіцянку "0 зовнішніх запитів" саме для нього
4. Перенести `--layout-sidebar-width` з `components/layouts.css` у `theme.css` — централізувати токени
5. Розширити `js/google-fonts-list.json`: додати `subsets` (зокрема `cyrillic-ext`) до кожного запису + фільтр у пошуку шрифтів у конструкторі

## Фаза 1 — Генератори базових компонентів (найчастіше використовувані)

Кожен пункт — за наявним патерном: state → live preview → serialize/apply у `config.json` → copy HTML → (за потреби) врахувати в zip-експорті.

1. Button — variant (primary/secondary/outline/ghost/destructive) × size (sm/default/lg/icon) × disabled
2. Badge — variant (default/secondary/outline/destructive/success)
3. Card/Panel — компонування header/title/description/content/footer, divider
4. Alert — variant (default/destructive/success/warning)
5. Tabs — horizontal/vertical, кількість вкладок

## Фаза 2 — Генератори форм-компонентів

1. Input/Textarea (+ textarea-auto)
2. Checkbox/Radio
3. Select (нативний)
4. Select-search (залежить від Фази 0, п.2)
5. Number stepper, Color input, Range input, Search input
6. Label (row/col)

## Фаза 3 — Структурні й додаткові компоненти

1. Layouts — розширити наявний генератор за межі ratio (row/col/sidebar/split варіанти)
2. Accordion — single-open toggle
3. Upload/Dropzone — active/error стани, список файлів

## Фаза 4 — Feedback/utility компоненти

1. Loaders — spinner sm/lg, loader-inline, loader-progress, progress bar
2. Toast — тип × позиція (28 комбінацій); toast викликається JS-функцією, а не копіюється як статичний HTML — продумати окремий формат для цього генератора
3. Links — default/muted/underline

## Фаза 5 — Сесія та експорт (масштабування)

1. Перевірити, що схема `config.json` лишається керованою при ~19 генераторах (можливо, згрупувати по namespace на компонент)
2. Переконатись, що zip-експорт коректно враховує кожен новий генератор

## Фаза 6 — Полірування (не блокер, за наявності часу)

1. Keyboard-навігація для tabs (стрілками), повний набір ARIA-зв'язків
2. Disabled-демо для всіх компонентів у галереї
3. Реальна логіка сортування таблиці (зараз лише статичний CSS-індикатор) — вирішити, чи потрібна для конструктора
