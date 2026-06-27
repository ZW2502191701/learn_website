import type {
  UserState,
  StudyProgress,
  WrongQuestion,
  Favorite,
  ReviewScheduleItem,
  InterviewSession,
  LearningSession,
  MasteryRecord,
  ProjectExpression
} from '../../types';

const STATUS_WEIGHT: Record<string, number> = {
  'not-started': 0,
  'learning': 1,
  'review': 2,
  'mastered': 3
};

export function mergeStates(local: UserState, remote: UserState): UserState {
  return {
    progress: mergeProgress(local.progress, remote.progress),
    favorites: mergeFavorites(local.favorites, remote.favorites),
    wrongQuestions: mergeWrongQuestions(local.wrongQuestions, remote.wrongQuestions),
    notes: mergeNotes(local.notes, remote.notes, local, remote),
    checkins: mergeCheckins(local.checkins, remote.checkins),
    targetDate: mergeTargetDate(local.targetDate, remote.targetDate),
    theme: local.theme,
    reviewSchedule: mergeReviewSchedule(local.reviewSchedule, remote.reviewSchedule),
    interviewSessions: mergeById(local.interviewSessions, remote.interviewSessions),
    learningSessions: mergeById(local.learningSessions, remote.learningSessions),
    masteryHistory: mergeMasteryHistory(local.masteryHistory, remote.masteryHistory),
    projectExpressions: mergeById(local.projectExpressions, remote.projectExpressions)
  };
}

function mergeProgress(
  local: Record<string, StudyProgress>,
  remote: Record<string, StudyProgress>
): Record<string, StudyProgress> {
  const allKeys = new Set([...Object.keys(local), ...Object.keys(remote)]);
  const result: Record<string, StudyProgress> = {};

  for (const key of allKeys) {
    const lp = local[key];
    const rp = remote[key];

    if (!lp) { result[key] = rp; continue; }
    if (!rp) { result[key] = lp; continue; }

    const lw = STATUS_WEIGHT[lp.status] ?? 0;
    const rw = STATUS_WEIGHT[rp.status] ?? 0;

    if (lw > rw) { result[key] = lp; continue; }
    if (rw > lw) { result[key] = rp; continue; }

    const lScore = lp.attempts + lp.correct;
    const rScore = rp.attempts + rp.correct;
    if (lScore > rScore) { result[key] = lp; continue; }
    if (rScore > lScore) { result[key] = rp; continue; }

    const lt = lp.lastStudiedAt ? new Date(lp.lastStudiedAt).getTime() : 0;
    const rt = rp.lastStudiedAt ? new Date(rp.lastStudiedAt).getTime() : 0;
    result[key] = lt >= rt ? lp : rp;
  }

  return result;
}

function mergeFavorites(local: Favorite[], remote: Favorite[]): Favorite[] {
  const map = new Map<string, Favorite>();

  for (const fav of local) {
    map.set(`${fav.targetType}:${fav.targetId}`, fav);
  }

  for (const fav of remote) {
    const key = `${fav.targetType}:${fav.targetId}`;
    const existing = map.get(key);
    if (!existing) {
      map.set(key, fav);
    } else {
      const et = new Date(existing.createdAt).getTime();
      const ft = new Date(fav.createdAt).getTime();
      if (ft < et) map.set(key, fav);
    }
  }

  return [...map.values()];
}

function mergeWrongQuestions(local: WrongQuestion[], remote: WrongQuestion[]): WrongQuestion[] {
  const map = new Map<string, WrongQuestion>();

  for (const wq of local) {
    map.set(wq.questionId, wq);
  }

  for (const wq of remote) {
    const existing = map.get(wq.questionId);
    if (!existing) {
      map.set(wq.questionId, wq);
    } else {
      const et = new Date(existing.createdAt).getTime();
      const ft = new Date(wq.createdAt).getTime();
      const winner = ft < et ? wq : existing;

      const mergedNote = (!existing.note && !wq.note)
        ? ''
        : (!existing.note ? wq.note
          : !wq.note ? existing.note
            : existing.note.length >= wq.note.length ? existing.note : wq.note);

      map.set(wq.questionId, { ...winner, note: mergedNote });
    }
  }

  return [...map.values()];
}

function mergeNotes(
  local: Record<string, string>,
  remote: Record<string, string>,
  localState: UserState,
  remoteState: UserState
): Record<string, string> {
  const localCount = Object.keys(localState.notes).length;
  const remoteCount = Object.keys(remoteState.notes).length;
  const preferLocal = localCount >= remoteCount;

  const allKeys = new Set([...Object.keys(local), ...Object.keys(remote)]);
  const result: Record<string, string> = {};

  for (const key of allKeys) {
    const lv = local[key];
    const rv = remote[key];

    if (lv !== undefined && rv === undefined) { result[key] = lv; }
    else if (rv !== undefined && lv === undefined) { result[key] = rv; }
    else { result[key] = preferLocal ? lv! : rv!; }
  }

  return result;
}

function mergeCheckins(local: string[], remote: string[]): string[] {
  const set = new Set([...local, ...remote]);
  return [...set].sort();
}

function mergeTargetDate(local: string, remote: string): string {
  return local >= remote ? local : remote;
}

function mergeReviewSchedule(local: ReviewScheduleItem[], remote: ReviewScheduleItem[]): ReviewScheduleItem[] {
  const map = new Map<string, ReviewScheduleItem>();
  for (const item of local) map.set(item.questionId, item);
  for (const item of remote) {
    const existing = map.get(item.questionId);
    if (!existing) {
      map.set(item.questionId, item);
    } else {
      const lr = existing.repetitions;
      const rr = item.repetitions;
      const winner = rr > lr ? item : rr < lr ? existing
        : (item.nextReviewAt > existing.nextReviewAt ? item : existing);
      map.set(item.questionId, winner);
    }
  }
  return [...map.values()];
}

function mergeById<T extends { id: string }>(local: T[], remote: T[]): T[] {
  const map = new Map<string, T>();
  for (const item of local) map.set(item.id, item);
  for (const item of remote) {
    if (!map.has(item.id)) map.set(item.id, item);
  }
  return [...map.values()];
}

function mergeMasteryHistory(local: MasteryRecord[], remote: MasteryRecord[]): MasteryRecord[] {
  const map = new Map<string, MasteryRecord>();
  for (const rec of local) map.set(`${rec.knowledgePointId}:${rec.recordedAt}`, rec);
  for (const rec of remote) {
    const key = `${rec.knowledgePointId}:${rec.recordedAt}`;
    if (!map.has(key)) map.set(key, rec);
  }
  return [...map.values()];
}
