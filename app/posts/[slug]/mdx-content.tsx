import { compileMDX } from "next-mdx-remote/rsc";
import remarkGfm from "remark-gfm";
import rehypeSlug from "rehype-slug";
import rehypeAutolinkHeadings from "rehype-autolink-headings";
import rehypePrettyCode from "rehype-pretty-code";
import { mdxComponents } from "@/components/mdx/mdx-components";

/**
 * 在构建时把 MDX 字符串编译为 React 组件。
 * - remarkGfm：GFM（表格、删除线等）
 * - rehypeSlug + autolink：标题锚点
 * - rehypePrettyCode：shiki 代码高亮
 * - mdxComponents：自定义组件（Callout / Mermaid）
 */
export async function MDXContent({ source }: { source: string }) {
  const { content } = await compileMDX({
    source,
    components: mdxComponents,
    options: {
      mdxOptions: {
        remarkPlugins: [remarkGfm],
        rehypePlugins: [
          rehypeSlug,
          [rehypeAutolinkHeadings, { behavior: "wrap" }],
          [rehypePrettyCode, { theme: "github-dark", keepBackground: false }],
        ],
      },
    },
  });
  return <>{content}</>;
}
