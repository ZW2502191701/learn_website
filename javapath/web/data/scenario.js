/* ============================================================
 * 技术场景篇 · 精修知识库（真实工程场景）
 * 数据源: C:\AI_Test\learn\技术场景篇.pdf
 * ============================================================ */
(window.registerChapter || function(c){(window.JAVAPATH_CHAPTERS=window.JAVAPATH_CHAPTERS||[]).push(c);})({
  chapter: "技术场景篇",
  module: "工程素养",
  order: 10,
  groups: ["分布式", "高并发", "线上问题"],
  units: [
    {
      id: "distributed-lock",
      group: "分布式",
      title: "分布式锁的实现",
      tags: ["面试高频", "Redis", "Redisson"],
      concept: [
        ["为什么需要", "集群部署下 JVM 本地锁（synchronized）只在单机有效，需要跨进程的<span class='key'>分布式锁</span>保证互斥。"],
        ["Redis 方案", "<code>SET key value NX EX</code> 加锁（原子）；value 用唯一标识，释放时用 <span class='key'>Lua 脚本</span>校验后删除，防误删他人锁。"],
        ["Redisson", "生产推荐：自动续期（<span class='key'>看门狗</span>，防业务没执行完锁就过期）、可重入、解决了手写锁的诸多坑。"]
      ],
      code: `// 生产推荐 Redisson：自带看门狗自动续期，可重入
public void doBiz() {
    RLock lock = redisson.getLock("order:lock:1001");
    try {
        // 最多等 3 秒拿锁；拿到后默认 30 秒过期，看门狗会自动续期
        if (lock.tryLock(3, TimeUnit.SECONDS)) {
            process();   // 临界区：保证集群下也只有一个线程执行
        }
    } catch (InterruptedException e) {
        Thread.currentThread().interrupt();
    } finally {
        if (lock.isHeldByCurrentThread()) {
            lock.unlock();   // 释放锁，仅释放自己持有的
        }
    }
}
private void process() {}`,
      qa: [
        ["Redis 分布式锁怎么实现？要注意什么？", "用 SET NX EX 原子加锁；value 设唯一值，释放用 Lua 脚本'比较 value 再删除'防误删；考虑锁过期但业务没执行完，用看门狗续期。"],
        ["为什么用 Redisson 而不是自己写？", "Redisson 解决了原子续期(看门狗)、可重入、释放安全等问题，还支持公平锁、读写锁、联锁，比手写可靠得多。"]
      ]
    },
    {
      id: "idempotent",
      group: "分布式",
      title: "接口幂等性设计",
      tags: ["面试高频", "幂等", "防重复提交"],
      concept: [
        ["场景", "用户重复点击、网络重试、MQ 重投，导致同一操作执行多次（如重复下单、重复扣款）。"],
        ["方案", "<ul><li><span class='key'>token 机制</span>：先获取 token，提交时校验并删除，重复提交 token 失效。</li><li>数据库<span class='key'>唯一索引</span>。</li><li>状态机：只允许特定状态流转。</li><li>乐观锁(version)。</li></ul>"]
      ],
      code: `// token 防重复提交：进表单先发 token，提交时原子校验+删除
public boolean submit(String token, Order order) {
    // 用 Lua 或 DEL 返回值保证"校验并删除"的原子性
    Long deleted = redis.opsForValue().getOperations().delete("token:" + token) ? 1L : 0L;
    if (deleted == 0) {
        System.out.println("重复提交，已拦截");
        return false;   // token 已被用过 -> 是重复请求
    }
    process(order);     // 首次提交，正常处理
    return true;
}
private void process(Order o) {}`,
      qa: [
        ["如何保证接口幂等？", "GET/DELETE 天然幂等；POST 用 token 机制、数据库唯一索引、状态机或乐观锁，确保重复请求不会产生重复副作用。"],
        ["如何防止订单重复提交？", "下单页预发 token 存 Redis，提交时原子地校验并删除 token；同时数据库对业务唯一键加唯一索引兜底。"]
      ]
    },
    {
      id: "high-concurrency",
      group: "高并发",
      title: "秒杀系统设计要点",
      tags: ["面试高频", "秒杀", "限流"],
      concept: [
        ["核心思路", "<span class='key'>层层削峰</span>，把流量挡在数据库之前：前端限流 → 网关限流 → Redis 预扣库存 → MQ 异步下单 → DB 最终落库。"],
        ["防超卖", "Redis 用 Lua 脚本原子扣减库存；DB 用 <code>update ... where stock>0</code> 兜底。"],
        ["其它", "热点数据预热、按钮防重、验证码错峰、独立部署避免拖垮主站。"]
      ],
      code: `-- Redis 原子扣库存的 Lua 脚本（防超卖）
-- KEYS[1]=库存key  ARGV[1]=购买数量
local stock = tonumber(redis.call('GET', KEYS[1]))
if stock == nil or stock < tonumber(ARGV[1]) then
    return 0          -- 库存不足，秒杀失败
end
redis.call('DECRBY', KEYS[1], ARGV[1])
return 1              -- 扣减成功，后续异步发 MQ 落库`,
      qa: [
        ["秒杀系统怎么设计？", "多级削峰：前端按钮防重+限流、网关限流、Redis 预扣库存(Lua 原子)、MQ 异步落库、DB update where stock>0 兜底防超卖，热点预热、独立部署。"],
        ["如何防止超卖？", "Redis 用 Lua 脚本原子判断并扣减库存；数据库层用乐观锁或 update set stock=stock-1 where stock>=数量 作最终保证。"]
      ]
    },
    {
      id: "online-trouble",
      group: "线上问题",
      title: "线上 CPU 飙高 / 内存泄漏排查",
      tags: ["面试高频", "排查", "Arthas"],
      concept: [
        ["CPU 飙高", "<code>top</code> 找进程 → <code>top -Hp pid</code> 找线程 → 线程 ID 转十六进制 → <code>jstack</code> 定位代码。常见原因：死循环、频繁 GC、正则回溯。"],
        ["内存泄漏", "<code>jmap -dump</code> 导出堆 → <span class='key'>MAT</span> 看支配树找大对象与引用链。常见：静态集合只增不减、连接未关、ThreadLocal 未 remove。"],
        ["利器 Arthas", "在线诊断神器：<code>thread</code> 看忙线程、<code>watch</code> 看方法入参出参、<code>trace</code> 看耗时分布，无需重启。"]
      ],
      code: `# CPU 飙高排查四步（服务器终端执行）
top                          # 1. 找到高 CPU 的 Java 进程 PID
top -Hp <pid>               # 2. 找到该进程内高 CPU 的线程 TID
printf "%x\\n" <tid>         # 3. 线程 ID 转十六进制
jstack <pid> | grep <hex>  # 4. 在线程栈里定位到具体代码行

# 或用 Arthas 一条命令搞定：
# thread -n 3   查看最忙的 3 个线程及其堆栈`,
      qa: [
        ["线上 CPU 100% 怎么排查？", "top 定位进程→top -Hp 定位线程→线程号转 16 进制→jstack 找到对应栈帧定位代码；或直接用 Arthas thread -n 查最忙线程。常见原因是死循环、频繁 Full GC。"],
        ["怎么定位内存泄漏？", "用 -XX:+HeapDumpOnOutOfMemoryError 或 jmap 导出堆，MAT 分析支配树找占用最大的对象和 GC Root 引用链，定位只增不减的集合或未释放资源。"]
      ]
    }
  ]
});
