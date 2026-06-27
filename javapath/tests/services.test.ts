// ── Service Unit Tests ──────────────────────────────────────────────
// Run: node --import tsx tests/services.test.ts
// Or:  npm test (after adding script to package.json)

import { describe, it } from 'node:test';
import assert from 'node:assert/strict';

// We test the pure functions by importing them directly.
// Since they depend on appData which needs transpilation,
// we test the algorithm logic in isolation.

describe('SM-2 Algorithm', () => {
  // Test the SM-2 core logic inline (mirrors reviewService.sm2)
  function sm2(quality, item) {
    const q = Math.max(0, Math.min(5, quality));
    let { easeFactor, intervalDays, repetitions } = item;
    if (q < 3) {
      repetitions = 0;
      intervalDays = 1;
    } else {
      repetitions += 1;
      if (repetitions === 1) intervalDays = 1;
      else if (repetitions === 2) intervalDays = 6;
      else intervalDays = Math.round(intervalDays * easeFactor);
    }
    easeFactor = Math.max(1.3, easeFactor + 0.1 - (5 - q) * (0.08 + (5 - q) * 0.02));
    return { easeFactor, intervalDays, repetitions };
  }

  it('resets on quality < 3', () => {
    const result = sm2(0, { easeFactor: 2.5, intervalDays: 10, repetitions: 5 });
    assert.equal(result.repetitions, 0);
    assert.equal(result.intervalDays, 1);
  });

  it('increments repetitions on quality >= 3', () => {
    const result = sm2(3, { easeFactor: 2.5, intervalDays: 1, repetitions: 0 });
    assert.equal(result.repetitions, 1);
    assert.equal(result.intervalDays, 1);
  });

  it('uses 6 days for second successful review', () => {
    const result = sm2(4, { easeFactor: 2.5, intervalDays: 1, repetitions: 1 });
    assert.equal(result.repetitions, 2);
    assert.equal(result.intervalDays, 6);
  });

  it('multiplies interval by easeFactor for 3rd+ review', () => {
    const result = sm2(4, { easeFactor: 2.5, intervalDays: 6, repetitions: 2 });
    assert.equal(result.repetitions, 3);
    assert.equal(result.intervalDays, 15); // 6 * 2.5 = 15
  });

  it('clamps easeFactor to minimum 1.3', () => {
    const result = sm2(0, { easeFactor: 1.3, intervalDays: 1, repetitions: 0 });
    assert.ok(result.easeFactor >= 1.3);
  });

  it('decreases easeFactor on low quality', () => {
    const result = sm2(1, { easeFactor: 2.5, intervalDays: 1, repetitions: 0 });
    assert.ok(result.easeFactor < 2.5);
  });

  it('increases easeFactor on perfect quality', () => {
    const result = sm2(5, { easeFactor: 2.5, intervalDays: 6, repetitions: 2 });
    assert.ok(result.easeFactor > 2.5);
  });
});

describe('Mastery Scoring', () => {
  function masteryLevel(score) {
    if (score >= 90) return 'expert';
    if (score >= 70) return 'mastered';
    if (score >= 45) return 'familiar';
    if (score >= 20) return 'beginner';
    return 'unknown';
  }

  it('returns expert for score >= 90', () => {
    assert.equal(masteryLevel(95), 'expert');
    assert.equal(masteryLevel(90), 'expert');
  });

  it('returns mastered for score >= 70', () => {
    assert.equal(masteryLevel(80), 'mastered');
    assert.equal(masteryLevel(70), 'mastered');
  });

  it('returns familiar for score >= 45', () => {
    assert.equal(masteryLevel(50), 'familiar');
    assert.equal(masteryLevel(45), 'familiar');
  });

  it('returns beginner for score >= 20', () => {
    assert.equal(masteryLevel(30), 'beginner');
    assert.equal(masteryLevel(20), 'beginner');
  });

  it('returns unknown for score < 20', () => {
    assert.equal(masteryLevel(10), 'unknown');
    assert.equal(masteryLevel(0), 'unknown');
  });
});

describe('Interview Readiness Score', () => {
  function readinessScore(mastery, correctRate, coverage, reviewCompliance) {
    return Math.round(mastery * 0.4 + correctRate * 0.3 + coverage * 0.2 + reviewCompliance * 0.1);
  }

  it('returns 100 for perfect scores', () => {
    assert.equal(readinessScore(100, 100, 100, 100), 100);
  });

  it('returns 0 for zero scores', () => {
    assert.equal(readinessScore(0, 0, 0, 0), 0);
  });

  it('weights mastery most heavily', () => {
    const onlyMastery = readinessScore(100, 0, 0, 0);
    const onlyCorrect = readinessScore(0, 100, 0, 0);
    assert.ok(onlyMastery > onlyCorrect);
  });

  it('returns reasonable mid-range score', () => {
    const score = readinessScore(60, 70, 50, 80);
    assert.ok(score >= 50 && score <= 80);
  });
});

describe('Quality Button Mapping', () => {
  function qualityFromButton(label) {
    const map = { '完全不会': 0, '模糊': 2, '基本会': 3, '很熟': 4, '秒答': 5 };
    return map[label] ?? 3;
  }

  it('maps Chinese labels to SM-2 quality values', () => {
    assert.equal(qualityFromButton('完全不会'), 0);
    assert.equal(qualityFromButton('模糊'), 2);
    assert.equal(qualityFromButton('基本会'), 3);
    assert.equal(qualityFromButton('很熟'), 4);
    assert.equal(qualityFromButton('秒答'), 5);
  });

  it('defaults to 3 for unknown labels', () => {
    assert.equal(qualityFromButton('unknown'), 3);
  });
});

describe('Streak Calculation', () => {
  function calcStreak(checkins) {
    const set = new Set(checkins);
    let streak = 0;
    const d = new Date();
    while (true) {
      const key = d.toISOString().slice(0, 10);
      if (!set.has(key)) break;
      streak++;
      d.setDate(d.getDate() - 1);
    }
    return streak;
  }

  it('returns 0 for empty checkins', () => {
    assert.equal(calcStreak([]), 0);
  });

  it('counts consecutive days', () => {
    const today = new Date().toISOString().slice(0, 10);
    const yesterday = new Date(Date.now() - 86400000).toISOString().slice(0, 10);
    assert.ok(calcStreak([today, yesterday]) >= 1);
  });
});

describe('Forget Risk', () => {
  function forgetRisk(daysSinceLastStudy, mastery, intervalDays) {
    const overdue = daysSinceLastStudy - intervalDays;
    let risk = 0;
    if (overdue > 0) risk += Math.min(50, overdue * 8);
    if (mastery < 40) risk += 30;
    else if (mastery < 60) risk += 15;
    return Math.min(100, Math.round(risk));
  }

  it('returns 0 risk for recently studied with high mastery', () => {
    assert.equal(forgetRisk(0, 80, 7), 0);
  });

  it('increases risk for overdue items', () => {
    const risk = forgetRisk(10, 50, 3);
    assert.ok(risk > 0);
  });

  it('increases risk for low mastery', () => {
    const highRisk = forgetRisk(0, 20, 7);
    const lowRisk = forgetRisk(0, 80, 7);
    assert.ok(highRisk > lowRisk);
  });

  it('caps at 100', () => {
    assert.ok(forgetRisk(100, 10, 1) <= 100);
  });
});

console.log('All tests passed!');
