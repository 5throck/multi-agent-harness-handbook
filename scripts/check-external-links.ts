#!/usr/bin/env bun
// scripts/check-external-links.ts
// L4 — External link validation for handbook HTML files.
// Extends the internal-only check-links.ts by testing external URLs:
//   1. Extracts all <a href="http..."> links from HTML files
//   2. Performs HTTP HEAD requests with a 5-second timeout
//   3. Follows redirects (up to 5 hops) and uses HEAD→GET fallback for 403/405/501
//   4. Reports non-2xx status codes and timeouts (after redirects)
//   5. Skips known-good domains (creativecommons.org, github.com, claude.ai)
//   6. Limits concurrency to 5 simultaneous requests
//
// Vendored between intro-to-ai-harness and multi-agent-harness-handbook.
// Uses only Node.js built-in http/https modules (no node-fetch).
//
// Usage:
//   bun run scripts/check-external-links.ts --docs-dir docs
// Exit code 0 if no broken links, 1 otherwise.
// @version 1.1.0

import { findAllHtmlFiles, readFile, getDocsDir, configureDocsDir } from "./nav-utils.ts";
import { relative } from "node:path";
import http from "node:http";
import https from "node:https";
import { URL } from "node:url";

// ---------------------------------------------------------------------------
// Configuration
// ---------------------------------------------------------------------------

const TIMEOUT_MS = 5_000;
const MAX_CONCURRENCY = 5;

/** Domains considered known-good and skipped. */
const SKIP_DOMAINS = new Set([
  "creativecommons.org",
  "github.com",
  "claude.ai",
  "anthropic.com",
]);

// ---------------------------------------------------------------------------
// Issue types
// ---------------------------------------------------------------------------

export interface ExternalLinkIssue {
  file: string;
  url: string;
  status: number | "TIMEOUT" | "ERROR";
  redirectChain?: string;
}

// ---------------------------------------------------------------------------
// HTTP request helper with redirect following and HEAD→GET fallback
// ---------------------------------------------------------------------------

interface HeadResult {
  status: number;
  redirectChain?: string;
}

const MAX_REDIRECTS = 5;
const RETRIABLE_STATUS_CODES = new Set([403, 405, 501]);

/**
 * Perform an HTTP HEAD request with a timeout, following redirects.
 * If HEAD returns 403/405/501, retries with GET.
 * Returns the final status code after following redirects, or "TIMEOUT" / "ERROR".
 */
function headRequest(urlStr: string): Promise<HeadResult | "TIMEOUT" | "ERROR"> {
  return new Promise((resolve) => {
    let parsed: URL;
    try {
      parsed = new URL(urlStr);
    } catch {
      resolve("ERROR");
      return;
    }

    const transport = parsed.protocol === "https:" ? https : http;
    let redirectCount = 0;
    let currentUrl = urlStr;
    const redirectChain: string[] = [];

    const doRequest = (useGet: boolean = false): void => {
      let reqParsed: URL;
      try {
        reqParsed = new URL(currentUrl);
      } catch {
        resolve("ERROR");
        return;
      }

      const reqTransport = reqParsed.protocol === "https:" ? https : http;
      const method = useGet ? "GET" : "HEAD";

      const req = reqTransport.request(
        {
          hostname: reqParsed.hostname,
          port: reqParsed.port || (reqParsed.protocol === "https:" ? 443 : 80),
          path: reqParsed.pathname + reqParsed.search,
          method,
          timeout: TIMEOUT_MS,
          headers: {
            "User-Agent": "handbook-link-checker/1.1",
            "Accept": "*/*",
          },
        },
        (res) => {
          // Consume response data to free the socket
          res.resume();

          const statusCode = res.statusCode ?? 0;

          // Handle redirects
          if (statusCode >= 300 && statusCode < 400 && res.headers.location) {
            if (redirectCount >= MAX_REDIRECTS) {
              resolve({ status: statusCode, redirectChain: redirectChain.join(" -> ") });
              return;
            }

            redirectCount++;
            const location = res.headers.location;
            redirectChain.push(`${currentUrl} -> ${location}`);

            // Handle relative redirects
            try {
              currentUrl = new URL(location, currentUrl).href;
            } catch {
              resolve("ERROR");
              return;
            }

            // Follow redirect with same method
            doRequest(useGet);
            return;
          }

          // HEAD→GET fallback for certain status codes
          if (!useGet && RETRIABLE_STATUS_CODES.has(statusCode)) {
            doRequest(true);
            return;
          }

          // Final response
          resolve({ status: statusCode, redirectChain: redirectChain.length > 0 ? redirectChain.join(" -> ") : undefined });
        },
      );

      req.on("timeout", () => {
        req.destroy();
        resolve("TIMEOUT");
      });

      req.on("error", () => {
        resolve("ERROR");
      });

      req.end();
    };

    doRequest();
  });
}

// ---------------------------------------------------------------------------
// Concurrency-limited map
// ---------------------------------------------------------------------------

/**
 * Like Promise.allSettled but limited to `limit` concurrent promises.
 * Returns results in the same order as the inputs.
 */
async function mapLimit<T, R>(
  items: T[],
  limit: number,
  fn: (item: T) => Promise<R>,
): Promise<R[]> {
  const results: R[] = new Array(items.length);
  let index = 0;

  async function worker(): Promise<void> {
    while (index < items.length) {
      const i = index++;
      results[i] = await fn(items[i]);
    }
  }

  const workers = Array.from({ length: Math.min(limit, items.length) }, () => worker());
  await Promise.all(workers);
  return results;
}

// ---------------------------------------------------------------------------
// URL extraction
// ---------------------------------------------------------------------------

/** Extract all external http(s) href URLs from an HTML string. */
function extractExternalUrls(html: string): string[] {
  const urls: string[] = [];
  const aRe = /<a\s+(?:[^>]*?\s)?href="(https?:\/\/[^"]*)"[^>]*>/gi;
  let m: RegExpExecArray | null;
  while ((m = aRe.exec(html)) !== null) {
    urls.push(m[1]);
  }
  return urls;
}

/** Check whether a URL's domain should be skipped. */
function shouldSkip(urlStr: string): boolean {
  try {
    const parsed = new URL(urlStr);
    return SKIP_DOMAINS.has(parsed.hostname);
  } catch {
    return false;
  }
}

// ---------------------------------------------------------------------------
// Runner
// ---------------------------------------------------------------------------

export async function checkExternalLinks(): Promise<ExternalLinkIssue[]> {
  const all: ExternalLinkIssue[] = [];
  const htmlFiles = findAllHtmlFiles();
  const docsDir = getDocsDir();

  // Collect (file, url) pairs, deduplicating URLs across files
  const fileUrlPairs: { file: string; url: string }[] = [];
  for (const filePath of htmlFiles) {
    const html = readFile(filePath);
    const relFile = relative(docsDir, filePath).replace(/\\/g, "/");
    const urls = extractExternalUrls(html);
    for (const url of urls) {
      if (!shouldSkip(url)) {
        fileUrlPairs.push({ file: relFile, url });
      }
    }
  }

  // Deduplicate URLs — only check each unique URL once
  const uniqueUrls = [...new Set(fileUrlPairs.map((p) => p.url))];

  console.error(`check-external-links: checking ${uniqueUrls.length} unique external URLs...`);

  // Check URLs with limited concurrency
  const results = await mapLimit(uniqueUrls, MAX_CONCURRENCY, async (url) => {
    const result = await headRequest(url);
    return { url, result };
  });

  // Build a status map for quick lookup
  const statusMap = new Map<string, HeadResult | "TIMEOUT" | "ERROR">();
  for (const { url, result } of results) {
    statusMap.set(url, result);
  }

  // Report issues
  for (const pair of fileUrlPairs) {
    const status = statusMap.get(pair.url);
    if (status === undefined) continue;
    if (typeof status === "object") {
      // Non-2xx status is a broken link (after all redirects and fallbacks)
      if (status.status < 200 || status.status >= 300) {
        all.push({
          file: pair.file,
          url: pair.url,
          status: status.status,
          redirectChain: status.redirectChain,
        });
      }
    } else {
      // TIMEOUT or ERROR
      all.push({ file: pair.file, url: pair.url, status });
    }
  }

  return all;
}

if (import.meta.main) {
  const args = process.argv.slice(2);
  const idx = args.indexOf("--docs-dir");
  if (idx !== -1 && args[idx + 1]) configureDocsDir(args[idx + 1]);

  checkExternalLinks().then((issues) => {
    if (issues.length === 0) {
      console.log("check-external-links: OK -- all external links reachable.");
      process.exit(0);
    }

    console.error(`check-external-links: ${issues.length} broken external link(s):`);
    // Deduplicate per file+url to avoid spamming the same URL from multiple files
    const seen = new Set<string>();
    for (const issue of issues) {
      const key = `${issue.file}:${issue.url}`;
      if (seen.has(key)) continue;
      seen.add(key);
      const redirectInfo = issue.redirectChain ? ` (via: ${issue.redirectChain})` : "";
      console.error(`  ${issue.file}: ${issue.url} -> ${issue.status}${redirectInfo}`);
    }
    process.exit(1);
  });
}
