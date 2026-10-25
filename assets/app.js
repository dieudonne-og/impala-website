(function () {
  "use strict";
  var d = document, L = d.documentElement.lang === "fr" ? "fr" : "en";
  var T = window.IMPALA_I18N || {}, CFG = window.IMPALA_CFG || {}, ICONS = function () { return window.IMPALA_ICONS || {}; };
  var $ = function (s, r) { return (r || d).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || d).querySelectorAll(s)); };
  var reduce = window.matchMedia && matchMedia("(prefers-reduced-motion: reduce)").matches;
  var norm = function (s) { return (s || "").toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, ""); };
  var esc = function (s) { return String(s == null ? "" : s).replace(/[&<>"']/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]; }); };
  var sizeVal = function (s) { var m = /^(\d+)(?:\/(\d+))?/.exec(s || ""); if (!m) return 9999; var v = +m[1] / (m[2] ? +m[2] : 1); return /"/.test((s || "").split("x")[0]) ? v * 25.4 : v; };
  var store = {
    get: function (k, def) { try { return JSON.parse(localStorage.getItem(k)) || def; } catch (e) { return def; } },
    set: function (k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) {} }
  };

  /* ---------- mobile menu ---------- */
  var mb = $(".menu-btn"), nav = $("#nav");
  if (mb && nav) mb.addEventListener("click", function () { var o = nav.classList.toggle("open"); mb.setAttribute("aria-expanded", o); });

  /* ---------- reveal on scroll + count-up ---------- */
  var rv = $$(".rv");
  rv.forEach(function (el) {
    var sibs = $$(".rv", el.parentNode).filter(function (x) { return x.parentNode === el.parentNode; });
    el.style.setProperty("--d", Math.min(sibs.indexOf(el), 6) * 70 + "ms");
  });
  function countUp(el) {
    var end = parseInt(el.dataset.count, 10), suf = el.dataset.suffix || "";
    if (reduce || !end) { el.textContent = end + suf; return; }
    var t0 = null, dur = 1100;
    (function step(t) {
      if (t0 === null) t0 = t;
      var p = Math.min((t - t0) / dur, 1), e = 1 - Math.pow(1 - p, 3);
      el.textContent = Math.round(end * e) + suf;
      if (p < 1) requestAnimationFrame(step);
    })(performance.now());
  }
  if ("IntersectionObserver" in window) {
    var io = new IntersectionObserver(function (es) {
      es.forEach(function (e) { if (e.isIntersecting) { e.target.classList.add("in"); io.unobserve(e.target); } });
    }, { threshold: 0.12, rootMargin: "0px 0px -6% 0px" });
    rv.forEach(function (el) { io.observe(el); });
    var io2 = new IntersectionObserver(function (es) {
      es.forEach(function (e) { if (e.isIntersecting) { countUp(e.target); io2.unobserve(e.target); } });
    }, { threshold: 0.5 });
    $$("[data-count]").forEach(function (el) { io2.observe(el); });
  } else { rv.forEach(function (el) { el.classList.add("in"); }); }

  /* ---------- sliders ---------- */
  $$("[data-slide]").forEach(function (b) {
    b.addEventListener("click", function () {
      var s = (b.closest(".row-sec") || b.closest("section")).querySelector(".slider");
      if (s) s.scrollBy({ left: parseInt(b.dataset.slide, 10) * 300, behavior: reduce ? "auto" : "smooth" });
    });
  });

  /* ---------- cart state ---------- */
  var items = store.get("impala-cart", []);
  var drawer = $("#drawer");
  function count() { return items.reduce(function (s, i) { return s + i.q; }, 0); }
  function thumbHtml(it) {
    if (it.ph) return '<img src="' + esc(it.ph) + '" alt="" width="64" height="64">';
    return ICONS()[it.i] || "";
  }
  function save() { store.set("impala-cart", items); sync(); }
  function sync() {
    var n = count();
    $$("[data-qcount]").forEach(function (el) { el.textContent = n; });
    $$(".add").forEach(function (b) {
      var on = items.some(function (i) { return i.id === b.dataset.id; });
      b.setAttribute("aria-pressed", on); b.textContent = on ? T.added : T.add;
    });
    renderDrawer(); renderCartPage();
  }
  function renderDrawer() {
    var list = $("#qitems"); if (!list) return;
    list.innerHTML = "";
    items.forEach(function (it, k) {
      var li = d.createElement("li");
      li.innerHTML = '<a class="cmedia" href="' + esc(it.u[L]) + '">' + thumbHtml(it) + '</a><div><a class="qn" href="' + esc(it.u[L]) + '">' + esc(it.n[L]) + '</a></div>' +
        '<span class="qty"><button type="button" aria-label="-">&minus;</button><output>' + it.q + '</output><button type="button" aria-label="+">+</button></span>';
      var b = $$("button", li);
      b[0].onclick = function () { it.q--; if (it.q < 1) items.splice(k, 1); save(); };
      b[1].onclick = function () { it.q++; save(); };
      list.appendChild(li);
    });
    $("#qempty").hidden = items.length > 0;
    $("#qfoot").hidden = !items.length;
  }
  function toast(t) {
    var el = $("#toast"); if (!el) return; el.textContent = t; el.classList.add("show");
    clearTimeout(toast.t); toast.t = setTimeout(function () { el.classList.remove("show"); }, 1800);
  }
  function visible(el) {
    if (!el) return false; var r = el.getBoundingClientRect();
    return r.width > 0 && r.height > 0;
  }
  function fly(from) {
    if (reduce) return;
    var targets = [$(".bar [data-open-cart]"), $(".cart-btn")].filter(visible);
    var target = targets[0];
    if (!target || !from) return;
    var a = from.getBoundingClientRect(), b = target.getBoundingClientRect();
    var dot = d.createElement("div"); dot.className = "fly";
    dot.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 4h2.5l2.2 11.2a1 1 0 0 0 1 .8h8.6a1 1 0 0 0 1-.8L20 8H6.2"/><circle cx="9.5" cy="20" r="1.3"/><circle cx="17" cy="20" r="1.3"/></svg>';
    var sx = a.left + a.width / 2 - 22, sy = a.top + a.height / 2 - 22, ex = b.left + b.width / 2 - 22, ey = b.top + b.height / 2 - 22;
    dot.style.left = sx + "px"; dot.style.top = sy + "px"; d.body.appendChild(dot);
    var anim = dot.animate([
      { transform: "translate(0,0) scale(1)", opacity: 1 },
      { transform: "translate(" + ((ex - sx) * 0.5) + "px," + ((ey - sy) * 0.5 - 60) + "px) scale(.9)", opacity: 1, offset: 0.5 },
      { transform: "translate(" + (ex - sx) + "px," + (ey - sy) + "px) scale(.3)", opacity: 0.2 }
    ], { duration: 650, easing: "cubic-bezier(.5,0,.4,1)" });
    anim.onfinish = function () {
      dot.remove();
      $$("[data-qcount]").forEach(function (n) { n.classList.remove("bump"); void n.offsetWidth; n.classList.add("bump"); });
    };
  }
  function addItem(btn) {
    var wrap = btn.closest(".cact"), inp = wrap && $(".qtyin input", wrap);
    var q = Math.max(1, Math.min(999, parseInt(inp && inp.value, 10) || 1));
    var ds = btn.dataset, at = -1;
    items.forEach(function (i, k) { if (i.id === ds.id) at = k; });
    if (at > -1) items[at].q += q;
    else items.push({ id: ds.id, q: q, n: { en: ds.en, fr: ds.fr }, u: { en: ds.uen, fr: ds.ufr }, i: ds.icon, b: ds.brand, z: ds.size, ph: ds.ph });
    if (inp) inp.value = 1;
    fly(btn); save(); toast(T.toast);
  }
  function openDrawer() { if (!drawer) return; drawer.lastFocus = d.activeElement; drawer.classList.add("open"); drawer.removeAttribute("aria-hidden"); var x = $(".x", drawer); if (x) x.focus(); }
  function closeDrawer() { if (!drawer) return; drawer.classList.remove("open"); drawer.setAttribute("aria-hidden", "true"); if (drawer.lastFocus) drawer.lastFocus.focus(); }

  d.addEventListener("click", function (e) {
    var t = e.target;
    var b = t.closest(".add"); if (b) { addItem(b); return; }
    var m = t.closest(".qm,.qp");
    if (m) { var inp = $("input", m.parentNode); inp.value = Math.max(1, Math.min(999, (parseInt(inp.value, 10) || 1) + (m.classList.contains("qp") ? 1 : -1))); return; }
    var oc = t.closest("[data-open-cart]");
    if (oc && drawer && !$("body.p-cart")) { e.preventDefault(); openDrawer(); return; }
    if (t.closest("[data-close-cart]")) { closeDrawer(); return; }
    var th = t.closest(".pth");
    if (th) { var main = $("#pmain"); if (main) main.src = th.dataset.src; $$(".pth").forEach(function (x) { x.classList.toggle("on", x === th); }); }
  });
  d.addEventListener("keydown", function (e) { if (e.key === "Escape" && drawer && drawer.classList.contains("open")) closeDrawer(); });

  /* ---------- order message ---------- */
  function orderMessage(extra) {
    var lines = items.map(function (i) { return "- " + i.q + " x " + i.n[L] + (i.b ? " (" + i.b + ")" : ""); });
    return T.hello + "\n\n" + lines.join("\n") + (extra ? "\n\n" + extra : "") + "\n\n" + T.thanks;
  }
  function renderCartPage() {
    var list = $("#cart-list"); if (!list) return;
    list.innerHTML = "";
    items.forEach(function (it, k) {
      var li = d.createElement("li"); li.className = "ci";
      li.innerHTML = '<a class="cmedia" href="' + esc(it.u[L]) + '">' + thumbHtml(it) + '</a><div><a class="nm" href="' + esc(it.u[L]) + '">' + esc(it.n[L]) + '</a>' +
        '<div class="meta">' + esc([it.b, it.z].filter(Boolean).join(" · ")) + '</div><button type="button" class="rm">' + T.remove + '</button></div>' +
        '<div class="qtyin"><button type="button" class="qm" aria-label="-">&minus;</button><output style="min-width:34px;text-align:center;font-weight:600">' + it.q + '</output><button type="button" class="qp" aria-label="+">+</button></div>';
      $(".rm", li).onclick = function () { items.splice(k, 1); save(); };
      var q = $$(".qtyin button", li);
      q[0].onclick = function (ev) { ev.stopPropagation(); it.q--; if (it.q < 1) items.splice(k, 1); save(); };
      q[1].onclick = function (ev) { ev.stopPropagation(); it.q++; save(); };
      list.appendChild(li);
    });
    var has = items.length > 0;
    $("#cart-empty").hidden = has; $("#cart-more").hidden = !has;
    var side = $("#cart-side"); if (side) side.hidden = !has;
    var sn = $("#sum-n"); if (sn) sn.textContent = count();
    updateCartLinks();
  }
  var form = $("#cart-form");
  function formData() {
    var f = form.elements;
    var method = (f.method.value === "deliver");
    return { name: f.name.value.trim(), phone: f.phone.value.trim(), method: method, loc: f.loc.value.trim(), notes: f.notes.value.trim() };
  }
  function cartExtra() {
    var v = formData(), out = [T.name + ": " + v.name, T.phone + ": " + v.phone, v.method ? T.deliver + ": " + v.loc : T.collect];
    if (v.notes) out.push(T.notes + ": " + v.notes);
    return out.join("\n");
  }
  function updateCartLinks() {
    if (!form || !items.length) return;
    var msg = orderMessage(cartExtra());
    $("#c-wa").href = "https://wa.me/" + CFG.wa + "?text=" + encodeURIComponent(msg);
    $("#c-mail").href = "mailto:" + CFG.email + "?subject=" + encodeURIComponent(T.subject) + "&body=" + encodeURIComponent(msg);
  }
  function validCart() {
    var v = formData(), ok = true;
    function chk(id, eid, bad, msg) { var el = $("#" + id), er = $("#" + eid); el.closest(".fld").classList.toggle("bad", bad); er.textContent = bad ? msg : ""; if (bad && ok) { el.focus(); } ok = ok && !bad; }
    chk("c-name", "e-name", !v.name, T.name_req);
    chk("c-phone", "e-phone", v.phone.replace(/\D/g, "").length < 7, T.phone_req);
    chk("c-loc", "e-loc", v.method && !v.loc, T.loc_req);
    return ok;
  }
  if (form) {
    var saved = store.get("impala-customer", {});
    ["name", "phone", "loc", "notes"].forEach(function (k) { if (saved[k]) form.elements[k].value = saved[k]; });
    if (saved.method === "deliver") { form.elements.method.value = "deliver"; $("#loc-wrap").hidden = false; }
    form.addEventListener("input", function () {
      var v = formData(); store.set("impala-customer", { name: v.name, phone: v.phone, loc: v.loc, notes: v.notes, method: v.method ? "deliver" : "collect" });
      $("#loc-wrap").hidden = !v.method; updateCartLinks();
    });
    form.addEventListener("submit", function (e) { e.preventDefault(); });
    function done() { $("#cart-side").hidden = false; form.hidden = true; $("#cart-done").hidden = false; }
    ["c-wa", "c-mail"].forEach(function (id) {
      $("#" + id).addEventListener("click", function (e) { if (!validCart()) { e.preventDefault(); return; } updateCartLinks(); setTimeout(done, 400); });
    });
    $("#c-copy").addEventListener("click", function () {
      if (!validCart()) return;
      var msg = orderMessage(cartExtra());
      if (navigator.clipboard) navigator.clipboard.writeText(msg).then(function () { toast(T.copied); });
    });
    $("#c-back").addEventListener("click", function () { form.hidden = false; $("#cart-done").hidden = true; });
    $("#cart-clear").addEventListener("click", function () { items = []; save(); });
  }

  /* ---------- contact forms ---------- */
  $$(".msg-form").forEach(function (mf) {
    var f = function (n) { return mf.querySelector("[name=" + n + "]"); };
    var wa = $(".mf-wa", mf), ml = $(".mf-mail", mf);
    var err = function (n, m) { var e = mf.querySelector("[data-err=" + n + "]"); if (e) e.textContent = m || ""; var fl = f(n); if (fl) fl.closest(".fld").classList.toggle("bad", !!m); };
    var build = function () {
      var topic = f("topic").value, n = f("name").value.trim(), p = f("phone").value.trim(), em = f("email").value.trim();
      var msg = "[" + topic + "]\n" + f("text").value.trim() + "\n\n" + n + (p ? " (" + p + ")" : "") + (em ? "\n" + em : "");
      wa.href = "https://wa.me/" + CFG.wa + "?text=" + encodeURIComponent(msg);
      ml.href = "mailto:" + CFG.email + "?subject=" + encodeURIComponent(topic + " - " + n) + "&body=" + encodeURIComponent(msg);
    };
    mf.addEventListener("input", build); mf.addEventListener("change", build); build();
    mf.addEventListener("submit", function (e) { e.preventDefault(); });
    [wa, ml].forEach(function (a) {
      a.addEventListener("click", function (e) {
        var bn = !f("name").value.trim(), bp = f("phone").value.replace(/\D/g, "").length < 7, bt = !f("text").value.trim();
        err("name", bn ? T.name_req : ""); err("phone", bp ? T.phone_req : ""); err("text", bt ? T.mf_text : "");
        if (bn || bp || bt) { e.preventDefault(); (bn ? f("name") : bp ? f("phone") : f("text")).focus(); }
      });
    });
  });

/* ---------- category page: filters, sort, view ---------- */
  var cards = $("#cards");
  if (cards) {
    var all = $$(".card", cards), q = $("#q"), sortSel = $("#sort"), clr = $("#clear"), cnt = $("#count"), emp = $("#empty");
    var sel = { brand: [], size: [] };
    var origin = all.slice();
    var apply = function () {
      var words = norm(q.value.trim()).split(/\s+/).filter(Boolean), shown = 0;
      all.forEach(function (c) {
        var ok = words.every(function (w) { return c.dataset.s.indexOf(w) > -1; }) &&
          (!sel.brand.length || sel.brand.indexOf(c.dataset.brand) > -1) && (!sel.size.length || sel.size.indexOf(c.dataset.size) > -1);
        c.hidden = !ok; if (ok) shown++;
      });
      cnt.textContent = shown + " " + (shown === 1 ? T.product : T.products);
      emp.hidden = shown > 0; clr.hidden = !(sel.brand.length || sel.size.length || words.length);
    };
    var m = /[?&]q=([^&]*)/.exec(location.search); if (m) q.value = decodeURIComponent(m[1].replace(/\+/g, " "));
    q.addEventListener("input", apply);
    $$(".fchip[data-v]").forEach(function (b) {
      b.addEventListener("click", function () {
        var k = b.closest("[data-facet]").dataset.facet, v = b.dataset.v, i = sel[k].indexOf(v);
        if (i > -1) sel[k].splice(i, 1); else sel[k].push(v);
        b.setAttribute("aria-pressed", i === -1); apply();
      });
    });
    clr.addEventListener("click", function () { sel = { brand: [], size: [] }; q.value = ""; $$(".fchip[data-v]").forEach(function (b) { b.setAttribute("aria-pressed", "false"); }); apply(); });
    if (sortSel) sortSel.addEventListener("change", function () {
      var arr = origin.slice();
      if (sortSel.value === "az") arr.sort(function (a, b) { return a.dataset.az.localeCompare(b.dataset.az); });
      if (sortSel.value === "size") arr.sort(function (a, b) { return sizeVal(a.dataset.size) - sizeVal(b.dataset.size); });
      arr.forEach(function (c) { cards.appendChild(c); });
    });
    var view = store.get("impala-view", "grid");
    var setView = function (v) { cards.classList.toggle("list", v === "list"); $$("[data-view]").forEach(function (b) { b.setAttribute("aria-pressed", b.dataset.view === v); }); store.set("impala-view", v); };
    $$("[data-view]").forEach(function (b) { b.addEventListener("click", function () { setView(b.dataset.view); }); });
    setView(view); apply();
  }

  /* ---------- shop: smart filter over product rows ---------- */
  var shop = $("#shop");
  if (shop) {
    var qi = $("#q"), rowsEl = $("#rows"), res = $("#results"), grid = $("#results-grid"), more = $("#more"), cn = $("#count"), rem = $("#results-empty"), lf = $("#live-facets"), sortSel2 = $("#sort");
    var st = { q: "", cat: "", brands: [], sizes: [], sort: "", all: false }, data = null, hits = [], shownN = 0, PAGE = 48;
    var cardHtml = function (p) {
      var tags = (p.b ? '<span class="tag">' + esc(p.b) + '</span>' : "") + (p.z ? '<span class="tag sz">' + esc(p.z) + '</span>' : "");
      var media = p.ph ? '<img src="' + esc(p.ph) + '" alt="" loading="lazy" width="300" height="300">' : (ICONS()[p.i] || "");
      return '<article class="card"><a class="cmedia" href="' + esc(p.u[L]) + '" tabindex="-1" aria-hidden="true">' + media + '</a><div class="cbody">' +
        '<a class="ccat" href="' + esc(p.cu[L]) + '">' + esc(p.c[L]) + '</a><h3><a href="' + esc(p.u[L]) + '">' + esc(p[L]) + '</a></h3><div class="tags">' + tags + '</div>' +
        '<p class="price">' + T.price_req + '</p><div class="cact two"><a class="btn ghost sm" href="' + esc(p.u[L]) + '">' + T.view_details + '</a>' +
        '<button class="add" type="button" aria-pressed="false" data-id="' + p.id + '" data-en="' + esc(p.en) + '" data-fr="' + esc(p.fr) + '" data-uen="' + esc(p.u.en) + '" data-ufr="' + esc(p.u.fr) + '" data-icon="' + p.i + '" data-brand="' + esc(p.b) + '" data-size="' + esc(p.z) + '" data-ph="' + esc(p.ph) + '">' + T.add + '</button></div></div></article>';
    };
    var active = function () { return st.q.trim() || st.cat || st.brands.length || st.sizes.length || st.all; };
    var loadData = function (cb) { if (data) return cb(); fetch(CFG.dataUrl).then(function (r) { return r.json(); }).then(function (j) { data = j; cb(); }); };
    var group = function (label, key, counts, keys) {
      return '<div class="fgroup"><span class="flabel">' + label + '</span><div class="fchips">' + keys.map(function (k) {
        return '<button type="button" class="fchip" data-k="' + key + '" data-v="' + esc(k) + '" aria-pressed="' + (st[key].indexOf(k) > -1) + '">' + esc(k) + ' <small>' + counts[k] + '</small></button>';
      }).join("") + '</div></div>';
    };
    var renderFacets = function (base) {
      var b = {}, z = {};
      base.forEach(function (p) { if (p.b) b[p.b] = (b[p.b] || 0) + 1; if (p.z) z[p.z] = (z[p.z] || 0) + 1; });
      var bk = Object.keys(b).sort(function (x, y) { return b[y] - b[x]; }).slice(0, 24);
      var zk = Object.keys(z).sort(function (x, y) { return z[y] - z[x]; }).slice(0, 30).sort(function (x, y) { return sizeVal(x) - sizeVal(y) || x.localeCompare(y); });
      var html = "";
      if (bk.length > 1) html += group(L === "fr" ? "Marque" : "Brand", "brands", b, bk);
      if (zk.length > 1) html += group(L === "fr" ? "Taille" : "Size", "sizes", z, zk);
      lf.innerHTML = html + '<button type="button" class="clear" data-clear>' + T.clear + '</button>';
      lf.hidden = false;
    };
    var draw = function (append) {
      var slice = hits.slice(shownN, shownN + PAGE);
      if (!append) grid.innerHTML = "";
      grid.insertAdjacentHTML("beforeend", slice.map(cardHtml).join(""));
      shownN += slice.length; more.hidden = shownN >= hits.length; sync();
    };
    var words = function () { return norm(st.q.trim()).split(/\s+/).filter(Boolean); };
    var run = function (rebuildFacets) {
      if (!active()) { rowsEl.hidden = false; res.hidden = true; lf.hidden = true; cn.textContent = ""; return; }
      loadData(function () {
        var w = words();
        var base = data.filter(function (p) { return (!st.cat || p.c.en === st.cat) && w.every(function (x) { return p.s.indexOf(x) > -1; }); });
        if (rebuildFacets !== false) renderFacets(base);
        hits = base.filter(function (p) { return (!st.brands.length || st.brands.indexOf(p.b) > -1) && (!st.sizes.length || st.sizes.indexOf(p.z) > -1); });
        if (st.sort === "az") hits.sort(function (a, b) { return norm(a[L]).localeCompare(norm(b[L])); });
        if (st.sort === "size") hits.sort(function (a, b) { return sizeVal(a.z) - sizeVal(b.z); });
        rowsEl.hidden = true; res.hidden = false; shownN = 0;
        cn.textContent = hits.length + " " + (hits.length === 1 ? T.product : T.products);
        rem.hidden = hits.length > 0; draw(false);
      });
    };
    var setCat = function (c) {
      st.cat = c; st.brands = []; st.sizes = [];
      $$(".catchips .fchip").forEach(function (b) { b.setAttribute("aria-pressed", b.dataset.cat === c); });
    };
    var tm; qi.addEventListener("input", function () { st.q = qi.value; st.brands = []; st.sizes = []; st.all = false; clearTimeout(tm); tm = setTimeout(run, 120); });
    if (sortSel2) sortSel2.addEventListener("change", function () { st.sort = sortSel2.value; run(false); });
    $$(".catchips .fchip").forEach(function (b) { b.addEventListener("click", function () { st.all = false; setCat(b.dataset.cat); run(); }); });
    lf.addEventListener("click", function (e) {
      var c = e.target.closest(".fchip"), x = e.target.closest("[data-clear]");
      if (c) { var k = c.dataset.k, v = c.dataset.v, i = st[k].indexOf(v); if (i > -1) st[k].splice(i, 1); else st[k].push(v); c.setAttribute("aria-pressed", i === -1); run(false); }
      if (x) { st = { q: "", cat: "", brands: [], sizes: [], sort: st.sort, all: false }; qi.value = ""; setCat(""); run(); }
    });
    more.addEventListener("click", function () { draw(true); });
    var showAll = $("#showall"); if (showAll) showAll.addEventListener("click", function () { st.all = true; run(); });
    window.IMPALA_SHOP = { set: function (q, cat) { qi.value = q || ""; st.q = qi.value; st.all = false; setCat(cat || ""); run(); var r = shop.getBoundingClientRect(); window.scrollTo({ top: window.scrollY + r.top - 76, behavior: reduce ? "auto" : "smooth" }); } };
    var mq = /[?&]q=([^&]*)/.exec(location.search); if (mq) { qi.value = decodeURIComponent(mq[1].replace(/\+/g, " ")); st.q = qi.value; run(); }
  }

/* ---------- hero suggestions ---------- */
  var hs = $("#hero-q"), sg = $("#sugg"), sdata = null, idx = -1;
  if (hs && sg) {
    var load = function () { if (sdata) return Promise.resolve(); return fetch(CFG.dataUrl).then(function (r) { return r.json(); }).then(function (j) { sdata = j; }); };
    var render = function () {
      var term = norm(hs.value.trim()); idx = -1;
      if (term.length < 2 || !sdata) { sg.hidden = true; hs.setAttribute("aria-expanded", "false"); return; }
      var words = term.split(/\s+/);
      var h = sdata.filter(function (p) { return words.every(function (w) { return p.s.indexOf(w) > -1; }); }).slice(0, 7);
      sg.innerHTML = "";
      h.forEach(function (p) {
        var li = d.createElement("li"), a = d.createElement("a");
        a.href = p.u[L]; a.innerHTML = "<span></span><small></small>";
        a.firstChild.textContent = p[L]; a.lastChild.textContent = p.c[L];
        li.appendChild(a); sg.appendChild(li);
      });
      sg.hidden = !h.length; hs.setAttribute("aria-expanded", String(!!h.length));
    };
    hs.addEventListener("focus", function () { load().then(render); });
    hs.addEventListener("input", function () { load().then(render); });
    hs.addEventListener("keydown", function (e) {
      var its = $$("a", sg);
      if (e.key === "ArrowDown" || e.key === "ArrowUp") {
        if (!its.length) return; e.preventDefault();
        idx = (idx + (e.key === "ArrowDown" ? 1 : -1) + its.length) % its.length;
        its.forEach(function (a, i) { a.setAttribute("aria-selected", i === idx); });
      } else if (e.key === "Enter" && idx > -1) { e.preventDefault(); location.href = its[idx].href; }
      else if (e.key === "Escape") { sg.hidden = true; }
    });
    d.addEventListener("click", function (e) { if (!e.target.closest(".search")) sg.hidden = true; });
    if (hs.form && window.IMPALA_SHOP) hs.form.addEventListener("submit", function (e) { e.preventDefault(); sg.hidden = true; window.IMPALA_SHOP.set(hs.value, ""); });
  }
  $$(".chips a[data-q]").forEach(function (a) { a.addEventListener("click", function (e) { if (window.IMPALA_SHOP) { e.preventDefault(); window.IMPALA_SHOP.set(a.dataset.q, ""); } }); });

  /* ---------- photo viewer ---------- */
  var shots = $$("[data-lb]");
  if (shots.length) {
    var lb = d.createElement("div"), cur = 0, lastBtn;
    lb.className = "lb"; lb.hidden = true; lb.setAttribute("role", "dialog"); lb.setAttribute("aria-modal", "true");
    lb.innerHTML = '<button type="button" class="lb-x" aria-label="' + T.close + '">&times;</button><button type="button" class="lb-p" aria-label="' + T.prev + '">&#8249;</button><figure><img alt=""><figcaption></figcaption></figure><button type="button" class="lb-n" aria-label="' + T.next + '">&#8250;</button>';
    d.body.appendChild(lb);
    var show = function (i) {
      cur = (i + shots.length) % shots.length;
      var b = shots[cur]; $("img", lb).src = b.dataset.src; $("img", lb).alt = b.dataset.cap; $("figcaption", lb).textContent = b.dataset.cap;
    };
    var openLb = function (i, btn) { lastBtn = btn; show(i); lb.hidden = false; d.body.style.overflow = "hidden"; $(".lb-x", lb).focus(); };
    var closeLb = function () { lb.hidden = true; d.body.style.overflow = ""; if (lastBtn) lastBtn.focus(); };
    shots.forEach(function (b, i) { b.addEventListener("click", function () { openLb(i, b); }); });
    lb.addEventListener("click", function (e) {
      if (e.target.closest(".lb-x") || e.target === lb) closeLb();
      else if (e.target.closest(".lb-p")) show(cur - 1);
      else if (e.target.closest(".lb-n")) show(cur + 1);
    });
    d.addEventListener("keydown", function (e) {
      if (lb.hidden) return;
      if (e.key === "Escape") closeLb(); else if (e.key === "ArrowLeft") show(cur - 1); else if (e.key === "ArrowRight") show(cur + 1);
    });
  }

  /* keep the cart in step across tabs */
  window.addEventListener("storage", function (e) { if (e.key === "impala-cart") { items = store.get("impala-cart", []); sync(); } });
  window.addEventListener("load", sync);
  sync();
})();
