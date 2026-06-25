/* ============================================================
 * 微服务篇 · 精修知识库（Spring Cloud / Alibaba）
 * 数据源: C:\AI_Test\learn\微服务篇.pdf
 * ============================================================ */
(window.registerChapter || function(c){(window.JAVAPATH_CHAPTERS=window.JAVAPATH_CHAPTERS||[]).push(c);})({
  chapter: "微服务篇",
  module: "分布式与中间件",
  order: 8,
  groups: ["注册与配置", "调用与容错", "网关与分布式"],
  units: [
    {
      id: "registry",
      group: "注册与配置",
      title: "服务注册与发现（Nacos/Eureka）",
      tags: ["面试高频", "Nacos", "注册中心"],
      concept: [
        ["作用", "服务启动时把地址<span class='key'>注册</span>到注册中心，调用方从注册中心<span class='key'>发现</span>可用实例，实现动态扩缩容、解耦服务地址。"],
        ["CAP 取舍", "Eureka 是 <span class='key'>AP</span>（保可用，可能短暂读到旧数据）；Nacos 可切换 AP/CP；Zookeeper 是 CP（选主期间不可用）。"],
        ["心跳与健康检查", "实例定期发心跳续约，注册中心剔除长时间无心跳的实例。"]
      ],
      code: `// 只需引依赖 + 注解 + 配置，服务即自动注册到 Nacos
@SpringBootApplication
@EnableDiscoveryClient   // 开启服务发现
public class OrderApplication {
    public static void main(String[] args) {
        SpringApplication.run(OrderApplication.class, args);
    }
}
// application.yml:
//   spring.cloud.nacos.discovery.server-addr: localhost:8848
//   spring.application.name: order-service   # 注册时的服务名`,
      qa: [
        ["注册中心的作用？", "管理服务实例的注册、发现与健康检查，让调用方无需硬编码地址，支持动态上下线和负载均衡。"],
        ["Eureka 和 Nacos 区别？", "Eureka 仅 AP、功能单一、已停更；Nacos 支持 AP/CP 切换、集成配置中心、有控制台，是目前主流选择。"]
      ]
    },
    {
      id: "feign",
      group: "调用与容错",
      title: "OpenFeign 声明式调用与负载均衡",
      tags: ["Feign", "负载均衡"],
      concept: [
        ["OpenFeign", "用<span class='key'>接口 + 注解</span>声明式地发起 HTTP 调用，像调本地方法一样调远程服务，底层是动态代理 + HTTP 客户端。"],
        ["负载均衡", "集成 LoadBalancer，从注册中心拉取实例列表，按策略（轮询/随机）选一个调用。"],
        ["超时与重试", "可配连接/读取超时；配合熔断防止级联故障。"]
      ],
      code: `// 声明式调用：定义接口，Feign 自动生成实现去调 user-service
@FeignClient(name = "user-service")   // 服务名，从注册中心解析地址
public interface UserClient {
    @GetMapping("/user/{id}")
    User getById(@PathVariable("id") Long id);
}

// 使用：像调本地方法一样，负载均衡由框架处理
@Service
public class OrderService {
    @Autowired UserClient userClient;
    public void check(Long uid) {
        User u = userClient.getById(uid);   // 实际发起远程 HTTP 调用
        System.out.println("远程拿到用户: " + u);
    }
}`,
      qa: [
        ["Feign 的原理？", "通过动态代理为接口生成实现类，把注解解析成 HTTP 请求，结合 LoadBalancer 做负载均衡后发起调用。"],
        ["Feign 调用超时怎么处理？", "配置连接和读超时时间，配合 Sentinel/Resilience4j 做熔断降级，失败走 fallback，避免线程被拖垮。"]
      ]
    },
    {
      id: "sentinel",
      group: "调用与容错",
      title: "熔断、降级与限流",
      tags: ["面试高频", "Sentinel", "熔断"],
      concept: [
        ["雪崩问题", "一个服务挂导致调用方线程耗尽，故障层层传导。需要容错保护。"],
        ["三板斧", "<ul><li><span class='key'>限流</span>：限制 QPS，超出快速失败。</li><li><span class='key'>熔断</span>：错误率过高时断开调用，过段时间半开试探。</li><li><span class='key'>降级</span>：失败时返回兜底数据，保证核心可用。</li></ul>"],
        ["工具", "Sentinel（阿里，功能强、有控制台）、Resilience4j、早期的 Hystrix（已停更）。"]
      ],
      code: `// Sentinel 资源保护 + 降级兜底
@Service
public class ProductService {
    // value 为资源名，blockHandler 处理限流/熔断，fallback 处理业务异常
    @SentinelResource(value = "getProduct", fallback = "defaultProduct")
    public Product getProduct(Long id) {
        return productMapper.selectById(id);
    }

    // 降级方法：被熔断或异常时返回兜底数据，保证服务不崩
    public Product defaultProduct(Long id) {
        System.out.println("触发降级，返回兜底商品");
        return new Product(id, "默认商品");
    }
}`,
      qa: [
        ["熔断、降级、限流的区别？", "限流是控制入口流量（超量拒绝）；熔断是检测到下游故障时主动断开调用（防雪崩）；降级是失败时返回兜底结果（保核心）。三者常配合使用。"],
        ["熔断器的三种状态？", "关闭（正常放行）、打开（错误率超阈值，快速失败）、半开（隔一段时间放少量请求试探，成功则恢复关闭）。"]
      ]
    },
    {
      id: "distributed-tx",
      group: "网关与分布式",
      title: "分布式事务（Seata）",
      tags: ["面试高频", "分布式事务", "TCC"],
      concept: [
        ["问题", "跨服务、跨库的操作如何保证一起成功或失败。本地事务搞不定。"],
        ["常见方案", "<ul><li><span class='key'>2PC/AT</span>（Seata 默认，自动补偿，侵入低）。</li><li><span class='key'>TCC</span>（Try-Confirm-Cancel，手动控制，性能好）。</li><li><span class='key'>本地消息表 / MQ 最终一致</span>（异步、最终一致）。</li></ul>"],
        ["选型", "强一致用 AT/TCC；高并发可接受最终一致用 MQ 方案。多数互联网业务追求最终一致即可。"]
      ],
      code: `// Seata AT 模式：一个注解搞定分布式事务
@GlobalTransactional(rollbackFor = Exception.class)
public void placeOrder(Order order) {
    orderService.create(order);     // 服务A：本地库写订单
    storageService.deduct(order);   // 服务B：远程扣库存
    accountService.debit(order);    // 服务C：远程扣余额
    // 任一步失败，Seata 会按 undo_log 自动回滚前面已提交的本地事务
}`,
      qa: [
        ["有哪些分布式事务方案？", "2PC/Seata AT（自动补偿）、TCC（手动三阶段）、本地消息表、MQ 事务消息、最大努力通知。强一致用前两者，高并发用最终一致方案。"],
        ["AT 模式的原理？", "一阶段提交本地事务并记录数据快照(undo_log)；二阶段全局提交则删快照，全局回滚则用 undo_log 反向恢复数据。"]
      ]
    }
  ]
});
