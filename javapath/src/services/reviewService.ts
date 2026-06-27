import { questionLookup, moduleLookup } from '../data/appData';
import { addReviewScheduleItem, updateReviewScheduleItem } from '../lib/storage/mutations';
import type { ReviewScheduleItem, UserState } from '../types';

const MS_PER_DAY = 86_400_000;

const QUALITY_MAP: Record<string, number> = {
  '完全不会': 0,
  '模糊': 2,
  '基本会': 3,
  '很熟': 4,
  '秒答': 5
};

export function qualityFromButton(label: string): number {
  return QUALITY_MAP[label] ?? 3;
}

export function sm2(quality: number, item: ReviewScheduleItem): ReviewScheduleItem {
  const q = Math.max(0, Math.min(5, quality));
  let { easeFactor, intervalDays, repetitions } = item;

  if (q < 3) {
    repetitions = 0;
    intervalDays = 1;
  } else {
    repetitions += 1;
    if (repetitions === 1) {
      intervalDays = 1;
    } else if (repetitions === 2) {
      intervalDays = 6;
    } else {
      intervalDays = Math.round(intervalDays * easeFactor);
    }
  }

  easeFactor = Math.max(1.3, easeFactor + 0.1 - (5 - q) * (0.08 + (5 - q) * 0.02));

  const nextReviewAt = new Date(Date.now() + intervalDays * MS_PER_DAY).toISOString();

  return {
    ...item,
    easeFactor,
    intervalDays,
    repetitions,
    nextReviewAt,
    lastQuality: q
  };
}

export function scheduleReview(state: UserState, questionId: string, quality: number): UserState {
  const existing = state.reviewSchedule.find((r) => r.questionId === questionId);
  const question = questionLookup.get(questionId);

  if (existing) {
    const updated = sm2(quality, existing);
    return updateReviewScheduleItem(state, questionId, updated);
  }

  const now = new Date().toISOString();
  const newItem: ReviewScheduleItem = {
    questionId,
    knowledgePointId: question?.knowledgePointId ?? '',
    moduleId: question?.moduleId ?? '',
    easeFactor: 2.5,
    intervalDays: 1,
    repetitions: quality >= 3 ? 1 : 0,
    nextReviewAt: new Date(Date.now() + MS_PER_DAY).toISOString(),
    lastQuality: quality,
    createdAt: now
  };
  return addReviewScheduleItem(state, newItem);
}

export function getDueReviews(state: UserState, limit = 20): ReviewScheduleItem[] {
  const now = Date.now();
  return state.reviewSchedule
    .filter((r) => new Date(r.nextReviewAt).getTime() <= now)
    .sort((a, b) => new Date(a.nextReviewAt).getTime() - new Date(b.nextReviewAt).getTime())
    .slice(0, limit);
}

export function buildReviewQueue(state: UserState, limit = 10) {
  const due = getDueReviews(state, limit);
  return due.map((item) => {
    const question = questionLookup.get(item.questionId);
    const module = moduleLookup.get(item.moduleId);
    const daysOverdue = Math.round((Date.now() - new Date(item.nextReviewAt).getTime()) / MS_PER_DAY);
    return {
      ...item,
      questionTitle: question?.title ?? item.questionId,
      moduleTitle: module?.title ?? item.moduleId,
      daysOverdue
    };
  });
}
