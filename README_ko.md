# 멀티 에이전트팀 하네스 엔지니어링 핸드북

언어: [English](README.md) | [한국어](README_ko.md) | [日本語](README_ja.md) | [Español](README_es.md)

**멀티 에이전트팀 하네스 엔지니어링 핸드북**은 AI 워크스페이스(AI Workspace) 구축과 운용을 위한 종합 교육 프로그램입니다. 
하네스 엔지니어링 기본 개념부터 시작하여 Claude Code, Claude Desktop App, Antigravity CLI, Antigravity Desktop 등 최신 AI 에이전트 도구 실습, 워크플로우 디자인 패턴, 기업 내 엔터프라이즈 운영 전략 비교, 그리고 `ai-workspace-standards`를 기반으로 커스텀 에이전트 variant를 직접 구축해 보는 실습 과정까지 폭넓게 다룹니다.

## 🌐 교육 프로그램 바로가기 (웹사이트)
👉 **[핸드북 교육 사이트 보기](https://5throck.github.io/multi-agent-harness-handbook/)**

## 💻 로컬 환경 설정
`docs/setup/upstream/`의 워크숍 설치 스크립트는 직접 복사해 넣은 파일이 아니라 [git submodule](https://github.com/5throck/setup)입니다. clone할 때 서브모듈을 함께 받거나, 이미 clone했다면 아래 명령으로 초기화하세요.
```bash
git clone --recurse-submodules https://github.com/5throck/multi-agent-harness-handbook.git
# 이미 일반 clone을 했다면:
git submodule update --init
```

## 📚 커리큘럼 구성
- **1장 · 도입** — 왜 AI 에이전트 팀인가 & 현대적 AI 워크스페이스 패러다임
- **2장 · 하네스 엔지니어링** — 멀티 에이전트팀 핵심 개념과 오케스트레이션
- **3장 · 가드레일과 권한 모델** — 에이전트 안전망과 권한 제어
- **4장 · 하네스 기반 멀티 에이전트 팀 활용** — 레퍼런스 및 Claude / Antigravity 실습
- **5장 · `ai-workspace-standards` 소개** — AI 워크스페이스 표준화체계
- **6장 · 기존 variant 활용** — 레퍼런스 패턴 및 실습
- **7장 · 기업 내 운영 전략 비교** — 도입 및 거버넌스 전략 분석
- **8장 · `ai-workspace-standards` 아키텍처 심화** — 배포·SSOT, 생애주기, AGENTS.md 심화, 고도화 로드맵
- **9장 · 워크플로우 디자인 패턴** — 멀티 에이전트 협업 패턴
- **10장 · L2 프로젝트 업그레이드** — 실전 프로젝트 에이전트 기능 확장
- **11장 · 신규 variant 생성 (Phase A)** — 커스텀 하네스 설계
- **12장 · 신규 variant 승격 (Phase B)** — 프로덕션 배포 및 검증
- **13장 · 캡스톤** — 나만의 워크플로우 설계하기
- **공통 참고** — 도구 비교 (Claude Code / Claude Desktop App / Antigravity CLI / Antigravity)

## 🎯 대상 버전
- Claude Code 2026-08 / Antigravity CLI 1.1.0+ / Antigravity 2.0 / `ai-workspace-standards` main (2026-08)

## 📜 License
- **핸드북 콘텐츠**: [CC BY-NC-SA 4.0](LICENSE) (저작자표시-비영리-동일조건변경허락 4.0 국제)
