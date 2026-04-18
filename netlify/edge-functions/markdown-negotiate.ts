// Markdown for Agents: dependency-free HTML→text/markdown in Netlify Edge
// https://developers.cloudflare.com/fundamentals/reference/markdown-for-agents/

import type { Config, Context } from "https://edge.netlify.com";

const MAX_BYTES = 2_097_152; // 2 MB

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

function prefersMarkdown(accept: string | null): boolean {
  if (!accept) return false;
  const p = parseAccept(accept);
  let bestMd = 0;
  let bestHtml = 0;
  for (const { type, q } of p) {
    if (q === 0) continue;
    if (
      type === "text/markdown" ||
      type === "text/x-markdown" ||
      type === "application/markdown"
    ) {
      if (q > bestMd) bestMd = q;
    }
    if (
      type === "text/html" ||
      type === "application/xhtml+xml" ||
      type === "text/html-fragment"
    ) {
      if (q > bestHtml) bestHtml = q;
    }
  }
  if (bestMd <= 0) return false;
  if (bestHtml <= 0) return true;
  return bestMd > bestHtml;
}

function tokenEstimate(s: string): number {
  return Math.max(0, Math.ceil(s.length / 4));
}

const fileExt =
  /\.(js|mjs|cjs|ts|map|css|png|jpe?g|gif|webp|avif|ico|svg|xml|txt|json|pdf|woff2?|ttf|eot|otf|md|markdown)$/i;

function skipPath(pathname: string): boolean {
  if (pathname.startsWith("/_astro/") || pathname.startsWith("/pagefind/")) {
    return true;
  }
  if (pathname.startsWith("/.well-known/")) return true;
  if (fileExt.test(pathname)) return true;
  return false;
}

function decodeBasicEntities(s: string): string {
  return s
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#(\d+);/g, (_, d) => String.fromCharCode(parseInt(d, 10)))
    .replace(/&#x([0-9a-f]+);/gi, (_, h) =>
      String.fromCharCode(parseInt(h, 16)),
    );
}

function innerText(html: string): string {
  return decodeBasicEntities(
    html.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim(),
  );
}

/** Deterministic, edge-safe HTML → Markdown (no third-party import). */
function htmlToMarkdown(html: string): string {
  let h = html
    .replace(
      /<script[\s\S]*?<\/script>/gi,
      "",
    )
    .replace(
      /<style[\s\S]*?<\/style>/gi,
      "",
    )
    .replace(
      /<noscript[\s\S]*?<\/noscript>/gi,
      "",
    )
    .replace(/<svg[\s\S]*?<\/svg>/gi, "");

  const main = h.match(/<main\b[^>]*>([\s\S]*?)<\/main>/i);
  if (main) h = main[1] ?? h;

  for (const [tag, prefix] of [
    ["h1", "# "],
    ["h2", "## "],
    ["h3", "### "],
    ["h4", "#### "],
    ["h5", "##### "],
    ["h6", "###### "],
  ] as const) {
    const re = new RegExp(
      "<" + tag + "\\b[^>]*>([\\s\\S]*?)</" + tag + ">",
      "gi",
    );
    h = h.replace(re, (_f, inner) => prefix + innerText(inner) + "\n\n");
  }

  h = h.replace(
    /<a\s+[^>]*href=([^\s>]+|["'][^"']*["'])\s*[^>]*>([\s\S]*?)<\/a>/gi,
    (_a, hrefRaw, inner) => {
      const href = String(hrefRaw).replace(/^["']|["']$/g, "");
      const t = innerText(String(inner));
      return t ? `[${t}](${href})` : `(${href})`;
    },
  );
  h = h.replace(/<br\s*\/?\s*>/gi, "\n");
  h = h.replace(
    /<(b|strong)\b[^>]*>([\s\S]*?)<\/(b|strong)>/gi,
    (_1, _2, inner) => `**${innerText(String(inner))}**`,
  );
  h = h.replace(
    /<(i|em)\b[^>]*>([\s\S]*?)<\/(i|em)>/gi,
    (_1, _2, inner) => `_${innerText(String(inner))}_`,
  );
  h = h.replace(/<code\b[^>]*>([\s\S]*?)<\/code>/gi, (_c, inner) => {
    return "`" + innerText(String(inner)) + "`";
  });
  h = h.replace(
    /<pre\b[^>]*>([\s\S]*?)<\/pre>/gi,
    (_p, inner) => "\n```\n" + innerText(String(inner)) + "\n```\n",
  );
  h = h.replace(/<\/(p|div|section|article|li)>/gi, "\n");
  h = h.replace(
    /<blockquote\b[^>]*>([\s\S]*?)<\/blockquote>/gi,
    (_b, inner) => "> " + innerText(String(inner)).replace(/\n/g, "\n> ") + "\n\n",
  );
  h = h.replace(/<[^>]+>/g, " ");
  return decodeBasicEntities(
    h.replace(/[ \t]+/g, " ").replace(/\n{3,}/g, "\n\n").trim(),
  );
}

export const config: Config = {
  path: "/*",
  excludedPath: [
    "/.netlify/*",
    "/_astro/*",
    "/pagefind/*",
    "/.well-known/*",
  ],
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
  let markdown: string;
  try {
    markdown = htmlToMarkdown(html);
  } catch (e) {
    console.error("htmlToMarkdown failed", e);
    markdown = innerText(
      html.replace(/<script[\s\S]*?<\/script>|<style[\s\S]*?<\/style>/gi, ""),
    );
  }

  const headers: Record<string, string> = {
    "Content-Type": "text/markdown; charset=utf-8",
    "x-markdown-tokens": String(tokenEstimate(markdown)),
    Vary: "Accept",
  };

  return new Response(markdown, { status: 200, headers });
}
