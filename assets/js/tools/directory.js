/* Marketplace Directory — filter, sort, compare */
(function () {
  "use strict";
  var UM = window.UM, app = UM.$("#dir-app"); if (!app) return;
  var grid = UM.$("#dir-grid"), count = UM.$("#dir-count"), bar = UM.$(".cmp-bar"), P = [], CATS = [], picked = [];
  var f = { q: UM.$("#dir-q"), cat: UM.$("#dir-cat"), region: UM.$("#dir-region"), type: UM.$("#dir-type"), mode: UM.$("#dir-mode"), sort: UM.$("#dir-sort") };
  Promise.all([UM.fillCategorySelect(f.cat, { placeholder: "All categories" }), UM.get("platforms")]).then(function (r) {
    CATS = r[0].items; P = r[1].items.map(function (p) { p.trust = UM.trustScore(p); return p; });
    var types = {}; P.forEach(function (p) { types[p.type] = 1; });
    f.type.innerHTML = '<option value="">All types</option>' + Object.keys(types).sort().map(function (t) { return "<option>" + UM.esc(t) + "</option>"; }).join("");
    if (UM.param("q")) f.q.value = UM.param("q");
    draw();
  });
  Object.keys(f).forEach(function (k) { f[k].addEventListener(k === "q" ? "input" : "change", draw); });
  function draw() {
    var q = f.q.value.toLowerCase().trim();
    var list = P.filter(function (p) {
      if (q && (p.name + " " + p.bestFor + " " + p.type + " " + p.cats.join(" ")).toLowerCase().indexOf(q) === -1) return false;
      if (f.cat.value && p.cats.indexOf(f.cat.value) === -1) return false;
      if (f.region.value && p.regions.indexOf(f.region.value) === -1 && p.regions.indexOf("Global") === -1) return false;
      if (f.type.value && p.type !== f.type.value) return false;
      if (f.mode.value === "local" && !p.local) return false;
      if (f.mode.value === "ship" && !p.ship) return false;
      return true;
    });
    var s = f.sort.value;
    list.sort(function (a, b) { return s === "name" ? a.name.localeCompare(b.name) : s === "speed" ? b.speed - a.speed : s === "price" ? b.price - a.price : s === "effort" ? b.effort - a.effort : b.trust - a.trust; });
    count.textContent = list.length + " of " + P.length + " platforms";
    grid.innerHTML = list.map(function (p) {
      var on = picked.indexOf(p.id) > -1;
      return '<article class="card plat"><div class="top"><div style="display:flex;gap:12px;align-items:center"><div class="mono" style="background:hsl(' + UM.hue(p.name) + ',45%,34%)">' + UM.esc(UM.monogram(p.name)) + "</div><div><h3 style=\"font-size:1.08rem;margin:0\">" + UM.esc(p.name) + '</h3><div class="small muted">' + UM.esc(p.type) + "</div></div></div><span class=\"score " + UM.scoreClass(p.trust) + '" title="Trust score: identity checks, on-platform payment, protection, records">' + p.trust + "</span></div>" +
        '<p class="small mb0">' + UM.esc(p.bestFor) + '</p><div class="fee">💸 ' + UM.esc(p.feeText) + '</div><div class="fee">🛡 ' + UM.esc(p.protection) + '</div><div class="meta">' + (p.local ? '<span class="chip">Local</span>' : "") + (p.ship ? '<span class="chip">Ships</span>' : "") + '<span class="chip">' + UM.esc(p.regions.slice(0, 4).join(" · ")) + "</span></div>" +
        '<div class="actions"><a class="btn btn-sm" href="' + p.url + '" target="_blank" rel="noopener nofollow">Visit</a><button class="btn btn-sm btn-ghost" type="button" data-cmp="' + p.id + '" aria-pressed="' + on + '">' + (on ? "✓ Comparing" : "+ Compare") + "</button></div></article>";
    }).join("") || '<div class="result-empty">No platforms match. Clear a filter.</div>';
    UM.$$("[data-cmp]", grid).forEach(function (b) { b.addEventListener("click", function () { toggle(b.getAttribute("data-cmp")); }); });
    syncBar();
  }
  function toggle(id) {
    var i = picked.indexOf(id);
    if (i > -1) picked.splice(i, 1); else { if (picked.length >= 3) { UM.toast("Compare up to 3 platforms"); return; } picked.push(id); }
    draw();
  }
  function syncBar() {
    bar.classList.toggle("show", picked.length > 0);
    UM.$("#cmp-n").textContent = picked.length + " selected";
  }
  UM.$("#cmp-clear").addEventListener("click", function () { picked = []; draw(); });
  UM.$("#cmp-go").addEventListener("click", function () {
    var sel = P.filter(function (p) { return picked.indexOf(p.id) > -1; });
    var rows = [["Type", "type"], ["Trust score", "trust"], ["Fees", "feeText"], ["Protection", "protection"], ["Local pickup", "local"], ["Ships", "ship"], ["Regions", "regions"], ["Best for", "bestFor"], ["Speed (1–5)", "speed"], ["Price realised (1–5)", "price"], ["Low effort (1–5)", "effort"]];
    UM.$("#cmp-body").innerHTML = '<div class="table-wrap"><table><thead><tr><th></th>' + sel.map(function (p) { return "<th>" + UM.esc(p.name) + "</th>"; }).join("") + "</tr></thead><tbody>" +
      rows.map(function (r) { return "<tr><th>" + r[0] + "</th>" + sel.map(function (p) { var v = p[r[1]]; if (typeof v === "boolean") v = v ? "Yes" : "No"; if (Array.isArray(v)) v = v.join(", "); return "<td>" + UM.esc(v) + "</td>"; }).join("") + "</tr>"; }).join("") + "</tbody></table></div>";
    UM.$("#cmp-modal").classList.add("show");
  });
})();
