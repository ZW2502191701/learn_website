# Java 后端进阶学习平台

基于 `D:\AI_Test\learn` 中 11 份 Java 后端 PDF 学习资料构建的 React/Vite 学习平台原型。它不是普通文档站，而是围绕长期学习、面试训练、错题复盘、知识图谱和技术场景表达设计的工程师工具型产品。

## 已实现页面

- Dashboard：整体学习进度、今日推荐、薄弱模块、面试倒计时、高频知识点、最近学习、正确率、学习热力图。
- 学习路径：Java 基础、集合源码、JVM、并发、数据库、缓存、框架、微服务、消息队列、设计模式、系统设计、面试冲刺。
- 知识模块：每个 PDF 一个模块，支持章节展开、标签筛选、收藏、掌握状态、个人笔记。
- 知识图谱：HashMap -> ConcurrentHashMap -> CAS -> volatile -> JMM -> JVM 内存模型等依赖关系，可点击查看解释和关联题。
- 面试训练：基础题、源码题、场景题、八股题、项目题、系统设计题，支持大厂一面/二面/HR 面模式、追问链路、错题标记。
- 场景实战：秒杀、Redis 缓存问题、MySQL 慢查询、分布式事务、MQ 可靠性、JVM OOM 等场景。
- 复习计划：7/14/30/60 天计划、今日任务、每日打卡、智能推荐下一步学习。
- 错题与收藏：错题复盘、重新练习、笔记、收藏知识点/题目/场景。
- 全文搜索：客户端搜索知识点、面试题、场景题，并按模块分组。

## 技术栈

- React + TypeScript
- Vite
- lucide-react
- 本地 mock 数据
- localStorage 持久化学习状态

## 运行

```bash
npm install
npm run dev
```

默认访问：

```text
http://127.0.0.1:5173/
```

构建验证：

```bash
npm run build
```

视觉/交互冒烟验证需要先保持开发服务器运行，然后在另一个终端执行：

```bash
npm run smoke:visual
```

该脚本默认访问 `http://127.0.0.1:5173/`，截图会写入系统临时目录；如需指定地址或输出目录，可设置 `JAVAPATH_SMOKE_URL`、`JAVAPATH_SMOKE_OUT`。

数据完整性校验：

```bash
npm run validate:data
```

## 数据来源与扩展

### 内容管线概览

```text
web/data/*.js  ──npm run convert:data──>  src/data/legacyChapters.ts
                                              │
                                              ▼
                                         src/data/appData.ts  (运行时归一化)
                                              │
                                              ▼
                                    Module / Chapter / KnowledgePoint /
                                    InterviewQuestion / Scenario / StudyPlan
```

### Canonical Source

- **curated 数据源**：`src/data/legacyChapters.ts`（由 `web/data/*.js` 生成，提交到仓库）
- **运行时归一化**：`src/data/appData.ts`（从 legacyChapters 生成模块、章节、知识点、面试题、场景和学习计划）
- **legacy 原始数据**：`web/data/*.js`（旧版静态站数据，修改后需重新运行转换命令）
- **PDF draft 来源**：`scripts/parse_pdfs.py`（离线解析 PDF，输出 draft 供人工审核）

### 数据转换

```bash
npm run convert:data
```

读取 `web/data/*.js` 并生成 `src/data/legacyChapters.ts`。当 `web/data/*.js` 有内容调整时，应重新运行转换命令并一并提交生成结果。脚本会输出转换报告，包含章节统计和错误信息。

### 数据校验

```bash
npm run validate:data
```

校验内容完整性，包括：

- ID 唯一性（module / chapter / knowledge / question / scenario / plan）
- 引用完整性（所有跨实体引用指向存在的 ID）
- 内容质量（重复标题、空正文、无关联题目的知识点/场景、孤立节点）

### PDF 解析（离线 draft）

```bash
python scripts/parse_pdfs.py --src "D:\AI_Test\learn" --out "D:\AI_Test\javapath\output"
```

产出：

- `knowledge.json` / `summary.json` — 程序消费的标准 JSON
- `knowledge.js` — 浏览器可直接引入的 `window.KNOWLEDGE_DATA` shim
- 逐 PDF Markdown — 便于人工校对
- `assets/` — 提取的图片

**重要**：PDF 解析结果应作为 draft/校对输入，不应无审查覆盖 curated 数据。接入时需保留 `sourcePdf`、`confidence`、`needsReview` 等来源字段。

### 运行时归一化

`src/data/appData.ts` 从 `legacyChapters` 生成：

- `Module` / `Chapter` / `KnowledgePoint` / `InterviewQuestion` / `Scenario` / `StudyPlan`

并导出 `CONTENT_VERSION` 和 `CONTENT_STATS` 用于数据管线追踪。

若要后端化，建议让 Spring Boot 暴露这些模型对应的 API，并将学习进度、错题、收藏、计划存入 MySQL/Redis。
