/* ============================================================
 * JVM 虚拟机篇 · 精修知识库
 * 数据源: C:\AI_Test\learn\JVM虚拟机篇.pdf
 * ============================================================ */
(window.registerChapter || function(c){(window.JAVAPATH_CHAPTERS=window.JAVAPATH_CHAPTERS||[]).push(c);})({
  chapter: "JVM虚拟机篇",
  module: "语言核心",
  order: 3,
  groups: ["运行时数据区", "类加载", "垃圾回收", "调优与排查"],
  units: [
    {
      id: "runtime-area",
      group: "运行时数据区",
      title: "JVM 内存结构",
      tags: ["面试高频", "堆", "栈", "方法区"],
      concept: [
        ["线程私有", "<span class='key'>程序计数器</span>（当前字节码行号，唯一不 OOM）、<span class='key'>虚拟机栈</span>（栈帧：局部变量表/操作数栈）、<span class='key'>本地方法栈</span>。"],
        ["线程共享", "<span class='key'>堆</span>（对象实例，GC 主战场，分新生代/老年代）、<span class='key'>方法区</span>（JDK 8 后为元空间 Metaspace，存类信息、运行时常量池，使用本地内存）。"],
        ["常见异常", "栈深度过大 → StackOverflowError；堆放不下对象 → OutOfMemoryError: Java heap space。"]
      ],
      code: `public class Demo {
    // 成员变量随对象存在"堆"中
    int instanceField = 1;
    // 静态变量在方法区（元空间）
    static int staticField = 2;

    public static void main(String[] args) {
        // 局部变量 a 存在虚拟机栈的"局部变量表"里
        int a = 10;
        // new 出来的对象实例存在"堆"中，obj 这个引用存在栈里
        Demo obj = new Demo();

        System.out.println("局部变量 a = " + a);
        System.out.println("堆中实例字段 = " + obj.instanceField);
        System.out.println("方法区静态字段 = " + staticField);
    }
}`,
      qa: [
        ["JVM 运行时数据区有哪些？", "程序计数器、虚拟机栈、本地方法栈（线程私有）；堆、方法区/元空间（线程共享）。"],
        ["JDK 8 为什么用元空间取代永久代？", "永久代在堆内、大小难调易 OOM；元空间使用本地内存，默认只受物理内存限制，更灵活，类元数据回收也更彻底。"]
      ]
    },
    {
      id: "classloader",
      group: "类加载",
      title: "类加载过程与双亲委派",
      tags: ["面试高频", "双亲委派"],
      concept: [
        ["加载过程", "<span class='key'>加载 → 验证 → 准备 → 解析 → 初始化</span>。准备阶段给静态变量赋默认值（0/null），初始化阶段才赋真正的值并执行静态代码块。"],
        ["双亲委派", "类加载请求<span class='key'>先委派给父加载器</span>，父加载不了才自己加载。顺序：Bootstrap → Extension → Application → 自定义。"],
        ["好处", "避免核心类被篡改（如自写 java.lang.String 不会被加载），保证类的唯一性与安全。"]
      ],
      code: `public class Demo {
    public static void main(String[] args) {
        // 应用类加载器（AppClassLoader）：加载我们自己写的类
        ClassLoader app = Demo.class.getClassLoader();
        System.out.println("加载 Demo 的: " + app);

        // 向上查看父加载器：扩展/平台类加载器
        System.out.println("父加载器: " + app.getParent());

        // 核心类 String 由 Bootstrap 加载，是 C++ 实现，返回 null（双亲委派的体现）
        System.out.println("加载 String 的: " + String.class.getClassLoader());
    }
}`,
      qa: [
        ["什么是双亲委派机制？", "类加载时先委托父加载器尝试加载，父加载不到才由子加载器加载，自底向上委派、自顶向下加载。"],
        ["如何打破双亲委派？", "重写 loadClass 方法（如 Tomcat 的 WebAppClassLoader 优先加载自己的类），或用 SPI/线程上下文类加载器（如 JDBC）。"]
      ]
    },
    {
      id: "gc-algo",
      group: "垃圾回收",
      title: "垃圾判定与回收算法",
      tags: ["面试高频", "可达性分析", "三色标记"],
      concept: [
        ["如何判断垃圾", "<span class='key'>可达性分析</span>：从 GC Roots（栈引用、静态变量、常量等）出发，不可达的对象判为垃圾。引用计数法无法解决循环引用，JVM 不用。"],
        ["回收算法", "<ul><li>标记-清除：有内存碎片。</li><li>标记-复制：用于新生代，无碎片但浪费一半空间。</li><li>标记-整理：用于老年代，无碎片但移动成本高。</li></ul>"],
        ["分代回收", "新生代（Eden + 两个 Survivor，8:1:1）用复制算法；对象熬过多次 GC 进入老年代，用标记-整理。"]
      ],
      code: `public class Demo {
    public static void main(String[] args) {
        Object a = new Object();   // a 是 GC Root 可达，不会被回收
        Object b = new Object();

        a = null;  // 断开引用：原来的对象变得不可达 -> 下次 GC 会被回收
        b = a;     // b 也指向 null

        // 建议 JVM 进行垃圾回收（仅是建议，不保证立即执行）
        System.gc();
        System.out.println("已触发 GC 建议，不可达对象将被回收");
    }
}`,
      qa: [
        ["如何判断一个对象可以被回收？", "可达性分析：从 GC Roots 出发遍历引用链，不可达的对象可回收。GC Roots 包括栈中引用、静态变量、常量、JNI 引用等。"],
        ["新生代为什么用复制算法？", "新生代对象朝生夕死，存活率低，复制算法只需复制少量存活对象，效率高且无碎片。"]
      ]
    },
    {
      id: "gc-collector",
      group: "垃圾回收",
      title: "垃圾收集器与 G1",
      tags: ["G1", "CMS", "停顿时间"],
      concept: [
        ["演进", "Serial（单线程）→ Parallel（吞吐优先，JDK 8 默认）→ CMS（并发低停顿，已废弃）→ <span class='key'>G1</span>（JDK 9+ 默认）→ ZGC/Shenandoah（超低延迟）。"],
        ["G1 特点", "把堆划分为多个 <span class='key'>Region</span>，不再物理分代；可预测停顿（设定目标停顿时间），优先回收垃圾最多的 Region（Garbage First）。"],
        ["选型", "吞吐优先选 Parallel；大堆低延迟选 G1；超大堆、亚毫秒停顿选 ZGC。"]
      ],
      code: `public class Demo {
    public static void main(String[] args) {
        // 查看与 GC 调优相关的常用启动参数（仅作说明，实际在 java 命令中指定）：
        //   -Xms512m -Xmx512m      初始/最大堆，建议设为相等避免动态扩容
        //   -XX:+UseG1GC           使用 G1 收集器
        //   -XX:MaxGCPauseMillis=200  期望最大停顿时间
        long max = Runtime.getRuntime().maxMemory() / 1024 / 1024;
        long total = Runtime.getRuntime().totalMemory() / 1024 / 1024;
        System.out.println("最大堆约 " + max + " MB");
        System.out.println("当前已分配堆约 " + total + " MB");
    }
}`,
      qa: [
        ["G1 收集器的特点？", "将堆分成多个 Region，可预测停顿时间，优先回收价值最高（垃圾最多）的区域，兼顾吞吐与低延迟，适合大堆。"],
        ["CMS 为什么被淘汰？", "采用标记-清除产生内存碎片、并发模式失败时退化为 Full GC、对 CPU 敏感。JDK 14 已移除，被 G1/ZGC 取代。"]
      ]
    },
    {
      id: "jvm-tuning",
      group: "调优与排查",
      title: "OOM 排查与常用工具",
      tags: ["面试高频", "OOM", "jstack", "MAT"],
      concept: [
        ["常见 OOM", "堆溢出（对象太多/内存泄漏）、元空间溢出（动态生成大量类）、栈溢出（递归过深）、GC overhead（回收效率极低）。"],
        ["排查工具", "<code>jps</code> 查进程、<code>jstat</code> 看 GC 频率、<code>jmap</code> 导出堆、<code>jstack</code> 看线程栈（死锁）、<span class='key'>MAT / Arthas</span> 分析堆快照。"],
        ["保命参数", "<code>-XX:+HeapDumpOnOutOfMemoryError</code> 在 OOM 时自动 dump 堆，便于事后用 MAT 分析泄漏点。"]
      ],
      code: `public class Demo {
    public static void main(String[] args) {
        // 排查线上问题的典型命令（在服务器终端执行，非 Java 代码）：
        //   jps -l                    找到 Java 进程 PID
        //   jstat -gcutil <pid> 1000  每秒打印各内存区使用率与 GC 次数
        //   jmap -dump:file=heap.hprof <pid>  导出堆快照, 用 MAT 找内存泄漏
        //   jstack <pid>              打印线程栈, 定位死锁/高 CPU 线程

        // 演示：获取当前线程数量（线上可据此发现线程泄漏）
        int threads = Thread.activeCount();
        System.out.println("当前活动线程数 = " + threads);
    }
}`,
      qa: [
        ["线上 OOM 如何排查？", "加 -XX:+HeapDumpOnOutOfMemoryError 自动导出堆，用 MAT 分析占用最大的对象与引用链定位泄漏；结合 jstat 看 GC、jstack 看线程。"],
        ["如何排查 CPU 飙高？", "top 找到高 CPU 进程，top -Hp 找到线程，把线程 ID 转十六进制，用 jstack 在堆栈里定位对应线程在执行什么代码。"]
      ]
    }
  ]
});
