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

// Footer year
document.querySelectorAll('[data-year]').forEach(function (el) {
  el.textContent = new Date().getFullYear();
});

// Lightbox: any <img data-zoom> opens enlarged on the page.
// Close with the × button, a click on the backdrop, or Esc.
(function () {
  var imgs = document.querySelectorAll('img[data-zoom]');
  if (!imgs.length || typeof HTMLDialogElement === 'undefined') return;
  var box = document.createElement('dialog');
  box.className = 'lightbox';
  box.innerHTML = '<button class="lightbox-close" type="button" aria-label="Close">×</button><img alt=""><p></p>';
  document.body.appendChild(box);
  var big = box.querySelector('img'), cap = box.querySelector('p');
  // Fit the image as large as the screen allows (up to 92% wide, 80% tall),
  // scaling small images up so their text is readable.
  function fit(img) {
    var w = img.naturalWidth, h = img.naturalHeight;
    if (!w || !h) return;
    var scale = Math.min(window.innerWidth * 0.92 / w, window.innerHeight * 0.8 / h);
    big.style.width = Math.round(w * scale) + 'px';
    big.style.height = Math.round(h * scale) + 'px';
  }
  function open(img) {
    big.src = img.currentSrc || img.src;
    big.alt = img.alt;
    cap.textContent = img.alt;
    fit(img);
    box.showModal();
  }
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
  box.addEventListener('click', function (e) { if (e.target !== big) box.close(); });
})();
