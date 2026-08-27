/**
 * 站点配置。
 * 通过 getSiteConfig() 在调用时读取环境变量，便于测试与部署时按需注入。
 */
export interface SiteConfig {
  title: string;
  description: string;
  url: string;
}

export function getSiteConfig(): SiteConfig {
  return {
    title: "Hermes Blog",
    description: "面向 AI/ML 从业者的技术博客",
    url: process.env.NEXT_PUBLIC_SITE_URL ?? "",
  };
}
