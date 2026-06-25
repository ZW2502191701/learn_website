import type { RouteId } from '../types';

export interface HashState {
  route: RouteId;
  query: string;
}

const DEFAULT_STATE: HashState = { route: 'dashboard', query: '' };

export function parseHash(hash: string, validRoutes: readonly RouteId[]): HashState {
  const raw = hash.replace(/^#\/?/, '');
  if (!raw) return DEFAULT_STATE;

  const qIndex = raw.indexOf('?');
  const path = qIndex >= 0 ? raw.slice(0, qIndex) : raw;
  const search = qIndex >= 0 ? raw.slice(qIndex + 1) : '';

  const route = path as RouteId;
  const query = new URLSearchParams(search).get('q') ?? '';

  if (!validRoutes.includes(route)) return DEFAULT_STATE;
  return { route, query };
}

export function toHash(route: RouteId, query?: string): string {
  const params = new URLSearchParams();
  if (query) params.set('q', query);
  const search = params.toString();
  return `#/${route}${search ? `?${search}` : ''}`;
}
