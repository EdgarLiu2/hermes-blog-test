import Link from "next/link";
import { getAllPosts } from "@/lib/posts";
import { filterPostsByTags, getTagFrequency, parseTagsParam } from "@/lib/tags";

/** 清理 description 中的 markdown 符号，用于纯文本展示 */
function cleanDescription(s: string): string {
  return s.replace(/[#*`>_~]/g, "").replace(/\s+/g, " ").trim();
}

export default async function Home({
  searchParams,
}: {
  searchParams: Promise<{ tags?: string }>;
}) {
  const { tags: tagsRaw } = await searchParams;
  const selectedTags = parseTagsParam(tagsRaw ?? null);

  const posts = getAllPosts();
  const filtered = filterPostsByTags(posts, selectedTags);
  const tagFreq = getTagFrequency(posts);

  return (
    <main className="mx-auto max-w-3xl px-6 py-16">
      <header className="mb-12">
        <h1 className="text-3xl font-bold tracking-tight">Hermes Blog</h1>
        <p className="mt-2 text-muted-foreground">面向 AI/ML 从业者的技术博客</p>
      </header>

      {/* 标签筛选栏 */}
      {tagFreq.length > 0 && (
        <nav
          aria-label="文章标签筛选"
          className="mb-10 rounded-xl border border-border bg-card p-4"
        >
          <div className="mb-3 flex items-center justify-between">
            <span className="text-sm font-medium text-foreground">按标签筛选</span>
            {selectedTags.length > 0 && (
              <Link
                href="/"
                className="text-xs text-muted-foreground transition-colors hover:text-accent"
              >
                清除筛选
              </Link>
            )}
          </div>
          <div className="flex flex-wrap gap-2">
            {tagFreq.map(({ tag, count }) => {
              const active = selectedTags.includes(tag);
              // toggle：已选中则移除，未选中则追加
              const next = active
                ? selectedTags.filter((t) => t !== tag)
                : [...selectedTags, tag];
              const href = next.length > 0 ? `/?tags=${encodeURIComponent(next.join(","))}` : "/";
              return (
                <Link
                  key={tag}
                  href={href}
                  aria-pressed={active}
                  className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
                    active
                      ? "bg-accent text-white"
                      : "bg-accent/10 text-accent hover:bg-accent/20"
                  }`}
                >
                  {tag}
                  <span className="ml-1 opacity-60">({count})</span>
                </Link>
              );
            })}
          </div>
        </nav>
      )}

      {filtered.length === 0 ? (
        <p className="py-16 text-center text-muted-foreground">
          没有找到符合所选标签的文章。
        </p>
      ) : (
        <section className="grid gap-6">
          {filtered.map((post) => (
            <Link
              key={post.slug}
              href={`/posts/${post.slug}`}
              className="group block rounded-xl border border-border bg-card p-6 transition-all duration-200 hover:-translate-y-0.5 hover:border-accent hover:shadow-lg"
            >
              <article>
                <time className="text-sm text-muted-foreground">
                  {post.meta.date}
                </time>
                <h2 className="mt-2 text-xl font-semibold leading-snug text-foreground transition-colors group-hover:text-accent">
                  {post.meta.title}
                </h2>
                {post.meta.description && (
                  <p className="mt-3 line-clamp-3 text-[0.925rem] text-muted-foreground">
                    {cleanDescription(post.meta.description)}
                  </p>
                )}
                <div className="mt-4 flex flex-wrap gap-2">
                  {post.meta.tags.map((tag) => (
                    <span
                      key={tag}
                      className="rounded-full bg-accent/10 px-2.5 py-0.5 text-xs font-medium text-accent"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              </article>
            </Link>
          ))}
        </section>
      )}
    </main>
  );
}
