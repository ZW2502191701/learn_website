import { Bookmark, CheckCircle2, MessageCircle, RotateCcw, ShieldQuestion } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import type { QuestionCategory, RouteProps } from '../types';
import { Panel, Tag } from '../components/Primitives';
import { SafeHtml } from '../components/SafeHtml';
import { appData, moduleLookup } from '../data/appData';
import { useDebounce } from '../hooks/useDebounce';
import { normalizeText } from '../lib/search';
import { toggleFavorite, toggleWrongQuestion, upsertProgress } from '../lib/storage';

const categories: Array<'全部' | QuestionCategory> = ['全部', '基础题', '源码题', '场景题', '八股题', '项目题', '系统设计题', 'HR面'];
const interviewModes = ['大厂一面', '大厂二面', 'HR面'] as const;

export function InterviewRoute({ state, setState, globalQuery }: RouteProps) {
  const [category, setCategory] = useState<'全部' | QuestionCategory>('全部');
  const [moduleId, setModuleId] = useState('全部');
  const [query, setQuery] = useState(globalQuery);
  const [mode, setMode] = useState<(typeof interviewModes)[number]>('大厂一面');
  const [activeId, setActiveId] = useState('');
  const [showAnswer, setShowAnswer] = useState(true);
  const [debouncedQuery, setDebouncedQuery] = useState(query);
  const debounce = useDebounce((value: string) => setDebouncedQuery(value), 200);

  useEffect(() => { debounce(query); }, [query, debounce]);

  const questions = useMemo(() => {
    return appData.questions.filter((question) => {
      const categoryOk = category === '全部' || question.category === category;
      const moduleOk = moduleId === '全部' || question.moduleId === moduleId;
      const q = debouncedQuery.trim();
      const queryOk = !q || normalizeText(`${question.title} ${question.answer} ${question.points.join(' ')}`).includes(normalizeText(q));
      const modeOk =
        mode === '大厂一面'
          ? question.category !== 'HR面'
          : mode === '大厂二面'
            ? ['场景题', '系统设计题', '项目题', '源码题'].includes(question.category)
            : question.category === 'HR面' || question.category === '项目题';
      return categoryOk && moduleOk && queryOk && modeOk;
    });
  }, [category, moduleId, debouncedQuery, mode]);

  const active = appData.questions.find((question) => question.id === activeId) ?? questions[0];
  const isWrong = active ? state.wrongQuestions.some((item) => item.questionId === active.id) : false;
  const isFavorite = active ? state.favorites.some((item) => item.targetId === active.id && item.targetType === 'question') : false;

  return (
    <div className="interview-layout">
      <Panel className="question-list-panel">
        <div className="interview-controls">
          <div className="segmented">
            {interviewModes.map((item) => (
              <button type="button" key={item} className={mode === item ? 'active' : ''} onClick={() => setMode(item)}>
                {item}
              </button>
            ))}
          </div>
          <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="按题目、答案搜索（大小写无关）" />
          <select value={moduleId} onChange={(event) => setModuleId(event.target.value)}>
            <option>全部</option>
            {appData.modules.map((module) => (
              <option value={module.id} key={module.id}>
                {module.title}
              </option>
            ))}
          </select>
        </div>
        <div className="category-row">
          {categories.map((item) => (
            <button type="button" key={item} className={category === item ? 'active' : ''} onClick={() => setCategory(item)}>
              {item}
            </button>
          ))}
        </div>
        <div className="question-list">
          {questions.map((question) => (
            <button
              type="button"
              key={question.id}
              className={`question-row ${active?.id === question.id ? 'active' : ''}`}
              onClick={() => setActiveId(question.id)}
            >
              <span>
                <strong>{question.title}</strong>
                <small>{moduleLookup.get(question.moduleId)?.title} · {question.category} · 频率 {question.frequency}</small>
              </span>
              <Tag tone={question.difficulty >= 5 ? 'hot' : 'neutral'}>D{question.difficulty}</Tag>
            </button>
          ))}
        </div>
      </Panel>

      <Panel className="answer-panel">
        {active ? (
          <>
            <div className="detail-title">
              <div>
                <h2>{active.title}</h2>
                <small>{mode} · {moduleLookup.get(active.moduleId)?.title} · {active.category}</small>
              </div>
              <div className="compact-actions">
                <button
                  className={`icon-button ${isFavorite ? 'active' : ''}`}
                  type="button"
                  onClick={() => setState((current) => toggleFavorite(current, active.id, 'question'))}
                >
                  <Bookmark size={17} />
                </button>
                <button
                  className={`icon-button ${isWrong ? 'danger' : ''}`}
                  type="button"
                  onClick={() => setState((current) => toggleWrongQuestion(current, active.id, active.moduleId))}
                >
                  <RotateCcw size={17} />
                </button>
              </div>
            </div>

            <div className="mock-toolbar">
              <button
                className="primary-btn"
                type="button"
                onClick={() => {
                  if (active.knowledgePointId) {
                    setState((current) => upsertProgress(current, active.knowledgePointId!, 'mastered'));
                  }
                }}
              >
                <CheckCircle2 size={16} />
                标记答对
              </button>
              <button className="ghost-btn" type="button" onClick={() => setShowAnswer((value) => !value)}>
                <ShieldQuestion size={16} />
                {showAnswer ? '隐藏答案' : '显示答案'}
              </button>
            </div>

            {showAnswer ? (
              <div className="answer-body">
                <section>
                  <h3>参考答案</h3>
                  <p>
                    <SafeHtml html={active.answer} />
                  </p>
                </section>
                <section>
                  <h3>答题要点</h3>
                  <ul>
                    {active.points.map((point) => (
                      <li key={point}>{point}</li>
                    ))}
                  </ul>
                </section>
                <section>
                  <h3>追问链路</h3>
                  <div className="follow-chain">
                    {active.followUps.map((follow) => (
                      <span key={follow}>
                        <MessageCircle size={14} />
                        {follow}
                      </span>
                    ))}
                  </div>
                </section>
                <section>
                  <h3>易错点</h3>
                  <div className="trap-list">
                    {active.traps.map((trap) => (
                      <Tag key={trap} tone="hot">{trap}</Tag>
                    ))}
                  </div>
                </section>
              </div>
            ) : (
              <div className="mock-blank">模拟面试模式：先口述答案，再点击显示参考答案对照。</div>
            )}
          </>
        ) : (
          <div className="empty-line">没有匹配的面试题。</div>
        )}
      </Panel>
    </div>
  );
}
