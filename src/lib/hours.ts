// Öppettidslogik som delas mellan server-renderingen och skriptet i webbläsaren.
// Allt räknas i svensk tid (Europe/Stockholm) oavsett var besökaren befinner sig.

export interface WeeklyHours {
  days: number[]; // 1 = måndag … 7 = söndag
  open: string; // "HH:MM"
  close: string; // "HH:MM" (samma dygn)
}

export interface SpecialDay {
  date: string; // "YYYY-MM-DD"
  label?: string;
  closed?: boolean;
  open?: string;
  close?: string;
}

export interface HoursConfig {
  weekly: WeeklyHours[];
  special: SpecialDay[];
}

export interface Now {
  date: string;
  weekday: number;
  minutes: number;
}

export interface Status {
  open: boolean;
  /** Stänger inom 30 minuter */
  soon: boolean;
  /** T.ex. "Öppet nu · till 20:15" eller "Stängt · öppnar i morgon 11:45" */
  text: string;
}

export const WEEKDAYS = ["måndag", "tisdag", "onsdag", "torsdag", "fredag", "lördag", "söndag"];

const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

export function toMinutes(hhmm: string): number {
  const [h, m] = hhmm.split(":").map(Number);
  return h * 60 + (m || 0);
}

export function hhmm(minutes: number): string {
  const h = Math.floor(minutes / 60) % 24;
  const m = minutes % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}

const WD: Record<string, number> = { Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6, Sun: 7 };

/** Aktuellt datum, veckodag och minut på dygnet i Sverige. */
export function stockholmNow(d: Date = new Date()): Now {
  const parts = new Intl.DateTimeFormat("en-GB", {
    timeZone: "Europe/Stockholm",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    weekday: "short",
    hourCycle: "h23",
  }).formatToParts(d);
  const get = (t: string) => parts.find((p) => p.type === t)?.value ?? "";
  return {
    date: `${get("year")}-${get("month")}-${get("day")}`,
    weekday: WD[get("weekday")] ?? 1,
    minutes: Number(get("hour")) * 60 + Number(get("minute")),
  };
}

function addDays(date: string, n: number): { date: string; weekday: number } {
  const d = new Date(`${date}T12:00:00Z`);
  d.setUTCDate(d.getUTCDate() + n);
  const wd = d.getUTCDay(); // 0 = söndag
  return { date: d.toISOString().slice(0, 10), weekday: wd === 0 ? 7 : wd };
}

/** Öppettider ett visst datum, eller null om stängt. */
export function hoursOn(cfg: HoursConfig, date: string, weekday: number) {
  const sp = cfg.special.find((s) => s.date === date);
  if (sp) {
    if (sp.closed || !sp.open || !sp.close) return null;
    return { open: toMinutes(sp.open), close: toMinutes(sp.close), label: sp.label };
  }
  const w = cfg.weekly.find((h) => h.days.includes(weekday));
  return w ? { open: toMinutes(w.open), close: toMinutes(w.close), label: undefined } : null;
}

export function getStatus(cfg: HoursConfig, now: Now = stockholmNow()): Status {
  const today = hoursOn(cfg, now.date, now.weekday);
  if (today && now.minutes >= today.open && now.minutes < today.close) {
    const left = today.close - now.minutes;
    return left <= 30
      ? { open: true, soon: true, text: `Stänger snart · ${hhmm(today.close)}` }
      : { open: true, soon: false, text: `Öppet nu · till ${hhmm(today.close)}` };
  }
  if (today && now.minutes < today.open) {
    return { open: false, soon: false, text: `Stängt · öppnar ${hhmm(today.open)}` };
  }
  for (let i = 1; i <= 14; i++) {
    const d = addDays(now.date, i);
    const h = hoursOn(cfg, d.date, d.weekday);
    if (h) {
      const when = i === 1 ? "i morgon" : WEEKDAYS[d.weekday - 1];
      return { open: false, soon: false, text: `Stängt · öppnar ${when} ${hhmm(h.open)}` };
    }
  }
  return { open: false, soon: false, text: "Stängt" };
}

/** Veckans tider grupperade för visning: "Måndag–fredag 11:00–20:15". */
export function groupedWeek(cfg: HoursConfig) {
  const perDay = [1, 2, 3, 4, 5, 6, 7].map((day) => {
    const w = cfg.weekly.find((h) => h.days.includes(day));
    return { day, time: w ? `${w.open}–${w.close}` : "Stängt" };
  });
  const groups: { label: string; time: string; days: number[] }[] = [];
  for (const d of perDay) {
    const last = groups.at(-1);
    if (last && last.time === d.time && last.days.at(-1) === d.day - 1) last.days.push(d.day);
    else groups.push({ label: "", time: d.time, days: [d.day] });
  }
  for (const g of groups) {
    const first = WEEKDAYS[g.days[0] - 1];
    const lastDay = WEEKDAYS[g.days.at(-1)! - 1];
    g.label = g.days.length === 1 ? cap(first) : `${cap(first)}–${lastDay}`;
  }
  return groups;
}

/** Är alla dagar öppna? (för texten "Öppet alla dagar") */
export function openEveryDay(cfg: HoursConfig) {
  return [1, 2, 3, 4, 5, 6, 7].every((d) => cfg.weekly.some((h) => h.days.includes(d)));
}
