---
title: "Hermes Agent Kanban Swarm 功能解析：以一块 SQLite 看板驱动的多智能体编排"
date: 2026-08-14
tags: [Hermes, Kanban, Multi-Agent, Swarm, NousResearch]
author: EdgarLiu2
---

# Hermes Agent Kanban Swarm 功能解析

## 核心发现（TL;DR）

Kanban Swarm v1 是 Hermes Agent 在 v0.15.0（"Velocity Release"，2026-05-28）引入的多智能体编排原语：它**不引入新的调度器**，而是把一棵"并行 worker → 门控 verifier → 门控 synthesizer"的任务图，以一条命令原子地写进既有的 SQLite Kanban 内核，并复用看板注释作为跨 worker 的"共享黑板"。整个 swarm 的持久性、可见性、重试与审计全部复用看板的既有机制。

## 一、背景：为什么需要 Swarm

Hermes Agent 早已具备 `delegate_task` 子代理（fork→join 的 RPC 式调用），但它有两个边界：子代理是匿名的、无持久记忆的进程内调用，且父进程退出即丢失。要支撑"多个具名 Agent 像真实团队一样协作"，需要的是**持久任务队列 + 状态机**，而不是一次函数调用。

这正是 Kanban 的定位：`~/.hermes/kanban.db` 里的每一行是一个任务，每一次 handoff 是一行任何人可读可写的记录，每一个 worker 是一个带独立身份、持久记忆的完整 OS 进程。而 **Swarm** 就是在这块看板上、由一次 `hermes kanban swarm` 命令生成的一整套编排图——它不是独立子系统，而是看板能力"长出来"的产物。

## 二、拓扑结构与数据模型

`kanban_swarm.py`（约 390 行）用 `create_swarm()` 一次性构造如下任务图：

```
planning root（立即 completed，兼作共享黑板）
    ├─ N 个并行 specialist worker（ready）
    └─ verifier（todo，等所有 worker 完成后才 promoted）
         └─ synthesizer（todo，等 verifier 通过后才 promoted）
```

对应的四个数据类 / 返回结构：

- `SwarmWorkerSpec`：单个 worker 卡片的规格（profile、title、body、skills、priority、max_runtime_seconds）。
- `SwarmCreated`：创建结果（root_id、worker_ids、verifier_id、synthesizer_id），带 `as_dict()` 供 CLI `--json` 输出。
- **Root**：以 `initial_status="blocked"` 创建，随后在同一个写事务里做一次 `blocked → done` 的 CAS 翻转（`UPDATE tasks SET status='done' WHERE id=? AND status='blocked'`），并写入拓扑 metadata。这样并行 worker 立即 `ready` 可被调度，root 同时保留为共享黑板与审计锚点。
- **Verifier 卡片**：`parents=worker_ids`（门控在全部 worker 完成），自动挂载 `requesting-code-review` 技能，body 要求"gate"：证据充分才以 `{"gate":"pass"}` 完成，否则 block 并列出缺失工作。
- **Synthesizer 卡片**：`parents=[verifier]`（门控在 verifier 通过），自动挂载 `humanizer` 技能。

依赖通过 `task_links`（parent→child）表达，dispatcher 在**所有父任务 done** 后才把 `todo → ready`。因此天然形成"workers 并行 → verifier 收口 → synthesizer 交付"的流水线，且不写一行额外调度逻辑。

## 三、共享黑板：刻意低科技

多智能体系统最容易踩的坑是"引入第二个协调服务"。Swarm 的黑板刻意保持低科技：

- 黑板就是**root 任务上的结构化 JSON 注释**，统一前缀 `[swarm:blackboard] `。
- `post_blackboard_update()` 把 `{"key", "value"}` 序列化后作为一条普通注释追加；`latest_blackboard()` 读取并**合并**所有该前缀注释，同名 key 以"后写覆盖先写"，并通过 `_authors` 记录胜出值的作者供追溯。
- `_swarm_context()` 会给每个 worker 的 body 追加一段 "## Swarm protocol"：声明 root/黑板 id、要求先读兄弟/父任务 handoff、把机器可读事实放进完成 metadata、把跨 worker 备注写成结构化注释。

结果：**所有状态都落在既有的 `task_comments` / `task_events` 行里**，因此 dashboard、notifier、`/kanban` 斜杠命令、dispatcher 无需新服务即可继续工作。这是"thin helpers"设计哲学的体现——模块 docstring 明确写道：本模块"intentionally does not introduce a second scheduler"。

## 四、原子性与事务细节

`create_swarm()` 最精巧的一点是**整体原子提交**：

1. 所有卡片在 `kb.write_txn(conn)` 这个外层写事务内创建。
2. Root 的激活不是调用 `kb.complete_task()`——那个助手会自己开事务并触发 post-commit 副作用（工作区清理、失败计数清零、`recompute_ready`），若在外层事务里执行会在回滚时出错。因此改用内联的 `_activate_root_inline()`：只做最小持久写（CAS 翻转 + 写 run 行 + 追加 completed 事件），把 `recompute_ready` 留给外层提交之后。
3. 提交成功后，在事务外调用 `recompute_ready()` 提升 root 的子任务，并触发 `kanban_task_completed` 生命周期钩子。

这意味着**调度器与 dashboard 读者要么看不到任何新 swarm，要么看到完整拓扑**，绝不会看到半链接的 root/worker/verifier 图。

此外支持**幂等**：若传入 `idempotency_key` 且 root 已存在，`_create_swarm_uncommitted` 会从 root 的最新黑板里恢复既有拓扑（worker_ids/verifier_id/synthesizer_id），而不是重复创建整张图。

## 五、CLI 用法

```bash
hermes kanban swarm "Design a multi-region failover plan" \
  --worker researcher:"调研" \
  --worker architect:"架构" \
  --worker sre:"运维" \
  --verifier reviewer \
  --synthesizer writer \
  --json
```

- `--worker` 可重复，格式为 `PROFILE:TITLE[:SKILL,SKILL]`，由 `parse_worker_arg()` 解析。
- `--verifier` / `--synthesizer` 必填（指派 profile）。
- 可选 `--tenant`、`--priority`、`--created-by`、`--idempotency-key`、`--json`。

创建后由 dispatcher 正常调度：workers 并行跑，verifier 等全部完成才醒来，synthesizer 等 verifier 判定干净后才醒来。

## 六、发布脉络与演进

- **v0.15.0（2026-05-28，Velocity Release）**：官方 release notes 描述 Kanban 成长为"real multi-agent platform——104 个 PR 端到端"，其中明确列出 `hermes kanban swarm` 一条命令创建完整 Swarm v1 图（root、并行 workers、门控 verifier、门控 synthesizer、共享黑板），并同期加入 triage 自动分解、per-task 模型覆盖、worktree 管理、计划启动时间、claim TTL、重试指纹、陈旧任务检测、respawn 守卫与 `/workers/active`、`/runs/{id}`、`/inspect` 等 worker 可见性端点。
- **v0.16.0（2026-06-05，Surface Release）**：头条是原生桌面 App 与浏览器管理后台；对 Swarm 本身无破坏性改动，但引入了 `environments:` 相关性门（把 `kanban`/`docker`/`s6` 等技能从无关用户的索引里剔除，按需才加载），并在技能精简中保留了核心编排能力。

GitHub issue #35600 则提出了下一步演进方向：`/swarm` 斜杠命令（Tier 2 是现有 CLI 手动控制，Tier 3 是 `kanban decompose` + 自动派发的全自动路径），让"在会话内用自然语言触发 swarm"成为可能。issue 里对 Swarm v1 的评价是：**"Hermes 最强大的多智能体编排原语"**，但 UX 门槛较高。

## 七、一次 Swarm 的完整生命周期（结合本次写作实例）

为了直观展示 Swarm 如何工作，下面以本篇文章的实际编排为例（本文正是由 Swarm v1 产出的）：

1. **创建**：`hermes kanban swarm <goal> --worker researcher:"调研并写作" --verifier reviewer --synthesizer publisher`。`create_swarm()` 在一个写事务里建好 root、1 个 worker、verifier、synthesizer 四张卡，root 被 CAS 置为 `done`，worker 立即 `ready`。
2. **黑板上板**：`post_blackboard_update()` 在 root 上追加 `{"key":"topology","value":{...}}` 注释，记录 root/worker/verifier/synthesizer 的 id 与 goal——任何后续 worker 读 root 注释即可恢复全局视图。
3. **worker 派发**：dispatcher 检测到 worker `ready`，以 researcher profile 拉起一个完整 OS 进程，注入 `kanban_*` 工具集与 `HERMES_KANBAN_BOARD`。worker 先读 root 黑板与父任务 handoff，再调研源码/文档，最后把成品写入共享工作区 `hermes-kanban-swarm.md`，并以 `kanban_complete` 交付（summary + 机器可读 metadata）。
4. **门控释放**：worker 完成后，verifier 因 `parents` 全部 done 而从 `todo` 提升为 `ready`，被 reviewer profile 派发。它逐条核对技术事实（如"不引入第二调度器"、"黑板是 JSON 注释"、"原子提交"等是否与源码一致），证据充分才以 `{"gate":"pass"}` 完成；否则 `kanban_block` 列出缺失工作，worker 会被重新派发修正。
5. **合成交付**：verifier 通过后，synthesizer（publisher）才被释放，把已验证的 worker 输出加工为最终文章交付给读者。

这套流程正是拓扑即门控的体现：**不需要任何外部编排脚本**，光靠 `task_links` 的 parent 依赖与 dispatcher 的状态提升，就完成了"并行研究 → 复核 → 合成"的三阶段流水线。

## 八、Swarm 协议与 worker 生命周期

每个被派发的 worker 会通过 `_swarm_context()` 在 body 末尾自动获得一段标准的"## Swarm protocol"：

1. 声明 `Swarm root / shared blackboard` 的任务 id（例如 `t_a1491a6c`）。
2. 要求先读兄弟/父任务 handoff 再动手（`Read sibling/parent handoffs from Kanban context before working`）。
3. 把机器可读事实放进 completion metadata。
4. 把跨 worker 备注以结构化注释写到 root 任务上。

运行时层面，worker 由 dispatcher 以完整 OS 进程拉起，带 `HERMES_KANBAN_BOARD` 环境变量锁定所属看板；它在看板里通过 `kanban_*` 工具集（`kanban_show`、`kanban_complete`、`kanban_block`、`kanban_heartbeat`、`kanban_comment` 等）读写任务。心跳机制保证长任务不被误回收：长时间运行的 worker 需周期调用 `kanban_heartbeat`，否则 dispatcher 在超时后会把任务重新入队。worker 完成后，其 `summary` 与 `metadata` 成为下游 verifier 的输入——这正是"机器可读事实进 metadata"这一约定的用意。

## 九、与 `delegate_task` 的对比

| 维度 | `delegate_task` | Kanban Swarm |
|---|---|---|
| 形态 | RPC 调用（fork→join） | 持久队列 + 状态机 |
| 父进程 | 阻塞等子返回 | create 后即返回、fire-and-forget |
| 子身份 | 匿名子代理 | 具名 profile，带持久记忆 |
| 可恢复性 | 失败即失败 | block→unblock 重跑、崩溃→reclaim |
| 人工介入 | 不支持 | 任意时刻 comment/unblock |
| 审计 | 上下文压缩即丢失 | SQLite 持久行，永久可查 |
| 协调 | 层级（调用→被调） | 对等，任何 profile 可读写任何任务 |

**一句话区分**：`delegate_task` 是一次函数调用；Kanban（及其 Swarm）是一个工作队列，每一次 handoff 都是任何 profile（或人类）可见、可编辑的一行。二者可共存——一个 kanban worker 在运行中内部也可能调用 `delegate_task`。

## 十、设计启示

1. **复用优于新建**：Swarm 没有造第二套调度、存储或 UI，全部建立在看板的链接、注释、事件之上，换来的是零新增运维面。
2. **门控即拓扑**：verifier/synthesizer 的先后关系直接用 parent 依赖表达，省去了手写编排状态机。
3. **原子提交**：一整棵图要么全出、要么全不出，避免了半初始化的编排状态。
4. **可追溯**：黑板注释带作者、事件全落库，天然支持审计与人工介入（任意时刻 comment/unblock）。
5. **边界清醒**：看板只负责"下一个该捡什么、有没有人在做"这一件事——它不会把拆分糟糕的目标变好，共享隐状态的子任务仍会互相打架。
6. **演进克制**：v1 刻意保持"薄"——不做 `/swarm` 斜杠命令，不做自动分解路由，这些留给 v0.16 之后的演进（如 issue #35600 的 Tier 3 提案）。先让原语稳，再谈便利。

## 信息来源

- 本地源码：`~/.hermes/hermes-agent/hermes_cli/kanban_swarm.py`（Swarm v1 全部实现，390 行）
- 官方文档：https://hermes-agent.nousresearch.com/docs/user-guide/features/kanban （Kanban Swarm 拓扑助手章节）
- 官方文档：https://hermes-agent.nousresearch.com/docs/user-guide/features/kanban-tutorial （四则用户故事）
- v0.15.0 Release Notes：https://github.com/NousResearch/hermes-agent/releases/tag/v2026.5.28 （"Velocity Release"，Swarm v1 随 104 PR 落地）
- v0.16.0 Release Notes：https://github.com/NousResearch/hermes-agent/releases/tag/v2026.6.5 （"Surface Release"，environments 相关性门）
- GitHub Issue #35600：https://github.com/NousResearch/hermes-agent/issues/35600 （`/swarm` 斜杠命令演进提案）
- 本地文档：`~/.hermes/hermes-agent/website/docs/user-guide/features/kanban.md`
