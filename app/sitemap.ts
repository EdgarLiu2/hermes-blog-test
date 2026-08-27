import type { MetadataRoute } from "next";
import { getAllPosts } from "@/lib/posts";
import { getSiteConfig } from "@/lib/site";

export const dynamic = "force-static";

export default function sitemap(): MetadataRoute.Sitemap {
  const base = getSiteConfig().url;
  const posts = getAllPosts().map((p) => ({
    url: `${base}/posts/${p.slug}`,
    lastModified: new Date(p.meta.date),
  }));

  return [
    { url: `${base}/`, lastModified: new Date() },
    ...posts,
  ];
}
