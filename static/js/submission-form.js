(function () {
  'use strict';

  // ── Config ──
  var CONFIG = {
    OWNER: 'genomicsxai',
    REPO: 'genomicsxai.github.io',
    DEFAULT_BRANCH: 'main',
    BLOGS_PATH: 'content/blogs',
    API_BASE: 'https://api.github.com',
    // Set this to your Vercel deployment URL (e.g. https://genomicsxai-submit.vercel.app)
    AUTH_BASE: 'https://genomicsxai-github-io.vercel.app',
    SCOPE_OPTIONS: ['protocols', 'tutorials', 'negative-results', 'discussions', 'insights', 'ideas'],
    AUDIENCE_OPTIONS: ['within-field', 'general', 'intro-to-field'],
    MAX_IMAGE_SIZE: 10 * 1024 * 1024, // 10 MB
    MAX_TOTAL_SIZE: 50 * 1024 * 1024,  // 50 MB
  };

  // ── Utility ──
  function $(sel, ctx) { return (ctx || document).querySelector(sel); }
  function $$(sel, ctx) { return Array.from((ctx || document).querySelectorAll(sel)); }
  function show(el) { el.style.display = ''; el.removeAttribute('hidden'); }
  function hide(el) { el.style.display = 'none'; el.setAttribute('hidden', ''); }
  function today() { return new Date().toISOString().slice(0, 10); }

  // ── Auth ──
  var Auth = {
    getToken: function () { return sessionStorage.getItem('gh_token'); },
    clearToken: function () { sessionStorage.removeItem('gh_token'); },
    isAuthenticated: function () { return !!this.getToken(); },
    login: function () {
      window.location.href = CONFIG.AUTH_BASE + '/api/auth/login';
    },
    logout: function () {
      this.clearToken();
      FormController.renderAuthState();
    },
  };

  // ── GitHub API ──
  var GitHubAPI = {
    _headers: function () {
      return {
        Authorization: 'token ' + Auth.getToken(),
        Accept: 'application/vnd.github.v3+json',
      };
    },

    request: async function (method, url, body) {
      var opts = { method: method, headers: this._headers() };
      if (body) {
        opts.headers['Content-Type'] = 'application/json';
        opts.body = JSON.stringify(body);
      }
      var resp = await fetch(CONFIG.API_BASE + url, opts);
      if (resp.status === 204) return null;
      var data = await resp.json();
      if (!resp.ok) {
        var msg = data.message || resp.statusText;
        if (resp.status === 401) { Auth.clearToken(); msg = 'Authentication expired. Please sign in again.'; }
        if (resp.status === 403 && resp.headers.get('X-RateLimit-Remaining') === '0') {
          msg = 'GitHub API rate limit reached. Please wait a few minutes and try again.';
        }
        throw new Error(msg);
      }
      return data;
    },

    getUser: function () { return this.request('GET', '/user'); },

    getContents: function (owner, repo, path) {
      return this.request('GET', '/repos/' + owner + '/' + repo + '/contents/' + path);
    },

    listOpenPRs: function () {
      return this.request('GET', '/repos/' + CONFIG.OWNER + '/' + CONFIG.REPO + '/pulls?state=open&per_page=100');
    },

    forkRepo: function () {
      return this.request('POST', '/repos/' + CONFIG.OWNER + '/' + CONFIG.REPO + '/forks', {});
    },

    syncFork: function (owner) {
      return this.request('POST', '/repos/' + owner + '/' + CONFIG.REPO + '/merge-upstream', { branch: CONFIG.DEFAULT_BRANCH });
    },

    getRef: function (owner, ref) {
      return this.request('GET', '/repos/' + owner + '/' + CONFIG.REPO + '/git/ref/heads/' + ref);
    },

    createRef: function (owner, ref, sha) {
      return this.request('POST', '/repos/' + owner + '/' + CONFIG.REPO + '/git/refs', { ref: 'refs/heads/' + ref, sha: sha });
    },

    deleteRef: function (owner, ref) {
      return this.request('DELETE', '/repos/' + owner + '/' + CONFIG.REPO + '/git/refs/heads/' + ref);
    },

    createBlob: function (owner, content, encoding) {
      return this.request('POST', '/repos/' + owner + '/' + CONFIG.REPO + '/git/blobs', { content: content, encoding: encoding || 'utf-8' });
    },

    createTree: function (owner, baseTree, tree) {
      return this.request('POST', '/repos/' + owner + '/' + CONFIG.REPO + '/git/trees', { base_tree: baseTree, tree: tree });
    },

    createCommit: function (owner, message, tree, parents) {
      return this.request('POST', '/repos/' + owner + '/' + CONFIG.REPO + '/git/commits', { message: message, tree: tree, parents: parents });
    },

    updateRef: function (owner, ref, sha) {
      return this.request('PATCH', '/repos/' + owner + '/' + CONFIG.REPO + '/git/refs/heads/' + ref, { sha: sha, force: true });
    },

    createPR: function (head, title, body) {
      return this.request('POST', '/repos/' + CONFIG.OWNER + '/' + CONFIG.REPO + '/pulls', {
        title: title, head: head, base: CONFIG.DEFAULT_BRANCH, body: body,
      });
    },
  };

  // ── PostID ──
  var PostID = {
    getNext: async function () {
      var year = new Date().getFullYear().toString();
      var existing = [];
      try {
        var items = await GitHubAPI.getContents(CONFIG.OWNER, CONFIG.REPO, CONFIG.BLOGS_PATH);
        items.forEach(function (item) {
          if (item.type === 'dir' && /^\d{4}-\d{3}$/.test(item.name) && item.name.startsWith(year)) {
            existing.push(parseInt(item.name.split('-')[1], 10));
          }
        });
      } catch (e) { /* empty blog directory */ }

      // Also check open PRs for pending post IDs
      try {
        var prs = await GitHubAPI.listOpenPRs();
        prs.forEach(function (pr) {
          var m = pr.head.ref.match(/blog\/(\d{4})-(\d{3})/);
          if (m && m[1] === year) existing.push(parseInt(m[2], 10));
        });
      } catch (e) { /* ignore */ }

      var max = existing.length ? Math.max.apply(null, existing) : 0;
      var next = (max + 1).toString().padStart(3, '0');
      return year + '-' + next;
    },
  };

  // ── FileParser ──
  var FileParser = {
    parse: function (text) {
      var match = text.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n([\s\S]*)$/);
      if (!match) return null;
      try {
        var frontmatter = window.jsyaml.load(match[1]);
        return { frontmatter: frontmatter, body: match[2], rawYaml: match[1] };
      } catch (e) {
        return null;
      }
    },
  };

  // ── Validate ──
  var Validate = {
    REQUIRED: ['title', 'authors', 'tags', 'scope', 'labs'],

    run: function (fm) {
      var errors = {};

      if (!fm.title || !fm.title.trim()) errors.title = 'Title is required.';

      if (!fm.authors || !Array.isArray(fm.authors) || fm.authors.length === 0) {
        errors.authors = 'At least one author is required.';
      }

      if (!fm.tags || (Array.isArray(fm.tags) && fm.tags.length === 0)) {
        errors.tags = 'At least one tag is required.';
      }

      if (!fm.scope || (Array.isArray(fm.scope) && fm.scope.length === 0)) {
        errors.scope = 'At least one scope is required.';
      } else if (Array.isArray(fm.scope)) {
        var invalidScope = fm.scope.filter(function (s) { return CONFIG.SCOPE_OPTIONS.indexOf(s) === -1; });
        if (invalidScope.length) errors.scope = 'Invalid scope values: ' + invalidScope.join(', ');
      }

      if (fm.audience && Array.isArray(fm.audience)) {
        var invalidAud = fm.audience.filter(function (a) { return CONFIG.AUDIENCE_OPTIONS.indexOf(a) === -1; });
        if (invalidAud.length) errors.audience = 'Invalid audience values: ' + invalidAud.join(', ');
      }

      if (!fm.labs || (Array.isArray(fm.labs) && fm.labs.length === 0)) {
        errors.labs = 'Lab is required.';
      }

      return errors;
    },

    hasErrors: function (errors) {
      return Object.keys(errors).length > 0;
    },
  };

  // ── ImageHandler ──
  var ImageHandler = {
    files: [],

    addFiles: function (fileList) {
      var errors = [];
      var totalSize = this.files.reduce(function (sum, f) { return sum + f.size; }, 0);

      for (var i = 0; i < fileList.length; i++) {
        var f = fileList[i];
        if (!f.type.startsWith('image/')) {
          errors.push(f.name + ' is not an image file.');
          continue;
        }
        if (f.size > CONFIG.MAX_IMAGE_SIZE) {
          errors.push(f.name + ' exceeds the 10 MB limit (' + (f.size / 1024 / 1024).toFixed(1) + ' MB).');
          continue;
        }
        totalSize += f.size;
        if (totalSize > CONFIG.MAX_TOTAL_SIZE) {
          errors.push('Total image size exceeds 50 MB.');
          break;
        }
        this.files.push(f);
      }
      return errors;
    },

    removeFile: function (index) {
      this.files.splice(index, 1);
    },

    clear: function () {
      this.files = [];
    },

    sanitizeName: function (name) {
      return name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9._-]/g, '');
    },

    readAsBase64: function (file) {
      return new Promise(function (resolve, reject) {
        var reader = new FileReader();
        reader.onload = function () {
          // Strip the data:...;base64, prefix
          resolve(reader.result.split(',')[1]);
        };
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });
    },

    renderPreviews: function () {
      var container = $('#submit-form__image-previews');
      if (!container) return;
      container.innerHTML = '';
      var self = this;
      this.files.forEach(function (f, i) {
        var thumb = document.createElement('div');
        thumb.className = 'submit-form__image-thumb';
        var url = URL.createObjectURL(f);

        var img = document.createElement('img');
        img.src = url;
        img.alt = f.name;

        var span = document.createElement('span');
        span.className = 'submit-form__image-name';
        span.textContent = f.name + ' (' + (f.size / 1024).toFixed(0) + ' KB)';

        var btn = document.createElement('button');
        btn.type = 'button';
        btn.className = 'submit-form__image-remove';
        btn.dataset.index = String(i);
        btn.title = 'Remove';
        btn.innerHTML = '&times;';

        thumb.appendChild(img);
        thumb.appendChild(span);
        thumb.appendChild(btn);
        container.appendChild(thumb);
      });
      $$('.submit-form__image-remove').forEach(function (btn) {
        btn.addEventListener('click', function () {
          self.removeFile(parseInt(btn.dataset.index, 10));
          self.renderPreviews();
        });
      });
    },
  };

  // ── Progress ──
  var Progress = {
    steps: [
      { id: 'fork', label: 'Forking repository' },
      { id: 'branch', label: 'Creating branch' },
      { id: 'upload', label: 'Uploading files' },
      { id: 'commit', label: 'Creating commit' },
      { id: 'pr', label: 'Opening pull request' },
    ],
    currentStep: -1,
    lastCompletedStep: -1,

    render: function () {
      var container = $('#submit-form__progress');
      if (!container) return;
      show(container);
      var html = '<div class="submit-form__progress-steps">';
      var self = this;
      this.steps.forEach(function (step, i) {
        var cls = 'submit-form__progress-step';
        if (i < self.currentStep) cls += ' submit-form__progress-step--done';
        else if (i === self.currentStep) cls += ' submit-form__progress-step--active';
        html += '<div class="' + cls + '">';
        html += '<span class="submit-form__progress-icon">';
        if (i < self.currentStep) html += '&#10003;';
        else if (i === self.currentStep) html += '<span class="submit-form__spinner"></span>';
        else html += (i + 1);
        html += '</span>';
        html += '<span class="submit-form__progress-label">' + step.label + '</span>';
        html += '</div>';
      });
      html += '</div>';
      container.innerHTML = html;
    },

    setStep: function (index) {
      this.currentStep = index;
      this.render();
    },

    complete: function (index) {
      this.lastCompletedStep = index;
      this.currentStep = index + 1;
      this.render();
    },

    showError: function (msg) {
      var container = $('#submit-form__progress');
      if (!container) return;
      var activeStep = container.querySelector('.submit-form__progress-step--active');
      if (activeStep) {
        activeStep.classList.remove('submit-form__progress-step--active');
        activeStep.classList.add('submit-form__progress-step--error');
      }
      var errorEl = $('#submit-form__error');
      if (errorEl) {
        errorEl.textContent = msg;
        show(errorEl);
      }
    },

    reset: function () {
      this.currentStep = -1;
      this.lastCompletedStep = -1;
      var container = $('#submit-form__progress');
      if (container) { container.innerHTML = ''; hide(container); }
      var errorEl = $('#submit-form__error');
      if (errorEl) { errorEl.textContent = ''; hide(errorEl); }
    },
  };

  // ── MarkdownGen ──
  var MarkdownGen = {
    generate: function (fm, body) {
      var lines = ['---'];

      lines.push('post_id: "' + fm.post_id + '"');
      lines.push('title: "' + (fm.title || '').replace(/"/g, '\\"') + '"');
      if (fm.image) lines.push('image: "' + fm.image + '"');
      if (fm.math) lines.push('math: true');
      lines.push('');

      // authors
      lines.push('authors: ' + JSON.stringify(fm.authors || []));
      if (fm.authors_display && fm.authors_display.length) {
        lines.push('');
        lines.push('authors_display:');
        fm.authors_display.forEach(function (a) {
          lines.push('  - name: "' + (a.name || '').replace(/"/g, '\\"') + '"');
          lines.push('    affiliation: "' + (a.affiliation || '').replace(/"/g, '\\"') + '"');
          lines.push('    orcid: "' + (a.orcid || '') + '"');
        });
      }
      lines.push('');

      lines.push('editor: "' + (fm.editor || 'TBD') + '"');
      lines.push('');
      lines.push('tags: ' + JSON.stringify(fm.tags || []));
      lines.push('categories: ' + JSON.stringify(fm.categories || ['Blog Post']));
      lines.push('');
      lines.push('scope: ' + JSON.stringify(fm.scope || []));
      lines.push('audience: ' + JSON.stringify(fm.audience || []));
      lines.push('labs: ' + JSON.stringify(fm.labs || []));
      lines.push('');
      lines.push('status: "submitted"');
      lines.push('revision: 1');
      lines.push('');
      lines.push('date_submitted: ' + (fm.date_submitted || today()));
      lines.push('date_accepted:');
      lines.push('date: ' + (fm.date || fm.date_submitted || today()));
      lines.push('');
      lines.push('doi: "' + (fm.doi || '') + '"');
      lines.push('revision_history:');
      lines.push('  - version: 1');
      lines.push('    date: ' + (fm.date_submitted || today()));
      lines.push('    notes: "Initial submission"');

      lines.push('---');
      lines.push('');
      lines.push(body || '');

      return lines.join('\n');
    },
  };

  // ── FormController ──
  var FormController = {
    parsed: null,     // { frontmatter, body }
    postId: null,
    user: null,
    submitting: false,

    init: function () {
      var form = $('#submit-form');
      if (!form) return;

      // Check if returning from OAuth
      if (Auth.isAuthenticated()) {
        this.onAuthenticated();
      }

      this.bindEvents();
      this.renderAuthState();
    },

    bindEvents: function () {
      var self = this;

      // Auth
      var loginBtn = $('#submit-form__login-btn');
      if (loginBtn) loginBtn.addEventListener('click', function () { Auth.login(); });

      var logoutBtn = $('#submit-form__logout-btn');
      if (logoutBtn) logoutBtn.addEventListener('click', function () { Auth.logout(); });

      // File upload
      var fileInput = $('#submit-form__file-input');
      if (fileInput) fileInput.addEventListener('change', function (e) { self.onFileSelected(e); });

      var dropZone = $('#submit-form__drop-zone');
      if (dropZone) {
        dropZone.addEventListener('dragover', function (e) { e.preventDefault(); dropZone.classList.add('submit-form__drop-zone--active'); });
        dropZone.addEventListener('dragleave', function () { dropZone.classList.remove('submit-form__drop-zone--active'); });
        dropZone.addEventListener('drop', function (e) {
          e.preventDefault();
          dropZone.classList.remove('submit-form__drop-zone--active');
          var files = e.dataTransfer.files;
          if (files.length === 1 && files[0].name.endsWith('.md')) {
            self.loadMarkdownFile(files[0]);
          }
        });
        dropZone.addEventListener('click', function () { if (fileInput) fileInput.click(); });
      }

      // Image upload
      var imgInput = $('#submit-form__img-input');
      if (imgInput) imgInput.addEventListener('change', function (e) { self.onImagesSelected(e); });

      var imgDropZone = $('#submit-form__img-drop-zone');
      if (imgDropZone) {
        imgDropZone.addEventListener('dragover', function (e) { e.preventDefault(); imgDropZone.classList.add('submit-form__drop-zone--active'); });
        imgDropZone.addEventListener('dragleave', function () { imgDropZone.classList.remove('submit-form__drop-zone--active'); });
        imgDropZone.addEventListener('drop', function (e) {
          e.preventDefault();
          imgDropZone.classList.remove('submit-form__drop-zone--active');
          self.onImagesSelected({ target: { files: e.dataTransfer.files } });
        });
        imgDropZone.addEventListener('click', function () { if (imgInput) imgInput.click(); });
      }

      // Submit
      var submitBtn = $('#submit-form__submit-btn');
      if (submitBtn) submitBtn.addEventListener('click', function () { self.onSubmit(); });

      // Editable field changes re-trigger validation
      $$('.submit-form__editable').forEach(function (el) {
        el.addEventListener('input', function () { self.revalidate(); });
        el.addEventListener('change', function () { self.revalidate(); });
      });
    },

    renderAuthState: function () {
      var loginSection = $('#submit-form__auth-login');
      var userSection = $('#submit-form__auth-user');
      var formBody = $('#submit-form__body');

      if (Auth.isAuthenticated() && this.user) {
        hide(loginSection);
        show(userSection);
        $('#submit-form__username').textContent = '@' + this.user.login;
        show(formBody);
      } else {
        show(loginSection);
        hide(userSection);
        hide(formBody);
      }
    },

    onAuthenticated: async function () {
      try {
        this.user = await GitHubAPI.getUser();
        this.renderAuthState();
      } catch (e) {
        Auth.clearToken();
        this.renderAuthState();
        this.showFormError('Failed to verify GitHub authentication: ' + e.message);
      }
    },

    loadMarkdownFile: function (file) {
      var self = this;
      var reader = new FileReader();
      reader.onload = function () {
        var result = FileParser.parse(reader.result);
        if (!result) {
          self.showFormError('Could not parse the file. Make sure it starts with --- YAML frontmatter.');
          return;
        }
        self.parsed = result;
        self.populateFields(result.frontmatter);
        self.revalidate();
        show($('#submit-form__fields'));
        show($('#submit-form__images-section'));
        show($('#submit-form__actions'));
        hide($('#submit-form__parse-error'));
        // Show file name
        var nameEl = $('#submit-form__file-name');
        if (nameEl) { nameEl.textContent = file.name; show(nameEl); }
      };
      reader.readAsText(file);
    },

    onFileSelected: function (e) {
      var file = e.target.files[0];
      if (!file) return;
      if (!file.name.endsWith('.md')) {
        this.showFormError('Please upload a Markdown (.md) file.');
        return;
      }
      this.loadMarkdownFile(file);
    },

    onImagesSelected: function (e) {
      var errors = ImageHandler.addFiles(e.target.files);
      if (errors.length) this.showFormError(errors.join(' '));
      ImageHandler.renderPreviews();
      // Reset input so same file can be re-selected
      if (e.target.value) e.target.value = '';
    },

    populateFields: function (fm) {
      var setVal = function (id, val) {
        var el = $('#' + id);
        if (el) el.value = val || '';
      };

      setVal('sf-title', fm.title);
      setVal('sf-tags', Array.isArray(fm.tags) ? fm.tags.join(', ') : (fm.tags || ''));
      setVal('sf-labs', Array.isArray(fm.labs) ? fm.labs.join(', ') : (fm.labs || ''));
      setVal('sf-date', fm.date || fm.date_submitted || today());
      setVal('sf-doi', fm.doi);

      // Authors
      var authorsContainer = $('#sf-authors-list');
      if (authorsContainer && fm.authors) {
        authorsContainer.innerHTML = '';
        var display = fm.authors_display || [];
        var authors = Array.isArray(fm.authors) ? fm.authors : [fm.authors];
        authors.forEach(function (name, i) {
          var d = display[i] || {};
          var row = document.createElement('div');
          row.className = 'submit-form__author-row';
          row.innerHTML =
            '<input type="text" class="submit-form__input submit-form__editable" placeholder="Name" value="' + (d.name || name || '').replace(/"/g, '&quot;') + '" data-field="author-name">' +
            '<input type="text" class="submit-form__input submit-form__editable" placeholder="Affiliation" value="' + (d.affiliation || '').replace(/"/g, '&quot;') + '" data-field="author-affiliation">' +
            '<input type="text" class="submit-form__input submit-form__editable" placeholder="ORCID" value="' + (d.orcid || '') + '" data-field="author-orcid">' +
            '<button type="button" class="submit-form__author-remove" title="Remove">&times;</button>';
          authorsContainer.appendChild(row);
        });
        this.bindAuthorRemoveButtons();
      }

      // Scope checkboxes
      CONFIG.SCOPE_OPTIONS.forEach(function (opt) {
        var cb = $('#sf-scope-' + opt);
        if (cb) cb.checked = Array.isArray(fm.scope) && fm.scope.indexOf(opt) !== -1;
      });

      // Audience checkboxes
      CONFIG.AUDIENCE_OPTIONS.forEach(function (opt) {
        var cb = $('#sf-audience-' + opt);
        if (cb) cb.checked = Array.isArray(fm.audience) && fm.audience.indexOf(opt) !== -1;
      });

      // Math checkbox
      var mathCb = $('#sf-math');
      if (mathCb) mathCb.checked = !!fm.math;
    },

    bindAuthorRemoveButtons: function () {
      var self = this;
      $$('.submit-form__author-remove').forEach(function (btn) {
        btn.addEventListener('click', function () {
          btn.parentElement.remove();
          self.revalidate();
        });
      });
    },

    addAuthorRow: function () {
      var container = $('#sf-authors-list');
      if (!container) return;
      var row = document.createElement('div');
      row.className = 'submit-form__author-row';
      row.innerHTML =
        '<input type="text" class="submit-form__input submit-form__editable" placeholder="Name" data-field="author-name">' +
        '<input type="text" class="submit-form__input submit-form__editable" placeholder="Affiliation" data-field="author-affiliation">' +
        '<input type="text" class="submit-form__input submit-form__editable" placeholder="ORCID" data-field="author-orcid">' +
        '<button type="button" class="submit-form__author-remove" title="Remove">&times;</button>';
      container.appendChild(row);
      this.bindAuthorRemoveButtons();
    },

    readFieldsToFrontmatter: function () {
      var fm = Object.assign({}, this.parsed ? this.parsed.frontmatter : {});

      fm.title = ($('#sf-title') || {}).value || '';

      // Authors from rows
      var authorRows = $$('.submit-form__author-row');
      fm.authors = [];
      fm.authors_display = [];
      authorRows.forEach(function (row) {
        var inputs = row.querySelectorAll('input');
        var name = (inputs[0] || {}).value || '';
        if (!name.trim()) return;
        fm.authors.push(name.trim());
        fm.authors_display.push({
          name: name.trim(),
          affiliation: (inputs[1] || {}).value || '',
          orcid: (inputs[2] || {}).value || '',
        });
      });

      var tagsVal = ($('#sf-tags') || {}).value || '';
      fm.tags = tagsVal.split(',').map(function (t) { return t.trim().toLowerCase(); }).filter(Boolean);

      fm.scope = [];
      CONFIG.SCOPE_OPTIONS.forEach(function (opt) {
        var cb = $('#sf-scope-' + opt);
        if (cb && cb.checked) fm.scope.push(opt);
      });

      fm.audience = [];
      CONFIG.AUDIENCE_OPTIONS.forEach(function (opt) {
        var cb = $('#sf-audience-' + opt);
        if (cb && cb.checked) fm.audience.push(opt);
      });

      var labsVal = ($('#sf-labs') || {}).value || '';
      fm.labs = labsVal.split(',').map(function (l) { return l.trim(); }).filter(Boolean);

      fm.date = ($('#sf-date') || {}).value || today();
      fm.date_submitted = fm.date_submitted || today();
      fm.doi = ($('#sf-doi') || {}).value || '';
      fm.math = ($('#sf-math') || {}).checked || false;

      // Auto-set fields
      fm.editor = fm.editor || 'TBD';
      fm.categories = fm.categories || ['Blog Post'];
      fm.status = 'submitted';
      fm.revision = fm.revision || 1;

      return fm;
    },

    revalidate: function () {
      var fm = this.readFieldsToFrontmatter();
      var errors = Validate.run(fm);

      // Clear all errors
      $$('.submit-form__field-error').forEach(function (el) { el.textContent = ''; hide(el); });
      $$('.submit-form__input--error').forEach(function (el) { el.classList.remove('submit-form__input--error'); });

      // Show errors
      Object.keys(errors).forEach(function (field) {
        var errEl = $('#sf-error-' + field);
        if (errEl) { errEl.textContent = errors[field]; show(errEl); }
      });

      var submitBtn = $('#submit-form__submit-btn');
      if (submitBtn) submitBtn.disabled = Validate.hasErrors(errors);

      return errors;
    },

    showFormError: function (msg) {
      var el = $('#submit-form__form-error');
      if (el) { el.textContent = msg; show(el); }
    },

    clearFormError: function () {
      var el = $('#submit-form__form-error');
      if (el) { el.textContent = ''; hide(el); }
    },

    onSubmit: async function () {
      if (this.submitting) return;
      this.clearFormError();

      var fm = this.readFieldsToFrontmatter();
      var errors = this.revalidate();
      if (Validate.hasErrors(errors)) {
        this.showFormError('Please fix the validation errors above.');
        return;
      }

      this.submitting = true;
      var submitBtn = $('#submit-form__submit-btn');
      if (submitBtn) submitBtn.disabled = true;
      Progress.reset();

      var state = {};

      try {
        // Determine post ID
        this.postId = await PostID.getNext();
        fm.post_id = this.postId;

        // Featured image: if user uploaded images and frontmatter has image, check if it matches
        if (fm.image && ImageHandler.files.length) {
          var found = ImageHandler.files.some(function (f) {
            return ImageHandler.sanitizeName(f.name) === fm.image || f.name === fm.image;
          });
          if (!found) fm.image = '';
        }

        var body = this.parsed ? this.parsed.body : '';
        var mdContent = MarkdownGen.generate(fm, body);
        var branchName = 'blog/' + this.postId;

        // Step 1: Fork
        Progress.setStep(0);
        var fork = await GitHubAPI.forkRepo();
        state.forkOwner = fork.owner.login;

        // Wait for fork to be ready (GitHub needs a moment)
        await new Promise(function (resolve) { setTimeout(resolve, 3000); });

        // Sync fork with upstream
        try { await GitHubAPI.syncFork(state.forkOwner); } catch (e) { /* may fail if fork is fresh */ }

        Progress.complete(0);

        // Step 2: Create branch
        Progress.setStep(1);
        var mainRef = await GitHubAPI.getRef(state.forkOwner, CONFIG.DEFAULT_BRANCH);
        state.baseSha = mainRef.object.sha;

        // Check if branch already exists and delete it
        try {
          await GitHubAPI.getRef(state.forkOwner, branchName);
          await GitHubAPI.deleteRef(state.forkOwner, branchName);
        } catch (e) { /* branch doesn't exist, good */ }

        await GitHubAPI.createRef(state.forkOwner, branchName, state.baseSha);
        Progress.complete(1);

        // Step 3: Upload files as blobs
        Progress.setStep(2);
        var treeItems = [];
        var blogDir = CONFIG.BLOGS_PATH + '/' + this.postId;

        // index.md blob
        var mdBlob = await GitHubAPI.createBlob(state.forkOwner, btoa(unescape(encodeURIComponent(mdContent))), 'base64');
        treeItems.push({ path: blogDir + '/index.md', mode: '100644', type: 'blob', sha: mdBlob.sha });

        // Image blobs (parallel)
        var imagePromises = ImageHandler.files.map(async function (file) {
          var base64 = await ImageHandler.readAsBase64(file);
          var blob = await GitHubAPI.createBlob(state.forkOwner, base64, 'base64');
          return { path: blogDir + '/' + ImageHandler.sanitizeName(file.name), mode: '100644', type: 'blob', sha: blob.sha };
        });
        var imageItems = await Promise.all(imagePromises);
        treeItems = treeItems.concat(imageItems);
        Progress.complete(2);

        // Step 4: Create tree and commit
        Progress.setStep(3);
        // Get the base tree SHA
        var baseCommit = await GitHubAPI.request('GET', '/repos/' + state.forkOwner + '/' + CONFIG.REPO + '/git/commits/' + state.baseSha);
        var tree = await GitHubAPI.createTree(state.forkOwner, baseCommit.tree.sha, treeItems);
        var commit = await GitHubAPI.createCommit(
          state.forkOwner,
          'Add blog post ' + this.postId + ': ' + fm.title,
          tree.sha,
          [state.baseSha]
        );
        await GitHubAPI.updateRef(state.forkOwner, branchName, commit.sha);
        Progress.complete(3);

        // Step 5: Create PR
        Progress.setStep(4);
        var prBody =
          '# Blog Post Submission\n\n' +
          '- [x] Post uses the [blog post template](https://github.com/genomicsxai/genomicsxai.github.io/blob/main/docs/blog-post-template.md) and required frontmatter is complete\n' +
          '- [ ] Content follows [submission guidelines](https://genomicsxai.github.io/submission-guidelines/)\n' +
          '- [ ] Lab review completed\n' +
          '- [ ] Links and assets validated\n\n' +
          '## Notes for Editors\n' +
          'Submitted via the web form by @' + this.user.login + '.\n' +
          'Post ID: ' + this.postId + '\n';

        var pr = await GitHubAPI.createPR(
          state.forkOwner + ':' + branchName,
          'Blog post ' + this.postId + ': ' + fm.title,
          prBody
        );
        Progress.complete(4);

        // Show success
        this.showSuccess(pr.html_url, pr.number);
        this.pollForPreview(pr.number);

      } catch (e) {
        Progress.showError(e.message);
        this.showFormError('Submission failed: ' + e.message);
      } finally {
        this.submitting = false;
        if (submitBtn) submitBtn.disabled = false;
      }
    },

    showSuccess: function (prUrl, prNumber) {
      var el = $('#submit-form__success');
      if (el) {
        el.innerHTML =
          '<strong>Submission successful!</strong> ' +
          'Your pull request has been created: <a href="' + prUrl + '" target="_blank" rel="noopener">PR #' + prNumber + '</a>.<br>' +
          '<span id="submit-form__preview-status">Building a live preview of your post — this usually takes 1–3 minutes.</span>';
        show(el);
      }
      hide($('#submit-form__actions'));
    },

    pollForPreview: async function (prNumber) {
      var maxAttempts = 30; // ~5 minutes at 10s intervals
      var statusEl = function () { return $('#submit-form__preview-status'); };
      for (var i = 0; i < maxAttempts; i++) {
        await new Promise(function (r) { setTimeout(r, 10000); });
        try {
          var comments = await GitHubAPI.request(
            'GET',
            '/repos/' + CONFIG.OWNER + '/' + CONFIG.REPO + '/issues/' + prNumber + '/comments'
          );
          for (var j = 0; j < comments.length; j++) {
            var c = comments[j];
            if (c.user && c.user.login === 'github-actions[bot]' && c.body && /Preview URL/i.test(c.body)) {
              var match = c.body.match(/https?:\/\/[^\s)]+\/previews\/pr-\d+\/?/);
              if (match) {
                var s = statusEl();
                if (s) {
                  s.innerHTML =
                    'Live preview is ready: <a href="' + match[0] + '" target="_blank" rel="noopener">' + match[0] + '</a>';
                }
                return;
              }
            }
          }
        } catch (e) {
          // Ignore transient errors and keep polling
        }
      }
      var s = statusEl();
      if (s) {
        s.innerHTML =
          'Preview is taking longer than usual. Check the <a href="https://github.com/' + CONFIG.OWNER + '/' + CONFIG.REPO + '/pull/' + prNumber + '" target="_blank" rel="noopener">PR comments</a> for the preview link.';
      }
    },
  };

  // ── Init ──
  document.addEventListener('DOMContentLoaded', function () {
    // Bind the "Add author" button (static element)
    var addAuthorBtn = $('#sf-add-author');
    if (addAuthorBtn) {
      addAuthorBtn.addEventListener('click', function () { FormController.addAuthorRow(); });
    }

    FormController.init();
  });
})();
