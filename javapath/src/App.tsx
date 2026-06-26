import { Suspense, lazy, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  BarChart3,
  BookMarked,
  Boxes,
  Brain,
  CalendarDays,
  GitBranch,
  LayoutDashboard,
  Search,
  ShieldQuestion,
  Sparkles
} from 'lucide-react';
import { AppShell } from './components/AppShell';
import { ErrorBoundary } from './components/ErrorBoundary';
import { parseHash, toHash } from './lib/hashRouter';
import { loadState } from './lib/storage';
import { useStorageSync } from './hooks/useStorageSync';
import type { RouteId, RouteProps, UserState } from './types';

// 路由懒加载
const DashboardRoute = lazy(() => import('./routes/DashboardRoute').then((m) => ({ default: m.DashboardRoute })));
const LearningPathRoute = lazy(() => import('./routes/LearningPathRoute').then((m) => ({ default: m.LearningPathRoute })));
const ModulesRoute = lazy(() => import('./routes/ModulesRoute').then((m) => ({ default: m.ModulesRoute })));
const KnowledgeGraphRoute = lazy(() => import('./routes/KnowledgeGraphRoute').then((m) => ({ default: m.KnowledgeGraphRoute })));
const InterviewRoute = lazy(() => import('./routes/InterviewRoute').then((m) => ({ default: m.InterviewRoute })));
const ScenariosRoute = lazy(() => import('./routes/ScenariosRoute').then((m) => ({ default: m.ScenariosRoute })));
const PlanRoute = lazy(() => import('./routes/PlanRoute').then((m) => ({ default: m.PlanRoute })));
const ReviewRoute = lazy(() => import('./routes/ReviewRoute').then((m) => ({ default: m.ReviewRoute })));
const SearchRoute = lazy(() => import('./routes/SearchRoute').then((m) => ({ default: m.SearchRoute })));

export const routes = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { id: 'path', label: '学习路径', icon: GitBranch },
  { id: 'modules', label: '知识模块', icon: Boxes },
  { id: 'graph', label: '知识图谱', icon: Brain },
  { id: 'interview', label: '面试训练', icon: ShieldQuestion },
  { id: 'scenarios', label: '场景实战', icon: BarChart3 },
  { id: 'plan', label: '复习计划', icon: CalendarDays },
  { id: 'review', label: '错题与收藏', icon: BookMarked },
  { id: 'search', label: '全文搜索', icon: Search }
] satisfies Array<{ id: RouteId; label: string; icon: typeof Sparkles }>;

const VALID_ROUTES = routes.map((item) => item.id) as RouteId[];

const routeTitles: Record<RouteId, string> = {
  dashboard: 'Dashboard',
  path: '学习路径',
  modules: '知识模块',
  graph: '知识图谱',
  interview: '面试训练',
  scenarios: '场景实战',
  plan: '复习计划',
  review: '错题与收藏',
  search: '全文搜索'
};

function RouteLoading() {
  return (
    <div style={{ display: 'grid', placeItems: 'center', minHeight: '40vh', color: 'var(--muted)' }}>
      <span>加载中…</span>
    </div>
  );
}

export default function App() {
  const initialHash = parseHash(location.hash, VALID_ROUTES);
  const [route, setRoute] = useState<RouteId>(initialHash.route);
  const [globalQuery, setGlobalQuery] = useState(initialHash.query);
  const [state, setState] = useState<UserState>(() => loadState());

  // 同步 hook：本地持久化 + 远程适配器
  const { syncStatus } = useStorageSync(state, setState);

  // 防止 goTo 推入的 hash 被 popstate 监听器重复处理
  const skipSyncRef = useRef(false);

  // 浏览器前进/后退：从 URL hash 恢复路由状态
  useEffect(() => {
    const handlePopstate = () => {
      const parsed = parseHash(location.hash, VALID_ROUTES);
      skipSyncRef.current = true;
      setRoute(parsed.route);
      setGlobalQuery(parsed.query);
    };
    window.addEventListener('popstate', handlePopstate);
    return () => window.removeEventListener('popstate', handlePopstate);
  }, []);

  // 主题同步
  useEffect(() => {
    document.documentElement.dataset.theme = state.theme;
  }, [state.theme]);

  // 路由变化：同步 URL hash 和页面标题
  const firstRenderRef = useRef(true);
  useEffect(() => {
    if (skipSyncRef.current) {
      skipSyncRef.current = false;
    } else if (firstRenderRef.current) {
      history.replaceState(null, '', toHash(route, globalQuery || undefined));
    } else {
      history.pushState(null, '', toHash(route, globalQuery || undefined));
    }
    firstRenderRef.current = false;
    document.title = `${routeTitles[route]} | JavaPath`;
  }, [route, globalQuery]);

  const goTo = useCallback((nextRoute: RouteId, query?: string) => {
    setRoute(nextRoute);
    if (query !== undefined) setGlobalQuery(query);
  }, []);

  const routeProps = useMemo<RouteProps>(
    () => ({ state, setState, goTo, globalQuery }),
    [state, globalQuery, goTo]
  );

  const content = {
    dashboard: <DashboardRoute {...routeProps} />,
    path: <LearningPathRoute {...routeProps} />,
    modules: <ModulesRoute {...routeProps} />,
    graph: <KnowledgeGraphRoute {...routeProps} />,
    interview: <InterviewRoute {...routeProps} />,
    scenarios: <ScenariosRoute {...routeProps} />,
    plan: <PlanRoute {...routeProps} />,
    review: <ReviewRoute {...routeProps} />,
    search: <SearchRoute {...routeProps} />
  }[route];

  return (
    <AppShell
      route={route}
      routes={routes}
      title={routeTitles[route]}
      state={state}
      setState={setState}
      globalQuery={globalQuery}
      setGlobalQuery={setGlobalQuery}
      goTo={goTo}
      syncStatus={syncStatus}
    >
      <ErrorBoundary key={route}>
        <Suspense fallback={<RouteLoading />}>
          {content}
        </Suspense>
      </ErrorBoundary>
    </AppShell>
  );
}
