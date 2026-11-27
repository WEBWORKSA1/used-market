/* Fee & Payout Calculator */
(function () {
  "use strict";
  var UM = window.UM, form = UM.$("#fee-form"); if (!form) return;
  var out = UM.$("#fee-results"), best = UM.$("#fee-best");
  var platforms = [];
  ["price", "ship_charged", "ship_cost", "item_cost"].forEach(function (k) { var v = UM.param(k === "price" ? "value" : k); if (v && form[k]) form[k].value = v; });
  UM.get("platforms").then(function (d) {
    platforms = d.items.filter(function (p) { return p.calc; });
    UM.$("#fee-asof").textContent = d.updated;
    render();
  });
  form.addEventListener("input", render);
  form.addEventListener("submit", function (e) { e.preventDefault(); render(); });
  function num(n) { return Math.max(0, parseFloat(form[n].value) || 0); }
  function render() {
    if (!platforms.length) return;
    var price = num("price"), sc = num("ship_charged"), sk = num("ship_cost"), cost = num("item_cost");
    var rows = platforms.map(function (p) {
      var isLocal = !p.ship;
      var charged = isLocal ? 0 : sc, shipCost = isLocal ? 0 : sk;
      var f = UM.calcFees(p.calc, price, charged);
      var net = price + charged - f.total - shipCost;
      return { p: p, fees: f.total, net: net, profit: net - cost, local: isLocal };
    });
    var cp = parseFloat(form.custom_pct.value), cf = parseFloat(form.custom_fixed.value) || 0;
    if (isFinite(cp)) {
      var cfee = (price + sc) * cp / 100 + cf;
      rows.push({ p: { name: "Your custom platform", url: "", feeText: cp + "% + " + UM.money(cf), verified: "" }, fees: cfee, net: price + sc - cfee - sk, profit: price + sc - cfee - sk - cost, local: false, custom: true });
    }
    rows.sort(function (a, b) { return b.net - a.net; });
    out.innerHTML = rows.map(function (r, i) {
      var margin = price > 0 ? Math.round((r.profit / (price + (r.local ? 0 : sc))) * 100) : 0;
      return '<tr class="' + (i === 0 ? "best" : "") + '"><td><strong>' + (r.p.url ? '<a href="' + r.p.url + '" target="_blank" rel="noopener nofollow">' + UM.esc(r.p.name) + "</a>" : UM.esc(r.p.name)) + "</strong>" +
        (r.local ? ' <span class="chip">local</span>' : "") + '<div class="small muted">' + UM.esc(r.p.feeText || "") + (r.p.verified === "approx" ? " · approx." : "") + "</div></td>" +
        '<td class="num">' + UM.money(r.fees) + '</td><td class="num"><strong>' + UM.money(r.net) + '</strong></td><td class="num ' + (r.profit >= 0 ? "pos" : "neg") + '">' + UM.money(r.profit) + '</td><td class="num">' + (price ? margin + "%" : "—") + "</td></tr>";
    }).join("");
    var top = rows[0], shipTop = rows.filter(function (r) { return !r.local; })[0];
    best.innerHTML = price ? ("<p class='mb0'>Highest payout: <strong>" + UM.esc(top.p.name) + "</strong> at <strong>" + UM.money(top.net) + "</strong>" +
      (shipTop && shipTop !== top ? ". Best shipped option: <strong>" + UM.esc(shipTop.p.name) + "</strong> (" + UM.money(shipTop.net) + ")" : "") +
      '.</p><p class="small muted mt1">Lowest fee isn\'t always the best outcome — buyer reach and speed matter too. <a href="' + UM.root + "tools/where-to-sell/?value=" + price + '">Run the Where-to-Sell Router →</a></p>') : "<p class='muted mb0'>Enter a sale price to compare.</p>";
    var lead = UM.$("#fee-lead"); if (lead) lead.href = UM.leadLink({ value: price, source: "fee-calculator" });
  }
})();
