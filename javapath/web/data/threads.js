/* ============================================================
 * 多线程篇 · 精修知识库
 * 数据源: C:\AI_Test\learn\多线程篇.pdf
 * 结构与 collections.js 一致：concept[] / code / qa[]
 * ============================================================ */
(window.registerChapter || function(c){(window.JAVAPATH_CHAPTERS=window.JAVAPATH_CHAPTERS||[]).push(c);})({
  chapter: "多线程篇",
  module: "语言核心",
  order: 2,
  groups: ["线程基础", "线程池", "锁与同步", "并发工具", "内存模型"],
  units: [
    {
      id: "thread-create",
      group: "线程基础",
      title: "创建线程的几种方式与生命周期",
      tags: ["面试高频", "Thread", "Runnable"],
      concept: [
        ["创建方式", "<ul><li>继承 <code>Thread</code> 重写 run（不推荐，单继承受限）。</li><li>实现 <code>Runnable</code>（推荐，解耦任务与线程）。</li><li>实现 <code>Callable</code> + <code>FutureTask</code>（有返回值、可抛异常）。</li><li>线程池 <code>ExecutorService</code>（生产首选）。</li></ul>"],
        ["start 与 run 区别", "<code>start()</code> 由 JVM 新建线程并异步执行 run；直接调用 <code>run()</code> 只是在当前线程同步执行一个普通方法，<span class='key'>不会开新线程</span>。"],
        ["六种状态", "NEW、RUNNABLE、BLOCKED、WAITING、TIMED_WAITING、TERMINATED。注意 Java 把"就绪"和"运行中"合并为 RUNNABLE。"]
      ],
      code: `public class Demo {
    public static void main(String[] args) throws InterruptedException {
        // 推荐方式：实现 Runnable，把"任务"和"线程"解耦
        Runnable task = () -> {
            // 这段代码运行在新线程里
            System.out.println("子线程: " + Thread.currentThread().getName());
        };

        Thread t = new Thread(task, "worker-1");
        t.start();   // 正确：JVM 新建线程异步执行 run
        // 注意：若写成 t.run() 则是在 main 线程同步执行，不会开新线程

        t.join();    // 等待子线程结束后再继续（保证输出顺序）
        System.out.println("主线程: " + Thread.currentThread().getName());
    }
}`,
      qa: [
        ["start() 和 run() 有什么区别？", "start() 会新建线程并由 JVM 调度异步执行 run；直接调用 run() 只是普通方法调用，仍在当前线程执行，不产生并发。"],
        ["Runnable 和 Callable 的区别？", "Runnable 的 run 无返回值、不能抛检查异常；Callable 的 call 有返回值、可抛异常，需配合 Future/FutureTask 获取结果。"]
      ]
    },
    {
      id: "threadpool",
      group: "线程池",
      title: "线程池核心参数与执行流程",
      tags: ["面试高频", "ThreadPoolExecutor", "拒绝策略"],
      concept: [
        ["七大参数", "<code>corePoolSize</code> 核心线程数、<code>maximumPoolSize</code> 最大线程数、<code>keepAliveTime</code> 空闲存活时间、<code>workQueue</code> 任务队列、<code>threadFactory</code>、<code>handler</code> 拒绝策略、时间单位。"],
        ["执行流程", "<ol><li>核心线程未满 → 新建核心线程。</li><li>核心已满 → 任务入队列。</li><li>队列满且未达 max → 新建非核心线程。</li><li>都满 → 触发<span class='key'>拒绝策略</span>。</li></ol>"],
        ["为什么不用 Executors", "阿里规约禁止用 <code>Executors</code> 创建：FixedThreadPool/SingleThreadPool 用无界队列可能堆积 OOM；CachedThreadPool 可创建近无限线程导致 OOM。应手动 new ThreadPoolExecutor。"]
      ],
      code: `import java.util.concurrent.*;

public class Demo {
    public static void main(String[] args) {
        ThreadPoolExecutor pool = new ThreadPoolExecutor(
            2,                              // corePoolSize：常驻 2 个核心线程
            4,                              // maximumPoolSize：最多 4 个线程
            60, TimeUnit.SECONDS,           // 非核心线程空闲 60s 后回收
            new ArrayBlockingQueue<>(10),   // 有界队列，容量 10（防止 OOM）
            new ThreadPoolExecutor.CallerRunsPolicy() // 拒绝策略：让提交者自己跑
        );

        for (int i = 0; i < 3; i++) {
            final int id = i;
            pool.execute(() -> System.out.println("执行任务 " + id));
        }
        pool.shutdown();   // 不再接收新任务，执行完已提交的任务后关闭
    }
}`,
      qa: [
        ["线程池的执行流程？", "先用核心线程；核心满了进队列；队列满了且未到最大线程数则扩容线程；再满则走拒绝策略。"],
        ["四种拒绝策略？", "AbortPolicy（抛异常，默认）、CallerRunsPolicy（调用者线程执行）、DiscardPolicy（静默丢弃）、DiscardOldestPolicy（丢弃最老任务再提交）。"],
        ["核心线程数怎么设置？", "CPU 密集型约 N+1；IO 密集型约 2N（N 为核数），最终应结合压测与监控调整。"]
      ]
    },
    {
      id: "synchronized",
      group: "锁与同步",
      title: "synchronized 原理与锁升级",
      tags: ["面试高频", "monitor", "锁升级"],
      concept: [
        ["底层原理", "synchronized 基于对象头的 <span class='key'>Monitor（管程）</span>。同步代码块编译为 <code>monitorenter / monitorexit</code> 指令；同步方法用 ACC_SYNCHRONIZED 标志。"],
        ["锁升级", "JDK 6 后为优化性能引入锁升级：<span class='key'>无锁 → 偏向锁 → 轻量级锁（CAS 自旋）→ 重量级锁</span>，只能升级不能降级。"],
        ["与 Lock 区别", "synchronized 是关键字、自动释放、非公平；ReentrantLock 是 API、需手动 unlock、可公平/可中断/可超时/可绑定多个 Condition。"]
      ],
      code: `public class Demo {
    static int count = 0;
    static final Object lock = new Object();

    public static void main(String[] args) throws InterruptedException {
        Runnable task = () -> {
            for (int i = 0; i < 1000; i++) {
                // synchronized 保证同一时刻只有一个线程能进入这段代码
                // 从而让 count++ 这个"读-改-写"复合操作变成原子的
                synchronized (lock) {
                    count++;
                }
            }
        };
        Thread t1 = new Thread(task), t2 = new Thread(task);
        t1.start(); t2.start();
        t1.join(); t2.join();
        // 有锁保护，结果必为 2000；若去掉 synchronized 会因竞态丢失更新
        System.out.println("count = " + count);
    }
}`,
      qa: [
        ["synchronized 的锁升级过程？", "无锁 → 偏向锁（同一线程重入）→ 轻量级锁（少量竞争，CAS 自旋）→ 重量级锁（竞争激烈，阻塞挂起）。"],
        ["synchronized 和 ReentrantLock 区别？", "前者是 JVM 关键字、自动释放锁；后者是 JDK 类、需手动释放，但支持公平锁、可中断、超时获取、多 Condition。"]
      ]
    },
    {
      id: "aqs",
      group: "锁与同步",
      title: "AQS 与 ReentrantLock",
      tags: ["AQS", "CAS", "CLH队列"],
      concept: [
        ["AQS 是什么", "<code>AbstractQueuedSynchronizer</code> 是并发包的基石，用一个 <span class='key'>volatile int state</span> 表示同步状态，配合 <span class='key'>CLH 双向队列</span>管理等待线程。ReentrantLock、CountDownLatch、Semaphore 都基于它。"],
        ["加锁过程", "线程用 CAS 抢 state，成功即持锁；失败则包装成 Node 入队并 park 挂起，前驱释放锁时 unpark 唤醒。"],
        ["公平 vs 非公平", "非公平锁（默认）允许"插队"抢锁，吞吐更高；公平锁严格按队列顺序，避免饥饿但开销大。"]
      ],
      code: `import java.util.concurrent.locks.ReentrantLock;

public class Demo {
    static int count = 0;
    // ReentrantLock 底层基于 AQS，true 表示公平锁
    static final ReentrantLock lock = new ReentrantLock();

    public static void main(String[] args) throws InterruptedException {
        Runnable task = () -> {
            for (int i = 0; i < 1000; i++) {
                lock.lock();        // 获取锁，底层 CAS 修改 AQS 的 state
                try {
                    count++;        // 临界区
                } finally {
                    lock.unlock();  // 必须在 finally 释放，否则异常会导致死锁
                }
            }
        };
        Thread t1 = new Thread(task), t2 = new Thread(task);
        t1.start(); t2.start(); t1.join(); t2.join();
        System.out.println("count = " + count); // 2000
    }
}`,
      qa: [
        ["AQS 的原理是什么？", "用 volatile 的 state 表示锁状态，CAS 保证修改原子性；抢锁失败的线程进入 CLH 队列阻塞，锁释放时唤醒后继节点。"],
        ["为什么 unlock 要放在 finally？", "保证无论临界区是否抛异常，锁都能被释放，避免其它线程永远拿不到锁造成死锁。"]
      ]
    },
    {
      id: "cas-atomic",
      group: "并发工具",
      title: "CAS 与原子类、ABA 问题",
      tags: ["面试高频", "CAS", "ABA"],
      concept: [
        ["CAS 是什么", "Compare-And-Swap：比较内存值与预期值，相等才写入新值，是一条 <span class='key'>CPU 原子指令</span>，无锁实现线程安全。"],
        ["原子类", "<code>AtomicInteger</code>、<code>AtomicLong</code>、<code>LongAdder</code> 等基于 CAS 自旋实现。高并发计数 LongAdder 比 AtomicLong 更快（分段累加）。"],
        ["ABA 问题", "值从 A→B→A，CAS 误以为没变。解决：加版本号，用 <code>AtomicStampedReference</code>。"]
      ],
      code: `import java.util.concurrent.atomic.AtomicInteger;

public class Demo {
    public static void main(String[] args) throws InterruptedException {
        // AtomicInteger 基于 CAS，无锁实现线程安全的自增
        AtomicInteger count = new AtomicInteger(0);

        Runnable task = () -> {
            for (int i = 0; i < 1000; i++) {
                // incrementAndGet 内部自旋 CAS：比较并交换，失败就重试
                count.incrementAndGet();
            }
        };
        Thread t1 = new Thread(task), t2 = new Thread(task);
        t1.start(); t2.start(); t1.join(); t2.join();
        System.out.println("count = " + count.get()); // 2000，无需加锁
    }
}`,
      qa: [
        ["什么是 CAS？有什么缺点？", "比较并交换，无锁原子操作。缺点：自旋失败重试消耗 CPU、只能保证单个变量、存在 ABA 问题。"],
        ["如何解决 ABA 问题？", "引入版本号/时间戳，每次修改递增，用 AtomicStampedReference 比较值的同时比较版本号。"],
        ["LongAdder 为什么比 AtomicLong 快？", "AtomicLong 高并发下所有线程争同一个值，CAS 失败率高；LongAdder 把热点分散到多个 Cell 分段累加，最后求和，竞争更小。"]
      ]
    },
    {
      id: "jmm",
      group: "内存模型",
      title: "JMM 与 volatile",
      tags: ["面试高频", "可见性", "有序性"],
      concept: [
        ["JMM 三大特性", "<span class='key'>原子性、可见性、有序性</span>。每个线程有自己的工作内存（缓存），与主内存交互可能导致可见性问题。"],
        ["volatile 作用", "<ul><li>保证<span class='key'>可见性</span>：写立即刷主内存，读直接从主内存取。</li><li>禁止<span class='key'>指令重排序</span>（内存屏障）。</li><li><span class='key'>不保证原子性</span>：i++ 仍不安全。</li></ul>"],
        ["happens-before", "JMM 用 happens-before 规则定义可见性：解锁先于加锁、volatile 写先于读、线程 start 先于线程内动作等。"]
      ],
      code: `public class Demo {
    // volatile 保证 flag 的修改对其它线程立即可见
    static volatile boolean flag = false;

    public static void main(String[] args) throws InterruptedException {
        Thread worker = new Thread(() -> {
            // 若 flag 不是 volatile，worker 可能一直读自己缓存里的旧值 false，陷入死循环
            while (!flag) { /* 空转等待 */ }
            System.out.println("收到停止信号，退出");
        });
        worker.start();

        Thread.sleep(100);
        flag = true;   // 主线程修改，volatile 保证 worker 能立刻看到
        System.out.println("已发出停止信号");
    }
}`,
      qa: [
        ["volatile 能保证原子性吗？", "不能。它只保证可见性和有序性。像 i++ 这种复合操作仍需 synchronized 或原子类。"],
        ["volatile 和 synchronized 区别？", "volatile 只修饰变量、保证可见性与禁重排、不阻塞；synchronized 可修饰方法/代码块、保证原子性+可见性、会互斥阻塞。"]
      ]
    }
  ]
});
