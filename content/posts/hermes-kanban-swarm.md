---
title: "Hermes Agent Kanban Swarm 功能解析——一个不引入第二个调度器的多智能体编排方案"
date: 2026-08-14
tags: ["hermes-agent", "kanban", "multi-agent", "orchestration", "ai"]
author: "EdgarLiu2"
---

# Hermes Agent Kanban Swarm 功能解析——一个不引入第二个调度器的多智能体编排方案

> 面向 AI 开发者 / 多智能体系统工程师

## 一、先厘清版本：Swarm 到底属于哪个版本

Kanban 多智能体看板是 Hermes 在 v0.12.0 引入的基础能力；Kanban Swarm v1 则于 v0.15.0（2026-05-28）正式落地。随后 v0.16.0（2026-06-05，代号 "The Surface Release"）的增量集中在原生桌面 App 与浏览器管理面板——包括看板页的图形化编排界面（lanes by profile、Auto/Manual 编排、一键 Decompose、Profile Builder）——而非 Swarm 本身。所以严格讲，"v0.16 的 Kanban Swarm"应表述为"v0.15 引入、v0.16 图形化增强的 Swarm"。

## 二、要解决的问题：多智能体协调的基准缺失

主流基准（SWE-bench、GAIA、AgentBench）衡量的都是单个 agent 在隔离环境中的能力。一旦把两个 agent 放进同一间屋子做交接，指标就崩了；放十个带依赖关系的 agent，就演变成事故。

业界主流应对是"向上加层"：

- **LangGraph**：为工作流显式定义节点与边的状态机
- **CrewAI**：带 manager 的角色制团队
- **AutoGen**：基于对话协议的协商
- **xAI Grok 4.20**：把协调逻辑直接编译进模型权重（无法复刻）

这些方案共同的前提假设是：agent 协调需要一层全新基础设施——一个悬在所有 agent 之上、管理它们的新调度器。

Hermes Kanban Swarm 走了相反的路：它不再新增一层，而是把任务图写进已经存在的看板内核里。

## 三、核心抽象：Kanban 本身就是协调基座

Hermes Kanban 是一块跨所有 profile 共享的持久化任务板，后端是 SQLite（`~/.hermes/kanban.db`）。

- **任务（Task）** = 一行：标题、body、assignee（一个 profile 名）、状态（triage|todo|ready|running|blocked|review|done|archived）
- **链接（Link）** = 一行父→子依赖；父任务全部 done 后，子任务自动从 todo 提升为 ready
- **注释（Comment）** = agent 间协议：下一个接手任务的 agent 会读到完整线程
- **工作区（Workspace）** = 每个 worker 独立的隔离目录，scratch 型在任务完成即销毁
- **调度器（Dispatcher）** = 网关内置的长期循环（默认 60s 一次 tick），负责认领任务、拉起对应 profile 的完整 Hermes 进程

关键点：worker 不是内存里的子线程，而是独立的完整 OS 进程，有自己独立的身份、工具集、skills 与记忆。

## 四、Swarm v1：279 行 Python，不引入第二个调度器

Swarm 模块的 docstring 写得很直白：

> "This module intentionally does not introduce a second scheduler. It writes a small task graph into the existing Kanban kernel."

这句话信息量很大。"intentionally"意味着他们考虑过替代方案并否决了；"existing Kanban kernel"意味着他们审视了生产环境里已经在跑的东西，问它能否吸收新能力而无需新服务。

### 4.1 拓扑结构

Swarm 一次命令生成完整任务图：

```
                Swarm Root(共享黑板)
                       │
      ┌─────────┬──────┴───────┬─────────┐
   Worker 1   Worker 2    Worker 3   ...
      (并行)    (并行)      (并行)
        └────────┴──────┬──────┘
                    Verifier
                   (门控:等全部)
                        │
                   Synthesizer
                   (写最终输出)
```

- 每个 worker 跑在指定 profile 下：researcher 带 web 研究工具，coder 带终端与文件访问，各自在独立 scratch 工作区
- Verifier 审查每个 worker 的输出并握持门（gate）；必须携带 metadata `{"gate": "pass"}` 完成，才允许 Synthesizer 继续；证据不足则 block 并精确列出缺什么
- Synthesizer 在所有 worker 通过门控后汇总成最终交付物

### 4.2 Blackboard：一个 JSON.stringify 的黑板协议

Worker 间通信的共享黑板是刻意低技术的：在 root 卡上写带前缀标记的结构化 JSON 注释。

- `post_blackboard_update`：把一个 JSON 块写进注释
- `latest_blackboard`：读回全部注释并按 key 合并，后者覆盖前者，并维护 `_authors` 映射记录谁写了什么

所有状态都活在现有 dashboard、notifier、CLI、dispatcher 已能读写的行里——没有新存储，没有新协议。

### 4.3 CLI 用法

```bash
hermes kanban swarm "设计一个多区域故障转移方案" \
  --worker researcher:调研可用性:SRE \
  --worker architect:设计架构 \
  --verifier reviewer \
  --synthesizer writer
```

返回四个任务 ID（root / workers / verifier / synthesizer），然后走人。生成的图原子提交：dispatcher 与 dashboard 要么看到完整的 swarm，要么完全看不到，绝不会看到半连接的 root/worker/verifier 图。

现有调度器会在下一个 tick（最迟 60 秒）把 worker 任务认领，按对应 profile 拉起完整进程。Verifier 与 Synthesizer 保持在 todo，直到所有 worker 都 done 才被提升。

## 五、Swarm 与 delegate_task 的本质区别

| 维度 | delegate_task | Kanban Swarm |
|------|---------------|--------------|
| 形态 | RPC 调用（fork → join） | 持久化消息队列 + 状态机 |
| 父 agent | 阻塞等子返回 | create 后即失联 |
| 子身份 | 匿名子 agent | 带持久记忆的命名 profile |
| 可恢复性 | 失败即失败 | block → unblock 可重跑；崩溃可回收 |
| 人机协作 | 不支持 | 任意时刻可评论 / unblock |
| 审计轨迹 | 上下文压缩即丢失 | SQLite 里永久可查 |
| 协调模式 | 层级（调用方→被调方） | 对等（任意 profile 可读写任意任务） |

一句话：delegate_task 是函数调用，Kanban 是工作队列，每次交接都是一行任何 profile（或人）都能看见和编辑的记录。

## 六、Swarm 规避的三个失败模式

1. **渐进式精度崩塌（progressive accuracy collapse）**。OpenAI Swarm 因无状态而精度从 84% 塌到 0%。Kanban Swarm 天然有状态：每次交接是 SQLite 行，每次状态迁移是行更新。Verifier 门控保证 gatekeeper 不显式放行前，什么都不往下走——不存在 agent 默默确认子任务然后消失的路径，因为状态机强制只有过门才算完成。

2. **重启即失联**。LangGraph 状态机崩溃丢内存态；CrewAI 委托超时让父 agent 空等。Kanban Swarm 全部写入持久化 SQLite：dispatcher 重启、机器重启、worker 被杀重拉，状态都还在，任务还在板上，worker 从断点续跑。

3. **人工审查不是一等公民**。Verifier 门不只是给自动化 agent 用的——人可以 unblock 一个被卡住的 verifier 任务、往黑板加注释、把任务从 todo 提升到 ready。看板对人和模型是同一块板。关键洞见：Kanban 在 AI agent 出现前几十年就是为人类任务管理设计的，这个抽象本来就人机兼容。

## 七、更深一层的架构哲学

一次 `kanban swarm` 命令 = root 卡 + N 并行 worker 卡 + 一个 gated verifier 卡 + 一个 synthesizer 卡，黑板是存成 JSON 注释的结构化数据。

> 一块看板就是一台状态机：行是工作项，列是状态迁移，依赖是行间的边。这些性质不是为 AI agent 设计的——它们是为 1970 年代的制造业供应链设计的。它们能通用，是因为协调问题本身是通用的。

多智能体行业在"向上建"：加层、加运行时、加抽象。Hermes Kanban Swarm 走了侧路：看板已经是一个协调基座，只需要把正确的拓扑写进去。

## 八、已知边界与演进方向

- **无 /swarm 斜杠命令**：目前调用 swarm 仍是显式 CLI 操作。社区提案（issue #35600）想把 /swarm 变成会话内三层的入口（Tier 1 全自动 / Tier 2 CLI 手动 / Tier 3 完全自治），但该 PR 尚未合入主线。
- **自动分解是另一套机制**：triage 的 auto-decompose 产生的是扁平依赖树，不是带 verifier + synthesizer 的门控流水线——两者互补，不重合。
- **自定义 verifier/synthesizer**：issue #34273 提议让 verifier/synthesizer 携带自定义 body 与 skills（例如 verifier 用 requesting-code-review skill），支持更细粒度的门控质量。

## 九、结论

Hermes Kanban Swarm 的核心论断是：agent 协作不需要新的协调协议，需要的是一套带门控、持久化、人机可见的任务管理系统——这种东西几十年前就有了，只是我们一直在重复造新基础设施，而不是承认已有的基础设施够用。

279 行 Python，没有第二个调度器，一个 JSON.stringify 的黑板。它能工作，是因为最难的问题早就被解决了，我们只是忘了去看。

## 主要来源

- Hermes Agent 官方文档 — Kanban 参考页：hermes-agent.nousresearch.com/docs/user-guide/features/kanban
- Kanban 教程：hermes-agent.nousresearch.com/docs/user-guide/features/kanban-tutorial
- GitHub Releases — v0.15.0 / v0.16.0 发布说明
- magnus919.com —《The Smartest Agent Orchestration Framework Doesn't Have a Scheduler》(2026-05-30)
- GitHub issue #35600（/swarm 命令提案）、#34273（自定义 verifier/synthesizer）
