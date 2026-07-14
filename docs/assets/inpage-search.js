/* 페이지 내 검색 — 모든 문서 공용. 의존성 없음. 수정 없이 그대로 사용.
   - 사이드바(nav) 상단에 검색창 주입
   - 본문(main)에서 일치 항목 하이라이트 + 개수 + Enter로 다음 이동(Shift+Enter 이전)
   - 랜딩 검색에서 넘어온 ?q= 자동 적용
   주의: 사이드바 nav 링크는 필터링하지 않는다(묶음 라벨이 통째로 사라지는 문제로 제거됨). 되살리지 말 것. */
(function () {
  'use strict';
  function ready(fn){ if (document.readyState !== 'loading') fn(); else document.addEventListener('DOMContentLoaded', fn); }
  function escRe(s){ return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'); }

  ready(function () {
    var nav = document.querySelector('nav');
    var main = document.querySelector('main');
    if (!nav || !main) return;

    var style = document.createElement('style');
    style.textContent = [
      '.ip-search{padding:10px 14px 12px;border-bottom:1px solid #d0d7de;margin-bottom:6px;}',
      '.ip-search .ip-row{position:relative;display:flex;align-items:center;}',
      '.ip-search input{width:100%;padding:7px 28px 7px 10px;font-size:13px;border:1px solid #d0d7de;border-radius:6px;background:#fff;color:#1f2328;outline:none;}',
      '.ip-search input:focus{border-color:#0969da;box-shadow:0 0 0 2px rgba(9,105,218,.15);}',
      '.ip-search .ip-clear{position:absolute;right:6px;border:none;background:none;color:#636c76;cursor:pointer;font-size:16px;line-height:1;display:none;padding:2px 4px;}',
      '.ip-search .ip-count{margin-top:6px;font-size:11px;color:#636c76;min-height:13px;}',
      'mark.ip-hit{background:#fff3a3;color:inherit;border-radius:2px;padding:0 1px;}',
      'mark.ip-hit.ip-active{background:#ffd43b;outline:1px solid #f08c00;}'
    ].join('');
    document.head.appendChild(style);

    var box = document.createElement('div');
    box.className = 'ip-search';
    box.innerHTML =
      '<div class="ip-row">' +
        '<input type="search" placeholder="이 페이지에서 검색…" aria-label="이 페이지에서 검색">' +
        '<button class="ip-clear" type="button" title="지우기" aria-label="지우기">×</button>' +
      '</div>' +
      '<div class="ip-count"></div>';

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
          // SVG 라벨 보호: <mark> 주입 시 SVG <text>가 깨지므로 SVG 네임스페이스 노드는 제외(§ 가이드 SVG 도식화 항목)
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
      countEl.textContent = hits.length ? (hits.length + '개 일치 · Enter로 이동') : '일치 없음';
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
