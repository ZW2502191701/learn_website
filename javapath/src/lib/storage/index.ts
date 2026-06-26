// ── Serialization / normalization / constants ─────────────────────
export {
  STORAGE_VERSION,
  STATE_KEY,
  STATE_BACKUP_KEY,
  makeDefaultState,
  normalizeUserState,
  parsePersistedState,
  serializeState,
  exportState,
  importState
} from './serialization';

// ── Pure mutation helpers ─────────────────────────────────────────
export {
  upsertProgress,
  toggleFavorite,
  toggleWrongQuestion,
  updateNote,
  toggleTodayCheckin,
  updateWrongNote
} from './mutations';

// ── Adapter interface + default local adapter ────────────────────
export type { StorageAdapter } from './adapter';
export { LocalStorageAdapter, localAdapter } from './adapter';

// ── Remote adapter (demo) ────────────────────────────────────────
export { InMemoryRemoteAdapter } from './remoteAdapter';
export type { RemoteAdapterOptions } from './remoteAdapter';

// ── Merge utility ────────────────────────────────────────────────
export { mergeStates } from './merge';

// ── Backward-compatible I/O wrappers ─────────────────────────────
import { localAdapter } from './adapter';
import { makeDefaultState } from './serialization';
import type { UserState } from '../../types';

export const loadState = (): UserState => localAdapter.load();

export const saveState = (state: UserState): boolean => localAdapter.save(state);

export const backupState = (state: UserState): boolean => localAdapter.backup(state);

export const resetStateWithBackup = (state: UserState): UserState => {
  localAdapter.backup(state);
  return makeDefaultState();
};
