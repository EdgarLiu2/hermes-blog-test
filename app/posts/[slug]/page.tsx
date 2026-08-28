import type { Metadata } from "next";
import Link from "next/link";
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
    <main className="mx-auto max-w-3xl px-6 py-16">
      {/* 返回博客首页链接 */}
      <nav className="mb-10">
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-accent"
        >
          <span aria-hidden="true">←</span>
          返回博客首页
        </Link>
      </nav>

      <article>
        <header className="mb-10">
          <h1 className="text-3xl font-bold leading-tight tracking-tight">
            {post.meta.title}
          </h1>
          <div className="mt-4 flex items-center gap-2 text-sm text-muted-foreground">
            <time>{post.meta.date}</time>
            <span aria-hidden="true">·</span>
            <span>{post.meta.author}</span>
          </div>
          <div className="mt-5 flex flex-wrap gap-2">
            {post.meta.tags.map((tag) => (
              <span
                key={tag}
                className="rounded-full bg-accent/10 px-2.5 py-0.5 text-xs font-medium text-accent"
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
