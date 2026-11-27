/* Scam Message Checker — rule-based, runs entirely in the browser */
(function () {
  "use strict";
  var UM = window.UM, form = UM.$("#scam-form"); if (!form) return;
  var out = UM.$("#scam-results");
  var R = [
    ["gift", /\b(gift ?cards?|itunes|google play card|steam card|amazon card|apple card|vanilla card)\b/i, 45, "Payment by gift card", "Legitimate buyers and sellers don't pay with gift cards. Once the codes are shared, the money is gone."],
    ["wire", /\b(western union|moneygram|wire (the )?(money|funds|transfer)|bank wire|wire transfer)\b/i, 40, "Wire or money-transfer request", "Wires to strangers are nearly impossible to reverse."],
    ["check", /\b(cashier'?s? ?che(ck|que)|certified che(ck|que)|money order|bank draft)\b/i, 35, "Cashier's check / money order", "Counterfeit checks can 'clear' and then bounce days later, leaving you liable."],
    ["over", /\b(over ?pa(y|id|yment)|extra (money|amount|funds)|refund (me )?the (difference|balance|rest)|send (back|me) the (difference|balance|rest)|paid (you )?more than)\b/i, 45, "Overpayment and refund-the-difference", "The classic fake-payment scam: they 'overpay', you refund the extra, their original payment reverses."],
    ["shipper", /\b(my (shipper|mover|courier|agent|driver|cousin|assistant) (will|would|is going to) (pick|collect|come))|(pick ?up agent|shipping agent|courier will pick)\b/i, 30, "Third party will collect", "Buyers who can't come themselves and send a 'mover' usually also send fake payment."],
    ["code", /\b(verification code|verify (you are|you're) real|6[- ]digit code|google voice|code (i|we) (just )?sent)\b/i, 45, "Asks for a verification code", "Sharing a code lets scammers hijack your phone number or accounts (Google Voice scam)."],
    ["offplat", /\b(text me|whats ?app|telegram|signal|email me (at|on)|contact me (on|at|via)|my (number|email) is|outside (of )?(the )?app)\b/i, 18, "Moves the chat off the platform", "Platforms can't protect or record deals done off-site. Keep messages in the app."],
    ["zelle", /\b(zelle|cash ?app|venmo|paypal friends|friends (and|&) family|f&f)\b/i, 14, "Instant P2P payment requested", "Instant payment apps are like cash: no buyer protection with strangers. Fine in person after inspection, risky in advance."],
    ["upgrade", /\b(upgrade (your|to a) (business|premium) account|business account|account (is )?(limited|pending|on hold)|release (the )?(funds|payment))\b/i, 45, "Fake 'upgrade account to release payment'", "Payment apps never ask you to pay to 'upgrade' or 'release' funds. These emails are fake."],
    ["crypto", /\b(bitcoin|btc|crypto|usdt|tether|ethereum|eth wallet|binance)\b/i, 35, "Cryptocurrency payment", "Crypto payments are irreversible and anonymous — a favourite of scammers."],
    ["overseas", /\b(overseas|out of (the )?(country|town|state)|deployed|military|on a ship|working offshore|abroad)\b/i, 22, "Can't meet — away / overseas", "A seller who can't meet and wants to ship a big-ticket item is a common pattern."],
    ["deposit", /\b(deposit to (hold|reserve)|pay (a )?deposit|holding fee|reserve it (for you )?(with|for) \$?)\b/i, 28, "Deposit to hold the item", "Deposits to people you've never met disappear along with the 'item'."],
    ["shipfee", /\b(insurance fee|shipping (insurance|fee) (first|upfront)|customs (fee|charge)|delivery fee to unlock|courier fee)\b/i, 32, "Upfront shipping/insurance/customs fee", "Fake courier and customs fees are invented to extract extra payments."],
    ["urgent", /\b(urgent(ly)?|asap|right now|immediately|today only|first come|leaving tomorrow|need (it )?gone (today|now))\b/i, 10, "Pressure and urgency", "Urgency stops you from checking. Slow down."],
    ["escrow", /\b(escrow)\b/i, 22, "Unfamiliar escrow service", "Scammers set up fake escrow sites. Only use services you find independently."],
    ["link", /(https?:\/\/|www\.|bit\.ly|tinyurl|\.xyz|\.top|\.click)\S*/i, 18, "Contains a link", "Payment or 'confirm delivery' links are often phishing pages that steal card details."],
    ["qr", /\b(qr ?code|scan (this|the) code)\b/i, 30, "QR code to receive payment", "You never need to scan a QR code to receive money. QR codes are used to drain accounts."],
    ["noview", /\b(can'?t (show|meet)|no (viewing|inspection)|sight unseen|don'?t need to see|without seeing)\b/i, 25, "No inspection allowed / needed", "Refusing inspection (or a buyer who doesn't want to see it) is a major red flag."],
    ["ssn", /\b(ssn|social security|sin number|bank (login|password)|card (number|details)|cvv|pin)\b/i, 40, "Asks for sensitive financial details", "No buyer needs your card number, CVV, PIN, bank login or ID number."],
    ["price", /\b(brand new.{0,20}(half|50%|cheap)|too good|below market|lowest price ever|\$\s?\d{1,2}\b.{0,15}(iphone|macbook|ps5|car|truck))\b/i, 14, "Price too good to be true", "Prices far below every comparable sold listing are bait."],
    ["shipitem", /\b(ship (it )?(to|for) me|send (it|the item) (first|before)|i('| a)?m paying shipping|i will pay shipping)\b/i, 14, "Wants you to ship before verified payment", "Ship only after payment is confirmed inside your platform or bank — not from an email screenshot."],
    ["emailpay", /\b(check your email|sent (you )?(an )?email (from|confirming)|payment (confirmation|receipt) (email|was sent)|paypal (sent|email))\b/i, 30, "Payment 'confirmed' by email", "Fake payment emails look real. Confirm in your actual account or bank app, never via a message link."],
    ["rental", /\b(i'?m (out of town|away),? (you can|just) (drive by|look through the windows)|keys will be (mailed|sent))\b/i, 40, "Rental: can't show, will mail keys", "A landlord who can't show the property and will mail keys is almost always a scam."],
    ["dog", /\b(puppy|kitten|pet).{0,40}(ship|airline|crate|delivery fee)\b/i, 35, "Pet shipped after payment", "Pet scams use cute photos and endless 'delivery' fees for animals that don't exist."]
  ];
  var SAMPLES = {
    a: "Hi, is this still available? I'm currently overseas on a ship so my shipper will pick it up. I'll send a cashier's check for extra to cover his fee, just refund the difference via Zelle. Urgent please.",
    b: "Before I come I need to verify you are real. I just sent a 6 digit code to your phone, can you text me the code? My number is 555-0100.",
    c: "Hey! Love the bike. Can I come see it Saturday at 11 at the police station exchange zone? I'll bring cash and test-ride it first."
  };
  UM.$$("[data-sample]").forEach(function (b) { b.addEventListener("click", function () { form.message.value = SAMPLES[b.getAttribute("data-sample")]; run(); }); });
  form.addEventListener("submit", function (e) { e.preventDefault(); run(); });
  function run() {
    var t = form.message.value || "";
    if (t.trim().length < 8) { out.innerHTML = '<div class="result-empty">Paste the full message (at least a sentence) to check it.</div>'; return; }
    var hits = R.filter(function (r) { return r[1].test(t); });
    var raw = hits.reduce(function (a, r) { return a + r[2]; }, 0);
    var score = Math.round(100 * (1 - Math.exp(-raw / 55)));
    var level = score >= 60 ? ["High risk", "high", "Stop. Do not send money, codes or the item. Report the account on the platform."] : score >= 30 ? ["Caution", "", "Several warning signs. Insist on meeting in person or paying only inside the platform's checkout."] : ["Low risk", "low", "No common scam patterns found. Still inspect before paying and keep the conversation on-platform."];
    out.innerHTML = '<p class="small muted mb0">Risk score</p><div class="result-big">' + score + '<span style="font-size:1rem"> / 100</span></div><div class="meter" aria-hidden="true"><i style="left:' + Math.max(2, Math.min(98, score)) + '%"></i></div>' +
      '<div class="flag ' + level[1] + '"><b>' + level[0] + "</b>" + level[2] + "</div>" +
      (hits.length ? "<h4 class='mt2'>Warning signs found (" + hits.length + ")</h4>" + hits.sort(function (a, b) { return b[2] - a[2]; }).map(function (r) { return '<div class="flag ' + (r[2] >= 35 ? "high" : "") + '"><b>' + UM.esc(r[3]) + "</b>" + UM.esc(r[4]) + "</div>"; }).join("") : "<p class='mt1'>No rule matched. Scammers adapt — trust your instincts if something feels off.</p>") +
      '<div class="callout"><h4>What to do next</h4><ul class="mb0"><li>Keep every message inside the marketplace app.</li><li>Meet in a public, camera-covered place; inspect before paying.</li><li>Confirm payments in your real bank or app — never via a link.</li><li>Report the profile to the platform. In the US, also report at <a href="https://reportfraud.ftc.gov/" target="_blank" rel="noopener">ReportFraud.ftc.gov</a>; in Canada, the <a href="https://antifraudcentre-centreantifraude.ca/" target="_blank" rel="noopener">Canadian Anti-Fraud Centre</a>; in the UK, <a href="https://www.actionfraud.police.uk/" target="_blank" rel="noopener">Action Fraud</a>.</li></ul></div>' +
      '<p class="small muted">The checker runs in your browser; the message is not sent anywhere.</p>';
  }
})();
