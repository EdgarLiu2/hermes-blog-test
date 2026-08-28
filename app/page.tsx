import Link from "next/link";
import { getAllPosts } from "@/lib/posts";

/** 清理 description 中的 markdown 符号，用于纯文本展示 */
function cleanDescription(s: string): string {
  return s.replace(/[#*`>_~]/g, "").replace(/\s+/g, " ").trim();
}

export default function Home() {
  const posts = getAllPosts();
  return (
    <main className="mx-auto max-w-3xl px-6 py-16">
      <header className="mb-12">
        <h1 className="text-3xl font-bold tracking-tight">Hermes Blog</h1>
        <p className="mt-2 text-muted-foreground">面向 AI/ML 从业者的技术博客</p>
      </header>

      <section className="grid gap-6">
        {posts.map((post) => (
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
    </main>
  );
}
