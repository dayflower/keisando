const RECORD_DATE_FORMATTER = new Intl.DateTimeFormat(undefined, {
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
  hour: "2-digit",
  minute: "2-digit",
  hour12: false,
});

export const formatElapsedTime = (elapsedMs: number): string => {
  const centiseconds = Math.floor(elapsedMs / 10) % 100;
  const seconds = Math.floor(elapsedMs / 1000) % 60;
  const minutes = Math.floor(elapsedMs / 60000);

  return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}.${String(centiseconds).padStart(2, "0")}`;
};

export const formatRecordedAt = (recordedAt: number): string =>
  RECORD_DATE_FORMATTER.format(recordedAt);

export const formatRate = (numerator: number, denominator: number): string => {
  if (denominator <= 0) return "0.0%";
  return `${((numerator / denominator) * 100).toFixed(1)}%`;
};

export const formatAverageScore = (
  totalScore: number,
  count: number,
): string => {
  if (count <= 0) return "0";
  return String(Math.round(totalScore / count));
};
