import { describe, it, expect } from "vitest";
import { getAllPosts, getPostBySlug, getAllSlugs } from "@/lib/posts";

describe("lib/posts - 文章内容读取", () => {
  it("能读取全部 5 篇文章", () => {
    const posts = getAllPosts();
    expect(posts.length).toBe(5);
  });

  it("文章按日期降序排列", () => {
    const posts = getAllPosts();
    const dates = posts.map((p) => p.meta.date);
    const sorted = [...dates].sort().reverse();
    expect(dates).toEqual(sorted);
  });

  it("每篇文章都有 slug、title、date、author", () => {
    const posts = getAllPosts();
    for (const p of posts) {
      expect(p.slug).toBeTruthy();
      expect(p.meta.title).toBeTruthy();
      expect(p.meta.date).toMatch(/^\d{4}-\d{2}-\d{2}$/);
      expect(p.meta.author).toBe("EdgarLiu2");
      expect(p.content).toBeTruthy();
    }
  });

  it("slug 去掉日期前缀，生成正确的 URL slug", () => {
    const slugs = getAllSlugs();
    expect(slugs).toContain("hello-world");
    expect(slugs).toContain("hermes-kanban-swarm");
    expect(slugs).toContain("hermes-new-features");
    expect(slugs).toContain("hermes-vs-deepseek-harness");
    expect(slugs).toContain("second-post");
  });

  it("slug 不含日期前缀", () => {
    const slugs = getAllSlugs();
    for (const s of slugs) {
      expect(s).not.toMatch(/^\d{4}-\d{2}-\d{2}-/);
    }
  });
});

describe("lib/posts - 单篇文章查询", () => {
  it("能按 slug 查到已存在的文章", () => {
    const post = getPostBySlug("hello-world");
    expect(post).toBeDefined();
    expect(post?.meta.title).toBe("Hello World");
  });

  it("查询不存在的 slug 返回 undefined", () => {
    const post = getPostBySlug("not-exist-post");
    expect(post).toBeUndefined();
  });
});

describe("lib/posts - 内容完整性", () => {
  it("hermes-kanban-swarm 包含核心正文内容", () => {
    const post = getPostBySlug("hermes-kanban-swarm");
    expect(post?.content).toContain("Kanban Swarm");
    expect(post?.content).toContain("delegate_task");
    expect(post?.meta.tags.length).toBeGreaterThan(0);
  });

  it("每篇文章 tags 都是数组", () => {
    const posts = getAllPosts();
    for (const p of posts) {
      expect(Array.isArray(p.meta.tags)).toBe(true);
    }
  });
});
