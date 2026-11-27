/* Site search over a generated index */
(function () {
  "use strict";
  var UM = window.UM, form = UM.$("#search-form"); if (!form) return;
  var out = UM.$("#search-results"), IDX = [];
  UM.loadJSON("data/search-index.json").then(function (d) { IDX = d; var q = UM.param("q"); if (q) { form.q.value = q; run(); } });
  form.addEventListener("submit", function (e) { e.preventDefault(); run(); history.replaceState(null, "", "?q=" + encodeURIComponent(form.q.value)); });
  form.q.addEventListener("input", run);
  function run() {
    var q = form.q.value.toLowerCase().trim(); if (q.length < 2) { out.innerHTML = ""; return; }
    var words = q.split(/\s+/);
    var res = IDX.map(function (p) {
      var t = p.t.toLowerCase(), d = (p.d + " " + (p.k || "")).toLowerCase(), s = 0;
      words.forEach(function (w) { if (t.indexOf(w) > -1) s += 3; if (d.indexOf(w) > -1) s += 1; });
      return { p: p, s: s };
    }).filter(function (r) { return r.s > 0; }).sort(function (a, b) { return b.s - a.s; }).slice(0, 25);
    out.innerHTML = res.length ? '<p class="small muted">' + res.length + " result" + (res.length > 1 ? "s" : "") + "</p>" + res.map(function (r) { return '<a class="card" href="' + UM.root + r.p.u + '"><span class="small muted">' + UM.esc(r.p.s || "") + "</span><h3 style='font-size:1.1rem;margin:.2em 0'>" + UM.esc(r.p.t) + '</h3><p class="small mb0">' + UM.esc(r.p.d) + "</p></a>"; }).join("") : '<div class="result-empty">No results. Try "fees", "scam", "phone" or "furniture".</div>';
  }
})();
