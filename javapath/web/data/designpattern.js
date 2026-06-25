/* ============================================================
 * 设计模式篇 · 精修知识库
 * 数据源: C:\AI_Test\learn\设计模式篇.pdf
 * ============================================================ */
(window.registerChapter || function(c){(window.JAVAPATH_CHAPTERS=window.JAVAPATH_CHAPTERS||[]).push(c);})({
  chapter: "设计模式篇",
  module: "工程素养",
  order: 9,
  groups: ["设计原则", "创建型", "结构型", "行为型"],
  units: [
    {
      id: "solid",
      group: "设计原则",
      title: "六大设计原则（SOLID）",
      tags: ["面试高频", "设计原则"],
      concept: [
        ["核心原则", "<ul><li><span class='key'>单一职责</span>：一个类只负责一件事。</li><li><span class='key'>开闭原则</span>：对扩展开放，对修改关闭。</li><li><span class='key'>里氏替换</span>：子类能替换父类。</li><li><span class='key'>依赖倒置</span>：面向接口编程。</li><li>接口隔离、迪米特法则。</li></ul>"],
        ["开闭原则最重要", "新增功能通过新增代码（扩展）而非修改已有代码实现，降低引入 bug 的风险。设计模式大多是为了贯彻它。"]
      ],
      code: `// 开闭原则示例：新增支付方式无需改原有代码，只需新增实现类
interface Payment {
    void pay(double amount);
}
class WechatPay implements Payment {
    public void pay(double a) { System.out.println("微信支付 " + a); }
}
// 将来加支付宝：新建 AliPay implements Payment 即可，不动已有代码
class Cashier {
    void checkout(Payment p, double amount) {
        p.pay(amount);   // 面向接口，依赖倒置
    }
}
public class Demo {
    public static void main(String[] args) {
        new Cashier().checkout(new WechatPay(), 99.0);
    }
}`,
      qa: [
        ["什么是开闭原则？", "对扩展开放、对修改关闭。增加新功能时通过新增代码实现，尽量不修改已有稳定代码，降低风险。"],
        ["依赖倒置原则是什么？", "高层模块不依赖低层实现，二者都依赖抽象（接口）。这样替换实现时上层无需改动。"]
      ]
    },
    {
      id: "singleton",
      group: "创建型",
      title: "单例模式",
      tags: ["面试高频", "单例", "双重检查"],
      concept: [
        ["要点", "保证一个类只有一个实例。关键：私有构造、静态实例、提供全局访问点。"],
        ["常见写法", "<ul><li><span class='key'>饿汉式</span>：类加载即创建，线程安全但可能浪费。</li><li><span class='key'>双重检查锁(DCL)</span>：懒加载+线程安全，需 volatile 防重排。</li><li><span class='key'>静态内部类</span>：懒加载+线程安全（推荐）。</li><li><span class='key'>枚举</span>：最安全，防反射和反序列化破坏。</li></ul>"]
      ],
      code: `// 推荐：静态内部类实现单例（懒加载 + 线程安全 + 写法简洁）
public class Singleton {
    private Singleton() {}   // 私有构造，外部不能 new

    // 只有首次调用 getInstance 时才加载内部类并创建实例（懒加载）
    // 由 JVM 类加载机制保证线程安全
    private static class Holder {
        static final Singleton INSTANCE = new Singleton();
    }
    public static Singleton getInstance() {
        return Holder.INSTANCE;
    }
}`,
      qa: [
        ["写一个线程安全的单例？", "推荐静态内部类（懒加载+JVM 保证线程安全）或枚举（防反射/反序列化）。DCL 需要给实例加 volatile 防止指令重排。"],
        ["DCL 为什么要加 volatile？", "new 对象分'分配内存、初始化、赋引用'三步，可能重排序。其它线程可能拿到未初始化完成的对象。volatile 禁止重排避免此问题。"]
      ]
    },
    {
      id: "factory",
      group: "创建型",
      title: "工厂模式",
      tags: ["工厂", "解耦"],
      concept: [
        ["作用", "把对象创建逻辑封装起来，调用方不直接 new 具体类，降低耦合，符合开闭原则。"],
        ["分类", "简单工厂（一个工厂按参数造对象）、工厂方法（每个产品一个工厂）、抽象工厂（生产产品族）。"],
        ["应用", "Spring 的 BeanFactory、各种 getInstance、日志框架的 LoggerFactory。"]
      ],
      code: `// 简单工厂：根据类型创建对象，调用方不关心具体实现类
interface Shape { void draw(); }
class Circle implements Shape { public void draw(){ System.out.println("画圆"); } }
class Square implements Shape { public void draw(){ System.out.println("画方"); } }

class ShapeFactory {
    static Shape create(String type) {
        // 创建逻辑集中在工厂，新增形状改这里即可
        if ("circle".equals(type)) return new Circle();
        if ("square".equals(type)) return new Square();
        throw new IllegalArgumentException("未知类型");
    }
}
public class Demo {
    public static void main(String[] args) {
        ShapeFactory.create("circle").draw();
    }
}`,
      qa: [
        ["工厂模式解决什么问题？", "把对象创建与使用分离，调用方依赖抽象而非具体类，新增产品时影响范围小，便于维护和扩展。"],
        ["项目里哪里用到工厂模式？", "Spring 容器(BeanFactory/ApplicationContext)、Calendar.getInstance、SLF4J 的 LoggerFactory、各类连接池等。"]
      ]
    },
    {
      id: "strategy",
      group: "行为型",
      title: "策略模式",
      tags: ["面试高频", "策略", "消除if-else"],
      concept: [
        ["作用", "把一组可互换的算法各自封装成类，运行时动态切换，<span class='key'>消除大量 if-else</span>。"],
        ["结构", "策略接口 + 多个策略实现 + 上下文持有策略。常配合工厂/Map 选择策略。"],
        ["应用", "支付方式选择、优惠券计算、不同渠道的消息推送。Spring 可把所有策略注入成 Map。"]
      ],
      code: `// 策略模式：用 Map 装配所有策略，按 key 取用，彻底消除 if-else
interface DiscountStrategy { double apply(double price); }

class NoDiscount implements DiscountStrategy {
    public double apply(double p){ return p; }
}
class HalfDiscount implements DiscountStrategy {
    public double apply(double p){ return p * 0.5; }
}
public class Demo {
    public static void main(String[] args) {
        Map<String, DiscountStrategy> strategies = new HashMap<>();
        strategies.put("none", new NoDiscount());
        strategies.put("half", new HalfDiscount());

        // 运行时按业务参数选择策略，无需 if-else 判断
        DiscountStrategy s = strategies.get("half");
        System.out.println("折后价 = " + s.apply(100));  // 50.0
    }
}`,
      qa: [
        ["策略模式适合什么场景？", "有多种可互换算法/业务规则、且常需扩展时，如多种支付、计费、风控规则。能消除 if-else、符合开闭原则。"],
        ["策略模式怎么和 Spring 结合消除 if-else？", "让每种策略实现同一接口并注册为 Bean，Spring 自动把它们注入成 Map<beanName, Strategy>，运行时按 key 直接取用。"]
      ]
    }
  ]
});
