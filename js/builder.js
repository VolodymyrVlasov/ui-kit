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
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(text).then(done);
    } else {
      var textarea = document.createElement("textarea");
      textarea.value = text;
      textarea.style.position = "fixed";
      textarea.style.opacity = "0";
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand("copy");
      document.body.removeChild(textarea);
      done();
    }
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
     ========================================================================== */

  var builderState = {
    fonts: {
      sans: null,   // { family, slug, files: {weight: ArrayBuffer}, cssText }
      heading: null
    }
  };

  var COLOR_FIELDS = [
    "primary", "secondary", "accent", "destructive",
    "background", "foreground", "muted", "border", "ring"
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

  var DEFAULT_CONFIG = null;

  /* ==========================================================================
     Color pickers
     ========================================================================== */

  function initColorFields() {
    COLOR_FIELDS.forEach(function (role) {
      var input = document.getElementById("cfg-color-" + role);
      var hexEl = document.getElementById("cfg-color-" + role + "-hex");
      if (!input || !hexEl) return;
      var current = getVarValue("--" + role);
      var hex = hslTripleToHex(current);
      input.value = hex;
      hexEl.textContent = hex.toUpperCase();
      input.addEventListener("input", function () {
        hexEl.textContent = input.value.toUpperCase();
        setVar("--" + role, hexToHslTriple(input.value));
      });
    });
  }

  /* ==========================================================================
     Numeric tokens (spacing/typography scale)
     ========================================================================== */

  function initNumberFields() {
    NUMBER_FIELDS.forEach(function (field) {
      var input = document.getElementById(field.id);
      if (!input) return;
      var current = getVarValue(field.varName);
      input.value = parseFloat(current) || 0;
      input.addEventListener("input", function () {
        setVar(field.varName, input.value + field.unit);
      });
    });
  }

  /* ==========================================================================
     Google Fonts
     ========================================================================== */

  var FONT_WEIGHTS = [400, 500, 600, 700];

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

  function initFontPicker(role, varName) {
    var input = document.getElementById("font-" + role + "-input");
    var applyBtn = document.getElementById("font-" + role + "-apply");
    if (!input || !applyBtn) return;

    applyBtn.addEventListener("click", function () {
      var familyName = input.value.trim();
      if (!familyName) {
        showFontError(role, "Вкажіть назву шрифту з Google Fonts.");
        return;
      }
      showFontError(role, "");
      applyBtn.disabled = true;
      var originalText = applyBtn.textContent;
      applyBtn.textContent = "Завантаження...";

      fetchGoogleFont(familyName, FONT_WEIGHTS).then(function (fontData) {
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
      }).catch(function (err) {
        showFontError(role, "Помилка завантаження шрифту: " + err.message +
          ". Переконайтесь, що галерея відкрита через локальний сервер (не file://) і назва існує в Google Fonts.");
      }).then(function () {
        applyBtn.disabled = false;
        applyBtn.textContent = originalText;
      });
    });
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
    }

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
    }

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
     ========================================================================== */

  function serializeConfig() {
    var config = { colors: {}, numbers: {}, fonts: {}, table: {}, layoutRatio: "" };

    COLOR_FIELDS.forEach(function (role) {
      config.colors[role] = getVarValue("--" + role);
    });
    NUMBER_FIELDS.forEach(function (field) {
      config.numbers[field.varName] = getVarValue(field.varName);
    });

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

    return config;
  }

  function applyConfig(config) {
    if (!config) return;

    if (config.colors) {
      COLOR_FIELDS.forEach(function (role) {
        var value = config.colors[role];
        if (!value) return;
        setVar("--" + role, value);
        var input = document.getElementById("cfg-color-" + role);
        var hexEl = document.getElementById("cfg-color-" + role + "-hex");
        if (input) {
          var hex = hslTripleToHex(value);
          input.value = hex;
          if (hexEl) hexEl.textContent = hex.toUpperCase();
        }
      });
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
      if (config.fonts.sansVar) setVar("--font-sans", config.fonts.sansVar);
      if (config.fonts.headingVar) setVar("--font-heading", config.fonts.headingVar);
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
          } catch (err) {
            window.alert("Не вдалося прочитати config.json: " + err.message);
          }
        };
        reader.readAsText(file);
        loadInput.value = "";
      });
    }

    if (resetBtn) {
      resetBtn.addEventListener("click", function () {
        applyConfig(DEFAULT_CONFIG);
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
    "css/components/loaders.css"
  ];

  var MONTSERRAT_FILES = ["Regular", "Medium", "SemiBold", "Bold"];

  function bakeThemeCss(text, config) {
    var result = text;

    Object.keys(config.colors).forEach(function (name) {
      var re = new RegExp("(--" + name + ":)[^;]+;", "g");
      result = result.replace(re, "$1 " + config.colors[name] + ";");
    });
    Object.keys(config.numbers).forEach(function (varName) {
      var name = varName.replace(/^--/, "");
      var re = new RegExp("(--" + name + ":)[^;]+;", "g");
      result = result.replace(re, "$1 " + config.numbers[varName] + ";");
    });

    if (config.fonts.sansVar) {
      result = result.replace(/(--font-sans:)[^;]+;/, "$1 " + config.fonts.sansVar + ";");
    }
    if (config.fonts.headingVar) {
      result = result.replace(/(--font-heading:)[^;]+;/, "$1 " + config.fonts.headingVar + ";");
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

    return fetch("css/theme.css")
      .then(function (resp) {
        if (!resp.ok) throw new Error("Не вдалося отримати css/theme.css (HTTP " + resp.status + ")");
        return resp.text();
      })
      .then(function (themeCssText) {
        files["ui-kit/css/theme.css"] = new TextEncoder().encode(bakeThemeCss(themeCssText, config));
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

    initColorFields();
    initNumberFields();
    initFontPicker("sans", "--font-sans");
    initFontPicker("heading", "--font-heading");
    initTableGenerator();
    initLayoutGenerator();
    initSaveLoadReset();
    initExport();

    DEFAULT_CONFIG = serializeConfig();
  });

})();
