/* Gallery-only script — do NOT copy this file into other projects */

(function () {
  "use strict";

  /* ---------- Theme toggle ---------- */
  var root = document.documentElement;
  var themeToggle = document.getElementById("theme-toggle");
  var storedTheme = localStorage.getItem("ui-kit-theme");
  if (storedTheme === "dark") {
    root.setAttribute("data-theme", "dark");
  }
  themeToggle.addEventListener("click", function () {
    var isDark = root.getAttribute("data-theme") === "dark";
    if (isDark) {
      root.removeAttribute("data-theme");
      localStorage.setItem("ui-kit-theme", "light");
    } else {
      root.setAttribute("data-theme", "dark");
      localStorage.setItem("ui-kit-theme", "dark");
    }
  });

  /* ---------- Компоненти / Інструменти group switch ----------
     Two separate .tabs containers (each already wired independently by
     UIKit.initTabs()); this just shows/hides one group at a time. Nothing
     is removed from the DOM, so switching away and back never loses state
     (e.g. the Builder's in-memory theme state). */
  (function initNavGroups() {
    var componentsBtn = document.getElementById("nav-group-components");
    var toolsBtn = document.getElementById("nav-group-tools");
    var componentsTabs = document.getElementById("components-tabs");
    var toolsTabs = document.getElementById("tools-tabs");
    if (!componentsBtn || !toolsBtn || !componentsTabs || !toolsTabs) return;

    function setGroup(group) {
      var isComponents = group === "components";
      componentsTabs.style.display = isComponents ? "" : "none";
      toolsTabs.style.display = isComponents ? "none" : "";
      componentsBtn.classList.toggle("btn-primary", isComponents);
      componentsBtn.classList.toggle("btn-outline", !isComponents);
      componentsBtn.setAttribute("aria-pressed", isComponents ? "true" : "false");
      toolsBtn.classList.toggle("btn-primary", !isComponents);
      toolsBtn.classList.toggle("btn-outline", isComponents);
      toolsBtn.setAttribute("aria-pressed", !isComponents ? "true" : "false");
    }

    componentsBtn.addEventListener("click", function () { setGroup("components"); });
    toolsBtn.addEventListener("click", function () { setGroup("tools"); });
  })();

  /* ---------- Copy buttons ---------- */
  function flashCopied(btn, label) {
    var original = btn.textContent;
    btn.textContent = "Скопійовано!";
    UIKit.showToast(label + " скопійовано в буфер обміну.");
    setTimeout(function () { btn.textContent = original; }, 1500);
  }

  function copyText(text, btn, label) {
    UIKit.copyText(text).then(function () {
      flashCopied(btn, label);
    });
  }

  document.querySelectorAll('[data-copy="html"]').forEach(function (btn) {
    btn.addEventListener("click", function () {
      var demo = btn.closest(".demo");
      var source = demo.querySelector(".demo-source");
      copyText(source.innerHTML.trim(), btn, "HTML");
    });
  });

  document.querySelectorAll("[data-copy-class]").forEach(function (btn) {
    btn.addEventListener("click", function () {
      copyText(btn.getAttribute("data-copy-class"), btn, "Клас");
    });
  });

  /* ---------- Color token chips (regrouped, STEP 6) ---------- */
  var colorTokenGroups = [
    {
      label: "Поверхні",
      tokens: [
        { name: "background", desc: "Базовий фон сторінки." },
        { name: "card", desc: "Фон карток і панелей поверх основного фону." },
        { name: "card-foreground", desc: "Колір тексту всередині карток." },
        { name: "muted", desc: "Приглушений фон для менш важливих зон." }
      ]
    },
    {
      label: "Текст",
      tokens: [
        { name: "foreground", desc: "Основний колір тексту на фоні." },
        { name: "muted-foreground", desc: "Приглушений колір другорядного тексту." }
      ]
    },
    {
      label: "Дії",
      tokens: [
        { name: "primary", desc: "Головна дія — основні кнопки, активні елементи." },
        { name: "primary-foreground", desc: "Колір тексту поверх primary-фону." },
        { name: "secondary", desc: "Другорядна дія — менш акцентовані кнопки." },
        { name: "secondary-foreground", desc: "Колір тексту поверх secondary-фону." },
        { name: "accent", desc: "Підсвітка при наведенні чи виборі елемента." },
        { name: "accent-foreground", desc: "Колір тексту поверх accent-фону." }
      ]
    },
    {
      label: "Статуси",
      tokens: [
        { name: "destructive", desc: "Небезпечні/незворотні дії (видалення тощо)." },
        { name: "destructive-foreground", desc: "Колір тексту поверх destructive-фону." },
        { name: "success", desc: "Успішний стан чи підтвердження." },
        { name: "success-foreground", desc: "Колір тексту поверх success-фону." },
        { name: "warning", desc: "Попередження, що потребує уваги." },
        { name: "warning-foreground", desc: "Колір тексту поверх warning-фону." }
      ]
    },
    {
      label: "Межі та поля",
      tokens: [
        { name: "border", desc: "Рамки й розділювачі." },
        { name: "input", desc: "Рамка полів вводу." },
        { name: "ring", desc: "Кільце фокусу при навігації клавіатурою." }
      ]
    }
  ];
  var groupsContainer = document.getElementById("color-token-groups");
  if (groupsContainer) {
    colorTokenGroups.forEach(function (group) {
      var section = document.createElement("div");

      var heading = document.createElement("h3");
      heading.className = "text-lg font-semibold mb-2";
      heading.textContent = group.label;
      section.appendChild(heading);

      var grid = document.createElement("div");
      grid.className = "swatch-grid gap-4";

      group.tokens.forEach(function (token) {
        var wrap = document.createElement("div");
        var swatch = document.createElement("div");
        swatch.className = "swatch";
        swatch.style.backgroundColor = "hsl(var(--" + token.name + "))";
        var label = document.createElement("p");
        label.className = "swatch-label text-sm mt-2";
        label.textContent = "--" + token.name;
        var desc = document.createElement("p");
        desc.className = "text-sm text-muted mt-1";
        desc.textContent = token.desc;
        wrap.appendChild(swatch);
        wrap.appendChild(label);
        wrap.appendChild(desc);
        grid.appendChild(wrap);
      });

      section.appendChild(grid);
      groupsContainer.appendChild(section);
    });
  }

  /* ---------- Toast demo ---------- */
  var TOAST_DEMO_MESSAGES = {
    "": "Успішно збережено.",
    destructive: "Не вдалося зберегти зміни.",
    warning: "Перевірте введені дані.",
    success: "Операція виконана успішно."
  };
  document.getElementById("toast-trigger").addEventListener("click", function () {
    var variantSel = document.getElementById("toast-demo-variant");
    var positionSel = document.getElementById("toast-demo-position");
    var variant = variantSel ? variantSel.value : "";
    var position = positionSel ? positionSel.value : "bottom-right";
    UIKit.showToast(TOAST_DEMO_MESSAGES[variant] || TOAST_DEMO_MESSAGES[""], variant || undefined, position);
  });

  /* ---------- Searchable select (demo) ----------
     Filtering behavior now lives in UIKit.initSelectSearch(), auto-wired by
     UIKit.autoInit() on DOMContentLoaded for every .select-search element —
     no gallery-specific code needed here. */

  /* ---------- File button demo (result display) ---------- */
  var fileButtonDemo = document.querySelector("[data-file-button]");
  var fileButtonResult = document.getElementById("file-button-result");
  if (fileButtonDemo && fileButtonResult) {
    fileButtonDemo.addEventListener("uikit:files-selected", function (e) {
      var names = e.detail.files.map(function (f) { return f.name; }).join(", ");
      fileButtonResult.textContent = "Обрано: " + names;
    });
  }

  /* ---------- Loader step demo (simulated, gallery-only) ---------- */
  var loaderDemoBtn = document.getElementById("loader-demo-trigger");
  if (loaderDemoBtn) {
    loaderDemoBtn.addEventListener("click", function () {
      var loaderEl = document.getElementById("loader-demo");
      var steps = [
        "Крок 1 з 4: підготовка файлу...",
        "Крок 2 з 4: завантаження...",
        "Крок 3 з 4: обробка...",
        "Крок 4 з 4: завершення..."
      ];
      loaderDemoBtn.disabled = true;
      steps.forEach(function (text, index) {
        setTimeout(function () {
          UIKit.setLoaderStep(loaderEl, text);
          if (index === steps.length - 1) {
            setTimeout(function () {
              loaderDemoBtn.disabled = false;
              UIKit.setLoaderStep(loaderEl, "Крок 1 з 4: підготовка файлу...");
            }, 800);
          }
        }, index * 900);
      });
    });
  }

})();
