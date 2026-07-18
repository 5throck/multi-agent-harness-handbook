/* 랜딩 사이트 전체 검색 — 의존성·빌드 없음.
   첫 포커스 때 DOCS의 모든 문서를 fetch → DOMParser로 파싱해 색인 구축(항상 최신).
   매뉴얼: h2[id](섹션) + h3(항목, 안에 <code>) / 예시: .scenario-card[id](시나리오)
   결과 선택 시 해당 문서의 정확한 위치로 이동(+ ?q= 로 그 페이지 검색 자동 적용).

   ★ 사용 시 수정할 곳은 아래 DOCS 배열 하나뿐 — 새 문서의 path·title로 교체한다.
     path 는 docs/ 기준 상대경로, title 은 검색 결과에 표시될 문서명. */
(function () {
  'use strict';
  var DOCS = [
    { path: 'intro/01_Why_AI_Chapter.html', title: '1장 · AI 시대의 업무 혁신', lang: 'ko' },
    { path: 'concepts/02_Concepts_Chapter.html', title: '2장 · 하네스 엔지니어링과 멀티 에이전트팀 개념', lang: 'ko' },
    { path: 'guardrails/03_Guardrails_Chapter.html', title: '3장 · 가드레일과 권한 모델', lang: 'ko' },
    { path: 'warm-up/Warmup_Tetris_Pacman.html', title: '워밍업 실습 · 테트리스에서 팩맨까지', lang: 'ko' },
    { path: 'practice/04_Practice_Manual.html', title: '4장 §1 · 하네스 기반 멀티 에이전트 팀 활용', lang: 'ko' },
    { path: 'practice/04_Practice_Manual_A.html', title: '4장 §1-A · 서브에이전트 활용 상세 — Claude 중심', lang: 'ko' },
    { path: 'practice/04_Practice_Manual_B.html', title: '4장 §1-B · 서브에이전트 활용 상세 — Antigravity 중심', lang: 'ko' },
    { path: 'practice/04_Practice_Examples_A.html', title: '4장 §2-A · 멀티 에이전트 팀 실습 — Claude 중심 시나리오별 학습 가이드', lang: 'ko' },
    { path: 'practice/04_Practice_Examples_B.html', title: '4장 §2-B · 멀티 에이전트 팀 실습 — Antigravity 중심 시나리오별 학습 가이드', lang: 'ko' },
    { path: 'intro/05_Intro_Chapter.html', title: '5장 · ai-workspace-standards 소개', lang: 'ko' },
    { path: 'variant-practice/06_VariantPractice_Manual.html', title: '6장 §1 · ai-workspace-standards 로컬 설치와 프로젝트 스캐폴딩', lang: 'ko' },
    { path: 'variant-practice/06_VariantPractice_Examples.html', title: '6장 §2 · Variant 실습 예시 — 시나리오별 학습 가이드', lang: 'ko' },
    { path: 'enterprise/07_Enterprise_Chapter.html', title: '7장 · 기업 내부 멀티 에이전트팀 운영, 두 가지 모델 비교', lang: 'ko' },
    { path: 'intro/08_Intro_Advanced_Deploy.html', title: '8장 §1 · 배포와 SSOT', lang: 'ko' },
    { path: 'intro/08_Intro_Advanced_Chapter.html', title: '8장 §2 · 생애주기 관리', lang: 'ko' },
    { path: 'intro/08_Intro_Advanced_AGENTS.html', title: '8장 §3 · AGENTS.md 심화', lang: 'ko' },
    { path: 'intro/08_Intro_Advanced_Architecture.html', title: '8장 §4 · 아키텍처 심화', lang: 'ko' },
    { path: 'intro/08_Intro_Advanced_Roadmap.html', title: '8장 §5 · 고도화 로드맵', lang: 'ko' },
    { path: 'workflows/09_Workflows_Chapter.html', title: '9장 · 워크플로우 디자인 패턴', lang: 'ko' },
    { path: 'intro/10_ProjectUpgrade_Chapter.html', title: '10장 · L2 프로젝트 업그레이드', lang: 'ko' },
    { path: 'variant-advanced/11_VariantAdvanced_Chapter.html', title: '11장 · 신규 variant 만들기 vs 기존 프로젝트를 variant로 승격하기', lang: 'ko' },
    { path: 'variant-advanced/12_VariantAdvanced_Examples.html', title: '12장 · 신규 variant 승격 실습 예시 — 시나리오별 학습 가이드', lang: 'ko' },
    { path: 'capstone/13_Capstone.html', title: '13장 · 캡스톤 실습 — 나만의 워크플로우 설계하기', lang: 'ko' },
    { path: 'tools/00_Tools_Manual.html', title: '공통 참고 · 도구 비교 — Claude Code / Claude App / Antigravity CLI / Antigravity', lang: 'ko' },
    { path: 'glossary/00_Glossary.html', title: '용어집', lang: 'ko' },
    { path: 'faq/00_FAQ.html', title: 'FAQ · 자주 나는 오류와 해결법', lang: 'ko' },
    { path: 'setup/SETUP_ko.html', title: '워크숍 환경 설치 가이드', lang: 'ko' },
    { path: 'setup/SETUP_CHECKLIST_ko.html', title: '워크숍 사전 설치 체크리스트', lang: 'ko' },
    { path: 'lecture-guide/00_Course_Overview.html', title: '강의 소개', lang: 'ko' },
    { path: 'lecture-guide/00_Lecture_Guide.html', title: '강의 진행 가이드', lang: 'ko' },
    /* ── English ── */
    { path: 'intro/01_Why_AI_Chapter_en.html', title: 'Chapter 1 · Work Transformation in the AI Era', lang: 'en' },
    { path: 'concepts/02_Concepts_Chapter_en.html', title: 'Chapter 2 · Harness Engineering and Multi-Agent Team Concepts', lang: 'en' },
    { path: 'guardrails/03_Guardrails_Chapter_en.html', title: 'Chapter 3 · Guardrails and Permission Models', lang: 'en' },
    { path: 'warm-up/Warmup_Tetris_Pacman_en.html', title: 'Warm-up Exercise · From Tetris to Pac-Man', lang: 'en' },
    { path: 'practice/04_Practice_Manual_en.html', title: 'Chapter 4 §1 · Using Harness-Based Multi-Agent Teams', lang: 'en' },
    { path: 'practice/04_Practice_Manual_A_en.html', title: 'Ch. 4 §1-A · Subagent Usage in Detail — Claude Focus', lang: 'en' },
    { path: 'practice/04_Practice_Manual_B_en.html', title: 'Chapter 4 §1-B · Subagent Usage in Detail — Antigravity Focus', lang: 'en' },
    { path: 'practice/04_Practice_Examples_A_en.html', title: 'Chapter 4 §2-A · Multi-Agent Team Practice — A Claude-Centered Scenario-Based Learning Guide', lang: 'en' },
    { path: 'practice/04_Practice_Examples_B_en.html', title: 'Chapter 4 §2-B · Multi-Agent Team Practice — An Antigravity-Focused Scenario-Based Learning Guide', lang: 'en' },
    { path: 'intro/05_Intro_Chapter_en.html', title: 'Chapter 5 · Introducing ai-workspace-standards', lang: 'en' },
    { path: 'variant-practice/06_VariantPractice_Manual_en.html', title: 'Chapter 6 §1 · Local Installation of ai-workspace-standards and Project Scaffolding', lang: 'en' },
    { path: 'variant-practice/06_VariantPractice_Examples_en.html', title: 'Chapter 6 §2 · Variant Practice Examples — Scenario-Based Learning Guide', lang: 'en' },
    { path: 'enterprise/07_Enterprise_Chapter_en.html', title: 'Chapter 7 - Running Multi-Agent Teams Inside the Enterprise: Comparing Two Models', lang: 'en' },
    { path: 'intro/08_Intro_Advanced_Deploy_en.html', title: 'Chapter 8 §1 · Deployment and SSOT', lang: 'en' },
    { path: 'intro/08_Intro_Advanced_Chapter_en.html', title: 'Chapter 8 §2 · Lifecycle Management', lang: 'en' },
    { path: 'intro/08_Intro_Advanced_AGENTS_en.html', title: 'Chapter 8 §3 · AGENTS.md In Depth', lang: 'en' },
    { path: 'intro/08_Intro_Advanced_Architecture_en.html', title: 'Chapter 8 §4 · Advanced Architecture', lang: 'en' },
    { path: 'intro/08_Intro_Advanced_Roadmap_en.html', title: 'Chapter 8 §5 · Advanced Roadmap', lang: 'en' },
    { path: 'workflows/09_Workflows_Chapter_en.html', title: 'Chapter 9 · Workflow Design Patterns', lang: 'en' },
    { path: 'intro/10_ProjectUpgrade_Chapter_en.html', title: 'Chapter 10 - L2 Project Upgrade', lang: 'en' },
    { path: 'variant-advanced/11_VariantAdvanced_Chapter_en.html', title: 'Chapter 11 · Creating a New Variant vs. Promoting an Existing Project to a Variant', lang: 'en' },
    { path: 'variant-advanced/12_VariantAdvanced_Examples_en.html', title: 'Chapter 12 · Hands-on Examples for New Variant Promotion — a Scenario-Based Learning Guide', lang: 'en' },
    { path: 'capstone/13_Capstone_en.html', title: 'Chapter 13 · Capstone Exercise — Designing Your Own Workflow', lang: 'en' },
    { path: 'tools/00_Tools_Manual_en.html', title: 'Tool Comparison — Claude Code / Claude App / Antigravity CLI / Antigravity', lang: 'en' },
    { path: 'glossary/00_Glossary_en.html', title: 'Glossary · Multi-Agent Team Harness Engineering Handbook', lang: 'en' },
    { path: 'faq/00_FAQ_en.html', title: 'FAQ · Common Errors and Fixes · Multi-Agent Harness Engineering Handbook', lang: 'en' },
    { path: 'setup/SETUP_en.html', title: 'Workshop Environment Setup Guide · Multi-Agent Team Harness Engineering Handbook', lang: 'en' },
    { path: 'setup/SETUP_CHECKLIST_en.html', title: 'Workshop Pre-Installation Checklist · Multi-Agent Harness Engineering Handbook', lang: 'en' },
    { path: 'lecture-guide/00_Course_Overview_en.html', title: 'Course Overview · Multi-Agent Team Harness Engineering Handbook', lang: 'en' },
    { path: 'lecture-guide/00_Lecture_Guide_en.html', title: 'Lecture Guide · Multi-Agent Team Harness Engineering Handbook', lang: 'en' },
    /* ── Japanese ── */
    { path: 'intro/01_Why_AI_Chapter_ja.html', title: '第1章 · AI時代の業務革新', lang: 'ja' },
    { path: 'concepts/02_Concepts_Chapter_ja.html', title: '第2章 · ハーネスエンジニアリングとマルチエージェントチームの概念', lang: 'ja' },
    { path: 'guardrails/03_Guardrails_Chapter_ja.html', title: '第3章 · ガードレールと権限モデル', lang: 'ja' },
    { path: 'warm-up/Warmup_Tetris_Pacman_ja.html', title: 'ウォームアップ実習 · テトリスからパックマンまで', lang: 'ja' },
    { path: 'practice/04_Practice_Manual_ja.html', title: '第4章 §1 · ハーネスベースのマルチエージェントチーム活用', lang: 'ja' },
    { path: 'practice/04_Practice_Manual_A_ja.html', title: '第4章 §1-A・サブエージェント活用詳細 — Claude中心', lang: 'ja' },
    { path: 'practice/04_Practice_Manual_B_ja.html', title: '第4章 §1-B・サブエージェント活用詳細 — Antigravity中心', lang: 'ja' },
    { path: 'practice/04_Practice_Examples_A_ja.html', title: '4章 §2-A・マルチエージェントチーム実習 (Claude中心)', lang: 'ja' },
    { path: 'practice/04_Practice_Examples_B_ja.html', title: '第4章 §2-B・マルチエージェントチーム実習 — Antigravity中心シナリオ別学習ガイド', lang: 'ja' },
    { path: 'intro/05_Intro_Chapter_ja.html', title: '第5章 · ai-workspace-standards 紹介', lang: 'ja' },
    { path: 'variant-practice/06_VariantPractice_Manual_ja.html', title: '第6章 §1 · ai-workspace-standards のローカルインストールとプロジェクトスキャフォールディング', lang: 'ja' },
    { path: 'variant-practice/06_VariantPractice_Examples_ja.html', title: '第6章 §2 · Variant実習例 — シナリオ別学習ガイド', lang: 'ja' },
    { path: 'enterprise/07_Enterprise_Chapter_ja.html', title: '第7章・企業内マルチエージェントチーム運用、2つのモデルの比較', lang: 'ja' },
    { path: 'intro/08_Intro_Advanced_Deploy_ja.html', title: '第8章 §1 · デプロイとSSOT', lang: 'ja' },
    { path: 'intro/08_Intro_Advanced_Chapter_ja.html', title: '第8章 §2 · ライフサイクル管理', lang: 'ja' },
    { path: 'intro/08_Intro_Advanced_AGENTS_ja.html', title: '第8章 §3 · AGENTS.md 詳解', lang: 'ja' },
    { path: 'intro/08_Intro_Advanced_Architecture_ja.html', title: '第8章 §4・アーキテクチャ深掘り', lang: 'ja' },
    { path: 'intro/08_Intro_Advanced_Roadmap_ja.html', title: '第8章 §5・高度化ロードマップ', lang: 'ja' },
    { path: 'workflows/09_Workflows_Chapter_ja.html', title: '第9章 · ワークフローデザインパターン', lang: 'ja' },
    { path: 'intro/10_ProjectUpgrade_Chapter_ja.html', title: '第10章・L2プロジェクトのアップグレード', lang: 'ja' },
    { path: 'variant-advanced/11_VariantAdvanced_Chapter_ja.html', title: '第11章 · 新規variantの作成 vs 既存プロジェクトをバリアント(variant)へ昇格させる', lang: 'ja' },
    { path: 'variant-advanced/12_VariantAdvanced_Examples_ja.html', title: '第12章 · 新規Variant昇格実習例 — シナリオ別学習ガイド', lang: 'ja' },
    { path: 'capstone/13_Capstone_ja.html', title: '第13章・キャップストーン演習 — 自分だけのワークフローを設計する', lang: 'ja' },
    { path: 'tools/00_Tools_Manual_ja.html', title: 'ツール比較 — Claude Code / Claude App / Antigravity CLI / Antigravity', lang: 'ja' },
    { path: 'glossary/00_Glossary_ja.html', title: '用語集 · マルチエージェントチーム・ハーネスエンジニアリング・ハンドブック', lang: 'ja' },
    { path: 'faq/00_FAQ_ja.html', title: 'FAQ · よくあるエラーと解決法 · マルチエージェントチームハーネスエンジニアリングハンドブック', lang: 'ja' },
    { path: 'setup/SETUP_ja.html', title: 'ワークショップ環境セットアップガイド · マルチエージェントチームハーネスエンジニアリングハンドブック', lang: 'ja' },
    { path: 'setup/SETUP_CHECKLIST_ja.html', title: 'ワークショップ事前インストールチェックリスト · マルチエージェントチームハーネスエンジニアリングハンドブック', lang: 'ja' },
    { path: 'lecture-guide/00_Course_Overview_ja.html', title: '講義紹介・マルチエージェントチーム・ハーネスエンジニアリング・ハンドブック', lang: 'ja' },
    { path: 'lecture-guide/00_Lecture_Guide_ja.html', title: '講義進行ガイド · マルチエージェントチームハーネスエンジニアリングハンドブック', lang: 'ja' }
  ];

  var LABELS = {
    ko: {
      placeholder: '핸드북 전체 검색 — 섹션·항목·시나리오…',
      section: '섹션', scenario: '시나리오', item: '항목',
      noResult: '결과 없음',
      hint: function(n){ return n + '개 문서 전체에서 찾아 해당 위치로 이동합니다.'; },
      building: '색인 준비 중…'
    },
    en: {
      placeholder: 'Search entire handbook — sections, items, scenarios…',
      section: 'Section', scenario: 'Scenario', item: 'Item',
      noResult: 'No results',
      hint: function(n){ return n + ' documents searched. Navigates to exact position.'; },
      building: 'Building index…'
    },
    ja: {
      placeholder: 'ハンドブック全体検索 — セクション・項目・シナリオ…',
      section: 'セクション', scenario: 'シナリオ', item: '項目',
      noResult: '結果なし',
      hint: function(n){ return n + '文書から検索し、該当箇所に移動します。'; },
      building: 'インデックス準備中…'
    }
  };

  function ready(fn){ if (document.readyState !== 'loading') fn(); else document.addEventListener('DOMContentLoaded', fn); }
  function strip(s){ return (s || '').replace(/\s+/g, ' ').trim(); }
  function escHtml(s){ return s.replace(/[&<>"]/g, function (c){ return { '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;' }[c]; }); }

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
            type: el.getAttribute('data-kind') || labels.scenario   // 문제/Q&A 등. 없으면 시나리오(하위호환)
          });
        } else { // h3
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
