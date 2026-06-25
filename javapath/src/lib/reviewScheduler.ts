import { appData, moduleLookup, questionLookup } from '../data/appData';
import { getProgress, masteryForModule, wrongCountForModule } from './metrics';
import type { UserState, WrongQuestion } from '../types';

// ── 类型 ───────────────────────────────────────────────────────────
export interface ReviewItem {
  wrong: WrongQuestion;
  questionTitle: string;
  moduleTitle: string;
  priority: number;
  reasons: string[];
}

// ── 工具 ───────────────────────────────────────────────────────────
const HOURS = 3_600_000;
const DAYS = 86_400_000;

const hoursSince = (isoDate: string) => {
  const t = new Date(isoDate).getTime();
  return Number.isFinite(t) ? (Date.now() - t) / HOURS : 999;
};

// ── 错题优先级排序 ─────────────────────────────────────────────────
/**
 * 对错题列表按复习优先级排序，并返回每题的推荐理由。
 *
 * 评分维度：
 *  1. 最近答错（越近越优先）
 *  2. 所属模块掌握度低
 *  3. 同模块错题多（系统性薄弱）
 *  4. 被收藏（用户标记为重点）
 *  5. 关联知识点正确率低
 *  6. 长时间未复习
 */
export function rankWrongQuestions(state: UserState, limit = 20): ReviewItem[] {
  const now = Date.now();
  return state.wrongQuestions
    .map((wrong) => {
      const question = questionLookup.get(wrong.questionId);
      const module = moduleLookup.get(wrong.moduleId);
      const moduleTitle = module?.title ?? wrong.moduleId;
      const questionTitle = question?.title ?? wrong.questionId;

      let priority = 0;
      const reasons: string[] = [];

      // 1. 最近答错：24h 内 +40，3 天内 +25，7 天内 +12
      const hours = hoursSince(wrong.createdAt);
      if (hours < 24) { priority += 40; reasons.push('最近 24 小时内答错'); }
      else if (hours < 72) { priority += 25; reasons.push('3 天内答错'); }
      else if (hours < 168) { priority += 12; reasons.push('7 天内答错'); }

      // 2. 模块掌握度低：<30% +35, <50% +20, <70% +10
      const mastery = module ? masteryForModule(state, module.id) : 50;
      if (mastery < 30) { priority += 35; reasons.push(`「${moduleTitle}」掌握度仅 ${mastery}%`); }
      else if (mastery < 50) { priority += 20; reasons.push(`「${moduleTitle}」掌握度偏低 ${mastery}%`); }
      else if (mastery < 70) { priority += 10; }

      // 3. 同模块错题多：≥3 +20, ≥2 +10
      const moduleWrongCount = wrongCountForModule(state, wrong.moduleId);
      if (moduleWrongCount >= 3) { priority += 20; reasons.push(`该模块已有 ${moduleWrongCount} 道错题`); }
      else if (moduleWrongCount >= 2) { priority += 10; reasons.push(`该模块已有 ${moduleWrongCount} 道错题`); }

      // 4. 被收藏
      const isFavorited = state.favorites.some(
        (f) => f.targetId === wrong.questionId && f.targetType === 'question'
      );
      if (isFavorited) { priority += 15; reasons.push('已收藏为重点'); }

      // 5. 关联知识点正确率低
      if (question?.knowledgePointId) {
        const progress = getProgress(state, question.knowledgePointId);
        if (progress.attempts > 0) {
          const rate = progress.correct / progress.attempts;
          if (rate < 0.5) { priority += 18; reasons.push('关联知识点正确率低于 50%'); }
          else if (rate < 0.7) { priority += 8; }
        }
      }

      // 6. 长时间未复习：>7 天 +15, >3 天 +8
      if (wrong.note) {
        // 有复盘笔记说明曾经复习过，降低一点优先级
        priority -= 5;
      }
      const daysSinceCreated = (now - new Date(wrong.createdAt).getTime()) / DAYS;
      if (daysSinceCreated > 7 && !wrong.note) { priority += 15; reasons.push('超过 7 天未复盘'); }
      else if (daysSinceCreated > 3 && !wrong.note) { priority += 8; reasons.push('超过 3 天未复盘'); }

      return {
        wrong,
        questionTitle,
        moduleTitle,
        priority,
        reasons
      };
    })
    .sort((a, b) => b.priority - a.priority)
    .slice(0, limit);
}

// ── 今日复习队列 ───────────────────────────────────────────────────
/**
 * 生成"今日复习"队列：优先级最高的错题 + 收藏但未掌握的知识点。
 */
export interface TodayReviewItem {
  id: string;
  title: string;
  moduleTitle: string;
  type: 'wrong' | 'favorite';
  reason: string;
  route: 'interview' | 'modules';
}

export function buildTodayReviewQueue(state: UserState, limit = 6): TodayReviewItem[] {
  const items: TodayReviewItem[] = [];

  // 高优先级错题
  const ranked = rankWrongQuestions(state, 4);
  for (const r of ranked) {
    items.push({
      id: r.wrong.questionId,
      title: r.questionTitle,
      moduleTitle: r.moduleTitle,
      type: 'wrong',
      reason: r.reasons[0] ?? '错题待复盘',
      route: 'interview'
    });
  }

  // 收藏但未掌握的知识点
  const favoriteItems = state.favorites
    .filter((f) => f.targetType === 'knowledge')
    .map((f) => {
      const kp = appData.knowledgePoints.find((p) => p.id === f.targetId);
      if (!kp) return null;
      const progress = getProgress(state, kp.id);
      if (progress.status === 'mastered') return null;
      const module = moduleLookup.get(kp.moduleId);
      const item: TodayReviewItem = {
        id: kp.id,
        title: kp.title,
        moduleTitle: module?.title ?? kp.moduleId,
        type: 'favorite',
        reason: progress.status === 'not-started' ? '收藏但未开始学习' : '收藏且尚未掌握',
        route: 'modules'
      };
      return item;
    })
    .filter((item): item is TodayReviewItem => Boolean(item))
    .slice(0, limit - items.length);

  return [...items, ...favoriteItems].slice(0, limit);
}
