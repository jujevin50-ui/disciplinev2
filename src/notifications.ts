import type { Habit } from './types';

const w = window as unknown as Record<string, unknown>;
const TIMERS_KEY = '__discipline_timers';

export function supported(): boolean {
  return 'Notification' in window;
}

export async function requestPermission(): Promise<boolean> {
  if (!supported()) return false;
  if (Notification.permission === 'granted') return true;
  const result = await Notification.requestPermission();
  return result === 'granted';
}

export function cancelAll() {
  const timers = (w[TIMERS_KEY] as number[]) || [];
  timers.forEach(id => clearTimeout(id));
  w[TIMERS_KEY] = [];
}

export function scheduleAll(habits: Habit[]) {
  cancelAll();
  if (!supported() || Notification.permission !== 'granted') return;

  const now = new Date();
  const todayDow = (now.getDay() + 6) % 7; // 0=Mon…6=Sun
  const timers: number[] = [];

  for (const habit of habits) {
    if (!habit.reminderTime) continue;
    if (!habit.frequency.includes(todayDow)) continue;

    const [h, m] = habit.reminderTime.split(':').map(Number);
    const target = new Date();
    target.setHours(h, m, 0, 0);
    const delay = target.getTime() - now.getTime();
    if (delay <= 0) continue;

    const id = window.setTimeout(() => {
      const n = new Notification(habit.name, {
        body: habit.type === 'duration'
          ? `${habit.goalMinutes} min · c'est l'heure !`
          : "C'est l'heure de votre habitude !",
        icon: '/icon-192.png',
        tag: `habit-${habit.id}`,
      });
      n.onclick = () => { window.focus(); n.close(); };
    }, delay);

    timers.push(id);
  }

  w[TIMERS_KEY] = timers;
}

export function startDailyReschedule(getHabits: () => Habit[]) {
  const now = new Date();
  const midnight = new Date();
  midnight.setHours(24, 0, 0, 0);
  const msUntilMidnight = midnight.getTime() - now.getTime();

  window.setTimeout(() => {
    scheduleAll(getHabits());
    window.setInterval(() => scheduleAll(getHabits()), 24 * 60 * 60 * 1000);
  }, msUntilMidnight);
}
