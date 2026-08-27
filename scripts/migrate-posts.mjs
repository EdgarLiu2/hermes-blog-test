/**
 * 迁移脚本：把 content/posts/*.md (Hugo) 转为 content/YYYY-MM-DD-slug.mdx (Next.js MDX)
 * 用法：node scripts/migrate-posts.mjs
 */
import fs from "node:fs";
import path from "node:path";
import matter from "gray-matter";

const SRC_DIR = path.join(process.cwd(), "content", "posts");
const DEST_DIR = path.join(process.cwd(), "content");

if (!fs.existsSync(DEST_DIR)) fs.mkdirSync(DEST_DIR, { recursive: true });

const files = fs
  .readdirSync(SRC_DIR)
  .filter((f) => f.endsWith(".md") && !f.startsWith("."));

if (files.length === 0) {
  console.log("content/posts/ 下没有 .md 文件，跳过");
  process.exit(0);
}

let migrated = 0;
for (const file of files) {
  const raw = fs.readFileSync(path.join(SRC_DIR, file), "utf-8");
  const { data, content } = matter(raw);

  const slug = file.replace(/\.md$/, "");
  // gray-matter 会把 YAML 日期解析成 Date 对象，这里统一格式化为 YYYY-MM-DD
  const rawDate = data.date instanceof Date ? data.date : new Date(data.date);
  const date = [
    rawDate.getUTCFullYear(),
    String(rawDate.getUTCMonth() + 1).padStart(2, "0"),
    String(rawDate.getUTCDate()).padStart(2, "0"),
  ].join("-");
  if (!date) {
    console.warn(`⚠ ${file}: 无 date，跳过`);
    continue;
  }

  const meta = {
    title: data.title || slug,
    date,
    tags: Array.isArray(data.tags) ? data.tags : [],
    author: data.author || "EdgarLiu2",
    // 从正文第一段生成 description（Hugo 时代没有，这里补上利于 SEO）
    description: data.description || firstParagraph(content),
  };

  const frontmatter = [
    "---",
    `title: "${String(meta.title).replace(/"/g, '\\"')}"`,
    `date: "${meta.date}"`,
    `tags: [${meta.tags.map((t) => `"${t}"`).join(", ")}]`,
    `author: "${meta.author}"`,
    `description: "${meta.description.replace(/"/g, '\\"')}"`,
    "---",
    "",
    content.trim(),
    "",
  ].join("\n");

  const dest = path.join(DEST_DIR, `${meta.date}-${slug}.mdx`);
  fs.writeFileSync(dest, frontmatter, "utf-8");
  console.log(`✓ ${file} → ${path.basename(dest)}`);
  migrated++;
}

console.log(`\n完成：迁移 ${migrated} 篇`);

function firstParagraph(md) {
  const lines = md
    .split("\n")
    .map((l) => l.trim())
    .filter((l) => l && !l.startsWith("#") && !l.startsWith("```") && !l.startsWith("|"));
  return lines[0]?.slice(0, 150) || "";
}
