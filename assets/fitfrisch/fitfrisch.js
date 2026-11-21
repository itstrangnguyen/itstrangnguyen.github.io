// Fit & Frisch demo pages: carry URL parameters (utm_source, utm_medium,
// utm_campaign, district, code ...) from page to page. Nothing is sent anywhere.
(function(){
  // Parameters that only mean something on the page they were sent to.
  var PAGE_ONLY = ['rating'];

  // Build a link to `target` that keeps the current page's parameters,
  // then applies `overrides` (a value of '' or null removes that parameter).
  function linkWithParams(target, overrides){
    var url = new URL(target, window.location.href);
    var current = new URLSearchParams(window.location.search);
    current.forEach(function(value, key){
      if (PAGE_ONLY.indexOf(key) === -1 && !url.searchParams.has(key)) {
        url.searchParams.set(key, value);
      }
    });
    Object.keys(overrides || {}).forEach(function(key){
      var value = overrides[key];
      if (value) url.searchParams.set(key, value);
      else url.searchParams.delete(key);
    });
    // Keep the link relative so the pages also work when opened from disk.
    var path = target.split(/[?#]/)[0];
    var query = url.searchParams.toString();
    return path + (query ? '?' + query : '') + url.hash;
  }

  // Every link marked data-keep-params gets the current parameters.
  function refreshLinks(overrides){
    document.querySelectorAll('a[data-keep-params]').forEach(function(a){
      if (!a.dataset.baseHref) a.dataset.baseHref = a.getAttribute('href');
      a.setAttribute('href', linkWithParams(a.dataset.baseHref, overrides));
    });
  }

  window.FitFrisch = { linkWithParams: linkWithParams, refreshLinks: refreshLinks };
  refreshLinks();
})();
