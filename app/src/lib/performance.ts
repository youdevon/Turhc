const SLOW_MS = 500;

/** Log slow server work in development only. */
export async function timed<T>(label: string, fn: () => Promise<T>): Promise<T> {
  const start = performance.now();
  try {
    return await fn();
  } finally {
    if (process.env.NODE_ENV === "development") {
      const ms = performance.now() - start;
      if (ms >= SLOW_MS) {
        console.warn(`[perf] ${label} took ${ms.toFixed(0)}ms`);
      }
    }
  }
}

export function timedSync<T>(label: string, fn: () => T): T {
  const start = performance.now();
  try {
    return fn();
  } finally {
    if (process.env.NODE_ENV === "development") {
      const ms = performance.now() - start;
      if (ms >= SLOW_MS) {
        console.warn(`[perf] ${label} took ${ms.toFixed(0)}ms`);
      }
    }
  }
}
