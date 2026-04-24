import type { Locale } from "./i18n";

const recordDateFormatterByLocale: Record<Locale, Intl.DateTimeFormat> = {
  en: new Intl.DateTimeFormat("en", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }),
  ja: new Intl.DateTimeFormat("ja", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }),
};

export const formatElapsedTime = (elapsedMs: number): string => {
  const centiseconds = Math.floor(elapsedMs / 10) % 100;
  const seconds = Math.floor(elapsedMs / 1000) % 60;
  const minutes = Math.floor(elapsedMs / 60000);

  return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}.${String(centiseconds).padStart(2, "0")}`;
};

export const formatRecordedAt = (recordedAt: number, locale: Locale): string =>
  recordDateFormatterByLocale[locale].format(recordedAt);

export const isSameLocalDate = (
  timestamp: number,
  referenceTimestamp: number,
): boolean => {
  const date = new Date(timestamp);
  const referenceDate = new Date(referenceTimestamp);

  return (
    date.getFullYear() === referenceDate.getFullYear() &&
    date.getMonth() === referenceDate.getMonth() &&
    date.getDate() === referenceDate.getDate()
  );
};

export const isRecordedAtToday = (
  recordedAt: number,
  now: number = Date.now(),
): boolean => isSameLocalDate(recordedAt, now);

export const formatRate = (numerator: number, denominator: number): string => {
  if (denominator <= 0) return "0.0%";
  return `${((numerator / denominator) * 100).toFixed(1)}%`;
};
