/* Safe Meetup & Payment Planner */
(function () {
  "use strict";
  var UM = window.UM, form = UM.$("#mp-form"); if (!form) return;
  var out = UM.$("#mp-results");
  form.addEventListener("submit", function (e) { e.preventDefault(); run(); });
  form.addEventListener("change", function () { if (out.getAttribute("data-ran")) run(); });
  function run() {
    out.setAttribute("data-ran", "1");
    var val = parseFloat(form.value.value) || 0, role = form.querySelector('[name="role"]:checked').value, kind = form.kind.value;
    var pay = [], where = [], bring = [], never = ["Never accept or send overpayments, cashier's checks you can't verify, gift cards, wires or crypto.", "Never share verification codes, card numbers or bank logins.", "Never let someone pressure you into skipping inspection."];
    if (val < 250) pay.push(["Cash, counted on the spot", "Simplest for small amounts; check notes under good light."], ["Platform checkout", "Use it when shipping or if the platform offers protection."]);
    else if (val < 1500) pay.push(["Platform checkout / protected payment", "Best: the platform holds funds and records the deal."], ["Cash at a bank branch", "Count it with a teller and deposit immediately."], ["Instant bank transfer seen landing in your account", "Confirm in your own banking app before handing over the item — not via a screenshot."]);
    else pay.push(["Bank-to-bank transfer completed at a branch", "Meet at the buyer's bank; watch the teller initiate it."], ["Cashier's check verified by calling the issuing bank yourself", "Find the bank's number independently — never use the number on the check."], ["Escrow only if you chose it independently", "For vehicles or very high values, a well-known escrow service you selected — never one the other party sends."]);
    if (kind === "car") { where.push("Your bank branch or the buyer's bank (best for paperwork + payment)", "A police-station 'safe exchange zone' for the test-drive meetup"); bring.push("Title, ID, bill of sale (2 copies), service records, spare key", "For test drives: photograph their licence, ride along"); }
    else if (kind === "large") { where.push("Your driveway or garage with the door open, not inside your home", "Have a second person present; keep valuables out of sight"); bring.push("Dolly, straps, measuring tape", "Ask buyers to bring helpers and a suitable vehicle"); }
    else if (kind === "phone") { where.push("Inside a carrier store or mall food court with Wi-Fi", "Police-station exchange zone (cameras, often 24/7)"); bring.push("A SIM card to test calls/data", "Charger cable to test the port", "Phone with IMEI checker open"); }
    else { where.push("A police-station exchange zone or busy, camera-covered café", "Daylight hours; tell someone where you're going"); bring.push("Your own light to check condition", "Exact change if paying cash"); }
    if (role === "buyer") bring.push("Run the inspection checklist before paying"); else bring.push("Proof of ownership / receipt if you have it");
    var tier = val >= 1500 ? ["High-value deal", "high"] : val >= 250 ? ["Medium-value deal", ""] : ["Low-value deal", "low"];
    out.innerHTML = '<div class="flag ' + tier[1] + '"><b>' + tier[0] + "</b>" + (val ? UM.money(val) + " — " : "") + "here's the safest plan.</div>" +
      "<h4 class='mt2'>Payment, safest first</h4><ol>" + pay.map(function (p) { return "<li><strong>" + p[0] + "</strong> — " + p[1] + "</li>"; }).join("") + "</ol>" +
      "<h4>Where to meet</h4><ul>" + where.map(function (w) { return "<li>" + w + "</li>"; }).join("") + "</ul>" +
      "<h4>Bring / do</h4><ul>" + bring.map(function (w) { return "<li>" + w + "</li>"; }).join("") + "</ul>" +
      '<div class="callout warn"><h4>Never</h4><ul class="mb0">' + never.map(function (w) { return "<li>" + w + "</li>"; }).join("") + "</ul></div>" +
      '<p class="small"><a href="' + UM.root + "tools/inspection-checklists/?category=" + (kind === "car" ? "cars" : kind === "phone" ? "phones" : kind === "large" ? "furniture" : "computers") + '">Open the matching inspection checklist →</a></p>';
  }
})();
