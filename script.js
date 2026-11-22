// Missing files: any <img data-slot> or <video data-slot> whose file is not in /assets yet
// turns into a dashed box that shows the expected file path.
// Drop the file into that path and it appears on reload. No HTML edit needed.
function showSlot(el) {
  var box = document.createElement('div');
  box.className = 'slot';
  box.textContent = 'Add file: ' + el.getAttribute('src').replace(/^(\.\.\/)+/, '');
  // A video with a cover image keeps showing the cover until the file is added
  var poster = el.getAttribute('poster');
  if (poster) {
    box.classList.add('slot-poster');
    box.style.backgroundImage = 'url("' + poster + '")';
  }
  el.replaceWith(box);
}
document.querySelectorAll('img[data-slot]').forEach(function (img) {
  if (img.complete && img.naturalWidth === 0) showSlot(img);
  else img.addEventListener('error', function () { showSlot(img); });
});
document.querySelectorAll('video[data-slot]').forEach(function (v) {
  if (v.error) showSlot(v);
  else v.addEventListener('error', function () { showSlot(v); });
});

// Email links: the address is split across two attributes so spam bots can't read it from the HTML.
// Joined here into a mailto link; without JavaScript the link falls back to its LinkedIn href.
document.querySelectorAll('[data-email-user]').forEach(function (a) {
  a.href = 'mailto:' + a.getAttribute('data-email-user') + '@' + a.getAttribute('data-email-domain');
});

// Footer year
document.querySelectorAll('[data-year]').forEach(function (el) {
  el.textContent = new Date().getFullYear();
});

// Carousels: swipe/scroll natively (scroll-snap); arrows, dots and arrow keys move one slide.
document.querySelectorAll('.carousel').forEach(function (c) {
  var track = c.querySelector('.carousel-track');
  var slides = track.children;
  var prev = c.querySelector('.prev'), next = c.querySelector('.next');
  var dots = c.querySelector('.carousel-dots');
  for (var i = 0; i < slides.length; i++) dots.appendChild(document.createElement('span'));
  function index() { return Math.round(track.scrollLeft / track.clientWidth); }
  function go(i) { track.scrollTo({ left: i * track.clientWidth }); }
  function update() {
    var i = index();
    prev.disabled = i <= 0;
    next.disabled = i >= slides.length - 1;
    [].forEach.call(dots.children, function (d, n) { d.classList.toggle('on', n === i); });
  }
  prev.addEventListener('click', function () { go(index() - 1); });
  next.addEventListener('click', function () { go(index() + 1); });
  track.addEventListener('keydown', function (e) {
    if (e.key === 'ArrowLeft') { e.preventDefault(); go(index() - 1); }
    if (e.key === 'ArrowRight') { e.preventDefault(); go(index() + 1); }
  });
  track.addEventListener('scroll', update, { passive: true });
  update();
});

// Lightbox: any <img data-zoom> or <video data-zoom> opens enlarged on the page.
// Videos play there with controls. Close with the × button, a click on the backdrop, or Esc.
(function () {
  var items = document.querySelectorAll('img[data-zoom], video[data-zoom]');
  if (!items.length || typeof HTMLDialogElement === 'undefined') return;
  var box = document.createElement('dialog');
  box.className = 'lightbox';
  box.innerHTML = '<button class="lightbox-close" type="button" aria-label="Close">×</button>' +
    '<button class="lightbox-nav prev" type="button" aria-label="Previous image">‹</button>' +
    '<button class="lightbox-nav next" type="button" aria-label="Next image">›</button>' +
    '<img alt=""><video controls playsinline hidden></video><p></p>';
  document.body.appendChild(box);
  var big = box.querySelector('img'), vid = box.querySelector('video'), cap = box.querySelector('p');
  var prevBtn = box.querySelector('.lightbox-nav.prev'), nextBtn = box.querySelector('.lightbox-nav.next');
  // Items inside a [data-zoom-group] element form a set: the lightbox shows
  // prev/next buttons (and arrow keys) that loop through the set.
  var group = [], pos = 0;
  function isVideo(el) { return el.tagName === 'VIDEO'; }
  function label(el) { return el.alt || el.getAttribute('aria-label') || ''; }
  // Fit the media as large as the screen allows (up to 92% wide, 80% tall),
  // scaling small images up so their text is readable.
  function fit(target, w, h) {
    if (!w || !h) return;
    var scale = Math.min(window.innerWidth * 0.92 / w, window.innerHeight * 0.8 / h);
    target.style.width = Math.round(w * scale) + 'px';
    target.style.height = Math.round(h * scale) + 'px';
  }
  // Media that hadn't loaded yet has no size to fit; fit it once it arrives
  big.addEventListener('load', function () { fit(big, big.naturalWidth, big.naturalHeight); });
  // Videos exported with white rounded corners baked in: round the player by the same share
  // of its width (7.5%) at every size and trim a thin edge (2%), so the white never shows when enlarged.
  function fitVideo(w, h) {
    fit(vid, w, h);
    if (!w) return;
    var size = parseFloat(vid.style.width);
    vid.style.borderRadius = Math.round(size * 0.075) + 'px';
    vid.style.clipPath = 'inset(' + Math.round(size * 0.02) + 'px round ' + Math.round(size * 0.07) + 'px)';
  }
  vid.addEventListener('loadedmetadata', function () { fitVideo(vid.videoWidth, vid.videoHeight); });
  function show(el) {
    cap.textContent = label(el);
    if (isVideo(el)) {
      big.hidden = true; vid.hidden = false;
      vid.src = el.currentSrc || el.src;
      fitVideo(el.videoWidth, el.videoHeight);
      vid.play().catch(function () {});
    } else {
      vid.pause(); vid.hidden = true; big.hidden = false;
      big.src = el.currentSrc || el.src;
      big.alt = el.alt;
      fit(big, el.naturalWidth, el.naturalHeight);
    }
  }
  function open(el) {
    var set = el.closest('[data-zoom-group]');
    group = set ? [].slice.call(set.querySelectorAll('img[data-zoom], video[data-zoom]')) : [el];
    pos = group.indexOf(el);
    box.classList.toggle('has-nav', group.length > 1);
    show(el);
    if (!box.open) box.showModal();
  }
  function step(d) {
    if (group.length < 2) return;
    pos = (pos + d + group.length) % group.length;
    show(group[pos]);
  }
  prevBtn.addEventListener('click', function () { step(-1); });
  nextBtn.addEventListener('click', function () { step(1); });
  box.addEventListener('keydown', function (e) {
    if (e.key === 'ArrowLeft') { e.preventDefault(); step(-1); }
    if (e.key === 'ArrowRight') { e.preventDefault(); step(1); }
  });
  box.addEventListener('close', function () { vid.pause(); });
  window.addEventListener('resize', function () {
    if (!box.open) return;
    if (vid.hidden) fit(big, big.naturalWidth, big.naturalHeight);
    else fitVideo(vid.videoWidth, vid.videoHeight);
  });
  items.forEach(function (el) {
    el.tabIndex = 0;
    el.setAttribute('role', 'button');
    el.addEventListener('click', function (e) { e.preventDefault(); open(el); });
    el.addEventListener('keydown', function (e) {
      if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); open(el); }
    });
  });
  box.addEventListener('click', function (e) {
    if (e.target !== big && e.target !== vid && !e.target.closest('.lightbox-nav')) box.close();
  });
})();
// Collapsible tables: <div class="table-wrap" data-collapse="5" data-collapse-label="days">
// shows the first 5 body rows and adds a button below to show the rest (and hide them again).
document.querySelectorAll('.table-wrap[data-collapse]').forEach(function (wrap) {
  var keep = parseInt(wrap.getAttribute('data-collapse'), 10);
  var rows = wrap.querySelectorAll('tbody tr');
  if (!keep || rows.length <= keep) return;
  var word = wrap.getAttribute('data-collapse-label') || 'rows';
  var btn = document.createElement('button');
  btn.type = 'button';
  btn.className = 'table-toggle';
  wrap.after(btn);
  function set(open) {
    for (var i = keep; i < rows.length; i++) rows[i].hidden = !open;
    wrap.classList.toggle('is-collapsed', !open);
    btn.setAttribute('aria-expanded', open);
    btn.textContent = open ? 'Show fewer ' + word : 'Show all ' + rows.length + ' ' + word;
  }
  btn.addEventListener('click', function () { set(btn.getAttribute('aria-expanded') !== 'true'); });
  set(false);
});
// Long quotes: <blockquote data-collapse="2"> shows the first 2 paragraphs and a button for the rest.
document.querySelectorAll('blockquote[data-collapse]').forEach(function (q) {
  var keep = parseInt(q.getAttribute('data-collapse'), 10);
  var paras = q.querySelectorAll('p');
  if (!keep || paras.length <= keep) return;
  var btn = document.createElement('button');
  btn.type = 'button';
  btn.className = 'table-toggle';
  paras[paras.length - 1].after(btn);
  function set(open) {
    q.classList.toggle('is-collapsed', !open);
    btn.setAttribute('aria-expanded', open);
    btn.textContent = open ? 'Show less' : 'Read the full feedback';
  }
  btn.addEventListener('click', function () { set(btn.getAttribute('aria-expanded') !== 'true'); });
  set(false);
});
// Back-to-top arrow: shows once the page is scrolled past the first screen; scrolls smoothly to the top.
document.querySelectorAll('.to-top').forEach(function (btn) {
  function update() { btn.classList.toggle('is-visible', window.scrollY > window.innerHeight * 0.8); }
  window.addEventListener('scroll', update, { passive: true });
  update();
  btn.addEventListener('click', function (e) {
    e.preventDefault();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  });
});
// Wireframe with views and markers: <figure data-wf-tips data-lens="…">
// - Tabs [data-lens-tab] switch the view; elements with data-lens-pane="a b" show only in those views.
//   Links to #structure, #form or #brand anywhere on the page switch the view too.
// - Markers [data-tip] (SVG groups, spans or buttons) show the text of .wf-tips [data-tip] in a popover:
//   hover or focus shows it, click or tap keeps it open, Esc or a click elsewhere closes it.
// - Shapes with data-blk="1 b-pink …" light up while a matching marker is shown.
document.querySelectorAll('[data-wf-tips]').forEach(function (fig) {
  var SVGNS = 'http://www.w3.org/2000/svg';
  var tabs = [].slice.call(fig.querySelectorAll('[data-lens-tab]'));
  var pins = [].slice.call(fig.querySelectorAll('[data-tip]')).filter(function (el) { return !el.closest('.wf-tips'); });
  if (!pins.length) return;

  var pop = document.createElement('div');
  pop.className = 'wf-pop';
  pop.id = 'wf-pop-' + Math.random().toString(36).slice(2, 8);
  pop.setAttribute('role', 'status');
  pop.hidden = true;
  fig.appendChild(pop);
  var current = null, pinned = false, hideTimer = null;

  function source(id) { return fig.querySelector('.wf-tips [data-tip="' + id + '"]'); }

  pins.forEach(function (pin) {
    var src = source(pin.getAttribute('data-tip'));
    var isButton = pin.tagName === 'BUTTON';
    // SVG markers: an invisible larger circle behind, an easier target on touch screens
    if (pin.namespaceURI === SVGNS) {
      var c = pin.querySelector('circle'), tap = document.createElementNS(SVGNS, 'circle');
      tap.setAttribute('class', 'wf-tap');
      tap.setAttribute('cx', c.getAttribute('cx')); tap.setAttribute('cy', c.getAttribute('cy')); tap.setAttribute('r', '22');
      pin.insertBefore(tap, c);
      // Pulse ring (CSS animation) that invites a first hover or tap; stops once a marker is opened
      var ring = document.createElementNS(SVGNS, 'circle');
      ring.setAttribute('class', 'wf-pulse');
      ring.setAttribute('cx', c.getAttribute('cx')); ring.setAttribute('cy', c.getAttribute('cy')); ring.setAttribute('r', c.getAttribute('r'));
      pin.insertBefore(ring, c);
    }
    if (pin.namespaceURI === SVGNS || pin.classList.contains('pin')) {
      pin.style.setProperty('--pulse-delay', (pins.indexOf(pin) % 9) * 0.18 + 's');
    }
    if (!isButton) {
      pin.setAttribute('tabindex', '0');
      pin.setAttribute('role', 'button');
      pin.setAttribute('aria-label', (pin.textContent.trim() ? pin.textContent.trim() + ': ' : '') + (src ? src.getAttribute('data-title') : ''));
      pin.addEventListener('keydown', function (e) {
        if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); toggle(pin); }
      });
    }
    pin.setAttribute('aria-controls', pop.id);
    pin.setAttribute('aria-expanded', 'false');
    pin.addEventListener('mouseenter', function () { if (!pinned) show(pin); });
    pin.addEventListener('mouseleave', function () { if (!pinned) hideSoon(); });
    pin.addEventListener('focus', function () { if (!pinned) show(pin); });
    pin.addEventListener('blur', function () { if (!pinned) hideSoon(); });
    pin.addEventListener('click', function (e) { e.stopPropagation(); toggle(pin); });
  });
  function toggle(pin) {
    if (pinned && current === pin) { hide(); return; }
    pinned = true; show(pin);
  }
  pop.addEventListener('mouseenter', function () { clearTimeout(hideTimer); });
  pop.addEventListener('mouseleave', function () { if (!pinned) hideSoon(); });
  pop.addEventListener('click', function (e) { if (!e.target.closest('a')) e.stopPropagation(); });
  document.addEventListener('click', function () { if (current) hide(); });
  document.addEventListener('keydown', function (e) { if (e.key === 'Escape' && current) { var p = current; hide(); p.focus(); } });
  window.addEventListener('resize', function () { if (current) place(current); });

  function show(pin) {
    clearTimeout(hideTimer);
    var id = pin.getAttribute('data-tip'), src = source(id);
    if (!src) return;
    pop.innerHTML = '';
    var head = document.createElement('p'); head.className = 'wf-pop-title';
    var badge = document.createElement('span'); badge.className = 'wf-pop-num';
    var swatch = src.getAttribute('data-swatch');
    if (swatch) { badge.classList.add('is-swatch'); badge.style.background = swatch; }
    else badge.textContent = src.getAttribute('data-badge') || pin.textContent.trim();
    head.appendChild(badge);
    head.appendChild(document.createTextNode(src.getAttribute('data-title')));
    pop.appendChild(head);
    if (src.getAttribute('data-q')) {
      var q = document.createElement('p'); q.className = 'wf-pop-q';
      q.textContent = 'Sandra asks: “' + src.getAttribute('data-q') + '”';
      pop.appendChild(q);
    }
    var body = document.createElement('p'); body.className = 'wf-pop-body';
    body.innerHTML = src.innerHTML;
    pop.appendChild(body);
    pop.hidden = false;
    pins.forEach(function (p) {
      var on = p.getAttribute('data-tip') === id;
      p.classList.toggle('is-active', on);
      p.setAttribute('aria-expanded', on);
    });
    fig.querySelectorAll('[data-blk]').forEach(function (el) {
      el.classList.toggle('is-lit', el.getAttribute('data-blk').split(' ').indexOf(id) > -1);
    });
    fig.classList.add('is-explored');
    current = pin;
    place(pin);
  }
  function hideSoon() { clearTimeout(hideTimer); hideTimer = setTimeout(hide, 120); }
  function hide() {
    pop.hidden = true; current = null; pinned = false;
    pins.forEach(function (p) { p.classList.remove('is-active'); p.setAttribute('aria-expanded', 'false'); });
    fig.querySelectorAll('.is-lit').forEach(function (el) { el.classList.remove('is-lit'); });
  }
  // Below the marker when there is room in the window, otherwise above; kept inside the figure's width.
  function place(pin) {
    var f = fig.getBoundingClientRect(), r = pin.getBoundingClientRect();
    var w = pop.offsetWidth, h = pop.offsetHeight, gap = 10;
    var left = r.left + r.width / 2 - f.left - w / 2;
    left = Math.max(8, Math.min(left, f.width - w - 8));
    var below = r.bottom + gap + h <= window.innerHeight;
    var top = below ? r.bottom - f.top + gap : r.top - f.top - gap - h;
    pop.style.left = left + 'px';
    pop.style.top = top + 'px';
  }

  // Views
  function setLens(lens, focusTab) {
    if (!tabs.some(function (t) { return t.getAttribute('data-lens-tab') === lens; })) return;
    hide();
    fig.setAttribute('data-lens', lens);
    fig.classList.remove('is-explored');
    tabs.forEach(function (t) {
      var on = t.getAttribute('data-lens-tab') === lens;
      t.setAttribute('aria-selected', on);
      t.tabIndex = on ? 0 : -1;
      if (on && focusTab) t.focus();
    });
    fig.querySelectorAll('[data-lens-pane]').forEach(function (el) {
      el.hidden = el.getAttribute('data-lens-pane').split(' ').indexOf(lens) < 0;
    });
  }
  tabs.forEach(function (t, i) {
    t.addEventListener('click', function (e) { e.stopPropagation(); setLens(t.getAttribute('data-lens-tab')); });
    t.addEventListener('keydown', function (e) {
      var d = e.key === 'ArrowRight' ? 1 : e.key === 'ArrowLeft' ? -1 : 0;
      if (!d) return;
      e.preventDefault();
      setLens(tabs[(i + d + tabs.length) % tabs.length].getAttribute('data-lens-tab'), true);
    });
  });
  document.addEventListener('click', function (e) {
    var a = e.target.closest && e.target.closest('a[href^="#"]');
    if (!a) return;
    var lens = a.getAttribute('href').slice(1);
    if (tabs.some(function (t) { return t.getAttribute('data-lens-tab') === lens; })) setLens(lens);
  }, true);
  setLens(location.hash.slice(1) || fig.getAttribute('data-lens'));
  if (!fig.getAttribute('data-lens')) setLens(tabs[0].getAttribute('data-lens-tab'));
});
// Scroll rail: lights up the section being read and fills the line up to the reader's position.
// The rail appears once the first section reaches the screen.
document.querySelectorAll('.scroll-rail').forEach(function (rail) {
  var links = [].slice.call(rail.querySelectorAll('a[href^="#"]'));
  var targets = links.map(function (a) { return document.querySelector(a.getAttribute('href')); });
  var fill = rail.querySelector('.rail-fill');
  if (targets.some(function (t) { return !t; })) return;
  var ticking = false;
  function update() {
    ticking = false;
    var mark = window.innerHeight * 0.35;
    var tops = targets.map(function (t) { return t.getBoundingClientRect().top; });
    var active = -1;
    tops.forEach(function (top, i) { if (top <= mark) active = i; });
    // Near the very bottom, the last short section can't reach the mark: treat it as reached
    if (window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 4) active = links.length - 1;
    rail.classList.toggle('is-visible', tops[0] < window.innerHeight * 0.9);
    links.forEach(function (a, i) {
      a.classList.toggle('is-active', i === active);
      a.classList.toggle('is-past', i < active);
      if (i === active) a.setAttribute('aria-current', 'true'); else a.removeAttribute('aria-current');
    });
    // Line fill: up to the active marker, plus how far the reader is through that section
    var y = 0;
    if (active >= 0) {
      var here = links[active].offsetTop + links[active].offsetHeight / 2;
      var next = active < links.length - 1 ? links[active + 1].offsetTop + links[active + 1].offsetHeight / 2 : here;
      var span = active < links.length - 1 ? tops[active + 1] - tops[active] : 1;
      var part = Math.min(1, Math.max(0, (mark - tops[active]) / span));
      y = here + (next - here) * part - 11;
    }
    fill.style.height = Math.max(0, y) + 'px';
  }
  function request() { if (!ticking) { ticking = true; requestAnimationFrame(update); } }
  window.addEventListener('scroll', request, { passive: true });
  window.addEventListener('resize', request);
  update();
});
