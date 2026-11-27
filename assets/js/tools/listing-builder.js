/* Listing Builder — title + description generator with per-platform limits */
(function () {
  "use strict";
  var UM = window.UM, form = UM.$("#lb-form"); if (!form) return;
  var LIM = { ebay: [80, "eBay"], mercari: [80, "Mercari"], poshmark: [80, "Poshmark"], etsy: [140, "Etsy"], facebook: [100, "Facebook Marketplace"], kijiji: [64, "Kijiji"], craigslist: [70, "Craigslist"], depop: [0, "Depop (no title)"], generic: [100, "Any platform"] };
  var COND = { nwt: "New with tags / sealed", likenew: "Like new — used a handful of times, no visible wear", excellent: "Excellent — light signs of use, fully working", good: "Good — normal wear, fully working", fair: "Fair — visible wear or minor issues (see notes)", parts: "For parts or repair — not fully working" };
  var COND_SHORT = { nwt: "New", likenew: "Like New", excellent: "Excellent", good: "Good", fair: "Fair", parts: "For Parts" };
  form.addEventListener("input", gen); form.addEventListener("change", gen);
  UM.$("#lb-copy-t").addEventListener("click", function () { UM.copy(UM.$("#lb-title").textContent); });
  UM.$("#lb-copy-d").addEventListener("click", function () { UM.copy(UM.$("#lb-desc").textContent); });
  gen();
  function v(n) { return (form[n] && form[n].value || "").trim(); }
  function gen() {
    var plat = LIM[v("platform") || "generic"];
    var parts = [v("brand"), v("item"), v("spec"), v("color"), v("size") ? "Size " + v("size") : "", COND_SHORT[v("condition")] || ""].filter(Boolean);
    var title = parts.join(" ").replace(/\s+/g, " ");
    var limit = plat[0];
    if (limit && title.length > limit) {
      var t2 = parts.filter(function (p) { return p !== v("color"); }).join(" ");
      title = t2.length <= limit ? t2 : t2.slice(0, limit - 1).replace(/\s+\S*$/, "") + "…";
    }
    UM.$("#lb-title").textContent = limit === 0 ? "(Depop uses the description — first line below acts as the title)" : (title || "Your title appears here");
    var c = UM.$("#lb-count"); c.textContent = limit ? title.length + " / " + limit : ""; c.className = "counter" + (limit && title.length > limit ? " over" : "");
    var lines = [];
    var head = [v("brand"), v("item"), v("spec")].filter(Boolean).join(" ");
    if (head) lines.push(head + (v("condition") ? " — " + (COND_SHORT[v("condition")] || "") + " condition" : ""));
    lines.push("");
    if (v("condition")) lines.push("Condition: " + COND[v("condition")]);
    if (v("details")) lines.push("Details: " + v("details"));
    if (v("size")) lines.push("Size: " + v("size"));
    if (v("color")) lines.push("Colour: " + v("color"));
    if (v("includes")) lines.push("Included: " + v("includes"));
    if (v("defects")) lines.push("Flaws (shown in photos): " + v("defects"));
    if (v("reason")) lines.push("Why I'm selling: " + v("reason"));
    lines.push("");
    var d = v("delivery");
    if (d === "local") lines.push("Local pickup. Happy to meet at a public exchange spot. You can inspect before paying.");
    else if (d === "ship") lines.push("Ships within 2 business days, carefully packed, with tracking.");
    else if (d === "both") lines.push("Local pickup or shipping with tracking — your choice.");
    if (v("price")) lines.push("Price: " + v("price") + (form.obo && form.obo.checked ? " (reasonable offers considered)" : " (firm)"));
    lines.push("Smoke-free home. Please ask any questions before buying.");
    var kw = [v("brand"), v("item"), v("spec"), v("color")].filter(Boolean).join(", ");
    if (kw && v("platform") === "depop") lines.push("", "#" + kw.toLowerCase().replace(/[^a-z0-9, ]/g, "").split(/,\s*/).map(function (k) { return k.replace(/\s+/g, ""); }).filter(Boolean).slice(0, 5).join(" #"));
    UM.$("#lb-desc").textContent = lines.join("\n").replace(/\n{3,}/g, "\n\n").trim();
  }
})();
