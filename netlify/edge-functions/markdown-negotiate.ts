// Markdown for Agents: https://developers.cloudflare.com/fundamentals/reference/markdown-for-agents/
// Skill: https://isitagentready.com/.well-known/agent-skills/markdown-negotiation/SKILL.md

import type { Config, Context } from "https://edge.netlify.com";
import TurndownService from "https://esm.sh/turndown@7.2.0?bundle&target=deno";

const MAX_BYTES = 2_097_152; // 2 MB (same as Cloudflare M4A)

type PItem = { type: string; q: number };

function parseAccept(accept: string): PItem[] {
  return accept
    .split(/,\s*/)
    .map((p) => {
      const segs = p.split(";").map((s) => s.trim().toLowerCase());
      const type = segs[0] || "";
      let q = 1;
      for (const s of segs.slice(1)) {
        if (s.startsWith("q=")) {
          const n = parseFloat(s.slice(2));
          if (!Number.isNaN(n)) q = n;
        }
      }
      return { type, q };
    })
    .filter((x) => x.type);
}

/** Markdown wins only when it has a higher q-value than any explicit HTML type (tie → HTML for browsers). */
function prefersMarkdown(accept: string | null): boolean {
  if (!accept) return false;
  const p = parseAccept(accept);
  let bestMd = 0;
  let bestHtml = 0;
  for (const { type, q } of p) {
    if (q === 0) continue;
    if (type === "text/markdown" || type === "text/x-markdown" || type === "application/markdown")
      if (q > bestMd) bestMd = q;
    if (type === "text/html" || type === "application/xhtml+xml" || type === "text/html-fragment")
      if (q > bestHtml) bestHtml = q;
  }
  if (bestMd <= 0) return false;
  if (bestHtml <= 0) return true;
  return bestMd > bestHtml;
}

function tokenEstimate(s: string): number {
  return Math.max(0, Math.ceil(s.length / 4));
}

const turndown = new TurndownService({
  headingStyle: "atx",
  codeBlockStyle: "fenced",
});
turndown.addRule("stripScripts", {
  filter: ["script", "style", "noscript"],
  replacement: () => "",
});

// Skip obvious static assets; HTML pages and extensionless app routes are handled by Content-Type.
const fileExt = /\.(js|mjs|cjs|ts|map|css|png|jpe?g|gif|webp|avif|ico|svg|xml|txt|json|pdf|woff2?|ttf|eot|otf|md|markdown)$/i;

function skipPath(pathname: string): boolean {
  if (pathname.startsWith("/_astro/") || pathname.startsWith("/pagefind/")) return true;
  if (fileExt.test(pathname)) return true;
  return false;
}

export const config: Config = {
  path: "/*",
  excludedPath: ["/.netlify/*", "/_astro/*", "/pagefind/*"],
};

export default async function (request: Request, context: Context) {
  if (request.method !== "GET" && request.method !== "HEAD") {
    return context.next();
  }

  const { pathname } = new URL(request.url);
  if (skipPath(pathname)) {
    return context.next();
  }

  if (!prefersMarkdown(request.headers.get("Accept"))) {
    return context.next();
  }

  if (request.method === "HEAD") {
    return context.next();
  }

  const res = await context.next();
  if (res.status !== 200) return res;

  const contentType = res.headers.get("content-type") || "";
  if (!contentType.includes("text/html")) {
    return res;
  }

  const buf = new Uint8Array(await res.arrayBuffer());
  if (buf.byteLength > MAX_BYTES) {
    return new Response("Payload exceeds markdown conversion size limit", {
      status: 413,
      headers: { "Content-Type": "text/plain; charset=utf-8" },
    });
  }

  const html = new TextDecoder().decode(buf);
  const markdown = turndown.turndown(html);
  const headers: Record<string, string> = {
    "Content-Type": "text/markdown; charset=utf-8",
    "x-markdown-tokens": String(tokenEstimate(markdown)),
    Vary: "Accept",
  };

  return new Response(markdown, { status: 200, headers });
}
