import { describe, it, expect, vi, afterEach } from "vitest";
import { getSiteConfig } from "@/lib/site";

describe("lib/site - 站点配置", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("未配置 NEXT_PUBLIC_SITE_URL 时 url 为空字符串", () => {
    vi.stubEnv("NEXT_PUBLIC_SITE_URL", "");
    const cfg = getSiteConfig();
    expect(cfg.url).toBe("");
    expect(cfg.title).toBe("Hermes Blog");
    expect(cfg.description).toBeTruthy();
  });

  it("配置 NEXT_PUBLIC_SITE_URL 后 url 使用该值", () => {
    vi.stubEnv("NEXT_PUBLIC_SITE_URL", "https://example.com");
    const cfg = getSiteConfig();
    expect(cfg.url).toBe("https://example.com");
  });
});
