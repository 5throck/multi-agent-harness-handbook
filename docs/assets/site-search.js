/* 랜딩 사이트 전체 검색 — 의존성·빌드 없음.
   첫 포커스 때 DOCS의 모든 문서를 fetch → DOMParser로 파싱해 색인 구축(항상 최신).
   매뉴얼: h2[id](섹션) + h3(항목, 안에 <code>) / 예시: .scenario-card[id](시나리오)
   결과 선택 시 해당 문서의 정확한 위치로 이동(+ ?q= 로 그 페이지 검색 자동 적용).

   ★ 데이터는 search-data.js 에서 전역 SEARCH_DATA 로 제공됩니다.
     새 문서 추가 시 docs/search-manifest.json 을 수정한 뒤
     bun run scripts/build-search-index.ts --docs-dir docs 를 실행하세요.
     이 파일(site-search.js)은 직접 수정할 필요가 없습니다. */
(function () {
  'use strict';
  var DOCS = SEARCH_DATA.DOCS;
  var LABELS = SEARCH_DATA.LABELS;

  function ready(fn){ if (document.readyState !== 'loading') fn(); else document.addEventListener('DOMContentLoaded', fn); }
  function strip(s){ return (s || '').replace(/\s+/g, ' ').trim(); }
  function escHtml(s){ return s.replace(/[&<>"']/g, function (c){ return { '&':'&amp;','<':'&gt;','>':'&gt;','"':'&quot;',"'":'&#39;' }[c]; }); }

  ready(function () {
    var pageLang = (document.documentElement.lang || 'ko').split('-')[0];
    var labels = LABELS[pageLang] || LABELS.ko;

    // Filter DOCS to current language
    var filteredDocs = DOCS.filter(function (d) {
      return !d.lang || d.lang === pageLang;
    });

    var firstGroup = document.querySelector('.group');
    if (!firstGroup) return;

    var style = document.createElement('style');
    style.textContent = [
      '.ss-wrap{margin:0 0 40px;position:relative;}',
      '.ss-wrap input{width:100%;padding:13px 16px;font-size:15px;border:1px solid #d0d7de;border-radius:10px;background:#fff;color:#1f2328;outline:none;}',
      '.ss-wrap input:focus{border-color:#0969da;box-shadow:0 0 0 3px rgba(9,105,218,.12);}',
      '.ss-results{position:absolute;left:0;right:0;top:calc(100% + 6px);background:#fff;border:1px solid #d0d7de;border-radius:10px;box-shadow:0 8px 28px rgba(0,0,0,.12);max-height:62vh;overflow-y:auto;z-index:30;display:none;}',
      '.ss-results.show{display:block;}',
      '.ss-item{display:block;padding:10px 16px;border-bottom:1px solid #eef1f4;text-decoration:none;color:#1f2328;}',
      '.ss-item:last-child{border-bottom:none;}',
      '.ss-item:hover,.ss-item.ss-active{background:#f0f7ff;}',
      '.ss-item .ss-h{font-size:14px;font-weight:600;color:#0969da;font-family:SFMono-Regular,Consolas,monospace;}',
      '.ss-item .ss-p{font-size:12px;color:#636c76;margin-top:2px;}',
      '.ss-msg{padding:14px 16px;color:#636c76;font-size:13px;}',
      '.ss-hint{margin-top:8px;font-size:12px;color:#636c76;}'
    ].join('');
    document.head.appendChild(style);

    var wrap = document.createElement('div');
    wrap.className = 'ss-wrap';
    wrap.innerHTML =
      '<input type="search" placeholder="' + labels.placeholder + '" aria-label="핸드북 전체 검색">' +
      '<div class="ss-results" role="listbox"></div>' +
      '<div class="ss-hint">' + labels.hint(filteredDocs.length) + '</div>';
    firstGroup.parentNode.insertBefore(wrap, firstGroup);

    var input = wrap.querySelector('input');
    var results = wrap.querySelector('.ss-results');
    var index = null, building = false, activeIdx = -1, current = [];

    function parseDoc(doc, html){
      var d = new DOMParser().parseFromString(html, 'text/html');
      var main = d.querySelector('main') || d.body;
      var out = [], curId = '', curTitle = '';
      var nodes = main.querySelectorAll('h2[id], h3, .scenario-card[id]');
      for (var i = 0; i < nodes.length; i++){
        var el = nodes[i];
        if (el.tagName === 'H2'){
          curId = el.id; curTitle = strip(el.textContent);
          out.push({ doc: doc, id: curId, heading: curTitle, section: curTitle, type: labels.section });
        } else if (el.classList && el.classList.contains('scenario-card')){
          var ti = el.querySelector('strong');
          var lv = el.querySelector('span');
          out.push({
            doc: doc, id: el.id,
            heading: ti ? strip(ti.textContent) : el.id,
            section: lv ? strip(lv.textContent) : '',
            type: el.getAttribute('data-kind') || labels.scenario
          });
        } else {
          var code = el.querySelector('code');
          out.push({
            doc: doc, id: curId,
            heading: code ? strip(code.textContent) : strip(el.textContent),
            section: curTitle, type: labels.item
          });
        }
      }
      return out;
    }

    function build(){
      if (index || building) return;
      building = true;
      results.innerHTML = '<div class="ss-msg">' + labels.building + '</div>';
      results.classList.add('show');
      Promise.all(filteredDocs.map(function (doc){
        return fetch(doc.path).then(function (r){ return r.text(); })
          .then(function (html){ return parseDoc(doc, html); })
          .catch(function (){ return []; });
      })).then(function (all){
        index = Array.prototype.concat.apply([], all);
        building = false;
        if (input.value.trim()) run(input.value);
        else results.classList.remove('show');
      });
    }

    function score(e, q){
      var h = e.heading.toLowerCase();
      if (h === q) return 0;
      if (h.indexOf(q) === 0) return 1;
      if (h.indexOf(q) >= 0) return 2;
      if (e.section.toLowerCase().indexOf(q) >= 0) return 3;
      return -1;
    }

    function run(raw){
      var q = raw.trim().toLowerCase();
      if (!q){ results.classList.remove('show'); results.innerHTML = ''; return; }
      if (!index){ build(); return; }
      var scored = [];
      for (var i = 0; i < index.length; i++){
        var s = score(index[i], q);
        if (s >= 0) scored.push({ e: index[i], s: s, i: i });
      }
      scored.sort(function (a, b){ return a.s - b.s || a.i - b.i; });
      current = scored.slice(0, 12).map(function (x){ return x.e; });
      activeIdx = -1;
      if (!current.length){
        results.innerHTML = '<div class="ss-msg">' + labels.noResult + '</div>';
        results.classList.add('show'); return;
      }
      results.innerHTML = current.map(function (e){
        var href = e.doc.path + '?q=' + encodeURIComponent(raw.trim()) + (e.id ? ('#' + e.id) : '');
        return '<a class="ss-item" role="option" href="' + href + '">' +
          '<div class="ss-h">' + escHtml(e.heading) + '</div>' +
          '<div class="ss-p">' + escHtml(e.doc.title) + (e.section ? ' › ' + escHtml(e.section) : '') + ' · ' + e.type + '</div>' +
        '</a>';
      }).join('');
      results.classList.add('show');
    }

    function setActive(i){
      var items = results.querySelectorAll('.ss-item');
      if (!items.length) return;
      if (activeIdx >= 0 && items[activeIdx]) items[activeIdx].classList.remove('ss-active');
      activeIdx = (i + items.length) % items.length;
      items[activeIdx].classList.add('ss-active');
      items[activeIdx].scrollIntoView({ block: 'nearest' });
    }

    var t;
    input.addEventListener('focus', build);
    input.addEventListener('input', function (){ clearTimeout(t); t = setTimeout(function (){ run(input.value); }, 110); });
    input.addEventListener('keydown', function (e){
      var items = results.querySelectorAll('.ss-item');
      if (e.key === 'ArrowDown'){ e.preventDefault(); setActive(activeIdx + 1); }
      else if (e.key === 'ArrowUp'){ e.preventDefault(); setActive(activeIdx - 1); }
      else if (e.key === 'Enter'){ if (activeIdx >= 0 && items[activeIdx]){ e.preventDefault(); location.href = items[activeIdx].getAttribute('href'); } }
      else if (e.key === 'Escape'){ results.classList.remove('show'); input.blur(); }
    });
    document.addEventListener('click', function (e){ if (!wrap.contains(e.target)) results.classList.remove('show'); });
  });
})();
