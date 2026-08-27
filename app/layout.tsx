import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: "Hermes Blog | AI 技术博客",
    template: "%s | Hermes Blog",
  },
  description: "面向 AI/ML 从业者的个人技术博客，由 Hermes Agent 驱动。",
  authors: [{ name: "EdgarLiu2" }],
  openGraph: {
    type: "website",
    locale: "zh_CN",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="zh-CN">
      <body>{children}</body>
    </html>
  );
}
