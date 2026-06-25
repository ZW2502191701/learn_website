import { ArrowRight, CheckCircle2, Link2 } from 'lucide-react';
import type { RouteProps } from '../types';
import { Panel, ProgressBar, Tag } from '../components/Primitives';
import { appData, moduleLookup } from '../data/appData';
import { masteryForModule } from '../lib/metrics';

const stages = [
  { title: 'Java 基础', modules: ['interview'], hours: 8, deps: ['语法基础', 'OOP'] },
  { title: '集合源码', modules: ['collections'], hours: 12, deps: ['Java 基础'] },
  { title: 'JVM', modules: ['jvm'], hours: 14, deps: ['类加载', '内存模型'] },
  { title: '并发编程', modules: ['threads'], hours: 16, deps: ['线程基础', 'JVM'] },
  { title: '数据库', modules: ['mysql'], hours: 14, deps: ['SQL 基础'] },
  { title: '缓存', modules: ['redis'], hours: 10, deps: ['数据库', '网络基础'] },
  { title: '框架', modules: ['ssm'], hours: 12, deps: ['Java 基础', '反射'] },
  { title: '微服务', modules: ['microservice'], hours: 12, deps: ['Spring', '网络'] },
  { title: '消息队列', modules: ['mq'], hours: 10, deps: ['异步解耦', '微服务'] },
  { title: '设计模式', modules: ['designpattern'], hours: 8, deps: ['OOP', 'Spring'] },
  { title: '系统设计', modules: ['scenario'], hours: 12, deps: ['Redis', 'MySQL', 'MQ'] },
  { title: '面试冲刺', modules: ['interview', 'scenario'], hours: 10, deps: ['项目复盘', '表达模板'] }
];

export function LearningPathRoute({ state, goTo }: RouteProps) {
  return (
    <div className="route-stack">
      <Panel>
        <div className="route-intro">
          <div>
            <h2>学习路径</h2>
            <p>按 Java 后端成长路径组织，从基础源码到系统设计，再到大厂面试表达。每个阶段都绑定 PDF 模块、预计耗时、掌握度和前置依赖。</p>
          </div>
          <button className="primary-btn" type="button" onClick={() => goTo('plan')}>
            生成今日复习任务 <ArrowRight size={16} />
          </button>
        </div>
      </Panel>

      <div className="path-timeline">
        {stages.map((stage, index) => {
          const mastery = Math.round(
            stage.modules.reduce((sum, moduleId) => sum + masteryForModule(state, moduleId), 0) / stage.modules.length
          );
          const pointCount = appData.knowledgePoints.filter((point) => stage.modules.includes(point.moduleId)).length;
          return (
            <section className="path-card" key={`${stage.title}-${index}`}>
              <div className="path-index">{String(index + 1).padStart(2, '0')}</div>
              <div className="path-body">
                <div className="path-title-row">
                  <h3>{stage.title}</h3>
                  {mastery >= 80 ? <Tag tone="green">接近掌握</Tag> : mastery >= 40 ? <Tag tone="blue">学习中</Tag> : <Tag>未开始</Tag>}
                </div>
                <p>{stage.modules.map((id) => moduleLookup.get(id)?.description).join(' ')}</p>
                <div className="path-meta">
                  <span>{pointCount} 个知识点</span>
                  <span>{stage.hours} 小时</span>
                  <span>{stage.modules.map((id) => moduleLookup.get(id)?.title).join(' / ')}</span>
                </div>
                <ProgressBar value={mastery} />
                <div className="dependency-row">
                  <Link2 size={14} />
                  {stage.deps.map((dep) => (
                    <Tag key={dep}>{dep}</Tag>
                  ))}
                </div>
              </div>
              <button className="icon-action" type="button" onClick={() => goTo('modules', stage.title)}>
                <CheckCircle2 size={18} />
              </button>
            </section>
          );
        })}
      </div>
    </div>
  );
}
