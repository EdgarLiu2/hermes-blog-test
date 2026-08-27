import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Vercel 标准部署，无需静态导出与子路径 basePath
  images: { unoptimized: true },
};

export default nextConfig;
