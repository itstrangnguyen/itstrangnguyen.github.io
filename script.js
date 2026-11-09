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
  vid.addEventListener('loadedmetadata', function () { fit(vid, vid.videoWidth, vid.videoHeight); });
  function show(el) {
    cap.textContent = label(el);
    if (isVideo(el)) {
      big.hidden = true; vid.hidden = false;
      vid.src = el.currentSrc || el.src;
      fit(vid, el.videoWidth, el.videoHeight);
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
    else fit(vid, vid.videoWidth, vid.videoHeight);
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
