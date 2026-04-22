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

function showNotification(habit: Habit) {
  if (Notification.permission !== 'granted') return;
  const n = new Notification(habit.name, {
    body: habit.type === 'duration' ? `${habit.goalMinutes} min` : '',
    icon: '/icon-192.png',
    tag: `habit-${habit.id}`,
  });
  n.onclick = () => { window.focus(); n.close(); };
}

export function testNotification(habit: Habit) {
  if (!supported()) return;
  if (Notification.permission !== 'granted') {
    requestPermission().then(ok => { if (ok) showNotification(habit); });
  } else {
    showNotification(habit);
  }
}

export function scheduleAll(habits: Habit[]) {
  cancelAll();
  if (!supported() || Notification.permission !== 'granted') return;

  const now = new Date();
  const todayDow = (now.getDay() + 6) % 7;
  const timers: number[] = [];

  for (const habit of habits) {
    if (!habit.reminderTime) continue;
    if (!habit.frequency.includes(todayDow)) continue;

    const [h, m] = habit.reminderTime.split(':').map(Number);
    const target = new Date();
    target.setHours(h, m, 0, 0);

    // If time already passed today, schedule for tomorrow
    if (target.getTime() <= now.getTime()) {
      target.setDate(target.getDate() + 1);
    }

    const delay = target.getTime() - now.getTime();
    const id = window.setTimeout(() => showNotification(habit), delay);
    timers.push(id);
  }

  w[TIMERS_KEY] = timers;
}

// Reschedule when tab becomes visible again (e.g. next day)
export function startVisibilityReschedule(getHabits: () => Habit[]) {
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible') {
      scheduleAll(getHabits());
    }
  });
}
