import { appData } from '../data/appData';
import { correctRateForModule, masteryForModule } from '../lib/metrics';
import type { UserState } from '../types';

export function DonutChart({ value, label }: { value: number; label: string }) {
  return (
    <div className="donut-wrap">
      <div className="donut" style={{ background: `conic-gradient(var(--accent) ${value * 3.6}deg, var(--line) 0deg)` }}>
        <div>
          <strong>{value}%</strong>
          <span>{label}</span>
        </div>
      </div>
    </div>
  );
}

export function ModuleBars({ state }: { state: UserState }) {
  return (
    <div className="module-bars">
      {appData.modules.slice(0, 9).map((module) => {
        const mastery = masteryForModule(state, module.id);
        return (
          <div className="bar-row" key={module.id}>
            <span>{module.title}</span>
            <div className="bar-track">
              <i style={{ width: `${mastery}%` }} />
            </div>
            <strong>{mastery}%</strong>
          </div>
        );
      })}
    </div>
  );
}

export function AccuracyBars({ state }: { state: UserState }) {
  return (
    <div className="accuracy-grid">
      {appData.modules.slice(0, 8).map((module) => {
        const rate = correctRateForModule(state, module.id);
        return (
          <div className="accuracy-cell" key={module.id}>
            <span>{module.title}</span>
            <strong>{rate}%</strong>
            <div className="bar-track">
              <i style={{ width: `${rate}%` }} />
            </div>
          </div>
        );
      })}
    </div>
  );
}

export function Heatmap({ checkins }: { checkins: string[] }) {
  const today = new Date();
  const checkinSet = new Set(checkins);

  // 基于最近连续打卡情况计算热力等级
  const cells = Array.from({ length: 42 }, (_, index) => {
    const date = new Date(today);
    date.setDate(today.getDate() - (41 - index));
    const key = date.toISOString().slice(0, 10);
    const active = checkinSet.has(key);
    let level = 0;
    if (active) {
      // 计算该日附近连续打卡密度（前后各 2 天窗口内打卡数）
      let streak = 0;
      for (let offset = -2; offset <= 2; offset++) {
        const nearby = new Date(date);
        nearby.setDate(date.getDate() + offset);
        if (checkinSet.has(nearby.toISOString().slice(0, 10))) streak++;
      }
      level = Math.min(4, streak);
    }
    return { key, active, level };
  });

  return (
    <div className="heatmap" aria-label="学习热力图">
      {cells.map((cell) => (
        <span key={cell.key} className={`heat-${cell.level}`} title={cell.key} />
      ))}
    </div>
  );
}
