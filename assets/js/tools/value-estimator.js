/* Used Value Estimator — transparent depreciation model */
(function () {
  "use strict";
  var UM = window.UM, form = UM.$("#value-form"); if (!form) return;
  var out = UM.$("#value-results"), CATS = [];
  var COND = { nwt: [1.0, "New / sealed"], likenew: [0.9, "Like new"], excellent: [0.8, "Excellent"], good: [0.68, "Good"], fair: [0.5, "Fair"], parts: [0.2, "For parts / not working"] };
  var BRAND = { budget: 0.85, main: 1, premium: 1.12, iconic: 1.25 };
  var DEMAND = { low: 0.88, normal: 1, high: 1.12 };
  UM.fillCategorySelect(form.category).then(function (d) { CATS = d.items; if (UM.param("category")) run(); });
  form.addEventListener("submit", function (e) { e.preventDefault(); run(); });
  form.addEventListener("change", function () { if (out.getAttribute("data-ran")) run(); });
  function run() {
    var c = CATS.filter(function (x) { return x.id === form.category.value; })[0]; if (!c) return;
    var newPrice = parseFloat(form.new_price.value) || 0, age = Math.max(0, parseFloat(form.age.value) || 0);
    if (!newPrice) { form.new_price.setAttribute("aria-invalid", "true"); form.new_price.focus(); return; }
    form.new_price.setAttribute("aria-invalid", "false");
    out.setAttribute("data-ran", "1");
    var y1 = c.dep.y1 / 100, yr = c.dep.yr / 100, floor = c.dep.floor / 100;
    var pct = age <= 1 ? 1 - y1 * age : (1 - y1) * Math.pow(1 - yr, age - 1);
    pct = Math.max(floor, pct);
    var cond = COND[form.condition.value] || COND.good;
    var extras = 0; UM.$$('input[name="extras"]:checked', form).forEach(function (x) { extras += parseFloat(x.getAttribute("data-w")) || 0; });
    var mid = newPrice * pct * cond[0] * (BRAND[form.brand.value] || 1) * (DEMAND[form.demand.value] || 1) * (1 + extras);
    var lo = mid * 0.88, hi = mid * 1.12, list = Math.ceil(mid * 1.08), quick = Math.floor(lo * 0.92);
    var retained = Math.round((mid / newPrice) * 100);
    out.innerHTML =
      '<p class="small muted mb0">Estimated fair market range</p><div class="result-big">' + UM.money(lo) + " – " + UM.money(hi) + "</div>" +
      '<div class="meter" aria-hidden="true"><i style="left:' + Math.min(98, Math.max(2, retained)) + '%"></i></div><p class="small muted">Keeps about <strong>' + retained + "%</strong> of its new price after " + age + " year" + (age === 1 ? "" : "s") + " in " + cond[1].toLowerCase() + " condition.</p>" +
      '<div class="grid g3 mt1"><div class="card"><div class="small muted">List at</div><strong style="font-size:1.4rem">' + UM.money(list) + '</strong><div class="small muted">leaves room to negotiate</div></div><div class="card"><div class="small muted">Fair middle</div><strong style="font-size:1.4rem">' + UM.money(mid) + '</strong><div class="small muted">typical agreed price</div></div><div class="card"><div class="small muted">Quick sale</div><strong style="font-size:1.4rem">' + UM.money(quick) + '</strong><div class="small muted">sells in days</div></div></div>' +
      '<div class="callout tip"><h4>Sanity-check with sold prices</h4><p class="mb0">This model uses typical depreciation for ' + UM.esc(c.name.toLowerCase()) + ' (about ' + c.dep.y1 + '% in year one, then ~' + c.dep.yr + '% a year). Real prices move with demand, colour, size and season — compare 3–5 <em>sold</em> listings of the same model before you list.' + (c.id === "collectibles" || c.id === "luxury" || c.id === "music" ? " Iconic pieces in this category can hold or even gain value." : "") + "</p></div>" +
      '<div class="chips mt1"><a class="btn btn-sm" href="' + UM.root + "tools/fee-calculator/?value=" + Math.round(mid) + '">See payout after fees</a><a class="btn btn-sm btn-ghost" href="' + UM.root + "tools/where-to-sell/?category=" + c.id + "&value=" + Math.round(mid) + '">Where to sell it</a><a class="btn btn-sm btn-coral" href="' + UM.leadLink({ category: c.id, value: Math.round(mid), condition: form.condition.value, source: "value-estimator" }) + '">Get real offers</a></div>';
  }
})();
