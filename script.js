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

// Lightbox: any <img data-zoom> opens enlarged on the page.
// Close with the × button, a click on the backdrop, or Esc.
(function () {
  var imgs = document.querySelectorAll('img[data-zoom]');
  if (!imgs.length || typeof HTMLDialogElement === 'undefined') return;
  var box = document.createElement('dialog');
  box.className = 'lightbox';
  box.innerHTML = '<button class="lightbox-close" type="button" aria-label="Close">×</button>' +
    '<button class="lightbox-nav prev" type="button" aria-label="Previous image">‹</button>' +
    '<button class="lightbox-nav next" type="button" aria-label="Next image">›</button><img alt=""><p></p>';
  document.body.appendChild(box);
  var big = box.querySelector('img'), cap = box.querySelector('p');
  var prevBtn = box.querySelector('.lightbox-nav.prev'), nextBtn = box.querySelector('.lightbox-nav.next');
  // Images inside a [data-zoom-group] element form a set: the lightbox shows
  // prev/next buttons (and arrow keys) that loop through the set.
  var group = [], pos = 0;
  // A slide that hadn't loaded yet has no size to fit; fit it once it arrives
  big.addEventListener('load', function () { fit(big); });
  // Fit the image as large as the screen allows (up to 92% wide, 80% tall),
  // scaling small images up so their text is readable.
  function fit(img) {
    var w = img.naturalWidth, h = img.naturalHeight;
    if (!w || !h) return;
    var scale = Math.min(window.innerWidth * 0.92 / w, window.innerHeight * 0.8 / h);
    big.style.width = Math.round(w * scale) + 'px';
    big.style.height = Math.round(h * scale) + 'px';
  }
  function show(img) {
    big.src = img.currentSrc || img.src;
    big.alt = img.alt;
    cap.textContent = img.alt;
    fit(img);
  }
  function open(img) {
    var set = img.closest('[data-zoom-group]');
    group = set ? [].slice.call(set.querySelectorAll('img[data-zoom]')) : [img];
    pos = group.indexOf(img);
    box.classList.toggle('has-nav', group.length > 1);
    show(img);
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
  window.addEventListener('resize', function () {
    if (box.open) fit({ naturalWidth: big.naturalWidth, naturalHeight: big.naturalHeight });
  });
  imgs.forEach(function (img) {
    img.tabIndex = 0;
    img.setAttribute('role', 'button');
    img.addEventListener('click', function () { open(img); });
    img.addEventListener('keydown', function (e) {
      if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); open(img); }
    });
  });
  box.addEventListener('click', function (e) {
    if (e.target !== big && !e.target.closest('.lightbox-nav')) box.close();
  });
})();
