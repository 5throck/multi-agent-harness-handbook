# CC BY-NC-SA 4.0 License Footer Display Design

## Goal
Display the **CC BY-NC-SA 4.0 (Attribution-NonCommercial-ShareAlike 4.0 International)** license notice across all handbook content HTML pages in all supported languages (Korean, English, Spanish, Japanese).

## Target Scope
All HTML files located under the `docs/` directory (~76 HTML files), including:
- Index pages (`index.html`, `index_en.html`, `index_es.html`, `index_ja.html`)
- All chapter, setup, practice, lecture-guide, and tools HTML pages

## Multilingual Footer Specification

### 1. Korean (`ko` / default `.html` & `SETUP_ko.html`, etc.)
```html
<footer>
  Claude Code 2026-07 / Antigravity CLI 1.1.0+ / Antigravity 2.0 / ai-workspace-standards main (2026-07-08) 기준 · 한국어 교육 자료<br>
  공식 자료: <a href="https://code.claude.com/docs/en/sub-agents" target="_blank">code.claude.com</a> ·
  <a href="https://code.claude.com/docs" target="_blank">antigravity.google</a> ·
  <a href="https://github.com/5throck/ai-workspace-standards" target="_blank">github.com/5throck/ai-workspace-standards</a><br>
  본 핸드북의 콘텐츠는 <a href="https://creativecommons.org/licenses/by-nc-sa/4.0/deed.ko" target="_blank" rel="noopener noreferrer">CC BY-NC-SA 4.0 (저작자표시-비영리-동일조건변경허락 4.0 국제)</a> 라이선스에 따라 이용할 수 있습니다.<br>
  Built with the Teach Me skill for Claude Code.
</footer>
```

### 2. English (`*_en.html` & `index_en.html`)
```html
<footer>
  Based on Claude Code 2026-07 / Antigravity CLI 1.1.0+ / Antigravity 2.0 / ai-workspace-standards main (2026-07-08) · English Educational Materials<br>
  Official Docs: <a href="https://code.claude.com/docs/en/sub-agents" target="_blank">code.claude.com</a> ·
  <a href="https://code.claude.com/docs" target="_blank">antigravity.google</a> ·
  <a href="https://github.com/5throck/ai-workspace-standards" target="_blank">github.com/5throck/ai-workspace-standards</a><br>
  Handbook content is licensed under <a href="https://creativecommons.org/licenses/by-nc-sa/4.0/" target="_blank" rel="noopener noreferrer">CC BY-NC-SA 4.0 (Attribution-NonCommercial-ShareAlike 4.0 International)</a>.<br>
  Built with the Teach Me skill for Claude Code.
</footer>
```

### 3. Spanish (`*_es.html` & `index_es.html`)
```html
<footer>
  Basado en Claude Code 2026-07 / Antigravity CLI 1.1.0+ / Antigravity 2.0 / ai-workspace-standards main (2026-07-08) · Material educativo en español<br>
  Recursos oficiales: <a href="https://code.claude.com/docs/en/sub-agents" target="_blank">code.claude.com</a> ·
  <a href="https://code.claude.com/docs" target="_blank">antigravity.google</a> ·
  <a href="https://github.com/5throck/ai-workspace-standards" target="_blank">github.com/5throck/ai-workspace-standards</a><br>
  El contenido de este manual está bajo la licencia <a href="https://creativecommons.org/licenses/by-nc-sa/4.0/deed.es" target="_blank" rel="noopener noreferrer">CC BY-NC-SA 4.0 (Atribución-NoComercial-CompartirIgual 4.0 Internacional)</a>.<br>
  Built with the Teach Me skill for Claude Code.
</footer>
```

### 4. Japanese (`*_ja.html` & `index_ja.html`)
```html
<footer>
  Claude Code 2026-07 / Antigravity CLI 1.1.0+ / Antigravity 2.0 / ai-workspace-standards main (2026-07-08) 基準 · 日本語教材<br>
  公式リソース: <a href="https://code.claude.com/docs/en/sub-agents" target="_blank">code.claude.com</a> ·
  <a href="https://code.claude.com/docs" target="_blank">antigravity.google</a> ·
  <a href="https://github.com/5throck/ai-workspace-standards" target="_blank">github.com/5throck/ai-workspace-standards</a><br>
  このハンドブックのコンテンツは <a href="https://creativecommons.org/licenses/by-nc-sa/4.0/deed.ja" target="_blank" rel="noopener noreferrer">CC BY-NC-SA 4.0 (表示 - 非営利 - 継承 4.0 国際)</a> ライセンスの下で提供されています。<br>
  Built with the Teach Me skill for Claude Code.
</footer>
```

## Implementation Strategy
1. Create a script or utility to update existing footers and insert footers into HTML files lacking a `<footer>` element before `</body>`.
2. Run validation scripts (`bun run validate-nav`) to ensure navigation and structure remain intact.
3. Commit design doc and updated HTML files.
