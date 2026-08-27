import { getAllPosts } from "@/lib/posts";
import { getSiteConfig } from "@/lib/site";

export const dynamic = "force-static";

export function GET() {
  const { url: base, title, description } = getSiteConfig();
  const posts = getAllPosts();
  const items = posts
    .map((p) => {
      const url = `${base}/posts/${p.slug}`;
      const date = new Date(p.meta.date).toUTCString();
      const desc = (p.meta.description || "")
        .replace(/[#*`>]/g, "")
        .replace(/\s+/g, " ");
      return `
    <item>
      <title>${escapeXml(p.meta.title)}</title>
      <link>${url}</link>
      <guid>${url}</guid>
      <pubDate>${date}</pubDate>
      <description>${escapeXml(desc)}</description>
    </item>`;
    })
    .join("");

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>${title}</title>
    <link>${base}/</link>
    <description>${description}</description>
    <atom:link href="${base}/feed.xml" rel="self" type="application/rss+xml"/>
    ${items}
  </channel>
</rss>`;

  return new Response(xml, {
    headers: { "Content-Type": "application/xml; charset=utf-8" },
  });
}

function escapeXml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}
