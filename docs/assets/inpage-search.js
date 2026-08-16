/* In-page search — shared across all documents. No dependencies.
   - Injects a search box at the top of the sidebar (nav)
   - Highlights matches in main content + count + Enter for next (Shift+Enter for previous)
   - Auto-applies ?q= from landing search
   Note: Sidebar nav links are NOT filtered (bundled labels disappeared entirely when enabled). Do not re-enable. */
(function () {
  'use strict';
  function ready(fn){ if (document.readyState !== 'loading') fn(); else document.addEventListener('DOMContentLoaded', fn); }
  function escRe(s){ return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'); }

  /* ── Internationalization ── */
  function getSearchStrings() {
    var lang = (document.documentElement.lang || 'ko').split('-')[0];
    var strings = {
      ko: {
        placeholder: '이 페이지에서 검색...',
        clear: '지우기',
        label: '이 페이지에서 검색',
        matchCount: '{n}개 일치 · Enter로 이동',
        noMatch: '일치 없음'
      },
      en: {
        placeholder: 'Search this page...',
        clear: 'Clear',
        label: 'Search this page',
        matchCount: '{n} found · Enter to navigate',
        noMatch: 'No matches'
      },
      ja: {
        placeholder: 'このページを検索...',
        clear: '消去',
        label: 'このページを検索',
        matchCount: '{n}件一致 · Enterで移動',
        noMatch: '一致なし'
      },
      es: {
        placeholder: 'Buscar en esta página...',
        clear: 'Borrar',
        label: 'Buscar en esta página',
        matchCount: '{n} coincidencias · Enter para navegar',
        noMatch: 'Sin coincidencias'
      }
    };
    return strings[lang] || strings.ko;
  }

  /* ── CSS variable helper with fallback ── */
  function cv(name, fallback) {
    var v = getComputedStyle(document.documentElement).getPropertyValue(name).trim();
    return v || fallback;
  }

  ready(function () {
    var nav = document.querySelector('nav');
    var main = document.querySelector('main');
    if (!nav || !main) return;

    var S = getSearchStrings();

    /* ── Theme-aware CSS colors ── */
    var c = {
      border:       cv('--color-border-default', '#d0d7de'),
      bg:           cv('--color-canvas-default', '#fff'),
      fg:           cv('--color-fg-default', '#1f2328'),
      muted:        cv('--color-fg-muted', '#636c76'),
      accent:       cv('--color-accent-fg', '#0969da'),
      markBg:       cv('--color-attention-subtle', '#fff3a3'),
      markActive:   cv('--color-attention-emphasis', '#ffd43b'),
      markOutline:  cv('--color-danger-fg', '#f08c00')
    };

    var style = document.createElement('style');
    style.textContent = [
      '.ip-search{padding:10px 14px 12px;border-bottom:1px solid ' + c.border + ';margin-bottom:6px;}',
      '.ip-search .ip-row{position:relative;display:flex;align-items:center;}',
      '.ip-search input{width:100%;padding:7px 28px 7px 10px;font-size:13px;border:1px solid ' + c.border + ';border-radius:6px;background:' + c.bg + ';color:' + c.fg + ';outline:none;}',
      '.ip-search input:focus{border-color:' + c.accent + ';box-shadow:0 0 0 2px rgba(9,105,218,.15);}',
      '.ip-search .ip-clear{position:absolute;right:6px;border:none;background:none;color:' + c.muted + ';cursor:pointer;font-size:16px;line-height:1;display:none;padding:2px 4px;}',
      '.ip-search .ip-count{margin-top:6px;font-size:11px;color:' + c.muted + ';min-height:13px;}',
      'mark.ip-hit{background:' + c.markBg + ';color:inherit;border-radius:2px;padding:0 1px;}',
      'mark.ip-hit.ip-active{background:' + c.markActive + ';outline:1px solid ' + c.markOutline + ';}'
    ].join('');
    document.head.appendChild(style);

    var box = document.createElement('div');
    box.className = 'ip-search';

    var row = document.createElement('div');
    row.className = 'ip-row';

    var input = document.createElement('input');
    input.type = 'search';
    input.placeholder = S.placeholder;
    input.setAttribute('aria-label', S.label);

    var clearBtn = document.createElement('button');
    clearBtn.className = 'ip-clear';
    clearBtn.type = 'button';
    clearBtn.title = S.clear;
    clearBtn.setAttribute('aria-label', S.clear);
    clearBtn.textContent = '×';

    row.appendChild(input);
    row.appendChild(clearBtn);

    var countDiv = document.createElement('div');
    countDiv.className = 'ip-count';

    box.appendChild(row);
    box.appendChild(countDiv);

    var homeLink = nav.querySelector('a[href$="index.html"]');
    if (homeLink && homeLink.nextSibling) nav.insertBefore(box, homeLink.nextSibling);
    else nav.insertBefore(box, nav.firstChild);

    var input = box.querySelector('input');
    var clearBtn = box.querySelector('.ip-clear');
    var countEl = box.querySelector('.ip-count');
    var hits = [], activeIdx = -1;

    function clearMarks(){
      var marks = main.querySelectorAll('mark.ip-hit');
      for (var i = 0; i < marks.length; i++){
        var m = marks[i];
        m.parentNode.replaceChild(document.createTextNode(m.textContent), m);
      }
      main.normalize();
    }

    function highlight(q){
      clearMarks(); hits = []; activeIdx = -1;
      if (!q) return;
      var re = new RegExp(escRe(q), 'gi');
      var walker = document.createTreeWalker(main, NodeFilter.SHOW_TEXT, {
        acceptNode: function (n){
          if (!n.nodeValue.trim()) return NodeFilter.FILTER_REJECT;
          var p = n.parentNode;
          if (p && (p.nodeName === 'SCRIPT' || p.nodeName === 'STYLE' || p.nodeName === 'MARK')) return NodeFilter.FILTER_REJECT;
          // SVG label protection: <mark> injection breaks SVG <text>, so SVG namespace nodes are excluded
          if (p && p.namespaceURI === 'http://www.w3.org/2000/svg') return NodeFilter.FILTER_REJECT;
          re.lastIndex = 0;
          return re.test(n.nodeValue) ? NodeFilter.FILTER_ACCEPT : NodeFilter.FILTER_REJECT;
        }
      });
      var targets = [], node;
      while ((node = walker.nextNode())) targets.push(node);
      targets.forEach(function (n){
        re.lastIndex = 0;
        var frag = document.createDocumentFragment(), s = n.nodeValue, last = 0, m;
        while ((m = re.exec(s))){
          if (m.index > last) frag.appendChild(document.createTextNode(s.slice(last, m.index)));
          var mk = document.createElement('mark');
          mk.className = 'ip-hit'; mk.textContent = m[0];
          frag.appendChild(mk); hits.push(mk);
          last = m.index + m[0].length;
          if (m.index === re.lastIndex) re.lastIndex++;
        }
        if (last < s.length) frag.appendChild(document.createTextNode(s.slice(last)));
        n.parentNode.replaceChild(frag, n);
      });
    }

    function setActive(i){
      if (!hits.length) return;
      if (activeIdx >= 0 && hits[activeIdx]) hits[activeIdx].classList.remove('ip-active');
      activeIdx = (i + hits.length) % hits.length;
      hits[activeIdx].classList.add('ip-active');
      hits[activeIdx].scrollIntoView({ block: 'center', behavior: 'smooth' });
    }

    function apply(scrollFirst){
      var q = input.value.trim();
      clearBtn.style.display = q ? 'block' : 'none';
      highlight(q);
      if (!q){ countEl.textContent = ''; return; }
      countEl.textContent = hits.length ? (S.matchCount.replace('{n}', hits.length)) : S.noMatch;
      if (hits.length && scrollFirst) setActive(0);
    }

    var t;
    input.addEventListener('input', function (){ clearTimeout(t); t = setTimeout(function (){ apply(true); }, 120); });
    input.addEventListener('keydown', function (e){
      if (e.key === 'Enter'){ e.preventDefault(); if (hits.length) setActive(activeIdx + (e.shiftKey ? -1 : 1)); }
      else if (e.key === 'Escape'){ input.value = ''; apply(false); input.blur(); }
    });
    clearBtn.addEventListener('click', function (){ input.value = ''; apply(false); input.focus(); });

    var q0 = new URLSearchParams(location.search).get('q');
    if (q0){ input.value = q0; apply(!location.hash); }
  });
})();
