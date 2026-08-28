import type { Post } from "./types";

/**
 * 统计所有文章的标签使用频率，按频率降序排列。
 * 同频率时按字母序稳定排列，保证输出确定性。
 */
export function getTagFrequency(posts: Post[]): { tag: string; count: number }[] {
  const map = new Map<string, number>();
  for (const post of posts) {
    // 每篇文章内去重：一篇文章的某标签只计一次（避免 frontmatter 里重复写法影响频率）
    for (const tag of new Set(post.meta.tags)) {
      map.set(tag, (map.get(tag) ?? 0) + 1);
    }
  }
  return [...map.entries()]
    .map(([tag, count]) => ({ tag, count }))
    .sort((a, b) => b.count - a.count || a.tag.localeCompare(b.tag));
}

/** 解析 URL searchParams 中的 tags 参数（逗号分隔），返回去重后的标签数组 */
export function parseTagsParam(raw: string | null): string[] {
  if (!raw) return [];
  return [...new Set(raw.split(",").map((s) => s.trim()).filter(Boolean))];
}

/**
 * 按选中的标签过滤文章（OR 逻辑：文章含任一选中标签即保留）。
 * 无选中标签时返回全部。
 */
export function filterPostsByTags(posts: Post[], tags: string[]): Post[] {
  if (tags.length === 0) return posts;
  const set = new Set(tags);
  return posts.filter((post) => post.meta.tags.some((t) => set.has(t)));
}
