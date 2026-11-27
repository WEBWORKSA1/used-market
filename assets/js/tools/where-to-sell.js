/* Where-to-Sell Router */
(function () {
  "use strict";
  var UM = window.UM, form = UM.$("#router-form"); if (!form) return;
  var out = UM.$("#router-results"), res = UM.$("#router-resources");
  var P = [], CATS = [];
  var NON_SELL = ["Price guide", "Repair resource", "Delivery service", "Second-hand search"];
  var INSTANT = { "Instant buyback": [0.5, 0.7], "Refurbished + trade-in": [0.5, 0.7], "Instant car offer": [0.8, 0.92] };
  var CONSIGN = { "Consignment": [0.2, 0.5], "Luxury consignment": [0.45, 0.75], "Managed furniture marketplace": [0.5, 0.7], "Curated marketplace": [0.7, 0.8], "Vetted dealer marketplace": [0.6, 0.8] };
  Promise.all([UM.fillCategorySelect(form.category), UM.get("platforms")]).then(function (r) {
    CATS = r[0].items; P = r[1].items;
    var v = UM.param("value"); if (v) form.value.value = v;
    if (UM.param("category") || v) run();
  });
  form.addEventListener("submit", function (e) { e.preventDefault(); run(); });
  form.addEventListener("change", function () { if (out.getAttribute("data-ran")) run(); });
  function run() {
    out.setAttribute("data-ran", "1");
    var cat = form.category.value, value = Math.max(0, parseFloat(form.value.value) || 0);
    var pr = (form.querySelector('[name="priority"]:checked') || {}).value || "balance";
    var mode = (form.querySelector('[name="mode"]:checked') || {}).value || "either";
    var region = form.region.value || "US";
    var w = { speed: 1, price: 1, effort: 1, trust: 1 };
    if (pr === "speed") w = { speed: 2.2, price: .6, effort: 1.2, trust: 1 };
    if (pr === "price") w = { speed: .6, price: 2.4, effort: .5, trust: 1.1 };
    if (pr === "effort") w = { speed: 1, price: .6, effort: 2.4, trust: 1 };
    if (value >= 500) w.trust += 1; if (value >= 2000) w.trust += 1;
    var cands = P.filter(function (p) {
      if (NON_SELL.indexOf(p.type) > -1) return false;
      if (cat && p.cats.indexOf(cat) === -1) return false;
      if (p.regions.indexOf(region) === -1 && p.regions.indexOf("Global") === -1) return false;
      if (mode === "local" && !p.local) return false;
      if (mode === "ship" && !p.ship) return false;
      return true;
    });
    var scored = cands.map(function (p) {
      var t = UM.trustScore(p) / 20;
      var s = w.speed * p.speed + w.price * p.price + w.effort * p.effort + w.trust * t;
      var why = [];
      if (value > 0 && value < 30 && !p.ship) { s += 2; why.push("low-value items rarely justify shipping"); }
      if (value > 0 && value < 30 && p.ship && !p.calc) s -= 1.5;
      if (cat === "furniture" || cat === "appliances") { if (!p.ship || /delivery|Managed/i.test(p.type + p.protection)) { s += 1.5; } }
      if (cat === "luxury" && /authentic/i.test(p.protection)) { s += 2; why.push("authentication protects the price"); }
      if (cat === "phones" && /verified|warranty|IMEI|Staff/i.test(p.protection)) s += 1;
      if (value >= 1000 && p.pay === 0) { s -= 1.5; why.push("use a verified payment method at this value"); }
      var est = null, estLabel = "";
      if (p.calc && value) { var f = UM.calcFees(p.calc, value, 0); est = value - f.total; estLabel = "est. payout after fees"; }
      else if (INSTANT[p.type] && value) { est = value * (INSTANT[p.type][0] + INSTANT[p.type][1]) / 2; estLabel = "typical instant offer"; }
      else if (CONSIGN[p.type] && value) { est = value * (CONSIGN[p.type][0] + CONSIGN[p.type][1]) / 2; estLabel = "typical consignor share"; }
      if (est != null && value) s += w.price * 4 * (est / value - 0.8);
      if (p.speed >= 5) why.push("fast");
      if (p.price >= 5) why.push("strong prices");
      if (p.effort >= 5) why.push("they handle the work");
      if (!p.ship) why.push("local pickup, no shipping");
      return { p: p, s: s, est: est, estLabel: estLabel, why: why };
    }).sort(function (a, b) { return b.s - a.s; }).slice(0, 6);
    if (!scored.length) { out.innerHTML = '<div class="result-empty">No platforms match that combination. Try "Either" for local/shipping or a different region.</div>'; return; }
    var catName = (CATS.filter(function (c) { return c.id === cat; })[0] || {}).name || "your item";
    var html = '<p class="small muted">Ranked for <strong>' + UM.esc(catName) + "</strong>" + (value ? " worth about <strong>" + UM.money(value) + "</strong>" : "") + " in " + UM.esc(region) + ".</p>";
    html += scored.map(function (r, i) {
      return '<div class="rank"><div class="n">' + (i + 1) + '</div><div><h4><a href="' + r.p.url + '" target="_blank" rel="noopener nofollow">' + UM.esc(r.p.name) + '</a></h4><div class="small muted">' + UM.esc(r.p.type) + " · " + UM.esc(r.p.feeText) + '</div><p class="why">' + UM.esc(r.p.bestFor) + (r.why.length ? " — " + UM.esc(r.why.slice(0, 3).join(", ")) : "") + '</p></div><div class="net">' + (r.est != null ? UM.money(r.est) + "<small>" + r.estLabel + "</small>" : "<small>fees vary</small>") + "</div></div>";
    }).join("");
    if (value > 0 && value < 20) html += '<div class="callout tip"><h4>Worth your time?</h4><p class="mb0">Below about $20, the time spent listing, messaging and meeting can exceed the cash. Bundle it with similar items, or give it away on Freecycle or Nextdoor.</p></div>';
    html += '<div class="callout"><h4>Want buyers to come to you?</h4><p>Send the details once and we\'ll route your request to buyers and resale partners for this category.</p><a class="btn btn-coral btn-sm" href="' + UM.leadLink({ category: cat, value: value, source: "where-to-sell" }) + '">Get offers for this item →</a></div>';
    out.innerHTML = html;
    var r2 = P.filter(function (p) { return NON_SELL.indexOf(p.type) > -1 && (!cat || p.cats.indexOf(cat) > -1); });
    res.innerHTML = r2.length ? "<h4>Helpful before you list</h4><ul>" + r2.map(function (p) { return '<li><a href="' + p.url + '" target="_blank" rel="noopener nofollow">' + UM.esc(p.name) + "</a> — " + UM.esc(p.bestFor) + "</li>"; }).join("") + "</ul>" : "";
  }
})();
