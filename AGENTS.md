# 项目上下文

## 项目定位
个人技术博客，作者是AI技术讲师，读者主要是AI/ML从业者和学习者。

## 技术栈
- Next.js App Router + TypeScript
- Tailwind CSS (样式)
- MDX (博客内容格式)
- Vercel 部署
- 所有组件使用最新的稳定版本，不要使用dev/alpha/pre-release版本

## 目录约定
- app/        Next.js AppRouter 页面
- components/ React组件
- content/    MDX博客文章，按YYYY-MM-DD-slug.mdx命名
- lib/        工具函数

## 代码规范
- 组件用函数式，不用class
- 异步操作用 async/await
- 类型定义放在文件顶部
- 禁止提交 .env .local
- 所有代码注释都使用中文

## 开发规范
- 每次有新需求时，都要自动创建一下新分支，所有开发都基于新的分支进行
- 需求开发完成后，自动补充单元测试代码，预期所有单元测试都可以跑通，且保证代码覆盖率在80%以上
- 需求开发完成后，确保项目可以通过所有lint检查，并能够成功编译打包
- 最后以DEV模式运行项目，并自动打开首页
- 待用户完成需求验收后，确定需求可以上线后，再将需求分支合入main分支

<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->
