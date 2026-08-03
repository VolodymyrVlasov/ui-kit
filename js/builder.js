/* Builder tool — do NOT copy this file into other projects */

(function () {
  "use strict";

  /* ==========================================================================
     Small helpers
     ========================================================================== */

  function getVarValue(name) {
    return getComputedStyle(document.documentElement).getPropertyValue(name).trim();
  }

  function setVar(name, value) {
    document.documentElement.style.setProperty(name, value);
  }

  function downloadBlob(blob, filename) {
    var url = URL.createObjectURL(blob);
    var a = document.createElement("a");
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setTimeout(function () { URL.revokeObjectURL(url); }, 1000);
  }

  function copyPlainText(text, btn) {
    function done() {
      var original = btn.textContent;
      btn.textContent = "Скопійовано!";
      setTimeout(function () { btn.textContent = original; }, 1500);
    }
    UIKit.copyText(text).then(done);
  }

  /* ==========================================================================
     HSL-triple <-> hex (theme colors are stored as "H S% L%", native
     <input type="color"> only understands hex)
     ========================================================================== */

  function hslToHex(h, s, l) {
    s /= 100;
    l /= 100;
    var c = (1 - Math.abs(2 * l - 1)) * s;
    var x = c * (1 - Math.abs((h / 60) % 2 - 1));
    var m = l - c / 2;
    var r, g, b;
    if (h < 60) { r = c; g = x; b = 0; }
    else if (h < 120) { r = x; g = c; b = 0; }
    else if (h < 180) { r = 0; g = c; b = x; }
    else if (h < 240) { r = 0; g = x; b = c; }
    else if (h < 300) { r = x; g = 0; b = c; }
    else { r = c; g = 0; b = x; }
    function toHex(v) {
      var n = Math.round((v + m) * 255);
      var hexStr = n.toString(16);
      return hexStr.length === 1 ? "0" + hexStr : hexStr;
    }
    return "#" + toHex(r) + toHex(g) + toHex(b);
  }

  function hexToHsl(hex) {
    hex = hex.replace("#", "");
    var r = parseInt(hex.substring(0, 2), 16) / 255;
    var g = parseInt(hex.substring(2, 4), 16) / 255;
    var b = parseInt(hex.substring(4, 6), 16) / 255;
    var max = Math.max(r, g, b), min = Math.min(r, g, b);
    var h, s, l = (max + min) / 2;
    if (max === min) {
      h = s = 0;
    } else {
      var d = max - min;
      s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
      switch (max) {
        case r: h = (g - b) / d + (g < b ? 6 : 0); break;
        case g: h = (b - r) / d + 2; break;
        default: h = (r - g) / d + 4; break;
      }
      h *= 60;
    }
    return { h: h, s: s * 100, l: l * 100 };
  }

  function hslTripleToHex(triple) {
    var parts = triple.trim().split(/\s+/);
    var h = parseFloat(parts[0]) || 0;
    var s = parseFloat(parts[1]) || 0;
    var l = parseFloat(parts[2]) || 0;
    return hslToHex(h, s, l);
  }

  function hexToHslTriple(hex) {
    var hsl = hexToHsl(hex);
    return Math.round(hsl.h) + " " + hsl.s.toFixed(1) + "% " + hsl.l.toFixed(1) + "%";
  }

  /* ==========================================================================
     State
     Colors are theme-dependent (:root vs [data-theme="dark"]) so they get
     TWO independent objects. Everything else (spacing, typography scale,
     fonts) has no dark variant in theme.css, so a single shared value is
     correct for those — no leak risk there.
     ========================================================================== */

  // The 29 "Палітра проекту" fields, plus "card-border" (30th) — a
  // genuinely separate, non-palette token (see css/theme.css/cards.css),
  // just riding the same generic picker/hex/preview/autosave/undo
  // machinery below rather than duplicating it. Its picker lives only in
  // the Картки card, not in Палітра — being in this array is purely for
  // infrastructure reuse, not a UI placement decision.
  var COLOR_FIELDS = [
    "background", "foreground",
    "card", "card-foreground",
    "primary", "primary-foreground", "primary-hover", "primary-disabled",
    "secondary", "secondary-foreground", "secondary-hover", "secondary-disabled",
    "accent", "accent-foreground", "accent-hover", "accent-disabled",
    "destructive", "destructive-foreground", "destructive-hover", "destructive-disabled",
    "success", "success-foreground",
    "warning", "warning-foreground",
    "muted", "muted-foreground",
    "border", "input", "ring",
    "card-border"
  ];

  var NUMBER_FIELDS = [
    { id: "cfg-font-size-base", varName: "--font-size-base", unit: "px" },
    { id: "cfg-h1-min", varName: "--h1-min", unit: "rem" },
    { id: "cfg-h1-max", varName: "--h1-max", unit: "rem" },
    { id: "cfg-h2-min", varName: "--h2-min", unit: "rem" },
    { id: "cfg-h2-max", varName: "--h2-max", unit: "rem" },
    { id: "cfg-h3-min", varName: "--h3-min", unit: "rem" },
    { id: "cfg-h3-max", varName: "--h3-max", unit: "rem" },
    { id: "cfg-spacing-unit", varName: "--spacing-unit", unit: "rem" },
    { id: "cfg-radius", varName: "--radius", unit: "rem" },
    { id: "cfg-border-width", varName: "--border-width", unit: "px" },
    { id: "cfg-container-max-width", varName: "--container-max-width", unit: "rem" },
    { id: "cfg-transition-duration", varName: "--transition-duration", unit: "ms" }
  ];

  var state = { light: {}, dark: {} };
  var currentEditingTheme = "light";
  var DEFAULT_CONFIG = null;

  /* ==========================================================================
     Hardcoded shadcn/ui defaults ("Відновити кольори") — deliberately NOT
     read from the live page (theme.css is user-editable and could drift
     from either source over time). Verified against shadcn/ui's official
     Neutral-theme docs — see docs/SETTINGS_UX.md, "Кольори — раунд 2":
     the 17 base tokens (background/foreground/card(-foreground)/
     primary(-foreground)/secondary(-foreground)/muted(-foreground)/
     accent(-foreground)/destructive(-foreground)/border/input/ring) are
     real, unmodified shadcn values. success/warning and every
     -hover/-disabled token are this project's own additions (PR #9) —
     not from shadcn — so those are pinned to this project's own original
     shipped values instead, not a shadcn source. card-border has no
     shadcn equivalent either; pinned to its own original default (the
     project's border color) for the same reason. Does not touch
     typography/sizes — that's what the separate "Скинути" already does.
     ========================================================================== */
  var SHADCN_COLOR_DEFAULTS = {
    light: {
      "background": "0 0% 100%",
      "foreground": "240 10% 3.9%",
      "card": "0 0% 100%",
      "card-foreground": "240 10% 3.9%",
      "card-border": "240 5.9% 90%",
      "primary": "240 5.9% 10%",
      "primary-foreground": "0 0% 98%",
      "primary-hover": "240 2.8% 19%",
      "primary-disabled": "240 0.7% 55%",
      "secondary": "240 4.8% 95.9%",
      "secondary-foreground": "240 5.9% 10%",
      "secondary-hover": "240 4.8% 96.7%",
      "secondary-disabled": "240 4.8% 98%",
      "muted": "240 4.8% 95.9%",
      "muted-foreground": "240 3.8% 46.1%",
      "accent": "240 4.8% 95.9%",
      "accent-foreground": "240 5.9% 10%",
      "accent-hover": "240 4.8% 96.7%",
      "accent-disabled": "240 4.8% 98%",
      "destructive": "0 84.2% 60.2%",
      "destructive-foreground": "0 0% 98%",
      "destructive-hover": "0 84.2% 64.2%",
      "destructive-disabled": "0 84.2% 80.1%",
      "success": "142 71% 45%",
      "success-foreground": "0 0% 98%",
      "warning": "38 92% 50%",
      "warning-foreground": "240 10% 3.9%",
      "border": "240 5.9% 90%",
      "input": "240 5.9% 90%",
      "ring": "240 5.9% 10%"
    },
    dark: {
      "background": "240 10% 3.9%",
      "foreground": "0 0% 98%",
      "card": "240 10% 5.9%",
      "card-foreground": "0 0% 98%",
      "card-border": "240 3.7% 15.9%",
      "primary": "0 0% 98%",
      "primary-foreground": "240 5.9% 10%",
      "primary-hover": "240 0.3% 88.6%",
      "primary-disabled": "240 0.4% 51%",
      "secondary": "240 3.7% 15.9%",
      "secondary-foreground": "0 0% 98%",
      "secondary-hover": "240 4.1% 13.5%",
      "secondary-disabled": "240 4.9% 9.9%",
      "muted": "240 3.7% 15.9%",
      "muted-foreground": "240 5% 64.9%",
      "accent": "240 3.7% 15.9%",
      "accent-foreground": "0 0% 98%",
      "accent-hover": "240 4.1% 13.5%",
      "accent-disabled": "240 4.9% 9.9%",
      "destructive": "0 62.8% 30.6%",
      "destructive-foreground": "0 0% 98%",
      "destructive-hover": "0 62% 27.9%",
      "destructive-disabled": "0 56.3% 17.1%",
      "success": "142 71% 45%",
      "success-foreground": "0 0% 98%",
      "warning": "38 92% 50%",
      "warning-foreground": "240 10% 3.9%",
      "border": "240 3.7% 15.9%",
      "input": "240 3.7% 15.9%",
      "ring": "240 4.9% 83.9%"
    }
  };

  var builderState = {
    fonts: {
      sans: null,   // { family, slug, files: {weight: ArrayBuffer}, cssText }
      heading: null
    }
  };

  /* ==========================================================================
     Read the actual :root / [data-theme="dark"] rule text from the loaded
     theme.css stylesheet via the CSSOM — NOT via getComputedStyle(<html>),
     which would already be contaminated by any prior inline-style leak.
     ========================================================================== */

  function findThemeRules() {
    var rootRule = null;
    var darkRule = null;
    for (var i = 0; i < document.styleSheets.length; i++) {
      var sheet = document.styleSheets[i];
      var rules;
      try {
        rules = sheet.cssRules;
      } catch (e) {
        continue; // cross-origin sheet; not ours, skip
      }
      if (!rules) continue;
      for (var j = 0; j < rules.length; j++) {
        var rule = rules[j];
        if (!rule.selectorText) continue;
        if (rule.selectorText === ":root" && !rootRule) rootRule = rule;
        if (rule.selectorText === '[data-theme="dark"]' && !darkRule) darkRule = rule;
      }
      if (rootRule && darkRule) break;
    }
    return { rootRule: rootRule, darkRule: darkRule };
  }

  // Roles whose --theme-{role} primitive doesn't exist because they alias a
  // DIFFERENT primitive by default — currently just card-border, which
  // aliases --theme-border (see theme.css). Needed so the dark-theme read
  // below finds --theme-border's own dark value instead of silently
  // falling back to light's (border legitimately differs between themes;
  // reusing light[role] there would be wrong, not just imprecise).
  var PRIMITIVE_FALLBACK = { "card-border": "border" };

  function parseInitialColorState() {
    var found = findThemeRules();
    var light = {};
    var dark = {};
    COLOR_FIELDS.forEach(function (role) {
      // Read from the --theme-{role} PRIMITIVE (or its PRIMITIVE_FALLBACK
      // stand-in), not --{role} itself — since the "Палітра" architecture,
      // --{role} in the stylesheet is just `var(--theme-{role})` (literal
      // token text, not a resolved value), so reading it straight from the
      // CSSOM would return that unresolved "var(...)" string instead of a
      // real "H S% L%" triple.
      var primitiveRole = PRIMITIVE_FALLBACK[role] || role;
      var lightVal = found.rootRule ? found.rootRule.style.getPropertyValue("--theme-" + primitiveRole).trim() : "";
      var darkVal = found.darkRule ? found.darkRule.style.getPropertyValue("--theme-" + primitiveRole).trim() : "";
      light[role] = lightVal || getVarValue("--" + role);
      // Falls back to getVarValue() (ambient computed style), NOT
      // light[role] — with card-border in the mix, light and dark
      // legitimately differ, so silently reusing light's value here would
      // be wrong, not just imprecise, whenever that fallback path is hit.
      dark[role] = darkVal || getVarValue("--" + role);
    });
    return { light: light, dark: dark };
  }

  /* ==========================================================================
     Live preview — a single dedicated <style> element with two independent
     rule blocks, inserted after theme.css so normal cascade/source-order
     rules apply. Editing light NEVER touches dark's block and vice versa.
     ========================================================================== */

  function getOrCreatePreviewStyleEl() {
    var styleEl = document.getElementById("builder-live-preview");
    if (styleEl) return styleEl;
    styleEl = document.createElement("style");
    styleEl.id = "builder-live-preview";
    var themeLink = document.querySelector('link[href*="theme.css"]');
    if (themeLink && themeLink.parentNode) {
      themeLink.parentNode.insertBefore(styleEl, themeLink.nextSibling);
    } else {
      document.head.appendChild(styleEl);
    }
    return styleEl;
  }

  function renderPreviewStyle() {
    var styleEl = getOrCreatePreviewStyleEl();
    var lightDecls = COLOR_FIELDS.map(function (role) {
      return "  --" + role + ": " + state.light[role] + ";";
    }).join("\n");
    var darkDecls = COLOR_FIELDS.map(function (role) {
      return "  --" + role + ": " + state.dark[role] + ";";
    }).join("\n");
    styleEl.textContent =
      ":root {\n" + lightDecls + "\n}\n" +
      '[data-theme="dark"] {\n' + darkDecls + "\n}";
  }

  /* ==========================================================================
     Dual preview cards — each card gets ALL 9 color vars set directly as
     inline style on itself, so it renders correctly regardless of the
     ambient page theme (isolated from <html>'s data-theme attribute).
     ========================================================================== */

  function renderPreviewCards() {
    var lightCard = document.getElementById("builder-preview-light");
    var darkCard = document.getElementById("builder-preview-dark");
    if (lightCard) {
      COLOR_FIELDS.forEach(function (role) {
        lightCard.style.setProperty("--" + role, state.light[role]);
      });
    }
    if (darkCard) {
      COLOR_FIELDS.forEach(function (role) {
        darkCard.style.setProperty("--" + role, state.dark[role]);
      });
    }
  }

  /* ==========================================================================
     Per-group live previews (Кольори panel on settings.html) — every real
     component used as a preview (card/buttons/badges/alerts/input) lives
     inside one shared #color-groups-preview-scope wrapper. Setting all 29
     COLOR_FIELDS as inline custom properties on that single ancestor lets
     every nested hsl(var(--role)) resolve to whichever theme is currently
     being edited, via ordinary CSS inheritance — isolated from the page's
     own ambient [data-theme], same isolation idea as the old preview cards,
     just scoped to one wrapper instead of duplicated per element.
     ========================================================================== */

  function renderColorGroupPreviews() {
    var scopeEl = document.getElementById("color-groups-preview-scope");
    if (!scopeEl) return;
    COLOR_FIELDS.forEach(function (role) {
      scopeEl.style.setProperty("--" + role, state[currentEditingTheme][role]);
    });
  }

  function refreshColorPreview() {
    renderPreviewStyle();
    renderPreviewCards();
    renderColorGroupPreviews();
  }

  /* ==========================================================================
     Color pickers — one shared set of 9 pickers; the light/dark segmented
     switch decides which state object they read from and write to.
     ========================================================================== */

  function syncColorPickerUI() {
    COLOR_FIELDS.forEach(function (role) {
      var input = document.getElementById("cfg-color-" + role);
      var hexEl = document.getElementById("cfg-color-" + role + "-hex");
      if (!input || !hexEl) return;
      var hex = hslTripleToHex(state[currentEditingTheme][role]);
      input.value = hex;
      hexEl.value = hex.toUpperCase();
    });
  }

  // Accepts "#RGB", "#RRGGBB", or the same without the leading "#";
  // returns a normalized lowercase "#rrggbb" string, or null if the input
  // isn't a complete, valid hex color yet (e.g. still mid-typing).
  var HEX_COLOR_PATTERN = /^#?([0-9a-fA-F]{6}|[0-9a-fA-F]{3})$/;

  function normalizeHexInput(raw) {
    var match = HEX_COLOR_PATTERN.exec(raw.trim());
    if (!match) return null;
    var hex = match[1];
    if (hex.length === 3) {
      hex = hex[0] + hex[0] + hex[1] + hex[1] + hex[2] + hex[2];
    }
    return "#" + hex.toLowerCase();
  }

  // Single state-update path shared by both the swatch (<input type=color>,
  // always a valid hex by construction) and the editable hex text input
  // (Step 3) — whichever one changes, both stay in sync and the same
  // preview/autosave side effects run.
  function commitColorValue(role, input, hexEl, hex) {
    var triple = hexToHslTriple(hex);
    state[currentEditingTheme][role] = triple;
    input.value = hex;
    hexEl.value = hex.toUpperCase();
    refreshColorPreview();
  }

  function initColorFields() {
    COLOR_FIELDS.forEach(function (role) {
      var input = document.getElementById("cfg-color-" + role);
      var hexEl = document.getElementById("cfg-color-" + role + "-hex");
      if (!input || !hexEl) return;

      // Snapshot once per interaction (on focus, before any edit in this
      // session lands) rather than on every 'input' event — a native color
      // picker fires 'input' continuously while dragging, and snapshotting
      // each of those would make "undo" only revert the last micro-step
      // instead of the whole gesture.
      input.addEventListener("focus", snapshotForUndo);
      hexEl.addEventListener("focus", snapshotForUndo);

      input.addEventListener("input", function () {
        commitColorValue(role, input, hexEl, input.value);
        persistDraft();
      });

      hexEl.addEventListener("input", function () {
        var normalized = normalizeHexInput(hexEl.value);
        if (!normalized) return; // incomplete/invalid — don't commit yet
        commitColorValue(role, input, hexEl, normalized);
        persistDraft();
      });
    });
    syncColorPickerUI();
  }

  function initThemeEditSwitch() {
    var lightBtn = document.getElementById("builder-edit-light");
    var darkBtn = document.getElementById("builder-edit-dark");
    if (!lightBtn || !darkBtn) return;

    function setEditing(theme) {
      currentEditingTheme = theme;
      lightBtn.classList.toggle("btn-primary", theme === "light");
      lightBtn.classList.toggle("btn-outline", theme !== "light");
      lightBtn.setAttribute("aria-pressed", theme === "light" ? "true" : "false");
      darkBtn.classList.toggle("btn-primary", theme === "dark");
      darkBtn.classList.toggle("btn-outline", theme !== "dark");
      darkBtn.setAttribute("aria-pressed", theme === "dark" ? "true" : "false");
      syncColorPickerUI();
      renderColorGroupPreviews();
    }

    lightBtn.addEventListener("click", function () { setEditing("light"); });
    darkBtn.addEventListener("click", function () { setEditing("dark"); });
  }

  /* ==========================================================================
     Numeric tokens (spacing/typography scale) — theme-invariant, so a plain
     inline style on <html> is safe here (no dark counterpart to leak into).
     ========================================================================== */

  function initNumberFields() {
    NUMBER_FIELDS.forEach(function (field) {
      var input = document.getElementById(field.id);
      if (!input) return;
      var current = getVarValue(field.varName);
      input.value = parseFloat(current) || 0;
      input.addEventListener("focus", snapshotForUndo);
      input.addEventListener("input", function () {
        setVar(field.varName, input.value + field.unit);
        persistDraft();
      });
    });
  }

  /* ==========================================================================
     Google Fonts
     ========================================================================== */

  var FONT_WEIGHTS = [400, 500, 600, 700];
  // Each entry: { name: "Roboto", subsets: ["cyrillic", "latin", ...] }.
  var GOOGLE_FONTS_LIST = [];
  var CYRILLIC_SUBSETS = ["cyrillic", "cyrillic-ext"];

  function loadGoogleFontsList() {
    return fetch("js/google-fonts-list.json").then(function (resp) {
      if (!resp.ok) throw new Error("HTTP " + resp.status);
      return resp.json();
    }).then(function (list) {
      GOOGLE_FONTS_LIST = list;
    }).catch(function () {
      GOOGLE_FONTS_LIST = [];
    });
  }

  function fetchGoogleFont(familyName, weights) {
    var weightParam = weights.join(";");
    var cssUrl = "https://fonts.googleapis.com/css2?family=" +
      encodeURIComponent(familyName).replace(/%20/g, "+") +
      ":wght@" + weightParam + "&display=swap";

    return fetch(cssUrl).then(function (cssResp) {
      if (!cssResp.ok) {
        throw new Error("Google Fonts повернув помилку HTTP " + cssResp.status + " для «" + familyName + "»");
      }
      return cssResp.text();
    }).then(function (cssText) {
      var blocks = cssText.split("@font-face").slice(1);
      var byWeight = {};
      blocks.forEach(function (block) {
        var wMatch = block.match(/font-weight:\s*(\d+)/);
        var uMatch = block.match(/src:\s*url\(([^)]+)\)/);
        if (wMatch && uMatch) {
          byWeight[wMatch[1]] = uMatch[1];
        }
      });

      var slug = familyName.trim().replace(/\s+/g, "-").replace(/[^a-zA-Z0-9-]/g, "");
      if (!slug) {
        throw new Error("Некоректна назва шрифту");
      }

      var fetchTasks = [];
      var result = {};
      var fontFaceCssParts = [];

      weights.forEach(function (w) {
        var url = byWeight[String(w)];
        if (!url) return;
        fetchTasks.push(
          fetch(url).then(function (fileResp) {
            if (!fileResp.ok) {
              throw new Error("Не вдалося завантажити файл шрифту (нарізка " + w + ")");
            }
            return fileResp.arrayBuffer();
          }).then(function (buffer) {
            result[w] = buffer;
            fontFaceCssParts.push(
              "@font-face {\n" +
              '  font-family: "' + familyName + '";\n' +
              '  src: url("../fonts/' + slug + "/" + slug + "-" + w + '.woff2") format("woff2");\n' +
              "  font-weight: " + w + ";\n" +
              "  font-style: normal;\n" +
              "  font-display: swap;\n" +
              "}\n"
            );
          })
        );
      });

      return Promise.all(fetchTasks).then(function () {
        if (!Object.keys(result).length) {
          throw new Error("Не знайдено жодного файлу шрифту для «" + familyName + "» — перевірте назву на fonts.google.com");
        }
        return { family: familyName, slug: slug, files: result, cssText: fontFaceCssParts.join("\n") };
      });
    });
  }

  function showFontError(role, message) {
    var errorEl = document.getElementById("font-" + role + "-error");
    if (!errorEl) return;
    errorEl.textContent = message;
    errorEl.style.color = message ? "hsl(var(--destructive))" : "";
  }

  function applyFontToRole(role, varName, familyName) {
    if (!familyName) {
      showFontError(role, "Вкажіть назву шрифту з Google Fonts.");
      return;
    }
    showFontError(role, "");
    var applyBtn = document.getElementById("font-" + role + "-apply");
    var originalText = applyBtn ? applyBtn.textContent : "";
    if (applyBtn) {
      applyBtn.disabled = true;
      applyBtn.textContent = "Завантаження...";
    }

    fetchGoogleFont(familyName, FONT_WEIGHTS).then(function (fontData) {
      snapshotForUndo(); // right before the mutation, only on confirmed success
      var previewStyleId = "builder-font-preview-" + role;
      var styleEl = document.getElementById(previewStyleId);
      if (!styleEl) {
        styleEl = document.createElement("style");
        styleEl.id = previewStyleId;
        document.head.appendChild(styleEl);
      }
      var blobRules = Object.keys(fontData.files).map(function (w) {
        var blob = new Blob([fontData.files[w]], { type: "font/woff2" });
        var url = URL.createObjectURL(blob);
        return '@font-face { font-family: "' + fontData.family + '"; src: url("' + url +
          '") format("woff2"); font-weight: ' + w + "; font-style: normal; font-display: swap; }";
      }).join("\n");
      styleEl.textContent = blobRules;

      setVar(varName, '"' + fontData.family + '", "Segoe UI", sans-serif');
      builderState.fonts[role] = fontData;
      persistDraft();
    }).catch(function (err) {
      showFontError(role, "Помилка завантаження шрифту: " + err.message +
        ". Переконайтесь, що галерея відкрита через локальний сервер (не file://) і назва існує в Google Fonts.");
    }).then(function () {
      if (applyBtn) {
        applyBtn.disabled = false;
        applyBtn.textContent = originalText;
      }
    });
  }

  /* ==========================================================================
     Searchable font picker — substring match against the bundled local
     JSON list (no network call for the search itself); each dropdown
     option renders its own name in its actual font, fetched on demand.
     ========================================================================== */

  var optionPreviewCache = {}; // familyName -> local preview font-family name (avoids refetching)

  function renderOptionPreview(optBtn, familyName) {
    if (optionPreviewCache[familyName]) {
      optBtn.style.fontFamily = '"' + optionPreviewCache[familyName] + '", sans-serif';
      return;
    }
    fetchGoogleFont(familyName, [400]).then(function (fontData) {
      var blob = new Blob([fontData.files[400]], { type: "font/woff2" });
      var url = URL.createObjectURL(blob);
      var previewFamily = "uikit-font-option-" + fontData.slug;
      var styleEl = document.createElement("style");
      styleEl.textContent = '@font-face { font-family: "' + previewFamily +
        '"; src: url("' + url + '") format("woff2"); font-weight: 400; }';
      document.head.appendChild(styleEl);
      optionPreviewCache[familyName] = previewFamily;
      optBtn.style.fontFamily = '"' + previewFamily + '", sans-serif';
    }).catch(function () {
      // Preview rendering is a nice-to-have, not critical — leave the
      // fallback font on the option row rather than surfacing an error.
    });
  }

  function initFontSearchPicker(role, varName) {
    var input = document.getElementById("font-" + role + "-input");
    var listEl = document.getElementById("font-" + role + "-list");
    var applyBtn = document.getElementById("font-" + role + "-apply");
    var cyrillicFilterEl = document.getElementById("font-" + role + "-cyrillic-filter");
    if (!input || !listEl) return;

    var debounceTimer = null;

    function renderOptions(matches) {
      listEl.innerHTML = "";
      matches.slice(0, 5).forEach(function (font) {
        var optBtn = document.createElement("button");
        optBtn.type = "button";
        optBtn.className = "select-search-option";
        optBtn.textContent = font.name;
        listEl.appendChild(optBtn);
        renderOptionPreview(optBtn, font.name);
        optBtn.addEventListener("click", function () {
          input.value = font.name;
          listEl.innerHTML = "";
          applyFontToRole(role, varName, font.name);
        });
      });
    }

    function findMatches(query) {
      var onlyCyrillic = !!(cyrillicFilterEl && cyrillicFilterEl.checked);
      return GOOGLE_FONTS_LIST.filter(function (font) {
        var nameMatches = font.name.toLowerCase().indexOf(query) !== -1;
        if (!nameMatches) return false;
        if (!onlyCyrillic) return true;
        var subsets = font.subsets || [];
        return CYRILLIC_SUBSETS.some(function (s) { return subsets.indexOf(s) !== -1; });
      });
    }

    input.addEventListener("input", function () {
      clearTimeout(debounceTimer);
      var query = input.value.trim().toLowerCase();
      if (!query) {
        listEl.innerHTML = "";
        return;
      }
      debounceTimer = setTimeout(function () {
        renderOptions(findMatches(query));
      }, 200);
    });

    if (cyrillicFilterEl) {
      cyrillicFilterEl.addEventListener("change", function () {
        var query = input.value.trim().toLowerCase();
        if (!query) return;
        renderOptions(findMatches(query));
      });
    }

    if (applyBtn) {
      applyBtn.addEventListener("click", function () {
        applyFontToRole(role, varName, input.value.trim());
      });
    }
  }

  /* ==========================================================================
     Table generator
     ========================================================================== */

  function buildTableHTML(variant, cols, rows) {
    cols = Math.max(1, parseInt(cols, 10) || 1);
    rows = Math.max(1, parseInt(rows, 10) || 1);
    var variantClass = variant && variant !== "default" ? " table-" + variant : "";

    var headCells = "";
    for (var c = 0; c < cols; c++) {
      headCells += "<th>Колонка " + (c + 1) + "</th>";
    }

    var bodyRows = "";
    for (var r = 0; r < rows; r++) {
      var cells = "";
      for (var c2 = 0; c2 < cols; c2++) {
        cells += "<td>Значення " + (r + 1) + "." + (c2 + 1) + "</td>";
      }
      bodyRows += "  <tr>" + cells + "</tr>\n";
    }

    return '<div class="table-wrapper">\n' +
      '  <table class="table' + variantClass + '">\n' +
      "    <thead><tr>" + headCells + "</tr></thead>\n" +
      "    <tbody>\n" + bodyRows + "    </tbody>\n" +
      "  </table>\n" +
      "</div>";
  }

  function initTableGenerator() {
    var variantSel = document.getElementById("table-gen-variant");
    var colsInput = document.getElementById("table-gen-cols");
    var rowsInput = document.getElementById("table-gen-rows");
    var previewEl = document.getElementById("table-gen-preview");
    var sourceTpl = document.getElementById("table-gen-source");
    if (!variantSel || !colsInput || !rowsInput || !previewEl) return;

    function render() {
      var html = buildTableHTML(variantSel.value, colsInput.value, rowsInput.value);
      previewEl.innerHTML = html;
      if (sourceTpl) sourceTpl.innerHTML = html;
      persistDraft();
    }

    [variantSel, colsInput, rowsInput].forEach(function (el) {
      el.addEventListener("focus", snapshotForUndo);
    });
    variantSel.addEventListener("change", render);
    colsInput.addEventListener("input", render);
    rowsInput.addEventListener("input", render);
    render();
  }

  /* ==========================================================================
     Layout ratio generator
     ========================================================================== */

  function buildLayoutRatio(ratioString) {
    var parts = ratioString.split("/").map(function (s) {
      return parseFloat(s.trim());
    }).filter(function (n) {
      return !isNaN(n) && n > 0;
    });

    if (!parts.length) {
      throw new Error('Некоректний формат співвідношення — використовуйте, наприклад, "30/70" або "25/25/50"');
    }

    var templateColumns = parts.map(function (n) { return n + "fr"; }).join(" ");
    var cols = parts.map(function (n, i) {
      return '  <div class="panel">Колонка ' + (i + 1) + " (" + n + ")</div>";
    }).join("\n");
    var html = '<div class="grid" style="grid-template-columns: ' + templateColumns + '; gap: 1rem;">\n' +
      cols + "\n</div>";

    return { css: "grid-template-columns: " + templateColumns + ";", html: html };
  }

  function initLayoutGenerator() {
    var ratioInput = document.getElementById("layout-gen-ratio");
    var previewEl = document.getElementById("layout-gen-preview");
    var sourceTpl = document.getElementById("layout-gen-source");
    var errorEl = document.getElementById("layout-gen-error");
    var copyCssBtn = document.getElementById("layout-gen-copy-css");
    if (!ratioInput || !previewEl) return;

    var currentCss = "";

    function render() {
      try {
        var result = buildLayoutRatio(ratioInput.value);
        previewEl.innerHTML = result.html;
        if (sourceTpl) sourceTpl.innerHTML = result.html;
        currentCss = result.css;
        if (errorEl) errorEl.textContent = "";
      } catch (err) {
        if (errorEl) {
          errorEl.textContent = err.message;
          errorEl.style.color = "hsl(var(--destructive))";
        }
      }
      persistDraft();
    }

    ratioInput.addEventListener("focus", snapshotForUndo);
    ratioInput.addEventListener("input", render);
    if (copyCssBtn) {
      copyCssBtn.addEventListener("click", function () {
        copyPlainText(currentCss, copyCssBtn);
      });
    }
    render();
  }

  /* ==========================================================================
     Config serialize / apply / save / load / reset
     `light` and `dark` are distinct top-level keys — never a single shared
     color object.
     ========================================================================== */

  function serializeConfig() {
    var config = { light: {}, dark: {}, numbers: {}, fonts: {}, table: {}, layoutRatio: "", cardShadow: false };

    COLOR_FIELDS.forEach(function (role) {
      config.light[role] = state.light[role];
      config.dark[role] = state.dark[role];
    });
    NUMBER_FIELDS.forEach(function (field) {
      config.numbers[field.varName] = getVarValue(field.varName);
    });

    var cardShadowCheckbox = document.getElementById("cfg-card-shadow");
    config.cardShadow = !!(cardShadowCheckbox && cardShadowCheckbox.checked);

    var fontSansInput = document.getElementById("font-sans-input");
    var fontHeadingInput = document.getElementById("font-heading-input");
    config.fonts.sans = fontSansInput ? fontSansInput.value : "";
    config.fonts.heading = fontHeadingInput ? fontHeadingInput.value : "";
    config.fonts.sansVar = getVarValue("--font-sans");
    config.fonts.headingVar = getVarValue("--font-heading");

    var variantSel = document.getElementById("table-gen-variant");
    var colsInput = document.getElementById("table-gen-cols");
    var rowsInput = document.getElementById("table-gen-rows");
    config.table.variant = variantSel ? variantSel.value : "default";
    config.table.cols = colsInput ? colsInput.value : "3";
    config.table.rows = rowsInput ? rowsInput.value : "3";

    var ratioInput = document.getElementById("layout-gen-ratio");
    config.layoutRatio = ratioInput ? ratioInput.value : "30/70";

    return JSON.parse(JSON.stringify(config)); // defensive deep copy
  }

  function applyConfig(config) {
    if (!config) return;

    if (config.light && config.dark) {
      COLOR_FIELDS.forEach(function (role) {
        if (config.light[role]) state.light[role] = config.light[role];
        if (config.dark[role]) state.dark[role] = config.dark[role];
      });
      refreshColorPreview();
      syncColorPickerUI();
    }

    if (config.numbers) {
      NUMBER_FIELDS.forEach(function (field) {
        var value = config.numbers[field.varName];
        if (value === undefined) return;
        setVar(field.varName, value);
        var input = document.getElementById(field.id);
        if (input) input.value = parseFloat(value) || 0;
      });
    }

    if (config.fonts) {
      var fontSansInput = document.getElementById("font-sans-input");
      var fontHeadingInput = document.getElementById("font-heading-input");
      if (fontSansInput && config.fonts.sans !== undefined) fontSansInput.value = config.fonts.sans;
      if (fontHeadingInput && config.fonts.heading !== undefined) fontHeadingInput.value = config.fonts.heading;

      // A saved family name means a Google Font was actually applied — redo
      // the same fetch + blob + @font-face path applyFontToRole() uses for
      // live selection, since the blob URL behind sansVar/headingVar's text
      // does not survive a reload and setVar() alone can't recreate it.
      if (config.fonts.sans) {
        applyFontToRole("sans", "--font-sans", config.fonts.sans);
      } else if (config.fonts.sansVar) {
        setVar("--font-sans", config.fonts.sansVar);
      }

      if (config.fonts.heading) {
        applyFontToRole("heading", "--font-heading", config.fonts.heading);
      } else if (config.fonts.headingVar) {
        setVar("--font-heading", config.fonts.headingVar);
      }
    }

    if (config.table) {
      var variantSel = document.getElementById("table-gen-variant");
      var colsInput = document.getElementById("table-gen-cols");
      var rowsInput = document.getElementById("table-gen-rows");
      if (variantSel && config.table.variant !== undefined) variantSel.value = config.table.variant;
      if (colsInput && config.table.cols !== undefined) colsInput.value = config.table.cols;
      if (rowsInput && config.table.rows !== undefined) rowsInput.value = config.table.rows;
      var tablePreview = document.getElementById("table-gen-preview");
      var tableSourceTpl = document.getElementById("table-gen-source");
      if (tablePreview) {
        var html = buildTableHTML(config.table.variant, config.table.cols, config.table.rows);
        tablePreview.innerHTML = html;
        if (tableSourceTpl) tableSourceTpl.innerHTML = html;
      }
    }

    if (config.layoutRatio !== undefined) {
      var ratioInput = document.getElementById("layout-gen-ratio");
      if (ratioInput) {
        ratioInput.value = config.layoutRatio;
        ratioInput.dispatchEvent(new Event("input", { bubbles: true }));
      }
    }

    if (config.cardShadow !== undefined) {
      var cardShadowCheckbox = document.getElementById("cfg-card-shadow");
      if (cardShadowCheckbox) {
        cardShadowCheckbox.checked = !!config.cardShadow;
        applyCardShadowState();
      }
    }
  }

  /* ==========================================================================
     Autosave draft (localStorage) + single-step undo.
     Separate from the file-based Save/Load below — this is a silent,
     automatic safety net so in-progress edits survive an accidental reload,
     not something the user manages directly (aside from the Undo button).
     ========================================================================== */

  var AUTOSAVE_KEY = "ui-kit-builder-draft";
  var lastSnapshot = null; // single full-config snapshot, not a history stack
  var persistDraftTimer = null;

  function updateUndoButtonState() {
    var undoBtn = document.getElementById("builder-undo");
    if (undoBtn) undoBtn.disabled = !lastSnapshot;
  }

  // Captured on focus of a field (before that field's edit session starts)
  // rather than on every keystroke/drag-step — a native <input type=color>
  // fires 'input' continuously while its picker is being dragged, and
  // snapshotting each of those would make undo only revert the very last
  // micro-step instead of the whole change the user actually made.
  function snapshotForUndo() {
    lastSnapshot = serializeConfig();
    updateUndoButtonState();
  }

  function persistDraft() {
    clearTimeout(persistDraftTimer);
    persistDraftTimer = setTimeout(function () {
      try {
        localStorage.setItem(AUTOSAVE_KEY, JSON.stringify(serializeConfig()));
      } catch (e) {
        // Private-browsing / quota / disabled storage — autosave is a
        // convenience, not critical; fail silently rather than surfacing
        // an error for something the user didn't explicitly trigger.
      }
    }, 400);
  }

  function initUndoButton() {
    var undoBtn = document.getElementById("builder-undo");
    if (!undoBtn) return;
    updateUndoButtonState();
    undoBtn.addEventListener("click", function () {
      if (!lastSnapshot) {
        UIKit.showToast("Немає останньої зміни для скасування", "warning");
        return;
      }
      applyConfig(lastSnapshot);
      lastSnapshot = null; // single-step: consumed, not a redo-able stack
      updateUndoButtonState();
      persistDraft();
      UIKit.showToast("Останню зміну скасовано", "success");
    });
  }

  // "Відновити кольори" — colors only, hardcoded shadcn/project-original
  // values (SHADCN_COLOR_DEFAULTS above), distinct from "Скинути" which
  // resets everything (colors + typography + sizes) back to whatever
  // theme.css happened to ship with on this page load.
  function initRestoreShadcnButton() {
    var btn = document.getElementById("builder-restore-shadcn");
    if (!btn) return;
    btn.addEventListener("click", function () {
      snapshotForUndo();
      applyConfig({ light: SHADCN_COLOR_DEFAULTS.light, dark: SHADCN_COLOR_DEFAULTS.dark });
      persistDraft();
      UIKit.showToast("Кольори відновлено до shadcn-дефолтів", "success");
    });
  }

  /* ==========================================================================
     Card border color already rides the generic COLOR_FIELDS machinery
     (initColorFields() below wires cfg-color-card-border same as every
     other field). Only the shadow checkbox needs its own small handler.
     ========================================================================== */

  function applyCardShadowState() {
    var checkbox = document.getElementById("cfg-card-shadow");
    var previewCard = document.getElementById("palette-card-preview-example");
    if (!checkbox || !previewCard) return;
    previewCard.classList.toggle("has-shadow", checkbox.checked);
  }

  function initCardShadowToggle() {
    var checkbox = document.getElementById("cfg-card-shadow");
    if (!checkbox) return;
    checkbox.addEventListener("focus", snapshotForUndo);
    checkbox.addEventListener("change", function () {
      applyCardShadowState();
      persistDraft();
    });
    applyCardShadowState();
  }

  function initSaveLoadReset() {
    var saveBtn = document.getElementById("builder-save");
    var loadBtn = document.getElementById("builder-load-btn");
    var loadInput = document.getElementById("builder-load-input");
    var resetBtn = document.getElementById("builder-reset");

    if (saveBtn) {
      saveBtn.addEventListener("click", function () {
        var json = JSON.stringify(serializeConfig(), null, 2);
        var blob = new Blob([json], { type: "application/json" });
        downloadBlob(blob, "config.json");
        UIKit.showToast("Налаштування збережено", "success");
      });
    }

    if (loadBtn && loadInput) {
      loadBtn.addEventListener("click", function () {
        loadInput.click();
      });
      loadInput.addEventListener("change", function () {
        var file = loadInput.files && loadInput.files[0];
        if (!file) return;
        var reader = new FileReader();
        reader.onload = function () {
          try {
            var config = JSON.parse(String(reader.result));
            applyConfig(config);
            persistDraft(); // an explicit file Load becomes the new autosaved baseline
            UIKit.showToast("Налаштування завантажено", "success");
          } catch (err) {
            UIKit.showToast("Не вдалося прочитати config.json: " + err.message, "destructive");
          }
        };
        reader.readAsText(file);
        loadInput.value = "";
      });
    }

    if (resetBtn) {
      resetBtn.addEventListener("click", function () {
        applyConfig(DEFAULT_CONFIG);
        // Overwrite the draft too — otherwise reloading right after Reset
        // would resurrect the pre-reset draft instead of staying reset.
        try {
          localStorage.setItem(AUTOSAVE_KEY, JSON.stringify(DEFAULT_CONFIG));
        } catch (e) {
          // Same non-critical-storage reasoning as persistDraft().
        }
        UIKit.showToast("Скинуто до початкових значень", "success");
      });
    }
  }

  /* ==========================================================================
     Minimal ZIP writer (STORE method — no compression), no external library.
     ========================================================================== */

  var crcTable = null;

  function makeCrcTable() {
    var table = [];
    for (var n = 0; n < 256; n++) {
      var c = n;
      for (var k = 0; k < 8; k++) {
        c = (c & 1) ? (0xEDB88320 ^ (c >>> 1)) : (c >>> 1);
      }
      table[n] = c >>> 0;
    }
    return table;
  }

  function crc32(bytes) {
    if (!crcTable) crcTable = makeCrcTable();
    var crc = 0xFFFFFFFF;
    for (var i = 0; i < bytes.length; i++) {
      crc = (crc >>> 8) ^ crcTable[(crc ^ bytes[i]) & 0xFF];
    }
    return (crc ^ 0xFFFFFFFF) >>> 0;
  }

  function u16(n) { return [n & 0xFF, (n >>> 8) & 0xFF]; }
  function u32(n) { return [n & 0xFF, (n >>> 8) & 0xFF, (n >>> 16) & 0xFF, (n >>> 24) & 0xFF]; }

  function asciiBytes(s) {
    var arr = [];
    for (var i = 0; i < s.length; i++) arr.push(s.charCodeAt(i) & 0xFF);
    return arr;
  }

  function dosDateTime(date) {
    var time = (date.getHours() << 11) | (date.getMinutes() << 5) | (Math.floor(date.getSeconds() / 2));
    var dosDate = ((date.getFullYear() - 1980) << 9) | ((date.getMonth() + 1) << 5) | date.getDate();
    return { time: time & 0xFFFF, date: dosDate & 0xFFFF };
  }

  function createZip(files) {
    var entries = Object.keys(files);
    var dt = dosDateTime(new Date());
    var localParts = [];
    var centralParts = [];
    var offset = 0;

    entries.forEach(function (path) {
      var data = files[path];
      var nameBytes = asciiBytes(path);
      var crc = crc32(data);
      var size = data.length;

      var localHeader = [].concat(
        u32(0x04034b50),
        u16(20), u16(0), u16(0),
        u16(dt.time), u16(dt.date),
        u32(crc), u32(size), u32(size),
        u16(nameBytes.length), u16(0)
      );
      var localEntry = new Uint8Array(localHeader.concat(nameBytes));
      localParts.push(localEntry);
      localParts.push(data);

      var centralHeader = [].concat(
        u32(0x02014b50),
        u16(20), u16(20), u16(0), u16(0),
        u16(dt.time), u16(dt.date),
        u32(crc), u32(size), u32(size),
        u16(nameBytes.length), u16(0), u16(0), u16(0), u16(0),
        u32(0), u32(offset)
      );
      centralParts.push(new Uint8Array(centralHeader.concat(nameBytes)));

      offset += localEntry.length + size;
    });

    var centralDirSize = centralParts.reduce(function (sum, arr) { return sum + arr.length; }, 0);
    var centralDirOffset = offset;

    var endRecord = new Uint8Array([].concat(
      u32(0x06054b50),
      u16(0), u16(0),
      u16(entries.length), u16(entries.length),
      u32(centralDirSize), u32(centralDirOffset),
      u16(0)
    ));

    var allParts = localParts.concat(centralParts).concat([endRecord]);
    var totalLength = allParts.reduce(function (sum, arr) { return sum + arr.length; }, 0);
    var result = new Uint8Array(totalLength);
    var pos = 0;
    allParts.forEach(function (part) {
      result.set(part, pos);
      pos += part.length;
    });
    return result;
  }

  /* ==========================================================================
     Export assembly
     ========================================================================== */

  var CSS_FILES = [
    "css/layout.css", "css/components.css",
    "css/components/buttons.css", "css/components/forms.css", "css/components/cards.css",
    "css/components/badges.css", "css/components/tabs.css", "css/components/tables.css",
    "css/components/alerts.css", "css/components/preview.css", "css/components/selects.css",
    "css/components/labels.css", "css/components/layouts.css", "css/components/upload.css",
    "css/components/loaders.css", "css/components/links.css", "css/components/accordion.css"
  ];

  var MONTSERRAT_FILES = ["Regular", "Medium", "SemiBold", "Bold"];

  function replaceVarsInBlock(text, blockRegex, values) {
    return text.replace(blockRegex, function (fullMatch) {
      var modified = fullMatch;
      Object.keys(values).forEach(function (role) {
        // Matches BOTH the --{role} alias and its --theme-{role} primitive
        // (if one exists — --card-border has none, and this pattern simply
        // finds no second match for it, which is fine) so baking a role's
        // edited value keeps the primitive and the alias it feeds in sync
        // in the exported theme.css, instead of leaving --theme-* stale
        // while --{role} moves on ahead of it.
        var re = new RegExp("(--(?:theme-)?" + role + ":)[^;]+;", "g");
        modified = modified.replace(re, "$1 " + values[role] + ";");
      });
      return modified;
    });
  }

  function bakeThemeCss(text, exportData) {
    var result = text;

    // Colors: scoped substitution — light values ONLY inside :root, dark
    // values ONLY inside [data-theme="dark"]. This is the fix for the
    // color-leak bug: never a single blind global replace for colors.
    result = replaceVarsInBlock(result, /:root\s*\{[\s\S]*?\n\}/, exportData.light);
    result = replaceVarsInBlock(result, /\[data-theme="dark"\]\s*\{[\s\S]*?\n\}/, exportData.dark);

    // Numbers/fonts have no dark counterpart — safe as a global replace.
    Object.keys(exportData.numbers).forEach(function (varName) {
      var name = varName.replace(/^--/, "");
      var re = new RegExp("(--" + name + ":)[^;]+;", "g");
      result = result.replace(re, "$1 " + exportData.numbers[varName] + ";");
    });

    if (exportData.fonts.sansVar) {
      result = result.replace(/(--font-sans:)[^;]+;/, "$1 " + exportData.fonts.sansVar + ";");
    }
    if (exportData.fonts.headingVar) {
      result = result.replace(/(--font-heading:)[^;]+;/, "$1 " + exportData.fonts.headingVar + ";");
    }

    var extraFontFaces = "";
    ["sans", "heading"].forEach(function (role) {
      var fontData = builderState.fonts[role];
      if (fontData && fontData.cssText) extraFontFaces += "\n" + fontData.cssText;
    });
    if (extraFontFaces) {
      result = result.replace(
        "/* ==========================================================================\n   Light theme (default)",
        extraFontFaces + "\n\n/* ==========================================================================\n   Light theme (default)"
      );
    }

    return result;
  }

  function buildStarterHtml() {
    var variantSel = document.getElementById("table-gen-variant");
    var colsInput = document.getElementById("table-gen-cols");
    var rowsInput = document.getElementById("table-gen-rows");
    var ratioInput = document.getElementById("layout-gen-ratio");

    var tableHtml = buildTableHTML(
      variantSel ? variantSel.value : "default",
      colsInput ? colsInput.value : "3",
      rowsInput ? rowsInput.value : "3"
    );
    var ratioStr = (ratioInput && ratioInput.value) || "30/70";
    var ratio = buildLayoutRatio(ratioStr);

    return "<!doctype html>\n" +
      '<html lang="uk">\n' +
      "<head>\n" +
      '<meta charset="UTF-8" />\n' +
      "<title>ui-kit — starter</title>\n" +
      '<link rel="stylesheet" href="css/theme.css" />\n' +
      '<link rel="stylesheet" href="css/components.css" />\n' +
      '<link rel="stylesheet" href="css/layout.css" />\n' +
      '<script src="js/kit.js"><\/script>\n' +
      "</head>\n" +
      "<body>\n" +
      '<div class="container py-6">\n\n' +
      "<h2>Приклад таблиці</h2>\n" + tableHtml + "\n\n" +
      "<h2>Приклад лейаут-співвідношення (" + ratioStr + ")</h2>\n" + ratio.html + "\n\n" +
      "</div>\n" +
      "</body>\n" +
      "</html>\n";
  }

  function includeFonts(files) {
    var tasks = MONTSERRAT_FILES.map(function (name) {
      var path = "fonts/Montserrat/Montserrat-" + name + ".woff2";
      return fetch(path).then(function (resp) {
        if (!resp.ok) throw new Error("Не вдалося отримати " + path);
        return resp.arrayBuffer();
      }).then(function (buffer) {
        files["ui-kit/" + path] = new Uint8Array(buffer);
      });
    });

    ["sans", "heading"].forEach(function (role) {
      var fontData = builderState.fonts[role];
      if (fontData && fontData.files) {
        Object.keys(fontData.files).forEach(function (weight) {
          var path = "fonts/" + fontData.slug + "/" + fontData.slug + "-" + weight + ".woff2";
          files["ui-kit/" + path] = new Uint8Array(fontData.files[weight]);
        });
      }
    });

    return Promise.all(tasks);
  }

  function exportZip() {
    var exportBtn = document.getElementById("builder-export");
    var statusEl = document.getElementById("builder-export-status");
    if (exportBtn) exportBtn.disabled = true;
    if (statusEl) {
      statusEl.textContent = "Збираємо файли...";
      statusEl.style.color = "";
    }

    var files = {};
    var config = serializeConfig();
    var exportData = { light: config.light, dark: config.dark, numbers: config.numbers, fonts: config.fonts };

    return fetch("css/theme.css")
      .then(function (resp) {
        if (!resp.ok) throw new Error("Не вдалося отримати css/theme.css (HTTP " + resp.status + ")");
        return resp.text();
      })
      .then(function (themeCssText) {
        files["ui-kit/css/theme.css"] = new TextEncoder().encode(bakeThemeCss(themeCssText, exportData));
        return Promise.all(CSS_FILES.map(function (path) {
          return fetch(path).then(function (resp) {
            if (!resp.ok) throw new Error("Не вдалося отримати " + path + " (HTTP " + resp.status + ")");
            return resp.text();
          }).then(function (text) {
            files["ui-kit/" + path] = new TextEncoder().encode(text);
          });
        }));
      })
      .then(function () {
        return fetch("js/kit.js").then(function (resp) {
          if (!resp.ok) throw new Error("Не вдалося отримати js/kit.js (HTTP " + resp.status + ")");
          return resp.text();
        }).then(function (text) {
          files["ui-kit/js/kit.js"] = new TextEncoder().encode(text);
        });
      })
      .then(function () {
        return includeFonts(files);
      })
      .then(function () {
        files["ui-kit/starter.html"] = new TextEncoder().encode(buildStarterHtml());
        var zipBytes = createZip(files);
        downloadBlob(new Blob([zipBytes], { type: "application/zip" }), "ui-kit-custom.zip");
        if (statusEl) statusEl.textContent = "Готово! Завантаження почалось.";
      })
      .catch(function (err) {
        if (statusEl) {
          statusEl.textContent = "Помилка експорту: " + err.message +
            ". Переконайтесь, що галерея відкрита через локальний сервер (python3 -m http.server), а не як file://.";
          statusEl.style.color = "hsl(var(--destructive))";
        }
      })
      .then(function () {
        if (exportBtn) exportBtn.disabled = false;
      });
  }

  function initExport() {
    var exportBtn = document.getElementById("builder-export");
    if (exportBtn) {
      exportBtn.addEventListener("click", exportZip);
    }
  }

  /* ==========================================================================
     Init
     ========================================================================== */

  document.addEventListener("DOMContentLoaded", function () {
    if (!document.getElementById("cfg-color-primary")) return; // Builder tab not present

    var parsed = parseInitialColorState();
    state.light = parsed.light;
    state.dark = parsed.dark;

    initThemeEditSwitch();
    initColorFields();
    refreshColorPreview();
    initNumberFields();
    loadGoogleFontsList().then(function () {
      initFontSearchPicker("sans", "--font-sans");
      initFontSearchPicker("heading", "--font-heading");
    });
    initTableGenerator();
    initLayoutGenerator();
    initSaveLoadReset();
    initExport();
    initUndoButton();
    initRestoreShadcnButton();
    initCardShadowToggle();

    // Must keep representing the original shipped defaults — captured
    // BEFORE any autosaved draft is restored below, never after.
    DEFAULT_CONFIG = serializeConfig();

    try {
      var draftRaw = localStorage.getItem(AUTOSAVE_KEY);
      if (draftRaw) {
        applyConfig(JSON.parse(draftRaw));
      }
    } catch (e) {
      // Corrupt/unreadable draft — ignore silently, keep shipped defaults.
    }
  });

})();
