import {
  BarChart3,
  BookOpen,
  CalendarClock,
  ChevronDown,
  LayoutDashboard,
  Menu,
  Moon,
  Search,
  Sun,
  Target,
  X
} from 'lucide-react';
import { useMemo, useRef, useState } from 'react';
import { useEffect } from 'react';
import type { RouteId } from '../types';
import { appData } from '../data/appData';
import { daysUntil, overallMastery } from '../lib/metrics';
import { backupState, exportState, importState, resetStateWithBackup } from '../lib/storage';
import type { SyncStatus } from '../hooks/useStorageSync';
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
  syncStatus?: SyncStatus;
  children: React.ReactNode;
}

const routeGroups: Array<{ label: string; ids: RouteId[] }> = [
  { label: '学习主线', ids: ['dashboard', 'path', 'modules', 'graph'] },
  { label: '面试训练', ids: ['interview', 'scenarios'] },
  { label: '复盘计划', ids: ['plan', 'review'] },
  { label: '检索', ids: ['search'] }
];

const primaryEntries: Array<{ id: RouteId; label: string; icon: React.ComponentType<{ size?: number }> }> = [
  { id: 'dashboard', label: '总览', icon: LayoutDashboard },
  { id: 'modules', label: '学习', icon: BookOpen },
  { id: 'interview', label: '训练', icon: BarChart3 },
  { id: 'plan', label: '复盘', icon: CalendarClock }
];

export function AppShell({
  route,
  routes,
  title,
  state,
  setState,
  globalQuery,
  setGlobalQuery,
  goTo,
  syncStatus,
  children
}: AppShellProps) {
  const [menuOpen, setMenuOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const searchInputRef = useRef<HTMLInputElement | null>(null);
  const mastery = overallMastery(state);
  const days = daysUntil(state.targetDate);

  // 全局键盘快捷键
  useEffect(() => {
    const handler = (event: KeyboardEvent) => {
      // Ctrl+K / Cmd+K → 聚焦搜索
      if ((event.ctrlKey || event.metaKey) && event.key === 'k') {
        event.preventDefault();
        searchInputRef.current?.focus();
      }
      // Esc → 关闭菜单
      if (event.key === 'Escape' && menuOpen) {
        setMenuOpen(false);
      }
    };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [menuOpen]);

  const routeMap = useMemo(() => new Map(routes.map((item) => [item.id, item])), [routes]);
  const activeGroup = routeGroups.find((group) => group.ids.includes(route)) ?? routeGroups[0];

  const navigate = (nextRoute: RouteId, query?: string) => {
    goTo(nextRoute, query);
    setMenuOpen(false);
  };

  const submitSearch = (event: React.FormEvent) => {
    event.preventDefault();
    navigate('search', globalQuery);
  };

  const exportLearningState = () => {
    const blob = new Blob([exportState(state)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `javapath-state-${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
  };

  const importLearningState = async (file: File) => {
    try {
      const text = await file.text();
      const imported = importState(text);
      backupState(state);
      setState(imported);
    } catch (error) {
      window.alert(error instanceof Error ? error.message : '导入学习状态失败。');
    } finally {
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const resetLearningState = () => {
    const confirmed = window.confirm('确定要重置本地学习状态吗？当前状态会先备份到 localStorage 的 backup key。');
    if (confirmed) setState((current) => resetStateWithBackup(current));
  };

  return (
    <div className="app-shell top-shell">
      <header className="workspace-topbar">
        <button type="button" className="brand-button" onClick={() => navigate('dashboard')} aria-label="回到 Dashboard">
          <span className="brand-mark">J</span>
          <span>
            <strong>JavaPath</strong>
            <small>{appData.modules.length} 份 PDF · 后端进阶</small>
          </span>
        </button>

        <nav className="primary-nav" aria-label="核心入口">
          {primaryEntries.map((item) => {
            const Icon = item.icon;
            const isActive = item.id === route || (item.id === 'modules' && ['path', 'graph'].includes(route));
            return (
              <button
                type="button"
                key={item.id}
                className={isActive ? 'active' : ''}
                onClick={() => navigate(item.id)}
              >
                <Icon size={16} />
                {item.label}
              </button>
            );
          })}
        </nav>

        <form className="global-search workspace-search" onSubmit={submitSearch}>
          <Search size={17} />
          <input
            ref={searchInputRef}
            value={globalQuery}
            onChange={(event) => setGlobalQuery(event.target.value)}
            placeholder="搜索知识点、面试题、场景题  ⌘K"
          />
        </form>

        <div className="workspace-actions">
          <button
            type="button"
            className="route-menu-button"
            onClick={() => setMenuOpen((value) => !value)}
            aria-expanded={menuOpen}
            aria-label="打开全部页面"
          >
            <Menu size={17} />
            <span>{title}</span>
            <ChevronDown size={15} />
          </button>

          <div className="study-signal" title={`面试倒计时 ${days} 天，整体掌握度 ${mastery}%`}>
            <CalendarClock size={16} />
            <strong>{days}</strong>
            <span>天</span>
            <i>
              <b style={{ width: `${mastery}%` }} />
            </i>
          </div>

          {syncStatus && syncStatus !== 'idle' && (
            <div className={`sync-badge sync-${syncStatus}`} title={syncStatus === 'syncing' ? '同步中...' : '同步失败'}>
              {syncStatus === 'syncing' ? '⟳' : '⚠'}
            </div>
          )}

          <label className="target-date compact-target">
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
        </div>

        {menuOpen ? (
          <div className="route-popover" role="menu">
            <div className="route-popover-head">
              <div>
                <strong>{activeGroup.label}</strong>
                <span>选择接下来的学习工作区</span>
              </div>
              <button type="button" className="icon-button" onClick={() => setMenuOpen(false)} aria-label="关闭页面菜单">
                <X size={17} />
              </button>
            </div>
            <div className="route-state-tools" aria-label="学习状态工具">
              <button type="button" className="ghost-btn" onClick={exportLearningState}>
                导出状态
              </button>
              <button type="button" className="ghost-btn" onClick={() => fileInputRef.current?.click()}>
                导入状态
              </button>
              <button type="button" className="ghost-btn danger" onClick={resetLearningState}>
                备份并重置
              </button>
              <input
                ref={fileInputRef}
                className="visually-hidden"
                type="file"
                accept="application/json,.json"
                onChange={(event) => {
                  const file = event.target.files?.[0];
                  if (file) void importLearningState(file);
                }}
              />
            </div>
            <div className="route-group-grid">
              {routeGroups.map((group) => (
                <section key={group.label}>
                  <h2>{group.label}</h2>
                  <div>
                    {group.ids.map((id) => {
                      const item = routeMap.get(id);
                      if (!item) return null;
                      const Icon = item.icon;
                      return (
                        <button
                          type="button"
                          key={id}
                          className={route === id ? 'active' : ''}
                          onClick={() => navigate(id)}
                          role="menuitem"
                        >
                          <Icon size={16} />
                          <span>{item.label}</span>
                        </button>
                      );
                    })}
                  </div>
                </section>
              ))}
            </div>
          </div>
        ) : null}
      </header>

      {menuOpen ? <button className="shell-scrim" type="button" aria-label="关闭页面菜单" onClick={() => setMenuOpen(false)} /> : null}

      <main className="content workspace-content">{children}</main>

      {/* 移动端底部导航 */}
      <nav className="mobile-bottom-nav" aria-label="移动端导航">
        {primaryEntries.map((item) => {
          const Icon = item.icon;
          const isActive = item.id === route || (item.id === 'modules' && ['path', 'graph'].includes(route));
          return (
            <button
              type="button"
              key={item.id}
              className={isActive ? 'active' : ''}
              onClick={() => navigate(item.id)}
            >
              <Icon size={18} />
              <span>{item.label}</span>
            </button>
          );
        })}
      </nav>
    </div>
  );
}
