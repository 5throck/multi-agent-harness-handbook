/**
 * lang-switcher.js — Language switcher for the Multi-Agent Harness Handbook
 *
 * Provides a dropdown that lets users switch between Korean (default),
 * English, and Japanese translations of each page.
 *
 * Behaviour:
 * - On load: reads localStorage('lang') and sets the matching option.
 * - Detects the current page language from the URL suffix (_en, _ja).
 * - Uses fetch(url, { method: 'HEAD' }) to check whether _en.html / _ja.html
 *   variants exist; caches results and disables options for unavailable
 *   languages.
 * - On change: strips any existing _en / _ja suffix from the current URL,
 *   appends the new suffix (empty for Korean), saves to localStorage('lang'),
 *   and navigates to the new URL.
 *
 * HTML contract (injected automatically if not present):
 *   <div id="lang-switcher" class="lang-switcher">
 *     <select id="lang-select">
 *       <option value="">한국어</option>
 *       <option value="en">English</option>
 *       <option value="ja">日本語</option>
 *     </select>
 *   </div>
 */

(function () {
  'use strict';

  /* -----------------------------------------------------------------------
     Constants
     ----------------------------------------------------------------------- */
  var STORAGE_KEY    = 'lang';
  var SWITCHER_ID    = 'lang-switcher';
  var SELECT_ID      = 'lang-select';
  var SUFFIX_REGEX   = /(?:_en|_ja|_ko)(?=\.html$)/;
  var LANGUAGES      = [
    { value: '',  label: '한국어',  suffix: ''    },
    { value: 'en', label: 'English', suffix: '_en' },
    { value: 'ja', label: '日本語',  suffix: '_ja' }
  ];

  /* -----------------------------------------------------------------------
     DOM references
     ----------------------------------------------------------------------- */

  // Inject language switcher if it does not already exist
  var switcherDiv = document.getElementById(SWITCHER_ID);
  if (!switcherDiv) {
    switcherDiv = document.createElement('div');
    switcherDiv.id = SWITCHER_ID;
    switcherDiv.className = 'lang-switcher';

    var selectEl = document.createElement('select');
    selectEl.id = SELECT_ID;
    selectEl.setAttribute('aria-label', 'Select language');

    for (var i = 0; i < LANGUAGES.length; i++) {
      var opt = document.createElement('option');
      opt.value = LANGUAGES[i].value;
      opt.textContent = LANGUAGES[i].label;
      selectEl.appendChild(opt);
    }

    switcherDiv.appendChild(selectEl);
    document.body.appendChild(switcherDiv);
  } else {
    var selectEl = document.getElementById(SELECT_ID);
  }

  /* -----------------------------------------------------------------------
     Helpers
     ----------------------------------------------------------------------- */

  /**
   * Returns the language code detected from the current URL suffix.
   * @returns {string} '' (Korean), 'en', or 'ja'
   */
  function detectCurrentLang() {
    var url = window.location.pathname;
    var match = url.match(SUFFIX_REGEX);
    if (match) {
      var code = match[0].replace('_', '');
      return code === 'ko' ? '' : code; // Korean maps to the default value ''
    }
    return '';
  }

  /**
   * Strips any existing language suffix from the given URL.
   * @param {string} url
   * @returns {string}
   */
  function stripSuffix(url) {
    return url.replace(SUFFIX_REGEX, '');
  }

  /**
   * Builds the target URL for the given language code.
   * @param {string} langCode — '', 'en', or 'ja'
   * @returns {string}
   */
  function buildTargetUrl(langCode) {
    var base = stripSuffix(window.location.pathname);
    if (langCode) {
      // A directory index (e.g. the site root served as ".../") has no
      // ".html" to anchor the suffix replacement on, so switching language
      // from it rebuilt the identical URL and navigated nowhere — the
      // dropdown looked dead on the landing page. Treat a trailing slash as
      // an implicit index.html so we can form index_en.html / index_ja.html.
      if (/\/$/.test(base)) {
        base = base + 'index.html';
      }
      base = base.replace(/\.html$/, '_' + langCode + '.html');
    }
    return base;
  }

  /**
   * Resolves the URL to use for Korean. Most page families have a
   * suffix-less file for Korean, but some (docs/setup/SETUP_*,
   * SETUP_CHECKLIST_*) ship only `_en`/`_ja`/`_ko` variants with no
   * suffix-less file. Deriving the scheme from the CURRENT page's own
   * suffix breaks when switching directly from `_en`/`_ja` to Korean (e.g.
   * from SETUP_CHECKLIST_en.html the plain SETUP_CHECKLIST.html 404s), so
   * instead probe the plain file first and fall back to the `_ko` file.
   * @param {function(string)} callback — invoked with the resolved URL
   */
  // Most browsers refuse fetch() against file:// URLs (opaque-origin CORS
  // block), so every HEAD probe below rejects immediately when the page is
  // opened directly from disk instead of served over http(s). Detect that
  // case up front and skip probing entirely — otherwise every "does this
  // variant exist" check resolves to "no", which disables every non-Korean
  // dropdown option and makes the switcher look completely broken during
  // local file:// testing even though it works once deployed.
  var IS_FILE_PROTOCOL = window.location.protocol === 'file:';

  var koreanTargetCache = {};
  function resolveKoreanTargetUrl(callback) {
    if (IS_FILE_PROTOCOL) {
      // Can't verify existence locally — optimistically prefer the plain
      // file (the common case) so switching still works for most pages.
      callback(buildTargetUrl(''));
      return;
    }
    var plainUrl = buildTargetUrl('');
    if (koreanTargetCache.hasOwnProperty(plainUrl)) {
      callback(koreanTargetCache[plainUrl]);
      return;
    }
    fetch(plainUrl, { method: 'HEAD' })
      .then(function (response) {
        var resolved = response.ok ? plainUrl : buildTargetUrl('ko');
        koreanTargetCache[plainUrl] = resolved;
        callback(resolved);
      })
      .catch(function () {
        var resolved = buildTargetUrl('ko');
        koreanTargetCache[plainUrl] = resolved;
        callback(resolved);
      });
  }

  /**
   * Finds the language object for a given language code.
   * @param {string} langCode
   * @returns {object|undefined}
   */
  function findLanguage(langCode) {
    for (var i = 0; i < LANGUAGES.length; i++) {
      if (LANGUAGES[i].value === langCode) {
        return LANGUAGES[i];
      }
    }
    return undefined;
  }

  /* -----------------------------------------------------------------------
     Availability detection — cache results to avoid repeated HEAD requests
     ----------------------------------------------------------------------- */

  var availabilityCache = {};

  /**
   * Check whether the page variant for a given language exists.
   * @param {string} langCode — 'en' or 'ja'
   * @param {function(boolean)} callback
   */
  function checkAvailability(langCode, callback) {
    if (langCode === '' || IS_FILE_PROTOCOL) {
      // Under file://, fetch() always rejects (see IS_FILE_PROTOCOL above),
      // so treat every variant as available rather than disabling every
      // non-Korean option during local testing.
      callback(true);
      return;
    }

    // Return cached result if available
    if (availabilityCache.hasOwnProperty(langCode)) {
      callback(availabilityCache[langCode]);
      return;
    }

    var url = buildTargetUrl(langCode);

    fetch(url, { method: 'HEAD' })
      .then(function (response) {
        var available = response.ok;
        availabilityCache[langCode] = available;
        callback(available);
      })
      .catch(function () {
        availabilityCache[langCode] = false;
        callback(false);
      });
  }

  /**
   * Check all non-default language variants and disable unavailable options.
   */
  function updateAvailability() {
    for (var i = 0; i < LANGUAGES.length; i++) {
      (function (lang) {
        if (lang.value === '') { return; } // default is always available

        checkAvailability(lang.value, function (available) {
          for (var j = 0; j < selectEl.options.length; j++) {
            if (selectEl.options[j].value === lang.value) {
              selectEl.options[j].disabled = !available;
              break;
            }
          }
        });
      })(LANGUAGES[i]);
    }
  }

  /* -----------------------------------------------------------------------
     Initialisation
     ----------------------------------------------------------------------- */

  (function init() {
    // 1. Detect current language from URL and set the select value
    var detectedLang = detectCurrentLang();
    selectEl.value = detectedLang;

    // 2. If a stored preference exists and differs from the current page,
    //    redirect to the preferred variant (once per session, and only if
    //    it actually exists). The dropdown must always reflect the page
    //    actually shown — setting it to the stored value without navigating
    //    made the stored language unselectable (no change event fires when
    //    the value is already selected).
    var stored = localStorage.getItem(STORAGE_KEY);
    if (stored !== null && stored !== detectedLang &&
        !sessionStorage.getItem('langRedirected') &&
        findLanguage(stored)) {
      if (stored === '') {
        resolveKoreanTargetUrl(function (url) {
          sessionStorage.setItem('langRedirected', '1');
          window.location.replace(url);
        });
      } else {
        checkAvailability(stored, function (available) {
          if (available) {
            sessionStorage.setItem('langRedirected', '1');
            window.location.replace(buildTargetUrl(stored));
          }
        });
      }
    }

    // 3. Check which language variants are available
    updateAvailability();
  })();

  /* -----------------------------------------------------------------------
     Change handler
     ----------------------------------------------------------------------- */

  selectEl.addEventListener('change', function () {
    var newLang = selectEl.value;

    // Persist preference
    localStorage.setItem(STORAGE_KEY, newLang);

    if (newLang === '') {
      resolveKoreanTargetUrl(function (url) {
        window.location.href = url;
      });
    } else {
      window.location.href = buildTargetUrl(newLang);
    }
  });

})();
