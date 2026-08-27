import type { ReactNode } from "react";

type CalloutType = "note" | "tip" | "warning" | "danger";

const styles: Record<CalloutType, { border: string; bg: string; label: string }> = {
  note: { border: "#2563eb", bg: "rgba(37,99,235,0.08)", label: "📝 备注" },
  tip: { border: "#059669", bg: "rgba(5,150,105,0.08)", label: "💡 提示" },
  warning: { border: "#d97706", bg: "rgba(217,119,6,0.08)", label: "⚠️ 注意" },
  danger: { border: "#dc2626", bg: "rgba(220,38,38,0.08)", label: "🚫 危险" },
};

/**
 * 提示框组件，用于强调重要信息。
 * 用法：<Callout type="note|tip|warning|danger">内容</Callout>
 */
export function Callout({
  type = "note",
  children,
}: {
  type?: CalloutType;
  children: ReactNode;
}) {
  const s = styles[type];
  return (
    <div
      style={{
        borderLeft: `4px solid ${s.border}`,
        background: s.bg,
        padding: "0.75rem 1rem",
        borderRadius: "0.375rem",
        margin: "1rem 0",
      }}
    >
      <div style={{ fontWeight: 600, marginBottom: "0.25rem" }}>{s.label}</div>
      <div style={{ fontSize: "0.95rem" }}>{children}</div>
    </div>
  );
}
