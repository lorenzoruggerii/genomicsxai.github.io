(function () {
  var groups = document.querySelectorAll('.category-pills[data-filter-group]');
  if (!groups.length) return;

  var articles = document.querySelectorAll('.article-grid article[data-categories]');
  var emptyState = document.querySelector('.category-pills__empty-state');

  // Track active filter per group (default 'all').
  var activeFilters = {};

  // Pass 1: build sets of category + tag values that actually exist on visible
  // articles, so we know which pills correspond to no posts and should be
  // greyed out.
  var presentCategories = new Set();
  var presentTags = new Set();
  articles.forEach(function (article) {
    (article.getAttribute('data-categories') || '').split(' ').forEach(function (t) {
      if (t) presentCategories.add(t);
    });
    (article.getAttribute('data-tags') || '').split(' ').forEach(function (t) {
      if (t) presentTags.add(t);
    });
  });

  // Pass 2: replace each <a>/<span> pill with a <button>; mark empty pills as
  // disabled.
  groups.forEach(function (group) {
    var groupName = group.getAttribute('data-filter-group');
    activeFilters[groupName] = 'all';

    var presentSet = groupName === 'discipline' ? presentTags : presentCategories;

    var pills = group.querySelectorAll('.category-pills__pill');
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

      var filter = btn.getAttribute('data-filter');
      var isEmpty = filter !== 'all' && !presentSet.has(filter);
      if (isEmpty) {
        btn.classList.add('category-pills__pill--empty');
        btn.disabled = true;
        btn.setAttribute('aria-disabled', 'true');
      } else {
        btn.classList.remove('category-pills__pill--empty');
      }

      var isActive = pill.classList.contains('category-pills__pill--active');
      btn.setAttribute('aria-pressed', isActive ? 'true' : 'false');

      pill.parentNode.replaceChild(btn, pill);
    });
  });

  function applyFilters() {
    var visibleCount = 0;
    articles.forEach(function (article) {
      var cats = (article.getAttribute('data-categories') || '').split(' ');
      var tags = (article.getAttribute('data-tags') || '').split(' ');
      var visible = true;
      Object.keys(activeFilters).forEach(function (group) {
        var f = activeFilters[group];
        if (f === 'all') return;
        var pool = group === 'discipline' ? tags : cats;
        if (pool.indexOf(f) === -1) visible = false;
      });
      article.hidden = !visible;
      if (visible) visibleCount++;
    });

    if (emptyState) {
      emptyState.hidden = visibleCount > 0;
    }
  }

  // Wire click handlers per group
  groups.forEach(function (group) {
    var groupName = group.getAttribute('data-filter-group');
    group.addEventListener('click', function (event) {
      var btn = event.target.closest('.category-pills__pill');
      if (!btn || btn.disabled) return;

      activeFilters[groupName] = btn.getAttribute('data-filter');

      var groupButtons = group.querySelectorAll('.category-pills__pill');
      groupButtons.forEach(function (b) {
        b.classList.remove('category-pills__pill--active');
        b.setAttribute('aria-pressed', 'false');
      });
      btn.classList.add('category-pills__pill--active');
      btn.setAttribute('aria-pressed', 'true');

      applyFilters();
    });
  });
})();
