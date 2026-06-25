/* ============================================================
 * MySQL · 精修知识库
 * 数据源: C:\AI_Test\learn\MySQL.pdf
 * 代码示例为 SQL（lang: sql），前端不模拟运行，仅做高亮展示。
 * ============================================================ */
(window.registerChapter || function(c){(window.JAVAPATH_CHAPTERS=window.JAVAPATH_CHAPTERS||[]).push(c);})({
  chapter: "MySQL",
  module: "数据存储",
  order: 4,
  lang: "sql",
  groups: ["索引", "事务", "锁", "优化"],
  units: [
    {
      id: "index-structure",
      group: "索引",
      title: "B+ 树索引原理",
      tags: ["面试高频", "B+树", "InnoDB"],
      concept: [
        ["为什么用 B+ 树", "<ul><li>矮胖结构（3~4 层可存千万级数据），磁盘 IO 少。</li><li>非叶子节点只存索引、不存数据，单页能放更多键。</li><li>叶子节点用<span class='key'>双向链表</span>相连，范围查询高效。</li></ul>"],
        ["聚簇 vs 二级索引", "InnoDB 主键索引是<span class='key'>聚簇索引</span>，叶子节点直接存整行数据；二级索引叶子存主键值，需<span class='key'>回表</span>再查一次聚簇索引。"],
        ["覆盖索引", "查询的列都在索引里，无需回表，性能更好。这也是"不要 SELECT *"的原因之一。"]
      ],
      code: `-- 创建联合索引（遵循最左前缀原则）
CREATE INDEX idx_name_age ON user(name, age);

-- 覆盖索引：要查的 name、age 都在索引中，无需回表
EXPLAIN SELECT name, age FROM user WHERE name = 'Tom';

-- 会回表：select * 需要拿到完整行，二级索引 -> 主键 -> 聚簇索引
EXPLAIN SELECT * FROM user WHERE name = 'Tom';`,
      qa: [
        ["为什么 MySQL 用 B+ 树而不用 B 树/红黑树？", "B+ 树非叶子只存键、更矮胖、IO 更少；叶子链表利于范围查询。红黑树太高、IO 次数多，不适合磁盘存储。"],
        ["什么是回表？如何避免？", "用二级索引查到主键后再回聚簇索引取整行，叫回表。用覆盖索引（查询列都在索引中）可避免。"]
      ]
    },
    {
      id: "index-fail",
      group: "索引",
      title: "索引失效与最左前缀",
      tags: ["面试高频", "最左前缀", "索引优化"],
      concept: [
        ["最左前缀原则", "联合索引 (a,b,c) 只有从最左列连续使用才生效。<code>WHERE b=1</code> 不走索引，<code>WHERE a=1 AND b=2</code> 走 a、b。"],
        ["常见失效场景", "<ul><li>对索引列做<span class='key'>运算/函数</span>。</li><li>类型隐式转换（字符串列传数字）。</li><li>以 <code>%xx</code> 开头的 like。</li><li>OR 连接非索引列。</li></ul>"],
        ["怎么验证", "用 <code>EXPLAIN</code> 看 type（避免 ALL 全表）、key（实际用的索引）、Extra（Using index 表示覆盖索引）。"]
      ],
      code: `-- 索引：idx_name_age (name, age)

-- ✅ 命中（最左前缀）
SELECT * FROM user WHERE name = 'Tom' AND age = 18;

-- ❌ 失效：跳过最左列 name，直接用 age
SELECT * FROM user WHERE age = 18;

-- ❌ 失效：对索引列使用函数
SELECT * FROM user WHERE LEFT(name, 1) = 'T';

-- ❌ 失效：左模糊
SELECT * FROM user WHERE name LIKE '%om';`,
      qa: [
        ["哪些情况会导致索引失效？", "对索引列运算/用函数、类型隐式转换、左模糊 like '%x'、OR 连接非索引列、不满足最左前缀等。"],
        ["EXPLAIN 重点看哪些字段？", "type（访问类型，至少要到 range/ref，避免 ALL）、key（实际用的索引）、rows（扫描行数）、Extra（Using index / Using filesort）。"]
      ]
    },
    {
      id: "transaction",
      group: "事务",
      title: "事务隔离级别与 MVCC",
      tags: ["面试高频", "ACID", "MVCC"],
      concept: [
        ["ACID", "原子性（undo log）、一致性、隔离性（锁 + MVCC）、持久性（redo log）。"],
        ["四种隔离级别", "读未提交 → 读已提交 → <span class='key'>可重复读（InnoDB 默认）</span> → 串行化。隔离级别越高，并发越低。"],
        ["MVCC", "多版本并发控制：通过 <span class='key'>undo log 版本链 + ReadView</span> 实现快照读，使读写不阻塞。RC 每次读建 ReadView，RR 事务首次读时建一次，从而避免不可重复读。"]
      ],
      code: `-- 查看与设置隔离级别
SELECT @@transaction_isolation;
SET SESSION TRANSACTION ISOLATION LEVEL READ COMMITTED;

-- 一个标准事务
START TRANSACTION;
UPDATE account SET balance = balance - 100 WHERE id = 1;
UPDATE account SET balance = balance + 100 WHERE id = 2;
COMMIT;   -- 全部成功才提交；中途出错可 ROLLBACK 回滚`,
      qa: [
        ["有哪些隔离级别？分别解决什么问题？", "读未提交（有脏读）、读已提交（解决脏读，有不可重复读）、可重复读（解决不可重复读，InnoDB 用间隙锁基本解决幻读）、串行化（全解决，性能最低）。"],
        ["MVCC 的原理？", "靠隐藏列（事务ID、回滚指针）形成 undo log 版本链，配合 ReadView 判断版本可见性，实现非阻塞的一致性读。"]
      ]
    },
    {
      id: "lock",
      group: "锁",
      title: "InnoDB 锁机制",
      tags: ["行锁", "间隙锁", "死锁"],
      concept: [
        ["锁粒度", "表锁（开销小、并发低）、<span class='key'>行锁</span>（InnoDB 支持，基于索引加锁；若未命中索引会退化为表锁）。"],
        ["行锁类型", "记录锁（锁某行）、<span class='key'>间隙锁</span>（锁区间，防幻读）、临键锁（记录+间隙，RR 默认）。"],
        ["死锁", "两事务互相持有对方需要的锁。InnoDB 会自动检测并回滚代价小的事务。避免：固定加锁顺序、缩小事务、降低隔离级别。"]
      ],
      code: `-- 当前读会加锁（RR 级别下加临键锁，防止幻读）
START TRANSACTION;
SELECT * FROM user WHERE age = 18 FOR UPDATE;  -- 排他锁
-- ... 业务处理 ...
COMMIT;  -- 提交后释放锁

-- 注意：若 age 没有索引，行锁会退化成表锁，锁住整张表`,
      qa: [
        ["InnoDB 的行锁会升级为表锁吗？", "会。行锁是加在索引上的，如果查询条件没有命中索引，InnoDB 无法精确锁行，会退化为表锁。"],
        ["如何避免死锁？", "保证多个事务以相同顺序访问资源、尽量缩短事务、一次锁定所需全部资源、合理使用索引减少锁范围。"]
      ]
    },
    {
      id: "slow-query",
      group: "优化",
      title: "慢查询优化思路",
      tags: ["面试高频", "慢查询", "调优"],
      concept: [
        ["定位", "开启慢查询日志（<code>slow_query_log</code>）记录超过阈值的 SQL，再用 <code>EXPLAIN</code> / <code>SHOW PROFILE</code> 分析执行计划。"],
        ["常见手段", "<ul><li>加合适索引、用覆盖索引。</li><li>避免 SELECT *、深分页用游标/延迟关联。</li><li>大表拆分、冷热分离。</li><li>用 limit 限制、避免 N+1。</li></ul>"],
        ["深分页优化", "<code>LIMIT 1000000, 10</code> 要扫百万行。改为 <code>WHERE id > 上次最大id LIMIT 10</code> 利用索引跳过。"]
      ],
      code: `-- 慢查询：深分页，扫描并丢弃前 100 万行，很慢
SELECT * FROM orders ORDER BY id LIMIT 1000000, 10;

-- 优化①：延迟关联，先用覆盖索引取主键，再回表
SELECT * FROM orders o
JOIN (SELECT id FROM orders ORDER BY id LIMIT 1000000, 10) t
ON o.id = t.id;

-- 优化②：游标分页（记住上一页最大 id），最快
SELECT * FROM orders WHERE id > 1000000 ORDER BY id LIMIT 10;`,
      qa: [
        ["如何优化一条慢 SQL？", "先用慢查询日志定位、EXPLAIN 看执行计划；再针对性加索引/覆盖索引、改写 SQL、避免全表扫描和深分页、必要时分库分表。"],
        ["深分页为什么慢，怎么优化？", "LIMIT m,n 要扫描并丢弃前 m 行。可用延迟关联或游标分页（WHERE id > last_id）借助索引直接定位。"]
      ]
    }
  ]
});
