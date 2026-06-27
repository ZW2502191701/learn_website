export interface ContentEnrichment {
  questionIdContains: string;
  interviewAnswer?: string;
  deepAnswer?: string;
  sourceCodeAnswer?: string;
  oralAnswer?: string;
  projectAnswer?: string;
  commonMistakes?: string[];
}

export const enrichments: ContentEnrichment[] = [
  // ── 集合篇 ────────────────────────────────────────────────────────
  {
    questionIdContains: 'HashMap',
    interviewAnswer: 'HashMap 底层是数组+链表+红黑树。put 时先算 hash，定位桶位置，桶空直接放，不空则遍历链表/红黑树找 key，找到覆盖，没找到尾插。链表长度>=8 且数组>=64 时转红黑树。扩容是 2 倍，rehash 时高低位拆分。',
    deepAnswer: 'HashMap 1.8 采用数组+链表+红黑树结构。hash 扰动：高 16 位异或低 16 位减少碰撞。负载因子 0.75，容量总是 2 的幂。扩容时元素要么留在原位，要么移到原位+旧容量。红黑树退化条件：remove 时节点数<=6 转回链表。',
    oralAnswer: 'HashMap 就是一个数组加链表，链表太长就变红黑树。放数据的时候先算 hashCode，再跟数组长度取模定位到桶，桶里有东西就挂链表后面。链表超过 8 个节点就转红黑树，这样查询从 O(n) 变成 O(logn)。装不下就扩容两倍。',
    projectAnswer: '我项目里用 HashMap 做本地缓存，存用户权限信息。上线后发现内存占用很高，排查发现是没重写 hashCode 导致大量碰撞退化成链表。重写后内存降了 40%。面试时可以结合这个讲 HashMap 的 hash 扰动和扩容机制。',
    commonMistakes: ['只说数组+链表，不提红黑树', '不知道负载因子 0.75 的含义', '说不清楚扩容时 rehash 的高低位拆分逻辑', '混淆 1.7 头插法和 1.8 尾插法']
  },
  {
    questionIdContains: 'ConcurrentHashMap',
    interviewAnswer: 'ConcurrentHashMap 1.8 用 CAS+synchronized 锁桶头节点实现并发安全。put 时桶空用 CAS 写入，不空则 synchronized 锁链表/红黑树头节点。size() 用 baseCount+CounterCell[] 分散计数，类似 LongAdder。',
    deepAnswer: '1.7 分段锁 Segment（继承 ReentrantLock），1.8 改为 Node 数组+链表+红黑树，锁粒度细化到单个桶。扩容时多线程协作迁移，每个线程负责一段桶。transfer() 使用 fwd 节点标记已迁移桶。',
    oralAnswer: 'ConcurrentHashMap 1.8 就是 CAS 加 synchronized。桶空的时候用 CAS 原子写入，不空就锁住桶头节点。比分段锁效率更高，锁粒度从段级别细化到了桶级别。计数用类似 LongAdder 的分散思想。',
    projectAnswer: '项目里用 ConcurrentHashMap 做接口限流计数器，存储每个用户的调用次数。选它是因为多个线程同时计数不会出问题，而且性能比 Hashtable 好很多。配合 compute() 方法可以原子地判断并更新。',
    commonMistakes: ['还说 1.7 的分段锁', '不知道 1.8 改用 CAS + synchronized', '不理解 size() 的 CounterCell 分散计数']
  },
  {
    questionIdContains: 'ArrayList|LinkedList',
    interviewAnswer: 'ArrayList 底层是 Object[]，随机访问 O(1)，增删 O(n) 需要移动元素，默认扩容 1.5 倍。LinkedList 底层是双向链表，增删 O(1) 但定位 O(n)，实际很少用因为缓存不友好。绝大多数场景优先 ArrayList。',
    deepAnswer: 'ArrayList grow() 扩容：newCapacity = oldCapacity + (oldCapacity >> 1)，即 1.5 倍。elementData 数组用 transient 修饰，自定义序列化只写非 null 元素。LinkedList 同时实现了 List 和 Deque 接口，可以做队列和栈。',
    oralAnswer: 'ArrayList 就是数组，查快增删慢；LinkedList 是链表，增删快查慢。但实际开发中基本都用 ArrayList，因为 CPU 缓存对连续内存更友好，而且大多数操作是查询不是增删。',
    projectAnswer: '项目中商品列表展示用 ArrayList 存储分页数据，读多写少场景性能最好。曾遇到过一个问题：在循环里用 ArrayList.remove(i) 导致 O(n²) 性能问题，后来改成 LinkedList 或者倒序删除就解决了。',
    commonMistakes: ['认为 LinkedList 增删一定比 ArrayList 快', '不知道 ArrayList 默认扩容 1.5 倍', '忽略 CPU 缓存行对 ArrayList 的加速']
  },
  {
    questionIdContains: 'fail-fast|快速失败',
    interviewAnswer: 'fail-fast 是迭代集合时发现结构被修改就立即抛 ConcurrentModificationException。实现方式：modCount 记录修改次数，迭代器创建时保存 expectedModCount，每次 next() 检查是否一致。线程安全集合用 fail-safe，复制一份数据来迭代。',
    oralAnswer: 'fail-fast 就是你在遍历集合的时候，如果有别的线程改了集合，它马上抛异常告诉你。用 modCount 计数来实现的。想安全遍历就用 CopyOnWriteArrayList 或者 Collections.synchronizedList。',
    projectAnswer: '遇到过在 for 循环里删除 list 元素导致 ConcurrentModificationException，后来改成 Iterator.remove() 或者用 removeIf() 就好了。这是非常常见的坑。',
    commonMistakes: ['不清楚 modCount 的作用', '不知道 fail-safe 的实现是复制数据', '在循环中直接调 list.remove()']
  },
  // ── 多线程篇 ──────────────────────────────────────────────────────
  {
    questionIdContains: 'volatile',
    interviewAnswer: 'volatile 保证可见性和有序性，不保证原子性。可见性：写 volatile 变量会立即刷回主存，读时从主存取。有序性：通过内存屏障禁止指令重排。典型用法：DCL 单例的 instance、标志位、CAS 的底层。',
    deepAnswer: 'JMM 中 volatile 写前插入 StoreStore 屏障，写后插入 StoreLoad 屏障；读前插入 LoadLoad 屏障，读后插入 LoadStore 屏障。happens-before 规则：volatile 写 happens-before 后续的 volatile 读。',
    oralAnswer: 'volatile 就是告诉 JVM 这个变量别优化，每次读都去主存拿最新值，写完立刻刷回去。但它不能保证原子性，比如 i++ 还是不安全的，得用 AtomicInteger。一般用来做标志位或者配合 CAS 使用。',
    projectAnswer: '项目中用 volatile 做服务优雅停机的标志位：private volatile boolean running = true; 主循环检查 running，shutdown 时设为 false，所有线程立刻看到。比 synchronized 轻量得多。',
    commonMistakes: ['说 volatile 保证原子性', '不知道内存屏障', '分不清 volatile 和 synchronized 的区别']
  },
  {
    questionIdContains: '线程池',
    interviewAnswer: 'ThreadPoolExecutor 7 个参数：corePoolSize、maximumPoolSize、keepAliveTime、unit、workQueue、threadFactory、handler。执行流程：core 未满 -> 创建核心线程；core 满 -> 入队；队列满 -> 创建非核心线程；都满 -> 拒绝策略。',
    deepAnswer: '4 种拒绝策略：AbortPolicy 抛异常、CallerRunsPolicy 调用者执行、DiscardPolicy 静默丢弃、DiscardOldestPolicy 丢弃最老。workQueue 类型：LinkedBlockingQueue（无界危险）、ArrayBlockingQueue（有界）、SynchronousQueue（直接传递）。',
    oralAnswer: '线程池就是一堆线程复用，避免反复创建销毁的开销。核心参数就是核心线程数、最大线程数、队列和拒绝策略。提交任务时：核心没满就创建核心线程，满了就放队列，队列也满了就创建非核心线程，都满了就拒绝。',
    projectAnswer: '项目里用线程池处理异步导出：核心 4 最大 8，有界队列 100，CallerRunsPolicy。这样队列满时由调用线程执行，起到限流作用。用 Spring 的 @Async 加自定义 ThreadPoolTaskExecutor，避免用 Executors 工厂方法创建无界队列。',
    commonMistakes: ['说不清 7 个参数', '不知道执行流程的优先级', '用 Executors.newFixedThreadPool 等无界队列工厂方法']
  },
  {
    questionIdContains: 'synchronized',
    interviewAnswer: 'synchronized 通过 Monitor（管程）实现互斥。1.6 引入偏向锁->轻量级锁->重量级锁的升级过程。修饰实例方法锁 this，修饰静态方法锁 Class 对象，修饰代码块锁指定对象。',
    deepAnswer: '锁升级：无锁->偏向锁（单线程 CAS 写 Mark Word）->轻量级锁（多线程自旋 CAS）->重量级锁（OS mutex，线程阻塞）。wait/notify 必须在 synchronized 块内。JDK 15 废弃偏向锁。',
    oralAnswer: 'synchronized 就是加锁，保证同一时间只有一个线程执行。修饰方法锁整个对象，修饰代码块只锁一段代码。1.6 之后有锁升级：先偏向锁（只有一个线程用），再轻量级锁（多线程轮流自旋），最后重量级锁（挂起线程）。',
    projectAnswer: '项目中库存扣减用 synchronized 保证原子性：synchronized(this) { if(stock > 0) stock--; }。但高并发下性能不好，后来改成 Redis + Lua 脚本原子扣减，synchronized 只用于本地测试环境。',
    commonMistakes: ['不知道锁升级过程', '混淆锁实例方法和锁静态方法', '不知道 wait 必须在 synchronized 内']
  },
  {
    questionIdContains: 'CAS|原子类',
    interviewAnswer: 'CAS（Compare And Swap）是一种无锁并发原语：比较内存值与预期值，相等则更新为新值，不等则重试。Java 通过 Unsafe 类调用 CPU 指令实现。ABA 问题用 AtomicStampedReference（版本号）解决。',
    deepAnswer: 'CAS 三个操作数：内存地址 V、预期值 A、新值 B。AtomicInteger 底层用 Unsafe.getAndAddInt() 自旋 CAS。LongAdder 用 Cell[] 分散热点，高并发下比 AtomicLong 更高效。CAS 的问题：自旋消耗 CPU、ABA 问题、只能保证一个变量的原子性。',
    oralAnswer: 'CAS 就是"比较并交换"，不加锁的方式保证原子性。先读一个值，改完再写回去之前检查有没有被别人改过，没改过就写入，改过就重试。ABA 问题就是值从 A 变 B 再变回 A，CAS 以为没变，用版本号解决。',
    projectAnswer: '项目中乐观锁版本控制用 CAS 思想：UPDATE stock SET count = count - 1, version = version + 1 WHERE id = ? AND version = ?。如果 version 不匹配说明被别人改过，重试即可。',
    commonMistakes: ['不知道 CAS 的三个操作数', '不清楚 ABA 问题及解决方法', '以为 CAS 完全没有开销']
  },
  {
    questionIdContains: 'AQS|AbstractQueuedSynchronizer',
    interviewAnswer: 'AQS 是 Java 并发锁的基础框架，维护一个 volatile int state 和 CLH 双向队列。获取锁：CAS 修改 state，失败则封装成 Node 入队，自旋+park 等待。释放锁：修改 state，unpark 队列头节点。ReentrantLock、Semaphore、CountDownLatch 都基于 AQS。',
    oralAnswer: 'AQS 就是一个模板，用一个 volatile 变量表示锁状态，用一个队列排队等锁。获取锁就是改 state，改不了就排队等着。ReentrantLock、信号量、倒计时门栓都是基于它实现的。',
    projectAnswer: '项目中用 ReentrantLock 的 tryLock 做分布式任务抢占：tryLock(0, SECONDS) 立即返回是否成功，避免阻塞。底层就是 AQS 的 nonfairTryAcquire。理解 AQS 才能正确选择锁的类型和用法。',
    commonMistakes: ['说不清 state 和队列的关系', '不知道 CLH 队列的自旋+park 机制', '以为 AQS 只用于 ReentrantLock']
  },
  {
    questionIdContains: 'ThreadLocal',
    interviewAnswer: 'ThreadLocal 为每个线程维护独立变量副本，实现线程隔离。底层：每个 Thread 有 ThreadLocalMap，key 是 ThreadLocal 的弱引用，value 是实际值。问题：线程池中不 remove 会导致内存泄漏和数据污染。',
    oralAnswer: 'ThreadLocal 就是每个线程有自己的变量副本，互不影响。比如用户登录信息存在 ThreadLocal 里，当前线程任何地方都能拿到。线程池用完一定要 remove，不然线程复用时会拿到上一个请求的数据。',
    projectAnswer: '项目中用 ThreadLocal 存储请求上下文（userId、traceId），拦截器里 set，业务代码里 get，拦截器 afterCompletion 里 remove。Spring 的 RequestContextHolder 底层就是 ThreadLocal。',
    commonMistakes: ['不知道 ThreadLocalMap 用弱引用做 key', '线程池中忘记 remove 导致内存泄漏', '以为 ThreadLocal 能解决并发问题']
  },
  // ── JVM 篇 ────────────────────────────────────────────────────────
  {
    questionIdContains: 'JVM.*内存|内存.*JVM|运行时数据区',
    interviewAnswer: 'JVM 运行时数据区：堆（对象实例）、方法区/元空间（类信息、常量池）、虚拟机栈（栈帧：局部变量表、操作数栈、动态链接、返回地址）、本地方法栈、程序计数器。堆和方法区线程共享，其余线程私有。',
    deepAnswer: 'JDK 8 后永久代被元空间取代（使用本地内存，避免 OOM）。堆分新生代（Eden+S0+S1）和老年代。GC：Minor GC 回收新生代，Major/Full GC 回收老年代。TLAB 是线程私有的 Eden 区缓冲，避免多线程分配冲突。',
    oralAnswer: 'JVM 内存主要分五块：堆存对象、方法区存类信息、虚拟机栈存方法调用、本地方法栈存 native 方法、程序计数器记录当前执行位置。堆和方法区是所有线程共享的，其他三个是每个线程各一份。',
    projectAnswer: '线上 OOM 排查时首先要搞清楚是哪个区域溢出。-Xmx 调堆大小、-XX:MetaspaceSize 调元空间。用 jmap -heap 看各区使用情况，用 MAT 分析 dump 文件找泄漏对象。项目中遇到过元空间 OOM，是动态生成类太多导致的。',
    commonMistakes: ['分不清堆和栈的区别', '不知道元空间取代了永久代', '搞混哪些区域线程共享哪些私有']
  },
  {
    questionIdContains: '垃圾回收|GC|GC Roots',
    interviewAnswer: 'GC Roots 包括：虚拟机栈引用的对象、静态变量引用的对象、常量引用的对象、JNI 引用的对象。可达性分析：从 GC Roots 出发，不可达的对象就是垃圾。回收算法：标记-清除（碎片）、标记-整理（慢）、复制（空间换时间）、分代收集。',
    oralAnswer: '垃圾回收首先找到所有"根"对象，就是正在被使用的那些，然后从根出发顺着引用链找，找不到的就是垃圾可以回收。回收方式有三种：直接清（有碎片）、整理到一起（慢）、复制到另一块空间（快但费空间）。',
    projectAnswer: '项目中调优 GC 用 G1 收集器，设置 -XX:MaxGCPauseMillis=200 控制停顿时间。通过 GC 日志分析发现大对象直接进老年代导致频繁 Full GC，设置 -XX:G1HeapRegionSize 调整 region 大小后解决。',
    commonMistakes: ['不清楚 GC Roots 有哪些', '混淆三种回收算法', '不知道分代收集的策略']
  },
  {
    questionIdContains: 'OOM|内存溢出|内存泄漏',
    interviewAnswer: 'OOM 排查步骤：1. 配置 -XX:+HeapDumpOnOutOfMemoryError 保留现场；2. jstat 看 GC 频率和各区占用；3. jmap 导出堆 dump；4. MAT 分析 dominator tree 和 leak suspects；5. jstack/Arthas 看线程栈。常见原因：缓存无上限、ThreadLocal 未 remove、连接未关闭。',
    oralAnswer: 'OOM 就是内存不够用了。排查就四步：先配自动 dump，然后用 jstat 看 GC 情况，用 MAT 分析 dump 文件找大对象，最后回到代码修。最常见的原因是缓存没设上限、ThreadLocal 没清理、数据库连接没关闭。',
    projectAnswer: '项目遇到过一次 OOM，用 MAT 分析发现是一个 Map 做本地缓存没设过期策略，数据量增长后内存爆了。改成 Caffeine 缓存设了最大条目数和过期时间就解决了。现在所有服务都配了 HeapDumpOnOutOfMemoryError。',
    commonMistakes: ['排查题只说重启', '不知道 dump、jstat、jstack、MAT/Arthas 路径', '分不清内存泄漏和内存溢出']
  },
  // ── MySQL 篇 ───────────────────────────────────────────────────────
  {
    questionIdContains: 'MySQL.*索引|索引.*MySQL|B\\+',
    interviewAnswer: 'InnoDB 用 B+ 树做索引。聚簇索引叶子存整行，二级索引叶子存主键（需回表）。联合索引遵循最左前缀。覆盖索引：查询字段都在索引中，无需回表。EXPLAIN 看 type、key、rows、Extra。',
    deepAnswer: 'B+ 树特点：非叶子只存 key，叶子存数据且用双向链表连接（范围查询高效）。回表：二级索引查到主键后，再走聚簇索引查完整行。索引下推 ICP：在存储引擎层提前过滤，减少回表次数。',
    oralAnswer: 'MySQL 索引就是 B+ 树，数据存在叶子节点上，叶子之间用链表连着所以范围查询很快。主键索引存整行，其他索引存主键再回表查一次。建联合索引时要注意顺序，查询条件要从左到右匹配才能用上索引。',
    projectAnswer: '项目中订单表 2000 万行查询变慢，EXPLAIN 显示全表扫描。分析高频查询条件后建了联合索引 (user_id, status, created_at)，RT 从 3s 降到 50ms。关键是理解业务查询模式来设计索引。',
    commonMistakes: ['不知道聚簇索引和二级索引的区别', '说不清最左前缀原则', '忽略覆盖索引的优化价值']
  },
  {
    questionIdContains: '事务|隔离级别|MVCC',
    interviewAnswer: 'MySQL 四个隔离级别：读未提交（脏读）、读已提交（不可重复读）、可重复读（InnoDB 默认，MVCC 解决幻读）、串行化。MVCC：每行有隐藏列 trx_id 和 roll_pointer，ReadView 根据活跃事务列表判断版本可见性。',
    deepAnswer: 'InnoDB 默认可重复读，通过 MVCC+Next-Key Lock 解决幻读。ReadView 包含：m_ids（活跃事务）、min_trx_id、max_trx_id、creator_trx_id。RC 每次读创建新 ReadView，RR 只在第一次读时创建。undo log 构成版本链。',
    oralAnswer: '事务隔离级别就是控制多个事务并发时能不能看到彼此的修改。读未提交啥都能看到，读已提交只能看到别人提交的，可重复读保证同一个事务里多次读结果一样，串行化最安全但最慢。MySQL 默认可重复读，用 MVCC 实现。',
    projectAnswer: '项目中遇到过"幻读"问题：同一个事务里两次 count 查询结果不同。原因是 RR 级别下快照读和当前读混用。解决：要么全部用快照读，要么加 FOR UPDATE 锁定。理解 MVCC 才能正确选择读的方式。',
    commonMistakes: ['分不清脏读、不可重复读、幻读', '不知道 InnoDB 默认 RR 且用 MVCC', '不清楚 ReadView 的创建时机']
  },
  {
    questionIdContains: '慢查询|EXPLAIN|SQL.*优化',
    interviewAnswer: '慢查询排查：1. 开启慢查询日志或 APM 定位 SQL；2. EXPLAIN 看 type（ALL 全表扫描）、key（是否走索引）、rows（扫描行数）、Extra（filesort/temporary）；3. 优化：加索引、改写 SQL、避免 SELECT *、分页优化。',
    oralAnswer: 'SQL 慢就三步：先开慢日志找到哪条 SQL 慢，再用 EXPLAIN 看它的执行计划是不是全表扫描，最后加合适的索引或者改写 SQL。注意 like 左模糊、函数转换、隐式类型转换都会让索引失效。',
    projectAnswer: '项目中用户列表接口 RT 飙到 3s，定位到一条多表 JOIN 的 SQL 用了 ORDER BY 无索引字段导致 filesort。建了联合索引覆盖 WHERE 和 ORDER BY 条件后降到 200ms。之后定期用 pt-query-digest 分析慢日志。',
    commonMistakes: ['只说加索引不看执行计划', '不知道索引失效的场景', '忽略 ORDER BY 和 GROUP BY 的索引优化']
  },
  {
    questionIdContains: '锁|死锁|行锁|间隙锁',
    interviewAnswer: 'InnoDB 锁类型：共享锁 S（读）、排他锁 X（写）、意向锁 IS/IX（表级）、记录锁（锁行）、间隙锁（锁范围防止插入）、临键锁（记录锁+间隙锁）。死锁条件：互斥、持有等待、不可剥夺、循环等待。排查：SHOW ENGINE INNODB STATUS。',
    oralAnswer: 'MySQL 的锁就是保证数据一致性。行锁锁住一行数据，间隙锁锁住一个范围防止新插入。死锁就是两个事务互相等对方释放锁。排查死锁看 InnoDB Status 的 LATEST DETECTED DEADLOCK 部分。',
    projectAnswer: '项目遇到过死锁：两个事务同时更新订单表的不同行，但走了不同的索引导致加锁顺序相反。解决：统一按主键顺序更新，或者用 SELECT FOR UPDATE 提前锁定。InnoDB 有死锁检测，检测到会回滚一个事务。',
    commonMistakes: ['分不清记录锁、间隙锁、临键锁', '不知道死锁的四个必要条件', '以为 InnoDB 不能自动处理死锁']
  },
  // ── Redis 篇 ───────────────────────────────────────────────────────
  {
    questionIdContains: 'Redis.*数据结构|数据类型|Redis.*类型',
    interviewAnswer: 'Redis 五种基本类型：String（缓存、计数器）、List（消息队列、最新列表）、Hash（对象属性）、Set（去重、交并差集）、ZSet（排行榜、延迟队列）。底层编码：ziplist、hashtable、skiplist、quicklist、intset。',
    oralAnswer: 'Redis 的数据类型就是 String、List、Hash、Set、有序 Set。String 最常用做缓存和计数器，Hash 存对象字段，List 做队列，Set 去重，有序 Set 做排行榜。底层用不同的数据结构实现，小数据用 ziplist 省空间。',
    projectAnswer: '项目中用 ZSet 做延迟队列：score 存执行时间戳，member 存消息体。定时任务 ZRANGEBYSCORE 取到期消息处理。比 MQ 轻量，适合延迟时间不精确的场景。排行榜也用 ZSet，ZADD 存分数，ZREVRANGE 取 top N。',
    commonMistakes: ['不知道底层编码切换条件', '以为 String 只能存字符串', '不清楚 ZSet 的跳表实现']
  },
  {
    questionIdContains: 'Redis.*持久化|RDB|AOF',
    interviewAnswer: 'Redis 两种持久化：RDB（定时快照，fork 子进程，COW 机制）和 AOF（追加写命令，三种同步策略：每秒/每次/不主动）。Redis 4.0 混合持久化：RDB 做全量+AOF 增量，兼顾速度和安全。',
    oralAnswer: 'Redis 持久化就两种方式：RDB 是定期拍快照存到磁盘，恢复快但可能丢最近几分钟数据；AOF 是把每条写命令追加到文件，数据更安全但文件大。现在推荐用混合持久化，RDB 加增量 AOF。',
    projectAnswer: '项目中 Redis 开启了混合持久化：aof-use-rdb-preamble yes。这样 AOF 重写时先写 RDB 格式再追加增量命令，重启加载速度快很多。同时做了主从复制，从节点做持久化不影响主节点性能。',
    commonMistakes: ['分不清 RDB 和 AOF 的优缺点', '不知道 COW 机制', '以为 AOF 重写是读旧 AOF 文件']
  },
  {
    questionIdContains: 'Redis.*缓存|缓存穿透|缓存击穿|缓存雪崩',
    interviewAnswer: '穿透：查不存在的 key，解法：布隆过滤器/缓存空值。击穿：热点 key 过期，解法：互斥锁/逻辑过期。雪崩：大量 key 同时过期，解法：随机 TTL/多级缓存/Redis 高可用。双写一致性：先更新 DB 再删缓存+延迟双删。',
    oralAnswer: '缓存三个问题：穿透是查不存在的数据，用布隆过滤器拦截；击穿是热点 key 突然过期，用互斥锁只让一个线程去查 DB；雪崩是大量 key 一起过期，给 TTL 加随机值打散。双写一致性的核心是先更新 DB 再删缓存。',
    projectAnswer: '项目商品详情页遇到过缓存击穿：秒杀时热点商品缓存过期，大量请求打到 DB。用 Redis 分布式锁解决：setnx 加锁，只有一个线程查 DB 回写缓存，其他线程等 50ms 重试。后来又加了本地缓存做二级防护。',
    commonMistakes: ['三个问题分不清', '不知道布隆过滤器有误判', '雪崩只说加缓存时间']
  },
  {
    questionIdContains: 'Redis.*分布式锁|分布式锁.*Redis',
    interviewAnswer: 'Redis 分布式锁：SET key value NX EX 30 加锁，Lua 脚本判断 value 一致再删除释放锁。Redlock：向 N 个独立 Redis 实例加锁，多数成功才算获取。注意：设置过期时间防死锁、唯一 value 防误删、Lua 保证原子性。',
    oralAnswer: 'Redis 分布式锁就是用 SETNX 命令，key 存在就说明有人在用，不存在就你来用。一定要设过期时间防止死锁，释放锁时要判断是不是自己的锁（用 Lua 脚本保证原子性）。高可用场景用 Redlock 在多个 Redis 实例上加锁。',
    projectAnswer: '项目中秒杀库存扣减用 Redis 分布式锁：SET lock:sku:1001 requestId NX EX 10。扣减成功后发 MQ 异步下单。释放锁用 Lua 脚本保证原子性，先判断 value 是否一致再删除 key。',
    commonMistakes: ['不设过期时间', '释放锁不判断 value', '不知道 Redlock 的多数派机制']
  },
  // ── SSM 框架篇 ────────────────────────────────────────────────────
  {
    questionIdContains: 'Spring.*IOC|DI|依赖注入',
    interviewAnswer: 'IOC（控制反转）：对象的创建和依赖关系交给 Spring 容器管理，不再自己 new。DI（依赖注入）是 IOC 的实现方式：构造器注入、Setter 注入、字段注入（@Autowired）。Bean 生命周期：实例化 -> 属性注入 -> Aware 回调 -> BeanPostProcessor -> 初始化 -> 使用 -> 销毁。',
    oralAnswer: 'IOC 就是把对象的创建权交给 Spring，你需要什么 Spring 给你注入什么。最常用 @Autowired 注入，推荐用构造器注入因为可以保证依赖不为 null 且方便测试。Bean 的完整生命周期很长，核心是实例化、注入属性、初始化三步。',
    projectAnswer: '项目中用 @Configuration + @Bean 注解管理第三方组件（Redis 客户端、线程池），用 @Autowired 注入自定义 Service。遇到过循环依赖问题：A 注入 B、B 注入 A，用 @Lazy 延迟加载解决。',
    commonMistakes: ['分不清 IOC 和 DI', '不知道 Bean 生命周期', '字段注入 vs 构造器注入的取舍']
  },
  {
    questionIdContains: 'Spring.*AOP|AOP.*Spring|切面',
    interviewAnswer: 'Spring AOP 通过动态代理实现：接口用 JDK Proxy，类用 CGLIB。核心概念：切面 Aspect、切入点 Pointcut、通知 Advice（Before/After/Around/AfterReturning/AfterThrowing）、连接点 JoinPoint。',
    deepAnswer: 'JDK Proxy 基于 InvocationHandler，只能代理接口方法。CGLIB 基于 ASM 字节码生成子类，不能代理 final 方法。Spring Boot 2.x 默认使用 CGLIB。@Transactional 本质就是 AOP 代理。',
    oralAnswer: 'AOP 就是面向切面编程，把通用逻辑（日志、事务、权限）抽出来统一处理。底层用动态代理实现，Spring 默认用 CGLIB。最常见的应用就是 @Transactional 注解，加了之后方法自动被事务代理包裹。',
    projectAnswer: '项目中自定义了一个 @OperationLog 注解做操作审计：AOP 切面拦截所有加了注解的方法，记录操作人、操作时间、操作内容到日志表。比在每个方法里手动写日志优雅很多，只加一个注解就行。',
    commonMistakes: ['说不清 JDK Proxy 和 CGLIB 的区别', '不知道 Spring Boot 默认用 CGLIB', '以为 AOP 只能用注解配置']
  },
  {
    questionIdContains: 'Spring.*事务|事务传播|@Transactional',
    interviewAnswer: 'Spring 事务传播行为：REQUIRED（默认，有则加入无则新建）、REQUIRES_NEW（总是新建）、NESTED（嵌套事务，savepoint）。@Transactional 失效场景：方法非 public、同类内部调用、异常被 catch、rollbackFor 不匹配。',
    oralAnswer: 'Spring 事务最常用 REQUIRED，就是如果当前有事务就加入，没有就新建一个。注意几个坑：private 方法加 @Transactional 不生效、同一个类里 A 方法调 B 方法的事务也不生效（因为绕过了代理）、默认只回滚 RuntimeException。',
    projectAnswer: '项目中下单方法调用了扣库存和扣余额，需要同一个事务。但扣余额失败时 catch 了异常没抛出，导致事务不回滚。修复：catch 后重新 throw new RuntimeException，或者配 rollbackFor = Exception.class。',
    commonMistakes: ['不清楚传播行为的区别', '内部调用导致事务失效', '不配 rollbackFor 导致受检异常不回滚']
  },
  // ── 微服务篇 ───────────────────────────────────────────────────────
  {
    questionIdContains: '注册中心|Nacos|Eureka|服务注册',
    interviewAnswer: '注册中心负责服务注册与发现。Eureka：AP 模型，Peer-to-Peer 复制，客户端缓存。Nacos：支持 AP/CP 切换，配置中心一体化，支持权重和健康检查。服务调用：Feign 声明式 HTTP 调用，Ribbon 客户端负载均衡。',
    oralAnswer: '注册中心就是服务的电话簿，服务启动时把自己的地址注册上去，调用时去查对方地址。Nacos 是目前最流行的，既能做注册中心又能做配置中心。服务间调用用 Feign，像写接口一样简单。',
    projectAnswer: '项目用 Nacos 做注册中心+配置中心。服务启动自动注册，Feign 调用其他服务。遇到过服务下线后客户端还缓存旧地址导致调用失败，通过配置 Ribbon 的 ServerListRefreshInterval 缩短缓存刷新间隔解决。',
    commonMistakes: ['分不清 AP 和 CP', '不知道客户端缓存机制', 'Feign 和 RestTemplate 的区别']
  },
  {
    questionIdContains: '限流|熔断|降级|Sentinel|Hystrix',
    interviewAnswer: '限流：控制请求速率，算法有计数器、滑动窗口、漏桶、令牌桶。熔断：下游服务异常率超阈值自动切断调用，三种状态：关闭/打开/半开。降级：返回兜底数据或默认值。Sentinel 支持热点参数限流和集群限流。',
    oralAnswer: '限流就是限制请求量防止系统被打垮，熔断就是发现下游不行了自动停止调用避免雪崩，降级就是出问题了返回一个兜底方案。Sentinel 是阿里巴巴开源的，功能比 Hystrix 更强，支持实时监控和动态规则。',
    projectAnswer: '项目中对商品查询接口配了 Sentinel 限流：QPS 阈值 1000，超过后返回本地缓存数据。对库存服务配了熔断：慢调用比例超 50% 触发熔断 10 秒，半开状态探测恢复。用 Dashboard 实时监控每个接口的流量和异常。',
    commonMistakes: ['限流和熔断分不清', '不知道熔断的三种状态', '限流算法的优缺点说不清']
  },
  {
    questionIdContains: '网关|Gateway|路由',
    interviewAnswer: 'API 网关是微服务的统一入口，负责路由转发、负载均衡、限流、鉴权、日志。Spring Cloud Gateway 基于 WebFlux，使用 Filter Chain 模式。核心概念：Route（路由）、Predicate（断言）、Filter（过滤器）。',
    oralAnswer: '网关就是所有请求的统一入口，进来之后根据 URL 路由到不同的微服务。可以在网关做统一鉴权、限流、日志。Spring Cloud Gateway 用 Filter 链处理请求，Pre Filter 做前置逻辑，Post Filter 做后置处理。',
    projectAnswer: '项目中网关做了四件事：1. JWT Token 校验（Pre Filter）；2. 按 IP 限流（RequestRateLimiter Filter）；3. 请求日志记录；4. 路由到对应微服务。鉴权失败直接返回 401，不到后端服务。',
    commonMistakes: ['不知道 Gateway 基于 WebFlux', 'Pre Filter 和 Post Filter 的区别', '网关和服务间的负载均衡关系']
  },
  // ── MQ 篇 ─────────────────────────────────────────────────────────
  {
    questionIdContains: '消息.*丢失|可靠.*投递|MQ.*可靠',
    interviewAnswer: 'MQ 可靠性分三段：生产端（confirm/事务消息）、Broker（持久化+副本/ISR）、消费端（手动 ACK+幂等）。RabbitMQ 用 confirm+持久化+手动 ack；RocketMQ 用事务消息+同步刷盘+重试队列；Kafka 用 acks=all+ISR+手动提交 offset。',
    oralAnswer: '消息不丢要三段保证：发送时要确认 Broker 收到了，Broker 要把消息存盘加副本，消费时要手动确认而不是自动。任何一段出问题都可能丢消息。消费失败要重试，重试多次还不行就进死信队列。',
    projectAnswer: '项目中用 RocketMQ 的事务消息保证订单和库存一致性：先发半消息，本地事务成功后提交消息，失败回滚。消费端做幂等（唯一业务 ID 去重表），消费失败重试 3 次后进死信队列人工处理。',
    commonMistakes: ['只关注一段忽略其他', '不知道 confirm 和事务消息的区别', '消费端用自动 ACK']
  },
  {
    questionIdContains: '重复消费|幂等|消息.*重复',
    interviewAnswer: '重复消费的原因：网络抖动导致 Broker 没收到 ACK 会重发、消费者处理完但 ACK 前崩溃。解决方案：1. 消费端幂等（唯一索引/Redis 去重/状态机）；2. 业务天然幂等（UPDATE SET x=1 而不是 x=x+1）。',
    oralAnswer: '重复消费基本一定会发生，所以消费逻辑必须幂等。最简单的方法是用唯一业务 ID 做去重：消费前先查 Redis 或数据库有没有处理过这条消息。数据库唯一索引也能防止重复插入。',
    projectAnswer: '项目中用 Redis SET 做消息去重：消费前 SETNX msgId，设置过期时间 24 小时。设置成功才处理业务逻辑，失败说明已处理过直接跳过。这样既简单又高效，比数据库查表快很多。',
    commonMistakes: ['以为消息不会重复', '去重和幂等分不清', '只说"做幂等"不给具体方案']
  },
  {
    questionIdContains: '顺序消费|消息.*顺序',
    interviewAnswer: '全局有序：单分区/单队列，但牺牲吞吐量。局部有序：按业务 key（如订单 ID）路由到同一分区/队列。Kafka：同 partition 内有序，producer 指定 key 分区。RocketMQ：MessageQueueSelector 按 key 选队列，顺序消费模式加锁。',
    oralAnswer: '消息顺序分全局有序和局部有序。全局有序只有一个队列，性能差。实际用局部有序：同一个订单的消息都发到同一个队列，这样这个订单的消息就是有序的。Kafka 用 partition key，RocketMQ 用 MessageQueueSelector。',
    projectAnswer: '项目中订单状态变更需要顺序消费：订单创建->支付->发货->完成。用订单 ID 做 key 路由到同一队列，消费端顺序消费。如果某个订单处理失败，暂停该队列消费重试，不影响其他订单。',
    commonMistakes: ['分不清全局有序和局部有序', '不知道如何保证同一 key 的顺序', '以为 Kafka 天然全局有序']
  },
  // ── 设计模式篇 ─────────────────────────────────────────────────────
  {
    questionIdContains: '单例|Singleton|DCL',
    interviewAnswer: '单例模式保证一个类只有一个实例。推荐实现：静态内部类（懒加载+线程安全）或枚举（防反射和序列化）。DCL 双重检查锁：必须用 volatile 防止指令重排，否则可能拿到未初始化的对象。',
    oralAnswer: '单例就是整个应用只有一个实例，比如数据库连接池。最推荐用枚举实现，简单安全防反射。DCL 用 volatile 是因为 new 对象分三步：分配内存、初始化、赋值引用，不加 volatile 可能先赋值再初始化。',
    projectAnswer: '项目中用 Spring 的 @Service 默认就是单例。如果不用 Spring，用静态内部类方式：private static class Holder { static final Instance = new Instance(); }。DCL 在双重校验锁单例的面试题里经常考。',
    commonMistakes: ['DCL 忘记 volatile', '不知道枚举单例防反射', '饿汉和懒汉的区别说不清']
  },
  {
    questionIdContains: '策略模式|Strategy',
    interviewAnswer: '策略模式定义一系列算法，把它们封装起来使它们可以互相替换。结构：Strategy 接口 + 多个 ConcreteStrategy + Context。好处：消除 if-else、符合开闭原则、策略可以独立变化。Spring 中用 Map 注入实现策略工厂。',
    oralAnswer: '策略模式就是把 if-else 分支变成一个个策略类。比如支付方式有微信、支付宝、银行卡，每种支付是一个策略，上下文根据用户选择调用对应策略。新增支付方式只需加一个类，不用改已有代码。',
    projectAnswer: '项目中导出功能用策略模式：ExcelExportStrategy、CsvExportStrategy、PdfExportStrategy，根据前端参数选择策略。用 @Component + Map<String, ExportStrategy> 自动注入，避免大量 if-else。',
    commonMistakes: ['和状态模式搞混', '不知道 Spring 中怎么实现策略工厂', '只知道理论不会结合项目']
  },
  // ── 场景/系统设计篇 ────────────────────────────────────────────────
  {
    questionIdContains: '秒杀|高并发.*抢购',
    interviewAnswer: '秒杀设计五层：前端限流（按钮防重、验证码）-> 网关限流（令牌桶/滑动窗口）-> Redis 预热库存（Lua 原子扣减）-> MQ 异步下单 -> DB 乐观锁兜底。核心原则：把流量挡在 DB 前面，逐层过滤。',
    oralAnswer: '秒杀的核心就是层层拦截：前端按钮只能点一次，网关限制每秒请求数，Redis 用 Lua 脚本原子扣减库存，扣减成功发 MQ 异步下单，DB 最后兜底用乐观锁。这样数据库只需要处理真正下单的请求。',
    projectAnswer: '项目中设计秒杀系统：1. 前端倒计时+按钮置灰防重复提交；2. Nginx 限流每秒 500 请求；3. Redis 预扣库存 Lua 脚本保证原子性；4. 扣减成功发 RocketMQ 订单消息；5. 订单服务消费并写 DB，update stock where stock > 0 兜底。',
    commonMistakes: ['只说加 Redis 不说具体方案', '忽略 MQ 的作用', '不知道 Lua 脚本保证原子性']
  },
  {
    questionIdContains: '分布式.*事务|TCC|Saga|最终一致',
    interviewAnswer: '分布式事务方案：2PC（强一致但性能差）、TCC（Try-Confirm-Cancel，灵活但侵入大）、Saga（长事务补偿）、本地消息表+MQ（最终一致）。优先用最终一致方案，只有资金类核心业务才用 TCC/Saga。',
    oralAnswer: '分布式事务就是多个服务的数据要保持一致。最常用的是本地消息表：业务操作和消息在同一个本地事务里写入，然后异步发 MQ 通知其他服务。消费端做幂等，失败重试，最终达到一致。资金类才用 TCC。',
    projectAnswer: '项目中订单和库存跨服务：订单服务创建订单时同时写本地消息表（同一个事务），定时任务扫描消息表发 MQ，库存服务消费并扣减。消费失败重试 3 次后进死信队列。通过定时对账保证最终一致。',
    commonMistakes: ['只知道 2PC 不知道更好的方案', '不清楚本地消息表的实现', '最终一致和强一致的区别']
  },
  {
    questionIdContains: 'JWT|Token|认证|授权|RBAC',
    interviewAnswer: 'JWT 三部分：Header（算法）、Payload（用户信息+过期时间）、Signature（签名）。认证流程：登录签发 JWT -> 请求携带 Token -> Filter 验证签名和过期 -> 存入 SecurityContext。RBAC：用户-角色-权限三级模型。',
    oralAnswer: 'JWT 就是一个加密的字符串，里面存了用户信息和过期时间。登录成功后签发给前端，前端每次请求放在 Header 里。后端 Filter 验证签名是否合法、有没有过期。RBAC 就是用户关联角色，角色关联权限。',
    projectAnswer: '项目中用 JWT + Spring Security 做认证：登录成功签发 access_token（2小时）和 refresh_token（7天）。请求经过 JwtFilter 验证。注销用 Redis 黑名单存被废弃的 Token。RBAC 用五张表：用户、角色、权限、用户角色关联、角色权限关联。',
    commonMistakes: ['JWT 和 Session 的区别说不清', '不知道 Token 如何主动失效', 'RBAC 表设计说不清']
  }
];
