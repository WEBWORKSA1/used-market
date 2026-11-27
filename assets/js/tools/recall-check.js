/* Recall Checker — searches the auto-refreshed CPSC dataset, then tries the live API */
(function () {
  "use strict";
  var UM = window.UM, form = UM.$("#recall-form"); if (!form) return;
  var out = UM.$("#recall-results"), meta = UM.$("#recall-meta"), DATA = [];
  UM.loadJSON("data/recalls.json").then(function (d) {
    DATA = d.items || [];
    meta.textContent = DATA.length ? (DATA.length + " recent recalls loaded · refreshed " + (d.updated || "recently")) : "Live dataset refreshes daily; searching the official database directly.";
    var q = UM.param("q"); if (q) { form.q.value = q; run(); } else renderList(DATA.slice(0, 8), "Latest recalls");
  }).catch(function () { meta.textContent = "Searching the official database directly."; });
  form.addEventListener("submit", function (e) { e.preventDefault(); run(); });
  function cut(t) { t = String(t || "").replace(/\s+/g, " "); var f = t.split(/(?<=[.!?])\s/)[0]; return f.length > 170 ? f.slice(0, 168).replace(/\s+\S*$/, "") + "…" : f; }
  function norm(s) { return String(s || "").toLowerCase(); }
  function run() {
    var q = norm(form.q.value).trim(); if (q.length < 2) return;
    var words = q.split(/\s+/);
    var hits = DATA.filter(function (r) { var hay = norm(r.title + " " + (r.products || []).join(" ") + " " + (r.hazards || []).join(" ") + " " + (r.brands || []).join(" ")); return words.every(function (w) { return hay.indexOf(w) > -1; }); });
    if (hits.length) { renderList(hits.slice(0, 30), hits.length + " matching recall" + (hits.length === 1 ? "" : "s")); return; }
    out.innerHTML = '<div class="result-empty">Checking the official CPSC database…</div>';
    var url = "https://www.saferproducts.gov/RestWebServices/Recall?format=json&ProductName=" + encodeURIComponent(form.q.value.trim());
    fetch(url).then(function (r) { return r.json(); }).then(function (arr) {
      var items = (arr || []).slice(0, 30).map(function (x) {
        return { title: x.Title, date: (x.RecallDate || "").slice(0, 10), url: x.URL, hazards: (x.Hazards || []).map(function (h) { return h.Name; }), remedy: (x.Remedies || []).map(function (h) { return h.Name; }).join(" "), image: x.Images && x.Images[0] && x.Images[0].URL };
      });
      if (items.length) renderList(items, items.length + " result" + (items.length === 1 ? "" : "s") + " from the CPSC database"); else none();
    }).catch(none);
  }
  function none() {
    var q = encodeURIComponent(form.q.value.trim());
    out.innerHTML = '<div class="flag low"><b>No recall found in our dataset for "' + UM.esc(form.q.value) + '"</b>That is a good sign, but not a guarantee. Search the model number on the official sites below before you buy.</div>' +
      '<ul><li><a target="_blank" rel="noopener" href="https://www.cpsc.gov/Recalls?search_combined_fields=' + q + '">CPSC recalls (US)</a></li><li><a target="_blank" rel="noopener" href="https://www.saferproducts.gov/PublicSearch">SaferProducts.gov reports (US)</a></li><li><a target="_blank" rel="noopener" href="https://recalls-rappels.canada.ca/en">Health Canada recalls</a></li><li><a target="_blank" rel="noopener" href="https://www.gov.uk/product-safety-alerts-reports-recalls">UK product safety alerts</a></li><li><a target="_blank" rel="noopener" href="https://ec.europa.eu/safety-gate-alerts/">EU Safety Gate</a></li><li><a target="_blank" rel="noopener" href="https://www.nhtsa.gov/recalls">NHTSA vehicle &amp; car-seat recalls (US)</a></li></ul>';
  }
  function renderList(items, label) {
    out.innerHTML = '<p class="small muted">' + UM.esc(label) + "</p>" + items.map(function (r) {
      return '<div class="card recall mt1"><div class="small muted">' + UM.esc(r.date || "") + (r.hazards && r.hazards.length ? " · Hazard: " + UM.esc(cut(r.hazards[0])) : "") + "</div><h4 class='mt0'>" + (r.url ? '<a href="' + UM.esc(r.url) + '" target="_blank" rel="noopener">' + UM.esc(r.title) + "</a>" : UM.esc(r.title)) + "</h4>" + (r.remedy ? '<p class="small mb0"><strong>Remedy:</strong> ' + UM.esc(r.remedy) + "</p>" : "") + "</div>";
    }).join("");
  }
})();
