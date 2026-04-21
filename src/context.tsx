import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import type { AppState, Habit, HabitLog } from './types';
import type { Tokens } from './tokens';
import { LIGHT, DARK } from './tokens';
import { today, formatDate, getDow, getDaysInMonth, uid } from './utils';

const STORAGE_KEY = 'discipline_v2';

const DEFAULT: AppState = {
  habits: [],
  logs: [],
  userName: '',
  onboardingDone: false,
  theme: 'light',
};

function load(): AppState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return { ...DEFAULT, ...JSON.parse(raw) };
  } catch { /* ignore */ }
  return DEFAULT;
}

// ── Computation helpers (pure, take state as arg) ─────────────────────────

export function computeStreak(habitId: string, habits: Habit[], logs: HabitLog[]): number {
  const habit = habits.find(h => h.id === habitId);
  if (!habit) return 0;

  const d = new Date();
  const todayStr = today();
  const doneToday = logs.some(l => l.habitId === habitId && l.date === todayStr && l.completed);
  if (!doneToday) d.setDate(d.getDate() - 1);

  let streak = 0;
  for (let i = 0; i < 1000; i++) {
    const ds = formatDate(d);
    if (ds < habit.createdAt) break;
    const dow = getDow(ds);
    if (habit.frequency.includes(dow)) {
      if (logs.some(l => l.habitId === habitId && l.date === ds && l.completed)) streak++;
      else break;
    }
    d.setDate(d.getDate() - 1);
  }
  return streak;
}

export function computeBestStreak(habitId: string, habits: Habit[], logs: HabitLog[]): number {
  const habit = habits.find(h => h.id === habitId);
  if (!habit) return 0;

  const d = new Date(habit.createdAt + 'T00:00:00');
  const end = new Date();
  let best = 0, cur = 0;

  while (d <= end) {
    const ds = formatDate(d);
    const dow = getDow(ds);
    if (habit.frequency.includes(dow)) {
      if (logs.some(l => l.habitId === habitId && l.date === ds && l.completed)) {
        cur++;
        if (cur > best) best = cur;
      } else {
        cur = 0;
      }
    }
    d.setDate(d.getDate() + 1);
  }
  return best;
}

export function computeRate(habitId: string, habits: Habit[], logs: HabitLog[], days = 30): number {
  const habit = habits.find(h => h.id === habitId);
  if (!habit) return 0;
  const todayStr = today();
  const d = new Date();
  let due = 0, done = 0;
  for (let i = 0; i < days; i++) {
    const ds = formatDate(d);
    if (ds > todayStr) { d.setDate(d.getDate() - 1); continue; }
    if (ds < habit.createdAt) break;
    const dow = getDow(ds);
    if (habit.frequency.includes(dow)) {
      due++;
      if (logs.some(l => l.habitId === habitId && l.date === ds && l.completed)) done++;
    }
    d.setDate(d.getDate() - 1);
  }
  return due > 0 ? Math.round((done / due) * 100) : 0;
}

export function computeTotal(habitId: string, logs: HabitLog[]): number {
  return logs.filter(l => l.habitId === habitId && l.completed).length;
}

export function computeHeatmap(habitId: string, habits: Habit[], logs: HabitLog[], weeks = 20): boolean[][] {
  const habit = habits.find(h => h.id === habitId);
  const todayStr = today();
  const d = new Date();
  // Align to Monday of current week
  const dow = d.getDay() === 0 ? 6 : d.getDay() - 1;
  d.setDate(d.getDate() - dow - (weeks - 1) * 7);

  const result: boolean[][] = [];
  for (let w = 0; w < weeks; w++) {
    const week: boolean[] = [];
    for (let day = 0; day < 7; day++) {
      const ds = formatDate(d);
      const inFuture = ds > todayStr;
      const beforeStart = habit ? ds < habit.createdAt : true;
      week.push(!inFuture && !beforeStart && logs.some(l => l.habitId === habitId && l.date === ds && l.completed));
      d.setDate(d.getDate() + 1);
    }
    result.push(week);
  }
  return result;
}

export function computeCalendar(
  year: number,
  month: number,
  habits: Habit[],
  logs: HabitLog[]
): Map<number, { done: number; total: number }> {
  const result = new Map<number, { done: number; total: number }>();
  const days = getDaysInMonth(year, month);
  const todayStr = today();

  for (let day = 1; day <= days; day++) {
    const ds = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    if (ds > todayStr) continue;
    const dow = getDow(ds);
    let due = 0, done = 0;
    for (const h of habits) {
      if (ds < h.createdAt) continue;
      if (h.frequency.includes(dow)) {
        due++;
        if (logs.some(l => l.habitId === h.id && l.date === ds && l.completed)) done++;
      }
    }
    if (due > 0) result.set(day, { done, total: due });
  }
  return result;
}

export function computeGlobalStats(habits: Habit[], logs: HabitLog[], days = 84): {
  rate: number;
  weeklyRates: number[];
} {
  const todayStr = today();
  const weeks = Math.ceil(days / 7);
  const weekDue = Array(weeks).fill(0);
  const weekDone = Array(weeks).fill(0);
  let totalDue = 0, totalDone = 0;
  const d = new Date();

  for (let i = 0; i < days; i++) {
    const ds = formatDate(d);
    if (ds > todayStr) { d.setDate(d.getDate() - 1); continue; }
    const wIdx = weeks - 1 - Math.floor(i / 7);
    const dow = getDow(ds);
    for (const h of habits) {
      if (ds < h.createdAt) continue;
      if (h.frequency.includes(dow)) {
        totalDue++;
        weekDue[wIdx]++;
        if (logs.some(l => l.habitId === h.id && l.date === ds && l.completed)) {
          totalDone++;
          weekDone[wIdx]++;
        }
      }
    }
    d.setDate(d.getDate() - 1);
  }

  const rate = totalDue > 0 ? Math.round((totalDone / totalDue) * 100) : 0;
  const weeklyRates = weekDue.map((due, i) =>
    due > 0 ? Math.round((weekDone[i] / due) * 100) : 0
  );
  return { rate, weeklyRates };
}

// ── Context ───────────────────────────────────────────────────────────────

const SESSION_KEY = 'discipline_session';

export function isSessionActive(): boolean {
  return sessionStorage.getItem(SESSION_KEY) === 'true';
}

export function activateSession(): void {
  sessionStorage.setItem(SESSION_KEY, 'true');
}

interface Ctx {
  state: AppState;
  tokens: Tokens;
  addHabit(h: Omit<Habit, 'id' | 'createdAt'>): string;
  updateHabit(id: string, h: Partial<Omit<Habit, 'id' | 'createdAt'>>): void;
  deleteHabit(id: string): void;
  toggleLog(habitId: string, date: string): void;
  setUserName(name: string): void;
  finishOnboarding(habits: Omit<Habit, 'id' | 'createdAt'>[], name: string, pin: string): void;
  setTheme(t: 'light' | 'dark'): void;
  setPin(pin: string): void;
  checkPin(pin: string): boolean;
}

const AppCtx = createContext<Ctx | null>(null);

export function AppProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AppState>(load);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  }, [state]);

  const tokens = state.theme === 'dark' ? DARK : LIGHT;

  const addHabit = useCallback((h: Omit<Habit, 'id' | 'createdAt'>): string => {
    const id = uid();
    setState(s => ({ ...s, habits: [...s.habits, { ...h, id, createdAt: today() }] }));
    return id;
  }, []);

  const updateHabit = useCallback((id: string, h: Partial<Omit<Habit, 'id' | 'createdAt'>>) => {
    setState(s => ({ ...s, habits: s.habits.map(x => x.id === id ? { ...x, ...h } : x) }));
  }, []);

  const deleteHabit = useCallback((id: string) => {
    setState(s => ({
      ...s,
      habits: s.habits.filter(h => h.id !== id),
      logs: s.logs.filter(l => l.habitId !== id),
    }));
  }, []);

  const toggleLog = useCallback((habitId: string, date: string) => {
    setState(s => {
      const existing = s.logs.find(l => l.habitId === habitId && l.date === date);
      if (existing) {
        return { ...s, logs: s.logs.map(l =>
          l.habitId === habitId && l.date === date ? { ...l, completed: !l.completed } : l
        )};
      }
      return { ...s, logs: [...s.logs, { habitId, date, completed: true }] };
    });
  }, []);

  const setUserName = useCallback((name: string) => {
    setState(s => ({ ...s, userName: name }));
  }, []);

  const finishOnboarding = useCallback((habitDefs: Omit<Habit, 'id' | 'createdAt'>[], name: string, pin: string) => {
    const todayStr = today();
    const newHabits: Habit[] = habitDefs.map(h => ({ ...h, id: uid(), createdAt: todayStr }));
    setState(s => ({ ...s, habits: [...s.habits, ...newHabits], userName: name, onboardingDone: true, pin }));
  }, []);

  const setTheme = useCallback((t: 'light' | 'dark') => {
    setState(s => ({ ...s, theme: t }));
  }, []);

  const setPin = useCallback((pin: string) => {
    setState(s => ({ ...s, pin }));
  }, []);

  const checkPin = useCallback((pin: string): boolean => {
    return state.pin === pin;
  }, [state.pin]);

  return (
    <AppCtx.Provider value={{ state, tokens, addHabit, updateHabit, deleteHabit, toggleLog, setUserName, finishOnboarding, setTheme, setPin, checkPin }}>
      {children}
    </AppCtx.Provider>
  );
}

export function useApp(): Ctx {
  const ctx = useContext(AppCtx);
  if (!ctx) throw new Error('useApp must be inside AppProvider');
  return ctx;
}
