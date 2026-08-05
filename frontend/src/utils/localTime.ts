/** Browser-local time helpers — match Sys Time language across the UI. */

function toDate(input: string | Date): Date {
  return input instanceof Date ? input : new Date(input);
}

export function getLocalUtcOffsetLabel(date: Date = new Date()): string {
  const offsetNum = -date.getTimezoneOffset() / 60;
  return `UTC${offsetNum >= 0 ? '+' : ''}${offsetNum}`;
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
  options: { includeSeconds?: boolean } = {}
): string {
  const { includeSeconds = false } = options;
  return toDate(input).toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit',
    ...(includeSeconds ? { second: '2-digit' as const } : {}),
    hour12: false,
  });
}

export function formatLocalDateTime(
  input: string | Date,
  options: { includeYear?: boolean; includeSeconds?: boolean } = {}
): { date: string; time: string; label: string } {
  const date = formatLocalDate(input, { includeYear: options.includeYear });
  const time = formatLocalTime(input, { includeSeconds: options.includeSeconds });
  return { date, time, label: `${date} · ${time}` };
}
