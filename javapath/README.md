<div align="center">

# 🚀 JavaPath — Java 后端进阶学习平台

**面向 Java 后端工程师的沉浸式学习、面试训练与知识管理平台**

![React](https://img.shields.io/badge/React-19-61DAFB?logo=react&logoColor=white)
![TypeScript](https://img.shields.io/badge/TypeScript-5.7-3178C6?logo=typescript&logoColor=white)
![Vite](https://img.shields.io/badge/Vite-6-646CFF?logo=vite&logoColor=white)
![Tailwind CSS](https://img.shields.io/badge/Tailwind-4-06B6D4?logo=tailwindcss&logoColor=white)
![License](https://img.shields.io/badge/License-MIT-green)

<br/>

[功能特性](#-功能特性) · [快速开始](#-快速开始) · [项目架构](#-项目架构) · [数据管线](#-数据管线) · [技术决策](#-技术决策)

</div>

---

## 📖 项目简介

JavaPath 不是一个普通的文档站点，而是一个围绕 **11 份 Java 后端核心学习资料** 构建的工程师工具型产品。它专为以下场景设计：

- 📚 **系统化学习** — 从 Java 基础到微服务架构的完整学习路径
- 🎯 **面试训练** — 覆盖基础题、源码题、场景题、八股题、系统设计题
- 🔄 **错题复盘** — 基于多因子算法的智能复习调度
- 🗺️ **知识图谱** — 可视化知识点依赖关系，理清学习脉络
- 💡 **场景实战** — 秒杀系统、缓存穿透、慢查询优化等高频面试场景
- 📝 **表达训练** — 结构化技术场景表达模板，提升面试表达能力

### 覆盖的知识模块

| 模块 | 核心内容 |
|------|----------|
| 集合框架 | ArrayList / HashMap / ConcurrentHashMap 源码分析 |
| 多线程 | 线程池 / 锁机制 / CAS / volatile / JMM |
| JVM | 内存模型 / GC 算法 / 类加载 / 性能调优 |
| MySQL | 索引原理 / 事务隔离 / 慢查询优化 / 分库分表 |
| Redis | 数据结构 / 缓存策略 / 持久化 / 集群方案 |
| SSM 框架 | Spring IOC/AOP / MyBatis 原理 / SpringBoot 自动装配 |
| 微服务 | 服务治理 / 负载均衡 / 熔断降级 / 链路追踪 |
| 消息队列 | RabbitMQ / Kafka / RocketMQ 原理与可靠性保证 |
| 设计模式 | 常用模式在实际项目中的应用 |
| 场景实战 | 高频系统设计场景的分析与表达 |
| 面试冲刺 | 面试技巧、项目包装、HR 面准备 |

---

## ✨ 功能特性

### 🏠 Dashboard 总览

- 学习进度 KPI 卡片（已学 / 进行中 / 待复习）
- 14 天学习热力图，直观展示学习节奏
- 薄弱模块自动检测与智能推荐
- 面试倒计时器
- 最近学习时间线

### 📈 学习路径

12 步可视化时间线，从 Java 基础到面试冲刺，每步关联对应模块和预估学时：

```
Java 基础 → 集合源码 → JVM → 并发 → 数据库 → 缓存
    → 框架 → 微服务 → 消息队列 → 设计模式 → 系统设计 → 面试冲刺
```

### 📚 知识模块

- **三栏阅读布局**：模块侧栏 → 知识点列表 → 详情面板
- 章节展开、标签筛选、难度标注
- 四种掌握状态：`未开始` / `学习中` / `已掌握` / `待复习`
- 个人笔记与收藏功能
- 关联面试题一键跳转

### 🕸️ 知识图谱

SVG 渲染的知识点依赖关系图，例如：

```
HashMap → ConcurrentHashMap → CAS → volatile → JMM → JVM 内存模型
```

- 节点颜色按掌握状态着色
- 点击节点查看详细解释和关联题目
- 帮助理解前置知识链路

### 🎤 面试训练

- **七大题型**：基础题、源码题、场景题、八股题、项目题、系统设计题、HR 面
- **模拟面试模式**：大厂一面 / 二面 / HR 面
- 追问链路与错题标记
- 频率标注，聚焦高频考点

### 🛠️ 场景实战

6 个深度技术场景，每个包含背景、分析路径、解决方案、架构图和表达模板：

| 场景 | 关键技术点 |
|------|-----------|
| 秒杀系统 | 限流 / 预扣库存 / 异步下单 / 分布式锁 |
| Redis 缓存问题 | 穿透 / 击穿 / 雪崩 / 一致性 |
| MySQL 慢查询 | 执行计划 / 索引优化 / 分页优化 |
| 分布式事务 | TCC / Saga / 最终一致性 / Seata |
| MQ 可靠性 | 消息丢失 / 重复消费 / 顺序性 |
| JVM OOM | 内存溢出排查 / 堆转储分析 |

### 📅 学习计划

- 7 / 14 / 30 / 60 天灵活计划
- 每日任务与时间预算
- 每日打卡与进度追踪
- 智能推荐下一步学习内容

### 🔄 智能复习

多因子优先级算法，综合 6 个维度排序错题：

| 因子 | 权重 | 说明 |
|------|------|------|
| 时间衰减 | 高 | 越久没复习优先级越高 |
| 模块掌握度 | 高 | 薄弱模块的题优先 |
| 错误次数 | 中 | 错得越多越需要巩固 |
| 收藏标记 | 中 | 收藏但未掌握的优先 |
| 正确率 | 中 | 正确率低的优先复习 |
| 新鲜度 | 低 | 新题稍后复习 |

### 🔍 全文搜索

- 跨知识点、面试题、场景题搜索
- 加权评分：标题 > 标签 > 正文
- 搜索结果高亮与摘要提取
- 按模块分组展示

### ⌨️ 命令面板

`Ctrl+K` 快速唤起命令面板：

- 快速跳转任意页面
- 搜索知识点 / 面试题 / 场景
- 执行操作：打卡、导出状态、重置进度

### 🎨 主题与响应式

- 亮色 / 暗色主题切换
- 三档响应式断点：1280px / 980px / 640px
- 移动端底部导航栏
- 侧栏折叠与自适应网格

---

## 🚀 快速开始

### 环境要求

- Node.js >= 18
- npm >= 9

### 安装与运行

```bash
# 克隆项目
git clone <repository-url>
cd learn_website/javapath

# 安装依赖
npm install

# 启动开发服务器
npm run dev
```

访问 [http://127.0.0.1:5173/](http://127.0.0.1:5173/) 即可使用。

### 常用命令

```bash
npm run dev           # 启动开发服务器
npm run build         # TypeScript 类型检查 + Vite 生产构建
npm run convert:data  # 从 web/data/*.js 重新生成 legacyChapters.ts
npm run validate:data # 数据完整性校验
npm run smoke:visual  # Playwright 视觉冒烟测试（需先启动 dev server）
```

---

## 🏗️ 项目架构

### 目录结构

```
javapath/
├── index.html                     # Vite 入口
├── package.json
├── vite.config.ts                 # Vite 配置（Tailwind + 手动分包）
├── tsconfig.json
│
├── web/
│   └── data/                      # Legacy 原始数据（11 个 JS 文件）
│       ├── collections.js
│       ├── threads.js
│       ├── jvm.js
│       ├── mysql.js
│       ├── redis.js
│       ├── ssm.js
│       ├── mq.js
│       ├── microservice.js
│       ├── designpattern.js
│       ├── scenario.js
│       └── interview.js
│
├── scripts/
│   └── parse_pdfs.py              # 离线 PDF 解析脚本（PyMuPDF）
│
├── tools/
│   ├── convert-legacy-data.mjs    # JS → TypeScript 数据转换
│   ├── validate-data.mjs          # 数据完整性校验
│   └── visual-smoke.mjs           # Playwright 视觉测试
│
└── src/
    ├── main.tsx                   # React 入口
    ├── App.tsx                    # 根组件（懒加载路由）
    ├── types.ts                   # 核心类型定义
    ├── styles.css                 # 设计系统（~3600 行 CSS）
    │
    ├── components/                # 通用组件
    │   ├── AppShell.tsx           # 主布局：顶栏 / 侧栏 / 命令面板 / 移动端底栏
    │   ├── ArchitectureDiagram.tsx # SVG 架构图
    │   ├── Charts.tsx             # 环形图 / 热力图
    │   ├── ConfirmDialog.tsx      # 确认弹窗
    │   ├── ErrorBoundary.tsx      # 错误边界
    │   ├── Primitives.tsx         # 基础 UI 原语
    │   ├── SafeHtml.tsx           # HTML 安全渲染
    │   └── Toast.tsx              # Toast 通知
    │
    ├── data/                      # 数据层
    │   ├── legacyTypes.ts         # Legacy 数据类型
    │   ├── legacyChapters.ts      # 由 web/data/*.js 生成（2148 行）
    │   └── appData.ts             # 运行时归一化 → Module / Chapter / ...
    │
    ├── hooks/                     # 自定义 Hooks
    │   ├── useDebounce.ts
    │   ├── useStorageSync.ts      # 本地 + 远程状态同步
    │   └── useToast.ts
    │
    ├── lib/                       # 核心逻辑库
    │   ├── hashRouter.ts          # Hash 路由
    │   ├── metrics.ts             # 掌握度计算 / 薄弱检测 / 推荐
    │   ├── reviewScheduler.ts     # 错题优先级调度器
    │   ├── sanitize.ts            # HTML 净化
    │   ├── search.ts              # 全文搜索（加权评分）
    │   └── storage/               # 存储抽象层
    │       ├── adapter.ts         # StorageAdapter 接口 + LocalStorage 实现
    │       ├── serialization.ts   # 状态序列化 / 版本化 / 导入导出
    │       ├── mutations.ts       # 纯函数状态变更
    │       ├── merge.ts           # 状态合并
    │       └── remoteAdapter.ts   # 内存远程适配器（预留后端接入）
    │
    └── routes/                    # 页面路由
        ├── DashboardRoute.tsx     # 总览仪表盘
        ├── LearningPathRoute.tsx  # 学习路径
        ├── ModulesRoute.tsx       # 知识模块
        ├── KnowledgeGraphRoute.tsx # 知识图谱
        ├── InterviewRoute.tsx     # 面试训练
        ├── ScenariosRoute.tsx     # 场景实战
        ├── PlanRoute.tsx          # 学习计划
        ├── ReviewRoute.tsx        # 错题复习
        └── SearchRoute.tsx        # 全文搜索
```

### 技术栈

| 层级 | 技术 | 说明 |
|------|------|------|
| 框架 | React 19 + TypeScript 5.7 | 类型安全的组件开发 |
| 构建 | Vite 6 | 极速 HMR + 生产优化 |
| 样式 | Tailwind CSS v4 + 自定义 CSS | 原子化 + 设计系统 |
| 图标 | lucide-react | 轻量图标库 |
| 路由 | 自定义 Hash Router | 零依赖，极简实现 |
| 状态 | React useState + 纯函数 | 无外部状态库 |
| 持久化 | localStorage + 可插拔适配器 | 预留后端接入 |
| 测试 | Playwright | 视觉回归测试 |

### 核心类型模型

```typescript
// 学习进度状态
type ProgressStatus = 'not-started' | 'learning' | 'mastered' | 'review';

// 知识模块
interface Module {
  id: string;
  title: string;
  source: string;          // 来源 PDF
  area: string;            // 技术领域
  importance: number;       // 重要度 (1-5)
  estimatedHours: number;   // 预估学时
  tags: string[];
  chapterIds: string[];
}

// 知识点
interface KnowledgePoint {
  id: string;
  title: string;
  difficulty: 1 | 2 | 3 | 4 | 5;
  coreConcepts: Array<{ title: string; body: string }>;
  pitfalls: string[];       // 常见踩坑
  dependencies: string[];   // 前置知识 ID
  relatedQuestionIds: string[];
}

// 面试题
interface InterviewQuestion {
  category: '基础题' | '源码题' | '场景题' | '八股题' | '项目题' | '系统设计题' | 'HR面';
  title: string;
  answer: string;
  points: string[];         // 得分要点
  followUps: string[];      // 追问链路
  traps: string[];          // 常见陷阱
  frequency: number;        // 面试频率
}

// 用户状态
interface UserState {
  progress: Record<string, StudyProgress>;
  favorites: Favorite[];
  wrongQuestions: WrongQuestion[];
  notes: Record<string, string>;
  checkins: string[];       // 打卡记录
  targetDate: string;       // 面试目标日期
  theme: 'light' | 'dark';
}
```

---

## 📊 数据管线

### 内容生产流程

```
┌─────────────┐     ┌──────────────┐     ┌─────────────────────┐
│  Source PDFs │────▶│ parse_pdfs.py│────▶│ Draft JSON/Markdown │
│  (learn/*.pdf)│     │  (PyMuPDF)   │     │  (人工校对)          │
└─────────────┘     └──────────────┘     └─────────────────────┘
                                                │
                                                ▼
┌─────────────┐     ┌──────────────┐     ┌─────────────────────┐
│  web/data/   │────▶│ convert:data │────▶│ legacyChapters.ts   │
│  *.js (curated)│    │  (sandbox)   │     │ (2148 行 TypeScript) │
└─────────────┘     └──────────────┘     └─────────────────────┘
                                                │
                                                ▼
┌─────────────┐     ┌──────────────┐     ┌─────────────────────┐
│  运行时使用   │◀────│  appData.ts  │◀────│ 归一化模型输出        │
│  (React 组件) │     │ (归一化)      │     │ Module/Chapter/KP/...│
└─────────────┘     └──────────────┘     └─────────────────────┘
```

### 数据校验

```bash
npm run validate:data
```

校验规则：

- ✅ ID 唯一性（模块 / 章节 / 知识点 / 面试题 / 场景 / 计划）
- ✅ 引用完整性（所有跨实体引用指向存在的 ID）
- ✅ 内容质量（重复标题、空正文、孤立节点）
- ✅ 结构一致性（章节排序、模块关联）

### PDF 解析（离线 Draft）

```bash
python scripts/parse_pdfs.py --src "D:\AI_Test\learn" --out "D:\AI_Test\javapath\output"
```

产出物：

| 文件 | 用途 |
|------|------|
| `knowledge.json` / `summary.json` | 程序消费的标准 JSON |
| `knowledge.js` | 浏览器可直接引入的 `window.KNOWLEDGE_DATA` |
| `*.md` | 逐 PDF Markdown，便于人工校对 |
| `assets/` | 提取的图片资源 |

> ⚠️ **重要**：PDF 解析结果应作为 draft/校对输入，不应无审查覆盖 curated 数据。接入时需保留 `sourcePdf`、`confidence`、`needsReview` 等来源字段。

---

## 🎯 技术决策

### 极简依赖

项目仅依赖 3 个运行时库：

```
react + react-dom + lucide-react
```

- **无 React Router** — 自定义 Hash Router，~50 行代码实现路由解析与跳转
- **无 Redux / Zustand** — React `useState` + 纯函数 mutation，状态变更可追溯
- **无 UI 组件库** — 3600 行 `styles.css` 实现完整设计系统，CSS 自定义属性驱动主题

### 可插拔存储架构

```typescript
interface StorageAdapter {
  load(): PersistedUserState | null;
  save(state: PersistedUserState): void;
  clear(): void;
}
```

当前实现：

- `LocalStorageAdapter` — 浏览器 localStorage
- `InMemoryRemoteAdapter` — 内存实现（预留后端接入）

未来接入 Spring Boot 后端时，只需实现 `StorageAdapter` 接口即可无缝切换。

### 懒加载路由

所有路由组件通过 `React.lazy()` 动态加载，配合 `<Suspense>` 骨架屏：

```tsx
const DashboardRoute = lazy(() => import('./routes/DashboardRoute'));
const ModulesRoute = lazy(() => import('./routes/ModulesRoute'));
// ...
```

首屏仅加载当前路由的代码，显著降低初始包体积。

### 内容版本化

```typescript
export const CONTENT_VERSION = 1;
export const CONTENT_STATS = { modules: 11, chapters: 103, ... };
```

支持未来数据结构迁移和管线追踪。

### HTML 安全渲染

PDF 解析内容包含原始 HTML，通过 `lib/sanitize.ts` 净化后渲染：

- 移除 `<script>`、`<iframe>` 等危险标签
- 剥离 `on*` 事件属性
- 保留安全的格式化标签

---

## 🗺️ 路线图

### 近期计划

- [ ] 后端服务接入（Spring Boot + MySQL + Redis）
- [ ] 用户认证与多设备同步
- [ ] 更多场景实战内容
- [ ] 面试录音与回放分析

### 中期规划

- [ ] AI 驱动的个性化学习推荐
- [ ] 社区功能（笔记分享、讨论区）
- [ ] 移动端 App（React Native）
- [ ] 更多语言支持

---

## 🤝 参与贡献

1. Fork 本仓库
2. 创建功能分支：`git checkout -b feature/amazing-feature`
3. 提交更改：`git commit -m 'feat: add amazing feature'`
4. 推送分支：`git push origin feature/amazing-feature`
5. 提交 Pull Request

### 开发规范

- 组件使用 PascalCase 命名
- 工具函数使用 camelCase 命名
- 类型定义使用 PascalCase 命名
- CSS 类名使用 kebab-case 命名
- 提交信息遵循 [Conventional Commits](https://www.conventionalcommits.org/) 规范

---

## 📄 许可证

本项目基于 [MIT License](LICENSE) 开源。

---

<div align="center">

**JavaPath** — 让 Java 后端学习更有章法 🎯

Made with ❤️ for Java Engineers

</div>
