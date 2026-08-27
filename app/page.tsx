import Link from "next/link";
import { getAllPosts } from "@/lib/posts";

/** 清理 description 中的 markdown 符号，用于纯文本展示 */
function cleanDescription(s: string): string {
  return s.replace(/[#*`>_~]/g, "").replace(/\s+/g, " ").trim();
}

export default function Home() {
  const posts = getAllPosts();
  return (
    <main style={{ maxWidth: 720, margin: "0 auto", padding: "3rem 1.5rem" }}>
      <header style={{ marginBottom: "2.5rem" }}>
        <h1 style={{ fontSize: "2rem", fontWeight: 700 }}>Hermes Blog</h1>
        <p style={{ color: "var(--muted)", marginTop: "0.5rem" }}>
          面向 AI/ML 从业者的技术博客
        </p>
      </header>

      <section>
        {posts.map((post) => (
          <article
            key={post.slug}
            style={{
              padding: "1rem 0",
              borderBottom: "1px solid var(--border)",
            }}
          >
            <time style={{ color: "var(--muted)", fontSize: "0.875rem" }}>
              {post.meta.date}
            </time>
            <h2 style={{ fontSize: "1.25rem", fontWeight: 600, margin: "0.25rem 0" }}>
              <Link href={`/posts/${post.slug}`} style={{ color: "inherit", textDecoration: "none" }}>
                {post.meta.title}
              </Link>
            </h2>
            {post.meta.description && (
              <p style={{ color: "var(--muted)", fontSize: "0.9rem", margin: "0.25rem 0 0" }}>
                {cleanDescription(post.meta.description)}
              </p>
            )}
            <div style={{ marginTop: "0.5rem" }}>
              {post.meta.tags.map((tag) => (
                <span
                  key={tag}
                  style={{
                    fontSize: "0.75rem",
                    background: "rgba(127,127,127,0.15)",
                    padding: "0.15rem 0.5rem",
                    borderRadius: "999px",
                    marginRight: "0.4rem",
                  }}
                >
                  {tag}
                </span>
              ))}
            </div>
          </article>
        ))}
      </section>
    </main>
  );
}
