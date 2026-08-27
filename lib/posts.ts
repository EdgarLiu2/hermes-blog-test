import fs from "node:fs";
import path from "node:path";
import matter from "gray-matter";
import type { Post, PostMeta } from "./types";

const CONTENT_DIR = path.join(process.cwd(), "content");

/**
 * 列出所有 MDX 文章，按日期降序排列。
 * 文件名规范：YYYY-MM-DD-slug.mdx
 */
export function getAllPosts(): Post[] {
  const files = fs
    .readdirSync(CONTENT_DIR)
    .filter((f) => f.endsWith(".mdx") && !f.startsWith("."));

  const posts = files.map((file) => {
    const raw = fs.readFileSync(path.join(CONTENT_DIR, file), "utf-8");
    const { data, content } = matter(raw);
    const slug = file.replace(/\.mdx$/, "").replace(/^\d{4}-\d{2}-\d{2}-/, "");
    return {
      slug,
      meta: data as PostMeta,
      content,
    };
  });

  return posts.sort(
    (a, b) => new Date(b.meta.date).getTime() - new Date(a.meta.date).getTime()
  );
}

/** 按 slug 取单篇文章 */
export function getPostBySlug(slug: string): Post | undefined {
  const file = fs
    .readdirSync(CONTENT_DIR)
    .find((f) => f.endsWith(`-${slug}.mdx`));
  if (!file) return undefined;
  const raw = fs.readFileSync(path.join(CONTENT_DIR, file), "utf-8");
  const { data, content } = matter(raw);
  return {
    slug,
    meta: data as PostMeta,
    content,
  };
}

/** 所有 slug（供 generateStaticParams） */
export function getAllSlugs(): string[] {
  return getAllPosts().map((p) => p.slug);
}
