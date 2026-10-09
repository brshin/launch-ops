/** Browser-local time helpers — match Sys Time language across the UI. */

function toDate(input: string | Date): Date {
  return input instanceof Date ? input : new Date(input);
}

export function getLocalUtcOffsetLabel(date: Date = new Date()): string {
  const minutes = -date.getTimezoneOffset();
  const sign = minutes >= 0 ? "+" : "-";
  const abs = Math.abs(minutes);
  const hours = Math.floor(abs / 60);
  const mins = abs % 60;
  return mins === 0
    ? `UTC${sign}${hours}`
    : `UTC${sign}${hours}:${String(mins).padStart(2, "0")}`;
}

/**
 * The zone people share, not the timezone database's reference city.
 * San Jose and Los Angeles are both Pacific. Singapore is Singapore.
 */
export function getLocalZoneName(date: Date = new Date(), timeZone?: string): string {
  const raw =
    new Intl.DateTimeFormat("en", {
      timeZone,
      timeZoneName: "longGeneric",
    })
      .formatToParts(date)
      .find((part) => part.type === "timeZoneName")?.value ?? "";

  const name = raw
    .replace(/\s+Standard Time$/, "")
    .replace(/\s+Daylight Time$/, "")
    .replace(/\s+Summer Time$/, "")
    .replace(/\s+Time$/, "")
    .trim();

  return name || "Local";
}

export function formatLocalDate(
  input: string | Date,
  options: { includeYear?: boolean } = {}
): string {
  const { includeYear = true } = options;
  return toDate(input)
    .toLocaleDateString('en-GB', {
      day: '2-digit',
      month: 'short',
      ...(includeYear ? { year: 'numeric' as const } : {}),
    })
    .toUpperCase();
}

export function formatLocalTime(
  input: string | Date,
  options: { includeSeconds?: boolean; hour12?: boolean } = {}
): string {
  const { includeSeconds = false, hour12 = false } = options;
  const formatted = toDate(input).toLocaleTimeString(hour12 ? "en-US" : [], {
    hour: hour12 ? "numeric" : "2-digit",
    minute: "2-digit",
    ...(includeSeconds ? { second: "2-digit" as const } : {}),
    hour12,
  });
  // en-US puts a narrow no-break space before AM/PM. A normal space measures more predictably.
  return hour12 ? formatted.replace(/\u202f/g, " ") : formatted;
}

export function formatLocalDateTime(
  input: string | Date,
  options: { includeYear?: boolean; includeSeconds?: boolean; hour12?: boolean } = {}
): { date: string; time: string; label: string } {
  const date = formatLocalDate(input, { includeYear: options.includeYear });
  const time = formatLocalTime(input, {
    includeSeconds: options.includeSeconds,
    hour12: options.hour12,
  });
  return { date, time, label: `${date} · ${time}` };
}
