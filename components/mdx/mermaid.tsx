"use client";

import { useEffect, useRef, useState } from "react";
import mermaid from "mermaid";

let initialized = false;

/**
 * Mermaid 流程图组件（客户端渲染）。
 * 用法：<Mermaid>{`graph TD; A-->B`}</Mermaid>
 * 静态导出时在浏览器端初始化渲染，SSR 阶段显示占位。
 */
export function Mermaid({ children }: { children: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!initialized) {
      mermaid.initialize({ startOnLoad: false, theme: "neutral" });
      initialized = true;
    }
    const el = ref.current;
    if (!el) return;
    const id = `mermaid-${Math.random().toString(36).slice(2, 9)}`;
    let cancelled = false;
    mermaid
      .render(id, String(children))
      .then(({ svg }) => {
        if (!cancelled) el.innerHTML = svg;
      })
      .catch((e) => {
        if (!cancelled) setError(String(e));
      });
    return () => {
      cancelled = true;
    };
  }, [children]);

  if (error) {
    return (
      <pre style={{ background: "#1e1e1e", color: "#f87171", padding: "1rem", borderRadius: "0.5rem" }}>
        Mermaid 渲染失败：{error}
      </pre>
    );
  }

  return <div ref={ref} style={{ margin: "1rem 0", overflowX: "auto" }} />;
}
