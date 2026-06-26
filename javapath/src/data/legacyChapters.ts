/* Generated from web/data/*.js by tools/convert-legacy-data.mjs. */
/* Generated at: 2026-06-26T00:43:01.680Z */
import type { LegacyChapter } from './legacyTypes';

export const legacyChapters = [
  {
    "chapter": "常见集合篇",
    "module": "语言核心",
    "order": 1,
    "groups": [
      "集合总览",
      "List",
      "Map",
      "Set",
      "并发集合",
      "底层与陷阱"
    ],
    "units": [
      {
        "id": "overview",
        "group": "集合总览",
        "title": "Java 集合体系总览",
        "tags": [
          "Collection",
          "Map",
          "体系结构"
        ],
        "concept": [
          [
            "集合两大根接口",
            "Java 集合分为两大体系：<code>Collection</code>（单列，存元素）和 <code>Map</code>（双列，存键值对）。二者没有继承关系。"
          ],
          [
            "Collection 三大子接口",
            "<ul><li><span class='key'>List</span>：有序、可重复、有索引（ArrayList / LinkedList / Vector）。</li><li><span class='key'>Set</span>：无序、不可重复、无索引（HashSet / LinkedHashSet / TreeSet）。</li><li><span class='key'>Queue</span>：队列（ArrayDeque / LinkedList / PriorityQueue）。</li></ul>"
          ],
          [
            "Map 常见实现",
            "<code>HashMap</code>（无序）、<code>LinkedHashMap</code>（插入/访问有序）、<code>TreeMap</code>（按 key 排序）、<code>Hashtable</code>（线程安全，已过时）、<code>ConcurrentHashMap</code>（并发安全）。"
          ],
          [
            "如何选型",
            "需要索引随机访问选 ArrayList；频繁头尾增删选 LinkedList/ArrayDeque；去重选 HashSet；去重且排序选 TreeSet；键值存储选 HashMap；并发场景选 ConcurrentHashMap。"
          ]
        ],
        "code": "import java.util.*;\n\npublic class Demo {\n    public static void main(String[] args) {\n        // List：有序、可重复，这里故意放入两个 \"a\"\n        List<String> list = new ArrayList<>(List.of(\"a\", \"b\", \"a\"));\n\n        // Set：不可重复，用 list 构造时会自动去重 -> [a, b]\n        Set<String> set = new HashSet<>(list);\n\n        // Map：双列结构，这里用它统计每个元素出现的次数\n        Map<String, Integer> map = new HashMap<>();\n        for (String s : list) {\n            // merge：key 不存在则放 1，存在则把旧值与 1 相加（计数神器）\n            map.merge(s, 1, Integer::sum);\n        }\n\n        System.out.println(\"list = \" + list);   // 保留重复\n        System.out.println(\"set = \" + set);      // 已去重\n        System.out.println(\"count a = \" + map.get(\"a\")); // a 出现 2 次\n    }\n}",
        "qa": [
          [
            "Collection 和 Collections 有什么区别？",
            "<code>Collection</code> 是集合体系的根接口；<code>Collections</code> 是工具类，提供 sort、binarySearch、synchronizedList、unmodifiableList 等静态方法。"
          ],
          [
            "List、Set、Map 的本质区别？",
            "List 有序可重复有索引；Set 不可重复；Map 存键值对。List/Set 属于 Collection，Map 独立。"
          ]
        ]
      },
      {
        "id": "arraylist",
        "group": "List",
        "title": "ArrayList 底层与扩容",
        "tags": [
          "面试高频",
          "动态数组",
          "扩容1.5倍"
        ],
        "concept": [
          [
            "底层结构",
            "ArrayList 底层是 <span class='key'>Object[] 数组</span>，支持随机访问，<code>get(i)</code> 时间复杂度 O(1)。"
          ],
          [
            "初始容量",
            "JDK 8 起，无参构造创建空数组 <code>{}</code>，第一次 <code>add</code> 时才扩容到 <span class='key'>10</span>（懒加载，省内存）。"
          ],
          [
            "扩容机制",
            "容量不足时扩容为原来的 <span class='key'>1.5 倍</span>（<code>oldCapacity + (oldCapacity >> 1)</code>），通过 <code>Arrays.copyOf</code> 复制到新数组。"
          ],
          [
            "增删性能",
            "尾部增删快 O(1)；中间增删需移动元素 O(n)。所以频繁中间插入应选 LinkedList。"
          ]
        ],
        "code": "import java.util.ArrayList;\n\npublic class Demo {\n    public static void main(String[] args) {\n        // 无参构造：底层先是一个空数组，第一次 add 才真正分配容量 10\n        ArrayList<Integer> list = new ArrayList<>();\n\n        // 连续添加 12 个元素：容量从 10 不够 -> 扩容到 10*1.5=15\n        for (int i = 1; i <= 12; i++) {\n            list.add(i);\n        }\n\n        System.out.println(\"size = \" + list.size());   // 元素个数 12（不是容量）\n        System.out.println(\"get(5) = \" + list.get(5));  // 随机访问 O(1)，下标5 -> 第6个元素\n\n        // 头部插入：下标 0 处插入，后面所有元素整体后移一位（O(n)，较慢）\n        list.add(0, 99);\n        System.out.println(\"after insert = \" + list.get(0)); // 99\n    }\n}",
        "qa": [
          [
            "ArrayList 的扩容机制？",
            "默认容量 10，扩容为原来的 1.5 倍，用 Arrays.copyOf 拷贝旧数据。可在构造时指定初始容量避免频繁扩容。"
          ],
          [
            "ArrayList 和 LinkedList 区别？",
            "ArrayList 基于数组，随机访问 O(1)、中间增删 O(n)；LinkedList 基于双向链表，头尾增删 O(1)、随机访问 O(n)。一般优先 ArrayList。"
          ],
          [
            "ArrayList 线程安全吗？怎么保证安全？",
            "不安全。可用 <code>Collections.synchronizedList</code> 包装，或用 <code>CopyOnWriteArrayList</code>。"
          ]
        ]
      },
      {
        "id": "linkedlist",
        "group": "List",
        "title": "LinkedList 双向链表",
        "tags": [
          "双向链表",
          "Deque"
        ],
        "concept": [
          [
            "底层结构",
            "LinkedList 是<span class='key'>双向链表</span>，每个节点 Node 含 prev、item、next，同时实现了 List 和 Deque，可当队列/栈用。"
          ],
          [
            "性能特点",
            "头尾增删 O(1)；按索引访问需从头/尾遍历 O(n)；不支持高效随机访问。"
          ],
          [
            "内存对比",
            "比 ArrayList 占用更多内存（每个元素额外存两个指针），但无需扩容拷贝。"
          ]
        ],
        "code": "import java.util.LinkedList;\n\npublic class Demo {\n    public static void main(String[] args) {\n        // LinkedList 实现了 Deque 接口，可当双端队列使用\n        LinkedList<String> dq = new LinkedList<>();\n\n        dq.addFirst(\"b\");   // 头插 -> [b]\n        dq.addFirst(\"a\");   // 再头插 -> [a, b]\n        dq.addLast(\"c\");    // 尾插 -> [a, b, c]\n        // 头尾增删都是 O(1)，因为只需改动头/尾节点的指针\n\n        System.out.println(\"first = \" + dq.getFirst()); // a\n        System.out.println(\"last = \" + dq.getLast());    // c\n        System.out.println(\"list = \" + dq);              // [a, b, c]\n    }\n}",
        "qa": [
          [
            "LinkedList 适合什么场景？",
            "频繁在头尾插入删除、且很少随机访问的场景，或需要把它当队列/双端队列/栈使用时。"
          ],
          [
            "为什么实际开发很少用 LinkedList？",
            "随机访问慢、每个节点内存开销大、缓存命中率低。多数场景 ArrayList 性能更好。"
          ]
        ]
      },
      {
        "id": "hashmap",
        "group": "Map",
        "title": "HashMap 底层结构与扩容",
        "tags": [
          "面试高频",
          "数组+链表+红黑树"
        ],
        "concept": [
          [
            "底层结构",
            "JDK 8 中 HashMap = <span class='key'>数组 + 链表 + 红黑树</span>。数组每个槽位是一个 bucket。"
          ],
          [
            "哈希定位",
            "用 <code>(h = key.hashCode()) ^ (h >>> 16)</code> 扰动，再与 <code>容量-1</code> 按位与得下标，让高位参与运算减少碰撞。"
          ],
          [
            "树化阈值",
            "链表长度 ≥ <span class='key'>8</span> 且数组长度 ≥ 64 转红黑树（O(n)→O(log n)）；元素 ≤ 6 退化回链表。"
          ],
          [
            "扩容机制",
            "默认容量 16，负载因子 0.75。元素数 > 容量×0.75 时容量翻倍。JDK 8 用高低位拆分迁移，无需重算哈希。"
          ]
        ],
        "code": "import java.util.HashMap;\n\npublic class Demo {\n    public static void main(String[] args) {\n        // 默认初始容量 16，负载因子 0.75（元素超过 12 个才扩容）\n        HashMap<String, Integer> map = new HashMap<>();\n\n        map.put(\"apple\", 3);     // 计算 hash 定位桶后放入\n        map.put(\"banana\", 5);\n        map.put(\"apple\", 7);     // key 已存在 -> 覆盖旧值 3，size 不变\n\n        System.out.println(\"size = \" + map.size());            // 2（apple 只算一个）\n        System.out.println(\"apple = \" + map.get(\"apple\"));      // 7（被覆盖后的值）\n        System.out.println(\"含 banana? \" + map.containsKey(\"banana\")); // true\n    }\n}",
        "qa": [
          [
            "HashMap 链表为什么到 8 才转红黑树？",
            "红黑树节点占空间约为普通节点两倍。按泊松分布，理想哈希下单桶达 8 个的概率不足千万分之一，8 是空间与时间折中；退化阈值 6 避免在 7、8 间反复横跳。"
          ],
          [
            "负载因子为什么是 0.75？",
            "空间利用率与冲突概率的平衡点。配合容量为 2 的幂，可用按位与替代取模。"
          ],
          [
            "HashMap 的 put 流程？",
            "计算 hash → 定位桶 → 桶空直接放；否则遍历链表/树，key 相同则覆盖，否则尾插；链表过长则树化；最后判断是否需要扩容。"
          ]
        ]
      },
      {
        "id": "hashmap-keys",
        "group": "Map",
        "title": "为什么重写 equals 必须重写 hashCode",
        "tags": [
          "面试高频",
          "equals",
          "hashCode"
        ],
        "concept": [
          [
            "核心约定",
            "相等的对象必须有相同的 hashCode。若只重写 equals 不重写 hashCode，两个逻辑相等的对象 hashCode 不同，会被放进不同的桶。"
          ],
          [
            "导致的问题",
            "用自定义对象作为 HashMap 的 key 时，<code>get</code> 找不到本应存在的值，<code>contains</code> 误判，出现重复元素。"
          ],
          [
            "定位过程",
            "HashMap 先比 hashCode 定位桶，再用 equals 在桶内比对。两者缺一不可。"
          ]
        ],
        "code": "import java.util.HashMap;\nimport java.util.Objects;\n\npublic class Demo {\n    // 自定义类作为 HashMap 的 key 时，必须同时重写 equals 和 hashCode\n    static class Point {\n        int x, y;\n        Point(int x, int y) { this.x = x; this.y = y; }\n\n        // equals：定义\"逻辑相等\"——坐标相同即相等\n        public boolean equals(Object o) {\n            if (!(o instanceof Point)) return false;\n            Point p = (Point) o;\n            return x == p.x && y == p.y;\n        }\n\n        // hashCode：相等的对象必须返回相同的哈希值，否则会被分到不同的桶\n        public int hashCode() {\n            return Objects.hash(x, y);\n        }\n    }\n\n    public static void main(String[] args) {\n        HashMap<Point, String> map = new HashMap<>();\n        map.put(new Point(1, 2), \"A\");\n\n        // 用一个\"内容相同\"的新对象去取：\n        // 因为正确重写了 hashCode+equals，能定位到同一个桶并匹配成功 -> 输出 A\n        System.out.println(map.get(new Point(1, 2)));\n    }\n}",
        "qa": [
          [
            "只重写 equals 不重写 hashCode 会怎样？",
            "相等对象 hashCode 不同，被分到不同桶，HashMap 中 get 取不到、Set 里出现重复，违反约定。"
          ],
          [
            "可以用可变对象做 key 吗？",
            "不建议。若 key 字段在放入后被修改，hashCode 改变，将再也定位不到原桶。"
          ]
        ]
      },
      {
        "id": "treemap",
        "group": "Map",
        "title": "LinkedHashMap 与 TreeMap",
        "tags": [
          "有序Map",
          "红黑树",
          "LRU"
        ],
        "concept": [
          [
            "LinkedHashMap",
            "在 HashMap 基础上维护一条<span class='key'>双向链表</span>记录顺序，默认按插入顺序；构造时传 accessOrder=true 则按访问顺序，可用来实现 <span class='key'>LRU 缓存</span>。"
          ],
          [
            "TreeMap",
            "底层<span class='key'>红黑树</span>，按 key 自然顺序或 Comparator 排序，增删查 O(log n)，支持范围查询（firstKey、floorKey、subMap 等）。"
          ],
          [
            "选型",
            "要插入顺序选 LinkedHashMap；要 key 有序/范围查询选 TreeMap；只要快速键值存取选 HashMap。"
          ]
        ],
        "code": "import java.util.*;\n\npublic class Demo {\n    public static void main(String[] args) {\n        // TreeMap 底层是红黑树，会自动按 key 升序排列\n        TreeMap<Integer, String> tm = new TreeMap<>();\n        tm.put(3, \"c\");   // 故意乱序放入\n        tm.put(1, \"a\");\n        tm.put(2, \"b\");\n\n        System.out.println(\"排序后 = \" + tm);           // 自动变成 {1=a, 2=b, 3=c}\n        System.out.println(\"最小 key = \" + tm.firstKey()); // 1\n\n        // ceilingKey(2)：返回 >= 2 的最小 key（范围查询能力，HashMap 没有）\n        System.out.println(\">=2 的 key = \" + tm.ceilingKey(2)); // 2\n    }\n}",
        "qa": [
          [
            "如何用 LinkedHashMap 实现 LRU？",
            "构造时设 accessOrder=true，并重写 removeEldestEntry 在 size 超过容量时返回 true，淘汰最久未访问的头节点。"
          ],
          [
            "TreeMap 的 key 有什么要求？",
            "必须可比较：实现 Comparable，或在构造时传入 Comparator，否则插入抛 ClassCastException。"
          ]
        ]
      },
      {
        "id": "hashset",
        "group": "Set",
        "title": "HashSet / LinkedHashSet / TreeSet",
        "tags": [
          "去重",
          "底层是Map"
        ],
        "concept": [
          [
            "HashSet 本质",
            "HashSet 底层就是一个 <span class='key'>HashMap</span>，元素作为 key，value 是一个固定的 PRESENT 占位对象。去重靠 hashCode + equals。"
          ],
          [
            "三者区别",
            "<ul><li>HashSet：无序，查询最快。</li><li>LinkedHashSet：保持插入顺序。</li><li>TreeSet：基于 TreeMap，按元素排序。</li></ul>"
          ],
          [
            "去重原理",
            "add 时先比 hashCode 定位桶，再用 equals 比对，相同则视为重复不加入。"
          ]
        ],
        "code": "import java.util.*;\n\npublic class Demo {\n    public static void main(String[] args) {\n        // HashSet 底层是 HashMap，元素作 key，所以天然去重、且无序\n        Set<Integer> hs = new HashSet<>(List.of(3, 1, 2, 3, 1));\n\n        // TreeSet 底层是 TreeMap，去重的同时还会按自然顺序排序\n        Set<Integer> ts = new TreeSet<>(List.of(3, 1, 2, 3, 1));\n\n        System.out.println(\"HashSet 去重 = \" + hs);       // 去重，顺序不保证\n        System.out.println(\"TreeSet 排序去重 = \" + ts);   // [1, 2, 3] 去重且有序\n    }\n}",
        "qa": [
          [
            "HashSet 如何保证元素不重复？",
            "底层用 HashMap 存储，元素作 key；add 时通过 hashCode 与 equals 判断是否已存在。"
          ],
          [
            "HashSet 是有序的吗？",
            "无序。需要顺序用 LinkedHashSet（插入序）或 TreeSet（排序）。"
          ]
        ]
      },
      {
        "id": "concurrenthashmap",
        "group": "并发集合",
        "title": "ConcurrentHashMap 并发原理",
        "tags": [
          "面试高频",
          "CAS",
          "synchronized"
        ],
        "concept": [
          [
            "JDK 7 vs JDK 8",
            "JDK 7 用 <span class='key'>分段锁 Segment</span>；JDK 8 取消分段锁，改为 <span class='key'>CAS + synchronized</span> 锁单个桶的头节点，锁粒度更细，并发度更高。"
          ],
          [
            "读操作无锁",
            "value 用 volatile 修饰，读操作几乎不加锁，保证可见性。"
          ],
          [
            "写流程",
            "桶为空用 CAS 写入；否则 synchronized 锁住头节点再插入；扩容时多线程可协同迁移（transfer）。"
          ],
          [
            "为什么不允许 null",
            "ConcurrentHashMap 的 key、value 都不允许为 null，避免并发下 get 到 null 时无法区分'不存在'还是'值为 null'的二义性。"
          ]
        ],
        "code": "import java.util.concurrent.ConcurrentHashMap;\n\npublic class Demo {\n    public static void main(String[] args) {\n        // 线程安全的 Map，适合并发读写场景\n        ConcurrentHashMap<String, Integer> m = new ConcurrentHashMap<>();\n\n        m.put(\"a\", 1);\n\n        // merge：原子操作，多线程并发累加也不会丢失（线程安全的 a = a + 1）\n        m.merge(\"a\", 1, Integer::sum);\n\n        // computeIfAbsent：key 不存在时才计算并放入，常用于懒初始化\n        m.computeIfAbsent(\"b\", k -> 10);\n\n        System.out.println(\"a = \" + m.get(\"a\"));  // 2\n        System.out.println(\"b = \" + m.get(\"b\"));  // 10\n    }\n}",
        "qa": [
          [
            "ConcurrentHashMap 为什么比 Hashtable 高效？",
            "Hashtable 用 synchronized 锁整个对象，全表互斥；ConcurrentHashMap 只锁单个桶头节点，多个桶可并发写。"
          ],
          [
            "ConcurrentHashMap 的 key/value 能为 null 吗？",
            "都不能。并发下 get 返回 null 无法区分键不存在还是值为 null，故直接禁止。"
          ],
          [
            "size() 准确吗？",
            "JDK 8 用 baseCount + CounterCell 数组分散统计，size 是一个近似值，并发下不保证强一致。"
          ]
        ]
      },
      {
        "id": "cow",
        "group": "并发集合",
        "title": "CopyOnWriteArrayList",
        "tags": [
          "读多写少",
          "写时复制"
        ],
        "concept": [
          [
            "核心思想",
            "<span class='key'>写时复制</span>：写操作先复制一份新数组，在新数组上修改，再用新数组替换旧引用；读操作不加锁，直接读旧数组。"
          ],
          [
            "适用场景",
            "读多写少（如黑白名单、监听器列表）。写操作开销大（每次复制整个数组），不适合频繁写。"
          ],
          [
            "一致性",
            "弱一致性：迭代器遍历的是创建时的快照，遍历期间的修改不可见，但不会抛 ConcurrentModificationException。"
          ]
        ],
        "code": "import java.util.concurrent.CopyOnWriteArrayList;\n\npublic class Demo {\n    public static void main(String[] args) {\n        CopyOnWriteArrayList<String> list = new CopyOnWriteArrayList<>();\n        list.add(\"a\");\n        list.add(\"b\");\n\n        // 迭代器遍历的是\"开始遍历那一刻的快照\"\n        for (String s : list) {\n            // 遍历过程中修改集合：换成普通 ArrayList 会抛 ConcurrentModificationException\n            // 但 CopyOnWriteArrayList 写时复制，不影响当前快照 -> 不报错\n            list.add(\"c\");\n            break;\n        }\n        System.out.println(list); // [a, b, c]\n    }\n}",
        "qa": [
          [
            "CopyOnWriteArrayList 的优缺点？",
            "优点：读无锁、并发读性能高、迭代不抛异常。缺点：写时复制内存开销大、数据弱一致（不保证实时）。"
          ],
          [
            "它和 Collections.synchronizedList 区别？",
            "后者读写都加同一把锁；CopyOnWrite 读不加锁、只锁写，读多写少时性能更好。"
          ]
        ]
      },
      {
        "id": "failfast",
        "group": "底层与陷阱",
        "title": "fail-fast 与 fail-safe",
        "tags": [
          "面试高频",
          "modCount",
          "迭代器"
        ],
        "concept": [
          [
            "fail-fast 快速失败",
            "ArrayList、HashMap 等遍历时若被结构性修改，迭代器检测到 <code>modCount != expectedModCount</code> 立即抛 <span class='key'>ConcurrentModificationException</span>。"
          ],
          [
            "fail-safe 安全失败",
            "CopyOnWriteArrayList、ConcurrentHashMap 等在副本/快照上遍历，修改不影响遍历，不抛异常，但可能读不到最新数据。"
          ],
          [
            "正确删除方式",
            "遍历中删除元素应使用<span class='key'>迭代器的 remove()</span>，而不是集合的 remove()，否则触发 fail-fast。"
          ]
        ],
        "code": "import java.util.*;\n\npublic class Demo {\n    public static void main(String[] args) {\n        List<Integer> list = new ArrayList<>(List.of(1, 2, 3, 4));\n\n        // 遍历中删除元素：必须用\"迭代器自己的 remove\"，否则触发 fail-fast 抛异常\n        Iterator<Integer> it = list.iterator();\n        while (it.hasNext()) {\n            int v = it.next();\n            if (v % 2 == 0) {\n                it.remove();   // 正确做法：迭代器删除，会同步更新 modCount\n            }\n        }\n        System.out.println(\"剩余 = \" + list); // [1, 3]\n    }\n}",
        "qa": [
          [
            "什么是 fail-fast？怎么避免？",
            "遍历时检测到结构性修改就抛 ConcurrentModificationException。避免方法：用迭代器的 remove，或改用并发集合（CopyOnWriteArrayList / ConcurrentHashMap）。"
          ],
          [
            "for-each 删除元素为什么报错？",
            "for-each 本质是迭代器，调用集合的 remove 改变了 modCount，下次 next 校验失败抛异常。"
          ]
        ]
      },
      {
        "id": "thread-safe",
        "group": "底层与陷阱",
        "title": "HashMap 多线程下的问题",
        "tags": [
          "线程不安全",
          "死循环",
          "数据丢失"
        ],
        "concept": [
          [
            "JDK 7 死循环",
            "JDK 7 扩容用<span class='key'>头插法</span>，多线程并发扩容可能形成<span class='key'>环形链表</span>，导致 get 时 CPU 100% 死循环。"
          ],
          [
            "JDK 8 数据丢失",
            "JDK 8 改为尾插法解决了死循环，但并发 put 仍可能<span class='key'>覆盖丢数据</span>、size 不准。"
          ],
          [
            "正确做法",
            "并发场景使用 <code>ConcurrentHashMap</code>，不要用 HashMap 也不要用已过时的 Hashtable。"
          ]
        ],
        "code": "import java.util.*;\nimport java.util.concurrent.*;\n\npublic class Demo {\n    public static void main(String[] args) {\n        // 错误示范（注释里说明）：多线程并发用 HashMap，\n        // JDK7 可能成环死循环，JDK8 可能 put 互相覆盖、size 不准。\n\n        // 正确做法：并发场景使用 ConcurrentHashMap\n        Map<String, Integer> safe = new ConcurrentHashMap<>();\n        safe.put(\"count\", 0);\n\n        // merge 是原子操作，模拟\"线程安全地计数 +1\"\n        safe.merge(\"count\", 1, Integer::sum);\n\n        System.out.println(\"线程安全计数 = \" + safe.get(\"count\")); // 1\n    }\n}",
        "qa": [
          [
            "HashMap 在多线程下有什么问题？",
            "JDK 7 头插法扩容会成环导致死循环；JDK 8 虽改尾插，但并发 put 仍可能数据覆盖、丢失。应使用 ConcurrentHashMap。"
          ],
          [
            "Hashtable 为什么被淘汰？",
            "它对整个表加 synchronized，并发性能差；ConcurrentHashMap 锁粒度更细，已全面取代它。"
          ]
        ]
      }
    ]
  },
  {
    "chapter": "多线程篇",
    "module": "语言核心",
    "order": 2,
    "groups": [
      "线程基础",
      "线程池",
      "锁与同步",
      "并发工具",
      "内存模型"
    ],
    "units": [
      {
        "id": "thread-create",
        "group": "线程基础",
        "title": "创建线程的几种方式与生命周期",
        "tags": [
          "面试高频",
          "Thread",
          "Runnable"
        ],
        "concept": [
          [
            "创建方式",
            "<ul><li>继承 <code>Thread</code> 重写 run（不推荐，单继承受限）。</li><li>实现 <code>Runnable</code>（推荐，解耦任务与线程）。</li><li>实现 <code>Callable</code> + <code>FutureTask</code>（有返回值、可抛异常）。</li><li>线程池 <code>ExecutorService</code>（生产首选）。</li></ul>"
          ],
          [
            "start 与 run 区别",
            "<code>start()</code> 由 JVM 新建线程并异步执行 run；直接调用 <code>run()</code> 只是在当前线程同步执行一个普通方法，<span class='key'>不会开新线程</span>。"
          ],
          [
            "六种状态",
            "NEW、RUNNABLE、BLOCKED、WAITING、TIMED_WAITING、TERMINATED。注意 Java 把「就绪」和「运行中」合并为 RUNNABLE。"
          ]
        ],
        "code": "public class Demo {\n    public static void main(String[] args) throws InterruptedException {\n        // 推荐方式：实现 Runnable，把\"任务\"和\"线程\"解耦\n        Runnable task = () -> {\n            // 这段代码运行在新线程里\n            System.out.println(\"子线程: \" + Thread.currentThread().getName());\n        };\n\n        Thread t = new Thread(task, \"worker-1\");\n        t.start();   // 正确：JVM 新建线程异步执行 run\n        // 注意：若写成 t.run() 则是在 main 线程同步执行，不会开新线程\n\n        t.join();    // 等待子线程结束后再继续（保证输出顺序）\n        System.out.println(\"主线程: \" + Thread.currentThread().getName());\n    }\n}",
        "qa": [
          [
            "start() 和 run() 有什么区别？",
            "start() 会新建线程并由 JVM 调度异步执行 run；直接调用 run() 只是普通方法调用，仍在当前线程执行，不产生并发。"
          ],
          [
            "Runnable 和 Callable 的区别？",
            "Runnable 的 run 无返回值、不能抛检查异常；Callable 的 call 有返回值、可抛异常，需配合 Future/FutureTask 获取结果。"
          ]
        ]
      },
      {
        "id": "threadpool",
        "group": "线程池",
        "title": "线程池核心参数与执行流程",
        "tags": [
          "面试高频",
          "ThreadPoolExecutor",
          "拒绝策略"
        ],
        "concept": [
          [
            "七大参数",
            "<code>corePoolSize</code> 核心线程数、<code>maximumPoolSize</code> 最大线程数、<code>keepAliveTime</code> 空闲存活时间、<code>workQueue</code> 任务队列、<code>threadFactory</code>、<code>handler</code> 拒绝策略、时间单位。"
          ],
          [
            "执行流程",
            "<ol><li>核心线程未满 → 新建核心线程。</li><li>核心已满 → 任务入队列。</li><li>队列满且未达 max → 新建非核心线程。</li><li>都满 → 触发<span class='key'>拒绝策略</span>。</li></ol>"
          ],
          [
            "为什么不用 Executors",
            "阿里规约禁止用 <code>Executors</code> 创建：FixedThreadPool/SingleThreadPool 用无界队列可能堆积 OOM；CachedThreadPool 可创建近无限线程导致 OOM。应手动 new ThreadPoolExecutor。"
          ]
        ],
        "code": "import java.util.concurrent.*;\n\npublic class Demo {\n    public static void main(String[] args) {\n        ThreadPoolExecutor pool = new ThreadPoolExecutor(\n            2,                              // corePoolSize：常驻 2 个核心线程\n            4,                              // maximumPoolSize：最多 4 个线程\n            60, TimeUnit.SECONDS,           // 非核心线程空闲 60s 后回收\n            new ArrayBlockingQueue<>(10),   // 有界队列，容量 10（防止 OOM）\n            new ThreadPoolExecutor.CallerRunsPolicy() // 拒绝策略：让提交者自己跑\n        );\n\n        for (int i = 0; i < 3; i++) {\n            final int id = i;\n            pool.execute(() -> System.out.println(\"执行任务 \" + id));\n        }\n        pool.shutdown();   // 不再接收新任务，执行完已提交的任务后关闭\n    }\n}",
        "qa": [
          [
            "线程池的执行流程？",
            "先用核心线程；核心满了进队列；队列满了且未到最大线程数则扩容线程；再满则走拒绝策略。"
          ],
          [
            "四种拒绝策略？",
            "AbortPolicy（抛异常，默认）、CallerRunsPolicy（调用者线程执行）、DiscardPolicy（静默丢弃）、DiscardOldestPolicy（丢弃最老任务再提交）。"
          ],
          [
            "核心线程数怎么设置？",
            "CPU 密集型约 N+1；IO 密集型约 2N（N 为核数），最终应结合压测与监控调整。"
          ]
        ]
      },
      {
        "id": "synchronized",
        "group": "锁与同步",
        "title": "synchronized 原理与锁升级",
        "tags": [
          "面试高频",
          "monitor",
          "锁升级"
        ],
        "concept": [
          [
            "底层原理",
            "synchronized 基于对象头的 <span class='key'>Monitor（管程）</span>。同步代码块编译为 <code>monitorenter / monitorexit</code> 指令；同步方法用 ACC_SYNCHRONIZED 标志。"
          ],
          [
            "锁升级",
            "JDK 6 后为优化性能引入锁升级：<span class='key'>无锁 → 偏向锁 → 轻量级锁（CAS 自旋）→ 重量级锁</span>，只能升级不能降级。"
          ],
          [
            "与 Lock 区别",
            "synchronized 是关键字、自动释放、非公平；ReentrantLock 是 API、需手动 unlock、可公平/可中断/可超时/可绑定多个 Condition。"
          ]
        ],
        "code": "public class Demo {\n    static int count = 0;\n    static final Object lock = new Object();\n\n    public static void main(String[] args) throws InterruptedException {\n        Runnable task = () -> {\n            for (int i = 0; i < 1000; i++) {\n                // synchronized 保证同一时刻只有一个线程能进入这段代码\n                // 从而让 count++ 这个\"读-改-写\"复合操作变成原子的\n                synchronized (lock) {\n                    count++;\n                }\n            }\n        };\n        Thread t1 = new Thread(task), t2 = new Thread(task);\n        t1.start(); t2.start();\n        t1.join(); t2.join();\n        // 有锁保护，结果必为 2000；若去掉 synchronized 会因竞态丢失更新\n        System.out.println(\"count = \" + count);\n    }\n}",
        "qa": [
          [
            "synchronized 的锁升级过程？",
            "无锁 → 偏向锁（同一线程重入）→ 轻量级锁（少量竞争，CAS 自旋）→ 重量级锁（竞争激烈，阻塞挂起）。"
          ],
          [
            "synchronized 和 ReentrantLock 区别？",
            "前者是 JVM 关键字、自动释放锁；后者是 JDK 类、需手动释放，但支持公平锁、可中断、超时获取、多 Condition。"
          ]
        ]
      },
      {
        "id": "aqs",
        "group": "锁与同步",
        "title": "AQS 与 ReentrantLock",
        "tags": [
          "AQS",
          "CAS",
          "CLH队列"
        ],
        "concept": [
          [
            "AQS 是什么",
            "<code>AbstractQueuedSynchronizer</code> 是并发包的基石，用一个 <span class='key'>volatile int state</span> 表示同步状态，配合 <span class='key'>CLH 双向队列</span>管理等待线程。ReentrantLock、CountDownLatch、Semaphore 都基于它。"
          ],
          [
            "加锁过程",
            "线程用 CAS 抢 state，成功即持锁；失败则包装成 Node 入队并 park 挂起，前驱释放锁时 unpark 唤醒。"
          ],
          [
            "公平 vs 非公平",
            "非公平锁（默认）允许「插队」抢锁，吞吐更高；公平锁严格按队列顺序，避免饥饿但开销大。"
          ]
        ],
        "code": "import java.util.concurrent.locks.ReentrantLock;\n\npublic class Demo {\n    static int count = 0;\n    // ReentrantLock 底层基于 AQS，true 表示公平锁\n    static final ReentrantLock lock = new ReentrantLock();\n\n    public static void main(String[] args) throws InterruptedException {\n        Runnable task = () -> {\n            for (int i = 0; i < 1000; i++) {\n                lock.lock();        // 获取锁，底层 CAS 修改 AQS 的 state\n                try {\n                    count++;        // 临界区\n                } finally {\n                    lock.unlock();  // 必须在 finally 释放，否则异常会导致死锁\n                }\n            }\n        };\n        Thread t1 = new Thread(task), t2 = new Thread(task);\n        t1.start(); t2.start(); t1.join(); t2.join();\n        System.out.println(\"count = \" + count); // 2000\n    }\n}",
        "qa": [
          [
            "AQS 的原理是什么？",
            "用 volatile 的 state 表示锁状态，CAS 保证修改原子性；抢锁失败的线程进入 CLH 队列阻塞，锁释放时唤醒后继节点。"
          ],
          [
            "为什么 unlock 要放在 finally？",
            "保证无论临界区是否抛异常，锁都能被释放，避免其它线程永远拿不到锁造成死锁。"
          ]
        ]
      },
      {
        "id": "cas-atomic",
        "group": "并发工具",
        "title": "CAS 与原子类、ABA 问题",
        "tags": [
          "面试高频",
          "CAS",
          "ABA"
        ],
        "concept": [
          [
            "CAS 是什么",
            "Compare-And-Swap：比较内存值与预期值，相等才写入新值，是一条 <span class='key'>CPU 原子指令</span>，无锁实现线程安全。"
          ],
          [
            "原子类",
            "<code>AtomicInteger</code>、<code>AtomicLong</code>、<code>LongAdder</code> 等基于 CAS 自旋实现。高并发计数 LongAdder 比 AtomicLong 更快（分段累加）。"
          ],
          [
            "ABA 问题",
            "值从 A→B→A，CAS 误以为没变。解决：加版本号，用 <code>AtomicStampedReference</code>。"
          ]
        ],
        "code": "import java.util.concurrent.atomic.AtomicInteger;\n\npublic class Demo {\n    public static void main(String[] args) throws InterruptedException {\n        // AtomicInteger 基于 CAS，无锁实现线程安全的自增\n        AtomicInteger count = new AtomicInteger(0);\n\n        Runnable task = () -> {\n            for (int i = 0; i < 1000; i++) {\n                // incrementAndGet 内部自旋 CAS：比较并交换，失败就重试\n                count.incrementAndGet();\n            }\n        };\n        Thread t1 = new Thread(task), t2 = new Thread(task);\n        t1.start(); t2.start(); t1.join(); t2.join();\n        System.out.println(\"count = \" + count.get()); // 2000，无需加锁\n    }\n}",
        "qa": [
          [
            "什么是 CAS？有什么缺点？",
            "比较并交换，无锁原子操作。缺点：自旋失败重试消耗 CPU、只能保证单个变量、存在 ABA 问题。"
          ],
          [
            "如何解决 ABA 问题？",
            "引入版本号/时间戳，每次修改递增，用 AtomicStampedReference 比较值的同时比较版本号。"
          ],
          [
            "LongAdder 为什么比 AtomicLong 快？",
            "AtomicLong 高并发下所有线程争同一个值，CAS 失败率高；LongAdder 把热点分散到多个 Cell 分段累加，最后求和，竞争更小。"
          ]
        ]
      },
      {
        "id": "jmm",
        "group": "内存模型",
        "title": "JMM 与 volatile",
        "tags": [
          "面试高频",
          "可见性",
          "有序性"
        ],
        "concept": [
          [
            "JMM 三大特性",
            "<span class='key'>原子性、可见性、有序性</span>。每个线程有自己的工作内存（缓存），与主内存交互可能导致可见性问题。"
          ],
          [
            "volatile 作用",
            "<ul><li>保证<span class='key'>可见性</span>：写立即刷主内存，读直接从主内存取。</li><li>禁止<span class='key'>指令重排序</span>（内存屏障）。</li><li><span class='key'>不保证原子性</span>：i++ 仍不安全。</li></ul>"
          ],
          [
            "happens-before",
            "JMM 用 happens-before 规则定义可见性：解锁先于加锁、volatile 写先于读、线程 start 先于线程内动作等。"
          ]
        ],
        "code": "public class Demo {\n    // volatile 保证 flag 的修改对其它线程立即可见\n    static volatile boolean flag = false;\n\n    public static void main(String[] args) throws InterruptedException {\n        Thread worker = new Thread(() -> {\n            // 若 flag 不是 volatile，worker 可能一直读自己缓存里的旧值 false，陷入死循环\n            while (!flag) { /* 空转等待 */ }\n            System.out.println(\"收到停止信号，退出\");\n        });\n        worker.start();\n\n        Thread.sleep(100);\n        flag = true;   // 主线程修改，volatile 保证 worker 能立刻看到\n        System.out.println(\"已发出停止信号\");\n    }\n}",
        "qa": [
          [
            "volatile 能保证原子性吗？",
            "不能。它只保证可见性和有序性。像 i++ 这种复合操作仍需 synchronized 或原子类。"
          ],
          [
            "volatile 和 synchronized 区别？",
            "volatile 只修饰变量、保证可见性与禁重排、不阻塞；synchronized 可修饰方法/代码块、保证原子性+可见性、会互斥阻塞。"
          ]
        ]
      }
    ]
  },
  {
    "chapter": "JVM虚拟机篇",
    "module": "语言核心",
    "order": 3,
    "groups": [
      "运行时数据区",
      "类加载",
      "垃圾回收",
      "调优与排查"
    ],
    "units": [
      {
        "id": "runtime-area",
        "group": "运行时数据区",
        "title": "JVM 内存结构",
        "tags": [
          "面试高频",
          "堆",
          "栈",
          "方法区"
        ],
        "concept": [
          [
            "线程私有",
            "<span class='key'>程序计数器</span>（当前字节码行号，唯一不 OOM）、<span class='key'>虚拟机栈</span>（栈帧：局部变量表/操作数栈）、<span class='key'>本地方法栈</span>。"
          ],
          [
            "线程共享",
            "<span class='key'>堆</span>（对象实例，GC 主战场，分新生代/老年代）、<span class='key'>方法区</span>（JDK 8 后为元空间 Metaspace，存类信息、运行时常量池，使用本地内存）。"
          ],
          [
            "常见异常",
            "栈深度过大 → StackOverflowError；堆放不下对象 → OutOfMemoryError: Java heap space。"
          ]
        ],
        "code": "public class Demo {\n    // 成员变量随对象存在\"堆\"中\n    int instanceField = 1;\n    // 静态变量在方法区（元空间）\n    static int staticField = 2;\n\n    public static void main(String[] args) {\n        // 局部变量 a 存在虚拟机栈的\"局部变量表\"里\n        int a = 10;\n        // new 出来的对象实例存在\"堆\"中，obj 这个引用存在栈里\n        Demo obj = new Demo();\n\n        System.out.println(\"局部变量 a = \" + a);\n        System.out.println(\"堆中实例字段 = \" + obj.instanceField);\n        System.out.println(\"方法区静态字段 = \" + staticField);\n    }\n}",
        "qa": [
          [
            "JVM 运行时数据区有哪些？",
            "程序计数器、虚拟机栈、本地方法栈（线程私有）；堆、方法区/元空间（线程共享）。"
          ],
          [
            "JDK 8 为什么用元空间取代永久代？",
            "永久代在堆内、大小难调易 OOM；元空间使用本地内存，默认只受物理内存限制，更灵活，类元数据回收也更彻底。"
          ]
        ]
      },
      {
        "id": "classloader",
        "group": "类加载",
        "title": "类加载过程与双亲委派",
        "tags": [
          "面试高频",
          "双亲委派"
        ],
        "concept": [
          [
            "加载过程",
            "<span class='key'>加载 → 验证 → 准备 → 解析 → 初始化</span>。准备阶段给静态变量赋默认值（0/null），初始化阶段才赋真正的值并执行静态代码块。"
          ],
          [
            "双亲委派",
            "类加载请求<span class='key'>先委派给父加载器</span>，父加载不了才自己加载。顺序：Bootstrap → Extension → Application → 自定义。"
          ],
          [
            "好处",
            "避免核心类被篡改（如自写 java.lang.String 不会被加载），保证类的唯一性与安全。"
          ]
        ],
        "code": "public class Demo {\n    public static void main(String[] args) {\n        // 应用类加载器（AppClassLoader）：加载我们自己写的类\n        ClassLoader app = Demo.class.getClassLoader();\n        System.out.println(\"加载 Demo 的: \" + app);\n\n        // 向上查看父加载器：扩展/平台类加载器\n        System.out.println(\"父加载器: \" + app.getParent());\n\n        // 核心类 String 由 Bootstrap 加载，是 C++ 实现，返回 null（双亲委派的体现）\n        System.out.println(\"加载 String 的: \" + String.class.getClassLoader());\n    }\n}",
        "qa": [
          [
            "什么是双亲委派机制？",
            "类加载时先委托父加载器尝试加载，父加载不到才由子加载器加载，自底向上委派、自顶向下加载。"
          ],
          [
            "如何打破双亲委派？",
            "重写 loadClass 方法（如 Tomcat 的 WebAppClassLoader 优先加载自己的类），或用 SPI/线程上下文类加载器（如 JDBC）。"
          ]
        ]
      },
      {
        "id": "gc-algo",
        "group": "垃圾回收",
        "title": "垃圾判定与回收算法",
        "tags": [
          "面试高频",
          "可达性分析",
          "三色标记"
        ],
        "concept": [
          [
            "如何判断垃圾",
            "<span class='key'>可达性分析</span>：从 GC Roots（栈引用、静态变量、常量等）出发，不可达的对象判为垃圾。引用计数法无法解决循环引用，JVM 不用。"
          ],
          [
            "回收算法",
            "<ul><li>标记-清除：有内存碎片。</li><li>标记-复制：用于新生代，无碎片但浪费一半空间。</li><li>标记-整理：用于老年代，无碎片但移动成本高。</li></ul>"
          ],
          [
            "分代回收",
            "新生代（Eden + 两个 Survivor，8:1:1）用复制算法；对象熬过多次 GC 进入老年代，用标记-整理。"
          ]
        ],
        "code": "public class Demo {\n    public static void main(String[] args) {\n        Object a = new Object();   // a 是 GC Root 可达，不会被回收\n        Object b = new Object();\n\n        a = null;  // 断开引用：原来的对象变得不可达 -> 下次 GC 会被回收\n        b = a;     // b 也指向 null\n\n        // 建议 JVM 进行垃圾回收（仅是建议，不保证立即执行）\n        System.gc();\n        System.out.println(\"已触发 GC 建议，不可达对象将被回收\");\n    }\n}",
        "qa": [
          [
            "如何判断一个对象可以被回收？",
            "可达性分析：从 GC Roots 出发遍历引用链，不可达的对象可回收。GC Roots 包括栈中引用、静态变量、常量、JNI 引用等。"
          ],
          [
            "新生代为什么用复制算法？",
            "新生代对象朝生夕死，存活率低，复制算法只需复制少量存活对象，效率高且无碎片。"
          ]
        ]
      },
      {
        "id": "gc-collector",
        "group": "垃圾回收",
        "title": "垃圾收集器与 G1",
        "tags": [
          "G1",
          "CMS",
          "停顿时间"
        ],
        "concept": [
          [
            "演进",
            "Serial（单线程）→ Parallel（吞吐优先，JDK 8 默认）→ CMS（并发低停顿，已废弃）→ <span class='key'>G1</span>（JDK 9+ 默认）→ ZGC/Shenandoah（超低延迟）。"
          ],
          [
            "G1 特点",
            "把堆划分为多个 <span class='key'>Region</span>，不再物理分代；可预测停顿（设定目标停顿时间），优先回收垃圾最多的 Region（Garbage First）。"
          ],
          [
            "选型",
            "吞吐优先选 Parallel；大堆低延迟选 G1；超大堆、亚毫秒停顿选 ZGC。"
          ]
        ],
        "code": "public class Demo {\n    public static void main(String[] args) {\n        // 查看与 GC 调优相关的常用启动参数（仅作说明，实际在 java 命令中指定）：\n        //   -Xms512m -Xmx512m      初始/最大堆，建议设为相等避免动态扩容\n        //   -XX:+UseG1GC           使用 G1 收集器\n        //   -XX:MaxGCPauseMillis=200  期望最大停顿时间\n        long max = Runtime.getRuntime().maxMemory() / 1024 / 1024;\n        long total = Runtime.getRuntime().totalMemory() / 1024 / 1024;\n        System.out.println(\"最大堆约 \" + max + \" MB\");\n        System.out.println(\"当前已分配堆约 \" + total + \" MB\");\n    }\n}",
        "qa": [
          [
            "G1 收集器的特点？",
            "将堆分成多个 Region，可预测停顿时间，优先回收价值最高（垃圾最多）的区域，兼顾吞吐与低延迟，适合大堆。"
          ],
          [
            "CMS 为什么被淘汰？",
            "采用标记-清除产生内存碎片、并发模式失败时退化为 Full GC、对 CPU 敏感。JDK 14 已移除，被 G1/ZGC 取代。"
          ]
        ]
      },
      {
        "id": "jvm-tuning",
        "group": "调优与排查",
        "title": "OOM 排查与常用工具",
        "tags": [
          "面试高频",
          "OOM",
          "jstack",
          "MAT"
        ],
        "concept": [
          [
            "常见 OOM",
            "堆溢出（对象太多/内存泄漏）、元空间溢出（动态生成大量类）、栈溢出（递归过深）、GC overhead（回收效率极低）。"
          ],
          [
            "排查工具",
            "<code>jps</code> 查进程、<code>jstat</code> 看 GC 频率、<code>jmap</code> 导出堆、<code>jstack</code> 看线程栈（死锁）、<span class='key'>MAT / Arthas</span> 分析堆快照。"
          ],
          [
            "保命参数",
            "<code>-XX:+HeapDumpOnOutOfMemoryError</code> 在 OOM 时自动 dump 堆，便于事后用 MAT 分析泄漏点。"
          ]
        ],
        "code": "public class Demo {\n    public static void main(String[] args) {\n        // 排查线上问题的典型命令（在服务器终端执行，非 Java 代码）：\n        //   jps -l                    找到 Java 进程 PID\n        //   jstat -gcutil <pid> 1000  每秒打印各内存区使用率与 GC 次数\n        //   jmap -dump:file=heap.hprof <pid>  导出堆快照, 用 MAT 找内存泄漏\n        //   jstack <pid>              打印线程栈, 定位死锁/高 CPU 线程\n\n        // 演示：获取当前线程数量（线上可据此发现线程泄漏）\n        int threads = Thread.activeCount();\n        System.out.println(\"当前活动线程数 = \" + threads);\n    }\n}",
        "qa": [
          [
            "线上 OOM 如何排查？",
            "加 -XX:+HeapDumpOnOutOfMemoryError 自动导出堆，用 MAT 分析占用最大的对象与引用链定位泄漏；结合 jstat 看 GC、jstack 看线程。"
          ],
          [
            "如何排查 CPU 飙高？",
            "top 找到高 CPU 进程，top -Hp 找到线程，把线程 ID 转十六进制，用 jstack 在堆栈里定位对应线程在执行什么代码。"
          ]
        ]
      }
    ]
  },
  {
    "chapter": "MySQL",
    "module": "数据存储",
    "order": 4,
    "lang": "sql",
    "groups": [
      "索引",
      "事务",
      "锁",
      "优化"
    ],
    "units": [
      {
        "id": "index-structure",
        "group": "索引",
        "title": "B+ 树索引原理",
        "tags": [
          "面试高频",
          "B+树",
          "InnoDB"
        ],
        "concept": [
          [
            "为什么用 B+ 树",
            "<ul><li>矮胖结构（3~4 层可存千万级数据），磁盘 IO 少。</li><li>非叶子节点只存索引、不存数据，单页能放更多键。</li><li>叶子节点用<span class='key'>双向链表</span>相连，范围查询高效。</li></ul>"
          ],
          [
            "聚簇 vs 二级索引",
            "InnoDB 主键索引是<span class='key'>聚簇索引</span>，叶子节点直接存整行数据；二级索引叶子存主键值，需<span class='key'>回表</span>再查一次聚簇索引。"
          ],
          [
            "覆盖索引",
            "查询的列都在索引里，无需回表，性能更好。这也是「不要 SELECT *」的原因之一。"
          ]
        ],
        "code": "-- 创建联合索引（遵循最左前缀原则）\nCREATE INDEX idx_name_age ON user(name, age);\n\n-- 覆盖索引：要查的 name、age 都在索引中，无需回表\nEXPLAIN SELECT name, age FROM user WHERE name = 'Tom';\n\n-- 会回表：select * 需要拿到完整行，二级索引 -> 主键 -> 聚簇索引\nEXPLAIN SELECT * FROM user WHERE name = 'Tom';",
        "qa": [
          [
            "为什么 MySQL 用 B+ 树而不用 B 树/红黑树？",
            "B+ 树非叶子只存键、更矮胖、IO 更少；叶子链表利于范围查询。红黑树太高、IO 次数多，不适合磁盘存储。"
          ],
          [
            "什么是回表？如何避免？",
            "用二级索引查到主键后再回聚簇索引取整行，叫回表。用覆盖索引（查询列都在索引中）可避免。"
          ]
        ]
      },
      {
        "id": "index-fail",
        "group": "索引",
        "title": "索引失效与最左前缀",
        "tags": [
          "面试高频",
          "最左前缀",
          "索引优化"
        ],
        "concept": [
          [
            "最左前缀原则",
            "联合索引 (a,b,c) 只有从最左列连续使用才生效。<code>WHERE b=1</code> 不走索引，<code>WHERE a=1 AND b=2</code> 走 a、b。"
          ],
          [
            "常见失效场景",
            "<ul><li>对索引列做<span class='key'>运算/函数</span>。</li><li>类型隐式转换（字符串列传数字）。</li><li>以 <code>%xx</code> 开头的 like。</li><li>OR 连接非索引列。</li></ul>"
          ],
          [
            "怎么验证",
            "用 <code>EXPLAIN</code> 看 type（避免 ALL 全表）、key（实际用的索引）、Extra（Using index 表示覆盖索引）。"
          ]
        ],
        "code": "-- 索引：idx_name_age (name, age)\n\n-- ✅ 命中（最左前缀）\nSELECT * FROM user WHERE name = 'Tom' AND age = 18;\n\n-- ❌ 失效：跳过最左列 name，直接用 age\nSELECT * FROM user WHERE age = 18;\n\n-- ❌ 失效：对索引列使用函数\nSELECT * FROM user WHERE LEFT(name, 1) = 'T';\n\n-- ❌ 失效：左模糊\nSELECT * FROM user WHERE name LIKE '%om';",
        "qa": [
          [
            "哪些情况会导致索引失效？",
            "对索引列运算/用函数、类型隐式转换、左模糊 like '%x'、OR 连接非索引列、不满足最左前缀等。"
          ],
          [
            "EXPLAIN 重点看哪些字段？",
            "type（访问类型，至少要到 range/ref，避免 ALL）、key（实际用的索引）、rows（扫描行数）、Extra（Using index / Using filesort）。"
          ]
        ]
      },
      {
        "id": "transaction",
        "group": "事务",
        "title": "事务隔离级别与 MVCC",
        "tags": [
          "面试高频",
          "ACID",
          "MVCC"
        ],
        "concept": [
          [
            "ACID",
            "原子性（undo log）、一致性、隔离性（锁 + MVCC）、持久性（redo log）。"
          ],
          [
            "四种隔离级别",
            "读未提交 → 读已提交 → <span class='key'>可重复读（InnoDB 默认）</span> → 串行化。隔离级别越高，并发越低。"
          ],
          [
            "MVCC",
            "多版本并发控制：通过 <span class='key'>undo log 版本链 + ReadView</span> 实现快照读，使读写不阻塞。RC 每次读建 ReadView，RR 事务首次读时建一次，从而避免不可重复读。"
          ]
        ],
        "code": "-- 查看与设置隔离级别\nSELECT @@transaction_isolation;\nSET SESSION TRANSACTION ISOLATION LEVEL READ COMMITTED;\n\n-- 一个标准事务\nSTART TRANSACTION;\nUPDATE account SET balance = balance - 100 WHERE id = 1;\nUPDATE account SET balance = balance + 100 WHERE id = 2;\nCOMMIT;   -- 全部成功才提交；中途出错可 ROLLBACK 回滚",
        "qa": [
          [
            "有哪些隔离级别？分别解决什么问题？",
            "读未提交（有脏读）、读已提交（解决脏读，有不可重复读）、可重复读（解决不可重复读，InnoDB 用间隙锁基本解决幻读）、串行化（全解决，性能最低）。"
          ],
          [
            "MVCC 的原理？",
            "靠隐藏列（事务ID、回滚指针）形成 undo log 版本链，配合 ReadView 判断版本可见性，实现非阻塞的一致性读。"
          ]
        ]
      },
      {
        "id": "lock",
        "group": "锁",
        "title": "InnoDB 锁机制",
        "tags": [
          "行锁",
          "间隙锁",
          "死锁"
        ],
        "concept": [
          [
            "锁粒度",
            "表锁（开销小、并发低）、<span class='key'>行锁</span>（InnoDB 支持，基于索引加锁；若未命中索引会退化为表锁）。"
          ],
          [
            "行锁类型",
            "记录锁（锁某行）、<span class='key'>间隙锁</span>（锁区间，防幻读）、临键锁（记录+间隙，RR 默认）。"
          ],
          [
            "死锁",
            "两事务互相持有对方需要的锁。InnoDB 会自动检测并回滚代价小的事务。避免：固定加锁顺序、缩小事务、降低隔离级别。"
          ]
        ],
        "code": "-- 当前读会加锁（RR 级别下加临键锁，防止幻读）\nSTART TRANSACTION;\nSELECT * FROM user WHERE age = 18 FOR UPDATE;  -- 排他锁\n-- ... 业务处理 ...\nCOMMIT;  -- 提交后释放锁\n\n-- 注意：若 age 没有索引，行锁会退化成表锁，锁住整张表",
        "qa": [
          [
            "InnoDB 的行锁会升级为表锁吗？",
            "会。行锁是加在索引上的，如果查询条件没有命中索引，InnoDB 无法精确锁行，会退化为表锁。"
          ],
          [
            "如何避免死锁？",
            "保证多个事务以相同顺序访问资源、尽量缩短事务、一次锁定所需全部资源、合理使用索引减少锁范围。"
          ]
        ]
      },
      {
        "id": "slow-query",
        "group": "优化",
        "title": "慢查询优化思路",
        "tags": [
          "面试高频",
          "慢查询",
          "调优"
        ],
        "concept": [
          [
            "定位",
            "开启慢查询日志（<code>slow_query_log</code>）记录超过阈值的 SQL，再用 <code>EXPLAIN</code> / <code>SHOW PROFILE</code> 分析执行计划。"
          ],
          [
            "常见手段",
            "<ul><li>加合适索引、用覆盖索引。</li><li>避免 SELECT *、深分页用游标/延迟关联。</li><li>大表拆分、冷热分离。</li><li>用 limit 限制、避免 N+1。</li></ul>"
          ],
          [
            "深分页优化",
            "<code>LIMIT 1000000, 10</code> 要扫百万行。改为 <code>WHERE id > 上次最大id LIMIT 10</code> 利用索引跳过。"
          ]
        ],
        "code": "-- 慢查询：深分页，扫描并丢弃前 100 万行，很慢\nSELECT * FROM orders ORDER BY id LIMIT 1000000, 10;\n\n-- 优化①：延迟关联，先用覆盖索引取主键，再回表\nSELECT * FROM orders o\nJOIN (SELECT id FROM orders ORDER BY id LIMIT 1000000, 10) t\nON o.id = t.id;\n\n-- 优化②：游标分页（记住上一页最大 id），最快\nSELECT * FROM orders WHERE id > 1000000 ORDER BY id LIMIT 10;",
        "qa": [
          [
            "如何优化一条慢 SQL？",
            "先用慢查询日志定位、EXPLAIN 看执行计划；再针对性加索引/覆盖索引、改写 SQL、避免全表扫描和深分页、必要时分库分表。"
          ],
          [
            "深分页为什么慢，怎么优化？",
            "LIMIT m,n 要扫描并丢弃前 m 行。可用延迟关联或游标分页（WHERE id > last_id）借助索引直接定位。"
          ]
        ]
      }
    ]
  },
  {
    "chapter": "Redis",
    "module": "数据存储",
    "order": 5,
    "lang": "redis",
    "groups": [
      "数据类型",
      "持久化",
      "高可用",
      "缓存问题"
    ],
    "units": [
      {
        "id": "datatypes",
        "group": "数据类型",
        "title": "五种基本数据类型及场景",
        "tags": [
          "面试高频",
          "String",
          "Hash",
          "ZSet"
        ],
        "concept": [
          [
            "五种类型",
            "<ul><li><span class='key'>String</span>：缓存、计数器、分布式锁。</li><li><span class='key'>Hash</span>：存对象（用户信息）。</li><li><span class='key'>List</span>：消息队列、最新列表。</li><li><span class='key'>Set</span>：去重、共同好友（交集）。</li><li><span class='key'>ZSet</span>：排行榜、延时队列。</li></ul>"
          ],
          [
            "底层编码",
            "同一类型按数据量自动切换编码，如 ZSet 小数据用 ziplist，大数据用 skiplist+hash，兼顾内存与性能。"
          ],
          [
            "单线程为何快",
            "纯内存操作 + IO 多路复用 + 单线程避免锁竞争与上下文切换。"
          ]
        ],
        "code": "# String：计数器\nINCR article:1001:views        # 浏览量 +1，原子操作\n\n# Hash：存储一个用户对象\nHSET user:1 name Tom age 18\nHGET user:1 name               # -> Tom\n\n# ZSet：游戏排行榜（按分数排序）\nZADD rank 100 Tom 95 Jerry\nZREVRANGE rank 0 2 WITHSCORES  # 取分数最高的前 3 名",
        "qa": [
          [
            "Redis 为什么单线程还这么快？",
            "数据在内存、避免磁盘 IO；用 IO 多路复用处理大量连接；单线程省去锁和上下文切换开销。(注：Redis 6 网络 IO 引入多线程，命令执行仍单线程)"
          ],
          [
            "排行榜用什么类型？",
            "ZSet（有序集合）。用 ZADD 加分、ZREVRANGE 取榜，分数自动排序。"
          ]
        ]
      },
      {
        "id": "persistence",
        "group": "持久化",
        "title": "RDB 与 AOF",
        "tags": [
          "面试高频",
          "RDB",
          "AOF"
        ],
        "concept": [
          [
            "RDB",
            "<span class='key'>快照</span>：某时刻全量数据写入二进制文件。体积小、恢复快，但可能丢失最后一次快照后的数据。"
          ],
          [
            "AOF",
            "<span class='key'>追加日志</span>：记录每条写命令。数据更安全（可每秒刷盘），但文件大、恢复慢。"
          ],
          [
            "混合持久化",
            "Redis 4.0+ 支持 RDB + AOF 混合：AOF 重写时用 RDB 存全量、增量用 AOF，兼顾恢复速度与数据安全，推荐开启。"
          ]
        ],
        "code": "# RDB：手动触发快照（BGSAVE 后台 fork 子进程，不阻塞主线程）\nBGSAVE\n\n# 配置示例（redis.conf）：\n#   save 900 1          900秒内有1次修改就触发RDB\n#   appendonly yes      开启 AOF\n#   appendfsync everysec  每秒刷盘（性能与安全的平衡点）\n#   aof-use-rdb-preamble yes  开启混合持久化\n\nCONFIG GET save        # 查看当前 RDB 触发规则",
        "qa": [
          [
            "RDB 和 AOF 怎么选？",
            "追求性能、能容忍少量丢失用 RDB；追求数据安全用 AOF（everysec）。生产推荐开启混合持久化，兼顾两者。"
          ],
          [
            "AOF 文件会无限增长吗？",
            "不会。Redis 会触发 AOF 重写（rewrite），用最小命令集重建数据库状态，压缩文件体积。"
          ]
        ]
      },
      {
        "id": "ha",
        "group": "高可用",
        "title": "主从、哨兵与集群",
        "tags": [
          "面试高频",
          "哨兵",
          "Cluster"
        ],
        "concept": [
          [
            "主从复制",
            "主写从读，读写分离分摊压力。从节点首次全量同步（RDB），之后增量同步命令。"
          ],
          [
            "哨兵 Sentinel",
            "<span class='key'>监控 + 自动故障转移</span>：主节点宕机时，哨兵选举新主并通知客户端，实现高可用。"
          ],
          [
            "Cluster 集群",
            "数据分片到 <span class='key'>16384 个 slot</span>，多主多从横向扩展，解决单机内存与吞吐瓶颈。"
          ]
        ],
        "code": "# 主从：从节点配置指向主节点\nREPLICAOF 192.168.1.10 6379\n\n# 查看复制状态（角色、连接的从节点、同步偏移量）\nINFO replication\n\n# 集群：查看槽位分配与节点状态\nCLUSTER INFO\nCLUSTER NODES",
        "qa": [
          [
            "哨兵的作用是什么？",
            "监控主从节点健康、在主节点故障时自动选举新主并完成故障转移、向客户端通知新的主节点地址。"
          ],
          [
            "Redis Cluster 如何分片？",
            "把 key 通过 CRC16 取模映射到 16384 个 slot，slot 再分配给不同主节点，实现数据分片和水平扩展。"
          ]
        ]
      },
      {
        "id": "cache-problem",
        "group": "缓存问题",
        "title": "缓存穿透、击穿、雪崩",
        "tags": [
          "面试高频",
          "穿透",
          "击穿",
          "雪崩"
        ],
        "concept": [
          [
            "穿透",
            "查<span class='key'>不存在</span>的数据，缓存和库都没有，每次都打到 DB。解决：缓存空值、<span class='key'>布隆过滤器</span>拦截。"
          ],
          [
            "击穿",
            "<span class='key'>热点 key 失效</span>瞬间大量请求压垮 DB。解决：互斥锁重建缓存、热点 key 永不过期。"
          ],
          [
            "雪崩",
            "<span class='key'>大量 key 同时失效</span>或 Redis 宕机。解决：过期时间加随机值、多级缓存、集群高可用、熔断降级。"
          ]
        ],
        "code": "# 缓存空值防穿透：查库为空也写入缓存，并设较短过期\nSET user:9999 \"\" EX 60\n\n# 击穿防护：用 SET NX 加互斥锁，只让一个线程重建缓存\nSET lock:rebuild:user:1 1 NX EX 10\n# 拿到锁的线程查 DB 回填缓存，其它线程稍后重试\n\n# 雪崩防护：过期时间加随机抖动，避免同一时刻集中失效\nSET hot:key value EX 3600   # 实际代码中应在 3600 基础上 +random(0,300)",
        "qa": [
          [
            "缓存穿透怎么解决？",
            "对查不到的 key 缓存空值（设短过期）；或用布隆过滤器在查缓存前快速判断 key 是否可能存在，不存在直接拦截。"
          ],
          [
            "缓存击穿和雪崩的区别与解法？",
            "击穿是单个热点 key 失效，用互斥锁或逻辑永不过期；雪崩是大量 key 同时失效或宕机，用随机过期时间+集群+多级缓存+降级。"
          ]
        ]
      }
    ]
  },
  {
    "chapter": "SSM框架",
    "module": "框架应用",
    "order": 6,
    "groups": [
      "Spring 核心",
      "Spring 进阶",
      "SpringMVC",
      "MyBatis"
    ],
    "units": [
      {
        "id": "ioc-di",
        "group": "Spring 核心",
        "title": "IOC 与 DI",
        "tags": [
          "面试高频",
          "IOC",
          "DI"
        ],
        "concept": [
          [
            "IOC 控制反转",
            "把对象的创建和依赖管理交给 <span class='key'>Spring 容器</span>，而不是程序自己 new，降低耦合。"
          ],
          [
            "DI 依赖注入",
            "容器在创建 Bean 时自动把它依赖的其它 Bean 注入进来。方式：构造器注入（推荐）、Setter 注入、字段注入（@Autowired）。"
          ],
          [
            "容器",
            "BeanFactory 是基础容器（懒加载）；<span class='key'>ApplicationContext</span> 是其子接口，预加载、支持 AOP/事件/国际化，实际开发用它。"
          ]
        ],
        "code": "// 构造器注入（推荐：依赖不可变、便于测试、避免循环依赖）\n@Service\npublic class OrderService {\n    private final UserService userService;\n\n    // Spring 自动把容器里的 UserService 注入进来\n    public OrderService(UserService userService) {\n        this.userService = userService;\n    }\n\n    public void create() {\n        userService.checkUser();   // 直接使用被注入的依赖\n        System.out.println(\"订单已创建\");\n    }\n}",
        "qa": [
          [
            "什么是 IOC 和 DI？",
            "IOC 是把对象创建权交给容器的思想；DI 是其实现手段，容器在装配 Bean 时自动注入依赖。"
          ],
          [
            "为什么推荐构造器注入？",
            "依赖可声明为 final 不可变、保证注入时对象已完整、便于单元测试、能在启动时暴露循环依赖问题。"
          ]
        ]
      },
      {
        "id": "bean-lifecycle",
        "group": "Spring 核心",
        "title": "Bean 生命周期与作用域",
        "tags": [
          "面试高频",
          "生命周期",
          "单例"
        ],
        "concept": [
          [
            "核心流程",
            "实例化 → 属性填充（依赖注入）→ <code>Aware</code> 回调 → <code>BeanPostProcessor</code> 前置 → <code>InitializingBean</code>/@PostConstruct → 后置处理（AOP 代理在此生成）→ 使用 → 销毁。"
          ],
          [
            "作用域",
            "<span class='key'>singleton</span>（默认，容器内唯一）、prototype（每次获取新建）、request/session（Web）。"
          ],
          [
            "单例线程安全",
            "Spring 单例 Bean 本身不保证线程安全，无状态设计即可；有可变成员变量时需自行同步。"
          ]
        ],
        "code": "@Component\npublic class MyBean {\n    // 属性注入完成后执行，常用于初始化资源\n    @PostConstruct\n    public void init() {\n        System.out.println(\"Bean 初始化：加载配置/建立连接\");\n    }\n\n    // 容器关闭前执行，常用于释放资源\n    @PreDestroy\n    public void destroy() {\n        System.out.println(\"Bean 销毁：释放连接/线程池\");\n    }\n}",
        "qa": [
          [
            "简述 Bean 的生命周期？",
            "实例化→属性赋值→Aware 接口回调→初始化前后置处理(BeanPostProcessor)→初始化(@PostConstruct/afterPropertiesSet)→使用→销毁(@PreDestroy)。"
          ],
          [
            "Spring 单例 Bean 线程安全吗？",
            "不保证。单例被多线程共享，若有可变成员就有并发问题。推荐设计成无状态 Bean，或用 ThreadLocal/局部变量。"
          ]
        ]
      },
      {
        "id": "aop",
        "group": "Spring 进阶",
        "title": "AOP 与动态代理",
        "tags": [
          "面试高频",
          "AOP",
          "动态代理"
        ],
        "concept": [
          [
            "AOP 是什么",
            "面向切面编程，把日志、事务、权限等<span class='key'>横切关注点</span>从业务中抽离，用切面统一织入。"
          ],
          [
            "两种动态代理",
            "<span class='key'>JDK 动态代理</span>（基于接口）；<span class='key'>CGLIB</span>（基于子类，无接口时用）。Spring Boot 默认用 CGLIB。"
          ],
          [
            "术语",
            "切点 Pointcut（在哪切）、通知 Advice（切了做什么：Before/After/Around）、切面 Aspect（切点+通知）。"
          ]
        ],
        "code": "@Aspect\n@Component\npublic class LogAspect {\n    // 切点：拦截 service 包下所有方法\n    @Around(\"execution(* com.demo.service..*(..))\")\n    public Object log(ProceedingJoinPoint pjp) throws Throwable {\n        long start = System.currentTimeMillis();\n        Object result = pjp.proceed();   // 执行原方法\n        long cost = System.currentTimeMillis() - start;\n        System.out.println(pjp.getSignature() + \" 耗时 \" + cost + \"ms\");\n        return result;\n    }\n}",
        "qa": [
          [
            "Spring AOP 的实现原理？",
            "动态代理：目标有接口用 JDK Proxy，无接口用 CGLIB 生成子类，在代理对象中织入通知。"
          ],
          [
            "AOP 在项目里有哪些应用？",
            "声明式事务、统一日志、接口耗时统计、权限校验、分布式锁、参数校验等横切逻辑。"
          ]
        ]
      },
      {
        "id": "transaction-fail",
        "group": "Spring 进阶",
        "title": "声明式事务与失效场景",
        "tags": [
          "面试高频",
          "@Transactional",
          "传播行为"
        ],
        "concept": [
          [
            "原理",
            "<code>@Transactional</code> 基于 AOP，方法前开启事务、正常提交、异常回滚。"
          ],
          [
            "失效场景",
            "<ul><li>方法非 public。</li><li><span class='key'>自调用</span>（同类内 a() 调 b()，不走代理）。</li><li>异常被 catch 吞掉。</li><li>默认只回滚 RuntimeException，受检异常需配 <code>rollbackFor</code>。</li></ul>"
          ],
          [
            "传播行为",
            "REQUIRED（默认，有则加入无则新建）、REQUIRES_NEW（总是新事务）、NESTED（嵌套）。"
          ]
        ],
        "code": "@Service\npublic class PayService {\n    // 默认只回滚 RuntimeException，加 rollbackFor 让所有异常都回滚\n    @Transactional(rollbackFor = Exception.class)\n    public void pay() throws Exception {\n        deduct();   // 扣款\n        // 若这里抛异常，上面的扣款会回滚（保证原子性）\n        addRecord();\n    }\n\n    // 注意：同类内直接调用 pay() 会导致事务失效（自调用不走代理）\n    private void deduct() {}\n    private void addRecord() {}\n}",
        "qa": [
          [
            "@Transactional 在哪些情况下会失效？",
            "方法非 public、同类自调用、异常被捕获未抛出、抛的是受检异常但没配 rollbackFor、目标方法被 final 修饰、未被 Spring 管理等。"
          ],
          [
            "事务传播行为 REQUIRED 和 REQUIRES_NEW 区别？",
            "REQUIRED 复用已有事务（一起提交回滚）；REQUIRES_NEW 挂起当前事务、开启独立新事务（互不影响）。"
          ]
        ]
      },
      {
        "id": "mybatis",
        "group": "MyBatis",
        "title": "MyBatis 缓存与 #/$ 区别",
        "tags": [
          "面试高频",
          "缓存",
          "SQL注入"
        ],
        "concept": [
          [
            "#{} vs ${}",
            "<code>#{}</code> 用<span class='key'>预编译 PreparedStatement</span>占位，防 SQL 注入（推荐）；<code>${}</code> 直接字符串拼接，有注入风险，仅用于动态表名/列名等无法预编译处。"
          ],
          [
            "一级缓存",
            "<span class='key'>SqlSession 级别</span>，默认开启。同一会话相同查询走缓存，增删改或提交后失效。"
          ],
          [
            "二级缓存",
            "<span class='key'>Mapper/namespace 级别</span>，跨 SqlSession 共享，需手动开启。分布式环境慎用，建议用 Redis 替代。"
          ]
        ],
        "code": "<!-- #{} 预编译，安全 -->\n<select id=\"getUser\" resultType=\"User\">\n    SELECT * FROM user WHERE name = #{name}\n</select>\n\n<!-- ${} 直接拼接，仅用于动态排序字段这类无法预编译的场景，需自行校验白名单 -->\n<select id=\"listOrder\" resultType=\"User\">\n    SELECT * FROM user ORDER BY ${column}\n</select>",
        "qa": [
          [
            "#{} 和 ${} 的区别？",
            "#{} 是预编译占位符，能防 SQL 注入；${} 是字符串直接替换，有注入风险，只适合动态表名、列名、排序方向等场景。"
          ],
          [
            "MyBatis 一级、二级缓存的区别？",
            "一级缓存是 SqlSession 级、默认开启、会话内有效；二级缓存是 namespace 级、需手动开启、可跨会话，但分布式下易脏读，常用 Redis 替代。"
          ]
        ]
      }
    ]
  },
  {
    "chapter": "消息中间件篇",
    "module": "分布式与中间件",
    "order": 7,
    "groups": [
      "基础",
      "可靠性",
      "高级特性",
      "Kafka"
    ],
    "units": [
      {
        "id": "mq-why",
        "group": "基础",
        "title": "为什么用 MQ：解耦、异步、削峰",
        "tags": [
          "面试高频",
          "解耦",
          "削峰"
        ],
        "concept": [
          [
            "三大作用",
            "<ul><li><span class='key'>解耦</span>：生产者只发消息，不关心谁消费。</li><li><span class='key'>异步</span>：耗时操作丢给 MQ，快速响应用户。</li><li><span class='key'>削峰</span>：突发流量先入队列，消费者按能力处理。</li></ul>"
          ],
          [
            "引入代价",
            "系统可用性下降（MQ 挂全挂）、复杂度上升（重复消费、顺序、一致性）、数据一致性问题。"
          ],
          [
            "选型",
            "RabbitMQ 时延低、功能全，适合业务解耦；Kafka 吞吐极高，适合日志/大数据；RocketMQ 适合电商、事务消息。"
          ]
        ],
        "code": "// 异步下单示例（伪代码）：核心流程同步，非核心异步发 MQ\npublic void createOrder(Order order) {\n    orderMapper.insert(order);        // 1. 核心：落库（同步）\n\n    // 2. 非核心：发短信、加积分、通知物流 -> 发消息异步处理\n    //    用户无需等这些操作完成，响应更快；服务也解耦了\n    rabbitTemplate.convertAndSend(\"order.exchange\", \"order.created\", order.getId());\n\n    // 3. 立即返回，提升用户体验\n    System.out.println(\"下单成功，后续通知异步处理\");\n}",
        "qa": [
          [
            "引入 MQ 有什么优缺点？",
            "优点：解耦、异步提速、削峰填谷。缺点：系统可用性降低、复杂度提高（要处理重复/顺序/丢失）、一致性更难保证。"
          ],
          [
            "RabbitMQ 和 Kafka 怎么选？",
            "要低延迟、复杂路由、业务解耦选 RabbitMQ；要超高吞吐、日志采集、流处理选 Kafka。"
          ]
        ]
      },
      {
        "id": "mq-reliable",
        "group": "可靠性",
        "title": "消息不丢失",
        "tags": [
          "面试高频",
          "可靠投递",
          "持久化"
        ],
        "concept": [
          [
            "三个环节",
            "<ul><li><span class='key'>生产者→Broker</span>：confirm 确认机制。</li><li><span class='key'>Broker 自身</span>：交换机、队列、消息都持久化到磁盘。</li><li><span class='key'>Broker→消费者</span>：手动 ACK，处理成功才确认。</li></ul>"
          ],
          [
            "生产者确认",
            "RabbitMQ 用 publisher confirm；失败可重试或落库后定时补偿。"
          ],
          [
            "消费者手动 ACK",
            "关闭自动 ACK，业务成功后手动 ack；失败 nack 重新入队或进死信队列。"
          ]
        ],
        "code": "// 消费者：手动 ACK，确保消息处理成功才确认\n@RabbitListener(queues = \"order.queue\")\npublic void handle(Long orderId, Channel channel,\n                   @Header(AmqpHeaders.DELIVERY_TAG) long tag) throws IOException {\n    try {\n        process(orderId);              // 处理业务\n        channel.basicAck(tag, false);  // 成功：手动确认，Broker 删除该消息\n    } catch (Exception e) {\n        // 失败：拒绝并不重新入队，让它进入死信队列后续排查\n        channel.basicNack(tag, false, false);\n    }\n}\nprivate void process(Long id) {}",
        "qa": [
          [
            "如何保证消息不丢失？",
            "生产端开 confirm 确认+失败重试；Broker 端交换机/队列/消息全持久化；消费端关自动 ACK，处理成功再手动 ack。"
          ],
          [
            "消息处理失败怎么办？",
            "重试若干次仍失败则 nack 进入死信队列，由人工或补偿任务处理，避免无限重试阻塞队列。"
          ]
        ]
      },
      {
        "id": "mq-dup",
        "group": "可靠性",
        "title": "重复消费与幂等",
        "tags": [
          "面试高频",
          "幂等",
          "去重"
        ],
        "concept": [
          [
            "为什么会重复",
            "网络抖动导致 ACK 丢失、消费者重启等，MQ 只保证<span class='key'>至少一次</span>投递，无法绝对避免重复。"
          ],
          [
            "解决思路",
            "保证消费<span class='key'>幂等</span>：<ul><li>数据库唯一索引（重复插入失败）。</li><li>Redis 记录已处理消息 ID（SETNX）。</li><li>业务状态机（已处理则跳过）。</li></ul>"
          ],
          [
            "关键",
            "不要试图让 MQ 不重复，而是让消费者「消费多次结果一致」。"
          ]
        ],
        "code": "// 用 Redis 做幂等：每条消息有唯一 msgId，处理前先占位\npublic void consume(String msgId, Order order) {\n    // setIfAbsent: 不存在才设置成功，返回 true 表示是第一次消费\n    Boolean first = redis.opsForValue()\n        .setIfAbsent(\"msg:\" + msgId, \"1\", Duration.ofHours(24));\n\n    if (Boolean.FALSE.equals(first)) {\n        System.out.println(\"重复消息，已处理过，直接跳过\");\n        return;\n    }\n    process(order);   // 真正的业务处理\n}\nprivate void process(Order o) {}",
        "qa": [
          [
            "如何保证消息不被重复消费（幂等性）？",
            "给消息唯一 ID，消费前用 Redis SETNX 或数据库唯一索引判断是否已处理；或依赖业务的天然幂等（如根据状态机判断）。"
          ],
          [
            "为什么 MQ 不能保证消息不重复？",
            "为了不丢消息，MQ 采用'至少一次'语义。网络异常导致 ACK 丢失时会重投，所以重复无法根除，只能靠消费端幂等。"
          ]
        ]
      },
      {
        "id": "kafka-highthroughput",
        "group": "Kafka",
        "title": "Kafka 高吞吐与顺序性",
        "tags": [
          "Kafka",
          "分区",
          "顺序消费"
        ],
        "concept": [
          [
            "高吞吐原因",
            "<span class='key'>顺序写磁盘</span>、<span class='key'>零拷贝</span>(sendfile)、批量发送压缩、分区并行。"
          ],
          [
            "分区机制",
            "Topic 分多个 Partition，分散到不同 Broker 实现并行；同一分区内消息<span class='key'>有序</span>，跨分区不保证全局有序。"
          ],
          [
            "保证顺序",
            "需要顺序的消息发到<span class='key'>同一分区</span>（用同一 key，如订单 ID），且消费端单线程处理该分区。"
          ]
        ],
        "code": "// 同一订单的消息用订单ID作为 key，保证落到同一分区 -> 分区内有序\npublic void send(Order order) {\n    // ProducerRecord(topic, key, value)\n    // 相同 key 经哈希后进入同一 partition，从而保证该订单消息的顺序\n    kafkaTemplate.send(\"order-topic\",\n        String.valueOf(order.getId()),   // key：保证同订单有序\n        order.toJson());\n    System.out.println(\"已发送，同订单消息顺序可保证\");\n}",
        "qa": [
          [
            "Kafka 为什么吞吐量这么高？",
            "顺序写磁盘（比随机写快）、零拷贝减少内核态拷贝、消息批量+压缩、分区并行读写。"
          ],
          [
            "Kafka 如何保证消息顺序？",
            "Kafka 只保证单分区有序。把需要保序的消息用相同 key 发到同一分区，并让消费者对该分区单线程消费。"
          ]
        ]
      }
    ]
  },
  {
    "chapter": "微服务篇",
    "module": "分布式与中间件",
    "order": 8,
    "groups": [
      "注册与配置",
      "调用与容错",
      "网关与分布式"
    ],
    "units": [
      {
        "id": "registry",
        "group": "注册与配置",
        "title": "服务注册与发现（Nacos/Eureka）",
        "tags": [
          "面试高频",
          "Nacos",
          "注册中心"
        ],
        "concept": [
          [
            "作用",
            "服务启动时把地址<span class='key'>注册</span>到注册中心，调用方从注册中心<span class='key'>发现</span>可用实例，实现动态扩缩容、解耦服务地址。"
          ],
          [
            "CAP 取舍",
            "Eureka 是 <span class='key'>AP</span>（保可用，可能短暂读到旧数据）；Nacos 可切换 AP/CP；Zookeeper 是 CP（选主期间不可用）。"
          ],
          [
            "心跳与健康检查",
            "实例定期发心跳续约，注册中心剔除长时间无心跳的实例。"
          ]
        ],
        "code": "// 只需引依赖 + 注解 + 配置，服务即自动注册到 Nacos\n@SpringBootApplication\n@EnableDiscoveryClient   // 开启服务发现\npublic class OrderApplication {\n    public static void main(String[] args) {\n        SpringApplication.run(OrderApplication.class, args);\n    }\n}\n// application.yml:\n//   spring.cloud.nacos.discovery.server-addr: localhost:8848\n//   spring.application.name: order-service   # 注册时的服务名",
        "qa": [
          [
            "注册中心的作用？",
            "管理服务实例的注册、发现与健康检查，让调用方无需硬编码地址，支持动态上下线和负载均衡。"
          ],
          [
            "Eureka 和 Nacos 区别？",
            "Eureka 仅 AP、功能单一、已停更；Nacos 支持 AP/CP 切换、集成配置中心、有控制台，是目前主流选择。"
          ]
        ]
      },
      {
        "id": "feign",
        "group": "调用与容错",
        "title": "OpenFeign 声明式调用与负载均衡",
        "tags": [
          "Feign",
          "负载均衡"
        ],
        "concept": [
          [
            "OpenFeign",
            "用<span class='key'>接口 + 注解</span>声明式地发起 HTTP 调用，像调本地方法一样调远程服务，底层是动态代理 + HTTP 客户端。"
          ],
          [
            "负载均衡",
            "集成 LoadBalancer，从注册中心拉取实例列表，按策略（轮询/随机）选一个调用。"
          ],
          [
            "超时与重试",
            "可配连接/读取超时；配合熔断防止级联故障。"
          ]
        ],
        "code": "// 声明式调用：定义接口，Feign 自动生成实现去调 user-service\n@FeignClient(name = \"user-service\")   // 服务名，从注册中心解析地址\npublic interface UserClient {\n    @GetMapping(\"/user/{id}\")\n    User getById(@PathVariable(\"id\") Long id);\n}\n\n// 使用：像调本地方法一样，负载均衡由框架处理\n@Service\npublic class OrderService {\n    @Autowired UserClient userClient;\n    public void check(Long uid) {\n        User u = userClient.getById(uid);   // 实际发起远程 HTTP 调用\n        System.out.println(\"远程拿到用户: \" + u);\n    }\n}",
        "qa": [
          [
            "Feign 的原理？",
            "通过动态代理为接口生成实现类，把注解解析成 HTTP 请求，结合 LoadBalancer 做负载均衡后发起调用。"
          ],
          [
            "Feign 调用超时怎么处理？",
            "配置连接和读超时时间，配合 Sentinel/Resilience4j 做熔断降级，失败走 fallback，避免线程被拖垮。"
          ]
        ]
      },
      {
        "id": "sentinel",
        "group": "调用与容错",
        "title": "熔断、降级与限流",
        "tags": [
          "面试高频",
          "Sentinel",
          "熔断"
        ],
        "concept": [
          [
            "雪崩问题",
            "一个服务挂导致调用方线程耗尽，故障层层传导。需要容错保护。"
          ],
          [
            "三板斧",
            "<ul><li><span class='key'>限流</span>：限制 QPS，超出快速失败。</li><li><span class='key'>熔断</span>：错误率过高时断开调用，过段时间半开试探。</li><li><span class='key'>降级</span>：失败时返回兜底数据，保证核心可用。</li></ul>"
          ],
          [
            "工具",
            "Sentinel（阿里，功能强、有控制台）、Resilience4j、早期的 Hystrix（已停更）。"
          ]
        ],
        "code": "// Sentinel 资源保护 + 降级兜底\n@Service\npublic class ProductService {\n    // value 为资源名，blockHandler 处理限流/熔断，fallback 处理业务异常\n    @SentinelResource(value = \"getProduct\", fallback = \"defaultProduct\")\n    public Product getProduct(Long id) {\n        return productMapper.selectById(id);\n    }\n\n    // 降级方法：被熔断或异常时返回兜底数据，保证服务不崩\n    public Product defaultProduct(Long id) {\n        System.out.println(\"触发降级，返回兜底商品\");\n        return new Product(id, \"默认商品\");\n    }\n}",
        "qa": [
          [
            "熔断、降级、限流的区别？",
            "限流是控制入口流量（超量拒绝）；熔断是检测到下游故障时主动断开调用（防雪崩）；降级是失败时返回兜底结果（保核心）。三者常配合使用。"
          ],
          [
            "熔断器的三种状态？",
            "关闭（正常放行）、打开（错误率超阈值，快速失败）、半开（隔一段时间放少量请求试探，成功则恢复关闭）。"
          ]
        ]
      },
      {
        "id": "distributed-tx",
        "group": "网关与分布式",
        "title": "分布式事务（Seata）",
        "tags": [
          "面试高频",
          "分布式事务",
          "TCC"
        ],
        "concept": [
          [
            "问题",
            "跨服务、跨库的操作如何保证一起成功或失败。本地事务搞不定。"
          ],
          [
            "常见方案",
            "<ul><li><span class='key'>2PC/AT</span>（Seata 默认，自动补偿，侵入低）。</li><li><span class='key'>TCC</span>（Try-Confirm-Cancel，手动控制，性能好）。</li><li><span class='key'>本地消息表 / MQ 最终一致</span>（异步、最终一致）。</li></ul>"
          ],
          [
            "选型",
            "强一致用 AT/TCC；高并发可接受最终一致用 MQ 方案。多数互联网业务追求最终一致即可。"
          ]
        ],
        "code": "// Seata AT 模式：一个注解搞定分布式事务\n@GlobalTransactional(rollbackFor = Exception.class)\npublic void placeOrder(Order order) {\n    orderService.create(order);     // 服务A：本地库写订单\n    storageService.deduct(order);   // 服务B：远程扣库存\n    accountService.debit(order);    // 服务C：远程扣余额\n    // 任一步失败，Seata 会按 undo_log 自动回滚前面已提交的本地事务\n}",
        "qa": [
          [
            "有哪些分布式事务方案？",
            "2PC/Seata AT（自动补偿）、TCC（手动三阶段）、本地消息表、MQ 事务消息、最大努力通知。强一致用前两者，高并发用最终一致方案。"
          ],
          [
            "AT 模式的原理？",
            "一阶段提交本地事务并记录数据快照(undo_log)；二阶段全局提交则删快照，全局回滚则用 undo_log 反向恢复数据。"
          ]
        ]
      }
    ]
  },
  {
    "chapter": "设计模式篇",
    "module": "工程素养",
    "order": 9,
    "groups": [
      "设计原则",
      "创建型",
      "结构型",
      "行为型"
    ],
    "units": [
      {
        "id": "solid",
        "group": "设计原则",
        "title": "六大设计原则（SOLID）",
        "tags": [
          "面试高频",
          "设计原则"
        ],
        "concept": [
          [
            "核心原则",
            "<ul><li><span class='key'>单一职责</span>：一个类只负责一件事。</li><li><span class='key'>开闭原则</span>：对扩展开放，对修改关闭。</li><li><span class='key'>里氏替换</span>：子类能替换父类。</li><li><span class='key'>依赖倒置</span>：面向接口编程。</li><li>接口隔离、迪米特法则。</li></ul>"
          ],
          [
            "开闭原则最重要",
            "新增功能通过新增代码（扩展）而非修改已有代码实现，降低引入 bug 的风险。设计模式大多是为了贯彻它。"
          ]
        ],
        "code": "// 开闭原则示例：新增支付方式无需改原有代码，只需新增实现类\ninterface Payment {\n    void pay(double amount);\n}\nclass WechatPay implements Payment {\n    public void pay(double a) { System.out.println(\"微信支付 \" + a); }\n}\n// 将来加支付宝：新建 AliPay implements Payment 即可，不动已有代码\nclass Cashier {\n    void checkout(Payment p, double amount) {\n        p.pay(amount);   // 面向接口，依赖倒置\n    }\n}\npublic class Demo {\n    public static void main(String[] args) {\n        new Cashier().checkout(new WechatPay(), 99.0);\n    }\n}",
        "qa": [
          [
            "什么是开闭原则？",
            "对扩展开放、对修改关闭。增加新功能时通过新增代码实现，尽量不修改已有稳定代码，降低风险。"
          ],
          [
            "依赖倒置原则是什么？",
            "高层模块不依赖低层实现，二者都依赖抽象（接口）。这样替换实现时上层无需改动。"
          ]
        ]
      },
      {
        "id": "singleton",
        "group": "创建型",
        "title": "单例模式",
        "tags": [
          "面试高频",
          "单例",
          "双重检查"
        ],
        "concept": [
          [
            "要点",
            "保证一个类只有一个实例。关键：私有构造、静态实例、提供全局访问点。"
          ],
          [
            "常见写法",
            "<ul><li><span class='key'>饿汉式</span>：类加载即创建，线程安全但可能浪费。</li><li><span class='key'>双重检查锁(DCL)</span>：懒加载+线程安全，需 volatile 防重排。</li><li><span class='key'>静态内部类</span>：懒加载+线程安全（推荐）。</li><li><span class='key'>枚举</span>：最安全，防反射和反序列化破坏。</li></ul>"
          ]
        ],
        "code": "// 推荐：静态内部类实现单例（懒加载 + 线程安全 + 写法简洁）\npublic class Singleton {\n    private Singleton() {}   // 私有构造，外部不能 new\n\n    // 只有首次调用 getInstance 时才加载内部类并创建实例（懒加载）\n    // 由 JVM 类加载机制保证线程安全\n    private static class Holder {\n        static final Singleton INSTANCE = new Singleton();\n    }\n    public static Singleton getInstance() {\n        return Holder.INSTANCE;\n    }\n}",
        "qa": [
          [
            "写一个线程安全的单例？",
            "推荐静态内部类（懒加载+JVM 保证线程安全）或枚举（防反射/反序列化）。DCL 需要给实例加 volatile 防止指令重排。"
          ],
          [
            "DCL 为什么要加 volatile？",
            "new 对象分'分配内存、初始化、赋引用'三步，可能重排序。其它线程可能拿到未初始化完成的对象。volatile 禁止重排避免此问题。"
          ]
        ]
      },
      {
        "id": "factory",
        "group": "创建型",
        "title": "工厂模式",
        "tags": [
          "工厂",
          "解耦"
        ],
        "concept": [
          [
            "作用",
            "把对象创建逻辑封装起来，调用方不直接 new 具体类，降低耦合，符合开闭原则。"
          ],
          [
            "分类",
            "简单工厂（一个工厂按参数造对象）、工厂方法（每个产品一个工厂）、抽象工厂（生产产品族）。"
          ],
          [
            "应用",
            "Spring 的 BeanFactory、各种 getInstance、日志框架的 LoggerFactory。"
          ]
        ],
        "code": "// 简单工厂：根据类型创建对象，调用方不关心具体实现类\ninterface Shape { void draw(); }\nclass Circle implements Shape { public void draw(){ System.out.println(\"画圆\"); } }\nclass Square implements Shape { public void draw(){ System.out.println(\"画方\"); } }\n\nclass ShapeFactory {\n    static Shape create(String type) {\n        // 创建逻辑集中在工厂，新增形状改这里即可\n        if (\"circle\".equals(type)) return new Circle();\n        if (\"square\".equals(type)) return new Square();\n        throw new IllegalArgumentException(\"未知类型\");\n    }\n}\npublic class Demo {\n    public static void main(String[] args) {\n        ShapeFactory.create(\"circle\").draw();\n    }\n}",
        "qa": [
          [
            "工厂模式解决什么问题？",
            "把对象创建与使用分离，调用方依赖抽象而非具体类，新增产品时影响范围小，便于维护和扩展。"
          ],
          [
            "项目里哪里用到工厂模式？",
            "Spring 容器(BeanFactory/ApplicationContext)、Calendar.getInstance、SLF4J 的 LoggerFactory、各类连接池等。"
          ]
        ]
      },
      {
        "id": "strategy",
        "group": "行为型",
        "title": "策略模式",
        "tags": [
          "面试高频",
          "策略",
          "消除if-else"
        ],
        "concept": [
          [
            "作用",
            "把一组可互换的算法各自封装成类，运行时动态切换，<span class='key'>消除大量 if-else</span>。"
          ],
          [
            "结构",
            "策略接口 + 多个策略实现 + 上下文持有策略。常配合工厂/Map 选择策略。"
          ],
          [
            "应用",
            "支付方式选择、优惠券计算、不同渠道的消息推送。Spring 可把所有策略注入成 Map。"
          ]
        ],
        "code": "// 策略模式：用 Map 装配所有策略，按 key 取用，彻底消除 if-else\ninterface DiscountStrategy { double apply(double price); }\n\nclass NoDiscount implements DiscountStrategy {\n    public double apply(double p){ return p; }\n}\nclass HalfDiscount implements DiscountStrategy {\n    public double apply(double p){ return p * 0.5; }\n}\npublic class Demo {\n    public static void main(String[] args) {\n        Map<String, DiscountStrategy> strategies = new HashMap<>();\n        strategies.put(\"none\", new NoDiscount());\n        strategies.put(\"half\", new HalfDiscount());\n\n        // 运行时按业务参数选择策略，无需 if-else 判断\n        DiscountStrategy s = strategies.get(\"half\");\n        System.out.println(\"折后价 = \" + s.apply(100));  // 50.0\n    }\n}",
        "qa": [
          [
            "策略模式适合什么场景？",
            "有多种可互换算法/业务规则、且常需扩展时，如多种支付、计费、风控规则。能消除 if-else、符合开闭原则。"
          ],
          [
            "策略模式怎么和 Spring 结合消除 if-else？",
            "让每种策略实现同一接口并注册为 Bean，Spring 自动把它们注入成 Map<beanName, Strategy>，运行时按 key 直接取用。"
          ]
        ]
      }
    ]
  },
  {
    "chapter": "技术场景篇",
    "module": "工程素养",
    "order": 10,
    "groups": [
      "分布式",
      "高并发",
      "线上问题"
    ],
    "units": [
      {
        "id": "distributed-lock",
        "group": "分布式",
        "title": "分布式锁的实现",
        "tags": [
          "面试高频",
          "Redis",
          "Redisson"
        ],
        "concept": [
          [
            "为什么需要",
            "集群部署下 JVM 本地锁（synchronized）只在单机有效，需要跨进程的<span class='key'>分布式锁</span>保证互斥。"
          ],
          [
            "Redis 方案",
            "<code>SET key value NX EX</code> 加锁（原子）；value 用唯一标识，释放时用 <span class='key'>Lua 脚本</span>校验后删除，防误删他人锁。"
          ],
          [
            "Redisson",
            "生产推荐：自动续期（<span class='key'>看门狗</span>，防业务没执行完锁就过期）、可重入、解决了手写锁的诸多坑。"
          ]
        ],
        "code": "// 生产推荐 Redisson：自带看门狗自动续期，可重入\npublic void doBiz() {\n    RLock lock = redisson.getLock(\"order:lock:1001\");\n    try {\n        // 最多等 3 秒拿锁；拿到后默认 30 秒过期，看门狗会自动续期\n        if (lock.tryLock(3, TimeUnit.SECONDS)) {\n            process();   // 临界区：保证集群下也只有一个线程执行\n        }\n    } catch (InterruptedException e) {\n        Thread.currentThread().interrupt();\n    } finally {\n        if (lock.isHeldByCurrentThread()) {\n            lock.unlock();   // 释放锁，仅释放自己持有的\n        }\n    }\n}\nprivate void process() {}",
        "qa": [
          [
            "Redis 分布式锁怎么实现？要注意什么？",
            "用 SET NX EX 原子加锁；value 设唯一值，释放用 Lua 脚本'比较 value 再删除'防误删；考虑锁过期但业务没执行完，用看门狗续期。"
          ],
          [
            "为什么用 Redisson 而不是自己写？",
            "Redisson 解决了原子续期(看门狗)、可重入、释放安全等问题，还支持公平锁、读写锁、联锁，比手写可靠得多。"
          ]
        ]
      },
      {
        "id": "idempotent",
        "group": "分布式",
        "title": "接口幂等性设计",
        "tags": [
          "面试高频",
          "幂等",
          "防重复提交"
        ],
        "concept": [
          [
            "场景",
            "用户重复点击、网络重试、MQ 重投，导致同一操作执行多次（如重复下单、重复扣款）。"
          ],
          [
            "方案",
            "<ul><li><span class='key'>token 机制</span>：先获取 token，提交时校验并删除，重复提交 token 失效。</li><li>数据库<span class='key'>唯一索引</span>。</li><li>状态机：只允许特定状态流转。</li><li>乐观锁(version)。</li></ul>"
          ]
        ],
        "code": "// token 防重复提交：进表单先发 token，提交时原子校验+删除\npublic boolean submit(String token, Order order) {\n    // 用 Lua 或 DEL 返回值保证\"校验并删除\"的原子性\n    Long deleted = redis.opsForValue().getOperations().delete(\"token:\" + token) ? 1L : 0L;\n    if (deleted == 0) {\n        System.out.println(\"重复提交，已拦截\");\n        return false;   // token 已被用过 -> 是重复请求\n    }\n    process(order);     // 首次提交，正常处理\n    return true;\n}\nprivate void process(Order o) {}",
        "qa": [
          [
            "如何保证接口幂等？",
            "GET/DELETE 天然幂等；POST 用 token 机制、数据库唯一索引、状态机或乐观锁，确保重复请求不会产生重复副作用。"
          ],
          [
            "如何防止订单重复提交？",
            "下单页预发 token 存 Redis，提交时原子地校验并删除 token；同时数据库对业务唯一键加唯一索引兜底。"
          ]
        ]
      },
      {
        "id": "high-concurrency",
        "group": "高并发",
        "title": "秒杀系统设计要点",
        "tags": [
          "面试高频",
          "秒杀",
          "限流"
        ],
        "concept": [
          [
            "核心思路",
            "<span class='key'>层层削峰</span>，把流量挡在数据库之前：前端限流 → 网关限流 → Redis 预扣库存 → MQ 异步下单 → DB 最终落库。"
          ],
          [
            "防超卖",
            "Redis 用 Lua 脚本原子扣减库存；DB 用 <code>update ... where stock>0</code> 兜底。"
          ],
          [
            "其它",
            "热点数据预热、按钮防重、验证码错峰、独立部署避免拖垮主站。"
          ]
        ],
        "code": "-- Redis 原子扣库存的 Lua 脚本（防超卖）\n-- KEYS[1]=库存key  ARGV[1]=购买数量\nlocal stock = tonumber(redis.call('GET', KEYS[1]))\nif stock == nil or stock < tonumber(ARGV[1]) then\n    return 0          -- 库存不足，秒杀失败\nend\nredis.call('DECRBY', KEYS[1], ARGV[1])\nreturn 1              -- 扣减成功，后续异步发 MQ 落库",
        "qa": [
          [
            "秒杀系统怎么设计？",
            "多级削峰：前端按钮防重+限流、网关限流、Redis 预扣库存(Lua 原子)、MQ 异步落库、DB update where stock>0 兜底防超卖，热点预热、独立部署。"
          ],
          [
            "如何防止超卖？",
            "Redis 用 Lua 脚本原子判断并扣减库存；数据库层用乐观锁或 update set stock=stock-1 where stock>=数量 作最终保证。"
          ]
        ]
      },
      {
        "id": "online-trouble",
        "group": "线上问题",
        "title": "线上 CPU 飙高 / 内存泄漏排查",
        "tags": [
          "面试高频",
          "排查",
          "Arthas"
        ],
        "concept": [
          [
            "CPU 飙高",
            "<code>top</code> 找进程 → <code>top -Hp pid</code> 找线程 → 线程 ID 转十六进制 → <code>jstack</code> 定位代码。常见原因：死循环、频繁 GC、正则回溯。"
          ],
          [
            "内存泄漏",
            "<code>jmap -dump</code> 导出堆 → <span class='key'>MAT</span> 看支配树找大对象与引用链。常见：静态集合只增不减、连接未关、ThreadLocal 未 remove。"
          ],
          [
            "利器 Arthas",
            "在线诊断神器：<code>thread</code> 看忙线程、<code>watch</code> 看方法入参出参、<code>trace</code> 看耗时分布，无需重启。"
          ]
        ],
        "code": "# CPU 飙高排查四步（服务器终端执行）\ntop                          # 1. 找到高 CPU 的 Java 进程 PID\ntop -Hp <pid>               # 2. 找到该进程内高 CPU 的线程 TID\nprintf \"%x\\n\" <tid>         # 3. 线程 ID 转十六进制\njstack <pid> | grep <hex>  # 4. 在线程栈里定位到具体代码行\n\n# 或用 Arthas 一条命令搞定：\n# thread -n 3   查看最忙的 3 个线程及其堆栈",
        "qa": [
          [
            "线上 CPU 100% 怎么排查？",
            "top 定位进程→top -Hp 定位线程→线程号转 16 进制→jstack 找到对应栈帧定位代码；或直接用 Arthas thread -n 查最忙线程。常见原因是死循环、频繁 Full GC。"
          ],
          [
            "怎么定位内存泄漏？",
            "用 -XX:+HeapDumpOnOutOfMemoryError 或 jmap 导出堆，MAT 分析支配树找占用最大的对象和 GC Root 引用链，定位只增不减的集合或未释放资源。"
          ]
        ]
      }
    ]
  },
  {
    "chapter": "大厂面经(Java方向)",
    "module": "求职冲刺",
    "order": 11,
    "groups": [
      "Java 基础",
      "并发与JVM",
      "数据库与缓存",
      "项目与软技能"
    ],
    "units": [
      {
        "id": "java-base-qa",
        "group": "Java 基础",
        "title": "Java 基础高频题串讲",
        "tags": [
          "面试高频",
          "基础",
          "八股"
        ],
        "concept": [
          [
            "== 与 equals",
            "<code>==</code> 比较基本类型的值或引用地址；<code>equals</code> 默认比地址，被重写后比内容（如 String）。"
          ],
          [
            "String/StringBuilder/StringBuffer",
            "String 不可变；StringBuilder 可变非线程安全（快）；StringBuffer 可变线程安全（synchronized）。"
          ],
          [
            "接口 vs 抽象类",
            "抽象类是「是不是」（单继承、可有状态和构造）；接口是「能不能」（多实现、JDK8 后可有默认方法）。"
          ]
        ],
        "code": "// 面试常考：String 不可变 + 常量池\npublic class Demo {\n    public static void main(String[] args) {\n        String a = \"hi\";              // 进入字符串常量池\n        String b = \"hi\";              // 复用常量池里的同一对象\n        String c = new String(\"hi\");  // 在堆中新建对象\n\n        System.out.println(a == b);          // true：同一常量池对象\n        System.out.println(a == c);          // false：c 是堆中新对象\n        System.out.println(a.equals(c));     // true：内容相同\n    }\n}",
        "qa": [
          [
            "== 和 equals 的区别？",
            "== 比较值或引用地址；equals 默认也比地址，但 String、Integer 等重写后比较内容。重写 equals 必须重写 hashCode。"
          ],
          [
            "String 为什么是不可变的？有什么好处？",
            "内部 char/byte 数组被 final 修饰且不对外暴露修改。好处：可安全共享（常量池）、可缓存 hashCode、线程安全、适合做 HashMap 的 key。"
          ],
          [
            "重载和重写的区别？",
            "重载(Overload)同类中方法名相同参数不同，编译期确定；重写(Override)子类覆盖父类方法、签名相同，运行期多态。"
          ]
        ]
      },
      {
        "id": "concurrency-qa",
        "group": "并发与JVM",
        "title": "并发与 JVM 高频题串讲",
        "tags": [
          "面试高频",
          "并发",
          "JVM"
        ],
        "concept": [
          [
            "线程池参数",
            "记住七参数与执行流程（核心→队列→最大→拒绝），以及为何不用 Executors。"
          ],
          [
            "volatile/synchronized/Lock",
            "volatile 保可见性不保原子；synchronized 关键字自动释放；Lock 灵活可中断可超时。"
          ],
          [
            "GC 与调优",
            "可达性分析判垃圾、分代回收、G1、OOM 排查（HeapDump + MAT）。"
          ]
        ],
        "code": "// 答题口诀（非可运行）：\n// 线程池流程：核心线程 -> 阻塞队列 -> 非核心线程 -> 拒绝策略\n// synchronized 升级：无锁 -> 偏向 -> 轻量(CAS) -> 重量\n// GC 判活：从 GC Roots 可达性分析\n// 内存泄漏排查：jmap dump -> MAT 看支配树找引用链\nclass Notes {\n    String 线程池 = \"核心->队列->最大->拒绝\";\n    String 锁升级 = \"无锁->偏向->轻量->重量\";\n    String 排查OOM = \"HeapDumpOnOOM + MAT\";\n}",
        "qa": [
          [
            "说说你对线程池的理解？",
            "从七大参数、执行流程、四种拒绝策略、为何禁用 Executors、核心线程数如何设置(CPU 密集 N+1 / IO 密集 2N)展开。"
          ],
          [
            "JVM 内存模型和 GC 了解吗？",
            "答运行时数据区(堆/栈/方法区/PC/本地栈)、对象创建与分代、可达性分析判垃圾、回收算法与 G1、以及 OOM 排查流程。"
          ],
          [
            "如何排查死锁？",
            "jstack 打印线程栈会直接提示 deadlock，或用 Arthas thread -b 查找；预防靠固定加锁顺序、加超时获取锁。"
          ]
        ]
      },
      {
        "id": "db-cache-qa",
        "group": "数据库与缓存",
        "title": "数据库与缓存高频题串讲",
        "tags": [
          "面试高频",
          "MySQL",
          "Redis"
        ],
        "concept": [
          [
            "索引",
            "B+ 树、聚簇/二级索引、回表、覆盖索引、最左前缀、索引失效场景。"
          ],
          [
            "事务",
            "ACID、四种隔离级别、MVCC、锁机制。"
          ],
          [
            "缓存",
            "三大缓存问题(穿透/击穿/雪崩)、双写一致性、分布式锁。"
          ]
        ],
        "code": "// 缓存与数据库双写一致性方案：旁路缓存(Cache Aside)\n// 读：先读缓存，没有再读库并回填缓存\n// 写：先更新数据库，再删除缓存（而不是更新缓存）\npublic Object read(String key) {\n    Object v = cache.get(key);\n    if (v == null) {\n        v = db.query(key);   // 读库\n        cache.set(key, v);   // 回填\n    }\n    return v;\n}\npublic void write(String key, Object v) {\n    db.update(key, v);       // 1. 先更新数据库\n    cache.delete(key);       // 2. 再删缓存（延迟双删可进一步降低不一致）\n}",
        "qa": [
          [
            "缓存与数据库如何保证一致性？",
            "常用 Cache Aside：读时回填，写时先更新 DB 再删缓存；为应对并发可用延迟双删或订阅 binlog(canal)异步更新，多数业务接受最终一致。"
          ],
          [
            "MySQL 的 redo log 和 binlog 区别？",
            "redo log 是 InnoDB 物理日志、保证崩溃恢复(持久性)、循环写；binlog 是 Server 层逻辑日志、用于主从复制和数据恢复、追加写。两者通过两阶段提交保证一致。"
          ],
          [
            "索引什么时候会失效？",
            "对索引列运算/函数、隐式类型转换、左模糊 like、不满足最左前缀、OR 连非索引列等。"
          ]
        ]
      },
      {
        "id": "project-qa",
        "group": "项目与软技能",
        "title": "项目介绍与软技能",
        "tags": [
          "项目",
          "STAR",
          "软技能"
        ],
        "concept": [
          [
            "STAR 法则",
            "讲项目用 <span class='key'>Situation 背景 → Task 任务 → Action 行动 → Result 结果</span>，突出你的贡献和量化成果。"
          ],
          [
            "项目难点",
            "准备 2~3 个技术难点（如高并发、慢查询、分布式事务），讲清楚问题、方案对比、最终效果。"
          ],
          [
            "反问环节",
            "准备问题（团队技术栈、业务方向、成长空间），体现主动性。"
          ]
        ],
        "code": "// 项目描述模板（STAR）：\n// S: 日活百万的电商，大促时下单接口 RT 高、偶发超卖\n// T: 我负责把下单接口 QPS 从 2k 提升到 1w 并杜绝超卖\n// A: Redis 预扣库存(Lua 原子) + MQ 异步落库 + 网关限流 + 数据库唯一索引兜底\n// R: QPS 提升 5 倍，超卖归零，大促零故障\nclass ProjectStar {\n    String 量化结果 = \"QPS 2k -> 1w, 超卖归零, P99 从 800ms -> 120ms\";\n}",
        "qa": [
          [
            "介绍一下你做过的项目？",
            "用 STAR 法则：交代业务背景与规模、你的职责、采用的技术方案(为何这样选)、量化的最终成果。重点讲你主导和解决难点的部分。"
          ],
          [
            "你项目中最大的技术难点是什么？",
            "选一个有深度的(如秒杀防超卖/分布式事务/慢查询优化)，讲清问题现象、排查过程、方案对比与取舍、上线效果与数据。"
          ],
          [
            "你有什么要问我的？",
            "可问团队技术栈与挑战、业务规划、对该岗位的期望与成长路径，避免只问薪资假期。"
          ]
        ]
      }
    ]
  }
] satisfies LegacyChapter[];
