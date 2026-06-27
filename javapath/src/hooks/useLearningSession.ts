import { useCallback, useEffect, useRef } from 'react';
import { addLearningSession } from '../lib/storage';
import type { LearningSession, UserState } from '../types';

export function useSessionTracker(
  route: string,
  state: UserState,
  setState: React.Dispatch<React.SetStateAction<UserState>>
) {
  const sessionRef = useRef<LearningSession | null>(null);
  const startRef = useRef<number>(Date.now());

  useEffect(() => {
    startRef.current = Date.now();
    sessionRef.current = {
      id: crypto.randomUUID(),
      startedAt: new Date().toISOString(),
      endedAt: new Date().toISOString(),
      durationSeconds: 0,
      knowledgePointsStudied: [],
      questionsAttempted: [],
      correctCount: 0,
      totalCount: 0,
      mode: route === 'interview' || route === 'interviewRoom' ? 'interview'
        : route === 'review' ? 'review'
        : route === 'modules' ? 'study'
        : 'practice'
    };

    return () => {
      if (sessionRef.current) {
        const duration = Math.round((Date.now() - startRef.current) / 1000);
        if (duration >= 5) {
          const endedSession: LearningSession = {
            ...sessionRef.current,
            endedAt: new Date().toISOString(),
            durationSeconds: duration
          };
          setState((cur) => addLearningSession(cur, endedSession));
        }
      }
    };
  }, [route, setState]);

  const trackKnowledgePoint = useCallback((kpId: string) => {
    if (sessionRef.current && !sessionRef.current.knowledgePointsStudied.includes(kpId)) {
      sessionRef.current = {
        ...sessionRef.current,
        knowledgePointsStudied: [...sessionRef.current.knowledgePointsStudied, kpId]
      };
    }
  }, []);

  const trackQuestion = useCallback((questionId: string, correct: boolean) => {
    if (sessionRef.current) {
      sessionRef.current = {
        ...sessionRef.current,
        questionsAttempted: [...sessionRef.current.questionsAttempted, questionId],
        correctCount: sessionRef.current.correctCount + (correct ? 1 : 0),
        totalCount: sessionRef.current.totalCount + 1
      };
    }
  }, []);

  return { trackKnowledgePoint, trackQuestion };
}
