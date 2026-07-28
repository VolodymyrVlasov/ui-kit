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

  /* ---------- Copy buttons ---------- */
  function flashCopied(btn, label) {
    var original = btn.textContent;
    btn.textContent = "Скопійовано!";
    UIKit.showToast(label + " скопійовано в буфер обміну.");
    setTimeout(function () { btn.textContent = original; }, 1500);
  }

  function copyText(text, btn, label) {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(text).then(function () {
        flashCopied(btn, label);
      });
    } else {
      var textarea = document.createElement("textarea");
      textarea.value = text;
      textarea.style.position = "fixed";
      textarea.style.opacity = "0";
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand("copy");
      document.body.removeChild(textarea);
      flashCopied(btn, label);
    }
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

  /* ---------- Color token chips ---------- */
  var colorTokens = [
    "background", "foreground", "card", "card-foreground", "primary", "primary-foreground",
    "secondary", "secondary-foreground", "muted", "muted-foreground", "accent", "accent-foreground",
    "destructive", "destructive-foreground", "success", "success-foreground", "warning", "warning-foreground",
    "border", "input", "ring"
  ];
  var grid = document.getElementById("color-token-grid");
  colorTokens.forEach(function (name) {
    var wrap = document.createElement("div");
    var swatch = document.createElement("div");
    swatch.className = "swatch";
    swatch.style.backgroundColor = "hsl(var(--" + name + "))";
    var label = document.createElement("p");
    label.className = "swatch-label text-sm mt-2";
    label.textContent = "--" + name;
    wrap.appendChild(swatch);
    wrap.appendChild(label);
    grid.appendChild(wrap);
  });

  /* ---------- Toast demo ---------- */
  document.getElementById("toast-trigger").addEventListener("click", function () {
    UIKit.showToast("Успішно збережено.");
  });

  /* ---------- Searchable select (demo) ---------- */
  document.querySelectorAll(".select-search").forEach(function (wrap) {
    var input = wrap.querySelector(".select-search-input");
    var options = Array.prototype.slice.call(wrap.querySelectorAll(".select-search-option"));
    input.addEventListener("input", function () {
      var query = input.value.trim().toLowerCase();
      options.forEach(function (opt) {
        var match = opt.textContent.toLowerCase().indexOf(query) !== -1;
        opt.classList.toggle("is-hidden", !match);
      });
    });
    options.forEach(function (opt) {
      opt.addEventListener("click", function () {
        input.value = opt.textContent.trim();
      });
    });
  });

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
