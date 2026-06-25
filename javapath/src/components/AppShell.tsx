import {
  CalendarClock,
  BookOpen,
  Code2,
  Menu,
  Moon,
  RotateCcw,
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
  const routeMap = new Map(routes.map((item) => [item.id, item]));
  const workspaces = [
    { id: 'learn', label: '学习', hint: '路径 / 模块 / 图谱', icon: BookOpen, primary: 'modules' as RouteId, routeIds: ['dashboard', 'path', 'modules', 'graph'] as RouteId[] },
    { id: 'practice', label: '练习', hint: '面试 / 场景', icon: Code2, primary: 'interview' as RouteId, routeIds: ['interview', 'scenarios'] as RouteId[] },
    { id: 'review', label: '复盘', hint: '计划 / 错题', icon: RotateCcw, primary: 'plan' as RouteId, routeIds: ['plan', 'review'] as RouteId[] },
    { id: 'search', label: '搜索', hint: '全文检索', icon: Search, primary: 'search' as RouteId, routeIds: ['search'] as RouteId[] }
  ];
  const activeWorkspace = workspaces.find((item) => item.routeIds.includes(route)) ?? workspaces[0];
  const contextRoutes = activeWorkspace.routeIds
    .map((id) => routeMap.get(id))
    .filter((item): item is NonNullable<typeof item> => Boolean(item));

  const submitSearch = (event: React.FormEvent) => {
    event.preventDefault();
    goTo('search', globalQuery);
    setOpen(false);
  };

  return (
    <div className="app-shell">
      <aside className={`sidebar ${open ? 'is-open' : ''}`}>
        <div className="rail-brand">
          <div className="brand-mark">J</div>
          <button className="icon-button mobile-close" type="button" onClick={() => setOpen(false)} aria-label="关闭导航">
            <X size={18} />
          </button>
        </div>

        <nav className="workspace-nav" aria-label="主工作区">
          {workspaces.map((item) => {
            const Icon = item.icon;
            return (
              <button
                type="button"
                key={item.id}
                className={`workspace-button ${activeWorkspace.id === item.id ? 'active' : ''}`}
                onClick={() => {
                  goTo(item.primary);
                  setOpen(false);
                }}
                title={item.hint}
              >
                <Icon size={24} />
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>

        <div className="rail-plan" title={`面试倒计时 ${days} 天，整体掌握度 ${mastery}%`}>
          <CalendarClock size={18} />
          <strong>{days}</strong>
          <span>天</span>
          <div className="rail-meter">
            <i style={{ height: `${mastery}%` }} />
          </div>
        </div>
      </aside>

      <div className="main-frame">
        <header className="topbar">
          <button className="icon-button mobile-menu" type="button" onClick={() => setOpen(true)} aria-label="打开导航">
            <Menu size={20} />
          </button>
          <div className="title-block">
            <span>JavaPath · {activeWorkspace.label}</span>
            <h1>{title}</h1>
          </div>

          <nav className="context-tabs" aria-label="当前工作区导航">
            {contextRoutes.map((item) => {
              const Icon = item.icon;
              return (
                <button
                  type="button"
                  key={item.id}
                  className={route === item.id ? 'active' : ''}
                  onClick={() => goTo(item.id)}
                >
                  <Icon size={15} />
                  {item.label}
                </button>
              );
            })}
          </nav>

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
