/**
 * After @astrojs/sitemap runs, the URL list lives in sitemap-0.xml (and index).
 * Expose the same document at /sitemap.xml for tools and specs that expect that path.
 */
const fs = require("node:fs");
const path = require("node:path");

const dist = path.join(__dirname, "..", "dist");
const source = path.join(dist, "sitemap-0.xml");
const target = path.join(dist, "sitemap.xml");

if (fs.existsSync(source)) {
  fs.copyFileSync(source, target);
} else {
  console.warn("copy-sitemap: dist/sitemap-0.xml not found; skip sitemap.xml alias");
}
