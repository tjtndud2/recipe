// localStorage / sessionStorage 의 SSR 안전 래퍼.
// 서버 렌더링 중에는 전부 no-op 이므로 컴포넌트 어디서 불러도 오류가 나지 않는다.
// (실제 호출은 useEffect 안에서만 한다.)

const hasWindow = () => typeof window !== "undefined";

export function readJSON<T>(key: string, fallback: T): T {
  if (!hasWindow()) return fallback;
  try {
    const raw = window.localStorage.getItem(key);
    if (raw === null) return fallback;
    const parsed = JSON.parse(raw);
    return (parsed ?? fallback) as T;
  } catch {
    return fallback;
  }
}

export function writeJSON(key: string, value: unknown): void {
  if (!hasWindow()) return;
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
  } catch {
    /* 용량 초과 / 프라이빗 모드 등은 무시 */
  }
}

export function readNumber(key: string, fallback: number): number {
  if (!hasWindow()) return fallback;
  try {
    const raw = window.localStorage.getItem(key);
    if (raw === null) return fallback;
    const n = parseFloat(raw);
    return Number.isFinite(n) ? n : fallback;
  } catch {
    return fallback;
  }
}

export function writeNumber(key: string, value: number): void {
  if (!hasWindow()) return;
  try {
    window.localStorage.setItem(key, String(value));
  } catch {
    /* 무시 */
  }
}

export function readFlag(key: string): boolean {
  if (!hasWindow()) return false;
  try {
    return window.localStorage.getItem(key) === "1";
  } catch {
    return false;
  }
}

export function writeFlag(key: string, on: boolean): void {
  if (!hasWindow()) return;
  try {
    if (on) window.localStorage.setItem(key, "1");
    else window.localStorage.removeItem(key);
  } catch {
    /* 무시 */
  }
}

export function hasKey(key: string): boolean {
  if (!hasWindow()) return false;
  try {
    return window.localStorage.getItem(key) !== null;
  } catch {
    return false;
  }
}

/** 거실 ↔ 냉장고 이동 시 캐릭터 위치를 넘기는 세션 플래그 */
export function takeSessionFlag(key: string): boolean {
  if (!hasWindow()) return false;
  try {
    const on = window.sessionStorage.getItem(key) !== null;
    if (on) window.sessionStorage.removeItem(key);
    return on;
  } catch {
    return false;
  }
}

export function setSessionFlag(key: string): void {
  if (!hasWindow()) return;
  try {
    window.sessionStorage.setItem(key, "1");
  } catch {
    /* 무시 */
  }
}
