import type { MDXComponents } from "mdx/types";
import { Callout } from "./callout";
import { Mermaid } from "./mermaid";

/**
 * MDX 自定义组件映射。
 * 通过 compileMDX 的 components prop 注入，让 MDX 内容里能使用这些组件。
 */
export const mdxComponents: MDXComponents = {
  Callout,
  Mermaid,
  // 表格加强样式（tailwind 已处理基础）
  table: (props) => (
    <div style={{ overflowX: "auto" }}>
      <table {...props} />
    </div>
  ),
};
