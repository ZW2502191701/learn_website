import {
  CalendarClock,
  ChevronRight,
  Menu,
  Moon,
  Search,
  Sun,
  Target,
  X
} from 'lucide-react';
import { useState } from 'react';
import type { RouteId } from '../App';
import { appData } from '../data/appData';
import { daysUntil, overallMastery } from '../lib/metrics';
import type { UserState } from '../types';

interface AppShellProps {
  route: RouteId;
  routes: Array<{ id: RouteId; label: string; icon: React.ComponentType<{ size?: number }> }>;
  title: string;
  state: UserState;
  setState: React.Dispatch<React.SetStateAction<UserState>>;
  globalQuery: string;
  setGlobalQuery: (value: string) => void;
  goTo: (route: RouteId, query?: string) => void;
  children: React.ReactNode;
}

export function AppShell({
  route,
  routes,
  title,
  state,
  setState,
  globalQuery,
  setGlobalQuery,
  goTo,
  children
}: AppShellProps) {
  const [open, setOpen] = useState(false);
  const mastery = overallMastery(state);
  const days = daysUntil(state.targetDate);

  const submitSearch = (event: React.FormEvent) => {
    event.preventDefault();
    goTo('search', globalQuery);
    setOpen(false);
  };

  return (
    <div className="app-shell">
      <aside className={`sidebar ${open ? 'is-open' : ''}`}>
        <div className="brand">
          <div className="brand-mark">J</div>
          <div>
            <strong>Java 后端进阶学习平台</strong>
            <span>PDF-driven interview lab</span>
          </div>
          <button className="icon-button mobile-close" type="button" onClick={() => setOpen(false)} aria-label="关闭导航">
            <X size={18} />
          </button>
        </div>

        <nav className="side-nav" aria-label="主导航">
          {routes.map((item) => {
            const Icon = item.icon;
            return (
              <button
                type="button"
                key={item.id}
                className={`side-nav-item ${route === item.id ? 'active' : ''}`}
                onClick={() => {
                  goTo(item.id);
                  setOpen(false);
                }}
              >
                <Icon size={17} />
                <span>{item.label}</span>
                {route === item.id ? <ChevronRight size={15} /> : null}
              </button>
            );
          })}
        </nav>

        <div className="sidebar-plan">
          <div className="tiny-label">Target Plan</div>
          <div className="sidebar-plan-main">
            <CalendarClock size={16} />
            <span>面试倒计时 {days} 天</span>
          </div>
          <div className="mini-progress">
            <span style={{ width: `${mastery}%` }} />
          </div>
          <small>整体掌握度 {mastery}% · {appData.knowledgePoints.length} 个知识点</small>
        </div>
      </aside>

      <div className="main-frame">
        <header className="topbar">
          <button className="icon-button mobile-menu" type="button" onClick={() => setOpen(true)} aria-label="打开导航">
            <Menu size={20} />
          </button>
          <div className="title-block">
            <span>JavaPath</span>
            <h1>{title}</h1>
          </div>

          <form className="global-search" onSubmit={submitSearch}>
            <Search size={17} />
            <input
              value={globalQuery}
              onChange={(event) => setGlobalQuery(event.target.value)}
              placeholder="搜索知识点、面试题、场景题"
            />
          </form>

          <label className="target-date">
            <Target size={15} />
            <input
              type="date"
              value={state.targetDate}
              onChange={(event) => setState((current) => ({ ...current, targetDate: event.target.value }))}
            />
          </label>

          <button
            className="icon-button"
            type="button"
            onClick={() => setState((current) => ({ ...current, theme: current.theme === 'light' ? 'dark' : 'light' }))}
            aria-label="切换深浅色模式"
          >
            {state.theme === 'light' ? <Moon size={18} /> : <Sun size={18} />}
          </button>
        </header>

        <main className="content">{children}</main>
      </div>
    </div>
  );
}
