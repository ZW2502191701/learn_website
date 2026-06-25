/* ============================================================
 * 常见集合篇 · 完整知识库（人工精修版）
 * 数据源: C:\AI_Test\learn\常见集合篇.pdf
 * 结构: 每个 unit = 一个知识点 { id, group, title, tags, concept[], code, qa[] }
 * 页面 index.html 读取本文件动态渲染。
 *
 * 说明: 本文件是"精修内容"，优先级高于解析脚本自动产出的 knowledge.js；
 *      当 output\knowledge.js 存在时，页面会用它补全其余 10 个章节，
 *      而"常见集合篇"始终采用本文件这份高质量内容。
 * ============================================================ */
(window.registerChapter || function(c){(window.JAVAPATH_CHAPTERS=window.JAVAPATH_CHAPTERS||[]).push(c);})({
  chapter: "常见集合篇",
  module: "语言核心",
  order: 1,
  groups: ["集合总览", "List", "Map", "Set", "并发集合", "底层与陷阱"],
  units: [
    /* ---------------- 集合总览 ---------------- */
    {
      id: "overview",
      group: "集合总览",
      title: "Java 集合体系总览",
      tags: ["Collection", "Map", "体系结构"],
      concept: [
        ["集合两大根接口", "Java 集合分为两大体系：<code>Collection</code>（单列，存元素）和 <code>Map</code>（双列，存键值对）。二者没有继承关系。"],
        ["Collection 三大子接口", "<ul><li><span class='key'>List</span>：有序、可重复、有索引（ArrayList / LinkedList / Vector）。</li><li><span class='key'>Set</span>：无序、不可重复、无索引（HashSet / LinkedHashSet / TreeSet）。</li><li><span class='key'>Queue</span>：队列（ArrayDeque / LinkedList / PriorityQueue）。</li></ul>"],
        ["Map 常见实现", "<code>HashMap</code>（无序）、<code>LinkedHashMap</code>（插入/访问有序）、<code>TreeMap</code>（按 key 排序）、<code>Hashtable</code>（线程安全，已过时）、<code>ConcurrentHashMap</code>（并发安全）。"],
        ["如何选型", "需要索引随机访问选 ArrayList；频繁头尾增删选 LinkedList/ArrayDeque；去重选 HashSet；去重且排序选 TreeSet；键值存储选 HashMap；并发场景选 ConcurrentHashMap。"]
      ],
      code: `import java.util.*;

public class Demo {
    public static void main(String[] args) {
        // List：有序、可重复，这里故意放入两个 "a"
        List<String> list = new ArrayList<>(List.of("a", "b", "a"));

        // Set：不可重复，用 list 构造时会自动去重 -> [a, b]
        Set<String> set = new HashSet<>(list);

        // Map：双列结构，这里用它统计每个元素出现的次数
        Map<String, Integer> map = new HashMap<>();
        for (String s : list) {
            // merge：key 不存在则放 1，存在则把旧值与 1 相加（计数神器）
            map.merge(s, 1, Integer::sum);
        }

        System.out.println("list = " + list);   // 保留重复
        System.out.println("set = " + set);      // 已去重
        System.out.println("count a = " + map.get("a")); // a 出现 2 次
    }
}`,
      qa: [
        ["Collection 和 Collections 有什么区别？", "<code>Collection</code> 是集合体系的根接口；<code>Collections</code> 是工具类，提供 sort、binarySearch、synchronizedList、unmodifiableList 等静态方法。"],
        ["List、Set、Map 的本质区别？", "List 有序可重复有索引；Set 不可重复；Map 存键值对。List/Set 属于 Collection，Map 独立。"]
      ]
    },

    /* ---------------- List ---------------- */
    {
      id: "arraylist",
      group: "List",
      title: "ArrayList 底层与扩容",
      tags: ["面试高频", "动态数组", "扩容1.5倍"],
      concept: [
        ["底层结构", "ArrayList 底层是 <span class='key'>Object[] 数组</span>，支持随机访问，<code>get(i)</code> 时间复杂度 O(1)。"],
        ["初始容量", "JDK 8 起，无参构造创建空数组 <code>{}</code>，第一次 <code>add</code> 时才扩容到 <span class='key'>10</span>（懒加载，省内存）。"],
        ["扩容机制", "容量不足时扩容为原来的 <span class='key'>1.5 倍</span>（<code>oldCapacity + (oldCapacity >> 1)</code>），通过 <code>Arrays.copyOf</code> 复制到新数组。"],
        ["增删性能", "尾部增删快 O(1)；中间增删需移动元素 O(n)。所以频繁中间插入应选 LinkedList。"]
      ],
      code: `import java.util.ArrayList;

public class Demo {
    public static void main(String[] args) {
        // 无参构造：底层先是一个空数组，第一次 add 才真正分配容量 10
        ArrayList<Integer> list = new ArrayList<>();

        // 连续添加 12 个元素：容量从 10 不够 -> 扩容到 10*1.5=15
        for (int i = 1; i <= 12; i++) {
            list.add(i);
        }

        System.out.println("size = " + list.size());   // 元素个数 12（不是容量）
        System.out.println("get(5) = " + list.get(5));  // 随机访问 O(1)，下标5 -> 第6个元素

        // 头部插入：下标 0 处插入，后面所有元素整体后移一位（O(n)，较慢）
        list.add(0, 99);
        System.out.println("after insert = " + list.get(0)); // 99
    }
}`,
      qa: [
        ["ArrayList 的扩容机制？", "默认容量 10，扩容为原来的 1.5 倍，用 Arrays.copyOf 拷贝旧数据。可在构造时指定初始容量避免频繁扩容。"],
        ["ArrayList 和 LinkedList 区别？", "ArrayList 基于数组，随机访问 O(1)、中间增删 O(n)；LinkedList 基于双向链表，头尾增删 O(1)、随机访问 O(n)。一般优先 ArrayList。"],
        ["ArrayList 线程安全吗？怎么保证安全？", "不安全。可用 <code>Collections.synchronizedList</code> 包装，或用 <code>CopyOnWriteArrayList</code>。"]
      ]
    },
    {
      id: "linkedlist",
      group: "List",
      title: "LinkedList 双向链表",
      tags: ["双向链表", "Deque"],
      concept: [
        ["底层结构", "LinkedList 是<span class='key'>双向链表</span>，每个节点 Node 含 prev、item、next，同时实现了 List 和 Deque，可当队列/栈用。"],
        ["性能特点", "头尾增删 O(1)；按索引访问需从头/尾遍历 O(n)；不支持高效随机访问。"],
        ["内存对比", "比 ArrayList 占用更多内存（每个元素额外存两个指针），但无需扩容拷贝。"]
      ],
      code: `import java.util.LinkedList;

public class Demo {
    public static void main(String[] args) {
        // LinkedList 实现了 Deque 接口，可当双端队列使用
        LinkedList<String> dq = new LinkedList<>();

        dq.addFirst("b");   // 头插 -> [b]
        dq.addFirst("a");   // 再头插 -> [a, b]
        dq.addLast("c");    // 尾插 -> [a, b, c]
        // 头尾增删都是 O(1)，因为只需改动头/尾节点的指针

        System.out.println("first = " + dq.getFirst()); // a
        System.out.println("last = " + dq.getLast());    // c
        System.out.println("list = " + dq);              // [a, b, c]
    }
}`,
      qa: [
        ["LinkedList 适合什么场景？", "频繁在头尾插入删除、且很少随机访问的场景，或需要把它当队列/双端队列/栈使用时。"],
        ["为什么实际开发很少用 LinkedList？", "随机访问慢、每个节点内存开销大、缓存命中率低。多数场景 ArrayList 性能更好。"]
      ]
    },

    /* ---------------- Map ---------------- */
    {
      id: "hashmap",
      group: "Map",
      title: "HashMap 底层结构与扩容",
      tags: ["面试高频", "数组+链表+红黑树"],
      concept: [
        ["底层结构", "JDK 8 中 HashMap = <span class='key'>数组 + 链表 + 红黑树</span>。数组每个槽位是一个 bucket。"],
        ["哈希定位", "用 <code>(h = key.hashCode()) ^ (h >>> 16)</code> 扰动，再与 <code>容量-1</code> 按位与得下标，让高位参与运算减少碰撞。"],
        ["树化阈值", "链表长度 ≥ <span class='key'>8</span> 且数组长度 ≥ 64 转红黑树（O(n)→O(log n)）；元素 ≤ 6 退化回链表。"],
        ["扩容机制", "默认容量 16，负载因子 0.75。元素数 > 容量×0.75 时容量翻倍。JDK 8 用高低位拆分迁移，无需重算哈希。"]
      ],
      code: `import java.util.HashMap;

public class Demo {
    public static void main(String[] args) {
        // 默认初始容量 16，负载因子 0.75（元素超过 12 个才扩容）
        HashMap<String, Integer> map = new HashMap<>();

        map.put("apple", 3);     // 计算 hash 定位桶后放入
        map.put("banana", 5);
        map.put("apple", 7);     // key 已存在 -> 覆盖旧值 3，size 不变

        System.out.println("size = " + map.size());            // 2（apple 只算一个）
        System.out.println("apple = " + map.get("apple"));      // 7（被覆盖后的值）
        System.out.println("含 banana? " + map.containsKey("banana")); // true
    }
}`,
      qa: [
        ["HashMap 链表为什么到 8 才转红黑树？", "红黑树节点占空间约为普通节点两倍。按泊松分布，理想哈希下单桶达 8 个的概率不足千万分之一，8 是空间与时间折中；退化阈值 6 避免在 7、8 间反复横跳。"],
        ["负载因子为什么是 0.75？", "空间利用率与冲突概率的平衡点。配合容量为 2 的幂，可用按位与替代取模。"],
        ["HashMap 的 put 流程？", "计算 hash → 定位桶 → 桶空直接放；否则遍历链表/树，key 相同则覆盖，否则尾插；链表过长则树化；最后判断是否需要扩容。"]
      ]
    },
    {
      id: "hashmap-keys",
      group: "Map",
      title: "为什么重写 equals 必须重写 hashCode",
      tags: ["面试高频", "equals", "hashCode"],
      concept: [
        ["核心约定", "相等的对象必须有相同的 hashCode。若只重写 equals 不重写 hashCode，两个逻辑相等的对象 hashCode 不同，会被放进不同的桶。"],
        ["导致的问题", "用自定义对象作为 HashMap 的 key 时，<code>get</code> 找不到本应存在的值，<code>contains</code> 误判，出现重复元素。"],
        ["定位过程", "HashMap 先比 hashCode 定位桶，再用 equals 在桶内比对。两者缺一不可。"]
      ],
      code: `import java.util.HashMap;
import java.util.Objects;

public class Demo {
    // 自定义类作为 HashMap 的 key 时，必须同时重写 equals 和 hashCode
    static class Point {
        int x, y;
        Point(int x, int y) { this.x = x; this.y = y; }

        // equals：定义"逻辑相等"——坐标相同即相等
        public boolean equals(Object o) {
            if (!(o instanceof Point)) return false;
            Point p = (Point) o;
            return x == p.x && y == p.y;
        }

        // hashCode：相等的对象必须返回相同的哈希值，否则会被分到不同的桶
        public int hashCode() {
            return Objects.hash(x, y);
        }
    }

    public static void main(String[] args) {
        HashMap<Point, String> map = new HashMap<>();
        map.put(new Point(1, 2), "A");

        // 用一个"内容相同"的新对象去取：
        // 因为正确重写了 hashCode+equals，能定位到同一个桶并匹配成功 -> 输出 A
        System.out.println(map.get(new Point(1, 2)));
    }
}`,
      qa: [
        ["只重写 equals 不重写 hashCode 会怎样？", "相等对象 hashCode 不同，被分到不同桶，HashMap 中 get 取不到、Set 里出现重复，违反约定。"],
        ["可以用可变对象做 key 吗？", "不建议。若 key 字段在放入后被修改，hashCode 改变，将再也定位不到原桶。"]
      ]
    },
    {
      id: "treemap",
      group: "Map",
      title: "LinkedHashMap 与 TreeMap",
      tags: ["有序Map", "红黑树", "LRU"],
      concept: [
        ["LinkedHashMap", "在 HashMap 基础上维护一条<span class='key'>双向链表</span>记录顺序，默认按插入顺序；构造时传 accessOrder=true 则按访问顺序，可用来实现 <span class='key'>LRU 缓存</span>。"],
        ["TreeMap", "底层<span class='key'>红黑树</span>，按 key 自然顺序或 Comparator 排序，增删查 O(log n)，支持范围查询（firstKey、floorKey、subMap 等）。"],
        ["选型", "要插入顺序选 LinkedHashMap；要 key 有序/范围查询选 TreeMap；只要快速键值存取选 HashMap。"]
      ],
      code: `import java.util.*;

public class Demo {
    public static void main(String[] args) {
        // TreeMap 底层是红黑树，会自动按 key 升序排列
        TreeMap<Integer, String> tm = new TreeMap<>();
        tm.put(3, "c");   // 故意乱序放入
        tm.put(1, "a");
        tm.put(2, "b");

        System.out.println("排序后 = " + tm);           // 自动变成 {1=a, 2=b, 3=c}
        System.out.println("最小 key = " + tm.firstKey()); // 1

        // ceilingKey(2)：返回 >= 2 的最小 key（范围查询能力，HashMap 没有）
        System.out.println(">=2 的 key = " + tm.ceilingKey(2)); // 2
    }
}`,
      qa: [
        ["如何用 LinkedHashMap 实现 LRU？", "构造时设 accessOrder=true，并重写 removeEldestEntry 在 size 超过容量时返回 true，淘汰最久未访问的头节点。"],
        ["TreeMap 的 key 有什么要求？", "必须可比较：实现 Comparable，或在构造时传入 Comparator，否则插入抛 ClassCastException。"]
      ]
    },

    /* ---------------- Set ---------------- */
    {
      id: "hashset",
      group: "Set",
      title: "HashSet / LinkedHashSet / TreeSet",
      tags: ["去重", "底层是Map"],
      concept: [
        ["HashSet 本质", "HashSet 底层就是一个 <span class='key'>HashMap</span>，元素作为 key，value 是一个固定的 PRESENT 占位对象。去重靠 hashCode + equals。"],
        ["三者区别", "<ul><li>HashSet：无序，查询最快。</li><li>LinkedHashSet：保持插入顺序。</li><li>TreeSet：基于 TreeMap，按元素排序。</li></ul>"],
        ["去重原理", "add 时先比 hashCode 定位桶，再用 equals 比对，相同则视为重复不加入。"]
      ],
      code: `import java.util.*;

public class Demo {
    public static void main(String[] args) {
        // HashSet 底层是 HashMap，元素作 key，所以天然去重、且无序
        Set<Integer> hs = new HashSet<>(List.of(3, 1, 2, 3, 1));

        // TreeSet 底层是 TreeMap，去重的同时还会按自然顺序排序
        Set<Integer> ts = new TreeSet<>(List.of(3, 1, 2, 3, 1));

        System.out.println("HashSet 去重 = " + hs);       // 去重，顺序不保证
        System.out.println("TreeSet 排序去重 = " + ts);   // [1, 2, 3] 去重且有序
    }
}`,
      qa: [
        ["HashSet 如何保证元素不重复？", "底层用 HashMap 存储，元素作 key；add 时通过 hashCode 与 equals 判断是否已存在。"],
        ["HashSet 是有序的吗？", "无序。需要顺序用 LinkedHashSet（插入序）或 TreeSet（排序）。"]
      ]
    },

    /* ---------------- 并发集合 ---------------- */
    {
      id: "concurrenthashmap",
      group: "并发集合",
      title: "ConcurrentHashMap 并发原理",
      tags: ["面试高频", "CAS", "synchronized"],
      concept: [
        ["JDK 7 vs JDK 8", "JDK 7 用 <span class='key'>分段锁 Segment</span>；JDK 8 取消分段锁，改为 <span class='key'>CAS + synchronized</span> 锁单个桶的头节点，锁粒度更细，并发度更高。"],
        ["读操作无锁", "value 用 volatile 修饰，读操作几乎不加锁，保证可见性。"],
        ["写流程", "桶为空用 CAS 写入；否则 synchronized 锁住头节点再插入；扩容时多线程可协同迁移（transfer）。"],
        ["为什么不允许 null", "ConcurrentHashMap 的 key、value 都不允许为 null，避免并发下 get 到 null 时无法区分'不存在'还是'值为 null'的二义性。"]
      ],
      code: `import java.util.concurrent.ConcurrentHashMap;

public class Demo {
    public static void main(String[] args) {
        // 线程安全的 Map，适合并发读写场景
        ConcurrentHashMap<String, Integer> m = new ConcurrentHashMap<>();

        m.put("a", 1);

        // merge：原子操作，多线程并发累加也不会丢失（线程安全的 a = a + 1）
        m.merge("a", 1, Integer::sum);

        // computeIfAbsent：key 不存在时才计算并放入，常用于懒初始化
        m.computeIfAbsent("b", k -> 10);

        System.out.println("a = " + m.get("a"));  // 2
        System.out.println("b = " + m.get("b"));  // 10
    }
}`,
      qa: [
        ["ConcurrentHashMap 为什么比 Hashtable 高效？", "Hashtable 用 synchronized 锁整个对象，全表互斥；ConcurrentHashMap 只锁单个桶头节点，多个桶可并发写。"],
        ["ConcurrentHashMap 的 key/value 能为 null 吗？", "都不能。并发下 get 返回 null 无法区分键不存在还是值为 null，故直接禁止。"],
        ["size() 准确吗？", "JDK 8 用 baseCount + CounterCell 数组分散统计，size 是一个近似值，并发下不保证强一致。"]
      ]
    },
    {
      id: "cow",
      group: "并发集合",
      title: "CopyOnWriteArrayList",
      tags: ["读多写少", "写时复制"],
      concept: [
        ["核心思想", "<span class='key'>写时复制</span>：写操作先复制一份新数组，在新数组上修改，再用新数组替换旧引用；读操作不加锁，直接读旧数组。"],
        ["适用场景", "读多写少（如黑白名单、监听器列表）。写操作开销大（每次复制整个数组），不适合频繁写。"],
        ["一致性", "弱一致性：迭代器遍历的是创建时的快照，遍历期间的修改不可见，但不会抛 ConcurrentModificationException。"]
      ],
      code: `import java.util.concurrent.CopyOnWriteArrayList;

public class Demo {
    public static void main(String[] args) {
        CopyOnWriteArrayList<String> list = new CopyOnWriteArrayList<>();
        list.add("a");
        list.add("b");

        // 迭代器遍历的是"开始遍历那一刻的快照"
        for (String s : list) {
            // 遍历过程中修改集合：换成普通 ArrayList 会抛 ConcurrentModificationException
            // 但 CopyOnWriteArrayList 写时复制，不影响当前快照 -> 不报错
            list.add("c");
            break;
        }
        System.out.println(list); // [a, b, c]
    }
}`,
      qa: [
        ["CopyOnWriteArrayList 的优缺点？", "优点：读无锁、并发读性能高、迭代不抛异常。缺点：写时复制内存开销大、数据弱一致（不保证实时）。"],
        ["它和 Collections.synchronizedList 区别？", "后者读写都加同一把锁；CopyOnWrite 读不加锁、只锁写，读多写少时性能更好。"]
      ]
    },

    /* ---------------- 底层与陷阱 ---------------- */
    {
      id: "failfast",
      group: "底层与陷阱",
      title: "fail-fast 与 fail-safe",
      tags: ["面试高频", "modCount", "迭代器"],
      concept: [
        ["fail-fast 快速失败", "ArrayList、HashMap 等遍历时若被结构性修改，迭代器检测到 <code>modCount != expectedModCount</code> 立即抛 <span class='key'>ConcurrentModificationException</span>。"],
        ["fail-safe 安全失败", "CopyOnWriteArrayList、ConcurrentHashMap 等在副本/快照上遍历，修改不影响遍历，不抛异常，但可能读不到最新数据。"],
        ["正确删除方式", "遍历中删除元素应使用<span class='key'>迭代器的 remove()</span>，而不是集合的 remove()，否则触发 fail-fast。"]
      ],
      code: `import java.util.*;

public class Demo {
    public static void main(String[] args) {
        List<Integer> list = new ArrayList<>(List.of(1, 2, 3, 4));

        // 遍历中删除元素：必须用"迭代器自己的 remove"，否则触发 fail-fast 抛异常
        Iterator<Integer> it = list.iterator();
        while (it.hasNext()) {
            int v = it.next();
            if (v % 2 == 0) {
                it.remove();   // 正确做法：迭代器删除，会同步更新 modCount
            }
        }
        System.out.println("剩余 = " + list); // [1, 3]
    }
}`,
      qa: [
        ["什么是 fail-fast？怎么避免？", "遍历时检测到结构性修改就抛 ConcurrentModificationException。避免方法：用迭代器的 remove，或改用并发集合（CopyOnWriteArrayList / ConcurrentHashMap）。"],
        ["for-each 删除元素为什么报错？", "for-each 本质是迭代器，调用集合的 remove 改变了 modCount，下次 next 校验失败抛异常。"]
      ]
    },
    {
      id: "thread-safe",
      group: "底层与陷阱",
      title: "HashMap 多线程下的问题",
      tags: ["线程不安全", "死循环", "数据丢失"],
      concept: [
        ["JDK 7 死循环", "JDK 7 扩容用<span class='key'>头插法</span>，多线程并发扩容可能形成<span class='key'>环形链表</span>，导致 get 时 CPU 100% 死循环。"],
        ["JDK 8 数据丢失", "JDK 8 改为尾插法解决了死循环，但并发 put 仍可能<span class='key'>覆盖丢数据</span>、size 不准。"],
        ["正确做法", "并发场景使用 <code>ConcurrentHashMap</code>，不要用 HashMap 也不要用已过时的 Hashtable。"]
      ],
      code: `import java.util.*;
import java.util.concurrent.*;

public class Demo {
    public static void main(String[] args) {
        // 错误示范（注释里说明）：多线程并发用 HashMap，
        // JDK7 可能成环死循环，JDK8 可能 put 互相覆盖、size 不准。

        // 正确做法：并发场景使用 ConcurrentHashMap
        Map<String, Integer> safe = new ConcurrentHashMap<>();
        safe.put("count", 0);

        // merge 是原子操作，模拟"线程安全地计数 +1"
        safe.merge("count", 1, Integer::sum);

        System.out.println("线程安全计数 = " + safe.get("count")); // 1
    }
}`,
      qa: [
        ["HashMap 在多线程下有什么问题？", "JDK 7 头插法扩容会成环导致死循环；JDK 8 虽改尾插，但并发 put 仍可能数据覆盖、丢失。应使用 ConcurrentHashMap。"],
        ["Hashtable 为什么被淘汰？", "它对整个表加 synchronized，并发性能差；ConcurrentHashMap 锁粒度更细，已全面取代它。"]
      ]
    }
  ]
});
