# ui-kit

A framework-agnostic **vanilla CSS** design system based on shadcn/ui design
tokens. No build step, no npm, no dependencies — three plain CSS files plus
local font files that you can drop into any web project (or embed in a
desktop shell such as pywebview) and start using immediately.

Open [`index.html`](index.html) for a live gallery of every token and
component.

## Folder structure

```
ui-kit/
├── index.html              Component gallery / living style guide
├── css/
│   ├── theme.css            Design tokens: :root / [data-theme="dark"] custom properties + @font-face
│   ├── components.css       Component classes (buttons, forms, cards, badges, tabs, tables, alerts, ...)
│   └── layout.css           Flexbox/grid utilities, spacing, text helpers, .container
├── fonts/
│   └── Montserrat/
│       ├── Montserrat-Regular.woff2
│       ├── Montserrat-Medium.woff2
│       ├── Montserrat-SemiBold.woff2
│       └── Montserrat-Bold.woff2
├── README.md
└── .gitignore
```

## Using it in another project

Copy the `css/` and `fonts/` folders into your project (keep them in the same
relative position to each other, since `theme.css` references the font files
via a relative `../fonts/Montserrat/...` path), then link all three
stylesheets in this order:

```html
<link rel="stylesheet" href="css/theme.css" />
<link rel="stylesheet" href="css/components.css" />
<link rel="stylesheet" href="css/layout.css" />
```

`theme.css` must load first — it defines the custom properties that
`components.css` and `layout.css` consume. There is no JS dependency for the
styles themselves; the small inline script in `index.html` is only for the
gallery page's tabs/copy-button/theme-toggle demo behavior and is optional to
reuse.

## Theming

Theming is done with a single `data-theme` attribute on the `<html>` element:

- No attribute (or any value other than `"dark"`) → light theme (default,
  defined on `:root`)
- `data-theme="dark"` → dark theme overrides

```html
<html data-theme="dark">
```

Toggle it from JS:

```js
document.documentElement.setAttribute("data-theme", "dark");
document.documentElement.removeAttribute("data-theme");
```

All component colors are expressed as `hsl(var(--token))`, so switching the
attribute re-themes every component instantly with no re-render.

## CSS variables (`theme.css`)

| Category   | Variables |
|------------|-----------|
| Color      | `--background`, `--foreground`, `--card`, `--card-foreground`, `--primary`, `--primary-foreground`, `--secondary`, `--secondary-foreground`, `--muted`, `--muted-foreground`, `--accent`, `--accent-foreground`, `--destructive`, `--destructive-foreground`, `--success`, `--success-foreground`, `--warning`, `--warning-foreground`, `--border`, `--input`, `--ring` |
| Radius     | `--radius-sm`, `--radius`, `--radius-lg`, `--radius-full` |
| Typography | `--font-sans`, `--font-mono` |
| Shadow     | `--shadow-sm`, `--shadow`, `--shadow-md`, `--shadow-lg` |

Color variables are stored as `H S% L%` channel triples (shadcn/ui
convention) — always consume them wrapped in `hsl()`, e.g.
`background-color: hsl(var(--primary));`, or with an alpha modifier
`hsl(var(--primary) / 0.5)`.

## Component classes (`components.css`)

- **Buttons**: `btn`, `btn-primary`, `btn-secondary`, `btn-outline`,
  `btn-ghost`, `btn-destructive`, `btn-sm`, `btn-lg`, `btn-icon` (combine a
  variant class with a size class; `:disabled` is handled automatically)
- **Forms**: `field`, `label`, `field-hint`, `input`, `select`, `textarea`,
  `checkbox`, `radio`
- **Cards & panels**: `card`, `card-header`, `card-title`,
  `card-description`, `card-content`, `card-footer`, `panel`, `divider`
- **Badges**: `badge`, `badge-secondary`, `badge-outline`,
  `badge-destructive`, `badge-success`
- **Tabs**: `tabs`, `tabs-list`, `tab-trigger` (+ `.is-active`),
  `tab-content` (+ `.is-active`) — wire up click behavior with the
  `initTabs()` pattern shown in `index.html` (any `.tabs` container is
  auto-discovered; no IDs required)
- **Tables**: `table-wrapper`, `table`
- **Alerts & toast**: `alert`, `alert-destructive`, `alert-success`,
  `alert-warning`, `toast` (+ `.is-visible`)
- **Preview**: `preview-area`, `preview-svg`

## Layout utilities (`layout.css`)

- Flex: `flex`, `flex-col`, `flex-wrap`, `items-center`, `items-start`,
  `items-end`, `justify-between`, `justify-center`, `justify-start`,
  `justify-end`
- Grid: `grid`, `grid-2`, `grid-3`, `grid-4`
- Gap (flex or grid): `gap-1` … `gap-6`
- Spacing: `p-0`…`p-6`, `px-0`…`px-6`, `py-0`…`py-6`, `m-0`…`m-6`,
  `mt-0`…`mt-6`, `mb-0`…`mb-6`
- Text: `text-sm`, `text-lg`, `font-semibold`, `font-mono`, `text-muted`
- Layout: `container`

## Fonts

Montserrat (Regular/400, Medium/500, SemiBold/600, Bold/700) is bundled
locally as static `.woff2` files under `fonts/Montserrat/` and loaded via
`@font-face` in `theme.css`. There are no external font requests (no Google
Fonts CDN, no `<link>` to a remote stylesheet) — everything resolves from the
local filesystem, which is what makes this kit safe to embed in a pywebview
or other offline/desktop shell.
