/**
 * Job Notification Tracker — Premium app with jobs data and rendering
 * KodNest design system. No matching, digest logic, or scoring.
 */


const STORAGE_KEY = 'jobTrackerSaved';
const PREFERENCES_KEY = 'jobTrackerPreferences';
const STATUS_KEY = 'jobTrackerStatus';
const HISTORY_KEY = 'jobTrackerStatusHistory';
const AUTH_KEY = 'kcarrier_auth';
const USERS_KEY = 'kcarrier_users';

const ROUTES = {
  '': 'landing',
  login: 'login',
  register: 'register',
  dashboard: 'dashboard',
  saved: 'saved',
  digest: 'digest',
  settings: 'settings',
  profile: 'profile',
  'jt/07-test': 'test',
  'jt/08-ship': 'ship'
};

var filterState = {
  keyword: '',
  location: '',
  mode: '',
  experience: '',
  source: '',
  sort: 'latest',
  showOnlyMatches: false,
  status: ''
};

var keywordDebounceTimer = null;

function defaultPreferences() {
  return {
    roleKeywords: '',
    preferredLocations: [],
    preferredMode: [],
    experienceLevel: '',
    skills: '',
    minMatchScore: 40
  };
}

function getPreferences() {
  try {
    var raw = localStorage.getItem(PREFERENCES_KEY);
    if (!raw) return null;
    var p = JSON.parse(raw);
    return {
      roleKeywords: p.roleKeywords != null ? p.roleKeywords : '',
      preferredLocations: Array.isArray(p.preferredLocations) ? p.preferredLocations : [],
      preferredMode: Array.isArray(p.preferredMode) ? p.preferredMode : [],
      experienceLevel: p.experienceLevel != null ? p.experienceLevel : '',
      skills: p.skills != null ? p.skills : '',
      minMatchScore: typeof p.minMatchScore === 'number' ? Math.max(0, Math.min(100, p.minMatchScore)) : 40
    };
  } catch (e) {
    return null;
  }
}

function savePreferences(prefs) {
  localStorage.setItem(PREFERENCES_KEY, JSON.stringify(prefs));
}

function hasPreferences() {
  var p = getPreferences();
  if (!p) return false;
  return p.roleKeywords.length > 0 || p.preferredLocations.length > 0 || p.preferredMode.length > 0 ||
    p.experienceLevel.length > 0 || p.skills.length > 0;
}

function getRoute() {
  var hash = window.location.hash.slice(1) || '';
  return hash.replace(/^\/?|\/$/g, '') || '';
}

function getRouteName(path) {
  if (ROUTES[path]) return ROUTES[path];
  // Broad check for any dashboard route
  if (path.indexOf('dashboard') === 0) return 'dashboard';
  return 'landing';
}

function getJobs() {
  return window.JOB_LIST || [];
}

function getSavedIds() {
  try {
    var raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch (e) {
    return [];
  }
}

function saveJob(id) {
  var ids = getSavedIds();
  if (ids.indexOf(id) === -1) {
    ids.push(id);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(ids));
  }
}

function unsaveJob(id) {
  var ids = getSavedIds().filter(function (x) { return x !== id; });
  localStorage.setItem(STORAGE_KEY, JSON.stringify(ids));
}

function isSaved(id) {
  return getSavedIds().indexOf(id) !== -1;
}

function getStatus(id) {
  try {
    var raw = localStorage.getItem(STATUS_KEY);
    var map = raw ? JSON.parse(raw) : {};
    return map[id] || 'Not Applied';
  } catch (e) {
    return 'Not Applied';
  }
}

function saveStatus(id, status) {
  try {
    var raw = localStorage.getItem(STATUS_KEY);
    var map = raw ? JSON.parse(raw) : {};
    map[id] = status;
    localStorage.setItem(STATUS_KEY, JSON.stringify(map));

    // Update history
    var job = getJobById(id);
    if (job) {
      addToHistory(job, status);
    }
  } catch (e) {
    console.error('Failed to save status', e);
  }
}

function getStatusHistory() {
  try {
    var raw = localStorage.getItem(HISTORY_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch (e) {
    return [];
  }
}

function addToHistory(job, status) {
  var history = getStatusHistory();
  var item = {
    title: job.title,
    company: job.company,
    status: status,
    date: new Date().toISOString()
  };
  history.unshift(item);
  if (history.length > 10) history = history.slice(0, 10);
  localStorage.setItem(HISTORY_KEY, JSON.stringify(history));
}

/* ─── Authentication Logic ─── */
function getUsers() {
  try {
    var raw = localStorage.getItem(USERS_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch (e) {
    return [];
  }
}

function saveUsers(users) {
  localStorage.setItem(USERS_KEY, JSON.stringify(users));
}

function getCurrentUser() {
  try {
    var raw = localStorage.getItem(AUTH_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch (e) {
    return null;
  }
}

function loginUser(email, password) {
  var users = getUsers();
  var user = users.find(function (u) { return u.email === email && u.password === password; });
  if (user) {
    var session = { email: user.email, fullName: user.fullName, loggedInAt: new Date().toISOString() };
    localStorage.setItem(AUTH_KEY, JSON.stringify(session));
    return true;
  }
  return false;
}

function registerUser(email, password, fullName) {
  var users = getUsers();
  if (users.some(function (u) { return u.email === email; })) {
    return { success: false, message: 'Email already registered' };
  }
  users.push({ email: email, password: password, fullName: fullName });
  saveUsers(users);
  return { success: true };
}

function logoutUser() {
  localStorage.removeItem(AUTH_KEY);
  window.location.hash = '#/login';
}

function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function showToast(message) {
  var toast = document.createElement('div');
  toast.className = 'app-toast';
  toast.textContent = message;
  document.body.appendChild(toast);
  setTimeout(function () {
    toast.classList.add('is-visible');
  }, 10);
  setTimeout(function () {
    toast.classList.remove('is-visible');
    setTimeout(function () {
      document.body.removeChild(toast);
    }, 300);
  }, 3000);
}

/* ─── Test Checklist Logic ─── */
const TEST_CHECKLIST_KEY = 'jobTrackerTestChecklist';
const TEST_ITEMS = [
  'Preferences persist after refresh',
  'Match score calculates correctly',
  '"Show only matches" toggle works',
  'Save job persists after refresh',
  'Apply opens in new tab',
  'Status update persists after refresh',
  'Status filter works correctly',
  'Digest generates top 10 by score',
  'Digest persists for the day',
  'No console errors on main pages'
];

function getTestChecklist() {
  try {
    var raw = localStorage.getItem(TEST_CHECKLIST_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch (e) {
    return [];
  }
}

function toggleTestItem(index) {
  var list = getTestChecklist();
  if (list.includes(index)) {
    list = list.filter(function (i) { return i !== index; });
  } else {
    list.push(index);
  }
  localStorage.setItem(TEST_CHECKLIST_KEY, JSON.stringify(list));
}

function resetTestChecklist() {
  localStorage.removeItem(TEST_CHECKLIST_KEY);
}

function areAllTestsPassed() {
  var list = getTestChecklist();
  return list.length === TEST_ITEMS.length;
}

function copySubmissionToClipboard() {
  // Removed Proof section
}

function parseCommaList(s) {
  if (!s || typeof s !== 'string') return [];
  return s.split(',').map(function (x) { return x.trim().toLowerCase(); }).filter(Boolean);
}

function computeMatchScore(job, prefs) {
  if (!prefs) return 0;
  var score = 0;
  var roleKeywords = parseCommaList(prefs.roleKeywords);
  var userSkills = parseCommaList(prefs.skills);
  var title = (job.title || '').toLowerCase();
  var desc = (job.description || '').toLowerCase();

  if (roleKeywords.length > 0) {
    var inTitle = roleKeywords.some(function (kw) { return title.indexOf(kw) !== -1; });
    if (inTitle) score += 25;
    var inDesc = roleKeywords.some(function (kw) { return desc.indexOf(kw) !== -1; });
    if (inDesc) score += 15;
  }
  if (prefs.preferredLocations.length > 0 && job.location && prefs.preferredLocations.indexOf(job.location) !== -1) {
    score += 15;
  }
  if (prefs.preferredMode.length > 0 && job.mode && prefs.preferredMode.indexOf(job.mode) !== -1) {
    score += 10;
  }
  if (prefs.experienceLevel && job.experience === prefs.experienceLevel) {
    score += 10;
  }
  if (userSkills.length > 0 && job.skills && Array.isArray(job.skills)) {
    var jobSkillsLower = job.skills.map(function (s) { return (s || '').toLowerCase(); });
    var overlap = userSkills.some(function (us) {
      return jobSkillsLower.some(function (js) { return js.indexOf(us) !== -1 || us.indexOf(js) !== -1; });
    });
    if (overlap) score += 15;
  }
  if (job.postedDaysAgo != null && job.postedDaysAgo <= 2) score += 5;
  if (job.source === 'LinkedIn') score += 5;

  return Math.min(100, score);
}

function extractSalaryNumber(salaryRange) {
  if (!salaryRange || typeof salaryRange !== 'string') return 0;
  var m = salaryRange.match(/\d+/);
  return m ? parseInt(m[0], 10) : 0;
}

function getFilteredJobs(jobList) {
  var list = (jobList || getJobs()).slice();
  var k = (filterState.keyword || '').toLowerCase().trim();
  if (k) {
    list = list.filter(function (j) {
      return (j.title && j.title.toLowerCase().indexOf(k) !== -1) ||
        (j.company && j.company.toLowerCase().indexOf(k) !== -1);
    });
  }
  if (filterState.location) {
    list = list.filter(function (j) { return j.location === filterState.location; });
  }
  if (filterState.mode) {
    list = list.filter(function (j) { return j.mode === filterState.mode; });
  }
  if (filterState.experience) {
    list = list.filter(function (j) { return j.experience === filterState.experience; });
  }
  if (filterState.source) {
    list = list.filter(function (j) { return j.source === filterState.source; });
  }
  if (filterState.status) {
    list = list.filter(function (j) { return getStatus(j.id) === filterState.status; });
  }

  var prefs = getPreferences();
  var minScore = (prefs && prefs.minMatchScore != null) ? prefs.minMatchScore : 40;
  list.forEach(function (j) {
    j.matchScore = computeMatchScore(j, prefs);
  });
  if (filterState.showOnlyMatches && prefs) {
    list = list.filter(function (j) { return j.matchScore >= minScore; });
  }

  var sortBy = filterState.sort || 'latest';
  if (sortBy === 'latest') {
    list.sort(function (a, b) {
      return (a.postedDaysAgo != null ? a.postedDaysAgo : 99) - (b.postedDaysAgo != null ? b.postedDaysAgo : 99);
    });
  } else if (sortBy === 'match') {
    list.sort(function (a, b) {
      return (b.matchScore != null ? b.matchScore : 0) - (a.matchScore != null ? a.matchScore : 0);
    });
  } else if (sortBy === 'salary') {
    list.sort(function (a, b) {
      var na = extractSalaryNumber(a.salaryRange);
      var nb = extractSalaryNumber(b.salaryRange);
      return nb - na;
    });
  }
  return list;
}

function getUniqueValues(key) {
  var jobs = getJobs();
  var set = {};
  jobs.forEach(function (j) {
    var v = j[key];
    if (v) set[v] = true;
  });
  return Object.keys(set).sort();
}

function postedLabel(days) {
  if (days === 0) return 'Today';
  if (days === 1) return '1 day ago';
  return days + ' days ago';
}

function escapeHtml(s) {
  if (!s) return '';
  var div = document.createElement('div');
  div.textContent = s;
  return div.innerHTML;
}

function matchScoreBadgeClass(score) {
  if (score == null) return '';
  if (score >= 80) return ' app-job-card__match--high';
  if (score >= 60) return ' app-job-card__match--medium';
  if (score >= 40) return ' app-job-card__match--neutral';
  return ' app-job-card__match--low';
}

function jobCardHtml(job, options) {
  options = options || {};
  var saved = options.saved !== false && isSaved(job.id);
  var showSave = options.showSave !== false;
  var currentStatus = getStatus(job.id);
  var title = escapeHtml(job.title);
  var company = escapeHtml(job.company);
  var locationMode = escapeHtml((job.location || '') + (job.mode ? ' · ' + job.mode : ''));
  var experience = escapeHtml(job.experience || '');
  var salary = escapeHtml(job.salaryRange || '');
  var source = escapeHtml(job.source || '');
  var posted = postedLabel(job.postedDaysAgo);
  var saveLabel = saved ? 'Unsave' : 'Save';
  var saveClass = saved ? ' app-job-card__save--saved' : '';

  var statusBorderClass = '';
  if (currentStatus === 'Applied') statusBorderClass = ' app-job-card--applied';
  else if (currentStatus === 'Rejected') statusBorderClass = ' app-job-card--rejected';
  else if (currentStatus === 'Selected') statusBorderClass = ' app-job-card--selected';

  var statusOptions = ['Not Applied', 'Applied', 'Rejected', 'Selected'].map(function (s) {
    var selected = s === currentStatus ? ' selected' : '';
    return '<option value="' + s + '"' + selected + '>' + s + '</option>';
  }).join('');

  var statusSelect = '<div class="app-job-card__status">' +
    '<select class="app-status-select" data-job-id="' + escapeHtml(job.id) + '" data-action="status-change">' +
    statusOptions +
    '</select>' +
    '</div>';

  var saveBtn = showSave
    ? '<button type="button" class="kn-btn kn-btn--secondary app-job-card__save' + saveClass + '" data-job-id="' + escapeHtml(job.id) + '" data-action="save">' + saveLabel + '</button>'
    : '<button type="button" class="kn-btn kn-btn--secondary app-job-card__save' + saveClass + '" data-job-id="' + escapeHtml(job.id) + '" data-action="unsave">Unsave</button>';
  var scoreBadge = '';
  if (job.matchScore != null) {
    var scoreClass = matchScoreBadgeClass(job.matchScore);
    scoreBadge = '<span class="app-job-card__match' + scoreClass + '">' + job.matchScore + '% match</span>';
  }
  return (
    '<article class="kn-card app-job-card' + statusBorderClass + '" data-job-id="' + escapeHtml(job.id) + '">' +
    '<div class="app-job-card__header">' +
    '<h3 class="app-job-card__title">' + title + '</h3>' +
    '<div class="app-job-card__header-right">' +
    scoreBadge +
    '<span class="app-job-card__source">' + source + '</span>' +
    '</div>' +
    '</div>' +
    '<p class="app-job-card__company">' + company + '</p>' +
    '<p class="app-job-card__meta">' + locationMode + '</p>' +
    '<p class="app-job-card__meta">' + experience + ' · ' + salary + '</p>' +
    '<div class="app-job-card__footer-row">' +
    '<p class="app-job-card__posted">' + posted + '</p>' +
    statusSelect +
    '</div>' +
    '<div class="app-job-card__actions">' +
    '<button type="button" class="kn-btn kn-btn--secondary" data-job-id="' + escapeHtml(job.id) + '" data-action="view">View</button>' +
    saveBtn +
    '<a href="' + escapeHtml(job.applyUrl || '#') + '" target="_blank" rel="noopener" class="kn-btn kn-btn--primary" data-action="apply">Apply</a>' +
    '</div>' +
    '</article>'
  );
}

function filterBarHtml() {
  var locations = getUniqueValues('location');
  var locOpts = '<option value="">All locations</option>' + locations.map(function (l) {
    return '<option value="' + escapeHtml(l) + '"' + (filterState.location === l ? ' selected' : '') + '>' + escapeHtml(l) + '</option>';
  }).join('');
  var modeOpts = '<option value="">All modes</option><option value="Remote"' + (filterState.mode === 'Remote' ? ' selected' : '') + '>Remote</option><option value="Hybrid"' + (filterState.mode === 'Hybrid' ? ' selected' : '') + '>Hybrid</option><option value="Onsite"' + (filterState.mode === 'Onsite' ? ' selected' : '') + '>Onsite</option>';
  var experiences = getUniqueValues('experience');
  var expOpts = '<option value="">All experience</option>' + experiences.map(function (e) {
    return '<option value="' + escapeHtml(e) + '"' + (filterState.experience === e ? ' selected' : '') + '>' + escapeHtml(e) + '</option>';
  }).join('');
  var sources = getUniqueValues('source');
  var srcOpts = '<option value="">All sources</option>' + sources.map(function (s) {
    return '<option value="' + escapeHtml(s) + '"' + (filterState.source === s ? ' selected' : '') + '>' + escapeHtml(s) + '</option>';
  }).join('');
  var sortOpts = '<option value="latest"' + (filterState.sort === 'latest' ? ' selected' : '') + '>Latest</option>' +
    '<option value="match"' + (filterState.sort === 'match' ? ' selected' : '') + '>Match Score</option>' +
    '<option value="salary"' + (filterState.sort === 'salary' ? ' selected' : '') + '>Salary</option>';

  var statusOpts = '<option value="">All statuses</option>' +
    ['Not Applied', 'Applied', 'Rejected', 'Selected'].map(function (s) {
      return '<option value="' + s + '"' + (filterState.status === s ? ' selected' : '') + '>' + s + '</option>';
    }).join('');

  var prefs = getPreferences();
  var minScore = (prefs && prefs.minMatchScore != null) ? prefs.minMatchScore : 40;
  var toggleChecked = filterState.showOnlyMatches ? ' checked' : '';
  var toggleLabel = 'Show only jobs above my threshold (' + minScore + '%)';
  return (
    '<div class="app-filters">' +
    '<input type="text" class="kn-input app-filters__keyword" placeholder="Search title or company" value="' + escapeHtml(filterState.keyword) + '" data-filter="keyword">' +
    '<select class="kn-input app-filters__select" data-filter="location">' + locOpts + '</select>' +
    '<select class="kn-input app-filters__select" data-filter="mode">' + modeOpts + '</select>' +
    '<select class="kn-input app-filters__select" data-filter="experience">' + expOpts + '</select>' +
    '<select class="kn-input app-filters__select" data-filter="source">' + srcOpts + '</select>' +
    '<select class="kn-input app-filters__select" data-filter="status">' + statusOpts + '</select>' +
    '<select class="kn-input app-filters__select" data-filter="sort">' + sortOpts + '</select>' +
    '<label class="app-filters__toggle">' +
    '<input type="checkbox" class="app-filters__checkbox" data-filter="showOnlyMatches"' + toggleChecked + '>' +
    '<span class="app-filters__toggle-label">' + escapeHtml(toggleLabel) + '</span>' +
    '</label>' +
    '<button type="button" class="kn-btn kn-btn--secondary app-filters__clear" id="btn-clear-filters" style="margin-left: auto;">Clear All</button>' +
    '</div>'
  );
}

function openModal(job) {
  var modal = document.getElementById('job-modal');
  var titleEl = modal.querySelector('.app-modal__title');
  var companyEl = modal.querySelector('.app-modal__company');
  var descEl = modal.querySelector('.app-modal__description');
  var skillsEl = modal.querySelector('.app-modal__skills');
  if (!titleEl || !descEl || !skillsEl) return;
  titleEl.textContent = job.title || '';
  companyEl.textContent = job.company ? job.company + (job.location ? ' · ' + job.location : '') : '';
  descEl.textContent = job.description || '';
  skillsEl.textContent = job.skills && job.skills.length ? 'Skills: ' + job.skills.join(', ') : '';
  modal.hidden = false;
  document.body.classList.add('app-modal-open');
}

function closeModal() {
  var modal = document.getElementById('job-modal');
  if (modal) {
    modal.hidden = true;
    document.body.classList.remove('app-modal-open');
  }
}

function setupModal() {
  var modal = document.getElementById('job-modal');
  if (!modal) return;
  modal.querySelector('.app-modal__backdrop').addEventListener('click', closeModal);
  modal.querySelector('.app-modal__close').addEventListener('click', closeModal);
}

function getJobById(id) {
  return getJobs().filter(function (j) { return j.id === id; })[0] || null;
}

function renderDashboardResults(filtered) {
  var container = document.querySelector('.app-dashboard__results');
  if (!container) return;
  if (filtered.length === 0) {
    container.innerHTML = '<div class="empty-state"><p class="empty-state__title">No roles match your criteria.</p><p class="empty-state__hint">Adjust filters or lower threshold.</p></div>';
  } else {
    var cardsHtml = filtered.map(function (j) { return jobCardHtml(j); }).join('');
    container.innerHTML = '<div class="app-dashboard__list">' + cardsHtml + '</div>';
  }
}

function setupAppEvents() {
  document.addEventListener('input', function (e) {
    var t = e.target;
    if (t.id === 'field-minMatchScore') {
      var span = document.getElementById('minMatchScore-value');
      if (span) span.textContent = t.value;
      return;
    }
    if (t.dataset.filter !== 'keyword') return;
    var value = t.value;
    clearTimeout(keywordDebounceTimer);
    keywordDebounceTimer = setTimeout(function () {
      filterState.keyword = value;
      if (getRouteName(getRoute()) === 'dashboard') {
        var filtered = getFilteredJobs();
        renderDashboardResults(filtered);
      }
    }, 200);
  });

  document.addEventListener('change', function (e) {
    if (e.target.dataset.action === 'status-change') {
      var id = e.target.dataset.jobId;
      var status = e.target.value;
      saveStatus(id, status);

      // Visual feedback
      var card = e.target.closest('.app-job-card');
      if (card) {
        card.classList.remove('app-job-card--applied', 'app-job-card--rejected', 'app-job-card--selected');
        if (status === 'Applied') card.classList.add('app-job-card--applied');
        else if (status === 'Rejected') card.classList.add('app-job-card--rejected');
        else if (status === 'Selected') card.classList.add('app-job-card--selected');
      }

      showToast('Status updated: ' + status);

      // Refresh list if filtering by status
      if (filterState.status && filterState.status !== status) {
        if (getRouteName(getRoute()) === 'dashboard') {
          var filtered = getFilteredJobs();
          renderDashboardResults(filtered);
        }
      }
      return;
    }

    var t = e.target;
    if (!t.dataset.filter || t.dataset.filter === 'keyword') return;
    if (t.dataset.filter === 'showOnlyMatches') {
      filterState.showOnlyMatches = t.checked;
    } else {
      filterState[t.dataset.filter] = t.value || '';
    }
    if (getRouteName(getRoute()) === 'dashboard') {
      var filtered = getFilteredJobs();
      renderDashboardResults(filtered);
    }
  });

  document.addEventListener('submit', function (e) {
    if (e.target.id === 'login-form') {
      e.preventDefault();
      var email = e.target.email.value;
      var password = e.target.password.value;
      if (loginUser(email, password)) {
        showToast('Login successful!');
        window.location.hash = '#/dashboard';
      } else {
        alert('Invalid email or password');
      }
      return;
    }

    if (e.target.id === 'register-form') {
      e.preventDefault();
      var fullName = e.target.fullName.value;
      var email = e.target.email.value;
      var password = e.target.password.value;

      if (!isValidEmail(email)) {
        alert('Please enter a valid email address');
        return;
      }

      var res = registerUser(email, password, fullName);
      if (res.success) {
        showToast('Registration successful! Please login.');
        window.location.hash = '#/login';
      } else {
        alert(res.message);
      }
      return;
    }

    if (e.target.id !== 'settings-form') return;
    e.preventDefault();
    var form = e.target;
    var roleKeywords = (form.querySelector('[name="roleKeywords"]') && form.querySelector('[name="roleKeywords"]').value) || '';
    var locSelect = form.querySelector('[name="preferredLocations"]');
    var preferredLocations = [];
    if (locSelect && locSelect.multiple) {
      for (var i = 0; i < locSelect.options.length; i++) {
        if (locSelect.options[i].selected) preferredLocations.push(locSelect.options[i].value);
      }
    }
    var modeChecks = form.querySelectorAll('[name="preferredMode"]:checked');
    var preferredMode = [];
    for (var j = 0; j < modeChecks.length; j++) preferredMode.push(modeChecks[j].value);
    var experienceLevel = (form.querySelector('[name="experienceLevel"]') && form.querySelector('[name="experienceLevel"]').value) || '';
    var skills = (form.querySelector('[name="skills"]') && form.querySelector('[name="skills"]').value) || '';
    var minMatchScoreEl = form.querySelector('[name="minMatchScore"]');
    var minMatchScore = minMatchScoreEl ? parseInt(minMatchScoreEl.value, 10) : 40;
    if (isNaN(minMatchScore)) minMatchScore = 40;
    minMatchScore = Math.max(0, Math.min(100, minMatchScore));
    var prefs = {
      roleKeywords: roleKeywords,
      preferredLocations: preferredLocations,
      preferredMode: preferredMode,
      experienceLevel: experienceLevel,
      skills: skills,
      minMatchScore: minMatchScore
    };
    savePreferences(prefs);
    if (getRouteName(getRoute()) === 'settings') render();
    if (getRouteName(getRoute()) === 'dashboard') {
      var filtered = getFilteredJobs();
      renderDashboardResults(filtered);
    }
  });

  document.addEventListener('click', function (e) {
    var btn = e.target.closest('[data-job-id][data-action]');
    if (!btn) return;
    var id = btn.getAttribute('data-job-id');
    var action = btn.getAttribute('data-action');
    var job = getJobById(id);
    if (action === 'view' && job) {
      e.preventDefault();
      openModal(job);
    } else if (action === 'save') {
      e.preventDefault();
      saveJob(id);
      if (getRouteName(getRoute()) === 'saved') {
        render();
      } else {
        var container = document.getElementById('app-page');
        var card = container && container.querySelector('.app-job-card[data-job-id="' + id + '"]');
        var saveBtn = card && card.querySelector('.app-job-card__save');
        if (saveBtn) {
          saveBtn.textContent = 'Unsave';
          saveBtn.classList.add('app-job-card__save--saved');
          saveBtn.setAttribute('data-action', 'unsave');
        }
      }
    } else if (action === 'unsave') {
      e.preventDefault();
      unsaveJob(id);
      if (getRouteName(getRoute()) === 'saved') {
        render();
      } else {
        var container = document.getElementById('app-page');
        var card = container && container.querySelector('.app-job-card[data-job-id="' + id + '"]');
        var saveBtn = card && card.querySelector('.app-job-card__save');
        if (saveBtn) {
          saveBtn.textContent = 'Save';
          saveBtn.classList.remove('app-job-card__save--saved');
          saveBtn.setAttribute('data-action', 'save');
        }
      }
    } else if (action === 'apply' && job) {
      window.open(job.applyUrl, '_blank', 'noopener');
    }
  });

  document.addEventListener('click', function (e) {
    if (e.target.id === 'btn-clear-filters') {
      filterState = {
        keyword: '',
        location: '',
        mode: '',
        experience: '',
        source: '',
        sort: 'latest',
        showOnlyMatches: false,
        status: ''
      };
      render();
      return;
    }

    if (e.target.id === 'btn-reset-tests') {
      if (confirm('Are you sure you want to reset all test progress?')) {
        resetTestChecklist();
        render();
      }
      return;
    }

    if (e.target.classList.contains('app-test-check')) {
      var index = parseInt(e.target.dataset.index, 10);
      toggleTestItem(index);
      render(); // Re-render to update summary and ship lock
      return;
    }

    if (e.target.closest('#btn-generate-digest') || e.target.closest('#btn-regenerate-digest')) {
      e.preventDefault();
      var digest = generateDigest();
      render(); // Re-render to show the digest
    } else if (e.target.closest('#btn-copy-digest')) {
      var digest = getDigest();
      copyDigestToClipboard(digest);
    } else if (e.target.closest('#btn-email-digest')) {
      var digest = getDigest();
      createEmailDraft(digest);
    }
  });

  document.addEventListener('input', function (e) {
    if (e.target.classList.contains('app-proof-input')) {
      var field = e.target.dataset.field;
      var val = e.target.value.trim();
      var data = getProofData();
      data[field] = val;
      saveProofData(data);

      // Basic status update
      var newStatus = getProjectStatus();
      var badge = document.querySelector('.app-status-badge');
      if (badge) {
        badge.textContent = newStatus;
        badge.className = 'app-status-badge';
        if (newStatus === 'Shipped') badge.classList.add('app-status-badge--success');
        else if (newStatus === 'In Progress') badge.classList.add('app-status-badge--warning');
      }

      // Update completion message
      var completion = document.querySelector('.app-proof-completion');
      if (newStatus === 'Shipped' && !completion) {
        var actions = document.querySelector('.app-proof-actions');
        if (actions) {
          var msg = document.createElement('div');
          msg.className = 'app-proof-completion';
          msg.textContent = 'Project 1 Shipped Successfully.';
          if (actions.nextSibling) actions.parentNode.insertBefore(msg, actions.nextSibling);
          else actions.parentNode.appendChild(msg);
        }
      } else if (newStatus !== 'Shipped' && completion) {
        completion.remove();
      }
    }
  });

  document.addEventListener('click', function (e) {
    if (e.target.classList.contains('btn-logout')) {
      logoutUser();
      return;
    }

    if (e.target.classList.contains('btn-upload-resume')) {
      var fileInput = document.getElementById('resume-upload');
      if (fileInput && fileInput.files.length > 0) {
        var file = fileInput.files[0];
        var reader = new FileReader();
        reader.onload = function (event) {
          var data = {
            name: file.name,
            size: file.size,
            type: file.type,
            lastModified: file.lastModified,
            uploadedAt: new Date().toISOString()
          };
          saveResumeData(data);
          showToast('Resume uploaded successfully!');
          render(); // Refresh UI
          
          // Auto-trigger analysis
          setTimeout(function() {
            analyzeResume(data);
          }, 500);
        };
        reader.readAsDataURL(file);
      } else {
        alert('Please select a file first.');
      }
      return;
    }

    if (e.target.classList.contains('btn-analyze-resume')) {
      var data = getResumeData();
      if (data) {
        analyzeResume(data);
      }
      return;
    }
  });
}

function analyzeResume(data) {
  var resultsContainer = document.getElementById('resume-analysis-results');
  if (!resultsContainer) return;

  resultsContainer.innerHTML = '<div class="kn-card kn-p-4 kn-text-center"><p>Analyzing resume skills and ATS compatibility...</p></div>';

  setTimeout(function () {
    // Generate a deterministic score based on file name and size
    var str = (data.name || '') + (data.size || 0);
    var hash = 0;
    for (var i = 0; i < str.length; i++) {
      hash = ((hash << 5) - hash) + str.charCodeAt(i);
      hash |= 0;
    }
    // Result between 72 and 92
    var score = 72 + (Math.abs(hash) % 21);
    
    // Mock extraction - in a real app this would be a PDF parser + AI
    var skills = ['React', 'TypeScript', 'Node.js', 'PostgreSQL', 'System Design', 'Git', 'Tailwind CSS'];
    
    // Save for Placement Prep integration
    var analysis = {
        score: score,
        skills: skills,
        fileName: data.name,
        timestamp: new Date().toISOString()
    };
    localStorage.setItem('kcarrier_profile_analysis', JSON.stringify(analysis));
    
    resultsContainer.innerHTML = (
      '<div class="kn-card kn-p-4 kn-mt-3 animation-fade-in">' +
      '<h3 class="kn-heading-3 kn-mb-2">Analysis Results</h3>' +
      '<div style="display: flex; align-items: center; gap: 1rem; margin-bottom: 1rem;">' +
      '<div style="font-size: 2rem; font-weight: bold; color: var(--kn-color-accent);">' + score + '%</div>' +
      '<div>ATS Compatibility Score</div>' +
      '</div>' +
      '<p class="kn-mb-2"><strong>Top Skills Detected:</strong></p>' +
      '<div style="display: flex; flex-wrap: wrap; gap: 0.5rem; margin-bottom: 1rem;">' +
      skills.map(function(s) { return '<span style="background: rgba(0,0,0,0.05); padding: 2px 8px; border-radius: 4px; font-size: 0.85rem;">' + s + '</span>'; }).join('') +
      '</div>' +
      '<p class="kn-text-subtle" style="font-size: 0.85rem;">Matches found for Frontend Developer and Full Stack Engineer roles.</p>' +
      '</div>'
    );
    showToast('Analysis complete!');
    
    // Trigger a custom event so React components can refresh if needed
    window.dispatchEvent(new Event('kcarrier_resume_updated'));
  }, 1500);
}

function renderLanding() {
  return (
    '<div class="app-landing">' +
    '<h1 class="app-landing__headline kn-heading-1">Stop Missing The Right Jobs.</h1>' +
    '<p class="app-landing__subtext">Precision-matched job discovery delivered daily at 9AM.</p>' +
    '<a href="#/settings" class="kn-btn kn-btn--primary app-landing__cta">Start Tracking</a>' +
    '</div>'
  );
}

function renderSettings() {
  var p = getPreferences() || defaultPreferences();
  var roleVal = escapeHtml(p.roleKeywords);
  var skillsVal = escapeHtml(p.skills);
  var minScore = p.minMatchScore != null ? p.minMatchScore : 40;
  var locations = getUniqueValues('location');
  var locOpts = locations.map(function (l) {
    var sel = p.preferredLocations.indexOf(l) !== -1 ? ' selected' : '';
    return '<option value="' + escapeHtml(l) + '"' + sel + '>' + escapeHtml(l) + '</option>';
  }).join('');
  var modeRemote = p.preferredMode.indexOf('Remote') !== -1 ? ' checked' : '';
  var modeHybrid = p.preferredMode.indexOf('Hybrid') !== -1 ? ' checked' : '';
  var modeOnsite = p.preferredMode.indexOf('Onsite') !== -1 ? ' checked' : '';
  var expOpts = '<option value="">Select level</option>' +
    '<option value="Fresher"' + (p.experienceLevel === 'Fresher' ? ' selected' : '') + '>Fresher</option>' +
    '<option value="0-1"' + (p.experienceLevel === '0-1' ? ' selected' : '') + '>0-1</option>' +
    '<option value="1-3"' + (p.experienceLevel === '1-3' ? ' selected' : '') + '>1-3</option>' +
    '<option value="3-5"' + (p.experienceLevel === '3-5' ? ' selected' : '') + '>3-5</option>';
  return (
    '<div class="app-settings">' +
    '<h1 class="kn-heading-1 app-settings__title">Settings</h1>' +
    '<p class="app-page__subtext kn-mb-4">Configure your job preferences. Saved to this device.</p>' +
    '<form class="app-settings__form" id="settings-form">' +
    '<div class="kn-card kn-mb-3">' +
    '<label class="app-settings__label" for="field-roleKeywords">Role keywords (comma-separated)</label>' +
    '<input type="text" id="field-roleKeywords" class="kn-input" name="roleKeywords" placeholder="e.g. React, Java, Frontend" value="' + roleVal + '">' +
    '</div>' +
    '<div class="kn-card kn-mb-3">' +
    '<label class="app-settings__label" for="field-preferredLocations">Preferred locations (hold Ctrl/Cmd to select multiple)</label>' +
    '<select id="field-preferredLocations" class="kn-input" name="preferredLocations" multiple>' + locOpts + '</select>' +
    '</div>' +
    '<div class="kn-card kn-mb-3">' +
    '<span class="app-settings__label">Preferred mode</span>' +
    '<div class="app-settings__mode">' +
    '<label class="app-settings__checkbox-label"><input type="checkbox" name="preferredMode" value="Remote"' + modeRemote + '> Remote</label>' +
    '<label class="app-settings__checkbox-label"><input type="checkbox" name="preferredMode" value="Hybrid"' + modeHybrid + '> Hybrid</label>' +
    '<label class="app-settings__checkbox-label"><input type="checkbox" name="preferredMode" value="Onsite"' + modeOnsite + '> Onsite</label>' +
    '</div>' +
    '</div>' +
    '<div class="kn-card kn-mb-3">' +
    '<label class="app-settings__label" for="field-experienceLevel">Experience level</label>' +
    '<select id="field-experienceLevel" class="kn-input" name="experienceLevel">' + expOpts + '</select>' +
    '</div>' +
    '<div class="kn-card kn-mb-3">' +
    '<label class="app-settings__label" for="field-skills">Skills (comma-separated)</label>' +
    '<input type="text" id="field-skills" class="kn-input" name="skills" placeholder="e.g. React, Python, SQL" value="' + skillsVal + '">' +
    '</div>' +
    '<div class="kn-card kn-mb-3">' +
    '<label class="app-settings__label">Minimum match score (0–100): <span id="minMatchScore-value">' + minScore + '</span></label>' +
    '<input type="range" id="field-minMatchScore" class="app-settings__slider" name="minMatchScore" min="0" max="100" value="' + minScore + '">' +
    '</div>' +
    '<button type="submit" class="kn-btn kn-btn--primary">Save preferences</button>' +
    '</form>' +
    '</div>'
  );
}

function renderJobs() {
  var filtered = getFilteredJobs();
  var cardsHtml = filtered.map(function (j) { return jobCardHtml(j); }).join('');
  var content = filtered.length
    ? '<div class="app-dashboard__list">' + cardsHtml + '</div>'
    : '<div class="empty-state"><p class="empty-state__title">No roles match your criteria.</p><p class="empty-state__hint">Adjust filters or lower threshold.</p></div>';
  var banner = '';
  if (!hasPreferences()) {
    banner = '<div class="app-dashboard__banner">Set your preferences to activate intelligent matching.</div>';
  }
  return (
    '<div class="app-dashboard">' +
    '<h1 class="kn-heading-1 kn-mb-3">Job Tracker</h1>' +
    banner +
    filterBarHtml() +
    '<div class="app-dashboard__results">' + content + '</div>' +
    '</div>'
  );
}

function renderSaved() {
  var ids = getSavedIds();
  var jobs = getJobs();
  var savedJobs = ids.map(function (id) {
    return jobs.filter(function (j) { return j.id === id; })[0];
  }).filter(Boolean);
  var content;
  if (savedJobs.length === 0) {
    content = '<div class="empty-state"><p class="empty-state__title">No saved jobs</p><p class="empty-state__hint">Jobs you save will appear here.</p></div>';
  } else {
    content = '<div class="app-saved__list">' + savedJobs.map(function (j) { return jobCardHtml(j, { showSave: true, saved: true }); }).join('') + '</div>';
  }
  return (
    '<div class="app-saved">' +
    '<h1 class="kn-heading-1 kn-mb-3">Saved</h1>' +
    content +
    '</div>'
  );
}

function getTodayDigestKey() {
  var today = new Date().toISOString().slice(0, 10);
  return 'jobTrackerDigest_' + today;
}

function getDigestKey(dateStr) {
  return 'jobTrackerDigest_' + dateStr;
}

function getDigest() {
  try {
    var key = getTodayDigestKey();
    var raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : null;
  } catch (e) {
    return null;
  }
}

function saveDigest(digest) {
  var key = getTodayDigestKey();
  localStorage.setItem(key, JSON.stringify(digest));
}

function generateDigest() {
  var prefs = getPreferences();
  if (!prefs) return null;

  var allJobs = getJobs();
  // Calculate match scores for all jobs based on current prefs
  allJobs.forEach(function (j) {
    j.matchScore = computeMatchScore(j, prefs);
  });

  // Filter by user preference
  var candidates = allJobs.filter(function (j) { return j.matchScore >= prefs.minMatchScore; });

  if (candidates.length === 0) {
    var digest = {
      date: new Date().toISOString().slice(0, 10),
      jobs: [],
      generatedAt: new Date().toISOString()
    };
    saveDigest(digest);
    return digest;
  }

  // Sort: 1) matchScore desc, 2) postedDaysAgo asc
  candidates.sort(function (a, b) {
    if (a.matchScore !== b.matchScore) {
      return b.matchScore - a.matchScore;
    }
    return (a.postedDaysAgo || 0) - (b.postedDaysAgo || 0);
  });

  var top10 = candidates.slice(0, 10);
  var digest = {
    date: new Date().toISOString().slice(0, 10),
    jobs: top10,
    generatedAt: new Date().toISOString()
  };
  saveDigest(digest);
  return digest;
}

function copyDigestToClipboard(digest) {
  if (!digest || !digest.jobs) return;
  var text = "Top 10 Jobs For You — " + digest.date + "\n\n";
  digest.jobs.forEach(function (j, i) {
    text += (i + 1) + ". " + j.title + " at " + j.company + "\n";
    text += "   Location: " + j.location + " (" + j.mode + ")\n";
    text += "   Match: " + j.matchScore + "%\n";
    text += "   Link: " + j.applyUrl + "\n\n";
  });
  text += "Generated by Job Notification Tracker";

  navigator.clipboard.writeText(text).then(function () {
    alert('Digest copied to clipboard!');
  }, function (err) {
    console.error('Could not copy text: ', err);
  });
}

function createEmailDraft(digest) {
  if (!digest || !digest.jobs) return;
  var subject = encodeURIComponent("My 9AM Job Digest - " + digest.date);
  var body = "Here are my top job matches for today:\n\n";
  digest.jobs.forEach(function (j, i) {
    body += (i + 1) + ". " + j.title + " at " + j.company + "\n";
    body += "   Location: " + j.location + " (" + j.mode + ")\n";
    body += "   Match: " + j.matchScore + "%\n";
    body += "   Link: " + j.applyUrl + "\n\n";
  });
  body += "Generated by Job Notification Tracker";
  var mailtoLink = "mailto:?subject=" + subject + "&body=" + encodeURIComponent(body);
  window.open(mailtoLink, '_blank');
}

function renderDigest() {
  if (!hasPreferences()) {
    return (
      '<div class="app-digest">' +
      '<h1 class="kn-heading-1 kn-mb-2">Daily Digest</h1>' +
      '<div class="kn-card kn-p-4 app-digest__blocked">' +
      '<h2 class="kn-heading-2">Personalization Required</h2>' +
      '<p class="kn-mb-3">Set your preferences to generate a personalized digest.</p>' +
      '<a href="#/settings" class="kn-btn kn-btn--primary">Go to Settings</a>' +
      '</div>' +
      '</div>'
    );
  }

  var digest = getDigest();

  if (!digest) {
    return (
      '<div class="app-digest">' +
      '<h1 class="kn-heading-1 kn-mb-2">Daily Digest</h1>' +
      '<div class="app-digest__empty-state">' +
      '<p class="kn-mb-3">No digest generated for today yet.</p>' +
      '<button type="button" class="kn-btn kn-btn--primary" id="btn-generate-digest">Generate Today\'s 9AM Digest (Simulated)</button>' +
      '<p class="app-digest__note kn-mt-2">Demo Mode: Daily 9AM trigger simulated manually.</p>' +
      '</div>' +
      '</div>'
    );
  }

  if (!digest.jobs || digest.jobs.length === 0) {
    return (
      '<div class="app-digest">' +
      '<h1 class="kn-heading-1 kn-mb-2">Daily Digest</h1>' +
      '<div class="kn-card kn-p-4 app-digest__empty-state">' +
      '<h2 class="kn-heading-2">No matching roles today.</h2>' +
      '<p>Check again tomorrow.</p>' +
      '</div>' +
      '</div>'
    );
  }

  // Render Digest UI
  var jobItems = digest.jobs.map(function (job) {
    return (
      '<div class="app-digest__card">' +
      '<div class="app-digest__card-header">' +
      '<h3 class="app-digest__job-title">' + escapeHtml(job.title) + '</h3>' +
      '<span class="app-digest__match-score">' + job.matchScore + '% Match</span>' +
      '</div>' +
      '<div class="app-digest__card-meta">' +
      escapeHtml(job.company) + ' · ' + escapeHtml(job.location) +
      '</div>' +
      '<div class="app-digest__card-meta">' +
      escapeHtml(job.experience) + 'Exp' +
      '</div>' +
      '<div class="app-digest__card-actions">' +
      '<a href="' + escapeHtml(job.applyUrl) + '" target="_blank" class="kn-btn kn-btn--sm kn-btn--primary">Apply</a>' +
      '</div>' +
      '</div>'
    );
  }).join('');

  var history = getStatusHistory();
  var historyHtml = '';
  if (history.length > 0) {
    historyHtml = '<div class="app-digest__history kn-mt-4">' +
      '<h2 class="app-digest__title" style="font-size:1.2rem; margin-bottom:1rem;">Recent Status Updates</h2>' +
      '<div class="app-digest__card">' +
      history.map(function (h) {
        return '<div class="app-digest__history-item" style="padding: 0.5rem 0; border-bottom: 1px solid #eee;">' +
          '<div style="font-size:0.9rem;"><strong>' + escapeHtml(h.title) + '</strong> marked as <strong>' + escapeHtml(h.status) + '</strong></div>' +
          '<div class="kn-text-subtle" style="font-size:0.8rem">' + h.company + ' · ' + new Date(h.date).toLocaleDateString() + '</div>' +
          '</div>';
      }).join('') +
      '</div>' +
      '</div>';
  }

  return (
    '<div class="app-digest">' +
    '<div class="app-digest__container">' +
    '<div class="app-digest__header">' +
    '<h2 class="app-digest__title">Top 10 Jobs For You — 9AM Digest</h2>' +
    '<p class="app-digest__date">' + digest.date + '</p>' +
    '</div>' +
    '<div class="app-digest__body">' +
    jobItems +
    '</div>' +
    historyHtml +
    '<div class="app-digest__footer">' +
    '<p>You are receiving this because you subscribed to Job Notification Tracker.</p>' +
    '</div>' +
    '</div>' +
    '<div class="app-digest__actions-bar">' +
    '<button type="button" class="kn-btn kn-btn--secondary" id="btn-copy-digest">Copy Digest to Clipboard</button>' +
    '<button type="button" class="kn-btn kn-btn--secondary" id="btn-email-digest">Create Email Draft</button>' +
    '</div>' +
    '</div>'
  );
}

function renderLogin() {
  return (
    '<div class="app-auth">' +
    '<div class="kn-card app-auth__card">' +
    '<h1 class="kn-heading-1 kn-mb-2">Login</h1>' +
    '<p class="kn-text-subtle kn-mb-4">Welcome back to kcarrier.</p>' +
    '<form id="login-form">' +
    '<div class="kn-form-group kn-mb-3">' +
    '<label class="kn-label">Email Address</label>' +
    '<input type="email" name="email" class="kn-input" placeholder="name@company.com" required>' +
    '</div>' +
    '<div class="kn-form-group kn-mb-4">' +
    '<label class="kn-label">Password</label>' +
    '<input type="password" name="password" class="kn-input" placeholder="••••••••" required>' +
    '</div>' +
    '<button type="submit" class="kn-btn kn-btn--primary kn-w-full">Sign In</button>' +
    '</form>' +
    '<div class="kn-mt-4 kn-text-center">' +
    '<span class="kn-text-subtle">New here? </span>' +
    '<a href="#/register" class="kn-link">Create an account</a>' +
    '</div>' +
    '</div>' +
    '</div>'
  );
}

function renderRegister() {
  return (
    '<div class="app-auth">' +
    '<div class="kn-card app-auth__card">' +
    '<h1 class="kn-heading-1 kn-mb-2">Register</h1>' +
    '<p class="kn-text-subtle kn-mb-4">Start your career journey with kcarrier.</p>' +
    '<form id="register-form">' +
    '<div class="kn-form-group kn-mb-3">' +
    '<label class="kn-label">Full Name</label>' +
    '<input type="text" name="fullName" class="kn-input" placeholder="John Doe" required>' +
    '</div>' +
    '<div class="kn-form-group kn-mb-3">' +
    '<label class="kn-label">Email Address</label>' +
    '<input type="email" name="email" class="kn-input" placeholder="name@company.com" required>' +
    '</div>' +
    '<div class="kn-form-group kn-mb-4">' +
    '<label class="kn-label">Password</label>' +
    '<input type="password" name="password" class="kn-input" placeholder="••••••••" required>' +
    '</div>' +
    '<button type="submit" class="kn-btn kn-btn--primary kn-w-full">Create Account</button>' +
    '</form>' +
    '<div class="kn-mt-4 kn-text-center">' +
    '<span class="kn-text-subtle">Already have an account? </span>' +
    '<a href="#/login" class="kn-link">Login here</a>' +
    '</div>' +
    '</div>' +
    '</div>'
  );
}

function render() {
  var path = getRoute();
  console.log('App render called. Path:', path);
  var name = getRouteName(path);
  var container = document.getElementById('app-page');
  var main = document.getElementById('app-main');
  if (!container || !main) return;

  if (path.startsWith('dashboard')) {
    main.classList.add('app-main--dashboard');
  } else {
    main.classList.remove('app-main--dashboard');
  }

  container.dataset.route = path;
  container.className = 'app-page app-page--' + name;

  // Authentication Guard
  var user = getCurrentUser();
  var isDashboardRoute = path.indexOf('dashboard') === 0 || ['saved', 'settings', 'proof', 'test', 'ship'].indexOf(name) !== -1;
  
  if (isDashboardRoute && !user) {
    console.log('Access denied: Redirecting to login');
    window.location.hash = '#/login';
    return;
  }

  // Redirect to dashboard if logged in and trying to access landing/login/register
  if (user && (name === 'landing' || name === 'login' || name === 'register')) {
    window.location.hash = '#/dashboard';
    return;
  }

  switch (name) {
    case 'landing':
      container.innerHTML = renderLanding();
      break;
    case 'login':
      container.innerHTML = renderLogin();
      break;
    case 'register':
      container.innerHTML = renderRegister();
      break;
    case 'settings':
      container.innerHTML = renderSettings();
      break;
    case 'saved':
      container.innerHTML = renderSaved();
      break;
    case 'profile':
      container.innerHTML = renderProfile();
      break;
    case 'test':
      container.innerHTML = renderTest();
      break;
    case 'ship':
      container.innerHTML = renderShip();
      break;
    default:
      if (path.startsWith('dashboard')) {
        container.innerHTML = renderDashboardLayout(path);
      } else {
        container.innerHTML = renderLanding();
      }
  }

  document.querySelectorAll('.app-nav__link').forEach(function (link) {
    var linkRoute = link.getAttribute('data-route') || '';
    link.classList.toggle('is-active', linkRoute === path);
  });
}

function renderTest() {
  var checklist = getTestChecklist();
  var passedCount = checklist.length;
  var totalCount = TEST_ITEMS.length;
  var isPassed = passedCount === totalCount;
  var summaryClass = isPassed ? 'app-test-summary--passed' : 'app-test-summary--warning';
  var summaryText = isPassed ? 'All Systems Go. Ready to Ship.' : 'Resolve all issues before shipping.';

  var listHtml = TEST_ITEMS.map(function (item, index) {
    var checked = checklist.includes(index) ? ' checked' : '';
    return (
      '<label class="app-test-item">' +
      '<input type="checkbox" class="app-test-check" data-index="' + index + '"' + checked + '>' +
      '<span class="app-test-label">' + escapeHtml(item) + '</span>' +
      '</label>'
    );
  }).join('');

  return (
    '<div class="app-page">' +
    '<h1 class="kn-heading-1 kn-mb-2">System Verification</h1>' +
    '<div class="app-test-summary ' + summaryClass + '">' +
    '<div class="app-test-score">Tests Passed: ' + passedCount + ' / ' + totalCount + '</div>' +
    '<div class="app-test-status">' + summaryText + '</div>' +
    '</div>' +
    '<div class="app-test-checklist kn-card">' +
    listHtml +
    '</div>' +
    '<div class="kn-mt-3" style="text-align: right;">' +
    '<button type="button" class="kn-btn kn-btn--secondary" id="btn-reset-tests">Reset Test Status</button>' +
    '</div>' +
    '</div>'
  );
}

function renderShip() {
  if (!areAllTestsPassed()) {
    return (
      '<div class="app-page app-ship-locked">' +
      '<div class="kn-card kn-p-5" style="text-align: center;">' +
      '<h1 class="kn-heading-1 kn-mb-2">🚀 Ship Locked</h1>' +
      '<p class="kn-mb-3">You must pass all verification tests before accessing the ship screen.</p>' +
      '<a href="#/jt/07-test" class="kn-btn kn-btn--primary">Go to System Verification</a>' +
      '</div>' +
      '</div>'
    );
  }

  return (
    '<div class="app-page">' +
    '<div class="kn-card kn-p-5" style="text-align: center; border-top: 4px solid #10b981;">' +
    '<h1 class="kn-heading-1 kn-mb-2">Ready to Ship! 🚢</h1>' +
    '<p class="kn-mb-3">All systems operational. You are clear for launch.</p>' +
    '<div class="kn-text-subtle">Great job ensuring quality.</div>' +
    '</div>' +
    '</div>'
  );
}


function setupNav() {
  var toggle = document.querySelector('.app-nav__toggle');
  var nav = document.querySelector('.app-nav');

  if (toggle && nav) {
    toggle.addEventListener('click', function () {
      var expanded = nav.classList.toggle('is-open');
      toggle.setAttribute('aria-expanded', expanded);
      toggle.setAttribute('aria-label', expanded ? 'Close menu' : 'Open menu');
    });
  }

  document.querySelectorAll('.app-nav__link').forEach(function (link) {
    link.addEventListener('click', function () {
      if (window.matchMedia('(max-width: 768px)').matches && nav) {
        nav.classList.remove('is-open');
        if (toggle) {
          toggle.setAttribute('aria-expanded', 'false');
          toggle.setAttribute('aria-label', 'Open menu');
        }
      }
    });
  });


}



/* ─── Dashboard Components ─── */
function renderSidebar(currentPath) {
  var links = [
    { path: 'dashboard', label: 'Dashboard' },
    { path: 'dashboard/resume', label: 'Resume Builder' },
    { path: 'dashboard/prep', label: 'Placement Prep' },
    { path: 'dashboard/jobs', label: 'Jobs' }
  ];

  var navHtml = links.map(function (link) {
    var isActive = currentPath === link.path;
    var activeClass = isActive ? ' app-sidebar__link--active' : '';
    return '<a href="#/' + link.path + '" class="app-sidebar__link' + activeClass + '">' + link.label + '</a>';
  }).join('');

  return (
    '<aside class="app-sidebar">' +
    '<nav class="app-sidebar__nav kn-mt-3">' +
    navHtml +
    '</nav>' +
    '<div class="app-sidebar__footer">' +
    '<button type="button" class="app-sidebar__link btn-logout" style="background:none; border:none; width:100%; text-align:left; cursor:pointer;">Logout</button>' +
    '</div>' +
    '</aside>'
  );
}

function renderDashboardLayout(currentPath) {
  console.log('Rendering Dashboard Layout for path:', currentPath);
  var contentHtml = '';

  // Order matters: check more specific paths first
  if (currentPath === 'dashboard/resume' || currentPath.indexOf('dashboard/resume') === 0) {
    console.log('Rendering Resume Builder container');
    contentHtml = renderResumeBuilder();
  } else if (currentPath === 'dashboard/prep' || currentPath.indexOf('dashboard/prep') === 0) {
    console.log('Rendering Placement Prep container');
    contentHtml = renderPlacementPrep();
  } else if (currentPath === 'dashboard/jobs' || currentPath.indexOf('dashboard/jobs') === 0) {
    console.log('Rendering Jobs list');
    contentHtml = renderJobs();
  } else if (currentPath === 'dashboard/profile') {
    contentHtml = renderProfile();
  } else if (currentPath === 'dashboard') {
    contentHtml = renderDashboardHome();
  } else {
    console.warn('Unknown dashboard route:', currentPath);
    // Fallback to home if unknown sub-route, or show 404
    contentHtml = renderDashboardHome();
  }

  return (
    '<div class="app-dashboard-layout">' +
    renderSidebar(currentPath) +
    '<div class="app-dashboard-main">' +
    contentHtml +
    '</div>' +
    '</div>'
  );
}

function renderDashboardHome() {
  return (
    '<div class="app-dashboard-home">' +
    '<h1 class="kn-heading-1 kn-mb-3">Welcome back!</h1>' +
    '<div class="kn-card kn-p-4">' +
    '<p>Select a tool from the sidebar to get started.</p>' +
    '</div>' +
    '</div>'
  );
}

function renderResumeBuilder() {
  return (
    '<div id="resume-builder-root" style="min-height: 80vh;"></div>'
  );
}

function renderPlacementPrep() {
  return (
    '<div id="prep-root" style="min-height: 80vh;"></div>'
  );
}

function renderProfile() {
  var user = getCurrentUser();
  var name = user ? user.fullName : 'User';
  var email = user ? user.email : 'Not logged in';
  var resumeData = getResumeData();

  var resumeHtml = '';
  if (resumeData) {
    resumeHtml = (
      '<div class="kn-card kn-mb-3">' +
      '<div style="display: flex; justify-content: space-between; align-items: center;">' +
      '<div>' +
      '<h3 class="kn-heading-3">Current Resume</h3>' +
      '<p class="kn-text-subtle">' + escapeHtml(resumeData.name) + ' (' + (resumeData.size / 1024).toFixed(1) + ' KB)</p>' +
      '</div>' +
      '<button class="kn-btn kn-btn--secondary btn-analyze-resume">Analyze Again</button>' +
      '</div>' +
      '</div>'
    );
  } else {
    resumeHtml = (
      '<div class="kn-card kn-mb-3 kn-text-center kn-p-5" style="border: 2px dashed rgba(0,0,0,0.1); background: transparent;">' +
      '<p class="kn-text-subtle">No resume uploaded yet.</p>' +
      '</div>'
    );
  }

  return (
    '<div class="app-profile">' +
    '<h1 class="kn-heading-1 kn-mb-3">My Profile</h1>' +
    '<div class="kn-grid kn-grid--2">' +
    '<div>' +
    '<div class="kn-card kn-mb-3">' +
    '<h3 class="kn-heading-3 kn-mb-2">Personal Information</h3>' +
    '<p><strong>Name:</strong> ' + escapeHtml(name) + '</p>' +
    '<p><strong>Email:</strong> ' + escapeHtml(email) + '</p>' +
    '</div>' +
    '<div class="kn-card">' +
    '<h3 class="kn-heading-3 kn-mb-2">Resume Upload</h3>' +
    '<p class="kn-text-subtle kn-mb-3">Upload your resume to get personalized job matches and ATS scoring.</p>' +
    '<input type="file" id="resume-upload" class="kn-input kn-mb-3" accept=".pdf,.doc,.docx,.txt" style="padding: 10px;">' +
    '<button class="kn-btn kn-btn--primary kn-w-full btn-upload-resume">Upload & Analyze</button>' +
    '</div>' +
    '</div>' +
    '<div>' +
    resumeHtml +
    '<div id="resume-analysis-results"></div>' +
    '</div>' +
    '</div>' +
    '</div>'
  );
}

function getResumeData() {
  try {
    var raw = localStorage.getItem('kcarrier_resume');
    return raw ? JSON.parse(raw) : null;
  } catch (e) {
    return null;
  }
}

function saveResumeData(data) {
  localStorage.setItem('kcarrier_resume', JSON.stringify(data));
}

export function initApp() {
  setupModal();
  setupAppEvents();
  render();
  window.addEventListener('hashchange', render);
  setupNav();
}

// Auto-init if not imported as a module (fallback)
if (typeof window !== 'undefined' && !window.initApp) {
  window.initApp = initApp;
  if (document.readyState === 'complete') {
    initApp();
  } else {
    window.addEventListener('load', initApp);
  }
}

