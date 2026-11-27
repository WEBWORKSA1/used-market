/* Used.Market runtime configuration.
   The site inbox is stored encoded and is only assembled in memory when a form is submitted
   or a donation link is opened. It is never written into the page. */
window.UM_CONFIG = {
  site: "Used.Market",
  siteUrl: "https://used.market",
  adsenseClient: "ca-pub-6620975821265271",
  /* Optional fixed ad units. Paste AdSense slot IDs here (e.g. "1234567890").
     While empty, Auto ads place units and the in-content containers stay hidden. */
  adSlots: { incontent: "", sidebar: "", footer: "" },
  /* Optional: FormSubmit random alias shown after activation. If set, it replaces the inbox in the endpoint. */
  formAlias: "",
  _p: ["=02bj", "5CbpF", "WbnBU", "MhN3a", "y92di", "V2d"],
  donate: { currency: "USD", itemName: "Used.Market community support" },
  youtubeChannel: "",
  version: "2026.11.27"
};
(function (c) {
  c.inbox = function () {
    try { return atob(c._p.join("").split("").reverse().join("")); } catch (e) { return ""; }
  };
  c.formEndpoint = function (ajax) {
    var id = c.formAlias || c.inbox();
    return "https://formsubmit.co/" + (ajax ? "ajax/" : "") + id;
  };
  c.donateUrl = function (amount, recurring) {
    var p = new URLSearchParams();
    p.set("business", c.inbox());
    p.set("currency_code", c.donate.currency);
    p.set("item_name", c.donate.itemName);
    if (amount) p.set("amount", String(amount));
    if (recurring) { p.set("cmd", "_xclick-subscriptions"); p.set("a3", String(amount || 10)); p.set("p3", "1"); p.set("t3", "M"); p.set("src", "1"); return "https://www.paypal.com/cgi-bin/webscr?" + p.toString(); }
    return "https://www.paypal.com/donate/?" + p.toString();
  };
})(window.UM_CONFIG);
