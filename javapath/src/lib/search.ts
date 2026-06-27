import { appData, moduleLookup, questionLookup } from '../data/appData';
import type { InterviewQuestion, KnowledgePoint, Scenario, UserState } from '../types';

// ── 类型 ───────────────────────────────────────────────────────────
export type SearchResultType = '知识点' | '面试题' | '场景题' | '笔记' | '错题';
export type SearchRouteTarget = 'modules' | 'interview' | 'scenarios' | 'review';

export interface SearchResult {
  type: SearchResultType;
  id: string;
  title: string;
  moduleId: string;
  body: string;
  score: number;
  matchedField: 'title' | 'tags' | 'body' | 'note';
  route: SearchRouteTarget;
  hitReason?: string;
}

// ── 工具函数 ───────────────────────────────────────────────────────
const stripHtml = (value: string) => value.replace(/<[^>]+>/g, '').replace(/&nbsp;/g, ' ').trim();

export function normalizeText(value: string): string {
  return value.toLowerCase().replace(/\s+/g, ' ');
}

/**
 * 检查文本是否包含查询关键词（大小写无关）。
 * 返回匹配到的字段类型和得分；不匹配返回 null。
 */
function matchField(
  normalizedQuery: string,
  fields: Array<{ text: string; weight: number; name: 'title' | 'tags' | 'body' }>
): { name: 'title' | 'tags' | 'body'; score: number } | null {
  let best: { name: 'title' | 'tags' | 'body'; score: number } | null = null;
  for (const field of fields) {
    if (normalizeText(field.text).includes(normalizedQuery)) {
      if (!best || field.weight > best.score) {
        best = { name: field.name, score: field.weight };
      }
    }
  }
  return best;
}

/**
 * 从文本中提取包含查询关键词的片段（前后各取 40 字符）。
 */
export function extractSnippet(normalizedQuery: string, fullText: string, maxLen = 120): string {
  const normalized = normalizeText(fullText);
  const idx = normalized.indexOf(normalizedQuery);
  if (idx === -1) return fullText.slice(0, maxLen);
  const start = Math.max(0, idx - 40);
  const end = Math.min(fullText.length, idx + normalizedQuery.length + 40);
  const snippet = fullText.slice(start, end).trim();
  return (start > 0 ? '…' : '') + snippet + (end < fullText.length ? '…' : '');
}

// ── 权重定义 ───────────────────────────────────────────────────────
const WEIGHTS = {
  title: 100,
  tags: 60,
  body: 20,
  questionTitle: 90,
  questionAnswer: 15,
  scenarioTitle: 90,
  scenarioProblem: 25
} as const;

// ── 单类搜索 ───────────────────────────────────────────────────────
function searchKnowledgePoints(query: string): SearchResult[] {
  const nq = normalizeText(query);
  if (!nq) return [];
  const results: SearchResult[] = [];
  for (const kp of appData.knowledgePoints) {
    const matched = matchField(nq, [
      { text: kp.title, weight: WEIGHTS.title, name: 'title' },
      { text: kp.tags.join(' '), weight: WEIGHTS.tags, name: 'tags' },
      { text: kp.coreConcepts.map((c) => `${c.title} ${stripHtml(c.body)}`).join(' '), weight: WEIGHTS.body, name: 'body' }
    ]);
    if (!matched) continue;
    const body = stripHtml(kp.coreConcepts[0]?.body ?? '');
    results.push({
      type: '知识点',
      id: kp.id,
      title: kp.title,
      moduleId: kp.moduleId,
      body: extractSnippet(nq, body),
      score: matched.score,
      matchedField: matched.name,
      route: 'modules'
    });
  }
  return results;
}

function searchQuestions(query: string): SearchResult[] {
  const nq = normalizeText(query);
  if (!nq) return [];
  const results: SearchResult[] = [];
  for (const q of appData.questions) {
    const matched = matchField(nq, [
      { text: q.title, weight: WEIGHTS.questionTitle, name: 'title' },
      { text: q.points.join(' '), weight: WEIGHTS.tags, name: 'tags' },
      { text: stripHtml(q.answer), weight: WEIGHTS.questionAnswer, name: 'body' }
    ]);
    if (!matched) continue;
    const body = stripHtml(q.answer);
    results.push({
      type: '面试题',
      id: q.id,
      title: q.title,
      moduleId: q.moduleId,
      body: extractSnippet(nq, body),
      score: matched.score,
      matchedField: matched.name,
      route: 'interview'
    });
  }
  return results;
}

function searchScenarios(query: string): SearchResult[] {
  const nq = normalizeText(query);
  if (!nq) return [];
  const results: SearchResult[] = [];
  for (const s of appData.scenarios) {
    const matched = matchField(nq, [
      { text: s.title, weight: WEIGHTS.scenarioTitle, name: 'title' },
      { text: s.tags.join(' '), weight: WEIGHTS.tags, name: 'tags' },
      { text: `${s.background} ${s.problem} ${s.solution.join(' ')}`, weight: WEIGHTS.scenarioProblem, name: 'body' }
    ]);
    if (!matched) continue;
    results.push({
      type: '场景题',
      id: s.id,
      title: s.title,
      moduleId: s.moduleIds[0] ?? '',
      body: extractSnippet(nq, s.problem),
      score: matched.score,
      matchedField: matched.name,
      route: 'scenarios'
    });
  }
  return results;
}

// ── 统一搜索入口 ───────────────────────────────────────────────────
export interface SearchOptions {
  /** 限制结果总数，默认 60 */
  limit?: number;
  /** 按标签过滤 */
  tag?: string;
  /** 按类型过滤 */
  types?: SearchResultType[];
}

/**
 * 在知识点、面试题、场景题中做统一搜索。
 * 大小写无关，按得分降序排列。
 */
export function searchAll(query: string, options: SearchOptions = {}): SearchResult[] {
  const { limit = 60, tag, types } = options;
  const nq = normalizeText(query);
  if (!nq && !tag) return [];

  let results: SearchResult[] = [];

  const searchTypes = types ?? ['知识点', '面试题', '场景题'];
  if (searchTypes.includes('知识点')) results.push(...searchKnowledgePoints(query));
  if (searchTypes.includes('面试题')) results.push(...searchQuestions(query));
  if (searchTypes.includes('场景题')) results.push(...searchScenarios(query));

  // 标签过滤
  if (tag && tag !== '全部') {
    const tagLookup = new Set(
      [
        ...appData.knowledgePoints.filter((k) => k.tags.includes(tag)).map((k) => k.id),
        ...appData.questions.filter((q) => q.category === tag).map((q) => q.id),
        ...appData.scenarios.filter((s) => s.tags.includes(tag)).map((s) => s.id)
      ]
    );
    results = results.filter((r) => tagLookup.has(r.id));
  }

  // 无查询词时仅按标签过滤返回
  if (!nq) return results.slice(0, limit);

  return results.sort((a, b) => b.score - a.score).slice(0, limit);
}

/**
 * 面试题局部过滤：大小写无关，支持多维度。
 */
export function filterQuestions(
  questions: InterviewQuestion[],
  query: string
): InterviewQuestion[] {
  const nq = normalizeText(query);
  if (!nq) return questions;
  return questions.filter((q) =>
    normalizeText(`${q.title} ${q.answer} ${q.points.join(' ')}`).includes(nq)
  );
}

/**
 * 知识点局部过滤：大小写无关。
 */
export function filterKnowledgePoints(
  points: KnowledgePoint[],
  query: string
): KnowledgePoint[] {
  const nq = normalizeText(query);
  if (!nq) return points;
  return points.filter((p) =>
    normalizeText(`${p.title} ${p.tags.join(' ')} ${p.coreConcepts.map((c) => `${c.title} ${c.body}`).join(' ')}`).includes(nq)
  );
}

// ── 高亮渲染辅助 ───────────────────────────────────────────────────
/**
 * 在文本中高亮所有匹配的查询关键词（大小写无关）。
 * 返回纯文本或带 <mark> 的 React 可渲染结构的原始字符串。
 * 前端组件需要配合 dangerouslySetInnerHTML 或自行拆分。
 *
 * 为安全起见，返回分段数组：{ text, highlighted }[]
 */
export function getHighlightSegments(
  text: string,
  query: string
): Array<{ text: string; highlighted: boolean }> {
  const nq = normalizeText(query);
  if (!nq || !normalizeText(text).includes(nq)) return [{ text, highlighted: false }];

  const segments: Array<{ text: string; highlighted: boolean }> = [];
  const lower = text.toLowerCase();
  let lastIdx = 0;
  let searchFrom = 0;

  while (searchFrom < lower.length) {
    const idx = lower.indexOf(nq, searchFrom);
    if (idx === -1) break;
    if (idx > lastIdx) segments.push({ text: text.slice(lastIdx, idx), highlighted: false });
    segments.push({ text: text.slice(idx, idx + nq.length), highlighted: true });
    lastIdx = idx + nq.length;
    searchFrom = lastIdx;
  }
  if (lastIdx < text.length) segments.push({ text: text.slice(lastIdx), highlighted: false });
  return segments;
}

/** 获取匹配模块标题 */
export function getModuleName(moduleId: string): string {
  return moduleLookup.get(moduleId)?.title ?? moduleId;
}

export function searchNotes(query: string, state: UserState): SearchResult[] {
  const nq = normalizeText(query);
  if (!nq) return [];
  const results: SearchResult[] = [];
  for (const [kpId, note] of Object.entries(state.notes)) {
    if (!normalizeText(note).includes(nq)) continue;
    const kp = appData.knowledgePoints.find((p) => p.id === kpId);
    results.push({
      type: '笔记',
      id: kpId,
      title: kp?.title ?? kpId,
      moduleId: kp?.moduleId ?? '',
      body: note,
      score: 30,
      matchedField: 'note',
      route: 'modules',
      hitReason: '笔记内容匹配'
    });
  }
  return results;
}

export function searchWrongQuestions(query: string, state: UserState): SearchResult[] {
  const nq = normalizeText(query);
  if (!nq) return [];
  const results: SearchResult[] = [];
  for (const wq of state.wrongQuestions) {
    const q = questionLookup.get(wq.questionId);
    if (!q) continue;
    const text = `${q.title} ${wq.reason} ${wq.note}`;
    if (!normalizeText(text).includes(nq)) continue;
    results.push({
      type: '错题',
      id: wq.questionId,
      title: q.title,
      moduleId: wq.moduleId,
      body: wq.note || wq.reason,
      score: 35,
      matchedField: 'body',
      route: 'review',
      hitReason: '错题匹配'
    });
  }
  return results;
}

export function searchAllWithState(query: string, state: UserState): SearchResult[] {
  const base = searchAll(query);
  const notes = searchNotes(query, state);
  const wrongs = searchWrongQuestions(query, state);
  return [...base, ...notes, ...wrongs].sort((a, b) => b.score - a.score);
}
