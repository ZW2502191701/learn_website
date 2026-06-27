import { ArrowRight, CheckCircle2, Link2, Target, Flame, Star } from 'lucide-react';
import { useMemo, useState } from 'react';
import type { RouteProps } from '../types';
import { Panel, ProgressBar, Tag } from '../components/Primitives';
import { appData, moduleLookup } from '../data/appData';
import { masteryForModule, overallMastery } from '../lib/metrics';
import { interviewReadinessScore } from '../services/recommendationService';

const BASE_STAGES = [
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

type PathId = 'junior' | 'mid' | 'senior' | 'sprint30';

const PATHS: Array<{ id: PathId; label: string; desc: string; icon: typeof Target; stageRange: [number, number]; goalDays: number }> = [
  { id: 'junior', label: '初级路径', desc: 'Java 基础 + 集合 + JVM + MySQL + Spring，适合 0-1 年经验', icon: Target, stageRange: [0, 4], goalDays: 30 },
  { id: 'mid', label: '中级路径', desc: '并发 + Redis + 微服务 + MQ + 设计模式，适合 1-3 年经验', icon: Flame, stageRange: [3, 9], goalDays: 45 },
  { id: 'senior', label: '高级路径', desc: '系统设计 + 源码 + 分布式 + 性能调优，适合 3+ 年经验', icon: Star, stageRange: [6, 11], goalDays: 60 },
  { id: 'sprint30', label: '30 天冲刺', desc: '高频八股 + 场景表达 + 错题复盘，面试前紧急突击', icon: Flame, stageRange: [0, 11], goalDays: 30 }
];

export function LearningPathRoute({ state, goTo }: RouteProps) {
  const [activePath, setActivePath] = useState<PathId>('mid');
  const path = PATHS.find((p) => p.id === activePath)!;
  const stages = BASE_STAGES.slice(path.stageRange[0], path.stageRange[1] + 1);
  const readiness = useMemo(() => interviewReadinessScore(state), [state]);
  const mastery = overallMastery(state);

  const totalHours = stages.reduce((s, st) => s + st.hours, 0);
  const completedStages = stages.filter((st) => {
    const m = Math.round(st.modules.reduce((sum, id) => sum + masteryForModule(state, id), 0) / st.modules.length);
    return m >= 70;
  }).length;

  return (
    <div className="route-stack">
      <Panel>
        <div className="route-intro">
          <div>
            <h2>学习路径</h2>
            <p>根据你的经验水平选择合适的学习路径。每条路径覆盖不同深度的知识模块，标注掌握度和前置依赖。</p>
          </div>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            <button className="primary-btn" type="button" onClick={() => goTo('plan')}>
              生成复习计划 <ArrowRight size={16} />
            </button>
            <button className="ghost-btn" type="button" onClick={() => goTo('interviewRoom')}>
              开始模拟面试
            </button>
          </div>
        </div>
      </Panel>

      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
        {PATHS.map((p) => {
          const Icon = p.icon;
          return (
            <button
              key={p.id}
              type="button"
              className="panel"
              style={{
                flex: '1 1 200px',
                textAlign: 'left',
                cursor: 'pointer',
                padding: 14,
                borderColor: activePath === p.id ? 'var(--accent)' : undefined,
                background: activePath === p.id ? 'color-mix(in srgb, var(--accent) 6%, var(--surface))' : undefined
              }}
              onClick={() => setActivePath(p.id)}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                <Icon size={16} style={{ color: activePath === p.id ? 'var(--accent)' : 'var(--muted)' }} />
                <strong style={{ fontSize: 14 }}>{p.label}</strong>
              </div>
              <div style={{ fontSize: 12, color: 'var(--muted)' }}>{p.desc}</div>
              <div style={{ fontSize: 11, color: 'var(--muted)', marginTop: 4 }}>
                {p.goalDays} 天目标 · {BASE_STAGES.slice(p.stageRange[0], p.stageRange[1] + 1).reduce((s, st) => s + st.hours, 0)} 小时
              </div>
            </button>
          );
        })}
      </div>

      <div style={{ display: 'flex', gap: 16, alignItems: 'center', padding: '12px 16px', borderRadius: 8, background: 'var(--surface)', border: '1px solid var(--line)' }}>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 12, color: 'var(--muted)', marginBottom: 4 }}>{path.label} · 进度</div>
          <ProgressBar value={Math.round((completedStages / stages.length) * 100)} />
        </div>
        <div style={{ textAlign: 'center', minWidth: 60 }}>
          <div style={{ fontSize: 20, fontWeight: 800 }}>{completedStages}/{stages.length}</div>
          <div style={{ fontSize: 11, color: 'var(--muted)' }}>阶段完成</div>
        </div>
        <div style={{ textAlign: 'center', minWidth: 60 }}>
          <div style={{ fontSize: 20, fontWeight: 800 }}>{readiness.score}</div>
          <div style={{ fontSize: 11, color: 'var(--muted)' }}>准备度</div>
        </div>
        <div style={{ textAlign: 'center', minWidth: 60 }}>
          <div style={{ fontSize: 20, fontWeight: 800 }}>{mastery}%</div>
          <div style={{ fontSize: 11, color: 'var(--muted)' }}>总掌握</div>
        </div>
      </div>

      <div className="path-timeline">
        {stages.map((stage, index) => {
          const stageMastery = Math.round(
            stage.modules.reduce((sum, moduleId) => sum + masteryForModule(state, moduleId), 0) / stage.modules.length
          );
          const pointCount = appData.knowledgePoints.filter((point) => stage.modules.includes(point.moduleId)).length;
          const questionCount = appData.questions.filter((q) => stage.modules.includes(q.moduleId)).length;
          return (
            <section className="path-card" key={`${path.id}-${stage.title}-${index}`}>
              <div className="path-index">{String(path.stageRange[0] + index + 1).padStart(2, '0')}</div>
              <div className="path-body">
                <div className="path-title-row">
                  <h3>{stage.title}</h3>
                  {stageMastery >= 80 ? <Tag tone="green">接近掌握</Tag> : stageMastery >= 40 ? <Tag tone="blue">学习中</Tag> : <Tag>未开始</Tag>}
                </div>
                <p>{stage.modules.map((id) => moduleLookup.get(id)?.description).join(' ')}</p>
                <div className="path-meta">
                  <span>{pointCount} 个知识点</span>
                  <span>{questionCount} 道面试题</span>
                  <span>{stage.hours} 小时</span>
                  <span>{stage.modules.map((id) => moduleLookup.get(id)?.title).join(' / ')}</span>
                </div>
                <ProgressBar value={stageMastery} />
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
