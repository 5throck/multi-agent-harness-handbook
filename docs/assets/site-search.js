/* 랜딩 사이트 전체 검색 — 의존성·빌드 없음.
   첫 포커스 때 DOCS의 모든 문서를 fetch → DOMParser로 파싱해 색인 구축(항상 최신).
   매뉴얼: h2[id](섹션) + h3(항목, 안에 <code>) / 예시: .scenario-card[id](시나리오)
   결과 선택 시 해당 문서의 정확한 위치로 이동(+ ?q= 로 그 페이지 검색 자동 적용).

   ★ 사용 시 수정할 곳은 아래 DOCS 배열 하나뿐 — 새 문서의 path·title로 교체한다.
     path 는 docs/ 기준 상대경로, title 은 검색 결과에 표시될 문서명. */
(function () {
  'use strict';
  var DOCS = [
    { path: 'intro/01_Why_AI_Chapter.html', title: '1장 · AI 시대의 업무 혁신' },
    { path: 'concepts/02_Concepts_Chapter.html', title: '2장 · 하네스 엔지니어링과 멀티 에이전트팀 개념' },
    { path: 'guardrails/03_Guardrails_Chapter.html', title: '3장 · 가드레일과 권한 모델' },
    { path: 'practice/04_Practice_Manual.html', title: '4장 §1 · 하네스 기반 멀티 에이전트 팀 활용' },
    { path: 'practice/04_Practice_Manual_A.html', title: '4장 §1-A · 서브에이전트 활용 상세 — Claude 중심' },
    { path: 'practice/04_Practice_Manual_B.html', title: '4장 §1-B · 서브에이전트 활용 상세 — Antigravity 중심' },
    { path: 'practice/04_Practice_Examples_A.html', title: '4장 §2-A · 멀티 에이전트 팀 실습 — Claude 중심 시나리오별 학습 가이드' },
    { path: 'practice/04_Practice_Examples_B.html', title: '4장 §2-B · 멀티 에이전트 팀 실습 — Antigravity 중심 시나리오별 학습 가이드' },
    { path: 'intro/05_Intro_Chapter.html', title: '5장 · ai-workspace-standards 소개' },
    { path: 'variant-practice/06_VariantPractice_Manual.html', title: '6장 §1 · ai-workspace-standards 로컬 설치와 프로젝트 스캐폴딩' },
    { path: 'variant-practice/06_VariantPractice_Examples.html', title: '6장 §2 · Variant 실습 예시 — 시나리오별 학습 가이드' },
    { path: 'enterprise/07_Enterprise_Chapter.html', title: '7장 · 기업 내부 멀티 에이전트팀 운영, 두 가지 모델 비교' },
    { path: 'intro/08_Intro_Advanced_Deploy.html', title: '8장 §1 · 배포와 SSOT' },
    { path: 'intro/08_Intro_Advanced_Chapter.html', title: '8장 §2 · 생애주기 관리' },
    { path: 'intro/08_Intro_Advanced_AGENTS.html', title: '8장 §3 · AGENTS.md 심화' },
    { path: 'intro/08_Intro_Advanced_Architecture.html', title: '8장 §4 · 아키텍처 심화' },
    { path: 'intro/08_Intro_Advanced_Roadmap.html', title: '8장 §5 · 고도화 로드맵' },
    { path: 'workflows/09_Workflows_Chapter.html', title: '9장 · 워크플로우 디자인 패턴' },
    { path: 'intro/10_ProjectUpgrade_Chapter.html', title: '10장 · L2 프로젝트 업그레이드' },
    { path: 'variant-advanced/11_VariantAdvanced_Chapter.html', title: '11장 · 신규 variant 만들기 vs 기존 프로젝트를 variant로 승격하기' },
    { path: 'variant-advanced/12_VariantAdvanced_Examples.html', title: '12장 · 신규 variant 승격 실습 예시 — 시나리오별 학습 가이드' },
    { path: 'capstone/13_Capstone.html', title: '13장 · 캡스톤 실습 — 나만의 워크플로우 설계하기' },
    { path: 'tools/00_Tools_Manual.html', title: '공통 참고 · 도구 비교 — Claude Code / Claude App / Antigravity CLI / Antigravity' },
    { path: 'glossary/00_Glossary.html', title: '용어집' },
    { path: 'faq/00_FAQ.html', title: 'FAQ · 자주 나는 오류와 해결법' },
    { path: 'setup/SETUP_ko.html', title: '워크숍 환경 설치 가이드' },
    { path: 'setup/SETUP_CHECKLIST_ko.html', title: '워크숍 사전 설치 체크리스트' },
    { path: 'lecture-guide/00_Course_Overview.html', title: '강의 소개' },
    { path: 'lecture-guide/00_Lecture_Guide.html', title: '강의 진행 가이드' }
  ];
  function ready(fn){ if (document.readyState !== 'loading') fn(); else document.addEventListener('DOMContentLoaded', fn); }
  function strip(s){ return (s || '').replace(/\s+/g, ' ').trim(); }
  function escHtml(s){ return s.replace(/[&<>"]/g, function (c){ return { '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;' }[c]; }); }

  ready(function () {
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
      '<input type="search" placeholder="핸드북 전체 검색 — 섹션·항목·시나리오…" aria-label="핸드북 전체 검색">' +
      '<div class="ss-results" role="listbox"></div>' +
      '<div class="ss-hint">' + DOCS.length + '개 문서 전체에서 찾아 해당 위치로 이동합니다.</div>';
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
          out.push({ doc: doc, id: curId, heading: curTitle, section: curTitle, type: '섹션' });
        } else if (el.classList && el.classList.contains('scenario-card')){
          var ti = el.querySelector('strong');
          var lv = el.querySelector('span');
          out.push({
            doc: doc, id: el.id,
            heading: ti ? strip(ti.textContent) : el.id,
            section: lv ? strip(lv.textContent) : '',
            type: el.getAttribute('data-kind') || '시나리오'   // 문제/Q&A 등. 없으면 시나리오(하위호환)
          });
        } else { // h3
          var code = el.querySelector('code');
          out.push({
            doc: doc, id: curId,
            heading: code ? strip(code.textContent) : strip(el.textContent),
            section: curTitle, type: '항목'
          });
        }
      }
      return out;
    }

    function build(){
      if (index || building) return;
      building = true;
      results.innerHTML = '<div class="ss-msg">색인 준비 중…</div>';
      results.classList.add('show');
      Promise.all(DOCS.map(function (doc){
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
        results.innerHTML = '<div class="ss-msg">결과 없음</div>';
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
