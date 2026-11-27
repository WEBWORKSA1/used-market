/* Shared helpers for Used.Market tools */
(function () {
  "use strict";
  var UM = window.UM = window.UM || {};
  UM.calcFees = function (c, price, shipCharged) {
    if (!c) return null;
    price = +price || 0; shipCharged = +shipCharged || 0;
    var base = c.onShipping ? price + shipCharged : price;
    var fee;
    if (c.flatUnder && price < c.flatUnder.threshold) fee = c.flatUnder.flat;
    else fee = base * (c.sellerPct || 0) / 100;
    fee += (c.sellerFixed || 0);
    if (c.minFee && price > 0 && fee < c.minFee) fee = c.minFee;
    var proc = (price + shipCharged) * (c.procPct || 0) / 100 + (price > 0 ? (c.procFixed || 0) : 0);
    return { fee: fee, proc: proc, total: fee + proc };
  };
  UM.trustScore = function (p) {
    var s = 40 * ((p.pay || 0) / 2) + 30 * ((p.idv || 0) / 2) + (p.records ? 10 : 0);
    if (p.protection && !/^none/i.test(p.protection)) s += 20;
    return Math.round(Math.min(100, s));
  };
  UM.scoreClass = function (s) { return s >= 70 ? "" : s >= 45 ? "mid" : "low"; };
  UM.data = {};
  UM.get = function (name) {
    if (UM.data[name]) return Promise.resolve(UM.data[name]);
    return UM.loadJSON("data/" + name + ".json").then(function (d) { UM.data[name] = d; return d; });
  };
  UM.fillCategorySelect = function (sel, opts) {
    return UM.get("categories").then(function (d) {
      var cur = sel.value || UM.param("category") || "";
      sel.innerHTML = (opts && opts.placeholder ? '<option value="">' + opts.placeholder + "</option>" : "") +
        d.items.map(function (c) { return '<option value="' + c.id + '"' + (c.id === cur ? " selected" : "") + ">" + c.icon + " " + UM.esc(c.name) + "</option>"; }).join("");
      return d;
    });
  };
  UM.monogram = function (name) {
    var w = name.replace(/\(.*?\)/g, "").trim().split(/\s+/);
    return (w[0][0] + (w[1] ? w[1][0] : (w[0][1] || ""))).toUpperCase();
  };
  UM.hue = function (s) { var h = 0; for (var i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) % 360; return h; };
})();
