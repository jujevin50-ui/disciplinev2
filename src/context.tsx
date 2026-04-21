import {
  createContext, useContext, useState, useEffect, useCallback, ReactNode,
} from 'react';
import type { Session } from '@supabase/supabase-js';
import { supabase } from './supabase';
import type { AppState, Habit, HabitLog, IconName, HabitType } from './types';
import type { Tokens } from './tokens';
import { LIGHT, DARK } from './tokens';
import { today, uid } from './utils';

// ── DB row shapes ─────────────────────────────────────────────────────────

interface DbProfile {
  id: string;
  user_name: string;
  theme: string;
  onboarding_done: boolean;
}

interface DbHabit {
  id: string;
  user_id: string;
  name: string;
  icon: string;
  type: string;
  goal_minutes: number | null;
  frequency: number[];
  reminder_time: string | null;
  created_at: string;
}

interface DbLog {
  id?: string;
  user_id: string;
  habit_id: string;
  date: string;
  completed: boolean;
  minutes: number | null;
}

// ── Mappers ───────────────────────────────────────────────────────────────

function dbToHabit(r: DbHabit): Habit {
  return {
    id: r.id,
    name: r.name,
    icon: r.icon as IconName,
    type: r.type as HabitType,
    goalMinutes: r.goal_minutes ?? undefined,
    frequency: r.frequency,
    reminderTime: r.reminder_time ?? undefined,
    createdAt: r.created_at,
  };
}

function habitToDb(h: Omit<Habit, 'id' | 'createdAt'>, userId: string, id: string): DbHabit {
  return {
    id,
    user_id: userId,
    name: h.name,
    icon: h.icon,
    type: h.type,
    goal_minutes: h.goalMinutes ?? null,
    frequency: h.frequency,
    reminder_time: h.reminderTime ?? null,
    created_at: today(),
  };
}

function dbToLog(r: DbLog): HabitLog {
  return {
    habitId: r.habit_id,
    date: r.date,
    completed: r.completed,
    minutes: r.minutes ?? undefined,
  };
}

// ── Computation helpers (pure) ────────────────────────────────────────────

import { formatDate, getDow, getDaysInMonth } from './utils';

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
      } else cur = 0;
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
        if (logs.some(l => l.habitId === h.id && l.date === ds && l.completed)) {
          totalDone++; weekDone[wIdx]++;
        }
      }
    }
    d.setDate(d.getDate() - 1);
  }
  const rate = totalDue > 0 ? Math.round((totalDone / totalDue) * 100) : 0;
  const weeklyRates = weekDue.map((due, i) => due > 0 ? Math.round((weekDone[i] / due) * 100) : 0);
  return { rate, weeklyRates };
}

// ── Context ───────────────────────────────────────────────────────────────

const EMPTY_STATE: AppState = {
  habits: [], logs: [], userName: '', theme: 'light', onboardingDone: false,
};

interface Ctx {
  session: Session | null;
  authLoading: boolean;
  state: AppState;
  tokens: Tokens;
  signUp(email: string, password: string, name: string): Promise<string | null>;
  signIn(email: string, password: string): Promise<string | null>;
  signOut(): Promise<void>;
  addHabit(h: Omit<Habit, 'id' | 'createdAt'>): string;
  updateHabit(id: string, h: Partial<Omit<Habit, 'id' | 'createdAt'>>): void;
  deleteHabit(id: string): void;
  toggleLog(habitId: string, date: string): void;
  setUserName(name: string): void;
  createAccount(habits: Omit<Habit, 'id' | 'createdAt'>[], name: string): void;
  setTheme(t: 'light' | 'dark'): void;
}

const AppCtx = createContext<Ctx | null>(null);

export function AppProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [state, setState] = useState<AppState>(EMPTY_STATE);

  const tokens = state.theme === 'dark' ? DARK : LIGHT;

  // ── Load data for a user ──────────────────────────────────────────────

  const loadUserData = useCallback(async (userId: string) => {
    const [profileRes, habitsRes, logsRes] = await Promise.all([
      supabase.from('profiles').select('*').eq('id', userId).single(),
      supabase.from('habits').select('*').eq('user_id', userId).order('created_at'),
      supabase.from('habit_logs').select('*').eq('user_id', userId),
    ]);

    const profile = profileRes.data as DbProfile | null;
    const habits = (habitsRes.data as DbHabit[] | null) ?? [];
    const logs = (logsRes.data as DbLog[] | null) ?? [];

    setState({
      habits: habits.map(dbToHabit),
      logs: logs.map(dbToLog),
      userName: profile?.user_name ?? '',
      theme: (profile?.theme as 'light' | 'dark') ?? 'light',
      onboardingDone: profile?.onboarding_done ?? false,
    });
  }, []);

  // ── Auth listener ─────────────────────────────────────────────────────

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session: s } }) => {
      setSession(s);
      if (s) loadUserData(s.user.id).finally(() => setAuthLoading(false));
      else setAuthLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, s) => {
      setSession(s);
      if (s) loadUserData(s.user.id);
      else setState(EMPTY_STATE);
    });

    return () => subscription.unsubscribe();
  }, [loadUserData]);

  // ── Auth actions ──────────────────────────────────────────────────────

  const signUp = useCallback(async (email: string, password: string, name: string): Promise<string | null> => {
    const { data, error } = await supabase.auth.signUp({ email, password });
    if (error) return error.message;
    if (data.user) {
      await supabase.from('profiles').insert({
        id: data.user.id,
        user_name: name,
        theme: 'light',
        onboarding_done: false,
      });
    }
    return null;
  }, []);

  const signIn = useCallback(async (email: string, password: string): Promise<string | null> => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    return error ? error.message : null;
  }, []);

  const signOut = useCallback(async () => {
    await supabase.auth.signOut();
  }, []);

  // ── Data mutations (optimistic) ───────────────────────────────────────

  const addHabit = useCallback((h: Omit<Habit, 'id' | 'createdAt'>): string => {
    const id = uid();
    const newHabit: Habit = { ...h, id, createdAt: today() };
    setState(s => ({ ...s, habits: [...s.habits, newHabit] }));
    if (session) {
      supabase.from('habits').insert(habitToDb(h, session.user.id, id));
    }
    return id;
  }, [session]);

  const updateHabit = useCallback((id: string, h: Partial<Omit<Habit, 'id' | 'createdAt'>>) => {
    setState(s => ({ ...s, habits: s.habits.map(x => x.id === id ? { ...x, ...h } : x) }));
    if (session) {
      const dbPatch: Partial<DbHabit> = {};
      if (h.name !== undefined) dbPatch.name = h.name;
      if (h.icon !== undefined) dbPatch.icon = h.icon;
      if (h.type !== undefined) dbPatch.type = h.type;
      if (h.goalMinutes !== undefined) dbPatch.goal_minutes = h.goalMinutes;
      if (h.frequency !== undefined) dbPatch.frequency = h.frequency;
      if (h.reminderTime !== undefined) dbPatch.reminder_time = h.reminderTime;
      supabase.from('habits').update(dbPatch).eq('id', id);
    }
  }, [session]);

  const deleteHabit = useCallback((id: string) => {
    setState(s => ({
      ...s,
      habits: s.habits.filter(h => h.id !== id),
      logs: s.logs.filter(l => l.habitId !== id),
    }));
    if (session) {
      supabase.from('habits').delete().eq('id', id);
    }
  }, [session]);

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
    if (session) {
      supabase.from('habit_logs')
        .select('completed')
        .eq('habit_id', habitId)
        .eq('date', date)
        .single()
        .then(({ data }) => {
          if (data) {
            supabase.from('habit_logs')
              .update({ completed: !data.completed })
              .eq('habit_id', habitId)
              .eq('date', date);
          } else {
            supabase.from('habit_logs').insert({
              user_id: session.user.id,
              habit_id: habitId,
              date,
              completed: true,
              minutes: null,
            });
          }
        });
    }
  }, [session]);

  const setUserName = useCallback((name: string) => {
    setState(s => ({ ...s, userName: name }));
    if (session) {
      supabase.from('profiles').update({ user_name: name }).eq('id', session.user.id);
    }
  }, [session]);

  const createAccount = useCallback((habitDefs: Omit<Habit, 'id' | 'createdAt'>[], name: string) => {
    const todayStr = today();
    const newHabits: Habit[] = habitDefs.map(h => ({ ...h, id: uid(), createdAt: todayStr }));
    setState(s => ({
      ...s,
      habits: [...s.habits, ...newHabits],
      userName: name,
      onboardingDone: true,
    }));
    if (session) {
      const userId = session.user.id;
      supabase.from('profiles').upsert({
        id: userId,
        user_name: name,
        theme: state.theme,
        onboarding_done: true,
      });
      supabase.from('habits').insert(
        newHabits.map(h => habitToDb(h, userId, h.id))
      );
    }
  }, [session, state.theme]);

  const setTheme = useCallback((t: 'light' | 'dark') => {
    setState(s => ({ ...s, theme: t }));
    if (session) {
      supabase.from('profiles').update({ theme: t }).eq('id', session.user.id);
    }
  }, [session]);

  return (
    <AppCtx.Provider value={{
      session, authLoading, state, tokens,
      signUp, signIn, signOut,
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
