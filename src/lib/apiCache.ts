type CacheEntry<T> = { at: number; value: T };

const store = new Map<string, CacheEntry<unknown>>();

/** 簡易記憶體快取，減少重複讀檔 / Drive 掃描 */
export function getCached<T>(key: string, ttlMs: number): T | null {
  const hit = store.get(key);
  if (!hit) return null;
  if (Date.now() - hit.at > ttlMs) {
    store.delete(key);
    return null;
  }
  return hit.value as T;
}

export function setCached<T>(key: string, value: T) {
  store.set(key, { at: Date.now(), value });
}

export function clearCached(key: string) {
  store.delete(key);
}

export function clearAllCached() {
  const n = store.size;
  store.clear();
  return n;
}
