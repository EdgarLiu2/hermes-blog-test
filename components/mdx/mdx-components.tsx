import type { MDXComponents } from "mdx/types";
import Image from "next/image";
import type { ImgHTMLAttributes } from "react";
import { Callout } from "./callout";
import { Mermaid } from "./mermaid";

/** 将 MDX 的 <img> 映射为 next/image 的 <Image>，享受自动优化（WebP/懒加载/响应式）。
 *  使用 fill 模式 + 外层容器等比缩放，无需手动指定 width/height。 */
function MDXImage({ src, alt = "" }: ImgHTMLAttributes<HTMLImageElement>) {
  if (!src || typeof src !== "string") return null;
  return (
    <span
      className="my-4 block"
      style={{ position: "relative", width: "100%", height: 320 }}
    >
      <Image
        src={src}
        alt={alt}
        fill
        className="rounded-lg object-contain"
        sizes="(max-width: 768px) 100vw, 672px"
        style={{ objectFit: "contain" }}
      />
    </span>
  );
}

/**
 * MDX 自定义组件映射。
 * 通过 compileMDX 的 components prop 注入，让 MDX 内容里能使用这些组件。
 */
export const mdxComponents: MDXComponents = {
  Callout,
  Mermaid,
  img: MDXImage,
  // 表格加强样式（tailwind 已处理基础）
  table: (props) => (
    <div style={{ overflowX: "auto" }}>
      <table {...props} />
    </div>
  ),
};
