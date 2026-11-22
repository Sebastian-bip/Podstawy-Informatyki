export const DONE_TASKS_COOKIE = 'pi_done_tasks';
export const COOKIE_NOTICE_COOKIE = 'pi_cookie_notice';
export const LEGACY_MASTERED_STORAGE_KEY = 'pi_kolokwium_mastered_v1';
const DEFAULT_MAX_AGE_SECONDS = 60 * 60 * 24 * 365; // 365 days

export interface CookieBuildOptions {
  maxAgeSeconds?: number;
  path?: string;
  sameSite?: 'Lax' | 'Strict' | 'None';
  secure?: boolean;
}

export function parseCookies(cookieString: string): Record<string, string> {
  const result: Record<string, string> = {};
  if (!cookieString) return result;

  const parts = cookieString.split(';');
  for (const part of parts) {
    const trimmed = part.trim();
    if (!trimmed) continue;
    const eqIndex = trimmed.indexOf('=');
    if (eqIndex === -1) continue;

    const rawKey = trimmed.slice(0, eqIndex).trim();
    const rawVal = trimmed.slice(eqIndex + 1).trim();
    if (!rawKey) continue;

    try {
      const key = decodeURIComponent(rawKey);
      const val = decodeURIComponent(rawVal);
      result[key] = val;
    } catch {
      result[rawKey] = rawVal;
    }
  }
  return result;
}

export function encodeMasteredTasks(mastered: Record<string, boolean>): string {
  const ids = Object.entries(mastered)
    .filter(([, done]) => Boolean(done))
    .map(([id]) => id.trim())
    .filter((id) => /^[a-zA-Z0-9_-]+$/.test(id));
  return ids.join(',');
}

export function decodeMasteredTasks(rawValue: string | undefined): Record<string, boolean> {
  const out: Record<string, boolean> = {};
  if (!rawValue) return out;

  for (const item of rawValue.split(',')) {
    const id = item.trim();
    if (id && /^[a-zA-Z0-9_-]+$/.test(id)) {
      out[id] = true;
    }
  }
  return out;
}

export function loadMasteredTasksFromCookieString(cookieString: string): {
  found: boolean;
  tasks: Record<string, boolean>;
} {
  const parsed = parseCookies(cookieString);
  if (!(DONE_TASKS_COOKIE in parsed)) {
    return { found: false, tasks: {} };
  }
  return {
    found: true,
    tasks: decodeMasteredTasks(parsed[DONE_TASKS_COOKIE]),
  };
}

export function buildCookieString(
  name: string,
  value: string,
  options: CookieBuildOptions = {}
): string {
  const maxAge = options.maxAgeSeconds ?? DEFAULT_MAX_AGE_SECONDS;
  const path = options.path ?? '/';
  const sameSite = options.sameSite ?? 'Lax';
  const parts = [
    `${encodeURIComponent(name)}=${encodeURIComponent(value)}`,
    `Max-Age=${maxAge}`,
    `Path=${path}`,
    `SameSite=${sameSite}`,
  ];
  if (options.secure) {
    parts.push('Secure');
  }
  return parts.join('; ');
}

function isHttpsBrowser(): boolean {
  return typeof window !== 'undefined' && window.location?.protocol === 'https:';
}

export function readCookie(name: string): string | null {
  if (typeof document === 'undefined') return null;
  const parsed = parseCookies(document.cookie ?? '');
  return name in parsed ? parsed[name] : null;
}

export function writeCookie(
  name: string,
  value: string,
  maxAgeDays = 365
): void {
  if (typeof document === 'undefined') return;
  document.cookie = buildCookieString(name, value, {
    maxAgeSeconds: Math.max(0, Math.round(maxAgeDays * 86400)),
    path: '/',
    sameSite: 'Lax',
    secure: isHttpsBrowser(),
  });
}

export function deleteCookie(name: string): void {
  if (typeof document === 'undefined') return;
  document.cookie = buildCookieString(name, '', {
    maxAgeSeconds: 0,
    path: '/',
    sameSite: 'Lax',
    secure: isHttpsBrowser(),
  });
}

export function loadMasteredTasks(): Record<string, boolean> {
  if (typeof document === 'undefined') return {};

  const fromCookie = loadMasteredTasksFromCookieString(document.cookie ?? '');
  if (fromCookie.found) {
    return fromCookie.tasks;
  }

  // One-time migration from legacy localStorage if cookie is not set yet
  try {
    const legacyRaw = localStorage.getItem(LEGACY_MASTERED_STORAGE_KEY);
    if (legacyRaw) {
      const parsed = JSON.parse(legacyRaw) as Record<string, unknown>;
      const migrated: Record<string, boolean> = {};
      for (const [k, v] of Object.entries(parsed)) {
        if (v === true && /^[a-zA-Z0-9_-]+$/.test(k)) {
          migrated[k] = true;
        }
      }
      if (Object.keys(migrated).length > 0) {
        saveMasteredTasks(migrated);
      }
      return migrated;
    }
  } catch {
    // ignore storage errors
  }

  return {};
}

export function saveMasteredTasks(mastered: Record<string, boolean>): void {
  const encoded = encodeMasteredTasks(mastered);
  writeCookie(DONE_TASKS_COOKIE, encoded, 365);
}

export function clearMasteredTasksCookie(): void {
  deleteCookie(DONE_TASKS_COOKIE);
  try {
    localStorage.removeItem(LEGACY_MASTERED_STORAGE_KEY);
  } catch {
    // ignore storage errors
  }
}

export function hasAcceptedCookieNotice(): boolean {
  return readCookie(COOKIE_NOTICE_COOKIE) === '1';
}

export function acceptCookieNotice(): void {
  writeCookie(COOKIE_NOTICE_COOKIE, '1', 365);
}
