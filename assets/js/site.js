/* Used.Market — core site script (no dependencies) */
(function () {
  "use strict";
  var C = window.UM_CONFIG || {};
  var UM = (window.UM = window.UM || {});
  var doc = document;

  /* ---------- helpers ---------- */
  UM.$ = function (s, r) { return (r || doc).querySelector(s); };
  UM.$$ = function (s, r) { return Array.prototype.slice.call((r || doc).querySelectorAll(s)); };
  UM.store = {
    get: function (k, d) { try { var v = localStorage.getItem("um_" + k); return v === null ? d : JSON.parse(v); } catch (e) { return d; } },
    set: function (k, v) { try { localStorage.setItem("um_" + k, JSON.stringify(v)); } catch (e) {} }
  };
  UM.money = function (n, cur) {
    if (!isFinite(n)) return "—";
    try { return new Intl.NumberFormat(undefined, { style: "currency", currency: cur || "USD", maximumFractionDigits: n >= 100 ? 0 : 2 }).format(n); }
    catch (e) { return "$" + Math.round(n); }
  };
  UM.esc = function (s) { return String(s == null ? "" : s).replace(/[&<>"']/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]; }); };
  UM.param = function (k) { try { return new URLSearchParams(location.search).get(k); } catch (e) { return null; } };
  UM.root = (doc.documentElement.getAttribute("data-root") || "");
  UM.toast = function (msg) {
    var t = UM.$(".toast");
    if (!t) { t = doc.createElement("div"); t.className = "toast"; t.setAttribute("role", "status"); doc.body.appendChild(t); }
    t.textContent = msg; t.classList.add("show");
    clearTimeout(t._h); t._h = setTimeout(function () { t.classList.remove("show"); }, 2600);
  };
  UM.copy = function (text) {
    if (navigator.clipboard && navigator.clipboard.writeText) { navigator.clipboard.writeText(text).then(function () { UM.toast("Copied to clipboard"); }, fallback); }
    else fallback();
    function fallback() { var ta = doc.createElement("textarea"); ta.value = text; doc.body.appendChild(ta); ta.select(); try { doc.execCommand("copy"); UM.toast("Copied to clipboard"); } catch (e) {} doc.body.removeChild(ta); }
  };
  UM.loadJSON = function (path) {
    return fetch(UM.root + path, { cache: "no-cache" }).then(function (r) { if (!r.ok) throw new Error(r.status); return r.json(); });
  };
  UM.leadLink = function (o) {
    var p = new URLSearchParams();
    Object.keys(o || {}).forEach(function (k) { if (o[k] !== undefined && o[k] !== "") p.set(k, o[k]); });
    return UM.root + "sell/?" + p.toString() + "#get-offers";
  };

  /* ---------- theme ---------- */
  var themeBtn = UM.$("[data-theme-toggle]");
  function applyTheme(t) { doc.documentElement.setAttribute("data-theme", t); if (themeBtn) { themeBtn.setAttribute("aria-label", t === "dark" ? "Switch to light theme" : "Switch to dark theme"); themeBtn.textContent = t === "dark" ? "☀" : "☾"; } }
  applyTheme(UM.store.get("theme", (window.matchMedia && matchMedia("(prefers-color-scheme: dark)").matches) ? "dark" : "light"));
  if (themeBtn) themeBtn.addEventListener("click", function () { var t = doc.documentElement.getAttribute("data-theme") === "dark" ? "light" : "dark"; UM.store.set("theme", t); applyTheme(t); });

  /* ---------- nav ---------- */
  var menuBtn = UM.$("[data-menu]");
  function closeNav() { doc.body.classList.remove("nav-open"); if (menuBtn) menuBtn.setAttribute("aria-expanded", "false"); }
  if (menuBtn) menuBtn.addEventListener("click", function () { var o = doc.body.classList.toggle("nav-open"); menuBtn.setAttribute("aria-expanded", o ? "true" : "false"); });
  var scrim = UM.$(".nav-scrim"); if (scrim) scrim.addEventListener("click", closeNav);
  UM.$$("[data-menu-close]").forEach(function (b) { b.addEventListener("click", closeNav); });
  UM.$$(".dd>button").forEach(function (b) {
    b.addEventListener("click", function (e) {
      e.stopPropagation();
      var dd = b.parentNode, open = !dd.classList.contains("open");
      UM.$$(".dd.open").forEach(function (d) { d.classList.remove("open"); d.firstElementChild.setAttribute("aria-expanded", "false"); });
      if (open) { dd.classList.add("open"); b.setAttribute("aria-expanded", "true"); }
    });
  });
  doc.addEventListener("click", function (e) { if (!e.target.closest(".dd")) UM.$$(".dd.open").forEach(function (d) { d.classList.remove("open"); d.firstElementChild.setAttribute("aria-expanded", "false"); }); });
  doc.addEventListener("keydown", function (e) { if (e.key === "Escape") { UM.$$(".dd.open").forEach(function (d) { d.classList.remove("open"); }); closeNav(); UM.$$(".modal.show").forEach(function (m) { m.classList.remove("show"); }); } });

  /* ---------- consent ---------- */
  var consent = UM.store.get("consent", null);
  var ck = UM.$(".cookie");
  if (consent === "essential") { (window.adsbygoogle = window.adsbygoogle || []).requestNonPersonalizedAds = 1; }
  if (ck && !consent) ck.classList.add("show");
  UM.$$("[data-consent]").forEach(function (b) {
    b.addEventListener("click", function () {
      var v = b.getAttribute("data-consent"); UM.store.set("consent", v);
      if (v === "essential") (window.adsbygoogle = window.adsbygoogle || []).requestNonPersonalizedAds = 1;
      if (ck) ck.classList.remove("show");
    });
  });
  UM.$$("[data-cookie-settings]").forEach(function (b) { b.addEventListener("click", function (e) { e.preventDefault(); if (ck) ck.classList.add("show"); }); });

  /* ---------- ad slots (only render fixed units when slot IDs are configured) ---------- */
  UM.$$(".ad-slot").forEach(function (el) {
    var kind = el.getAttribute("data-ad") || "incontent";
    var slot = C.adSlots && C.adSlots[kind];
    if (!slot) return;
    el.innerHTML = '<ins class="adsbygoogle" style="display:block" data-ad-client="' + C.adsenseClient + '" data-ad-slot="' + slot + '" data-ad-format="auto" data-full-width-responsive="true"></ins>';
    el.classList.add("filled");
    try { (window.adsbygoogle = window.adsbygoogle || []).push({}); } catch (e) {}
  });

  /* ---------- lazy YouTube (privacy-enhanced, click to load) ---------- */
  UM.$$(".video[data-yt]").forEach(function (v) {
    var id = v.getAttribute("data-yt");
    if (!v.querySelector("img")) {
      v.innerHTML = '<img loading="lazy" alt="" src="https://i.ytimg.com/vi/' + id + '/hqdefault.jpg"><div class="play"><span></span></div>';
    }
    function load() { v.innerHTML = '<iframe src="https://www.youtube-nocookie.com/embed/' + id + '?autoplay=1&rel=0" title="' + UM.esc(v.getAttribute("data-title") || "Video") + '" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe>'; }
    v.setAttribute("tabindex", "0"); v.setAttribute("role", "button");
    v.addEventListener("click", load);
    v.addEventListener("keydown", function (e) { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); load(); } });
  });

  /* ---------- prefill forms from URL ---------- */
  try {
    var sp = new URLSearchParams(location.search);
    sp.forEach(function (val, key) {
      UM.$$('form [name="' + key.replace(/"/g, "") + '"]').forEach(function (f) {
        if (f.type === "radio" || f.type === "checkbox") { if (f.value === val) f.checked = true; }
        else if (!f.value) f.value = val;
      });
    });
  } catch (e) {}

  /* ---------- forms (FormSubmit, inbox assembled at runtime) ---------- */
  function setStatus(form, ok, msg) {
    var s = form.querySelector(".form-status");
    if (!s) { s = doc.createElement("div"); s.className = "form-status"; s.setAttribute("role", "status"); form.appendChild(s); }
    s.className = "form-status show " + (ok ? "ok" : "err"); s.textContent = msg;
  }
  function validate(scope) {
    var ok = true, first = null;
    UM.$$("input,select,textarea", scope).forEach(function (f) {
      if (f.closest(".hp")) return;
      if (f.offsetParent === null && f.type !== "hidden" && !f.closest(".step.active")) return;
      var bad = !f.checkValidity();
      if (f.type === "radio") {
        var group = UM.$$('input[name="' + f.name + '"]', scope);
        bad = f.required && !group.some(function (g) { return g.checked; });
      }
      f.setAttribute("aria-invalid", bad ? "true" : "false");
      if (bad) { ok = false; if (!first) first = f; }
    });
    if (first) { first.focus({ preventScroll: false }); }
    return ok;
  }
  UM.validate = validate;
  UM.$$("form.js-form").forEach(function (form) {
    form.setAttribute("novalidate", "novalidate");
    form.addEventListener("submit", function (e) {
      e.preventDefault();
      if (!validate(form)) { setStatus(form, false, "Please complete the highlighted fields."); return; }
      var hp = form.querySelector('[name="_honey"]'); if (hp && hp.value) return;
      var data = {};
      new FormData(form).forEach(function (v, k) { if (k === "_honey") return; data[k] = data[k] ? data[k] + ", " + v : v; });
      data._subject = form.getAttribute("data-subject") || ("Used.Market — " + (form.getAttribute("data-kind") || "form"));
      data._template = "table"; data._captcha = "false";
      data["Form type"] = form.getAttribute("data-kind") || "general";
      data["Submitted from"] = location.href.split("?")[0];
      data["Submitted at"] = new Date().toISOString();
      var btn = form.querySelector('[type="submit"]'); if (btn) { btn.disabled = true; btn._t = btn.textContent; btn.textContent = "Sending…"; }
      fetch(C.formEndpoint(true), { method: "POST", headers: { "Content-Type": "application/json", Accept: "application/json" }, body: JSON.stringify(data) })
        .then(function (r) { return r.json().catch(function () { return {}; }); })
        .then(function (j) {
          if (j && (j.success === "true" || j.success === true)) {
            setStatus(form, true, form.getAttribute("data-success") || "Thank you — we received your message and will reply soon.");
            form.reset();
            UM.$$(".step", form).forEach(function (s, i) { s.classList.toggle("active", i === 0); });
            var pr = form.querySelector(".progress i"); if (pr) pr.style.width = "25%";
            if (window.gtag) try { gtag("event", "generate_lead", { form: data["Form type"] }); } catch (x) {}
          } else {
            setStatus(form, true, "Thanks! Your submission is queued. If this is the first message to this inbox it will be delivered once the address is confirmed.");
          }
        })
        .catch(function () {
          setStatus(form, false, "We couldn't send that just now — please check your connection and try again in a moment.");
        })
        .finally(function () { if (btn) { btn.disabled = false; btn.textContent = btn._t; } });
    });
  });

  /* ---------- stepper ---------- */
  UM.$$("[data-stepper]").forEach(function (st) {
    var steps = UM.$$(".step", st), bar = st.querySelector(".progress i"), lbl = st.querySelector("[data-step-label]");
    function go(i) {
      steps.forEach(function (s, j) { s.classList.toggle("active", j === i); });
      if (bar) bar.style.width = Math.round(((i + 1) / steps.length) * 100) + "%";
      if (lbl) lbl.textContent = "Step " + (i + 1) + " of " + steps.length;
      var f = steps[i].querySelector("input,select,textarea"); if (f && i > 0) f.focus({ preventScroll: true });
      st.scrollIntoView({ behavior: "smooth", block: "start" });
    }
    st.addEventListener("click", function (e) {
      var n = e.target.closest("[data-next]"), p = e.target.closest("[data-prev]");
      var cur = steps.findIndex(function (s) { return s.classList.contains("active"); });
      if (n) { e.preventDefault(); if (validate(steps[cur])) go(Math.min(cur + 1, steps.length - 1)); }
      if (p) { e.preventDefault(); go(Math.max(cur - 1, 0)); }
    });
  });

  /* ---------- donation buttons ---------- */
  UM.$$("[data-donate]").forEach(function (b) {
    b.addEventListener("click", function (e) {
      e.preventDefault();
      var form = b.closest("form") || doc;
      var amt = b.getAttribute("data-amount");
      if (!amt) { var sel = form.querySelector('input[name="amount"]:checked'); var custom = form.querySelector('input[name="custom_amount"]'); amt = (custom && custom.value) || (sel && sel.value) || ""; }
      var rec = b.getAttribute("data-donate") === "monthly";
      window.open(C.donateUrl(amt, rec), "_blank", "noopener");
    });
  });

  /* ---------- modal + exit intent (once per week, desktop, opt-in pages) ---------- */
  UM.$$("[data-close]").forEach(function (b) { b.addEventListener("click", function () { b.closest(".modal").classList.remove("show"); }); });
  UM.$$(".modal").forEach(function (m) { m.addEventListener("click", function (e) { if (e.target === m) m.classList.remove("show"); }); });
  var exitModal = UM.$("#exit-modal");
  if (exitModal && window.matchMedia && matchMedia("(pointer:fine)").matches) {
    var last = UM.store.get("exit_seen", 0);
    if (Date.now() - last > 7 * 864e5) {
      doc.addEventListener("mouseout", function h(e) {
        if (!e.relatedTarget && e.clientY < 8) { exitModal.classList.add("show"); UM.store.set("exit_seen", Date.now()); doc.removeEventListener("mouseout", h); }
      });
    }
  }

  /* ---------- home intent tabs ---------- */
  UM.$$("[data-tabs]").forEach(function (wrap) {
    var tabs = UM.$$('[role="tab"]', wrap);
    tabs.forEach(function (t) {
      t.addEventListener("click", function () {
        tabs.forEach(function (x) { x.setAttribute("aria-selected", x === t ? "true" : "false"); var p = doc.getElementById(x.getAttribute("aria-controls")); if (p) p.classList.toggle("active", x === t); });
      });
    });
  });

  /* ---------- recall ticker (home) ---------- */
  var tick = UM.$("[data-recall-ticker]");
  if (tick) {
    UM.loadJSON("data/recalls.json").then(function (d) {
      var items = (d.items || []).slice(0, 12);
      if (!items.length) return;
      tick.innerHTML = "<span>" + items.map(function (r) { return "⚠ " + UM.esc(r.title) + " (" + UM.esc(r.date) + ")"; }).join(" &nbsp;•&nbsp; ") + "</span>";
    }).catch(function () {});
  }

  /* ---------- year ---------- */
  UM.$$("[data-year]").forEach(function (y) { y.textContent = new Date().getFullYear(); });
})();
