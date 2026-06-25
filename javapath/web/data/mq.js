/* ============================================================
 * 消息中间件篇 · 精修知识库（以 RabbitMQ / Kafka 为主）
 * 数据源: C:\AI_Test\learn\消息中间件篇.pdf
 * ============================================================ */
(window.registerChapter || function(c){(window.JAVAPATH_CHAPTERS=window.JAVAPATH_CHAPTERS||[]).push(c);})({
  chapter: "消息中间件篇",
  module: "分布式与中间件",
  order: 7,
  groups: ["基础", "可靠性", "高级特性", "Kafka"],
  units: [
    {
      id: "mq-why",
      group: "基础",
      title: "为什么用 MQ：解耦、异步、削峰",
      tags: ["面试高频", "解耦", "削峰"],
      concept: [
        ["三大作用", "<ul><li><span class='key'>解耦</span>：生产者只发消息，不关心谁消费。</li><li><span class='key'>异步</span>：耗时操作丢给 MQ，快速响应用户。</li><li><span class='key'>削峰</span>：突发流量先入队列，消费者按能力处理。</li></ul>"],
        ["引入代价", "系统可用性下降（MQ 挂全挂）、复杂度上升（重复消费、顺序、一致性）、数据一致性问题。"],
        ["选型", "RabbitMQ 时延低、功能全，适合业务解耦；Kafka 吞吐极高，适合日志/大数据；RocketMQ 适合电商、事务消息。"]
      ],
      code: `// 异步下单示例（伪代码）：核心流程同步，非核心异步发 MQ
public void createOrder(Order order) {
    orderMapper.insert(order);        // 1. 核心：落库（同步）

    // 2. 非核心：发短信、加积分、通知物流 -> 发消息异步处理
    //    用户无需等这些操作完成，响应更快；服务也解耦了
    rabbitTemplate.convertAndSend("order.exchange", "order.created", order.getId());

    // 3. 立即返回，提升用户体验
    System.out.println("下单成功，后续通知异步处理");
}`,
      qa: [
        ["引入 MQ 有什么优缺点？", "优点：解耦、异步提速、削峰填谷。缺点：系统可用性降低、复杂度提高（要处理重复/顺序/丢失）、一致性更难保证。"],
        ["RabbitMQ 和 Kafka 怎么选？", "要低延迟、复杂路由、业务解耦选 RabbitMQ；要超高吞吐、日志采集、流处理选 Kafka。"]
      ]
    },
    {
      id: "mq-reliable",
      group: "可靠性",
      title: "消息不丢失",
      tags: ["面试高频", "可靠投递", "持久化"],
      concept: [
        ["三个环节", "<ul><li><span class='key'>生产者→Broker</span>：confirm 确认机制。</li><li><span class='key'>Broker 自身</span>：交换机、队列、消息都持久化到磁盘。</li><li><span class='key'>Broker→消费者</span>：手动 ACK，处理成功才确认。</li></ul>"],
        ["生产者确认", "RabbitMQ 用 publisher confirm；失败可重试或落库后定时补偿。"],
        ["消费者手动 ACK", "关闭自动 ACK，业务成功后手动 ack；失败 nack 重新入队或进死信队列。"]
      ],
      code: `// 消费者：手动 ACK，确保消息处理成功才确认
@RabbitListener(queues = "order.queue")
public void handle(Long orderId, Channel channel,
                   @Header(AmqpHeaders.DELIVERY_TAG) long tag) throws IOException {
    try {
        process(orderId);              // 处理业务
        channel.basicAck(tag, false);  // 成功：手动确认，Broker 删除该消息
    } catch (Exception e) {
        // 失败：拒绝并不重新入队，让它进入死信队列后续排查
        channel.basicNack(tag, false, false);
    }
}
private void process(Long id) {}`,
      qa: [
        ["如何保证消息不丢失？", "生产端开 confirm 确认+失败重试；Broker 端交换机/队列/消息全持久化；消费端关自动 ACK，处理成功再手动 ack。"],
        ["消息处理失败怎么办？", "重试若干次仍失败则 nack 进入死信队列，由人工或补偿任务处理，避免无限重试阻塞队列。"]
      ]
    },
    {
      id: "mq-dup",
      group: "可靠性",
      title: "重复消费与幂等",
      tags: ["面试高频", "幂等", "去重"],
      concept: [
        ["为什么会重复", "网络抖动导致 ACK 丢失、消费者重启等，MQ 只保证<span class='key'>至少一次</span>投递，无法绝对避免重复。"],
        ["解决思路", "保证消费<span class='key'>幂等</span>：<ul><li>数据库唯一索引（重复插入失败）。</li><li>Redis 记录已处理消息 ID（SETNX）。</li><li>业务状态机（已处理则跳过）。</li></ul>"],
        ["关键", "不要试图让 MQ 不重复，而是让消费者"消费多次结果一致"。"]
      ],
      code: `// 用 Redis 做幂等：每条消息有唯一 msgId，处理前先占位
public void consume(String msgId, Order order) {
    // setIfAbsent: 不存在才设置成功，返回 true 表示是第一次消费
    Boolean first = redis.opsForValue()
        .setIfAbsent("msg:" + msgId, "1", Duration.ofHours(24));

    if (Boolean.FALSE.equals(first)) {
        System.out.println("重复消息，已处理过，直接跳过");
        return;
    }
    process(order);   // 真正的业务处理
}
private void process(Order o) {}`,
      qa: [
        ["如何保证消息不被重复消费（幂等性）？", "给消息唯一 ID，消费前用 Redis SETNX 或数据库唯一索引判断是否已处理；或依赖业务的天然幂等（如根据状态机判断）。"],
        ["为什么 MQ 不能保证消息不重复？", "为了不丢消息，MQ 采用'至少一次'语义。网络异常导致 ACK 丢失时会重投，所以重复无法根除，只能靠消费端幂等。"]
      ]
    },
    {
      id: "kafka-highthroughput",
      group: "Kafka",
      title: "Kafka 高吞吐与顺序性",
      tags: ["Kafka", "分区", "顺序消费"],
      concept: [
        ["高吞吐原因", "<span class='key'>顺序写磁盘</span>、<span class='key'>零拷贝</span>(sendfile)、批量发送压缩、分区并行。"],
        ["分区机制", "Topic 分多个 Partition，分散到不同 Broker 实现并行；同一分区内消息<span class='key'>有序</span>，跨分区不保证全局有序。"],
        ["保证顺序", "需要顺序的消息发到<span class='key'>同一分区</span>（用同一 key，如订单 ID），且消费端单线程处理该分区。"]
      ],
      code: `// 同一订单的消息用订单ID作为 key，保证落到同一分区 -> 分区内有序
public void send(Order order) {
    // ProducerRecord(topic, key, value)
    // 相同 key 经哈希后进入同一 partition，从而保证该订单消息的顺序
    kafkaTemplate.send("order-topic",
        String.valueOf(order.getId()),   // key：保证同订单有序
        order.toJson());
    System.out.println("已发送，同订单消息顺序可保证");
}`,
      qa: [
        ["Kafka 为什么吞吐量这么高？", "顺序写磁盘（比随机写快）、零拷贝减少内核态拷贝、消息批量+压缩、分区并行读写。"],
        ["Kafka 如何保证消息顺序？", "Kafka 只保证单分区有序。把需要保序的消息用相同 key 发到同一分区，并让消费者对该分区单线程消费。"]
      ]
    }
  ]
});
