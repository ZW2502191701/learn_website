import {
  BarChart3,
  BookOpen,
  CalendarClock,
  ChevronDown,
  LayoutDashboard,
  Maximize2,
  Menu,
  Moon,
  Search,
  Sun,
  Target,
  X
} from 'lucide-react';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { RouteId } from '../types';
import { appData } from '../data/appData';
import { daysUntil, overallMastery } from '../lib/metrics';
import { backupState, exportState, importState, resetStateWithBackup } from '../lib/storage';
import type { SyncStatus } from '../hooks/useStorageSync';
import type { UserState } from '../types';
import { useToast } from '../hooks/useToast';
import { ConfirmDialog } from './ConfirmDialog';

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
  route, routes, title, state, setState,
  globalQuery, setGlobalQuery, goTo, syncStatus, children
}: AppShellProps) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [cmdOpen, setCmdOpen] = useState(false);
  const [cmdQuery, setCmdQuery] = useState('');
  const [cmdCursor, setCmdCursor] = useState(0);
  const [confirmPending, setConfirmPending] = useState<null | { message: string; onOk: () => void }>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const cmdInputRef = useRef<HTMLInputElement | null>(null);
  const toast = useToast();
  const mastery = overallMastery(state);
  const days = daysUntil(state.targetDate);

  // Ctrl+K → open command palette
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        setCmdOpen((v) => !v);
        setCmdQuery('');
        setCmdCursor(0);
      }
      if (e.key === 'Escape') {
        setCmdOpen(false);
        setMenuOpen(false);
      }
    };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, []);

  // Build command palette items
  const allRouteItems = useMemo(() => routes.map((r) => ({
    type: 'route' as const, id: r.id, label: r.label, group: '页面',
  })), [routes]);

  const knowledgeItems = useMemo(() => {
    const q = cmdQuery.trim().toLowerCase();
    if (!q) return [];
    return appData.knowledgePoints
      .filter((p) => p.title.toLowerCase().includes(q))
      .slice(0, 5)
      .map((p) => ({ type: 'knowledge' as const, id: p.id, label: p.title, group: '知识点' }));
  }, [cmdQuery]);

  const staticActions = useMemo(() => [
    { type: 'action' as const, id: 'checkin', label: '今日打卡', group: '操作' },
    { type: 'action' as const, id: 'export', label: '导出学习状态', group: '操作' },
    { type: 'action' as const, id: 'reset', label: '备份并重置', group: '操作' },
  ], []);

  const cmdItems = useMemo(() => {
    const q = cmdQuery.trim().toLowerCase();
    const routeMatched = q
      ? allRouteItems.filter((r) => r.label.includes(q) || r.id.includes(q))
      : allRouteItems;
    return [...routeMatched, ...knowledgeItems, ...(q ? [] : staticActions)];
  }, [cmdQuery, allRouteItems, knowledgeItems, staticActions]);

  const activateCmdItem = useCallback((item: typeof cmdItems[0]) => {
    setCmdOpen(false);
    if (item.type === 'route') goTo(item.id as RouteId);
    else if (item.type === 'knowledge') goTo('modules', item.label);
    else if (item.id === 'checkin') {
      const today = new Date().toISOString().slice(0, 10);
      setState((cur) => {
        const checked = cur.checkins.includes(today);
        const next = { ...cur, checkins: checked ? cur.checkins.filter((d) => d !== today) : [...cur.checkins, today] };
        toast.success(checked ? '已取消今日打卡' : '今日打卡成功 🎉');
        return next;
      });
    } else if (item.id === 'export') {
      exportLearningState();
    } else if (item.id === 'reset') {
      setConfirmPending({ message: '确定要重置本地学习状态吗？当前状态会先备份到 localStorage。', onOk: () => setState((cur) => resetStateWithBackup(cur)) });
    }
  }, [goTo, setState, toast]);

  const handleCmdKey = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') { e.preventDefault(); setCmdCursor((c) => Math.min(c + 1, cmdItems.length - 1)); }
    else if (e.key === 'ArrowUp') { e.preventDefault(); setCmdCursor((c) => Math.max(c - 1, 0)); }
    else if (e.key === 'Enter' && cmdItems[cmdCursor]) activateCmdItem(cmdItems[cmdCursor]);
  };

  const routeMap = useMemo(() => new Map(routes.map((item) => [item.id, item])), [routes]);
  const activeGroup = routeGroups.find((g) => g.ids.includes(route)) ?? routeGroups[0];

  const navigate = (nextRoute: RouteId, query?: string) => { goTo(nextRoute, query); setMenuOpen(false); };

  const submitSearch = (e: React.FormEvent) => { e.preventDefault(); navigate('search', globalQuery); };

  const exportLearningState = () => {
    const blob = new Blob([exportState(state)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = `javapath-state-${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(a); a.click(); a.remove(); URL.revokeObjectURL(url);
    toast.success('学习状态已导出');
  };

  const importLearningState = async (file: File) => {
    try {
      const text = await file.text();
      const imported = importState(text);
      backupState(state);
      setState(imported);
      toast.success('学习状态已导入');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : '导入失败');
    } finally {
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  // Group cmd items for rendering
  const grouped = useMemo(() => {
    const map = new Map<string, typeof cmdItems>();
    for (const item of cmdItems) {
      if (!map.has(item.group)) map.set(item.group, []);
      map.get(item.group)!.push(item);
    }
    return map;
  }, [cmdItems]);

  let globalIndex = 0;

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
              <button type="button" key={item.id} className={isActive ? 'active' : ''} onClick={() => navigate(item.id)}>
                <Icon size={16} /> {item.label}
              </button>
            );
          })}
        </nav>

        <form className="global-search workspace-search" onSubmit={submitSearch}>
          <Search size={17} />
          <input
            value={globalQuery}
            onChange={(e) => setGlobalQuery(e.target.value)}
            onFocus={() => { setCmdOpen(true); setCmdQuery(globalQuery); }}
            placeholder="搜索  ⌘K"
            readOnly
            style={{ cursor: 'pointer' }}
          />
        </form>

        <div className="workspace-actions">
          <button type="button" className="route-menu-button" onClick={() => setMenuOpen((v) => !v)} aria-expanded={menuOpen} aria-label="打开全部页面">
            <Menu size={17} /><span>{title}</span><ChevronDown size={15} />
          </button>

          <div className="study-signal" title={`面试倒计时 ${days} 天，整体掌握度 ${mastery}%`}>
            <CalendarClock size={16} />
            <strong>{days}</strong>
            <span>天</span>
            <i><b style={{ width: `${mastery}%` }} /></i>
          </div>

          {syncStatus && syncStatus !== 'idle' && (
            <div className={`sync-badge sync-${syncStatus}`} title={syncStatus === 'syncing' ? '同步中...' : '同步失败'}>
              {syncStatus === 'syncing' ? '⟳' : '⚠'}
            </div>
          )}

          <label className="target-date compact-target">
            <Target size={15} />
            <input type="date" value={state.targetDate} onChange={(e) => setState((cur) => ({ ...cur, targetDate: e.target.value }))} />
          </label>

          <button className="icon-button" type="button" onClick={() => setState((cur) => ({ ...cur, theme: cur.theme === 'light' ? 'dark' : 'light' }))} aria-label="切换主题">
            {state.theme === 'light' ? <Moon size={18} /> : <Sun size={18} />}
          </button>
        </div>

        {menuOpen && (
          <div className="route-popover" role="menu">
            <div className="route-popover-head">
              <div><strong>{activeGroup.label}</strong><span>选择接下来的学习工作区</span></div>
              <button type="button" className="icon-button" onClick={() => setMenuOpen(false)}><X size={17} /></button>
            </div>
            <div className="route-state-tools">
              <button type="button" className="ghost-btn" onClick={exportLearningState}>导出状态</button>
              <button type="button" className="ghost-btn" onClick={() => fileInputRef.current?.click()}>导入状态</button>
              <button type="button" className="ghost-btn danger" onClick={() => setConfirmPending({ message: '确定要重置本地学习状态吗？当前状态会先备份。', onOk: () => setState((cur) => resetStateWithBackup(cur)) })}>
                备份并重置
              </button>
              <input ref={fileInputRef} className="visually-hidden" type="file" accept="application/json,.json"
                onChange={(e) => { const f = e.target.files?.[0]; if (f) void importLearningState(f); }} />
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
                        <button type="button" key={id} className={route === id ? 'active' : ''} onClick={() => navigate(id)} role="menuitem">
                          <Icon size={16} /><span>{item.label}</span>
                        </button>
                      );
                    })}
                  </div>
                </section>
              ))}
            </div>
          </div>
        )}
      </header>

      {menuOpen && <button className="shell-scrim" type="button" aria-label="关闭菜单" onClick={() => setMenuOpen(false)} />}

      <main className="content workspace-content">{children}</main>

      <nav className="mobile-bottom-nav" aria-label="移动端导航">
        {primaryEntries.map((item) => {
          const Icon = item.icon;
          const isActive = item.id === route || (item.id === 'modules' && ['path', 'graph'].includes(route));
          return (
            <button type="button" key={item.id} className={isActive ? 'active' : ''} onClick={() => navigate(item.id)}>
              <Icon size={18} /><span>{item.label}</span>
            </button>
          );
        })}
        <button type="button" onClick={() => { setCmdOpen(true); setCmdQuery(''); }}>
          <Maximize2 size={18} /><span>更多</span>
        </button>
      </nav>

      {/* Command Palette */}
      {cmdOpen && (
        <div className="cmd-overlay" onClick={() => setCmdOpen(false)}>
          <div className="cmd-panel" onClick={(e) => e.stopPropagation()} role="dialog" aria-label="命令面板">
            <div className="cmd-input-wrap">
              <Search size={18} style={{ color: 'var(--muted)', flexShrink: 0 }} />
              <input
                ref={cmdInputRef}
                autoFocus
                value={cmdQuery}
                onChange={(e) => { setCmdQuery(e.target.value); setCmdCursor(0); }}
                onKeyDown={handleCmdKey}
                placeholder="搜索页面、知识点或操作…"
              />
              <kbd className="cmd-kbd">ESC</kbd>
            </div>
            <div className="cmd-results">
              {cmdItems.length === 0 && (
                <div style={{ padding: '18px 14px', color: 'var(--muted)', fontSize: 13 }}>无匹配结果</div>
              )}
              {Array.from(grouped.entries()).map(([groupLabel, items]) => (
                <div key={groupLabel}>
                  <div className="cmd-section-label">{groupLabel}</div>
                  {items.map((item) => {
                    const idx = globalIndex++;
                    return (
                      <button
                        type="button"
                        key={item.id}
                        className={`cmd-item${cmdCursor === idx ? ' active' : ''}`}
                        onMouseEnter={() => setCmdCursor(idx)}
                        onClick={() => activateCmdItem(item)}
                      >
                        <span>{item.label}</span>
                        {item.type === 'route' && <small>{item.id}</small>}
                      </button>
                    );
                  })}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {confirmPending && (
        <ConfirmDialog
          message={confirmPending.message}
          onOk={() => { confirmPending.onOk(); setConfirmPending(null); }}
          onCancel={() => setConfirmPending(null)}
        />
      )}
    </div>
  );
}
