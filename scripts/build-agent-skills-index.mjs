/**
 * Publishes Agent Skills Discovery (RFC 0.2) index and copies skill artifacts
 * to public/.well-known for deployment.
 */
import { createHash } from "node:crypto";
import { readdir, readFile, writeFile, mkdir } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, "..");
const sourceRoot = join(root, ".agents", "skills");
const outRoot = join(root, "public", ".well-known", "agent-skills");
const site = "https://jenlooper.com";
const schema =
  "https://schemas.agentskills.io/discovery/0.2.0/schema.json";

function parseFrontmatterBlock(md) {
  if (!md.startsWith("---")) return {};
  const end = md.indexOf("\n---", 3);
  if (end === -1) return {};
  const block = md.slice(3, end);
  const meta = {};
  for (const line of block.split("\n")) {
    const m = line.match(/^([A-Za-z0-9-]+):\s*(.*)$/);
    if (m) meta[m[1]] = m[2] ?? "";
  }
  return meta;
}

function digestHex(buf) {
  return createHash("sha256").update(buf).digest("hex");
}

async function main() {
  const dirNames = (await readdir(sourceRoot, { withFileTypes: true }))
    .filter((d) => d.isDirectory())
    .map((d) => d.name)
    .sort((a, b) => a.localeCompare(b, "en"));

  const skills = [];

  await mkdir(outRoot, { recursive: true });

  for (const d of dirNames) {
    const sp = join(sourceRoot, d, "SKILL.md");
    const raw = await readFile(sp, "utf8");
    const meta = parseFrontmatterBlock(raw);
    const id = (meta.name || d).trim().toLowerCase();
    if (!/^[a-z0-9-]+$/.test(id)) {
      console.warn(`build-agent-skills-index: invalid id "${id}" in ${d}, skip`);
      continue;
    }
    const { description: desc = "" } = meta;
    const descTrim = (desc || "").replace(/\r/g, "");

    const destDir = join(outRoot, "artifacts", id);
    await mkdir(destDir, { recursive: true });
    const destPath = join(destDir, "SKILL.md");
    await writeFile(destPath, raw, "utf8");
    const buf = Buffer.from(raw, "utf8");
    const hex = digestHex(buf);
    const url = `${site}/.well-known/agent-skills/artifacts/${id}/SKILL.md`;
    skills.push({
      name: id,
      type: "skill-md",
      description: descTrim,
      url,
      digest: `sha256:${hex}`,
    });
  }

  const index = {
    $schema: schema,
    skills: skills.sort((a, b) => a.name.localeCompare(b.name, "en")),
  };

  await writeFile(
    join(outRoot, "index.json"),
    JSON.stringify(index, null, 2) + "\n",
    "utf8",
  );

  console.log(
    `build-agent-skills-index: wrote index.json and ${skills.length} artifacts`,
  );
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
