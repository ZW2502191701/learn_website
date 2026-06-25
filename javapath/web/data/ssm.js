/* ============================================================
 * SSM 框架 · 精修知识库（Spring / SpringMVC / MyBatis）
 * 数据源: C:\AI_Test\learn\SSM框架.pdf
 * ============================================================ */
(window.registerChapter || function(c){(window.JAVAPATH_CHAPTERS=window.JAVAPATH_CHAPTERS||[]).push(c);})({
  chapter: "SSM框架",
  module: "框架应用",
  order: 6,
  groups: ["Spring 核心", "Spring 进阶", "SpringMVC", "MyBatis"],
  units: [
    {
      id: "ioc-di",
      group: "Spring 核心",
      title: "IOC 与 DI",
      tags: ["面试高频", "IOC", "DI"],
      concept: [
        ["IOC 控制反转", "把对象的创建和依赖管理交给 <span class='key'>Spring 容器</span>，而不是程序自己 new，降低耦合。"],
        ["DI 依赖注入", "容器在创建 Bean 时自动把它依赖的其它 Bean 注入进来。方式：构造器注入（推荐）、Setter 注入、字段注入（@Autowired）。"],
        ["容器", "BeanFactory 是基础容器（懒加载）；<span class='key'>ApplicationContext</span> 是其子接口，预加载、支持 AOP/事件/国际化，实际开发用它。"]
      ],
      code: `// 构造器注入（推荐：依赖不可变、便于测试、避免循环依赖）
@Service
public class OrderService {
    private final UserService userService;

    // Spring 自动把容器里的 UserService 注入进来
    public OrderService(UserService userService) {
        this.userService = userService;
    }

    public void create() {
        userService.checkUser();   // 直接使用被注入的依赖
        System.out.println("订单已创建");
    }
}`,
      qa: [
        ["什么是 IOC 和 DI？", "IOC 是把对象创建权交给容器的思想；DI 是其实现手段，容器在装配 Bean 时自动注入依赖。"],
        ["为什么推荐构造器注入？", "依赖可声明为 final 不可变、保证注入时对象已完整、便于单元测试、能在启动时暴露循环依赖问题。"]
      ]
    },
    {
      id: "bean-lifecycle",
      group: "Spring 核心",
      title: "Bean 生命周期与作用域",
      tags: ["面试高频", "生命周期", "单例"],
      concept: [
        ["核心流程", "实例化 → 属性填充（依赖注入）→ <code>Aware</code> 回调 → <code>BeanPostProcessor</code> 前置 → <code>InitializingBean</code>/@PostConstruct → 后置处理（AOP 代理在此生成）→ 使用 → 销毁。"],
        ["作用域", "<span class='key'>singleton</span>（默认，容器内唯一）、prototype（每次获取新建）、request/session（Web）。"],
        ["单例线程安全", "Spring 单例 Bean 本身不保证线程安全，无状态设计即可；有可变成员变量时需自行同步。"]
      ],
      code: `@Component
public class MyBean {
    // 属性注入完成后执行，常用于初始化资源
    @PostConstruct
    public void init() {
        System.out.println("Bean 初始化：加载配置/建立连接");
    }

    // 容器关闭前执行，常用于释放资源
    @PreDestroy
    public void destroy() {
        System.out.println("Bean 销毁：释放连接/线程池");
    }
}`,
      qa: [
        ["简述 Bean 的生命周期？", "实例化→属性赋值→Aware 接口回调→初始化前后置处理(BeanPostProcessor)→初始化(@PostConstruct/afterPropertiesSet)→使用→销毁(@PreDestroy)。"],
        ["Spring 单例 Bean 线程安全吗？", "不保证。单例被多线程共享，若有可变成员就有并发问题。推荐设计成无状态 Bean，或用 ThreadLocal/局部变量。"]
      ]
    },
    {
      id: "aop",
      group: "Spring 进阶",
      title: "AOP 与动态代理",
      tags: ["面试高频", "AOP", "动态代理"],
      concept: [
        ["AOP 是什么", "面向切面编程，把日志、事务、权限等<span class='key'>横切关注点</span>从业务中抽离，用切面统一织入。"],
        ["两种动态代理", "<span class='key'>JDK 动态代理</span>（基于接口）；<span class='key'>CGLIB</span>（基于子类，无接口时用）。Spring Boot 默认用 CGLIB。"],
        ["术语", "切点 Pointcut（在哪切）、通知 Advice（切了做什么：Before/After/Around）、切面 Aspect（切点+通知）。"]
      ],
      code: `@Aspect
@Component
public class LogAspect {
    // 切点：拦截 service 包下所有方法
    @Around("execution(* com.demo.service..*(..))")
    public Object log(ProceedingJoinPoint pjp) throws Throwable {
        long start = System.currentTimeMillis();
        Object result = pjp.proceed();   // 执行原方法
        long cost = System.currentTimeMillis() - start;
        System.out.println(pjp.getSignature() + " 耗时 " + cost + "ms");
        return result;
    }
}`,
      qa: [
        ["Spring AOP 的实现原理？", "动态代理：目标有接口用 JDK Proxy，无接口用 CGLIB 生成子类，在代理对象中织入通知。"],
        ["AOP 在项目里有哪些应用？", "声明式事务、统一日志、接口耗时统计、权限校验、分布式锁、参数校验等横切逻辑。"]
      ]
    },
    {
      id: "transaction-fail",
      group: "Spring 进阶",
      title: "声明式事务与失效场景",
      tags: ["面试高频", "@Transactional", "传播行为"],
      concept: [
        ["原理", "<code>@Transactional</code> 基于 AOP，方法前开启事务、正常提交、异常回滚。"],
        ["失效场景", "<ul><li>方法非 public。</li><li><span class='key'>自调用</span>（同类内 a() 调 b()，不走代理）。</li><li>异常被 catch 吞掉。</li><li>默认只回滚 RuntimeException，受检异常需配 <code>rollbackFor</code>。</li></ul>"],
        ["传播行为", "REQUIRED（默认，有则加入无则新建）、REQUIRES_NEW（总是新事务）、NESTED（嵌套）。"]
      ],
      code: `@Service
public class PayService {
    // 默认只回滚 RuntimeException，加 rollbackFor 让所有异常都回滚
    @Transactional(rollbackFor = Exception.class)
    public void pay() throws Exception {
        deduct();   // 扣款
        // 若这里抛异常，上面的扣款会回滚（保证原子性）
        addRecord();
    }

    // 注意：同类内直接调用 pay() 会导致事务失效（自调用不走代理）
    private void deduct() {}
    private void addRecord() {}
}`,
      qa: [
        ["@Transactional 在哪些情况下会失效？", "方法非 public、同类自调用、异常被捕获未抛出、抛的是受检异常但没配 rollbackFor、目标方法被 final 修饰、未被 Spring 管理等。"],
        ["事务传播行为 REQUIRED 和 REQUIRES_NEW 区别？", "REQUIRED 复用已有事务（一起提交回滚）；REQUIRES_NEW 挂起当前事务、开启独立新事务（互不影响）。"]
      ]
    },
    {
      id: "mybatis",
      group: "MyBatis",
      title: "MyBatis 缓存与 #/$ 区别",
      tags: ["面试高频", "缓存", "SQL注入"],
      concept: [
        ["#{} vs ${}", "<code>#{}</code> 用<span class='key'>预编译 PreparedStatement</span>占位，防 SQL 注入（推荐）；<code>${}</code> 直接字符串拼接，有注入风险，仅用于动态表名/列名等无法预编译处。"],
        ["一级缓存", "<span class='key'>SqlSession 级别</span>，默认开启。同一会话相同查询走缓存，增删改或提交后失效。"],
        ["二级缓存", "<span class='key'>Mapper/namespace 级别</span>，跨 SqlSession 共享，需手动开启。分布式环境慎用，建议用 Redis 替代。"]
      ],
      code: `<!-- #{} 预编译，安全 -->
<select id="getUser" resultType="User">
    SELECT * FROM user WHERE name = #{name}
</select>

<!-- ${} 直接拼接，仅用于动态排序字段这类无法预编译的场景，需自行校验白名单 -->
<select id="listOrder" resultType="User">
    SELECT * FROM user ORDER BY ${column}
</select>`,
      qa: [
        ["#{} 和 ${} 的区别？", "#{} 是预编译占位符，能防 SQL 注入；${} 是字符串直接替换，有注入风险，只适合动态表名、列名、排序方向等场景。"],
        ["MyBatis 一级、二级缓存的区别？", "一级缓存是 SqlSession 级、默认开启、会话内有效；二级缓存是 namespace 级、需手动开启、可跨会话，但分布式下易脏读，常用 Redis 替代。"]
      ]
    }
  ]
});
