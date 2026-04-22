import type { Habit } from './types';

let intervalId: number | null = null;
let scheduledHabits: Habit[] = [];

export function supported(): boolean {
  return 'Notification' in window;
}

export async function requestPermission(): Promise<boolean> {
  if (!supported()) return false;
  if (Notification.permission === 'granted') return true;
  const result = await Notification.requestPermission();
  return result === 'granted';
}

function fire(habit: Habit) {
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
    requestPermission().then(ok => { if (ok) fire(habit); });
  } else {
    fire(habit);
  }
}

function tick() {
  if (!supported() || Notification.permission !== 'granted') return;
  const now = new Date();
  const hh = String(now.getHours()).padStart(2, '0');
  const mm = String(now.getMinutes()).padStart(2, '0');
  const nowStr = `${hh}:${mm}`;
  const todayDow = (now.getDay() + 6) % 7;

  for (const habit of scheduledHabits) {
    if (!habit.reminderTime) continue;
    if (!habit.frequency.includes(todayDow)) continue;
    if (habit.reminderTime === nowStr) fire(habit);
  }
}

export function scheduleAll(habits: Habit[]) {
  scheduledHabits = habits;

  // Start interval once
  if (intervalId === null) {
    // Align to next minute boundary
    const now = new Date();
    const msToNextMinute = (60 - now.getSeconds()) * 1000 - now.getMilliseconds();
    window.setTimeout(() => {
      tick();
      intervalId = window.setInterval(tick, 60_000);
    }, msToNextMinute);
  }
}

export function cancelAll() {
  if (intervalId !== null) {
    clearInterval(intervalId);
    intervalId = null;
  }
  scheduledHabits = [];
}
