import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Vercel 标准部署，无需静态导出与子路径 basePath
  // 启用 Next.js 内置图片优化（<Image> 自动响应式/WebP/懒加载）
  // 本地图片（public/ 或 import）默认即优化；若未来引用远程图床，
  // 在此 images.remotePatterns 按域名逐一添加，勿用宽泛通配。
  images: {
    unoptimized: false,
  },
};

export default nextConfig;
