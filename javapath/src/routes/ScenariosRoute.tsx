import { Bookmark, CheckCircle2, Route, StickyNote } from 'lucide-react';
import { useState } from 'react';
import type { RouteProps } from '../types';
import { ArchitectureDiagram } from '../components/ArchitectureDiagram';
import { Panel, Tag } from '../components/Primitives';
import { appData, knowledgeLookup, moduleLookup, questionLookup } from '../data/appData';
import { toggleFavorite, updateNote } from '../lib/storage';

export function ScenariosRoute({ state, setState, goTo }: RouteProps) {
  const [activeId, setActiveId] = useState(appData.scenarios[0]?.id ?? '');
  const scenario = appData.scenarios.find((item) => item.id === activeId) ?? appData.scenarios[0];
  const isFavorite = state.favorites.some((item) => item.targetId === scenario.id && item.targetType === 'scenario');

  // 关联知识点：从 scenario.moduleIds 关联的模块中找高频知识点
  const relatedKnowledge = scenario.moduleIds
    .flatMap((moduleId) =>
      appData.knowledgePoints
        .filter((kp) => kp.moduleId === moduleId && kp.tags.some((t) => scenario.tags.includes(t) || scenario.title.includes(kp.title.slice(0, 4))))
        .slice(0, 2)
    )
    .slice(0, 4);

  return (
    <div className="scenario-layout">
      <Panel className="scenario-list">
        <h2>场景实战</h2>
        <p>每个场景都按背景、问题、分析路径、解决方案、架构图和面试表达模板组织。</p>
        {appData.scenarios.map((item) => (
          <button
            type="button"
            className={`scenario-row ${item.id === scenario.id ? 'active' : ''}`}
            key={item.id}
            onClick={() => setActiveId(item.id)}
          >
            <span>
              <strong>{item.title}</strong>
              <small>{item.tags.join(' · ')}</small>
            </span>
            <Tag tone={item.difficulty >= 5 ? 'hot' : 'neutral'}>D{item.difficulty}</Tag>
          </button>
        ))}
      </Panel>

      <div className="scenario-main">
        <Panel>
          <div className="detail-title">
            <div>
              <h2>{scenario.title}</h2>
              <small>{scenario.moduleIds.map((id) => moduleLookup.get(id)?.title).join(' / ')}</small>
            </div>
            <button
              type="button"
              className={`icon-button ${isFavorite ? 'active' : ''}`}
              onClick={() => setState((current) => toggleFavorite(current, scenario.id, 'scenario'))}
            >
              <Bookmark size={17} />
            </button>
          </div>
          <div className="tag-row">
            {scenario.tags.map((tag) => (
              <Tag key={tag} tone={tag === '高并发' ? 'hot' : 'neutral'}>{tag}</Tag>
            ))}
          </div>
        </Panel>

        <div className="scenario-sections">
          <Panel title="背景">
            <p className="text-block">{scenario.background}</p>
          </Panel>
          <Panel title="问题">
            <p className="text-block">{scenario.problem}</p>
          </Panel>
          <Panel title="分析路径">
            <ol className="step-list">
              {scenario.analysisPath.map((item) => (
                <li key={item}>
                  <Route size={15} />
                  {item}
                </li>
              ))}
            </ol>
          </Panel>
          <Panel title="解决方案">
            <ul className="solution-list">
              {scenario.solution.map((item) => (
                <li key={item}>
                  <CheckCircle2 size={15} />
                  {item}
                </li>
              ))}
            </ul>
          </Panel>
        </div>

        <Panel title="架构图">
          <ArchitectureDiagram scenario={scenario} />
        </Panel>

        <Panel title="面试表达模板">
          <blockquote className="template-box">{scenario.expressionTemplate}</blockquote>
        </Panel>

        {/* 关联知识点 */}
        {relatedKnowledge.length > 0 && (
          <Panel title="关联知识点">
            <div className="shortcut-grid compact">
              {relatedKnowledge.map((kp) => (
                <button
                  type="button"
                  key={kp.id}
                  onClick={() => goTo('modules', kp.title)}
                >
                  <span>{kp.title}</span>
                  <small>{moduleLookup.get(kp.moduleId)?.title}</small>
                </button>
              ))}
            </div>
          </Panel>
        )}

        <Panel title="关联面试题">
          <div className="shortcut-grid compact">
            {scenario.relatedQuestionIds.map((id) => {
              const question = questionLookup.get(id);
              return question ? (
                <button type="button" key={id} onClick={() => goTo('interview', question.title)}>
                  {question.title}
                </button>
              ) : null;
            })}
          </div>
        </Panel>

        {/* 个人笔记 */}
        <Panel title="场景笔记">
          <label className="note-box">
            <span>
              <StickyNote size={14} />
              记录你的场景分析思路、项目经验和面试表达要点
            </span>
            <textarea
              value={state.notes[`scenario:${scenario.id}`] ?? ''}
              onChange={(event) => setState((current) => updateNote(current, `scenario:${scenario.id}`, event.target.value))}
              placeholder="例如：我在项目中遇到过类似的秒杀场景，用了 Redis + MQ 的方案..."
            />
          </label>
        </Panel>
      </div>
    </div>
  );
}
