import type { UserState } from '../../types';
import type { StorageAdapter } from './adapter';
import { serializeState, parsePersistedState, makeDefaultState } from './serialization';
import { mergeStates } from './merge';

export interface RemoteAdapterOptions {
  latencyMs?: number;
  conflictRate?: number;
  errorRate?: number;
}

export class InMemoryRemoteAdapter implements StorageAdapter {
  private data: string;
  private version: number;
  private readonly latencyMs: number;
  private readonly conflictRate: number;
  private readonly errorRate: number;

  constructor(initial?: UserState, options?: RemoteAdapterOptions) {
    this.data = serializeState(initial ?? makeDefaultState());
    this.version = 1;
    this.latencyMs = options?.latencyMs ?? 800;
    this.conflictRate = options?.conflictRate ?? 0.3;
    this.errorRate = options?.errorRate ?? 0;
  }

  load(): UserState {
    return parsePersistedState(this.data);
  }

  save(state: UserState): boolean {
    this.data = serializeState(state);
    this.version++;
    return true;
  }

  backup(): boolean {
    return true;
  }

  async pull(local: UserState): Promise<{ state: UserState; conflicted: boolean }> {
    await this.simulateNetwork();

    const remote = parsePersistedState(this.data);
    const shouldConflict = Math.random() < this.conflictRate;

    if (shouldConflict && this.hasDifference(local, remote)) {
      const merged = mergeStates(local, remote);
      return { state: merged, conflicted: true };
    }
    return { state: remote, conflicted: false };
  }

  async push(local: UserState): Promise<{ state: UserState; conflicted: boolean }> {
    await this.simulateNetwork();

    const remote = parsePersistedState(this.data);
    const shouldConflict = Math.random() < this.conflictRate;

    if (shouldConflict && this.hasDifference(local, remote)) {
      const merged = mergeStates(local, remote);
      this.data = serializeState(merged);
      this.version++;
      return { state: merged, conflicted: true };
    }

    this.data = serializeState(local);
    this.version++;
    return { state: local, conflicted: false };
  }

  getVersion(): number {
    return this.version;
  }

  private async simulateNetwork(): Promise<void> {
    if (Math.random() < this.errorRate) {
      throw new Error('Simulated network error');
    }
    const jitter = this.latencyMs * (0.5 + Math.random());
    await new Promise((resolve) => setTimeout(resolve, jitter));
  }

  private hasDifference(a: UserState, b: UserState): boolean {
    return serializeState(a) !== serializeState(b);
  }
}
