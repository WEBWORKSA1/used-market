/* Interactive inspection checklists (saved on this device) */
(function () {
  "use strict";
  var UM = window.UM, wrap = UM.$("#cl-app"); if (!wrap) return;
  var sel = UM.$("#cl-cat"), list = UM.$("#cl-list"), prog = UM.$("#cl-progress i"), stat = UM.$("#cl-status"), CATS = [];
  UM.fillCategorySelect(sel).then(function (d) { CATS = d.items; if (!UM.param("category")) sel.value = "phones"; draw(); });
  sel.addEventListener("change", draw);
  UM.$("#cl-reset").addEventListener("click", function () { UM.store.set("cl_" + sel.value, {}); draw(); });
  UM.$("#cl-print").addEventListener("click", function () { window.print(); });
  function draw() {
    var c = CATS.filter(function (x) { return x.id === sel.value; })[0]; if (!c) return;
    var state = UM.store.get("cl_" + c.id, {});
    list.innerHTML = c.check.map(function (it, i) {
      var on = !!state[i];
      return '<label class="cl-item' + (on ? " done" : "") + '"><input type="checkbox" data-i="' + i + '"' + (on ? " checked" : "") + "><span>" + UM.esc(it[0]) + (it[1] === "crit" ? '<span class="crit">must pass</span>' : "") + "</span></label>";
    }).join("");
    UM.$("#cl-title").textContent = c.icon + " " + c.name + " checklist";
    UM.$("#cl-flags").innerHTML = c.flags.map(function (f) { return "<li>" + UM.esc(f) + "</li>"; }).join("");
    update(c, state);
    UM.$$("input", list).forEach(function (cb) {
      cb.addEventListener("change", function () {
        state[cb.getAttribute("data-i")] = cb.checked; UM.store.set("cl_" + c.id, state);
        cb.parentNode.classList.toggle("done", cb.checked); update(c, state);
      });
    });
  }
  function update(c, state) {
    var done = c.check.filter(function (_, i) { return state[i]; }).length;
    var critLeft = c.check.filter(function (it, i) { return it[1] === "crit" && !state[i]; }).length;
    prog.style.width = Math.round(done / c.check.length * 100) + "%";
    stat.className = "flag " + (critLeft ? "high" : done === c.check.length ? "low" : "");
    stat.innerHTML = critLeft ? "<b>Don't pay yet</b>" + critLeft + " must-pass check" + (critLeft > 1 ? "s" : "") + " still open." : done === c.check.length ? "<b>All checks passed</b>Agree the price, pay with a traceable method and get a receipt." : "<b>Critical checks passed</b>" + (c.check.length - done) + " condition checks left — use them to negotiate.";
  }
})();
