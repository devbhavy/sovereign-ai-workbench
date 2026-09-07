"use client";

/**
 * Browser-local metadata the backend cannot supply.
 *
 * - Conversation titles: nothing ever renames a Conversation row, so every
 *   title in the database is literally "New Conversation", and
 *   GET /api/conversations returns no messages to derive a label from.
 * - Attachment filenames: GET /api/conversations/{id} returns bare `file_ids`
 *   and there is no endpoint that resolves an id back to a filename.
 *
 * Exposed as a `useSyncExternalStore` source rather than read through an
 * effect, so components stay in sync with writes (and with other tabs) without
 * a render-then-setState round trip. Both caches are per-browser and are lost
 * if site data is cleared; every reader falls back to something truthful when
 * a key is missing.
 */

const TITLE_KEY = "saw:titles";
const FILENAME_KEY = "saw:filenames";

type Dict = Record<string, string>;

/** Stable identity for the server render and for empty reads. */
const EMPTY: Dict = Object.freeze({});

let titlesCache: Dict | null = null;
let filenamesCache: Dict | null = null;

const listeners = new Set<() => void>();

function read(key: string): Dict {
  if (typeof window === "undefined") return EMPTY;
  try {
    const raw = window.localStorage.getItem(key);
    const parsed = raw ? JSON.parse(raw) : {};
    return parsed && typeof parsed === "object" ? (parsed as Dict) : {};
  } catch {
    return EMPTY;
  }
}

function write(key: string, value: Dict) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // Quota, or a privacy mode that blocks storage — labels fall back instead.
  }
}

function invalidate() {
  titlesCache = null;
  filenamesCache = null;
  for (const listener of listeners) listener();
}

/* ---------------- store plumbing ---------------- */

export function subscribeLocalStore(listener: () => void) {
  listeners.add(listener);

  // Keep a second tab's writes visible here too.
  const onStorage = (event: StorageEvent) => {
    if (event.key === TITLE_KEY || event.key === FILENAME_KEY) invalidate();
  };
  window.addEventListener("storage", onStorage);

  return () => {
    listeners.delete(listener);
    window.removeEventListener("storage", onStorage);
  };
}

/** Server snapshot: localStorage does not exist during SSR. */
export function getEmptySnapshot(): Dict {
  return EMPTY;
}

/* ---------------- conversation titles ---------------- */

/** Condense the first user message into something that fits a sidebar row. */
export function deriveTitle(content: string): string {
  const flat = content.replace(/\s+/g, " ").trim();
  if (!flat) return "";
  return flat.length > 60 ? `${flat.slice(0, 60)}…` : flat;
}

export function getTitlesSnapshot(): Dict {
  titlesCache ??= read(TITLE_KEY);
  return titlesCache;
}

/** First write wins, so the label stays the opening message of the thread. */
export function rememberTitle(conversationId: string, content: string) {
  const title = deriveTitle(content);
  if (!title) return;

  const all = { ...read(TITLE_KEY) };
  if (all[conversationId]) return;

  all[conversationId] = title;
  write(TITLE_KEY, all);
  invalidate();
}

/* ---------------- attachment filenames ---------------- */

export function getFilenamesSnapshot(): Dict {
  filenamesCache ??= read(FILENAME_KEY);
  return filenamesCache;
}

export function rememberFilename(fileId: string, filename: string) {
  const all = { ...read(FILENAME_KEY), [fileId]: filename };
  write(FILENAME_KEY, all);
  invalidate();
}
