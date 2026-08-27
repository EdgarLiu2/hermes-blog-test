export interface PostMeta {
  title: string;
  date: string;
  tags: string[];
  author: string;
  description?: string;
}

export interface Post {
  slug: string;
  meta: PostMeta;
  /** 正文（不含 frontmatter），MDX 格式 */
  content: string;
}
