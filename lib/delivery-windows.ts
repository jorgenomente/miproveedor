const WEEK_MINUTES = 7 * 24 * 60;
const DEFAULT_TIME_ZONE = "America/Argentina/Buenos_Aires";

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

function parseOffsetMinutes(offsetText: string): number | null {
  const match = /GMT([+-])(\d{1,2})(?::(\d{2}))?/.exec(offsetText);
  if (!match) return null;
  const sign = match[1] === "-" ? -1 : 1;
  const hours = Number(match[2]);
  const minutes = match[3] ? Number(match[3]) : 0;
  return sign * (hours * 60 + minutes);
}

type ZonedSnapshot = {
  instant: Date;
  weekday: number;
  hour: number;
  minute: number;
  offsetMinutes: number;
};

function snapshotInZone(date: Date, timeZone: string): ZonedSnapshot {
  const formatter = new Intl.DateTimeFormat("en-US", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
    timeZoneName: "shortOffset",
  });

  const parts = formatter.formatToParts(date);
  const get = (type: string) => parts.find((p) => p.type === type)?.value ?? "";
  const year = Number(get("year"));
  const month = Number(get("month"));
  const day = Number(get("day"));
  const hour = Number(get("hour"));
  const minute = Number(get("minute"));
  const second = Number(get("second"));
  const offsetLabel = get("timeZoneName");
  const offsetMinutes = parseOffsetMinutes(offsetLabel) ?? 0;

  // Construimos el instante real equivalente a la hora local indicada.
  const utcTimestamp = Date.UTC(year, month - 1, day, hour, minute, second) - offsetMinutes * 60 * 1000;
  const instant = new Date(utcTimestamp);

  // Proxy para obtener día/horas como si fuera la zona local, usando UTC getters.
  const localProxy = new Date(utcTimestamp + offsetMinutes * 60 * 1000);

  return {
    instant,
    weekday: localProxy.getUTCDay(),
    hour: localProxy.getUTCHours(),
    minute: localProxy.getUTCMinutes(),
    offsetMinutes,
  };
}

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

export function minuteOfWeek(date: Date, timeZone = DEFAULT_TIME_ZONE): number {
  const snapshot = snapshotInZone(date, timeZone);
  return snapshot.weekday * 1440 + snapshot.hour * 60 + snapshot.minute;
}

export function nextOccurrence(base: Date, weekday: number, minutes: number, timeZone = DEFAULT_TIME_ZONE): Date {
  const baseSnapshot = snapshotInZone(base, timeZone);
  const baseMinute = baseSnapshot.weekday * 1440 + baseSnapshot.hour * 60 + baseSnapshot.minute;
  const targetMinute = weekday * 1440 + minutes;
  let delta = targetMinute - baseMinute;
  if (delta < 0) delta += WEEK_MINUTES;
  const result = new Date(baseSnapshot.instant.getTime() + delta * 60 * 1000);
  return result;
}

function previousOccurrence(base: Date, weekday: number, minutes: number, timeZone = DEFAULT_TIME_ZONE): Date {
  const baseSnapshot = snapshotInZone(base, timeZone);
  const baseMinute = baseSnapshot.weekday * 1440 + baseSnapshot.hour * 60 + baseSnapshot.minute;
  const targetMinute = weekday * 1440 + minutes;
  let delta = targetMinute - baseMinute;
  if (delta > 0) delta -= WEEK_MINUTES;
  const result = new Date(baseSnapshot.instant.getTime() + delta * 60 * 1000);
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

export function pickNextDelivery(rules: DeliveryRule[], baseDate = new Date(), timeZone = DEFAULT_TIME_ZONE) {
  if (!rules.length) return null;
  const sorted = sortRules(rules);
  const nowMinute = minuteOfWeek(baseDate, timeZone);
  const target =
    sorted.find((entry) => nowMinute <= entry.cutoffMinute) ??
    sorted[0];
  const targetIndex = sorted.findIndex((entry) => entry === target);
  const prev = sorted[(targetIndex - 1 + sorted.length) % sorted.length];

  const cutoffDate = nextOccurrence(baseDate, target.rule.cutoffWeekday, target.rule.cutoffTimeMinutes, timeZone);
  const deliveryDate = nextOccurrence(
    cutoffDate,
    target.rule.deliveryWeekday,
    target.rule.deliveryTimeMinutes ?? 10 * 60,
    timeZone,
  );

  const windowStartDate = previousOccurrence(
    cutoffDate,
    prev.rule.cutoffWeekday,
    prev.rule.cutoffTimeMinutes,
    timeZone,
  );

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
