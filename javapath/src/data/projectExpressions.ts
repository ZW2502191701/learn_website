import type { ProjectExpression } from '../types';

export const projectExpressions: ProjectExpression[] = [
  {
    id: 'expr-redis-cache',
    moduleId: 'redis',
    title: 'Redis 在项目中的缓存应用',
    businessBackground: '电商系统商品详情页 QPS 达到 5000+，每次请求都要查询数据库，响应时间超过 800ms，数据库压力巨大。',
    technicalProblem: '数据库无法承载高并发读请求，需要引入缓存层降低数据库压力，同时要处理缓存一致性问题。',
    whyThisTech: 'Redis 单机 QPS 可达 10 万+，支持丰富的数据结构，有成熟的持久化和集群方案，是业界最常用的缓存中间件。',
    howToDesign: '采用 Cache-Aside 模式：读请求先查 Redis，miss 则查 DB 并回写缓存；写请求先更新 DB，再删除缓存。对热点商品使用互斥锁防止缓存击穿。',
    coreCode: '// 读：先缓存，miss 回源\nString value = redis.get(key);\nif (value == null) {\n    String lockKey = key + ":lock";\n    if (redis.setnx(lockKey, "1", 30)) {\n        try {\n            value = db.query(id);\n            redis.setex(key, 3600, value);\n        } finally {\n            redis.del(lockKey);\n        }\n    }\n}',
    issuesFaced: ['缓存与数据库双写不一致', '热点 key 导致单节点过载', '缓存雪崩时数据库被打垮'],
    optimizations: ['使用随机 TTL 防止雪崩', '热点 key 使用本地缓存 + Redis 二级缓存', '写操作采用延迟双删策略'],
    followUps: ['如果 Redis 宕机了怎么办？', '缓存和数据库的一致性如何保证？', '如何处理缓存穿透？'],
    scoreTemplate: { 业务背景: 5, 技术选型: 5, 设计思路: 5, 核心代码: 5, 问题解决: 5, 面试表达: 5 }
  },
  {
    id: 'expr-mysql-index',
    moduleId: 'mysql',
    title: 'MySQL 索引优化实战',
    businessBackground: '订单查询接口响应时间从 200ms 飙升到 3s，排查发现是订单表数据量突破 2000 万后查询变慢。',
    technicalProblem: '复杂查询条件导致全表扫描，EXPLAIN 显示 type=ALL，扫描行数 2000 万+。',
    whyThisTech: 'B+ 树索引可以将查询时间从 O(n) 降到 O(logn)，联合索引和覆盖索引进一步减少回表和排序开销。',
    howToDesign: '分析高频查询的 WHERE、ORDER BY、GROUP BY 条件，建立联合索引 (user_id, status, created_at)，覆盖主要查询场景。',
    coreCode: '-- 建立联合索引\nALTER TABLE orders ADD INDEX idx_user_status_time \n  (user_id, status, created_at);\n\n-- 查询走索引\nSELECT * FROM orders \nWHERE user_id = ? AND status = ? \nORDER BY created_at DESC LIMIT 20;',
    issuesFaced: ['索引建立后写入性能下降', '联合索引顺序不当导致失效', 'LIKE 左模糊导致索引失效'],
    optimizations: ['使用覆盖索引避免回表', '大分页使用延迟关联优化', '定期分析慢查询日志优化索引'],
    followUps: ['为什么用 B+ 树而不是 B 树？', '什么情况下索引会失效？', '如何设计分库分表？'],
    scoreTemplate: { '业务背景': 5, '问题定位': 5, '索引设计': 5, 'SQL优化': 5, '效果验证': 5, '面试表达': 5 }
  },
  {
    id: 'expr-mq-order',
    moduleId: 'mq',
    title: 'MQ 在订单系统中的异步解耦',
    businessBackground: '下单链路包含库存扣减、积分计算、消息通知等多个步骤，同步调用导致下单 RT 过高，且任一服务故障影响主链路。',
    technicalProblem: '下单主链路与附属操作强耦合，无法独立扩展，且同步调用导致超时和级联故障。',
    whyThisTech: 'MQ 实现异步解耦，将非核心操作异步化，同时通过消息持久化和重试机制保证最终一致性。',
    howToDesign: '订单服务完成核心操作后发送 MQ 消息，库存/积分/通知服务各自消费。使用本地消息表保证消息可靠投递。',
    coreCode: '@Transactional\npublic void createOrder(OrderDTO dto) {\n    orderMapper.insert(order);\n    messageMapper.insert(localMsg); // 本地消息表\n}\n// 定时任务扫描本地消息表，投递到 MQ\n// 消费端幂等处理，成功则标记消息完成',
    issuesFaced: ['消息发送失败导致业务不一致', '消费端重复消费', '消息积压导致延迟'],
    optimizations: ['本地消息表 + 定时补偿', '消费端业务幂等设计', '增加消费者实例处理积压'],
    followUps: ['如何保证消息不丢失？', '如何处理消息顺序性？', 'RocketMQ 和 Kafka 怎么选？'],
    scoreTemplate: { 业务背景: 5, 问题分析: 5, 架构设计: 5, 可靠性保证: 5, 异常处理: 5, 面试表达: 5 }
  },
  {
    id: 'expr-spring-auth',
    moduleId: 'ssm',
    title: 'Spring Security + JWT 认证方案',
    businessBackground: '多端应用（Web、小程序、App）需要统一认证，传统 Session 方案无法横向扩展。',
    technicalProblem: 'Session 粘滞问题在集群环境下难以维护，且无法支持多端登录和 Token 续期。',
    whyThisTech: 'JWT 无状态特性天然支持分布式，Spring Security 提供完整的认证授权框架，RBAC 模型灵活管理权限。',
    howToDesign: '登录时签发 JWT（含 userId 和角色），请求经过 Filter 验证 Token，SecurityContext 中存储认证信息。使用 Redis 存储 Token 黑名单支持注销。',
    coreCode: '@Component\npublic class JwtFilter extends OncePerRequestFilter {\n    @Override\n    protected void doFilterInternal(HttpServletRequest req,\n        HttpServletResponse res, FilterChain chain) {\n        String token = extractToken(req);\n        if (token != null && jwtUtil.validate(token)) {\n            Authentication auth = jwtUtil.parse(token);\n            SecurityContextHolder.getContext()\n                .setAuthentication(auth);\n        }\n        chain.doFilter(req, res);\n    }\n}',
    issuesFaced: ['Token 过期后用户体验差', 'Token 无法主动失效', '角色权限粒度不够细'],
    optimizations: ['双 Token 方案（access + refresh）', 'Redis 黑名单支持注销', '自定义注解实现方法级权限'],
    followUps: ['JWT 和 Session 的区别？', '如何防止 Token 被盗用？', 'RBAC 如何设计数据库表？'],
    scoreTemplate: { 业务背景: 5, 技术选型: 5, 流程设计: 5, 安全考虑: 5, 扩展性: 5, 面试表达: 5 }
  },
  {
    id: 'expr-threadpool',
    moduleId: 'threads',
    title: '线程池在异步任务中的应用',
    businessBackground: '报表导出功能需要查询大量数据并生成 Excel，同步执行导致接口超时，用户体验极差。',
    technicalProblem: '大数据量操作阻塞主线程，接口超时率飙升，且无法限制并发导致服务器资源耗尽。',
    whyThisTech: '线程池实现任务异步化和资源隔离，通过核心参数控制并发度和队列容量，防止资源耗尽。',
    howToDesign: '使用 ThreadPoolExecutor 创建专用线程池，导出任务提交到线程池异步执行，完成后通过 WebSocket 推送下载链接。',
    coreCode: 'ThreadPoolExecutor exportPool = new ThreadPoolExecutor(\n    4, 8, 60, TimeUnit.SECONDS,\n    new LinkedBlockingQueue<>(100),\n    new ThreadFactoryBuilder()\n        .setNameFormat("export-%d").build(),\n    new ThreadPoolExecutor.CallerRunsPolicy()\n);\nCompletableFuture.runAsync(() -> {\n    List<Data> data = queryLargeData(params);\n    EasyExcel.write(path).write(data);\n    notifyUser(userId, path);\n}, exportPool);',
    issuesFaced: ['线程池参数设置不当导致拒绝', '异常被吞掉导致任务静默失败', '线程池未优雅关闭导致数据丢失'],
    optimizations: ['监控线程池活跃线程和队列深度', '统一异常处理和任务状态追踪', '使用 Spring @Async + 自定义线程池'],
    followUps: ['线程池的核心参数有哪些？', '拒绝策略分别适用什么场景？', '如何监控线程池状态？'],
    scoreTemplate: { 业务背景: 5, 参数设计: 5, 代码实现: 5, 异常处理: 5, 监控优化: 5, 面试表达: 5 }
  },
  {
    id: 'expr-microservice-sentinel',
    moduleId: 'microservice',
    title: 'Sentinel 限流降级在微服务中的应用',
    businessBackground: '促销活动期间，商品服务被瞬时流量打垮，导致整个购物链路不可用，影响范围扩大到全站。',
    technicalProblem: '缺乏流量防护机制，一个服务的故障通过调用链传播到整个系统，形成雪崩效应。',
    whyThisTech: 'Sentinel 提供实时流量控制、熔断降级和系统负载保护，支持动态规则配置，与 Spring Cloud 深度集成。',
    howToDesign: '对核心接口配置 QPS 限流规则，对下游调用配置熔断降级策略（慢调用比例+异常比例），实现服务级别的资源隔离。',
    coreCode: '@SentinelResource(value = "getProduct",\n    blockHandler = "getProductBlock",\n    fallback = "getProductFallback")\npublic Product getProduct(Long id) {\n    return productService.getById(id);\n}\n\npublic Product getProductBlock(Long id, BlockException ex) {\n    return cachedProductService.getFromLocalCache(id);\n}',
    issuesFaced: ['限流阈值设置不合理导致误杀', '降级返回的数据不够友好', '热点参数限流配置复杂'],
    optimizations: ['基于监控数据动态调整阈值', '降级返回缓存数据而非空', '使用热点参数限流保护核心商品'],
    followUps: ['限流和熔断的区别？', 'Sentinel 和 Hystrix 的区别？', '如何设计服务降级策略？'],
    scoreTemplate: { 业务背景: 5, 问题分析: 5, 规则设计: 5, 代码实现: 5, 监控调优: 5, 面试表达: 5 }
  }
];
