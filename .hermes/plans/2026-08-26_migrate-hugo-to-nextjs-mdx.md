# 博客重构：Hugo → Next.js + MDX 实施计划

> **For Hermes:** Use subagent-driven-development skill to implement this plan task-by-task.

**Goal:** 把博客从 Hugo 静态站重构为 Next.js App Router + TypeScript + Tailwind + MDX，保留现有 GitHub Pages URL。

**Architecture:** Next.js `output: 'export'` 静态导出模式。内容源为 MDX（含 frontmatter），通过 Node 文件系统在构建时读取生成静态页面。保留现有 5 篇文章，映射到新目录结构。

**Tech Stack:** Next.js (latest stable) + TypeScript + Tailwind CSS + MDX (@next/mdx) + GitHub Pages (静态托管)

---

## 关键决策（已与用户确认）

1. **范围**：全新搭建 Next.js 博客，迁移现有 5 篇文章内容
2. **URL**：保留 `edgarliu2.github.io/hermes-blog-test/`，继续托管在 GitHub Pages
3. **仓库**：直接在 `hermes-blog-test` 仓库重构（不新建）
4. **MDX**：进阶方案，含代码高亮、标题锚点、Callout、流程图、表格等自定义组件

> **⚠ 部署矛盾说明**：AGENTS.md 写 Vercel，但用户选择保留 GitHub Pages。解法用 `output: 'export'` 静态导出——产物纯静态文件，可托管 GitHub Pages（保留现 URL），也可随时切换 Vercel，不锁死。本计划按 GitHub Pages 落地，Vercel 作为可选项。

---

## 前置：当前仓库清理

Hugo 残留文件（`.gitmodules`、`archetypes/`、`themes/`、`hugo.toml`、`public/`、`resources/`、`.hugo_build.lock`）在迁移后不再需要。为保留 git 历史，**不要删 `.git`**。上述 Hugo 文件在迁移完成、新站可用后一并删除（见 Task 10）。`.github/workflows/hugo.yaml` 会被新的 Next.js 构建 workflow 替换。

---

## Task 1: 初始化 Next.js 项目（静态导出配置）

**Objective:** 搭建 Next.js App Router + TS + Tailwind 骨架，开启静态导出

**Files:**
- Create: `package.json`（手动创建，避免 create-next-app 交互式）
- Create: `tsconfig.json`
- Create: `next.config.ts`
- Create: `tailwind.config.ts`、`postcss.config.mjs`
- Create: `app/globals.css`、`app/layout.tsx`
- Create: `.gitignore`

**Step 1: 写 package.json**（用 pnpm）

```json
{
  "name": "hermes-blog-test",
  "version": "0.1.0",
  "private": true,
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "lint": "next lint"
  }
}
```

**Step 2: 安装依赖**（用 pnpm，仅 stable 版本）

```bash
pnpm add next react react-dom
pnpm add -D typescript @types/node @types/react @types/react-dom tailwindcss postcss autoprefixer
```

**Step 3: 配置静态导出** `next.config.ts`

```ts
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "export",
  images: { unoptimized: true },
};

export default nextConfig;
```

**Step 4: 写根布局 `app/layout.tsx`**（含 metadata、中文 lang）

**Step 5: 验证**：`pnpm build` 成功，生成 `out/` 目录

---

## Task 2: 配置 Tailwind + 基础样式

**Objective:** 接入 Tailwind CSS，配置中文字体与排版

**Files:**
- Create: `tailwind.config.ts`（content 指向 app/content）
- Create: `postcss.config.mjs`
- Modify: `app/globals.css`

**Step 1: 写 tailwind.config.ts**

```ts
import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}", "./lib/**/*.{ts,tsx}"],
  theme: { extend: {} },
  plugins: [],
};
export default config;
```

**Step 2: globals.css 加 Tailwind 指令 + 基础排版变量**

**Step 3: 验证**：`pnpm dev` 页面有基础样式

---

## Task 3: 建立 MDX 内容层

**Objective:** 配置 MDX 解析，建立内容读取管线

**Files:**
- Create: `content/`（新目录，按 `YYYY-MM-DD-slug.mdx`）
- Create: `lib/posts.ts`（读取 frontmatter + 正文）
- Create: `lib/types.ts`（Post 类型）

**Step 1: 定义类型 `lib/types.ts`**

```ts
export interface PostMeta {
  title: string;
  date: string;
  tags: string[];
  author: string;
  description?: string;
}
export interface Post {
  slug: string;
  meta: PostMeta;
  content: string;
}
```

**Step 2: 写 `lib/posts.ts`**（遍历 `content/*.mdx`，解析 frontmatter，按日期排序）

**Step 3: 验证**：`node -e` 或临时脚本能读取到 5 篇文章的 meta

---

## Task 4: 迁移 5 篇文章为 MDX

**Objective:** 把 `content/posts/*.md` 迁移为 `content/YYYY-MM-DD-slug.mdx`

**Files:**
- Create: `content/2026-08-11-hello-world.mdx`
- Create: `content/2026-08-11-second-post.mdx`
- Create: `content/2026-08-18-hermes-kanban-swarm.mdx`
- Create: `content/2026-08-18-hermes-new-features.mdx`
- Create: `content/2026-08-18-hermes-vs-deepseek-harness.mdx`

**Step 1: 读原文**，保留正文 Markdown 主体
**Step 2: 转换 frontmatter** 为 MDX 兼容格式（保留 title/date/tags/author，补 description）
**Step 3: 核对** 5 篇全部迁移、无内容丢失

> 注：现有文章 slug 无日期前缀（如 `hello-world`）。MDX 命名规范要求 `YYYY-MM-DD-slug.mdx`，所以新文件名带日期。原 GitHub Pages URL 为 `/posts/<slug>/`，见 Task 5 的路径兼容处理。

---

## Task 5: 首页 + 文章列表

**Objective:** 渲染文章列表页

**Files:**
- Create: `app/page.tsx`（文章列表）
- Create: `app/posts/[slug]/page.tsx`（文章详情）
- Modify: `app/layout.tsx`

**Step 1: 首页**遍历 `lib/posts` 显示标题/日期/tags
**Step 2: 详情页**用 `generateStaticParams` 静态生成每篇文章，渲染 MDX
**Step 3: 配置 `generateMetadata`**（SEO：title/description/canonical/OG）

> **URL 兼容**：旧 URL 是 `/posts/<slug>/`。为保留外部链接与已收录 SEO，详情页放在 `app/posts/[slug]/`，与 Hugo 路径一致。

---

## Task 6: 自定义 MDX 组件（进阶）

**Objective:** 实现代码高亮、标题锚点、Callout、流程图、表格

**Files:**
- Create: `components/mdx/`（mdx-components.tsx + 各子组件）

**Step 1: 代码高亮**：用 `shiki`（`@shikijs/rehype`）在构建时渲染，或 `rehype-pretty-code`
**Step 2: 标题锚点**：给 h2/h3 加 id + 复制链接按钮
**Step 3: Callout**：`<Callout type="note|tip|warning">` 组件
**Step 4: 流程图**：集成 `mermaid`（客户端渲染组件，SSR 时降级）
**Step 5: 表格**：用 `rehype` 或自定义 table 样式
**Step 6: 配置** `mdx-components.tsx` 注册上述组件到 MDX

**验证**：写一篇含全部组件的测试 MDX，`pnpm build` 渲染正常

---

## Task 7: 代码高亮 + SEO 完善

**Objective:** 确保代码块高亮、SEO 元数据完整

**Files:**
- Modify: `app/layout.tsx`、`app/posts/[slug]/page.tsx`
- Create: `app/sitemap.ts`、`app/robots.ts`

**Step 1: shiki 代码高亮**接入
**Step 2: sitemap.ts** 生成 sitemap.xml（SEO）
**Step 3: robots.ts** 生成 robots.txt
**Step 4: RSS feed**（`app/feed.xml/route.ts`）保留原 Hugo RSS 能力

**验证**：`pnpm build` 产物含 sitemap.xml、robots.txt

---

## Task 8: GitHub Actions 构建部署

**Objective:** 用 GitHub Actions 构建 Next.js 并部署到 GitHub Pages（保留原 URL）

**Files:**
- Delete: `.github/workflows/hugo.yaml`
- Create: `.github/workflows/deploy.yml`

**Step 1: 写 deploy.yml**：pnpm build → 产物 `out/` → actions/upload-pages-artifact → deploy-pages
**Step 2: 配置** Pages 部署源为 GitHub Actions
**Step 3: 验证**：推送后 Actions 成功、URL 访问正常

> 原 URL `edgarliu2.github.io/hermes-blog-test/` 对应 GitHub Pages **项目页**（子路径部署）。Next 静态导出需设置 `basePath` 或适配子路径。**必须在 `next.config.ts` 配置 `basePath: '/hermes-blog-test'`**（Task 1 补充）。

---

## Task 9: Vercel 兼容（可选）

**Objective:** 确保切到 Vercel 时只需改配置

**Files:**
- Create: `vercel.json`

**Step 1:** 写 `vercel.json`（buildCommand/outputDirectory）
**Step 2:** 文档说明切换步骤

> 静态导出站点在 Vercel 同样可部署。此任务仅作兼容文档，不切换。

---

## Task 10: 清理 Hugo 残留 + 文档

**Objective:** 删除 Hugo 文件，更新 AGENTS.md

**Files:**
- Delete: `.gitmodules`、`archetypes/`、`themes/`、`hugo.toml`、`public/`、`resources/`、`.hugo_build.lock`、旧 `content/posts/*.md`
- Modify: `AGENTS.md`、`README.md`

**Step 1:** 删除 Hugo 残留文件
**Step 2:** 更新 AGENTS.md（目录约定改为 app/components/content/lib，已基本符合）
**Step 3:** 验证：`pnpm build` 仍成功

> **删除文件需用户确认**。此任务执行前会先列出删除清单。

---

## 验证 / 验收

- [ ] `pnpm build` 成功，生成 `out/` 静态产物
- [ ] 5 篇文章全部渲染，无内容丢失
- [ ] 首页文章列表正确排序（按日期）
- [ ] 代码高亮、Callout、mermaid、表格组件工作正常
- [ ] sitemap.xml、robots.txt、RSS 生成
- [ ] GitHub Actions 部署成功，`edgarliu2.github.io/hermes-blog-test/` 可访问
- [ ] Hugo 残留文件清理完毕

---

## 风险 / 取舍

| 风险 | 应对 |
|---|---|
| `basePath` 子路径部署易出错 | Task 1 即配置，Task 8 用 Actions 验证 |
| MDX 组件（mermaid）SSR 兼容 | 客户端组件降级处理 |
| 旧 URL `/posts/<slug>/` 路径保持 | 详情页路径与 Hugo 一致 |
| 删除文件风险 | Task 10 先列清单、用户确认 |
| Vercel/GitHub 双部署冲突 | 静态导出两处兼容，Vercel 为可选 |
