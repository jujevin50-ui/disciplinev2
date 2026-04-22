import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import type { User, Session } from '@supabase/supabase-js';
import { supabase } from './supabase';
import type { Habit, HabitLog } from './types';
import type { Tokens } from './tokens';
import { LIGHT, DARK } from './tokens';
import { today, uid, formatDate, getDow, getDaysInMonth } from './utils';
import { scheduleAll, startVisibilityReschedule } from './notifications';

// Habits & logs stored locally per user
const dataKey = (uid: string) => `discipline_v2_${uid}`;

interface LocalData {
  habits: Habit[];
  logs: HabitLog[];
  userName: string;
  theme: 'light' | 'dark';
}

const EMPTY_LOCAL: LocalData = { habits: [], logs: [], userName: '', theme: 'light' };

function loadLocal(userId: string): LocalData {
  try {
    const raw = localStorage.getItem(dataKey(userId));
    if (raw) return { ...EMPTY_LOCAL, ...JSON.parse(raw) };
  } catch { /* ignore */ }
  return EMPTY_LOCAL;
}

function saveLocal(userId: string, data: LocalData) {
  try {
    localStorage.setItem(dataKey(userId), JSON.stringify(data));
  } catch { /* ignore */ }
}

// ── Computation helpers ───────────────────────────────────────────────────

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
      if (logs.some(l => l.habitId === habitId && l.date === ds && l.completed)) { cur++; if (cur > best) best = cur; }
      else cur = 0;
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
  year: number, month: number, habits: Habit[], logs: HabitLog[]
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
  rate: number; weeklyRates: number[];
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
        totalDue++; weekDue[wIdx]++;
        if (logs.some(l => l.habitId === h.id && l.date === ds && l.completed)) { totalDone++; weekDone[wIdx]++; }
      }
    }
    d.setDate(d.getDate() - 1);
  }
  const rate = totalDue > 0 ? Math.round((totalDone / totalDue) * 100) : 0;
  const weeklyRates = weekDue.map((due, i) => due > 0 ? Math.round((weekDone[i] / due) * 100) : 0);
  return { rate, weeklyRates };
}

// ── Context ───────────────────────────────────────────────────────────────

export interface AppState {
  habits: Habit[];
  logs: HabitLog[];
  userName: string;
  loggedIn: boolean;
  theme: 'light' | 'dark';
}

interface Ctx {
  user: User | null;
  session: Session | null;
  authLoading: boolean;
  state: AppState;
  tokens: Tokens;
  signUp(email: string, password: string, name: string): Promise<string | null>;
  signIn(email: string, password: string): Promise<string | null>;
  logout(): Promise<void>;
  addHabit(h: Omit<Habit, 'id' | 'createdAt'>): string;
  updateHabit(id: string, h: Partial<Omit<Habit, 'id' | 'createdAt'>>): void;
  deleteHabit(id: string): void;
  toggleLog(habitId: string, date: string): void;
  setUserName(name: string): void;
  createAccount(habits: Omit<Habit, 'id' | 'createdAt'>[], name: string): void;
  setTheme(t: 'light' | 'dark'): void;
}

const AppCtx = createContext<Ctx | null>(null);

function toAppState(local: LocalData, loggedIn: boolean): AppState {
  return { ...local, loggedIn };
}

export function AppProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [local, setLocal] = useState<LocalData>(EMPTY_LOCAL);

  // Supabase session — persists automatically via localStorage
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session: s } }) => {
      setSession(s);
      setUser(s?.user ?? null);
      if (s?.user) setLocal(loadLocal(s.user.id));
      setAuthLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, s) => {
      setSession(s);
      setUser(s?.user ?? null);
      if (s?.user) setLocal(loadLocal(s.user.id));
      else setLocal(EMPTY_LOCAL);
    });

    return () => subscription.unsubscribe();
  }, []);

  // Save local data and reschedule notifications on every change
  useEffect(() => {
    if (user) saveLocal(user.id, local);
    scheduleAll(local.habits);
  }, [local, user]);

  // Reschedule when tab becomes visible (handles next-day case)
  useEffect(() => {
    const habits = local.habits;
    startVisibilityReschedule(() => habits);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [local.habits]);

  const state = toAppState(local, !!session);
  const tokens = local.theme === 'dark' ? DARK : LIGHT;

  const signUp = useCallback(async (email: string, password: string, name: string): Promise<string | null> => {
    const { data, error } = await supabase.auth.signUp({ email, password });
    if (error) return error.message;
    // If session returned immediately (email confirm disabled) → already logged in
    if (data.session) {
      if (data.user) {
        const initial: LocalData = { ...EMPTY_LOCAL, userName: name };
        saveLocal(data.user.id, initial);
        setLocal(initial);
      }
      return null;
    }
    // Email confirmation required → sign in after user confirms
    return 'Vérifiez votre email et cliquez le lien de confirmation, puis connectez-vous.';
  }, []);

  const signIn = useCallback(async (email: string, password: string): Promise<string | null> => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) return error.message === 'Invalid login credentials' ? 'Email ou mot de passe incorrect.' : error.message;
    return null;
  }, []);

  const logout = useCallback(async () => {
    await supabase.auth.signOut();
    setLocal(EMPTY_LOCAL);
  }, []);

  const updateLocal = useCallback((fn: (prev: LocalData) => LocalData) => {
    setLocal(fn);
  }, []);

  const addHabit = useCallback((h: Omit<Habit, 'id' | 'createdAt'>): string => {
    const id = uid();
    updateLocal(s => ({ ...s, habits: [...s.habits, { ...h, id, createdAt: today() }] }));
    return id;
  }, [updateLocal]);

  const updateHabit = useCallback((id: string, h: Partial<Omit<Habit, 'id' | 'createdAt'>>) => {
    updateLocal(s => ({ ...s, habits: s.habits.map(x => x.id === id ? { ...x, ...h } : x) }));
  }, [updateLocal]);

  const deleteHabit = useCallback((id: string) => {
    updateLocal(s => ({ ...s, habits: s.habits.filter(h => h.id !== id), logs: s.logs.filter(l => l.habitId !== id) }));
  }, [updateLocal]);

  const toggleLog = useCallback((habitId: string, date: string) => {
    updateLocal(s => {
      const existing = s.logs.find(l => l.habitId === habitId && l.date === date);
      if (existing) return { ...s, logs: s.logs.map(l => l.habitId === habitId && l.date === date ? { ...l, completed: !l.completed } : l) };
      return { ...s, logs: [...s.logs, { habitId, date, completed: true }] };
    });
  }, [updateLocal]);

  const setUserName = useCallback((name: string) => {
    updateLocal(s => ({ ...s, userName: name }));
  }, [updateLocal]);

  const createAccount = useCallback((habitDefs: Omit<Habit, 'id' | 'createdAt'>[], name: string) => {
    const newHabits: Habit[] = habitDefs.map(h => ({ ...h, id: uid(), createdAt: today() }));
    const next: LocalData = { habits: newHabits, logs: [], userName: name, theme: 'light' };
    if (user) saveLocal(user.id, next);
    setLocal(next);
  }, [user]);

  const setTheme = useCallback((t: 'light' | 'dark') => {
    updateLocal(s => ({ ...s, theme: t }));
  }, [updateLocal]);

  return (
    <AppCtx.Provider value={{
      user, session, authLoading, state, tokens,
      signUp, signIn, logout,
      addHabit, updateHabit, deleteHabit, toggleLog,
      setUserName, createAccount, setTheme,
    }}>
      {children}
    </AppCtx.Provider>
  );
}

export function useApp(): Ctx {
  const ctx = useContext(AppCtx);
  if (!ctx) throw new Error('useApp must be inside AppProvider');
  return ctx;
}
