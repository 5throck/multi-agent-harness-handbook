# 워크숍 사전 설치 체크리스트

> 설치 스크립트를 실행하기 **전에** 이 체크리스트를 완료하세요.
> 아래 항목들은 자동화가 불가능하며 직접 처리가 필요합니다.

---

## 1. 구독 확인 (최우선)

워크숍 실습에 사용하는 도구들은 유효한 구독이 필요합니다.

| 도구 | 필요 플랜 | 확인 |
|------|----------|------|
| **Claude Code CLI** (`claude`) | Claude Pro 또는 Max | [ ] |
| **Claude 데스크탑 앱** | Claude Pro 이상 | [ ] |
| **Antigravity CLI** (`agy`) | Gemini Advanced | [ ] |
| **Antigravity 데스크탑 앱** | Gemini Advanced | [ ] |

> ⚠️ **API Key 관련**: API Key는 구독 플랜 외부에서 별도 연동이 필요한 경우에만 사용합니다. 워크숍 실습은 구독 모델로 충분하며, API Key 발급은 꼭 필요한 경우에만 진행하세요.

---

## 2. 계정 준비

- [ ] **Google 계정** — Antigravity / Gemini Advanced 사용에 필요
- [ ] **GitHub 계정** — `gh auth login` 및 PR 실습에 필요
  - 계정이 없으면 [github.com](https://github.com)에서 미리 가입하세요

---

## 3. 시스템 요구사항

- [ ] OS: Windows 11 (Intel) / macOS Sequoia 15 이상 Apple Silicon (M 시리즈) / Ubuntu 24.04 이상
- [ ] 여유 디스크 공간: **5 GB 이상**
- [ ] 관리자 / sudo 권한 보유
  - **Windows**: 시작 → **"PowerShell"** 검색 → 우클릭 → **"관리자 권한으로 실행"**
    - 또는: `Win + X` → **"터미널(관리자)"** / **"Windows PowerShell(관리자)"**
    - 이후 뜨는 UAC(사용자 계정 컨트롤) 확인 창에서 **"예"** 클릭
  - **macOS / Linux**: 명령어 앞에 `sudo`를 붙여서 실행
- [ ] 안정적인 인터넷 연결 (총 다운로드 용량 약 1–2 GB)

---

## 4. Git 사용자 설정

git 설치 후 아래 명령어로 사용자 정보를 등록하세요:

```bash
git config --global user.name  "홍길동"
git config --global user.email "you@example.com"
```

- [ ] `git config --global user.name` 설정 완료
- [ ] `git config --global user.email` 설정 완료

---

## 5. GitHub 인증

```bash
gh auth login
```

안내에 따라 브라우저에서 인증을 완료하세요.

- [ ] `gh auth status` 실행 시 "Logged in" 표시 확인

---

## 6. 프로젝트 환경 설정 (저장소 클론 후)

**co-develop** 및 **co-consult** variant 사용 시:

```bash
cp .env.sample .env
# .env 파일을 열어 필요한 값을 채워 넣으세요
```

- [ ] `.env.sample`에서 `.env` 파일 생성 완료
- [ ] 필요한 API Key / 설정값 입력 완료

**co-develop** Python 프로젝트 — **uv** 사용 (필수):

```bash
uv sync          # pyproject.toml 기반 의존성 설치
# 또는 requirements.txt를 사용하는 경우:
uv pip install -r requirements.txt
```

- [ ] `uv` 설치 및 사용 가능 확인 (`uv --version`)
- [ ] `uv`로 Python 의존성 설치 완료

> **Docker**는 선택 사항입니다. 운영자가 별도로 안내하는 경우에만 설치하세요.
> macOS/Linux: 설치 스크립트에 `--docker` 플래그 추가. Windows: `-Docker` 플래그.
> - [ ] *(선택)* Docker 설치 및 데몬 실행 확인

---

## 7. 최종 환경 확인 (워크숍 전 반드시 실행)

프로젝트 루트 폴더에서 아래 명령어를 실행하세요:

```bash
bun setup-common.ts
```

출력 표의 모든 항목이 ✅로 표시되면 준비 완료입니다.

---

> 문의사항은 워크숍 시작 전에 운영자에게 연락하세요.
