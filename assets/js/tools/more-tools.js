/* Buy Used vs New · Declutter Cash Calculator · Condition Grader */
(function () {
  "use strict";
  var UM = window.UM;

  /* ---- Buy used vs new ---- */
  var uv = UM.$("#uv-form");
  if (uv) {
    var uvo = UM.$("#uv-results");
    uv.addEventListener("submit", function (e) { e.preventDefault(); runUV(); });
    uv.addEventListener("input", function () { if (uvo.getAttribute("data-ran")) runUV(); });
    function n(k) { return parseFloat(uv[k].value) || 0; }
    function runUV() {
      uvo.setAttribute("data-ran", "1");
      var np = n("new_price"), up = n("used_price"), yrs = Math.max(0.5, n("years")), life = Math.max(10, n("used_life")) / 100;
      var risk = n("risk") / 100, repair = n("repair"), resN = n("resale_new") / 100, resU = n("resale_used") / 100;
      var newCost = np - np * resN;
      var usedYears = yrs * life;
      var usedCost = up + risk * repair - up * resU;
      var newPerYr = newCost / yrs, usedPerYr = usedCost / Math.max(0.5, usedYears);
      var winner = usedPerYr < newPerYr ? "used" : "new";
      var save = Math.abs(newPerYr - usedPerYr);
      uvo.innerHTML = '<p class="small muted mb0">Cost per year of use</p><div class="grid g2 mt1"><div class="card' + (winner === "new" ? " best" : "") + '"><div class="small muted">New</div><strong style="font-size:1.6rem">' + UM.money(newPerYr) + "</strong><div class='small muted'>over " + yrs + " yrs, resale " + Math.round(resN * 100) + '%</div></div><div class="card"><div class="small muted">Used</div><strong style="font-size:1.6rem">' + UM.money(usedPerYr) + "</strong><div class='small muted'>~" + usedYears.toFixed(1) + " yrs of life, incl. expected repairs</div></div></div>" +
        '<div class="flag ' + (winner === "used" ? "low" : "") + ' mt2"><b>' + (winner === "used" ? "Buying used wins" : "Buying new wins") + "</b>by about " + UM.money(save) + " per year of use. " + (winner === "used" ? "Inspect it properly and keep the savings." : "Warranty and longer life outweigh the upfront saving here.") + "</div>";
    }
  }

  /* ---- Declutter cash ---- */
  var dc = UM.$("#dc-app");
  if (dc) {
    var rows = UM.$("#dc-rows"), sum = UM.$("#dc-summary");
    var MIN = { sell_local: 35, sell_ship: 45, instant: 15, donate: 10 };
    function addRow(d) {
      d = d || {};
      var tr = document.createElement("tr");
      tr.innerHTML = '<td><input type="text" aria-label="Item" value="' + UM.esc(d.item || "") + '" placeholder="e.g. Desk chair"></td><td><input type="number" min="0" step="1" aria-label="Estimated value" value="' + (d.v || "") + '" placeholder="40"></td><td><select aria-label="Channel"><option value="sell_local">Sell local</option><option value="sell_ship">Sell &amp; ship</option><option value="instant">Instant offer</option><option value="donate">Donate / give</option></select></td><td class="num" data-net>—</td><td><button class="icon-btn" type="button" aria-label="Remove row">✕</button></td>';
      if (d.ch) tr.querySelector("select").value = d.ch;
      tr.querySelector("button").addEventListener("click", function () { tr.remove(); calc(); });
      rows.appendChild(tr);
    }
    [{ item: "Old phone", v: 180, ch: "instant" }, { item: "Bookshelf", v: 60, ch: "sell_local" }, { item: "Winter jacket", v: 45, ch: "sell_ship" }, { item: "Kids' toys (box)", v: 15, ch: "donate" }].forEach(addRow);
    UM.$("#dc-add").addEventListener("click", function () { addRow(); });
    dc.addEventListener("input", calc); dc.addEventListener("change", calc); calc();
    function calc() {
      var rate = parseFloat(UM.$("#dc-rate").value) || 25, total = 0, mins = 0, list = [];
      UM.$$("tr", rows).forEach(function (tr) {
        var inp = tr.querySelectorAll("input"), ch = tr.querySelector("select").value, v = parseFloat(inp[1].value) || 0;
        var net = ch === "sell_local" ? v * 0.9 : ch === "sell_ship" ? v * 0.82 : ch === "instant" ? v * 0.6 : 0;
        var m = MIN[ch]; var hourly = m ? net / (m / 60) : 0;
        tr.querySelector("[data-net]").innerHTML = UM.money(net) + (ch !== "donate" && v ? '<div class="small ' + (hourly < rate ? "neg" : "pos") + '">' + UM.money(hourly) + "/hr</div>" : "");
        total += net; mins += m;
        if (ch !== "donate" && v && hourly < rate) list.push(inp[0].value || "an item");
      });
      sum.innerHTML = '<div class="grid g3"><div class="stat"><b>' + UM.money(total) + '</b><span>estimated cash</span></div><div class="stat"><b>' + (mins / 60).toFixed(1) + ' h</b><span>your time</span></div><div class="stat"><b>' + UM.money(mins ? total / (mins / 60) : 0) + '</b><span>effective hourly rate</span></div></div>' +
        (list.length ? '<div class="flag mt2"><b>Below your hourly rate</b>Bundle, switch to an instant offer, or donate: ' + UM.esc(list.join(", ")) + ".</div>" : '<div class="flag low mt2"><b>Every item beats your hourly rate</b>Worth selling.</div>');
    }
  }

  /* ---- Condition grader ---- */
  var cg = UM.$("#cg-form");
  if (cg) {
    var cgo = UM.$("#cg-results");
    var G = [
      ["New", "Unused, unopened or with original tags. No signs of handling."],
      ["Like New", "Used briefly. No visible wear. Works perfectly. All original parts."],
      ["Excellent", "Light signs of use visible only up close. Fully functional."],
      ["Good", "Normal wear such as light scratches or scuffs. Fully functional."],
      ["Fair", "Obvious wear or a minor cosmetic/functional issue, clearly disclosed."],
      ["For Parts", "Does not work fully or has a significant defect. Sold as-is."]
    ];
    cg.addEventListener("submit", function (e) { e.preventDefault(); grade(); });
    cg.addEventListener("change", grade);
    function q(n) { var x = cg.querySelector('[name="' + n + '"]:checked'); return x ? +x.value : null; }
    function grade() {
      var f = q("works"), use = q("use"), wear = q("wear"), pkg = q("pkg"), parts = q("parts");
      if ([f, use, wear, pkg, parts].some(function (x) { return x === null; })) { cgo.innerHTML = '<div class="result-empty">Answer all five questions to get a grade.</div>'; return; }
      var g;
      if (f === 2) g = 5; else if (use === 0 && wear === 0 && pkg === 1) g = 0;
      else { g = 1 + wear + (use >= 2 ? 1 : 0) + (f === 1 ? 1 : 0) + (parts === 0 ? 1 : 0); g = Math.min(4, Math.max(1, g)); }
      cgo.innerHTML = '<p class="small muted mb0">Recommended grade</p><div class="result-big">' + G[g][0] + "</div><p>" + G[g][1] + "</p>" +
        '<div class="output-box" id="cg-text">Condition: ' + G[g][0] + " — " + G[g][1] + (parts === 0 ? " Some accessories or parts are missing (listed below)." : "") + (f === 1 ? " Minor functional issue disclosed in the description and photos." : "") + '</div><p class="mt1"><button class="btn btn-sm" type="button" id="cg-copy">Copy condition text</button> <a class="btn btn-sm btn-ghost" href="' + UM.root + 'tools/listing-builder/">Build the full listing</a></p>';
      UM.$("#cg-copy").addEventListener("click", function () { UM.copy(UM.$("#cg-text").textContent); });
    }
  }
})();
