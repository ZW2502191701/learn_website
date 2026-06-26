import type { UserState } from '../../types';
import { serializeState, parsePersistedState, makeDefaultState, STATE_KEY, STATE_BACKUP_KEY, exportState } from './serialization';

export interface StorageAdapter {
  load(): UserState;
  save(state: UserState): boolean;
  backup(state: UserState): boolean;
}

export class LocalStorageAdapter implements StorageAdapter {
  constructor(
    private readonly key: string = STATE_KEY,
    private readonly backupKey: string = STATE_BACKUP_KEY
  ) {}

  load(): UserState {
    try {
      const raw = localStorage.getItem(this.key);
      if (!raw) return makeDefaultState();
      return parsePersistedState(raw);
    } catch {
      return makeDefaultState();
    }
  }

  save(state: UserState): boolean {
    try {
      localStorage.setItem(this.key, serializeState(state));
      return true;
    } catch {
      this.backup(state);
      return false;
    }
  }

  backup(state: UserState): boolean {
    try {
      localStorage.setItem(this.backupKey, exportState(state));
      return true;
    } catch {
      return false;
    }
  }
}

export const localAdapter = new LocalStorageAdapter();
