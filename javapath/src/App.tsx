import { useEffect, useMemo, useState } from 'react';
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
import { DashboardRoute } from './routes/DashboardRoute';
import { LearningPathRoute } from './routes/LearningPathRoute';
import { ModulesRoute } from './routes/ModulesRoute';
import { KnowledgeGraphRoute } from './routes/KnowledgeGraphRoute';
import { InterviewRoute } from './routes/InterviewRoute';
import { ScenariosRoute } from './routes/ScenariosRoute';
import { PlanRoute } from './routes/PlanRoute';
import { ReviewRoute } from './routes/ReviewRoute';
import { SearchRoute } from './routes/SearchRoute';
import { loadState, saveState } from './lib/storage';
import type { UserState } from './types';

export type RouteId =
  | 'dashboard'
  | 'path'
  | 'modules'
  | 'graph'
  | 'interview'
  | 'scenarios'
  | 'plan'
  | 'review'
  | 'search';

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

export interface RouteProps {
  state: UserState;
  setState: React.Dispatch<React.SetStateAction<UserState>>;
  goTo: (route: RouteId, query?: string) => void;
  globalQuery: string;
}

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

export default function App() {
  const [route, setRoute] = useState<RouteId>('dashboard');
  const [globalQuery, setGlobalQuery] = useState('');
  const [state, setState] = useState<UserState>(() => loadState());

  useEffect(() => {
    saveState(state);
    document.documentElement.dataset.theme = state.theme;
  }, [state]);

  const goTo = (nextRoute: RouteId, query?: string) => {
    setRoute(nextRoute);
    if (query !== undefined) setGlobalQuery(query);
  };

  const routeProps = useMemo<RouteProps>(
    () => ({ state, setState, goTo, globalQuery }),
    [state, globalQuery]
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
    >
      {content}
    </AppShell>
  );
}
