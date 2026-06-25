import { Bookmark, CheckCircle2, Route } from 'lucide-react';
import { useState } from 'react';
import type { RouteProps } from '../types';
import { ArchitectureDiagram } from '../components/ArchitectureDiagram';
import { Panel, Tag } from '../components/Primitives';
import { appData, moduleLookup, questionLookup } from '../data/appData';
import { toggleFavorite } from '../lib/storage';

export function ScenariosRoute({ state, setState, goTo }: RouteProps) {
  const [activeId, setActiveId] = useState(appData.scenarios[0]?.id ?? '');
  const scenario = appData.scenarios.find((item) => item.id === activeId) ?? appData.scenarios[0];
  const isFavorite = state.favorites.some((item) => item.targetId === scenario.id && item.targetType === 'scenario');

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
      </div>
    </div>
  );
}
