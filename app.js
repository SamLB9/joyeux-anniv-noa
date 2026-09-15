/* ═══════════════════════════════════════════════════════════
   app.js : sept écrans, un routeur, aucune dépendance.
   Tous les textes sont dans content.js.
   ═══════════════════════════════════════════════════════════ */
(function () {
  "use strict";

  var C = window.CONTENT || CONTENT;
  var $ = function (id) { return document.getElementById(id); };
  var reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* ---------------------------------------------------------
     helpers
     --------------------------------------------------------- */
  function cap(s) { return s.charAt(0).toUpperCase() + s.slice(1); }
  function dayLabel(d) {
    return cap(d.toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long" }));
  }
  function timeLabel(d) {
    return d.getHours() + "h" + String(d.getMinutes()).padStart(2, "0");
  }
  function sameDay(a, b) {
    return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
  }
  function announce(msg) { $("live").textContent = msg; }

  var D0 = C.dinner;
  var DINNER = new Date(D0.year, D0.month - 1, D0.day, D0.hour, D0.minute, 0, 0);

  function vars(extra) {
    var v = {
      you: C.you, her: C.her,
      herName: C.her ? " " + C.her : "",
      day: dayLabel(DINNER), time: timeLabel(DINNER)
    };
    if (picked) { v.day = picked.day; v.time = picked.time; }
    v.dayLower = v.day.charAt(0).toLowerCase() + v.day.slice(1);
    for (var k in extra) v[k] = extra[k];
    return v;
  }
  function fill(tpl, v) {
    v = v || vars();
    return String(tpl).replace(/\{(\w+)\}/g, function (m, k) {
      return v[k] != null ? v[k] : m;
    });
  }

  /* the evening she lands on, filled in at screen 5 or 6 */
  var picked = null;   // { date, day, time, moved }
  function pick(date, moved) {
    picked = { date: date, day: dayLabel(date), time: timeLabel(date), moved: moved };
  }

  /* ---------------------------------------------------------
     real viewport height (iOS Safari toolbar)
     --------------------------------------------------------- */
  function measure() {
    var vv = window.visualViewport;
    var h = vv ? vv.height : window.innerHeight;
    document.documentElement.style.setProperty("--app-h", Math.round(h) + "px");
  }
  measure();
  window.addEventListener("resize", measure);
  window.addEventListener("orientationchange", measure);
  if (window.visualViewport) window.visualViewport.addEventListener("resize", measure);

  /* ---------------------------------------------------------
     ROUTER
     --------------------------------------------------------- */
  var ACTS = ["gift", "intro", "reveal", "pay", "slot", "pick", "done"];
  var current = null, muteHash = false;

  function showAct(name) {
    if (name === current) return;
    ACTS.forEach(function (a) {
      var el = $("act-" + a);
      if (a === name) {
        el.hidden = false;
        el.classList.remove("act--entering");
        void el.offsetWidth;
        el.classList.add("act--entering");
      } else {
        el.hidden = true;
      }
    });
    current = name;
    syncMusicBtn();
    window.scrollTo(0, 0);
    muteHash = true;
    location.hash = name;
    setTimeout(function () { muteHash = false; }, 0);
    if (name === "intro") syncDeck(true);
  }

  window.addEventListener("hashchange", function () {
    if (muteHash) return;
    var want = location.hash.replace("#", "");
    if (ACTS.indexOf(want) < 0) return;
    ensureBuilt(want);
    showAct(want);
  });

  function ensureBuilt(name) {
    if (name === "pick") buildPick();
    if (name === "done") { if (!picked) pick(DINNER, false); buildDone(); }
  }

  /* ═══════════ 1. le paquet ═══════════ */
  var G = C.gift, box = $("giftBox"), taps = 0, opening = false;

  function buildGift() {
    $("giftEyebrow").textContent = G.eyebrow;
    $("giftTitle").textContent = fill(G.title);
    $("giftSub").textContent = G.sub ? fill(G.sub) : "";
    $("giftHint").textContent = G.hints[0];
  }

  box.addEventListener("click", function () {
    if (opening) return;
    taps++;
    box.classList.remove("is-shaking");
    void box.getBoundingClientRect();
    box.classList.add("is-shaking");
    $("giftHint").textContent = G.hints[Math.min(taps, G.hints.length - 1)];
    if (taps >= 3) openGift();
  });
  box.addEventListener("animationend", function () { box.classList.remove("is-shaking"); });

  function openGift() {
    opening = true;
    playMusic();   /* same tap as the third shake: browsers allow sound here */
    box.classList.add("is-open");
    box.setAttribute("aria-disabled", "true");
    var loader = $("loader"), bar = $("loaderFill"), label = $("loaderLabel");

    setTimeout(function () {
      $("giftHint").textContent = "";
      loader.hidden = false;
      var dur = reduced ? 1 : 1700, t0 = performance.now();

      (function step(now) {
        var k = Math.min(1, (now - t0) / dur);
        var eased = 1 - Math.pow(1 - k, 3);
        var pct = Math.round(eased * 99);
        bar.style.width = pct + "%";
        label.textContent = fill(G.loading, vars({ pct: pct }));
        if (k < 1) { requestAnimationFrame(step); return; }

        /* stuck at 99 % : the joke */
        setTimeout(function () {
          label.textContent = G.shy;
          setTimeout(function () {
            bar.style.transition = "width 300ms ease-out";
            bar.style.width = "100%";
            label.textContent = G.ready;
            confetti();
            setTimeout(function () { showAct("intro"); }, reduced ? 300 : 1300);
          }, reduced ? 300 : 1600);
        }, reduced ? 0 : 500);
      })(t0);
    }, reduced ? 0 : 500);
  }

  /* ═══════════ 2. les cartes ═══════════ */
  var track = $("deckTrack"), dotsWrap = $("deckDots"), deckIndex = 0;

  var PLACEHOLDER =
    '<div class="card__ph"><svg viewBox="0 0 24 24" aria-hidden="true">' +
    '<rect x="3" y="5" width="18" height="14" rx="2.5"/><circle cx="8.5" cy="10" r="1.6"/>' +
    '<path d="M4 17l4.5-4.5a2 2 0 0 1 2.8 0L16 17M14.5 15l1.7-1.7a2 2 0 0 1 2.8 0L21 15"/>' +
    '</svg><span>photo</span></div>';

  function buildDeck() {
    C.slides.forEach(function (s, i) {
      var card = document.createElement("article");
      card.className = "card";
      card.setAttribute("role", "group");
      card.setAttribute("aria-roledescription", "carte");
      card.setAttribute("aria-label", (i + 1) + " sur " + C.slides.length);

      var media = null;
      if (s.photo) {
        media = document.createElement("div");
        media.className = "card__media";
        media.innerHTML = PLACEHOLDER;
        var img = new Image();
        img.alt = s.headline || s.caption || "";
        img.decoding = "async";
        if (s.focus) img.style.objectPosition = s.focus;
        img.onload = function () {
          img.classList.add("is-loaded");
          var ph = media.querySelector(".card__ph");
          if (ph) ph.remove();
        };
        img.onerror = function () { img.remove(); };
        img.src = s.photo;
        media.appendChild(img);
      } else if (s.list) {
        card.classList.add("card--list");
      } else {
        card.classList.add("card--quiet");
      }

      var body = document.createElement("div");
      body.className = "card__body";
      if (card.classList.contains("card--quiet")) {
        /* a small "</> + heart" mark fills the empty top of the text card */
        var badge = document.createElement("div");
        badge.className = "card__badge";
        badge.setAttribute("aria-hidden", "true");
        badge.innerHTML =
          '<svg viewBox="0 0 64 56" fill="none" stroke="#FFFFFF" stroke-width="3.4" stroke-linecap="round" stroke-linejoin="round">' +
            '<path d="M15 16L4 28l11 12"/><path d="M49 16l11 12-11 12"/>' +
            '<path fill="#FDA4AF" stroke="none" d="M32 41c-.8 0-1.5-.3-2.1-.8C23.4 34.6 20 31.4 20 26.6 20 22.9 22.8 20 26.3 20c2.4 0 4.4 1.2 5.7 3.2C33.3 21.2 35.3 20 37.7 20c3.5 0 6.3 2.9 6.3 6.6 0 4.8-3.4 8-9.9 13.6-.6.5-1.3.8-2.1.8z"/>' +
          '</svg>';
        body.appendChild(badge);
      }
      if (s.eyebrow) {
        var e = document.createElement("p");
        e.className = "card__eyebrow"; e.textContent = s.eyebrow;
        body.appendChild(e);
      }
      if (s.headline) {
        var h = document.createElement("h2");
        h.className = "card__headline"; h.textContent = s.headline;
        body.appendChild(h);
      }
      if (s.list) {
        var ul = document.createElement("ul");
        ul.className = "card__list";
        s.list.forEach(function (item, j) {
          var li = document.createElement("li");
          li.style.animationDelay = (reduced ? 0 : 120 + j * 110) + "ms";
          var sp = document.createElement("span");
          sp.textContent = item;
          li.appendChild(sp);
          ul.appendChild(li);
        });
        body.appendChild(ul);
      }
      if (s.caption) {
        var p = document.createElement("p");
        p.className = "card__caption"; p.textContent = s.caption;
        body.appendChild(p);
      }
      if (s.kicker) {
        var kk = document.createElement("p");
        kk.className = "card__kicker"; kk.textContent = s.kicker;
        body.appendChild(kk);
      }

      if (media) card.appendChild(media);
      card.appendChild(body);
      track.appendChild(card);

      var dot = document.createElement("button");
      dot.type = "button";
      dot.className = "dot";
      dot.setAttribute("role", "tab");
      dot.setAttribute("aria-label", "Carte " + (i + 1));
      dot.setAttribute("aria-selected", i === 0 ? "true" : "false");
      dot.addEventListener("click", function () { goToCard(i); });
      dotsWrap.appendChild(dot);
    });
  }

  function goToCard(i) {
    var card = track.children[i];
    if (!card) return;
    track.scrollTo({
      left: card.offsetLeft - (track.clientWidth - card.clientWidth) / 2,
      behavior: reduced ? "auto" : "smooth"
    });
  }

  function syncDeck(force) {
    var mid = track.scrollLeft + track.clientWidth / 2, best = 0, bestD = Infinity;
    for (var i = 0; i < track.children.length; i++) {
      var c = track.children[i];
      var d = Math.abs(c.offsetLeft + c.clientWidth / 2 - mid);
      if (d < bestD) { bestD = d; best = i; }
    }
    if (best === deckIndex && !force) return;
    deckIndex = best;
    for (var j = 0; j < dotsWrap.children.length; j++) {
      dotsWrap.children[j].setAttribute("aria-selected", j === best ? "true" : "false");
    }
    $("deckPrev").disabled = best === 0;
    var last = best === C.slides.length - 1;
    $("deckNextLabel").textContent = last ? C.introCta : C.next;
    $("deckNext").querySelector(".btn__chev").style.display = last ? "none" : "";
  }

  var ticking = false;
  track.addEventListener("scroll", function () {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(function () { syncDeck(); ticking = false; });
  }, { passive: true });

  $("deckPrev").addEventListener("click", function () { goToCard(deckIndex - 1); });
  $("deckNext").addEventListener("click", function () {
    if (deckIndex < C.slides.length - 1) goToCard(deckIndex + 1);
    else { showAct("reveal"); confetti(); }
  });

  /* ═══════════ 3. la révélation ═══════════ */
  function buildReveal() {
    var R = C.reveal, v = vars();
    $("vEyebrow").textContent = R.eyebrow;
    $("vTitle").textContent = fill(R.title, v);
    $("vSub").textContent = fill(R.sub, v);
    var rows = $("vRows");
    rows.innerHTML = "";
    R.rows.forEach(function (r) {
      var wrap = document.createElement("div");
      wrap.className = "voucher__row";
      var dt = document.createElement("dt"); dt.textContent = r.label;
      var dd = document.createElement("dd"); dd.textContent = fill(r.value, v);
      wrap.appendChild(dt); wrap.appendChild(dd);
      rows.appendChild(wrap);
    });
    $("vNote").textContent = fill(R.note, v);
    $("revealNext").textContent = R.cta;
  }
  $("revealNext").addEventListener("click", function () { showAct("pay"); });

  /* ═══════════ 4. le Non qui s'enfuit ═══════════ */
  var noBtn = $("noBtn"), yesBtn = $("yesBtn"), aside = $("askAside");
  var dodges = 0, lastPos = null, loose = false, lastDodgeAt = 0, spacer = null;

  function buildAsk() {
    $("askQ").textContent = C.ask.question;
    yesBtn.textContent = C.ask.yes;
    noBtn.textContent = C.ask.noLabels[0];
    if (C.ask.photo) {
      var img = new Image();
      img.alt = "";
      if (C.ask.focus) img.style.objectPosition = C.ask.focus;
      img.onerror = function () { img.remove(); };
      img.src = C.ask.photo;
      $("askPhoto").appendChild(img);
    }
  }

  function viewport() {
    var v = window.visualViewport;
    return { w: v ? v.width : window.innerWidth, h: v ? v.height : window.innerHeight };
  }

  function dodge(ev) {
    if (ev) ev.preventDefault();
    if (current !== "pay") return;
    if (noBtn.classList.contains("is-gone")) return;
    if (Date.now() - lastDodgeAt < 180) return;

    var vp = viewport();
    var pad = 12;

    /* first dodge: detach in place and leave a spacer, so "Deal" does not
       slide under her finger and swallow the tap meant for No */
    if (!loose) {
      var r = noBtn.getBoundingClientRect();
      lastPos = { x: r.left, y: r.top };
      spacer = document.createElement("span");
      spacer.setAttribute("aria-hidden", "true");
      spacer.style.cssText = "display:inline-block;pointer-events:none;visibility:hidden;" +
        "width:" + r.width + "px;height:" + r.height + "px;";
      noBtn.parentNode.insertBefore(spacer, noBtn);
      noBtn.classList.add("is-loose");
      noBtn.style.left = r.left + "px";
      noBtn.style.top = r.top + "px";
      void noBtn.offsetWidth;
      loose = true;
    }

    dodges++;
    lastDodgeAt = Date.now();
    noBtn.textContent = C.ask.noLabels[Math.min(dodges, C.ask.noLabels.length - 1)];

    var w = noBtn.offsetWidth, h = noBtn.offsetHeight;
    var maxX = Math.max(pad, vp.w - w - pad);
    var maxY = Math.max(pad, vp.h - h - pad);
    var x, y, tries = 0;
    do {
      x = pad + Math.random() * (maxX - pad);
      y = pad + Math.random() * (maxY - pad);
      tries++;
    } while (tries < 24 && lastPos &&
             Math.hypot(x - lastPos.x, y - lastPos.y) < Math.min(140, vp.w * 0.45));
    lastPos = { x: x, y: y };
    noBtn.style.left = x + "px";
    noBtn.style.top = y + "px";

    noBtn.style.transform = "scale(" + Math.max(0.6, 1 - dodges * 0.07) + ")";
    yesBtn.style.transform = "scale(" + Math.min(1.34, 1 + dodges * 0.05) + ")";

    if (dodges >= C.ask.noLabels.length) {
      noBtn.classList.add("is-gone");
      noBtn.setAttribute("aria-hidden", "true");
      noBtn.tabIndex = -1;
      aside.textContent = C.ask.noGone;
      aside.classList.add("is-on");
      /* No has left for good : let Deal take the centre again */
      setTimeout(function () { if (spacer) { spacer.remove(); spacer = null; } }, reduced ? 0 : 300);
    }
  }

  noBtn.addEventListener("pointerenter", dodge);
  noBtn.addEventListener("pointerdown", dodge);
  noBtn.addEventListener("click", dodge);

  window.addEventListener("resize", function () {
    if (!loose || noBtn.classList.contains("is-gone")) return;
    var vp = viewport();
    noBtn.style.left = Math.min(parseFloat(noBtn.style.left) || 0, Math.max(12, vp.w - noBtn.offsetWidth - 12)) + "px";
    noBtn.style.top = Math.min(parseFloat(noBtn.style.top) || 0, Math.max(12, vp.h - noBtn.offsetHeight - 12)) + "px";
  });

  /* the fixed-position No must not follow her to the next screen */
  function parkNo() {
    if (loose && !noBtn.classList.contains("is-gone")) noBtn.classList.add("is-gone");
  }

  yesBtn.addEventListener("click", function () {
    if (Date.now() - lastDodgeAt < 400) return;
    parkNo();
    confetti();
    setTimeout(function () { showAct("slot"); }, reduced ? 0 : 620);
  });

  /* ═══════════ 5. le créneau ═══════════ */
  function buildSlot() {
    var S = C.slot, v = vars({ day: dayLabel(DINNER), time: timeLabel(DINNER) });
    $("tileTop").textContent = DINNER.toLocaleDateString("fr-FR", { weekday: "long" });
    $("tileDay").textContent = DINNER.getDate();
    $("tileTime").textContent = timeLabel(DINNER);
    $("slotEyebrow").textContent = S.eyebrow;
    $("slotTitle").textContent = fill(S.title, v);
    $("slotSub").textContent = fill(S.sub, v);
    $("slotYes").textContent = S.yes;
    $("slotNo").textContent = S.no;
  }

  $("slotYes").addEventListener("click", function () {
    pick(DINNER, false);
    finish();
  });
  $("slotNo").addEventListener("click", function () {
    buildPick();
    showAct("pick");
  });

  /* ═══════════ 6. un autre soir ═══════════ */
  var P = C.pick;

  function buildPick() {
    var v = vars({ day: dayLabel(DINNER), time: timeLabel(DINNER) });
    $("pickTitle").textContent = P.title;
    $("pickSub").textContent = fill(P.sub, v);
    $("pickBack").textContent = P.back;

    var grid = $("dayGrid");
    grid.innerHTML = "";
    var today = new Date(); today.setHours(0, 0, 0, 0);
    var shown = 0;
    for (var off = 1; shown < P.days && off < 60; off++) {
      var d = new Date(today);
      d.setDate(today.getDate() + off);
      d.setHours(DINNER.getHours(), DINNER.getMinutes(), 0, 0);
      if (sameDay(d, DINNER)) continue;
      grid.appendChild(dayButton(d, shown));
      shown++;
    }
  }

  function isoKey(d) {
    return d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, "0") + "-" + String(d.getDate()).padStart(2, "0");
  }
  /* evening d is closed if that day is a holiday, or if a holiday or shabbat
     starts at sunset (the next day). Holiday names win over shabbat. */
  function closedFor(d) {
    var H = P.holidays || {};
    var next = new Date(d); next.setDate(d.getDate() + 1);
    return H[isoKey(next)] || H[isoKey(d)] || (d.getDay() === 5 ? P.shabbat : null);
  }

  function dayButton(d, i) {
    var b = document.createElement("button");
    b.type = "button";
    b.className = "daybtn";
    b.style.animationDelay = (reduced ? 0 : i * 30) + "ms";
    var wk = document.createElement("small");
    wk.textContent = d.toLocaleDateString("fr-FR", { weekday: "short" }).replace(".", "");
    var num = document.createElement("strong");
    num.textContent = d.getDate();
    var mo = document.createElement("small");
    b.appendChild(wk); b.appendChild(num); b.appendChild(mo);

    /* a kosher restaurant is closed on Friday night and on holiday nights */
    var closed = closedFor(d);
    if (closed) {
      b.disabled = true;
      b.classList.add("daybtn--closed");
      mo.textContent = closed;
      b.setAttribute("aria-label", dayLabel(d) + ", fermé pour " + closed);
    } else {
      mo.textContent = d.toLocaleDateString("fr-FR", { month: "short" }).replace(".", "");
      b.setAttribute("aria-label", dayLabel(d));
      b.addEventListener("click", function () { openSheet(d); });
    }
    return b;
  }

  function openSheet(date) {
    pick(date, true);
    $("sheetLine").textContent = fill(P.confirmLine);
    $("sheetConfirm").textContent = P.confirmCta;
    $("sheetCancel").textContent = P.changeCta;
    $("scrim").hidden = false;
    $("sheet").hidden = false;
    $("sheetConfirm").focus();
    announce(fill(P.confirmLine));
  }
  function closeSheet() {
    $("scrim").hidden = true;
    $("sheet").hidden = true;
  }
  $("sheetCancel").addEventListener("click", closeSheet);
  $("scrim").addEventListener("click", closeSheet);
  document.addEventListener("keydown", function (e) {
    if (e.key === "Escape" && !$("sheet").hidden) closeSheet();
  });
  $("sheetConfirm").addEventListener("click", function () {
    closeSheet();
    finish();
  });
  $("pickBack").addEventListener("click", function () { showAct("slot"); });

  /* ═══════════ 7. confirmation ═══════════ */
  var DN = C.done;

  function finish() {
    buildDone();
    showAct("done");
    confetti();
    /* real user gesture, so iOS lets WhatsApp open */
    if (hasPhone()) {
      var w = window.open(waURL(), "_blank");
      if (!w) location.href = waURL();
    }
  }

  function messageText() { return fill(picked.moved ? DN.messageMoved : DN.messageSame); }
  function digits() { return String(C.phone || "").replace(/\D/g, ""); }
  function hasPhone() { var d = digits(); return d.length >= 8 && !/^0+$/.test(d); }
  /* NOT wa.me : its redirect mangles emoji, the heart arrives as U+FFFD
     and shows as a "?" box. api.whatsapp.com/send keeps the bytes intact. */
  function waURL() {
    return "https://api.whatsapp.com/send?phone=" + digits() + "&text=" + encodeURIComponent(messageText());
  }
  function smsURL() {
    var sep = /iPhone|iPad|Macintosh/.test(navigator.userAgent) ? "&" : "?";
    return "sms:+" + digits() + sep + "body=" + encodeURIComponent(messageText());
  }

  var cdTimer = null;
  function renderCountdown() {
    var ms = picked.date.getTime() - Date.now(), el = $("countdown");
    if (ms <= 0) { el.textContent = DN.countdownNow; return; }
    var mins = Math.floor(ms / 60000);
    var d = Math.floor(mins / 1440), h = Math.floor((mins % 1440) / 60), m = mins % 60;
    el.textContent = d > 0
      ? fill(DN.countdownDays, vars({ d: d, h: h }))
      : fill(DN.countdownHours, vars({ h: h, m: String(m).padStart(2, "0") }));
  }

  function buildDone() {
    $("doneHeadline").textContent = fill(DN.headline);
    $("doneLine").textContent = fill(DN.line);
    $("doneCaption").textContent = fill(picked.moved ? DN.captionMoved : DN.captionSame);
    $("doneFoot").textContent = DN.footnote;

    renderCountdown();
    clearInterval(cdTimer);
    cdTimer = setInterval(renderCountdown, 30000);

    var wa = $("waBtn");
    wa.textContent = fill(DN.whatsappCta);
    wa.href = waURL();
    if (!hasPhone()) {
      wa.removeAttribute("href");
      wa.textContent = "⚠ numéro manquant dans content.js";
      wa.style.opacity = ".6";
    }
    $("calBtn").textContent = DN.calendarCta;
    $("copyBtn").textContent = DN.copyCta;
    var sms = $("smsBtn");
    sms.textContent = DN.smsFallback;
    sms.href = smsURL();

    announce(fill(DN.headline) + " " + fill(DN.line));
  }

  $("copyBtn").addEventListener("click", function () {
    var txt = messageText(), btn = this;
    var done = function () {
      btn.textContent = DN.copyDone;
      setTimeout(function () { btn.textContent = DN.copyCta; }, 2000);
    };
    function fallback() {
      var ta = document.createElement("textarea");
      ta.value = txt; ta.setAttribute("readonly", "");
      ta.style.cssText = "position:fixed;top:-1000px";
      document.body.appendChild(ta); ta.select();
      try { document.execCommand("copy"); done(); } catch (e) {}
      ta.remove();
    }
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(txt).then(done, fallback);
    } else fallback();
  });

  $("calBtn").addEventListener("click", function () {
    var start = picked.date;
    var end = new Date(start.getTime() + (DN.durationHours || 2) * 3600000);
    var z = function (d) { return d.toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, ""); };
    var esc = function (s) { return String(s).replace(/([,;\\])/g, "\\$1"); };
    var ics = [
      "BEGIN:VCALENDAR", "VERSION:2.0", "PRODID:-//anniv-diner//FR",
      "CALSCALE:GREGORIAN", "BEGIN:VEVENT",
      "UID:" + start.getTime() + "@anniv-diner",
      "DTSTAMP:" + z(new Date()),
      "DTSTART:" + z(start),
      "DTEND:" + z(end),
      "SUMMARY:" + esc(fill(DN.eventTitle)),
      "DESCRIPTION:" + esc(fill(DN.eventNote)),
      "END:VEVENT", "END:VCALENDAR"
    ].join("\r\n");
    var url = URL.createObjectURL(new Blob([ics], { type: "text/calendar;charset=utf-8" }));
    var a = document.createElement("a");
    a.href = url; a.download = "diner.ics";
    document.body.appendChild(a); a.click(); a.remove();
    setTimeout(function () { URL.revokeObjectURL(url); }, 1000);
  });

  /* ---- confetti ------------------------------------------- */
  function confetti() {
    if (reduced) return;
    var cv = $("confetti"), ctx = cv.getContext("2d");
    var dpr = Math.min(window.devicePixelRatio || 1, 2);
    var vw = window.innerWidth, vh = window.innerHeight;
    cv.width = vw * dpr; cv.height = vh * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    var colors = ["#E11D48", "#FB7185", "#EA580C", "#FDA4AF", "#FBBF24", "#FFFFFF"];
    var bits = [];
    for (var i = 0; i < 130; i++) {
      bits.push({
        x: vw / 2 + (Math.random() - 0.5) * 120, y: vh * 0.55,
        vx: (Math.random() - 0.5) * 15, vy: -8 - Math.random() * 13,
        w: 6 + Math.random() * 7, h: 9 + Math.random() * 9,
        rot: Math.random() * Math.PI, vr: (Math.random() - 0.5) * 0.32,
        c: colors[(Math.random() * colors.length) | 0]
      });
    }
    var t0 = performance.now();
    (function frame(now) {
      var age = now - t0;
      ctx.clearRect(0, 0, vw, vh);
      for (var k = 0; k < bits.length; k++) {
        var b = bits[k];
        b.vy += 0.42; b.vx *= 0.995; b.x += b.vx; b.y += b.vy; b.rot += b.vr;
        ctx.save();
        ctx.globalAlpha = Math.max(0, 1 - age / 2400);
        ctx.translate(b.x, b.y); ctx.rotate(b.rot);
        ctx.fillStyle = b.c;
        ctx.fillRect(-b.w / 2, -b.h / 2, b.w, b.h);
        ctx.restore();
      }
      if (age < 2400) requestAnimationFrame(frame);
      else ctx.clearRect(0, 0, vw, vh);
    })(t0);
  }

  /* ═══════════ music ═══════════ */
  var M = C.music || null, audio = null, musicWanted = false;
  var musicBtn = $("musicBtn");

  function ensureAudio() {
    if (audio || !M || !M.src) return audio;
    audio = new Audio(M.src);
    audio.loop = true;
    audio.preload = "auto";
    return audio;
  }
  /* iOS ignores audio.volume, so there the song simply starts at full level */
  function fadeTo(target, ms) {
    var from = audio.volume, t0 = performance.now();
    (function step(now) {
      var k = Math.min(1, (now - t0) / ms);
      audio.volume = from + (target - from) * k;
      if (k < 1 && musicWanted) requestAnimationFrame(step);
    })(t0);
  }
  function playMusic() {
    if (!ensureAudio()) return;
    musicWanted = true;
    var target = M.volume != null ? M.volume : 0.6;
    audio.volume = reduced ? target : 0;
    var p = audio.play();
    if (p && p.catch) p.catch(function () { musicWanted = false; syncMusicBtn(); });
    if (!reduced) fadeTo(target, 2000);
    syncMusicBtn();
  }
  function pauseMusic() {
    musicWanted = false;
    if (audio) audio.pause();
    syncMusicBtn();
  }
  function syncMusicBtn() {
    if (!M || !M.src) { musicBtn.hidden = true; return; }
    /* on the gift screen the button waits for the gift to open */
    musicBtn.hidden = current === "gift" && !audio;
    musicBtn.classList.toggle("is-on", musicWanted);
    musicBtn.setAttribute("aria-pressed", musicWanted ? "true" : "false");
    musicBtn.setAttribute("aria-label", musicWanted ? M.muteLabel : M.playLabel);
  }
  musicBtn.addEventListener("click", function () {
    if (musicWanted) pauseMusic(); else playMusic();
  });
  /* stop when she switches app or locks the phone, resume when she's back */
  document.addEventListener("visibilitychange", function () {
    if (!audio) return;
    if (document.hidden) audio.pause();
    else if (musicWanted) { var p = audio.play(); if (p && p.catch) p.catch(function () {}); }
  });

  /* ═══════════ boot ═══════════ */
  buildGift();
  buildDeck();
  buildReveal();
  buildAsk();
  buildSlot();

  /* deep links for testing: #intro #reveal #pay #slot #pick #done */
  var start = location.hash.replace("#", "");
  if (ACTS.indexOf(start) < 0) start = "gift";
  ensureBuilt(start);
  showAct(start);
})();
