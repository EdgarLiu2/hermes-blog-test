import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getAllSlugs, getPostBySlug } from "@/lib/posts";
import { MDXContent } from "./mdx-content";

// 静态导出：列出所有 slug，构建时生成每篇
export function generateStaticParams() {
  return getAllSlugs().map((slug) => ({ slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const post = getPostBySlug(slug);
  if (!post) return {};
  return {
    title: post.meta.title,
    description: post.meta.description,
    authors: [{ name: post.meta.author }],
    openGraph: {
      title: post.meta.title,
      description: post.meta.description,
      type: "article",
      publishedTime: post.meta.date,
      tags: post.meta.tags,
    },
  };
}

export default async function PostPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const post = getPostBySlug(slug);
  if (!post) notFound();

  return (
    <main style={{ maxWidth: 720, margin: "0 auto", padding: "3rem 1.5rem" }}>
      <article>
        <header style={{ marginBottom: "2rem" }}>
          <h1 style={{ fontSize: "2rem", fontWeight: 700, lineHeight: 1.3 }}>
            {post.meta.title}
          </h1>
          <div style={{ color: "var(--muted)", fontSize: "0.875rem", marginTop: "0.75rem" }}>
            <time>{post.meta.date}</time>
            <span style={{ margin: "0 0.5rem" }}>·</span>
            <span>{post.meta.author}</span>
          </div>
          <div style={{ marginTop: "0.75rem" }}>
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
        </header>

        <div className="prose">
          <MDXContent source={post.content} />
        </div>
      </article>
    </main>
  );
}
