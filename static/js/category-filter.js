(function () {
  var pills = document.querySelectorAll('.category-pills__pill');
  if (!pills.length) return;

  var articles = document.querySelectorAll('.article-grid article[data-categories]');
  var emptyState = document.querySelector('.category-pills__empty-state');

  // Progressive enhancement: convert links/spans to buttons, preserving hrefs
  pills.forEach(function (pill) {
    var btn = document.createElement('button');
    btn.className = pill.className;
    btn.setAttribute('data-filter', pill.getAttribute('data-filter'));
    btn.textContent = pill.textContent;
    btn.type = 'button';

    var href = pill.getAttribute('href');
    if (href) {
      btn.setAttribute('data-href', href);
    }

    var isActive = pill.classList.contains('category-pills__pill--active');
    btn.setAttribute('aria-pressed', isActive ? 'true' : 'false');

    pill.parentNode.replaceChild(btn, pill);
  });

  // Re-query after replacement
  var buttons = document.querySelectorAll('.category-pills__pill');

  buttons.forEach(function (btn) {
    btn.addEventListener('click', function () {
      var filter = btn.getAttribute('data-filter');

      // Update active state on all buttons
      buttons.forEach(function (b) {
        b.classList.remove('category-pills__pill--active');
        b.setAttribute('aria-pressed', 'false');
      });
      btn.classList.add('category-pills__pill--active');
      btn.setAttribute('aria-pressed', 'true');

      // Filter articles
      var visibleCount = 0;
      articles.forEach(function (article) {
        var visible = filter === 'all' ||
          (article.getAttribute('data-categories') || '').split(' ').indexOf(filter) !== -1;
        article.hidden = !visible;
        if (visible) visibleCount++;
      });

      // Toggle empty state with optional link to taxonomy archive
      if (!emptyState) return;

      if (visibleCount > 0) {
        emptyState.hidden = true;
        return;
      }

      var archiveHref = btn.getAttribute('data-href');
      if (archiveHref) {
        emptyState.innerHTML =
          'No posts in this category yet. <a href="' + archiveHref + '">Browse all ' +
          btn.textContent + ' posts</a>';
      } else {
        emptyState.textContent = 'No posts in this category yet.';
      }
      emptyState.hidden = false;
    });
  });
})();
