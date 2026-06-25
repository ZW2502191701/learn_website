/* ============================================================
 * Redis · 精修知识库
 * 数据源: C:\AI_Test\learn\Redis.pdf
 * 代码示例为 Redis 命令（lang: redis）。
 * ============================================================ */
(window.registerChapter || function(c){(window.JAVAPATH_CHAPTERS=window.JAVAPATH_CHAPTERS||[]).push(c);})({
  chapter: "Redis",
  module: "数据存储",
  order: 5,
  lang: "redis",
  groups: ["数据类型", "持久化", "高可用", "缓存问题"],
  units: [
    {
      id: "datatypes",
      group: "数据类型",
      title: "五种基本数据类型及场景",
      tags: ["面试高频", "String", "Hash", "ZSet"],
      concept: [
        ["五种类型", "<ul><li><span class='key'>String</span>：缓存、计数器、分布式锁。</li><li><span class='key'>Hash</span>：存对象（用户信息）。</li><li><span class='key'>List</span>：消息队列、最新列表。</li><li><span class='key'>Set</span>：去重、共同好友（交集）。</li><li><span class='key'>ZSet</span>：排行榜、延时队列。</li></ul>"],
        ["底层编码", "同一类型按数据量自动切换编码，如 ZSet 小数据用 ziplist，大数据用 skiplist+hash，兼顾内存与性能。"],
        ["单线程为何快", "纯内存操作 + IO 多路复用 + 单线程避免锁竞争与上下文切换。"]
      ],
      code: `# String：计数器
INCR article:1001:views        # 浏览量 +1，原子操作

# Hash：存储一个用户对象
HSET user:1 name Tom age 18
HGET user:1 name               # -> Tom

# ZSet：游戏排行榜（按分数排序）
ZADD rank 100 Tom 95 Jerry
ZREVRANGE rank 0 2 WITHSCORES  # 取分数最高的前 3 名`,
      qa: [
        ["Redis 为什么单线程还这么快？", "数据在内存、避免磁盘 IO；用 IO 多路复用处理大量连接；单线程省去锁和上下文切换开销。(注：Redis 6 网络 IO 引入多线程，命令执行仍单线程)"],
        ["排行榜用什么类型？", "ZSet（有序集合）。用 ZADD 加分、ZREVRANGE 取榜，分数自动排序。"]
      ]
    },
    {
      id: "persistence",
      group: "持久化",
      title: "RDB 与 AOF",
      tags: ["面试高频", "RDB", "AOF"],
      concept: [
        ["RDB", "<span class='key'>快照</span>：某时刻全量数据写入二进制文件。体积小、恢复快，但可能丢失最后一次快照后的数据。"],
        ["AOF", "<span class='key'>追加日志</span>：记录每条写命令。数据更安全（可每秒刷盘），但文件大、恢复慢。"],
        ["混合持久化", "Redis 4.0+ 支持 RDB + AOF 混合：AOF 重写时用 RDB 存全量、增量用 AOF，兼顾恢复速度与数据安全，推荐开启。"]
      ],
      code: `# RDB：手动触发快照（BGSAVE 后台 fork 子进程，不阻塞主线程）
BGSAVE

# 配置示例（redis.conf）：
#   save 900 1          900秒内有1次修改就触发RDB
#   appendonly yes      开启 AOF
#   appendfsync everysec  每秒刷盘（性能与安全的平衡点）
#   aof-use-rdb-preamble yes  开启混合持久化

CONFIG GET save        # 查看当前 RDB 触发规则`,
      qa: [
        ["RDB 和 AOF 怎么选？", "追求性能、能容忍少量丢失用 RDB；追求数据安全用 AOF（everysec）。生产推荐开启混合持久化，兼顾两者。"],
        ["AOF 文件会无限增长吗？", "不会。Redis 会触发 AOF 重写（rewrite），用最小命令集重建数据库状态，压缩文件体积。"]
      ]
    },
    {
      id: "ha",
      group: "高可用",
      title: "主从、哨兵与集群",
      tags: ["面试高频", "哨兵", "Cluster"],
      concept: [
        ["主从复制", "主写从读，读写分离分摊压力。从节点首次全量同步（RDB），之后增量同步命令。"],
        ["哨兵 Sentinel", "<span class='key'>监控 + 自动故障转移</span>：主节点宕机时，哨兵选举新主并通知客户端，实现高可用。"],
        ["Cluster 集群", "数据分片到 <span class='key'>16384 个 slot</span>，多主多从横向扩展，解决单机内存与吞吐瓶颈。"]
      ],
      code: `# 主从：从节点配置指向主节点
REPLICAOF 192.168.1.10 6379

# 查看复制状态（角色、连接的从节点、同步偏移量）
INFO replication

# 集群：查看槽位分配与节点状态
CLUSTER INFO
CLUSTER NODES`,
      qa: [
        ["哨兵的作用是什么？", "监控主从节点健康、在主节点故障时自动选举新主并完成故障转移、向客户端通知新的主节点地址。"],
        ["Redis Cluster 如何分片？", "把 key 通过 CRC16 取模映射到 16384 个 slot，slot 再分配给不同主节点，实现数据分片和水平扩展。"]
      ]
    },
    {
      id: "cache-problem",
      group: "缓存问题",
      title: "缓存穿透、击穿、雪崩",
      tags: ["面试高频", "穿透", "击穿", "雪崩"],
      concept: [
        ["穿透", "查<span class='key'>不存在</span>的数据，缓存和库都没有，每次都打到 DB。解决：缓存空值、<span class='key'>布隆过滤器</span>拦截。"],
        ["击穿", "<span class='key'>热点 key 失效</span>瞬间大量请求压垮 DB。解决：互斥锁重建缓存、热点 key 永不过期。"],
        ["雪崩", "<span class='key'>大量 key 同时失效</span>或 Redis 宕机。解决：过期时间加随机值、多级缓存、集群高可用、熔断降级。"]
      ],
      code: `# 缓存空值防穿透：查库为空也写入缓存，并设较短过期
SET user:9999 "" EX 60

# 击穿防护：用 SET NX 加互斥锁，只让一个线程重建缓存
SET lock:rebuild:user:1 1 NX EX 10
# 拿到锁的线程查 DB 回填缓存，其它线程稍后重试

# 雪崩防护：过期时间加随机抖动，避免同一时刻集中失效
SET hot:key value EX 3600   # 实际代码中应在 3600 基础上 +random(0,300)`,
      qa: [
        ["缓存穿透怎么解决？", "对查不到的 key 缓存空值（设短过期）；或用布隆过滤器在查缓存前快速判断 key 是否可能存在，不存在直接拦截。"],
        ["缓存击穿和雪崩的区别与解法？", "击穿是单个热点 key 失效，用互斥锁或逻辑永不过期；雪崩是大量 key 同时失效或宕机，用随机过期时间+集群+多级缓存+降级。"]
      ]
    }
  ]
});
