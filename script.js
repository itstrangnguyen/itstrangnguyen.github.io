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
