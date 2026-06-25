/* ============================================================
 * 大厂面经（Java方向）· 精修知识库
 * 数据源: C:\AI_Test\learn\大厂面经(Java方向).pdf
 * 本章侧重高频综合面试题，code 字段给出"答题要点"伪代码/口诀。
 * ============================================================ */
(window.registerChapter || function(c){(window.JAVAPATH_CHAPTERS=window.JAVAPATH_CHAPTERS||[]).push(c);})({
  chapter: "大厂面经(Java方向)",
  module: "求职冲刺",
  order: 11,
  groups: ["Java 基础", "并发与JVM", "数据库与缓存", "项目与软技能"],
  units: [
    {
      id: "java-base-qa",
      group: "Java 基础",
      title: "Java 基础高频题串讲",
      tags: ["面试高频", "基础", "八股"],
      concept: [
        ["== 与 equals", "<code>==</code> 比较基本类型的值或引用地址；<code>equals</code> 默认比地址，被重写后比内容（如 String）。"],
        ["String/StringBuilder/StringBuffer", "String 不可变；StringBuilder 可变非线程安全（快）；StringBuffer 可变线程安全（synchronized）。"],
        ["接口 vs 抽象类", "抽象类是"是不是"（单继承、可有状态和构造）；接口是"能不能"（多实现、JDK8 后可有默认方法）。"]
      ],
      code: `// 面试常考：String 不可变 + 常量池
public class Demo {
    public static void main(String[] args) {
        String a = "hi";              // 进入字符串常量池
        String b = "hi";              // 复用常量池里的同一对象
        String c = new String("hi");  // 在堆中新建对象

        System.out.println(a == b);          // true：同一常量池对象
        System.out.println(a == c);          // false：c 是堆中新对象
        System.out.println(a.equals(c));     // true：内容相同
    }
}`,
      qa: [
        ["== 和 equals 的区别？", "== 比较值或引用地址；equals 默认也比地址，但 String、Integer 等重写后比较内容。重写 equals 必须重写 hashCode。"],
        ["String 为什么是不可变的？有什么好处？", "内部 char/byte 数组被 final 修饰且不对外暴露修改。好处：可安全共享（常量池）、可缓存 hashCode、线程安全、适合做 HashMap 的 key。"],
        ["重载和重写的区别？", "重载(Overload)同类中方法名相同参数不同，编译期确定；重写(Override)子类覆盖父类方法、签名相同，运行期多态。"]
      ]
    },
    {
      id: "concurrency-qa",
      group: "并发与JVM",
      title: "并发与 JVM 高频题串讲",
      tags: ["面试高频", "并发", "JVM"],
      concept: [
        ["线程池参数", "记住七参数与执行流程（核心→队列→最大→拒绝），以及为何不用 Executors。"],
        ["volatile/synchronized/Lock", "volatile 保可见性不保原子；synchronized 关键字自动释放；Lock 灵活可中断可超时。"],
        ["GC 与调优", "可达性分析判垃圾、分代回收、G1、OOM 排查（HeapDump + MAT）。"]
      ],
      code: `// 答题口诀（非可运行）：
// 线程池流程：核心线程 -> 阻塞队列 -> 非核心线程 -> 拒绝策略
// synchronized 升级：无锁 -> 偏向 -> 轻量(CAS) -> 重量
// GC 判活：从 GC Roots 可达性分析
// 内存泄漏排查：jmap dump -> MAT 看支配树找引用链
class Notes {
    String 线程池 = "核心->队列->最大->拒绝";
    String 锁升级 = "无锁->偏向->轻量->重量";
    String 排查OOM = "HeapDumpOnOOM + MAT";
}`,
      qa: [
        ["说说你对线程池的理解？", "从七大参数、执行流程、四种拒绝策略、为何禁用 Executors、核心线程数如何设置(CPU 密集 N+1 / IO 密集 2N)展开。"],
        ["JVM 内存模型和 GC 了解吗？", "答运行时数据区(堆/栈/方法区/PC/本地栈)、对象创建与分代、可达性分析判垃圾、回收算法与 G1、以及 OOM 排查流程。"],
        ["如何排查死锁？", "jstack 打印线程栈会直接提示 deadlock，或用 Arthas thread -b 查找；预防靠固定加锁顺序、加超时获取锁。"]
      ]
    },
    {
      id: "db-cache-qa",
      group: "数据库与缓存",
      title: "数据库与缓存高频题串讲",
      tags: ["面试高频", "MySQL", "Redis"],
      concept: [
        ["索引", "B+ 树、聚簇/二级索引、回表、覆盖索引、最左前缀、索引失效场景。"],
        ["事务", "ACID、四种隔离级别、MVCC、锁机制。"],
        ["缓存", "三大缓存问题(穿透/击穿/雪崩)、双写一致性、分布式锁。"]
      ],
      code: `// 缓存与数据库双写一致性方案：旁路缓存(Cache Aside)
// 读：先读缓存，没有再读库并回填缓存
// 写：先更新数据库，再删除缓存（而不是更新缓存）
public Object read(String key) {
    Object v = cache.get(key);
    if (v == null) {
        v = db.query(key);   // 读库
        cache.set(key, v);   // 回填
    }
    return v;
}
public void write(String key, Object v) {
    db.update(key, v);       // 1. 先更新数据库
    cache.delete(key);       // 2. 再删缓存（延迟双删可进一步降低不一致）
}`,
      qa: [
        ["缓存与数据库如何保证一致性？", "常用 Cache Aside：读时回填，写时先更新 DB 再删缓存；为应对并发可用延迟双删或订阅 binlog(canal)异步更新，多数业务接受最终一致。"],
        ["MySQL 的 redo log 和 binlog 区别？", "redo log 是 InnoDB 物理日志、保证崩溃恢复(持久性)、循环写；binlog 是 Server 层逻辑日志、用于主从复制和数据恢复、追加写。两者通过两阶段提交保证一致。"],
        ["索引什么时候会失效？", "对索引列运算/函数、隐式类型转换、左模糊 like、不满足最左前缀、OR 连非索引列等。"]
      ]
    },
    {
      id: "project-qa",
      group: "项目与软技能",
      title: "项目介绍与软技能",
      tags: ["项目", "STAR", "软技能"],
      concept: [
        ["STAR 法则", "讲项目用 <span class='key'>Situation 背景 → Task 任务 → Action 行动 → Result 结果</span>，突出你的贡献和量化成果。"],
        ["项目难点", "准备 2~3 个技术难点（如高并发、慢查询、分布式事务），讲清楚问题、方案对比、最终效果。"],
        ["反问环节", "准备问题（团队技术栈、业务方向、成长空间），体现主动性。"]
      ],
      code: `// 项目描述模板（STAR）：
// S: 日活百万的电商，大促时下单接口 RT 高、偶发超卖
// T: 我负责把下单接口 QPS 从 2k 提升到 1w 并杜绝超卖
// A: Redis 预扣库存(Lua 原子) + MQ 异步落库 + 网关限流 + 数据库唯一索引兜底
// R: QPS 提升 5 倍，超卖归零，大促零故障
class ProjectStar {
    String 量化结果 = "QPS 2k -> 1w, 超卖归零, P99 从 800ms -> 120ms";
}`,
      qa: [
        ["介绍一下你做过的项目？", "用 STAR 法则：交代业务背景与规模、你的职责、采用的技术方案(为何这样选)、量化的最终成果。重点讲你主导和解决难点的部分。"],
        ["你项目中最大的技术难点是什么？", "选一个有深度的(如秒杀防超卖/分布式事务/慢查询优化)，讲清问题现象、排查过程、方案对比与取舍、上线效果与数据。"],
        ["你有什么要问我的？", "可问团队技术栈与挑战、业务规划、对该岗位的期望与成长路径，避免只问薪资假期。"]
      ]
    }
  ]
});
