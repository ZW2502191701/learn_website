import { legacyChapters } from './legacyChapters';
import type {
  AppData,
  Chapter,
  InterviewQuestion,
  KnowledgePoint,
  Module,
  QuestionCategory,
  Scenario,
  StudyPlan
} from '../types';

const moduleMeta: Record<string, Omit<Module, 'chapterIds'>> = {
  collections: {
    id: 'collections',
    title: '常见集合篇',
    source: '常见集合篇.pdf',
    area: '语言核心',
    description: '集合体系、HashMap、并发集合、fail-fast 等高频源码与选型问题。',
    importance: 96,
    estimatedHours: 12,
    tags: ['集合源码', 'HashMap', '并发集合']
  },
  threads: {
    id: 'threads',
    title: '多线程篇',
    source: '多线程篇.pdf',
    area: '语言核心',
    description: '线程池、锁、AQS、CAS、JMM 与 volatile，面试追问密度最高的并发主线。',
    importance: 98,
    estimatedHours: 16,
    tags: ['并发编程', 'JMM', 'AQS']
  },
  jvm: {
    id: 'jvm',
    title: 'JVM虚拟机篇',
    source: 'JVM虚拟机篇.pdf',
    area: '语言核心',
    description: '运行时数据区、类加载、GC、G1、OOM 与线上排查。',
    importance: 95,
    estimatedHours: 14,
    tags: ['JVM', 'GC', 'OOM']
  },
  mysql: {
    id: 'mysql',
    title: 'MySQL',
    source: 'MySQL.pdf',
    area: '数据存储',
    description: '索引、事务、锁、MVCC、日志与慢查询优化。',
    importance: 94,
    estimatedHours: 14,
    tags: ['索引', '事务', '慢查询']
  },
  redis: {
    id: 'redis',
    title: 'Redis',
    source: 'Redis.pdf',
    area: '数据存储',
    description: '数据类型、持久化、高可用、缓存三兄弟与分布式锁。',
    importance: 91,
    estimatedHours: 10,
    tags: ['缓存', '高可用', '分布式锁']
  },
  ssm: {
    id: 'ssm',
    title: 'SSM框架',
    source: 'SSM框架.pdf',
    area: '框架应用',
    description: 'Spring IOC/AOP/事务、SpringMVC、MyBatis 缓存与安全。',
    importance: 86,
    estimatedHours: 12,
    tags: ['Spring', 'MyBatis', '事务']
  },
  mq: {
    id: 'mq',
    title: '消息中间件篇',
    source: '消息中间件篇.pdf',
    area: '分布式与中间件',
    description: 'MQ 可靠性、重复消费、顺序消费、延迟队列、Kafka 基础。',
    importance: 88,
    estimatedHours: 10,
    tags: ['MQ', 'Kafka', '可靠性']
  },
  microservice: {
    id: 'microservice',
    title: '微服务篇',
    source: '微服务篇.pdf',
    area: '分布式与中间件',
    description: '注册配置、服务调用、熔断限流、网关、分布式事务。',
    importance: 89,
    estimatedHours: 12,
    tags: ['微服务', '网关', '分布式事务']
  },
  designpattern: {
    id: 'designpattern',
    title: '设计模式篇',
    source: '设计模式篇.pdf',
    area: '工程素养',
    description: '设计原则、单例、工厂、策略、模板、观察者等工程化表达。',
    importance: 78,
    estimatedHours: 8,
    tags: ['设计原则', '策略模式', '单例']
  },
  scenario: {
    id: 'scenario',
    title: '技术场景篇',
    source: '技术场景篇.pdf',
    area: '工程素养',
    description: '分布式锁、幂等、秒杀、线上 CPU/内存问题排查。',
    importance: 93,
    estimatedHours: 12,
    tags: ['场景题', '秒杀', '线上排查']
  },
  interview: {
    id: 'interview',
    title: '大厂面经(Java方向)',
    source: '大厂面经(Java方向).pdf',
    area: '求职冲刺',
    description: 'Java 基础、并发 JVM、数据库缓存、项目表达与软技能。',
    importance: 97,
    estimatedHours: 10,
    tags: ['大厂面试', '项目表达', '八股']
  }
};

const moduleIdByTitle: Record<string, string> = {
  常见集合篇: 'collections',
  多线程篇: 'threads',
  JVM虚拟机篇: 'jvm',
  MySQL: 'mysql',
  Redis: 'redis',
  SSM框架: 'ssm',
  消息中间件篇: 'mq',
  微服务篇: 'microservice',
  设计模式篇: 'designpattern',
  技术场景篇: 'scenario',
  '大厂面经(Java方向)': 'interview'
};

const categoryKeywords: Array<[QuestionCategory, string[]]> = [
  ['系统设计题', ['系统', '架构', '秒杀', '分布式', '链路', '限流']],
  ['场景题', ['如何', '排查', '解决', '保证', '线上', '缓存', '事务', '幂等']],
  ['源码题', ['源码', '底层', 'HashMap', 'ConcurrentHashMap', 'AQS', 'Spring']],
  ['项目题', ['项目', 'STAR', '难点', '介绍']],
  ['HR面', ['反问', '软技能']],
  ['八股题', ['区别', '为什么', '是什么', '原理']],
  ['基础题', []]
];

const stripHtml = (value: string) =>
  value
    .replace(/<[^>]+>/g, '')
    .replace(/&nbsp;/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

const safeId = (value: string) =>
  value
    .toLowerCase()
    .replace(/[^a-z0-9\u4e00-\u9fff]+/g, '-')
    .replace(/^-|-$/g, '');

const inferDifficulty = (tags: string[], text: string): 1 | 2 | 3 | 4 | 5 => {
  const joined = `${tags.join(' ')} ${text}`;
  if (/系统|分布式|源码|AQS|G1|事务|MVCC|一致|OOM|追问/.test(joined)) return 5;
  if (/面试高频|底层|并发|锁|缓存|微服务|MQ/.test(joined)) return 4;
  if (/Spring|MySQL|Redis|设计模式/.test(joined)) return 3;
  return 2;
};

const inferCategory = (question: string): QuestionCategory => {
  const hit = categoryKeywords.find(([, words]) => words.some((word) => question.includes(word)));
  return hit?.[0] ?? '基础题';
};

const makeQuestionPoints = (answer: string) =>
  stripHtml(answer)
    .split(/[；。]/)
    .map((item) => item.trim())
    .filter(Boolean)
    .slice(0, 4);

const makePitfalls = (title: string, tags: string[], concepts: Array<{ title: string; body: string }>) => {
  const all = `${title} ${tags.join(' ')} ${concepts.map((item) => stripHtml(item.body)).join(' ')}`;
  const pitfalls: string[] = [];
  if (/HashMap|equals|hashCode/.test(all)) pitfalls.push('只背结论不讲定位桶、equals 比对和扩容迁移过程。');
  if (/线程|volatile|CAS|AQS|锁/.test(all)) pitfalls.push('把可见性、原子性、有序性混在一起，缺少边界条件。');
  if (/MySQL|索引|事务|MVCC|锁/.test(all)) pitfalls.push('只说使用索引，不能解释回表、最左前缀或隔离级别影响。');
  if (/Redis|缓存|分布式锁/.test(all)) pitfalls.push('忽略过期时间、唯一 value、Lua 释放锁和缓存一致性取舍。');
  if (/MQ|消息|Kafka/.test(all)) pitfalls.push('没有区分生产端、Broker、消费端三个可靠性边界。');
  if (/JVM|GC|OOM/.test(all)) pitfalls.push('排查题只说重启，缺少 dump、jstat、jstack、MAT/Arthas 路径。');
  return pitfalls.length ? pitfalls : ['回答停留在定义层，需要补充适用场景、取舍和反例。'];
};

const modulesById = new Map<string, Module>();
const chapters: Chapter[] = [];
const knowledgePoints: KnowledgePoint[] = [];
const questions: InterviewQuestion[] = [];

for (const legacyChapter of legacyChapters) {
  const moduleId = moduleIdByTitle[legacyChapter.chapter] ?? safeId(legacyChapter.chapter);
  const meta = moduleMeta[moduleId] ?? {
    id: moduleId,
    title: legacyChapter.chapter,
    source: `${legacyChapter.chapter}.pdf`,
    area: legacyChapter.module,
    description: `${legacyChapter.chapter} PDF 解析内容。`,
    importance: 70,
    estimatedHours: 8,
    tags: legacyChapter.groups
  };
  modulesById.set(moduleId, { ...meta, chapterIds: [] });

  for (const group of legacyChapter.groups) {
    const chapterId = `${moduleId}-${safeId(group)}`;
    const units = legacyChapter.units.filter((unit) => unit.group === group);
    if (!units.length) continue;
    const chapter: Chapter = {
      id: chapterId,
      moduleId,
      title: group,
      group,
      order: legacyChapter.order,
      knowledgePointIds: []
    };
    chapters.push(chapter);
    modulesById.get(moduleId)?.chapterIds.push(chapterId);

    for (const unit of units) {
      const kpId = `${moduleId}-${safeId(unit.id || unit.title)}`;
      const coreConcepts = unit.concept.map(([title, body]) => ({ title, body: body ?? '' }));
      const relatedQuestionIds: string[] = [];
      const kp: KnowledgePoint = {
        id: kpId,
        moduleId,
        chapterId,
        title: unit.title,
        group,
        tags: unit.tags,
        difficulty: inferDifficulty(unit.tags, unit.title),
        estimatedMinutes: Math.max(25, 20 + unit.qa.length * 8 + unit.concept.length * 6),
        coreConcepts,
        pitfalls: makePitfalls(unit.title, unit.tags, coreConcepts),
        code: unit.code,
        dependencies: [],
        relatedQuestionIds
      };

      unit.qa.forEach(([title, answer], index) => {
        const questionId = `${kpId}-q${index + 1}`;
        relatedQuestionIds.push(questionId);
        const points = makeQuestionPoints(answer);
        questions.push({
          id: questionId,
          moduleId,
          knowledgePointId: kpId,
          category: inferCategory(title),
          title,
          answer,
          points: points.length ? points : [stripHtml(answer)],
          followUps: [
            `如果把这个问题放到真实项目里，你会怎么落地？`,
            `这个方案的边界条件和失败场景是什么？`,
            `有没有替代方案，为什么当前方案更合适？`
          ],
          traps: makePitfalls(title, unit.tags, coreConcepts).slice(0, 2),
          difficulty: inferDifficulty(unit.tags, `${title} ${answer}`),
          frequency: unit.tags.includes('面试高频') ? 95 : 70
        });
      });

      knowledgePoints.push(kp);
      chapter.knowledgePointIds.push(kp.id);
    }
  }
}

const dependencyPairs: Array<[string, string]> = [
  ['HashMap 底层结构与扩容', 'ConcurrentHashMap 并发原理'],
  ['ConcurrentHashMap 并发原理', 'CAS 与原子类、ABA 问题'],
  ['CAS 与原子类、ABA 问题', 'JMM 与 volatile'],
  ['JMM 与 volatile', 'JVM 内存结构'],
  ['JVM 内存结构', 'OOM 排查与常用工具'],
  ['MySQL 索引与 B+ 树', 'MySQL 慢查询如何排查'],
  ['Redis 缓存三大问题', '秒杀系统设计'],
  ['线程池核心参数与执行流程', '秒杀系统设计']
];

for (const [fromTitle, toTitle] of dependencyPairs) {
  const from = knowledgePoints.find((item) => item.title.includes(fromTitle) || fromTitle.includes(item.title));
  const to = knowledgePoints.find((item) => item.title.includes(toTitle) || toTitle.includes(item.title));
  if (from && to && !to.dependencies.includes(from.id)) {
    to.dependencies.push(from.id);
  }
}

const findQuestionIds = (keywords: string[]) =>
  questions
    .filter((question) => keywords.some((keyword) => `${question.title} ${question.answer}`.includes(keyword)))
    .slice(0, 4)
    .map((question) => question.id);

export const scenarios: Scenario[] = [
  {
    id: 'seckill-system',
    title: '秒杀系统如何设计',
    moduleIds: ['redis', 'mq', 'mysql', 'microservice', 'scenario'],
    tags: ['高并发', 'Redis', 'MQ', '限流'],
    difficulty: 5,
    background: '大促活动瞬时流量涌入，下单链路需要在高 QPS 下保持低延迟、库存准确和服务隔离。',
    problem: '如何削峰、防超卖、防重复提交，并让数据库不被瞬时流量打垮？',
    analysisPath: ['入口限流与验证码错峰', 'Redis 预热库存并用 Lua 原子扣减', 'MQ 异步创建订单', 'MySQL 乐观锁兜底', '失败补偿与库存回滚'],
    solution: ['前端按钮防重，网关按用户/商品限流。', '热点商品库存提前加载 Redis，用 Lua 判断并扣减。', '扣减成功后写入 MQ，订单服务异步落库。', 'DB 使用 update stock = stock - 1 where stock > 0 兜底。', '消费失败进入重试和死信队列，配合对账任务修正。'],
    architecture: [
      { from: '用户', to: '网关限流', label: '请求削峰' },
      { from: '网关限流', to: 'Redis Lua', label: '原子预扣' },
      { from: 'Redis Lua', to: 'MQ', label: '异步下单' },
      { from: 'MQ', to: '订单服务', label: '消费落库' },
      { from: '订单服务', to: 'MySQL', label: '乐观锁兜底' }
    ],
    expressionTemplate: '我会先把秒杀链路拆成流量入口、库存扣减、异步下单、落库兜底和补偿对账五段。核心原则是把流量挡在 DB 前，用 Redis Lua 保证预扣原子性，用 MQ 削峰，并让 DB 唯一约束和乐观锁做最终一致兜底。',
    relatedQuestionIds: findQuestionIds(['秒杀', '库存', 'MQ', 'Redis'])
  },
  {
    id: 'redis-cache-breakdown',
    title: 'Redis 缓存穿透/击穿/雪崩如何解决',
    moduleIds: ['redis', 'mysql', 'scenario'],
    tags: ['缓存', '高可用', '降级'],
    difficulty: 4,
    background: '缓存承载主要读流量，一旦策略不当，请求会直接穿透到数据库。',
    problem: '如何区分穿透、击穿、雪崩，并给出不同治理手段？',
    analysisPath: ['识别请求命中模式', '判断 key 是否存在/热点/批量失效', '选择空值、布隆过滤器、互斥锁、随机 TTL 或降级', '补充监控与演练'],
    solution: ['穿透：缓存空值或布隆过滤器。', '击穿：互斥锁重建缓存或热点 key 逻辑过期。', '雪崩：TTL 加随机值、多级缓存、Redis 高可用、限流降级。'],
    architecture: [
      { from: '请求', to: '布隆过滤器', label: '非法 key 拦截' },
      { from: '布隆过滤器', to: 'Redis', label: '读缓存' },
      { from: 'Redis', to: '互斥重建', label: '热点 miss' },
      { from: '互斥重建', to: 'MySQL', label: '回源' }
    ],
    expressionTemplate: '我会先区分三类问题：穿透是查不存在，击穿是热点 key 失效，雪崩是大量 key 失效或 Redis 不可用。三者的解法不同，不能只说加缓存。',
    relatedQuestionIds: findQuestionIds(['缓存穿透', '缓存击穿', '雪崩'])
  },
  {
    id: 'mysql-slow-query',
    title: 'MySQL 慢查询如何排查',
    moduleIds: ['mysql', 'scenario'],
    tags: ['MySQL', '索引', '排查'],
    difficulty: 4,
    background: '接口 RT 升高，APM 显示耗时集中在数据库查询。',
    problem: '如何从现象定位到具体 SQL、执行计划和优化方案？',
    analysisPath: ['确认慢 SQL 和调用链', 'EXPLAIN 分析 type/key/rows/Extra', '判断索引失效、回表、排序和锁等待', '改写 SQL 或补充合适索引', '压测回归'],
    solution: ['开启慢查询日志或从 APM 定位 SQL。', '使用 EXPLAIN 查看是否走索引、扫描行数和临时表。', '避免函数/隐式转换/左模糊 like 导致索引失效。', '必要时建立联合索引或覆盖索引。'],
    architecture: [
      { from: 'APM', to: '慢 SQL', label: '定位' },
      { from: '慢 SQL', to: 'EXPLAIN', label: '执行计划' },
      { from: 'EXPLAIN', to: '索引优化', label: '降低 rows' },
      { from: '索引优化', to: '压测', label: '回归验证' }
    ],
    expressionTemplate: '我不会直接说加索引，而是先用慢日志和链路定位 SQL，再用 EXPLAIN 看扫描行数、索引命中和 Extra，最后结合业务访问模式设计联合索引并压测验证。',
    relatedQuestionIds: findQuestionIds(['索引', '慢查询', 'EXPLAIN'])
  },
  {
    id: 'distributed-transaction',
    title: '分布式事务如何处理',
    moduleIds: ['microservice', 'mq', 'mysql'],
    tags: ['微服务', '事务', '最终一致'],
    difficulty: 5,
    background: '订单、库存、优惠券、支付拆成多个服务，单机事务无法覆盖完整业务链路。',
    problem: '如何保证跨服务数据一致，同时避免强一致方案拖垮性能？',
    analysisPath: ['确认一致性要求', '区分强一致和最终一致', '选择本地消息表/MQ 事务/TCC/Saga', '设计幂等、重试、补偿、对账'],
    solution: ['强一致少用 2PC，核心链路更常用最终一致。', '本地事务写业务表和消息表，异步投递 MQ。', '消费端保证幂等，失败重试，超限进入死信和人工/自动补偿。', '关键资金链路可用 TCC 或 Saga。'],
    architecture: [
      { from: '订单服务', to: '本地事务', label: '业务表+消息表' },
      { from: '本地事务', to: 'MQ', label: '异步投递' },
      { from: 'MQ', to: '库存服务', label: '幂等消费' },
      { from: '库存服务', to: '补偿任务', label: '失败修正' }
    ],
    expressionTemplate: '我会先问一致性等级。如果业务接受最终一致，优先本地消息表或可靠消息，配合幂等、重试、死信、补偿和对账；只有强一致或资金类核心动作才考虑 TCC/Saga。',
    relatedQuestionIds: findQuestionIds(['分布式事务', '事务', 'MQ'])
  },
  {
    id: 'mq-reliability',
    title: 'MQ 消息丢失、重复消费、顺序消费如何解决',
    moduleIds: ['mq', 'microservice', 'scenario'],
    tags: ['MQ', '可靠性', '幂等'],
    difficulty: 5,
    background: '下单、支付、库存等链路通过 MQ 解耦，消息可靠性直接影响业务正确性。',
    problem: '如何分别从生产端、Broker、消费端保证消息不丢，并处理重复和顺序？',
    analysisPath: ['生产端 confirm/事务消息', 'Broker 持久化和副本', '消费端手动 ack', '幂等表/唯一索引', '按业务 key 分区保证局部顺序'],
    solution: ['生产端开启 confirm 或事务消息。', 'Broker 开启持久化、多副本或 ISR。', '消费成功后手动 ack，失败重试。', '消费端以业务唯一键做幂等。', '顺序消费按订单 ID 路由到同一队列/分区。'],
    architecture: [
      { from: 'Producer', to: 'Broker', label: 'confirm' },
      { from: 'Broker', to: 'Replica', label: '持久化/副本' },
      { from: 'Broker', to: 'Consumer', label: '手动 ack' },
      { from: 'Consumer', to: '幂等表', label: '去重' }
    ],
    expressionTemplate: 'MQ 可靠性我会分三段讲：生产端是否发成功，Broker 是否持久化，消费端是否处理成功。重复消费默认一定会发生，所以消费逻辑必须幂等。',
    relatedQuestionIds: findQuestionIds(['消息', '重复消费', '顺序', 'MQ'])
  },
  {
    id: 'jvm-oom',
    title: 'JVM 线上 OOM 如何排查',
    moduleIds: ['jvm', 'threads', 'scenario'],
    tags: ['JVM', 'OOM', 'Arthas'],
    difficulty: 5,
    background: '服务发生 OOM 或频繁 Full GC，接口延迟升高甚至进程退出。',
    problem: '如何保留现场、定位泄漏对象、找出引用链并修复？',
    analysisPath: ['配置 HeapDumpOnOutOfMemoryError', 'jstat 判断 GC 频率', 'jmap 导出堆', 'MAT 看支配树和 GC Roots', 'jstack/Arthas 补充线程上下文'],
    solution: ['提前配置 OOM 自动 dump。', '用 jstat 看 YGC/FGC 与各区占用。', '用 MAT 分析 dominator tree 和 leak suspects。', '关注静态集合、缓存无上限、ThreadLocal 未 remove、连接未释放。'],
    architecture: [
      { from: 'OOM', to: 'HeapDump', label: '保留现场' },
      { from: 'HeapDump', to: 'MAT', label: '支配树' },
      { from: 'MAT', to: '引用链', label: 'GC Roots' },
      { from: '引用链', to: '代码修复', label: '定位泄漏' }
    ],
    expressionTemplate: '线上 OOM 我会先确保 dump 被保留，然后用 jstat 判断 GC 情况，用 MAT 看最大对象和引用链，最后回到代码检查缓存、静态集合、ThreadLocal 和资源释放。',
    relatedQuestionIds: findQuestionIds(['OOM', 'jmap', 'jstack', 'MAT'])
  }
];

const planStages = [
  ['Java 基础', ['interview', 'collections']],
  ['集合源码', ['collections']],
  ['JVM', ['jvm']],
  ['并发编程', ['threads']],
  ['数据库', ['mysql']],
  ['缓存', ['redis']],
  ['框架', ['ssm']],
  ['微服务', ['microservice']],
  ['消息队列', ['mq']],
  ['设计模式', ['designpattern']],
  ['系统设计', ['scenario']],
  ['面试冲刺', ['interview']]
] as const;

const makeStudyPlan = (days: 7 | 14 | 30 | 60): StudyPlan => ({
  id: `plan-${days}`,
  days,
  title: `${days} 天 Java 后端复习计划`,
  focus: days <= 14 ? ['高频八股', '场景表达', '错题复盘'] : ['系统学习', '项目表达', '长期巩固'],
  dailyTasks: Array.from({ length: days }, (_, index) => {
    const stage = planStages[index % planStages.length];
    const ids = stage[1];
    const taskIds = knowledgePoints
      .filter((point) => ids.includes(point.moduleId as never))
      .slice(0, days <= 14 ? 3 : 2)
      .map((point) => point.id);
    return {
      day: index + 1,
      title: `${stage[0]}：${ids.map((id) => moduleMeta[id]?.title ?? id).join(' + ')}`,
      moduleIds: [...ids],
      minutes: days <= 14 ? 120 : days <= 30 ? 90 : 60,
      taskIds
    };
  })
});

export const appData: AppData = {
  modules: Array.from(modulesById.values()).sort((a, b) => b.importance - a.importance),
  chapters,
  knowledgePoints,
  questions,
  scenarios,
  studyPlans: [7, 14, 30, 60].map((days) => makeStudyPlan(days as 7 | 14 | 30 | 60))
};

export const moduleLookup = new Map(appData.modules.map((module) => [module.id, module]));
export const chapterLookup = new Map(appData.chapters.map((chapter) => [chapter.id, chapter]));
export const knowledgeLookup = new Map(appData.knowledgePoints.map((point) => [point.id, point]));
export const questionLookup = new Map(appData.questions.map((question) => [question.id, question]));
export const scenarioLookup = new Map(appData.scenarios.map((scenario) => [scenario.id, scenario]));

/** moduleId → KnowledgePoint[] 预建索引，避免运行时 filter */
export const pointsByModule = new Map<string, typeof appData.knowledgePoints>();
for (const point of appData.knowledgePoints) {
  const list = pointsByModule.get(point.moduleId);
  if (list) {
    list.push(point);
  } else {
    pointsByModule.set(point.moduleId, [point]);
  }
}

/** 内容版本信息，用于数据管线追踪和未来 migration */
export const CONTENT_VERSION = 1;
export const CONTENT_STATS = {
  modules: appData.modules.length,
  chapters: appData.chapters.length,
  knowledgePoints: appData.knowledgePoints.length,
  questions: appData.questions.length,
  scenarios: appData.scenarios.length,
  studyPlans: appData.studyPlans.length
} as const;
