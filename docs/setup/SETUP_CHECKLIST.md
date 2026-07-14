# Workshop Pre-Installation Checklist

> Complete this checklist **before** running the setup scripts.
> Items here cannot be automated — they require manual action on your part.

---

## 1. Subscriptions (Priority #1)

These tools require an active subscription to run during the workshop.

| Tool | Required Plan | Check |
|------|--------------|-------|
| **Claude Code CLI** (`claude`) | Claude Pro or Max | [ ] |
| **Claude Desktop App** | Claude Pro or above | [ ] |
| **Antigravity CLI** (`agy`) | Gemini Advanced | [ ] |
| **Antigravity Desktop App** | Gemini Advanced | [ ] |

> ⚠️ **API Key usage**: API keys are only needed if you are running tools outside a subscription plan (e.g., custom integrations). For workshop exercises, a subscription is sufficient and preferred.

---

## 2. Accounts

- [ ] **Google Account** — required for Antigravity / Gemini Advanced
- [ ] **GitHub Account** — required for `gh auth login` and PR exercises
  - Sign up at [github.com](https://github.com) if you don't have one

---

## 3. System Requirements

- [ ] OS: Windows 11 (Intel) / macOS Sequoia 15+ on Apple Silicon (M-series) / Ubuntu 24.04+
- [ ] Free disk space: **5 GB or more**
- [ ] Admin / sudo privileges on your machine
  - **Windows**: Open Start → search **"PowerShell"** → right-click → **"Run as administrator"**
    - Or: `Win + X` → **"Terminal (Admin)"** / **"Windows PowerShell (Admin)"**
    - Confirm the UAC prompt that appears
  - **macOS / Linux**: prefix commands with `sudo` when prompted
- [ ] Stable internet connection (downloads ~1–2 GB total)

---

## 4. Git Configuration

After git is installed, set your identity:

```bash
git config --global user.name  "Your Name"
git config --global user.email "you@example.com"
```

- [ ] `git config --global user.name` is set
- [ ] `git config --global user.email` is set

---

## 5. GitHub Authentication

```bash
gh auth login
```

Follow the prompts to authenticate via browser.

- [ ] `gh auth status` shows "Logged in"

---

## 6. Project Environment (after cloning)

For **co-develop** and **co-consult** variants:

```bash
cp .env.sample .env
# Then open .env and fill in required values
```

- [ ] `.env` file created from `.env.sample`
- [ ] Required API keys / config values filled in

For **co-develop** Python projects — use **uv** (required):

```bash
uv sync          # installs dependencies from pyproject.toml
# or, if the project uses requirements.txt:
uv pip install -r requirements.txt
```

- [ ] `uv` installed and accessible (`uv --version`)
- [ ] Python dependencies installed via `uv`

> **Docker** is optional. Install only if the workshop organizer asks you to.
> macOS/Linux: pass `--docker` to the setup script. Windows: pass `-Docker`.
> - [ ] *(optional)* Docker installed and daemon running

---

## 7. Quick Verification (run before the workshop)

Run the common setup script from your project root:

```bash
bun setup-common.ts
```

All rows in the output table should show ✅.

---

> Questions? Contact the workshop organizer before the session date.
