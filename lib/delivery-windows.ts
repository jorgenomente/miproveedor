const WEEK_MINUTES = 7 * 24 * 60;

export const WEEKDAYS = ["Domingo", "Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado"] as const;

export type DeliveryRule = {
  id?: string;
  cutoffWeekday: number; // 0 (domingo) - 6 (sábado)
  cutoffTimeMinutes: number; // 0-1439
  deliveryWeekday: number; // 0-6
  deliveryTimeMinutes?: number; // opcional, por si queremos mostrar hora estimada de entrega
};

export type DeliveryWindowComputation = {
  rule: DeliveryRule;
  cutoffMinute: number;
  windowStartMinute: number;
  windowEndMinute: number;
};

export function timeStringToMinutes(value: string): number | null {
  const match = /^(\d{1,2}):(\d{2})$/.exec(value.trim());
  if (!match) return null;
  const hours = Number(match[1]);
  const minutes = Number(match[2]);
  if (Number.isNaN(hours) || Number.isNaN(minutes)) return null;
  if (hours < 0 || hours > 23 || minutes < 0 || minutes > 59) return null;
  return hours * 60 + minutes;
}

export function minutesToTimeString(minutes: number): string {
  const normalized = Math.max(0, Math.min(1439, Math.round(minutes)));
  const hours = Math.floor(normalized / 60);
  const mins = normalized % 60;
  return `${hours.toString().padStart(2, "0")}:${mins.toString().padStart(2, "0")}`;
}

export function minuteOfWeek(date: Date): number {
  return date.getDay() * 1440 + date.getHours() * 60 + date.getMinutes();
}

export function nextOccurrence(base: Date, weekday: number, minutes: number): Date {
  const baseMinute = minuteOfWeek(base);
  const targetMinute = weekday * 1440 + minutes;
  let delta = targetMinute - baseMinute;
  if (delta < 0) delta += WEEK_MINUTES;
  const result = new Date(base);
  result.setSeconds(0, 0);
  result.setMinutes(result.getMinutes() + delta);
  return result;
}

function previousOccurrence(base: Date, weekday: number, minutes: number): Date {
  const baseMinute = minuteOfWeek(base);
  const targetMinute = weekday * 1440 + minutes;
  let delta = targetMinute - baseMinute;
  if (delta > 0) delta -= WEEK_MINUTES;
  const result = new Date(base);
  result.setSeconds(0, 0);
  result.setMinutes(result.getMinutes() + delta);
  return result;
}

export function sortRules(rules: DeliveryRule[]): DeliveryWindowComputation[] {
  return [...rules]
    .map((rule) => ({
      rule,
      cutoffMinute: rule.cutoffWeekday * 1440 + rule.cutoffTimeMinutes,
      windowStartMinute: 0,
      windowEndMinute: 0,
    }))
    .sort((a, b) => a.cutoffMinute - b.cutoffMinute)
    .map((entry, index, arr) => {
      const prev = arr[(index - 1 + arr.length) % arr.length];
      const start = prev.cutoffMinute;
      const end = entry.cutoffMinute <= start ? entry.cutoffMinute + WEEK_MINUTES : entry.cutoffMinute;
      return {
        ...entry,
        windowStartMinute: start,
        windowEndMinute: end,
      };
    });
}

export function pickNextDelivery(rules: DeliveryRule[], baseDate = new Date()) {
  if (!rules.length) return null;
  const sorted = sortRules(rules);
  const nowMinute = minuteOfWeek(baseDate);
  const target =
    sorted.find((entry) => nowMinute <= entry.cutoffMinute) ??
    sorted[0];
  const targetIndex = sorted.findIndex((entry) => entry === target);
  const prev = sorted[(targetIndex - 1 + sorted.length) % sorted.length];

  const cutoffDate = nextOccurrence(baseDate, target.rule.cutoffWeekday, target.rule.cutoffTimeMinutes);
  const deliveryDate = nextOccurrence(
    cutoffDate,
    target.rule.deliveryWeekday,
    target.rule.deliveryTimeMinutes ?? 10 * 60,
  );

  const windowStartDate = previousOccurrence(cutoffDate, prev.rule.cutoffWeekday, prev.rule.cutoffTimeMinutes);

  return {
    rule: target.rule,
    cutoffDate,
    deliveryDate,
    windowStartDate,
    windowEndDate: cutoffDate,
    targetIndex,
    totalRules: sorted.length,
  };
}

export function describeWindow(startMinute: number, endMinute: number) {
  const startDay = Math.floor(startMinute / 1440) % 7;
  const endDay = Math.floor((endMinute % WEEK_MINUTES) / 1440);
  return {
    startDay,
    startTime: minutesToTimeString(startMinute % 1440),
    endDay,
    endTime: minutesToTimeString(endMinute % 1440),
  };
}
