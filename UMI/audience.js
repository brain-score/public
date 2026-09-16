/* Two reading paths: capabilities for executives, implementation for engineers. */
(function () {
  var KEY = 'bsu-audience';
  var sections = Array.from(document.querySelectorAll('section[data-order]'));
  var observer;

  function resize() {
    if (!window.Plotly) return;
    document.querySelectorAll('section:not([hidden]) .plot').forEach(function (plot) {
      try { window.Plotly.Plots.resize(plot); } catch (error) {}
    });
  }

  function apply(view, persist) {
    document.body.dataset.aud = view;
    sections.forEach(function (section) {
      section.hidden = false;
    });
    document.querySelectorAll('details.analysis-details').forEach(function (details) { details.open = view === 'technical'; });
    document.querySelectorAll('button[data-aud]').forEach(function (button) {
      var active = button.dataset.aud === view;
      button.classList.toggle('active', active);
      button.setAttribute('aria-pressed', String(active));
    });
    document.getElementById('hero-title').textContent = view === 'executive'
      ? 'Study AI with the tools of neuroscience.' : 'Build experiments around one model interface.';
    document.getElementById('hero-sub').textContent = view === 'executive'
      ? window.BSU_DATA.meta.subtitle
      : 'Connect a model, choose an experiment, and attach tools to inspect it. Extend inputs, outputs, and measurements through public APIs.';
    var nav = document.getElementById('nav-links');
    nav.replaceChildren();
    if (observer) observer.disconnect();
    sections.filter(function (section) { return !section.hidden; }).forEach(function (section) {
      var link = document.createElement('a');
      link.href = '#' + section.id;
      link.textContent = section.dataset.toc || section.querySelector('h2').textContent;
      nav.appendChild(link);
    });
    if ('IntersectionObserver' in window) {
      observer = new IntersectionObserver(function (entries) {
        entries.forEach(function (entry) {
          if (!entry.isIntersecting) return;
          nav.querySelectorAll('a').forEach(function (link) {
            link.classList.toggle('active', link.hash === '#' + entry.target.id);
          });
        });
      }, {rootMargin: '-70px 0px -65% 0px'});
      sections.filter(function (section) { return !section.hidden; }).forEach(function (section) {
        observer.observe(section);
      });
    }
    if (persist) {
      try { localStorage.setItem(KEY, view); } catch (error) {}
      var url = new URL(location.href);
      url.searchParams.set('aud', view);
      history.replaceState(null, '', url);
    }
    setTimeout(resize, 100);
  }

  function revealAnchor() {
    var id = location.hash.slice(1);
    var target = document.getElementById(id);
    var section = target && target.closest('section');
    if (section && section.hidden) apply('technical', true);
    for (var parent = target && target.parentElement; parent; parent = parent.parentElement) {
      if (parent.tagName === 'DETAILS') parent.open = true;
    }
    if (target) target.scrollIntoView();
  }

  function init() {
    sections.sort(function (a, b) { return Number(a.dataset.order) - Number(b.dataset.order); });
    sections.forEach(function (section) { document.body.insertBefore(section, document.querySelector('footer')); });
    // Keep detailed interpretation available without interrupting the overview.
    document.querySelectorAll('.reading, .raj-caveats, #lim-list').forEach(function (node) {
      if (node.querySelector('.plot,figure,table,.flow,.schematic') || node.textContent.trim().split(/\s+/).length < 90) return;
      var details = document.createElement('details');
      details.className = 'analysis-details';
      var summary = document.createElement('summary');
      summary.textContent = node.id === 'lim-list' ? 'Limits of individual experiments' : 'Methods and interpretation';
      node.before(details);
      details.append(summary, node);
      details.addEventListener('toggle', resize);
    });
    document.querySelectorAll('button[data-aud]').forEach(function (button) {
      button.addEventListener('click', function () { apply(button.dataset.aud, true); });
    });
    var param = new URLSearchParams(location.search).get('aud');
    var saved;
    try { saved = localStorage.getItem(KEY); } catch (error) {}
    var requested = param || saved;
    // Existing advisory-board bookmarks retain access to the detailed material.
    var view = requested === 'technical' || requested === 'board' ? 'technical' : 'executive';
    apply(view, false);
    revealAnchor();
    window.addEventListener('hashchange', revealAnchor);
  }
  if (document.readyState === 'complete') init();
  else window.addEventListener('load', init);
})();
