/**
 * diagram-zoom.js — in-page zoom for large inline SVG diagrams.
 *
 * HTML contract: <div class="zoom-wrap" data-zoom><svg ...></svg></div>
 * The script wraps the SVG in a scrollable viewport and injects +, -, reset
 * buttons (labels keyed on <html lang>). Without JS the SVG simply scales
 * to the page width. Colors use the handbook CSS variables (light and dark).
 */
(function () {
  'use strict';

  var LABELS = {
    en: { group: 'Diagram zoom controls', inn: 'Zoom in', out: 'Zoom out', reset: 'Reset zoom', region: 'Scrollable diagram', level: 'Zoom' },
    ko: { group: '다이어그램 확대 도구', inn: '확대', out: '축소', reset: '확대 초기화', region: '스크롤 가능한 다이어그램', level: '배율' },
    es: { group: 'Controles de zoom del diagrama', inn: 'Acercar', out: 'Alejar', reset: 'Restablecer zoom', region: 'Diagrama desplazable', level: 'Zoom' },
    ja: { group: '図の拡大操作', inn: '拡大', out: '縮小', reset: '拡大をリセット', region: 'スクロールできる図', level: '倍率' }
  };
  var L = LABELS[document.documentElement.lang] || LABELS.en;
  var MIN = 1, MAX = 4, STEP = 0.25;

  function injectStyle() {
    if (document.getElementById('diagram-zoom-style')) return;
    var st = document.createElement('style');
    st.id = 'diagram-zoom-style';
    st.textContent =
      '.zoom-toolbar{display:flex;gap:8px;align-items:center;margin:8px 0}' +
      '.zoom-btn{min-width:40px;height:36px;padding:0 12px;font:inherit;font-weight:700;cursor:pointer;' +
      'color:var(--text);background:var(--bg-info);border:1px solid var(--border);border-radius:8px}' +
      '.zoom-btn:hover{border-color:var(--accent)}' +
      '.zoom-btn:focus-visible,.zoom-viewport:focus-visible{outline:2px solid var(--accent);outline-offset:2px}' +
      '.zoom-level{font-size:14px;color:var(--text);min-width:3.5em}' +
      '.zoom-viewport{overflow:auto;max-height:80vh;border:1px solid var(--border);border-radius:8px}' +
      '.zoom-viewport svg{display:block;max-width:none}';
    document.head.appendChild(st);
  }

  function init(wrap) {
    var svg = wrap.querySelector('svg');
    if (!svg) return;
    var scale = 1;
    var bar = document.createElement('div');
    bar.className = 'zoom-toolbar';
    bar.setAttribute('role', 'group');
    bar.setAttribute('aria-label', L.group);
    var level = document.createElement('span');
    level.className = 'zoom-level';
    level.setAttribute('role', 'status');
    level.setAttribute('aria-label', L.level);

    var view = document.createElement('div');
    view.className = 'zoom-viewport';
    view.tabIndex = 0;
    view.setAttribute('role', 'region');
    view.setAttribute('aria-label', L.region);
    wrap.insertBefore(view, svg);
    view.appendChild(svg);

    function apply() {
      svg.style.width = (scale * 100) + '%';
      level.textContent = Math.round(scale * 100) + '%';
    }
    function btn(txt, label, fn) {
      var b = document.createElement('button');
      b.type = 'button';
      b.className = 'zoom-btn';
      b.textContent = txt;
      b.setAttribute('aria-label', label);
      b.title = label;
      b.addEventListener('click', fn);
      bar.appendChild(b);
    }
    btn('+', L.inn, function () { scale = Math.min(MAX, scale + STEP); apply(); });
    btn('−', L.out, function () { scale = Math.max(MIN, scale - STEP); apply(); });
    btn('1:1', L.reset, function () { scale = 1; apply(); view.scrollLeft = 0; view.scrollTop = 0; });
    bar.appendChild(level);
    wrap.insertBefore(bar, view);
    apply();
  }

  function run() {
    injectStyle();
    var wraps = document.querySelectorAll('[data-zoom]');
    for (var i = 0; i < wraps.length; i++) init(wraps[i]);
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', run);
  else run();
})();
