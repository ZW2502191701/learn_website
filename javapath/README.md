<div align="center">

# JavaPath — Java 后端面试学习操作系统

**面向 Java 后端工程师的沉浸式学习、面试训练与知识管理平台**

![React](https://img.shields.io/badge/React-19-61DAFB?logo=react&logoColor=white)
![TypeScript](https://img.shields.io/badge/TypeScript-5.7-3178C6?logo=typescript&logoColor=white)
![Vite](https://img.shields.io/badge/Vite-6-646CFF?logo=vite&logoColor=white)
![Tailwind CSS](https://img.shields.io/badge/Tailwind-4-06B6D4?logo=tailwindcss&logoColor=white)

[功能特性](#功能特性) · [快速开始](#快速开始) · [项目架构](#项目架构) · [数据管线](#数据管线) · [后端化路线](#后端化路线)

</div>

---

## 项目简介

JavaPath 不是普通文档站，而是一个围绕 **11 份 Java 后端核心 PDF** 构建的工程师学习操作系统。核心能力：

- **PDF 知识萃取** — 自动解析 PDF 生成结构化知识点和面试题
- **多版本答案** — 每道题提供标准版、背诵版、深度版、口语版、项目结合版
- **模拟面试房间** — 7 种面试模式，完整面试流程+面试报告
- **间隔复习 (SM-2)** — Anki 级别的间隔重复算法
- **项目表达训练** — 6 大模块的项目表达模板
- **知识图谱** — 可视化知识点依赖和掌握度
- **学习分析** — 趋势图、热力图、模块掌握度分析

---

## 功能特性

### 面试训练系统
- **7 种面试模式**: 一面 / 二面 / HR / 大厂高压 / 快速刷题 / 错题重练 / 薄弱点专项
- **每题 6 个版本**: 标准答案 → 背诵版(30s) → 深度版(源码) → 口语版 → 项目结合 → 常见错误
- **主动回忆模式**: 先写答案 → 对比参考 → 关键要点勾选 → 自动评分
- **追问链路**: 每道题附带 3 个面试官可能追问
- **跨引用关联**: 题目 ↔ 知识点 ↔ 场景 ↔ 项目表达

### 学习系统
- **11 个知识模块**: 集合 / 并发 / JVM / MySQL / Redis / Spring / 微服务 / MQ / 设计模式 / 场景 / 面经
- **4 条学习路径**: 初级(30天) / 中级(45天) / 高级(60天) / 30天冲刺
- **知识图谱**: 力导向图，节点颜色表示掌握度
- **场景实战**: 秒杀 / 缓存穿透 / 慢查询 / 分布式事务 / MQ可靠性 / OOM排查

### 复习系统
- **SM-2 间隔复习**: 完全不会 / 模糊 / 基本会 / 很熟 / 秒答 五档评分
- **错题本**: 按模块统计、优先级排序、复盘笔记
- **今日推荐**: 基于掌握度、遗忘风险、错题频率的智能推荐

### 数据分析
- **Dashboard 学习驾驶舱**: 掌握度雷达图、遗忘风险预警、面试准备度评分
- **学习分析页**: 7天/30天趋势、模块掌握度、错题分布、连续打卡统计

---

## 快速开始

```bash
# 安装依赖
cd javapath
npm install

# 开发
npm run dev              # http://localhost:5173

# 构建
npm run build            # TypeScript + Vite 构建

# 验证
npm run validate:data    # 数据完整性校验
npm run test             # 单元测试 (24 tests)
npm run smoke:visual     # Playwright 可视化冒烟测试

# Docker
docker compose up        # http://localhost:3000
```

---

## 项目架构

```
javapath/
├── src/
│   ├── api/                    # API 抽象层 (后端化就绪)
│   │   ├── types.ts            # API 请求/响应类型 (匹配 Spring Boot Controller)
│   │   ├── client.ts           # ApiClient 接口定义
│   │   ├── localClient.ts      # localStorage 实现 (当前使用)
│   │   ├── remoteClient.ts     # REST API 实现 (Spring Boot 就绪)
│   │   └── index.ts            # 工厂函数 + 导出
│   │
│   ├── services/               # 业务逻辑层 (纯函数，无副作用)
│   │   ├── masteryService.ts   # 掌握度计算、遗忘风险
│   │   ├── reviewService.ts    # SM-2 间隔复习算法
│   │   ├── interviewService.ts # 面试会话管理、评分
│   │   ├── recommendationService.ts # 今日推荐、准备度评分
│   │   └── analyticsService.ts # 学习趋势、模块分析
│   │
│   ├── components/             # UI 组件
│   │   ├── AnswerVersionTabs   # 6版本答案标签页
│   │   ├── CrossReferences     # 跨引用关联面板
│   │   ├── KnowledgeDepthTabs  # 知识点深度标签页
│   │   ├── SpacedReviewSession # 间隔复习闪卡会话
│   │   ├── ChartsExtended      # SVG 雷达图、趋势线
│   │   └── interview-room/     # 模拟面试房间组件
│   │
│   ├── routes/                 # 页面路由 (懒加载)
│   │   ├── DashboardRoute      # 学习驾驶舱
│   │   ├── InterviewRoute      # 面试训练
│   │   ├── InterviewRoomRoute  # 模拟面试房间
│   │   ├── ReviewRoute         # 复习中心 (含SM-2)
│   │   ├── ModulesRoute        # 知识模块阅读器
│   │   ├── KnowledgeGraphRoute # 知识图谱
│   │   ├── ProjectExpressionRoute # 项目表达训练
│   │   ├── ScenariosRoute      # 场景实战
│   │   ├── AnalyticsRoute      # 学习分析
│   │   ├── LearningPathRoute   # 学习路径
│   │   └── SearchRoute         # 全局搜索
│   │
│   ├── data/                   # 数据层
│   │   ├── appData.ts          # 数据归一化引擎
│   │   ├── legacyChapters.ts   # PDF解析→TypeScript (自动生成)
│   │   ├── contentEnrichment.ts# 多版本答案补充数据
│   │   └── projectExpressions.ts # 项目表达模板
│   │
│   ├── lib/                    # 工具库
│   │   ├── storage/            # 存储抽象层 (适配器模式)
│   │   ├── search.ts           # 全文搜索引擎
│   │   ├── metrics.ts          # 掌握度、正确率计算
│   │   ├── reviewScheduler.ts  # 复习优先级排序
│   │   ├── graphBuilder.ts     # 知识图谱数据构建
│   │   └── contentHelpers.ts   # 内容生成辅助
│   │
│   └── types.ts                # 全局类型定义
│
├── scripts/
│   └── parse_pdfs.py           # PDF 解析管线 v2 (draft→review→publish)
│
├── tools/
│   ├── convert-legacy-data.mjs # JS→TS 数据转换
│   ├── validate-data.mjs       # 数据完整性+质量校验
│   └── visual-smoke.mjs        # Playwright 可视化冒烟测试
│
├── tests/
│   └── services.test.ts        # 核心算法单元测试 (24 tests)
│
├── web/data/                   # 源数据 (11个JS文件，手工维护)
│
├── learn/                      # 源 PDF (11份)
│
├── Dockerfile                  # 多阶段构建
├── docker-compose.yml          # 容器编排 (含未来后端预留)
└── vite.config.ts              # Vite 配置
```

---

## 数据管线

```
PDF 源文件 (learn/*.pdf)
    │
    ▼ parse_pdfs.py v2
Draft JSON (draft 状态, 含 confidence 分数)
    │
    ▼ 人工校对 (markdown/)
Review JSON (review 状态)
    │
    ▼ validate-data.mjs 校验
web/data/*.js (published 状态)
    │
    ▼ convert-legacy-data.mjs
src/data/legacyChapters.ts (TypeScript, 自动生成)
    │
    ▼ appData.ts 归一化
AppData { modules, chapters, knowledgePoints, questions, scenarios, studyPlans }
    │
    ▼ contentEnrichment.ts 合并
每道题 → 标准答案 + 背诵版 + 深度版 + 口语版 + 项目结合 + 常见错误
```

### 内容工作流

| 状态 | 描述 | 负责人 |
|------|------|--------|
| draft | PDF 自动解析, confidence < 0.8 标记 needsReview | 机器 |
| review | 人工校对 markdown, 修正内容 | 人工 |
| published | 通过 validate-data 校验, 发布到 web/data/ | CI |

---

## 数据模型

核心 TypeScript 接口 (src/types.ts):

| 接口 | 用途 |
|------|------|
| `Module` | 11个知识模块 (集合/并发/JVM/MySQL/Redis/SSM/MQ/微服务/设计模式/场景/面经) |
| `Chapter` | 章节 (每模块 3-5 个) |
| `KnowledgePoint` | 知识点 (56个, 含核心概念、代码、依赖关系) |
| `InterviewQuestion` | 面试题 (121道, 含6版本答案、追问链、易错点) |
| `Scenario` | 场景实战 (6个: 秒杀/缓存/慢查询/分布式事务/MQ/OOM) |
| `StudyPlan` | 学习计划 (7/14/30/60天) |
| `UserState` | 用户状态 (进度/收藏/错题/笔记/复习计划/面试记录/学习会话) |
| `ReviewScheduleItem` | SM-2 复习调度 (easeFactor/intervalDays/repetitions) |
| `InterviewSession` | 面试会话 (模式/题目/答案/评分/报告) |
| `ProjectExpression` | 项目表达模板 (业务背景→技术问题→选型→设计→代码→问题→优化) |

---

## API 抽象层

项目设计了完整的 API 抽象层, 支持平滑切换到 Spring Boot 后端:

```typescript
// src/api/client.ts — 接口定义
interface ApiClient {
  getAppData(): Promise<ApiResponse<AppData>>;
  getUserState(): Promise<ApiResponse<UserState>>;
  startSession(req): Promise<ApiResponse<StartSessionResponse>>;
  submitAnswer(sessionId, req): Promise<ApiResponse<SubmitAnswerResponse>>;
  getDueReviews(limit): Promise<ApiResponse<DueReviewItem[]>>;
  search(req): Promise<ApiResponse<SearchResponse>>;
  getDashboardSummary(): Promise<ApiResponse<DashboardSummary>>;
  // ... 18 个方法
}
```

**当前**: `LocalClient` — 基于 localStorage, 零网络开销
**未来**: `RemoteClient` — 调用 Spring Boot REST API

切换方式: 修改 `src/api/index.ts` 工厂函数, 或设置 `VITE_API_MODE=remote`

---

## 后端化路线

### Phase 1: Spring Boot 基础 (当前可启动)
```
Java 21 + Spring Boot 3 + MyBatis-Plus + PostgreSQL
├── UserController          # JWT 认证
├── ContentController       # 知识内容 CRUD
├── StateController         # 用户状态同步 (对应 ApiClient.getUserState)
├── InterviewController     # 面试会话管理
├── ReviewController        # SM-2 复习调度
├── SearchController        # 全文搜索 (Elasticsearch/Meilisearch)
└── AnalyticsController     # 学习数据统计
```

### Phase 2: RAG 增强
```
PDF 解析 Worker (Python) → 向量化 → pgvector/Elasticsearch
├── SemanticSearch          # 语义搜索
├── SmartQA                 # 基于 RAG 的智能问答
└── ContentRecommendation   # 个性化内容推荐
```

### Phase 3: 多端 & 协作
```
├── WebSocket               # 实时面试模拟
├── Mobile App              # React Native / Flutter
└── Team Features           # 学习小组、排名
```

---

## 测试

```bash
npm run test             # 单元测试 (24 tests)
  ├── SM-2 Algorithm          (7 tests)
  ├── Mastery Scoring         (5 tests)
  ├── Interview Readiness     (4 tests)
  ├── Quality Button Mapping  (2 tests)
  ├── Streak Calculation      (2 tests)
  └── Forget Risk             (4 tests)

npm run validate:data    # 数据完整性校验
  ├── ID 唯一性检查
  ├── 引用完整性检查
  ├── 内容质量检查 (答案长度、概念覆盖、追问链)
  └── 模块覆盖率检查

npm run smoke:visual     # Playwright 可视化冒烟测试
  ├── Dashboard 渲染
  ├── 知识图谱交互
  ├── 面试训练流程
  ├── 搜索功能
  ├── 深链导航
  └── 移动端适配
```

---

## 技术栈

| 层级 | 技术 |
|------|------|
| 框架 | React 19 + TypeScript 5.7 |
| 构建 | Vite 6 + Tailwind CSS 4 |
| 路由 | 自定义 hash router (零依赖) |
| 状态 | useState + localStorage (适配器模式) |
| 图标 | lucide-react |
| 图表 | 纯 SVG (雷达图/趋势线/热力图/环形图) |
| 测试 | Node.js 内置 test runner + Playwright |
| 容器 | Docker + nginx |
| API | 抽象层 (Local/Remote Client) |

---

## 内容统计

| 类别 | 数量 |
|------|------|
| 知识模块 | 11 |
| 章节 | 42 |
| 知识点 | 56 |
| 面试题 | 121 (27 道已有多版本答案) |
| 场景实战 | 6 |
| 学习计划 | 4 (7/14/30/60天) |
| 项目表达模板 | 6 |
| 源 PDF | 11 |

---

## License

MIT
