import { Bookmark, CheckCircle2, MessageCircle, RotateCcw, ShieldQuestion, Timer } from 'lucide-react';
import { useEffect, useMemo, useRef, useState } from 'react';
import type { QuestionCategory, RouteProps } from '../types';
import { Panel, Tag } from '../components/Primitives';
import { SafeHtml } from '../components/SafeHtml';
import { appData, moduleLookup } from '../data/appData';
import { useDebounce } from '../hooks/useDebounce';
import { normalizeText } from '../lib/search';
import { toggleFavorite, toggleWrongQuestion, upsertProgress } from '../lib/storage';
import { useToast } from '../hooks/useToast';

const categories: Array<'全部' | QuestionCategory> = ['全部', '基础题', '源码题', '场景题', '八股题', '项目题', '系统设计题', 'HR面'];
const interviewModes = ['大厂一面', '大厂二面', 'HR面'] as const;

const selfEvalLabels = ['完全会 ✓', '基本会', '模糊', '不会 ✗'] as const;
type SelfEval = typeof selfEvalLabels[number];

export function InterviewRoute({ state, setState, globalQuery }: RouteProps) {
  const toast = useToast();
  const [category, setCategory] = useState<'全部' | QuestionCategory>('全部');
  const [moduleId, setModuleId] = useState('全部');
  const [query, setQuery] = useState(globalQuery);
  const [mode, setMode] = useState<typeof interviewModes[number]>('大厂一面');
  const [activeId, setActiveId] = useState('');
  const [revealed, setRevealed] = useState(false);
  const [debouncedQuery, setDebouncedQuery] = useState(query);
  const debounce = useDebounce((v: string) => setDebouncedQuery(v), 200);
  useEffect(() => { debounce(query); }, [query, debounce]);

  // Session timer
  const [elapsed, setElapsed] = useState(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  useEffect(() => {
    if (activeId) {
      timerRef.current = setInterval(() => setElapsed((e) => e + 1), 1000);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
    }
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [activeId]);

  // Reset timer and revealed when switching question
  const selectQuestion = (id: string) => {
    if (id === activeId) return;
    setActiveId(id);
    setRevealed(false);
    setElapsed(0);
  };

  // Session stats
  const [stats, setStats] = useState({ answered: 0, correct: 0, wrong: 0 });

  const fmt = (s: number) => `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`;

  const questions = useMemo(() => {
    return appData.questions.filter((q) => {
      const catOk = category === '全部' || q.category === category;
      const modOk = moduleId === '全部' || q.moduleId === moduleId;
      const qStr = debouncedQuery.trim();
      const qOk = !qStr || normalizeText(`${q.title} ${q.answer} ${q.points.join(' ')}`).includes(normalizeText(qStr));
      const modeOk = mode === '大厂一面' ? q.category !== 'HR面'
        : mode === '大厂二面' ? ['场景题', '系统设计题', '项目题', '源码题'].includes(q.category)
        : q.category === 'HR面' || q.category === '项目题';
      return catOk && modOk && qOk && modeOk;
    });
  }, [category, moduleId, debouncedQuery, mode]);

  const active = appData.questions.find((q) => q.id === activeId) ?? questions[0];
  const isWrong = active ? state.wrongQuestions.some((w) => w.questionId === active.id) : false;
  const isFavorite = active ? state.favorites.some((f) => f.targetId === active.id && f.targetType === 'question') : false;

  const handleEval = (eval_: SelfEval) => {
    if (!active) return;
    const isCorrect = eval_ === '完全会 ✓' || eval_ === '基本会';
    if (active.knowledgePointId) {
      setState((cur) => upsertProgress(cur, active.knowledgePointId!, isCorrect ? 'mastered' : 'review'));
    }
    if (!isCorrect) {
      setState((cur) => toggleWrongQuestion(cur, active.id, active.moduleId));
      toast.info('已加入错题本');
    } else {
      toast.success('已标记为掌握');
    }
    setStats((s) => ({ answered: s.answered + 1, correct: s.correct + (isCorrect ? 1 : 0), wrong: s.wrong + (isCorrect ? 0 : 1) }));
    // Advance to next question
    const idx = questions.findIndex((q) => q.id === active.id);
    const next = questions[idx + 1];
    if (next) { setActiveId(next.id); setRevealed(false); setElapsed(0); }
  };

  return (
    <div className="interview-layout">
      <Panel className="question-list-panel">
        {/* Session stats bar */}
        {stats.answered > 0 && (
          <div style={{ display: 'flex', gap: 10, padding: '8px 10px', marginBottom: 10, background: 'var(--surface-2)', borderRadius: 8, fontSize: 12, color: 'var(--muted)' }}>
            <span>已答 <strong style={{ color: 'var(--text)' }}>{stats.answered}</strong></span>
            <span>✓ <strong style={{ color: 'var(--accent)' }}>{stats.correct}</strong></span>
            <span>✗ <strong style={{ color: 'var(--danger)' }}>{stats.wrong}</strong></span>
            <button type="button" style={{ marginLeft: 'auto', fontSize: 11, color: 'var(--muted)', background: 'transparent', cursor: 'pointer', border: '1px solid var(--line)', borderRadius: 4, padding: '2px 6px' }} onClick={() => setStats({ answered: 0, correct: 0, wrong: 0 })}>重置</button>
          </div>
        )}
        <div className="interview-controls">
          <div className="segmented">
            {interviewModes.map((m) => (
              <button type="button" key={m} className={mode === m ? 'active' : ''} onClick={() => setMode(m)}>{m}</button>
            ))}
          </div>
          <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="按题目、答案搜索" />
          <select value={moduleId} onChange={(e) => setModuleId(e.target.value)}>
            <option>全部</option>
            {appData.modules.map((m) => <option value={m.id} key={m.id}>{m.title}</option>)}
          </select>
        </div>
        <div className="category-row">
          {categories.map((c) => (
            <button type="button" key={c} className={category === c ? 'active' : ''} onClick={() => setCategory(c)}>{c}</button>
          ))}
        </div>
        <div className="question-list">
          {questions.map((q) => (
            <button type="button" key={q.id} className={`question-row ${active?.id === q.id ? 'active' : ''}`} onClick={() => selectQuestion(q.id)}>
              <span>
                <strong>{q.title}</strong>
                <small>{moduleLookup.get(q.moduleId)?.title} · {q.category} · 频率 {q.frequency}</small>
              </span>
              <Tag tone={q.difficulty >= 5 ? 'hot' : 'neutral'}>D{q.difficulty}</Tag>
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
              <div className="compact-actions" style={{ alignItems: 'center' }}>
                {activeId && (
                  <span style={{ display: 'flex', alignItems: 'center', gap: 5, color: 'var(--muted)', fontSize: 13, padding: '0 6px' }}>
                    <Timer size={14} /> {fmt(elapsed)}
                  </span>
                )}
                <button className={`icon-button ${isFavorite ? 'active' : ''}`} type="button"
                  onClick={() => { setState((cur) => toggleFavorite(cur, active.id, 'question')); toast.success(isFavorite ? '已取消收藏' : '已收藏'); }}>
                  <Bookmark size={17} />
                </button>
                <button className={`icon-button ${isWrong ? 'danger' : ''}`} type="button"
                  onClick={() => { setState((cur) => toggleWrongQuestion(cur, active.id, active.moduleId)); toast.info(isWrong ? '已移出错题本' : '已加入错题本'); }}>
                  <RotateCcw size={17} />
                </button>
              </div>
            </div>

            {!revealed ? (
              <div className="mock-blank" style={{ flexDirection: 'column', gap: 16 }}>
                <ShieldQuestion size={32} style={{ color: 'var(--muted)' }} />
                <p style={{ margin: 0, color: 'var(--muted)' }}>模拟面试：先口述答案，再揭示参考答案对照。</p>
                <button className="primary-btn" type="button" onClick={() => setRevealed(true)}>
                  揭示答案
                </button>
              </div>
            ) : (
              <>
                {/* Self-evaluation */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 8, marginBottom: 14 }}>
                  {selfEvalLabels.map((label) => (
                    <button key={label} type="button"
                      style={{ minHeight: 40, borderRadius: 8, border: '1px solid var(--line)', background: 'var(--surface-2)', color: 'var(--text)', cursor: 'pointer', fontSize: 13, fontWeight: 700 }}
                      onClick={() => handleEval(label)}>
                      {label}
                    </button>
                  ))}
                </div>

                <div className="answer-body">
                  <section>
                    <h3>参考答案</h3>
                    <p><SafeHtml html={active.answer} /></p>
                  </section>
                  <section>
                    <h3>答题要点</h3>
                    <ul>{active.points.map((p) => <li key={p}>{p}</li>)}</ul>
                  </section>
                  <section>
                    <h3>追问链路</h3>
                    <div className="follow-chain">
                      {active.followUps.map((f) => <span key={f}><MessageCircle size={14} />{f}</span>)}
                    </div>
                  </section>
                  <section>
                    <h3>易错点</h3>
                    <div className="trap-list">
                      {active.traps.map((t) => <Tag key={t} tone="hot">{t}</Tag>)}
                    </div>
                  </section>
                </div>
              </>
            )}
          </>
        ) : (
          <div className="empty-line">没有匹配的面试题。</div>
        )}
      </Panel>
    </div>
  );
}
