import { writeFileSync } from "node:fs";
import { findAllHtmlFiles, readFile } from "./nav-utils.ts";

const FOOTERS = {
  ko: `    <footer>
      Claude Code 2026-07 / Antigravity CLI 1.1.0+ / Antigravity 2.0 / ai-workspace-standards main (2026-07-08) 기준 · 한국어 교육 자료<br>
      공식 자료: <a href="https://code.claude.com/docs/en/sub-agents" target="_blank">code.claude.com</a> ·
      <a href="https://code.claude.com/docs" target="_blank">antigravity.google</a> ·
      <a href="https://github.com/5throck/ai-workspace-standards" target="_blank">github.com/5throck/ai-workspace-standards</a><br>
      본 핸드북의 콘텐츠는 <a href="https://creativecommons.org/licenses/by-nc-sa/4.0/deed.ko" target="_blank" rel="noopener noreferrer">CC BY-NC-SA 4.0 (저작자표시-비영리-동일조건변경허락 4.0 국제)</a> 라이선스에 따라 이용할 수 있습니다.<br>
      Built with the Teach Me skill for Claude Code.
    </footer>`,

  en: `    <footer>
      Based on Claude Code 2026-07 / Antigravity CLI 1.1.0+ / Antigravity 2.0 / ai-workspace-standards main (2026-07-08) · English Educational Materials<br>
      Official Docs: <a href="https://code.claude.com/docs/en/sub-agents" target="_blank">code.claude.com</a> ·
      <a href="https://code.claude.com/docs" target="_blank">antigravity.google</a> ·
      <a href="https://github.com/5throck/ai-workspace-standards" target="_blank">github.com/5throck/ai-workspace-standards</a><br>
      Handbook content is licensed under <a href="https://creativecommons.org/licenses/by-nc-sa/4.0/" target="_blank" rel="noopener noreferrer">CC BY-NC-SA 4.0 (Attribution-NonCommercial-ShareAlike 4.0 International)</a>.<br>
      Built with the Teach Me skill for Claude Code.
    </footer>`,

  es: `    <footer>
      Basado en Claude Code 2026-07 / Antigravity CLI 1.1.0+ / Antigravity 2.0 / ai-workspace-standards main (2026-07-08) · Material educativo en español<br>
      Recursos oficiales: <a href="https://code.claude.com/docs/en/sub-agents" target="_blank">code.claude.com</a> ·
      <a href="https://code.claude.com/docs" target="_blank">antigravity.google</a> ·
      <a href="https://github.com/5throck/ai-workspace-standards" target="_blank">github.com/5throck/ai-workspace-standards</a><br>
      El contenido de este manual está bajo la licencia <a href="https://creativecommons.org/licenses/by-nc-sa/4.0/deed.es" target="_blank" rel="noopener noreferrer">CC BY-NC-SA 4.0 (Atribución-NoComercial-CompartirIgual 4.0 Internacional)</a>.<br>
      Built with the Teach Me skill for Claude Code.
    </footer>`,

  ja: `    <footer>
      Claude Code 2026-07 / Antigravity CLI 1.1.0+ / Antigravity 2.0 / ai-workspace-standards main (2026-07-08) 基準 · 日本語教材<br>
      公式リソース: <a href="https://code.claude.com/docs/en/sub-agents" target="_blank">code.claude.com</a> ·
      <a href="https://code.claude.com/docs" target="_blank">antigravity.google</a> ·
      <a href="https://github.com/5throck/ai-workspace-standards" target="_blank">github.com/5throck/ai-workspace-standards</a><br>
      このハンドブックのコンテンツは <a href="https://creativecommons.org/licenses/by-nc-sa/4.0/deed.ja" target="_blank" rel="noopener noreferrer">CC BY-NC-SA 4.0 (表示 - 非営利 - 継承 4.0 国際)</a> ライセンスの下で提供されています。<br>
      Built with the Teach Me skill for Claude Code.
    </footer>`
};

export function updateFooters() {
  const htmlFiles = findAllHtmlFiles();
  let updatedCount = 0;

  for (const filePath of htmlFiles) {
    let lang: "ko" | "en" | "es" | "ja" = "ko";
    if (filePath.endsWith("_en.html")) lang = "en";
    else if (filePath.endsWith("_es.html")) lang = "es";
    else if (filePath.endsWith("_ja.html")) lang = "ja";

    let content = readFile(filePath);
    const targetFooter = FOOTERS[lang];

    let newContent = content;
    if (/<footer[\s\S]*?<\/footer>/.test(content)) {
      newContent = content.replace(/<footer[\s\S]*?<\/footer>/, targetFooter.trim());
    } else if (content.includes("</body>")) {
      newContent = content.replace("</body>", `${targetFooter}\n</body>`);
    } else {
      console.warn(`[WARN] No </body> tag in ${filePath}`);
      continue;
    }

    if (newContent !== content) {
      writeFileSync(filePath, newContent, "utf-8");
      updatedCount++;
    }
  }

  console.log(`Successfully updated footers in ${updatedCount} / ${htmlFiles.length} HTML files.`);
}

updateFooters();
