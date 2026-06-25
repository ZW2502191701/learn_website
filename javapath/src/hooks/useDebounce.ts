import { useCallback, useRef } from 'react';

/**
 * 返回一个防抖函数，在 delay 毫秒内无新调用后才执行。
 * 组件卸载时自动取消。
 */
export function useDebounce<T extends (...args: Parameters<T>) => void>(fn: T, delay: number): T {
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  return useCallback(
    (...args: Parameters<T>) => {
      if (timerRef.current) clearTimeout(timerRef.current);
      timerRef.current = setTimeout(() => fn(...args), delay);
    },
    [fn, delay]
  ) as T;
}
