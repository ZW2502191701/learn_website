import { useCallback, useEffect, useRef, useState } from 'react';
import type { UserState } from '../types';
import type { StorageAdapter } from '../lib/storage/adapter';
import { InMemoryRemoteAdapter } from '../lib/storage/remoteAdapter';
import { localAdapter } from '../lib/storage/adapter';
import { mergeStates } from '../lib/storage/merge';

export type SyncStatus = 'idle' | 'syncing' | 'error';

export interface UseStorageSyncReturn {
  syncStatus: SyncStatus;
  forceSync: () => Promise<void>;
}

export interface UseStorageSyncOptions {
  local?: StorageAdapter;
  remote?: InMemoryRemoteAdapter;
  debounceMs?: number;
}

export function useStorageSync(
  state: UserState,
  setState: React.Dispatch<React.SetStateAction<UserState>>,
  options?: UseStorageSyncOptions
): UseStorageSyncReturn {
  const local = options?.local ?? localAdapter;
  const remote = options?.remote ?? useRef(new InMemoryRemoteAdapter()).current;
  const debounceMs = options?.debounceMs ?? 1500;

  const [syncStatus, setSyncStatus] = useState<SyncStatus>('idle');
  const pushTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isInitialMountRef = useRef(true);
  const skipPushRef = useRef(false);
  const stateRef = useRef(state);
  stateRef.current = state;

  // On mount: load local, then pull remote and merge
  useEffect(() => {
    const localState = local.load();
    setState(localState);

    (async () => {
      try {
        setSyncStatus('syncing');
        const { state: remoteState } = await remote.pull(localState);
        const merged = mergeStates(localState, remoteState);
        skipPushRef.current = true;
        setState(merged);
        local.save(merged);
        setSyncStatus('idle');
      } catch {
        setSyncStatus('error');
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Debounced push on state change
  useEffect(() => {
    if (isInitialMountRef.current) {
      isInitialMountRef.current = false;
      return;
    }

    if (skipPushRef.current) {
      skipPushRef.current = false;
      return;
    }

    if (pushTimerRef.current) clearTimeout(pushTimerRef.current);

    pushTimerRef.current = setTimeout(async () => {
      try {
        setSyncStatus('syncing');
        const { state: merged } = await remote.push(stateRef.current);
        if (merged !== stateRef.current) {
          skipPushRef.current = true;
          setState(merged);
          local.save(merged);
        } else {
          local.save(stateRef.current);
        }
        setSyncStatus('idle');
      } catch {
        setSyncStatus('error');
        local.save(stateRef.current);
      }
    }, debounceMs);

    return () => {
      if (pushTimerRef.current) clearTimeout(pushTimerRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state]);

  const forceSync = useCallback(async () => {
    try {
      setSyncStatus('syncing');
      const { state: remoteState } = await remote.pull(stateRef.current);
      const merged = mergeStates(stateRef.current, remoteState);
      skipPushRef.current = true;
      setState(merged);
      local.save(merged);
      setSyncStatus('idle');
    } catch {
      setSyncStatus('error');
    }
  }, [remote, local, setState]);

  return { syncStatus, forceSync };
}
