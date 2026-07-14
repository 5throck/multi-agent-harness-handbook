#!/usr/bin/env bun
/**
 * Workshop Setup — Common (tool verification)
 * Run AFTER the OS-specific setup script.
 * Usage: bun setup-common.ts
 */

import { $ } from "bun";

// ── Colors ────────────────────────────────────────────────────────────────────
const G  = "\x1b[32m"; const Y = "\x1b[33m"; const R = "\x1b[31m";
const C  = "\x1b[36m"; const D = "\x1b[2m";  const B = "\x1b[1m"; const N = "\x1b[0m";

// ── Animation ─────────────────────────────────────────────────────────────────
const SPIN = ["⠋","⠙","⠹","⠸","⠼","⠴","⠦","⠧","⠇","⠏"];

function section(num: number, total: number, label: string) {
  const pct    = Math.round(num * 100 / total);
  const width  = 22;
  const filled = Math.round(width * pct / 100);
  const bar    = "█".repeat(filled) + "░".repeat(width - filled);
  process.stdout.write(`\n${B}${C}[${num}/${total}]${N} ${label.padEnd(32)} ${Y}[${bar}] ${String(pct).padStart(3)}%${N}\n`);
}

async function ver(cmd: string, vArgs = ["--version"]): Promise<string | null> {
  try {
    const r = await $`${cmd} ${vArgs}`.quiet();
    return r.stdout.toString().trim().split("\n")[0];
  } catch { return null; }
}

// ── Header ────────────────────────────────────────────────────────────────────
console.clear();
process.stdout.write(`${B}${C}`);
console.log("  ╔══════════════════════════════════════════╗");
console.log("  ║     Workshop Setup — Verification        ║");
console.log("  ╚══════════════════════════════════════════╝");
process.stdout.write(`${N}\n`);

const TOTAL = 1;
const errors: string[] = [];

// ── Verification ────────────────────────────────────────────────────────────
section(TOTAL, TOTAL, "Verification");

type Tool = { cmd: string; vArgs?: string[]; label: string; required: boolean };
const tools: Tool[] = [
  { cmd: "bun",    label: "bun",              required: true  },
  { cmd: "python3",label: "python3",          required: false },
  { cmd: "uv",     label: "uv",               required: true  },
  { cmd: "git",    label: "git",              required: true  },
  { cmd: "gh",     label: "gh (GitHub CLI)",   required: true  },
  { cmd: "claude", label: "claude",           required: true  },
  { cmd: "agy",    label: "agy (Antigravity)",required: true },
];

const rows: [string, string, string][] = [];
for (const t of tools) {
  const v = await ver(t.cmd, t.vArgs);
  if (v)                rows.push([`${G}✅${N}`, t.label, v]);
  else if (t.required) { rows.push([`${R}❌${N}`, t.label, "NOT FOUND"]); errors.push(t.cmd); }
  else                  rows.push([`${Y}⚠️ ${N}`, t.label, `${D}not found (optional)${N}`]);
}

// gh auth
try {
  await $`gh auth status`.quiet();
  rows.push([`${G}✅${N}`, "gh auth", "logged in"]);
} catch {
  rows.push([`${Y}⚠️ ${N}`, "gh auth", `${Y}not logged in — run: gh auth login${N}`]);
}

// Print table
const maxLen = Math.max(...rows.map(r => r[1].length));
const sep    = "─".repeat(maxLen + 34);
console.log(`\n ${sep}`);
for (const [icon, label, value] of rows)
  console.log(` ${icon}  ${label.padEnd(maxLen + 2)} ${value}`);
console.log(` ${sep}`);

// ── Summary ───────────────────────────────────────────────────────────────────
console.log("");
console.log(`${B}${C}  ══════════════════════════════════════════${N}`);
if (errors.length === 0) {
  console.log(`${G}  ✅  All checks passed — ready for the workshop!${N}`);
} else {
  console.log(`${R}  ❌  Issues: ${errors.join(", ")}${N}`);
  console.log(`${D}  Resolve the above and re-run this script.${N}`);
  process.exit(1);
}
console.log(`${B}${C}  ══════════════════════════════════════════${N}\n`);
