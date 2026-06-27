import { useCallback, useEffect, useRef, useState } from 'react';
import { ArrowLeft, ArrowRight, X } from 'lucide-react';
import type { InterviewMode, InterviewReport, InterviewSession, RouteId, RouteProps } from '../types';
import { questionLookup } from '../data/appData';
import { SafeHtml } from '../components/SafeHtml';
import { AnswerVersionTabs } from '../components/AnswerVersionTabs';
import { CrossReferences } from '../components/CrossReferences';
import { ModePicker } from '../components/interview-room/ModePicker';
import { QuestionPanel } from '../components/interview-room/QuestionPanel';
import { AnswerPanel } from '../components/interview-room/AnswerPanel';
import { SessionReport as SessionReportView } from '../components/interview-room/SessionReport';
import { FollowUpChain } from '../components/interview-room/FollowUpChain';
import { createSession, answerQuestion, completeSession, generateQuestionsForMode } from '../services/interviewService';
import { addInterviewSession } from '../lib/storage';
import { toggleWrongQuestion } from '../lib/storage';
import { useToast } from '../hooks/useToast';

export function InterviewRoomRoute({ state, setState, goTo }: RouteProps) {
  const toast = useToast();
  const [phase, setPhase] = useState<'pick' | 'active' | 'report'>('pick');
  const [session, setSession] = useState<InterviewSession | null>(null);
  const [questionIndex, setQuestionIndex] = useState(0);
  const [userAnswer, setUserAnswer] = useState('');
  const [revealed, setRevealed] = useState(false);
  const [selfScore, setSelfScore] = useState(-1);
  const [elapsed, setElapsed] = useState(0);
  const [report, setReport] = useState<InterviewReport | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | undefined>(undefined);

  useEffect(() => {
    if (phase === 'active') {
      timerRef.current = setInterval(() => setElapsed((e) => e + 1), 1000);
      return () => clearInterval(timerRef.current);
    }
    return () => clearInterval(timerRef.current);
  }, [phase, questionIndex]);

  const handleSelectMode = useCallback((mode: InterviewMode) => {
    const qIds = generateQuestionsForMode(mode, state, mode === 'quick-drill' ? 5 : mode === 'hr' ? 5 : 8);
    if (!qIds.length) {
      toast.error('该模式暂无可用题目');
      return;
    }
    const s = createSession(mode, qIds);
    setSession(s);
    setQuestionIndex(0);
    setUserAnswer('');
    setRevealed(false);
    setSelfScore(-1);
    setElapsed(0);
    setPhase('active');
  }, [state, toast]);

  const handleReveal = useCallback(() => {
    setRevealed(true);
  }, []);

  const handleSelfScore = useCallback((score: number) => {
    setSelfScore(score);
  }, []);

  const handleNext = useCallback(() => {
    if (!session) return;
    const qId = session.questionIds[questionIndex];
    const updated = answerQuestion(session, qId, userAnswer, elapsed, selfScore >= 0 ? selfScore : 2);
    setSession(updated);

    if (selfScore < 3 && selfScore >= 0) {
      const q = questionLookup.get(qId);
      if (q) {
        setState((cur) => toggleWrongQuestion(cur, qId, q.moduleId, '面试自评不达标'));
      }
    }

    if (questionIndex + 1 >= session.questionIds.length) {
      const { session: completed, report: r } = completeSession(updated);
      setSession(completed);
      setReport(r);
      setState((cur) => addInterviewSession(cur, completed));
      setPhase('report');
    } else {
      setQuestionIndex((i) => i + 1);
      setUserAnswer('');
      setRevealed(false);
      setSelfScore(-1);
      setElapsed(0);
    }
  }, [session, questionIndex, userAnswer, elapsed, selfScore, setState]);

  const handleClose = useCallback(() => {
    setPhase('pick');
    setSession(null);
    setReport(null);
  }, []);

  if (phase === 'pick') {
    return (
      <div style={{ display: 'grid', gap: 16 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <button type="button" className="ghost-btn" onClick={() => goTo('interview')}>
            <ArrowLeft size={16} /> 返回面试训练
          </button>
        </div>
        <ModePicker onSelect={handleSelectMode} />
      </div>
    );
  }

  if (phase === 'report' && report) {
    return <SessionReportView report={report} onClose={handleClose} />;
  }

  if (!session) return null;

  const currentQId = session.questionIds[questionIndex];
  const currentQ = questionLookup.get(currentQId);
  if (!currentQ) return null;

  return (
    <div style={{ display: 'grid', gap: 16 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <button type="button" className="ghost-btn" onClick={handleClose}>
          <X size={16} /> 结束面试
        </button>
        <div style={{ fontSize: 12, color: 'var(--muted)' }}>
          模式: {session.mode}
        </div>
      </div>

      <div style={{
        display: 'grid',
        gridTemplateColumns: '1fr 1fr',
        gap: 16,
        minHeight: 400
      }}>
        <div className="panel" style={{ padding: 20 }}>
          <QuestionPanel
            question={currentQ}
            index={questionIndex}
            total={session.questionIds.length}
            elapsed={elapsed}
          />
          {revealed && (
            <div style={{ marginTop: 16, paddingTop: 16, borderTop: '1px solid var(--line)' }}>
              <AnswerVersionTabs question={currentQ} showFollowUps={true} />
              <CrossReferences question={currentQ} onNavigate={(route, q) => goTo(route as RouteId, q)} />
            </div>
          )}
        </div>

        <div style={{ display: 'grid', gap: 12, alignContent: 'start' }}>
          <div className="panel" style={{ padding: 20 }}>
            <AnswerPanel
              value={userAnswer}
              onChange={setUserAnswer}
              revealed={revealed}
              onReveal={handleReveal}
              selfScore={selfScore}
              onSelfScore={handleSelfScore}
              onNext={handleNext}
            />
          </div>
          {revealed && (
            <div className="panel" style={{ padding: 16 }}>
              <FollowUpChain
                followUps={currentQ.followUps}
                onSelect={(q) => {
                  toast.info(`追问: ${q}`);
                }}
              />
            </div>
          )}
        </div>
      </div>

      <div style={{ display: 'flex', justifyContent: 'center', gap: 4 }}>
        {session.questionIds.map((_, i) => (
          <div
            key={i}
            style={{
              width: 8,
              height: 8,
              borderRadius: '50%',
              background: i === questionIndex ? 'var(--accent)' : i < questionIndex ? 'var(--success)' : 'var(--line)'
            }}
          />
        ))}
      </div>
    </div>
  );
}
