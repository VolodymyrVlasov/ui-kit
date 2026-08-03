/*
  kit.js
  Reusable component behavior for the ui-kit design system, exposed as a
  global UIKit object. No external dependencies, no build step.
  Call UIKit.autoInit() yourself, or just load this script — it wires
  itself up on DOMContentLoaded automatically.
*/

window.UIKit = (function () {
  "use strict";

  /* ==========================================================================
     Clipboard
     Shared by gallery.js (demo "Copy HTML"/"Copy class" buttons) and
     builder.js (generator "Copy CSS" button) — only the copy mechanism
     lives here; callers own their own visual feedback (button text, toast).
     ========================================================================== */

  function copyText(text) {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      return navigator.clipboard.writeText(text);
    }
    return new Promise(function (resolve) {
      var textarea = document.createElement("textarea");
      textarea.value = text;
      textarea.style.position = "fixed";
      textarea.style.opacity = "0";
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand("copy");
      document.body.removeChild(textarea);
      resolve();
    });
  }

  /* ==========================================================================
     Tabs
     ========================================================================== */

  function initTabs(root) {
    var scope = root || document;
    scope.querySelectorAll(".tabs").forEach(function (tabsEl) {
      var triggers = Array.prototype.slice.call(tabsEl.querySelectorAll(":scope > .tabs-list > .tab-trigger"));
      var contents = Array.prototype.slice.call(tabsEl.querySelectorAll(":scope > .tab-content"));

      triggers.forEach(function (trigger, index) {
        trigger.addEventListener("click", function () {
          triggers.forEach(function (t) { t.classList.remove("is-active"); t.setAttribute("aria-selected", "false"); });
          contents.forEach(function (c) { c.classList.remove("is-active"); });
          trigger.classList.add("is-active");
          trigger.setAttribute("aria-selected", "true");
          if (contents[index]) contents[index].classList.add("is-active");
        });
      });
    });
  }

  /* ==========================================================================
     Toast
     ========================================================================== */

  var toastTimer = null;
  var TOAST_POSITIONS = [
    "top-left", "top-center", "top-right",
    "center",
    "bottom-left", "bottom-center", "bottom-right"
  ];

  function showToast(message, type, position) {
    var toastEl = document.getElementById("toast");
    if (!toastEl) return;
    toastEl.textContent = message;
    toastEl.classList.add("is-visible", "toast-container");
    if (type) {
      toastEl.setAttribute("data-toast-type", type);
    } else {
      toastEl.removeAttribute("data-toast-type");
    }
    var pos = TOAST_POSITIONS.indexOf(position) !== -1 ? position : "bottom-right";
    TOAST_POSITIONS.forEach(function (p) {
      toastEl.classList.remove("toast-container--" + p);
    });
    toastEl.classList.add("toast-container--" + pos);
    clearTimeout(toastTimer);
    toastTimer = setTimeout(function () {
      toastEl.classList.remove("is-visible");
    }, 2500);
  }

  /* ==========================================================================
     Dropzone (file upload UI/state only — no network call)
     ========================================================================== */

  function formatFileSize(bytes) {
    if (bytes < 1024) return bytes + " Б";
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " КБ";
    return (bytes / (1024 * 1024)).toFixed(1) + " МБ";
  }

  function initDropzone(el) {
    var fileInput = el.querySelector('input[type="file"]');
    var listEl = el.parentElement ? el.parentElement.querySelector(".dropzone-list") : null;
    var currentFiles = [];

    function renderFiles() {
      if (!listEl) return;
      listEl.innerHTML = "";
      currentFiles.forEach(function (file, index) {
        var item = document.createElement("li");
        item.className = "dropzone-list-item";

        var name = document.createElement("span");
        name.className = "dropzone-list-name";
        name.textContent = file.name;

        var size = document.createElement("span");
        size.className = "dropzone-list-size";
        size.textContent = formatFileSize(file.size);

        var removeBtn = document.createElement("button");
        removeBtn.type = "button";
        removeBtn.className = "dropzone-list-remove";
        removeBtn.setAttribute("aria-label", "Видалити файл");
        removeBtn.textContent = "×";
        removeBtn.addEventListener("click", function () {
          currentFiles.splice(index, 1);
          renderFiles();
        });

        item.appendChild(name);
        item.appendChild(size);
        item.appendChild(removeBtn);
        listEl.appendChild(item);
      });
    }

    function setFiles(fileListLike) {
      currentFiles = Array.prototype.slice.call(fileListLike);
      renderFiles();
      el.dispatchEvent(new CustomEvent("uikit:files-selected", { detail: { files: currentFiles } }));
    }

    ["dragenter", "dragover"].forEach(function (evtName) {
      el.addEventListener(evtName, function (e) {
        e.preventDefault();
        el.classList.add("dropzone--active");
      });
    });

    ["dragleave", "drop"].forEach(function (evtName) {
      el.addEventListener(evtName, function (e) {
        e.preventDefault();
        el.classList.remove("dropzone--active");
      });
    });

    el.addEventListener("drop", function (e) {
      if (e.dataTransfer && e.dataTransfer.files && e.dataTransfer.files.length) {
        setFiles(e.dataTransfer.files);
      }
    });

    if (fileInput) {
      el.addEventListener("click", function (e) {
        if (e.target !== fileInput) {
          fileInput.click();
        }
      });
      fileInput.addEventListener("change", function () {
        if (fileInput.files && fileInput.files.length) {
          setFiles(fileInput.files);
        }
      });
    }
  }

  /* ==========================================================================
     Loaders
     ========================================================================== */

  function setLoaderStep(el, text) {
    if (!el) return;
    var textEl = el.querySelector(".loader-progress-text");
    if (textEl) textEl.textContent = text;
  }

  /* ==========================================================================
     Search input
     ========================================================================== */

  function initSearchInput(wrap) {
    var input = wrap.querySelector(".input-search-field");
    var clearBtn = wrap.querySelector(".input-search-clear");
    if (!input || !clearBtn) return;

    function sync() {
      wrap.classList.toggle("has-value", input.value.length > 0);
    }

    input.addEventListener("input", sync);
    clearBtn.addEventListener("click", function () {
      input.value = "";
      sync();
      input.focus();
    });
    sync();
  }

  /* ==========================================================================
     Searchable select / combobox — filters .select-search-option rows by
     substring match against the typed query, and fills the input on click.
     ========================================================================== */

  function initSelectSearch(wrap) {
    var input = wrap.querySelector(".select-search-input");
    if (!input) return;
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
  }

  /* ==========================================================================
     Number stepper
     ========================================================================== */

  function initNumberStepper(wrap) {
    var input = wrap.querySelector(".input-number-field");
    if (!input) return;
    var buttons = Array.prototype.slice.call(wrap.querySelectorAll(".input-number-btn"));

    buttons.forEach(function (btn) {
      btn.addEventListener("click", function () {
        var step = parseFloat(input.step) || 1;
        var min = input.min !== "" ? parseFloat(input.min) : -Infinity;
        var max = input.max !== "" ? parseFloat(input.max) : Infinity;
        var dir = parseFloat(btn.getAttribute("data-step")) || 1;
        var current = parseFloat(input.value) || 0;
        var next = current + dir * step;
        if (next < min) next = min;
        if (next > max) next = max;
        input.value = next;
        input.dispatchEvent(new Event("input", { bubbles: true }));
      });
    });
  }

  /* ==========================================================================
     Color input
     ========================================================================== */

  function initColorInput(wrap) {
    var colorInput = wrap.querySelector('input[type="color"]');
    var valueEl = wrap.querySelector(".input-color-value");
    if (!colorInput || !valueEl) return;

    function sync() {
      valueEl.textContent = colorInput.value.toUpperCase();
    }

    colorInput.addEventListener("input", sync);
    sync();

    var swatchGroup = wrap.parentElement ? wrap.parentElement.querySelector(".color-swatches") : null;
    if (swatchGroup) {
      Array.prototype.slice.call(swatchGroup.querySelectorAll(".color-swatch")).forEach(function (swatchBtn) {
        swatchBtn.addEventListener("click", function () {
          var color = swatchBtn.getAttribute("data-color");
          if (!color) return;
          colorInput.value = color;
          sync();
        });
      });
    }
  }

  /* ==========================================================================
     Auto-resize textarea
     ========================================================================== */

  function initAutoResizeTextarea(el) {
    function resize() {
      el.style.height = "auto";
      el.style.height = el.scrollHeight + "px";
    }
    el.addEventListener("input", resize);
    resize();
  }

  /* ==========================================================================
     Range input — keeps the value readout in sync
     ========================================================================== */

  function initRangeInput(wrap) {
    var input = wrap.querySelector(".input-range-field");
    var valueEl = wrap.querySelector(".input-range-value");
    if (!input) return;
    function sync() {
      if (valueEl) valueEl.textContent = input.value;
    }
    input.addEventListener("input", sync);
    sync();
  }

  /* ==========================================================================
     Accordion — built on native <details>/<summary>; this only adds the
     optional "close the others when one opens" behavior.
     ========================================================================== */

  function initAccordion(el, options) {
    var singleOpen = !!(options && options.singleOpen);
    if (!singleOpen) return;
    var items = Array.prototype.slice.call(el.querySelectorAll(":scope > .accordion-item"));
    items.forEach(function (item) {
      item.addEventListener("toggle", function () {
        if (!item.open) return;
        items.forEach(function (other) {
          if (other !== item) other.open = false;
        });
      });
    });
  }

  /* ==========================================================================
     Plain file-select button — same 'uikit:files-selected' event pattern as
     initDropzone, for when the full drag-and-drop zone isn't needed.
     ========================================================================== */

  function initFileButton(el) {
    var fileInput = document.createElement("input");
    fileInput.type = "file";
    fileInput.style.display = "none";
    if (el.hasAttribute("data-multiple")) fileInput.multiple = true;
    if (el.hasAttribute("data-accept")) fileInput.accept = el.getAttribute("data-accept");
    // Inserted as a sibling, not a child — <input> nested inside <button> is
    // invalid HTML (button is already interactive content).
    if (el.parentNode) {
      el.parentNode.insertBefore(fileInput, el.nextSibling);
    } else {
      document.body.appendChild(fileInput);
    }

    el.addEventListener("click", function () {
      fileInput.click();
    });

    fileInput.addEventListener("change", function () {
      if (fileInput.files && fileInput.files.length) {
        var files = Array.prototype.slice.call(fileInput.files);
        el.dispatchEvent(new CustomEvent("uikit:files-selected", { detail: { files: files } }));
      }
    });
  }

  /* ==========================================================================
     Auto-init
     ========================================================================== */

  function autoInit() {
    initTabs();
    document.querySelectorAll("[data-dropzone]").forEach(initDropzone);
    document.querySelectorAll(".input-search").forEach(initSearchInput);
    document.querySelectorAll(".select-search").forEach(initSelectSearch);
    document.querySelectorAll(".input-number").forEach(initNumberStepper);
    document.querySelectorAll(".input-color").forEach(initColorInput);
    document.querySelectorAll(".textarea-auto").forEach(initAutoResizeTextarea);
    document.querySelectorAll(".input-range").forEach(initRangeInput);
    document.querySelectorAll("[data-accordion]").forEach(function (el) {
      initAccordion(el, { singleOpen: el.hasAttribute("data-single-open") });
    });
    document.querySelectorAll("[data-file-button]").forEach(initFileButton);
  }

  document.addEventListener("DOMContentLoaded", autoInit);

  return {
    copyText: copyText,
    initTabs: initTabs,
    showToast: showToast,
    initDropzone: initDropzone,
    setLoaderStep: setLoaderStep,
    initSearchInput: initSearchInput,
    initSelectSearch: initSelectSearch,
    initNumberStepper: initNumberStepper,
    initColorInput: initColorInput,
    initAutoResizeTextarea: initAutoResizeTextarea,
    initRangeInput: initRangeInput,
    initAccordion: initAccordion,
    initFileButton: initFileButton,
    autoInit: autoInit
  };
})();
