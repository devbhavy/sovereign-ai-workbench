/**
 * The backend serialises naive `datetime.utcnow()` values, so FastAPI emits
 * them without a timezone suffix (e.g. "2026-09-07T09:19:00"). Left alone, the
 * browser reads those as local time and every timestamp is off by the UTC
 * offset — so append "Z" when no zone is present.
 */
export function parseUtc(value: string): Date {
  const hasZone = /(?:Z|[+-]\d{2}:?\d{2})$/.test(value);
  return new Date(hasZone ? value : `${value}Z`);
}

export function relativeTime(value: string): string {
  const then = parseUtc(value).getTime();
  if (Number.isNaN(then)) return "";

  const seconds = Math.round((Date.now() - then) / 1000);
  if (seconds < 45) return "just now";

  const thresholds: [Intl.RelativeTimeFormatUnit, number][] = [
    ["year", 31536000],
    ["month", 2592000],
    ["week", 604800],
    ["day", 86400],
    ["hour", 3600],
    ["minute", 60],
  ];

  const formatter = new Intl.RelativeTimeFormat(undefined, { numeric: "auto" });
  for (const [unit, size] of thresholds) {
    if (seconds >= size) {
      return formatter.format(-Math.round(seconds / size), unit);
    }
  }
  return formatter.format(-Math.round(seconds / 60), "minute");
}

export function clockTime(value: string): string {
  const date = parseUtc(value);
  if (Number.isNaN(date.getTime())) return "";
  return date.toLocaleTimeString(undefined, {
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function formatBytes(bytes: number | null | undefined): string {
  if (bytes == null) return "";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

/** mm:ss elapsed clock for a blocking agent run. */
export function formatElapsed(ms: number): string {
  const total = Math.floor(ms / 1000);
  const minutes = Math.floor(total / 60);
  const seconds = total % 60;
  return `${minutes}:${String(seconds).padStart(2, "0")}`;
}
