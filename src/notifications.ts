import type { Habit } from './types';
import { supabase } from './supabase';

const VAPID_PUBLIC = 'BAfxj3T0MPa8MBbWYE9rEm7H9Tiu29leD3Mi1yti6Tn1PhaiSZ6TI20mdNaBTPyPRZqOU5gvcsHdWU5vC1PGBpw';

let intervalId: number | null = null;
let scheduledHabits: Habit[] = [];

export function supported(): boolean {
  return 'Notification' in window && 'serviceWorker' in navigator && 'PushManager' in window;
}

export async function requestPermission(): Promise<boolean> {
  if (!('Notification' in window)) return false;
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
  if (!('Notification' in window)) return;
  if (Notification.permission !== 'granted') {
    requestPermission().then(ok => { if (ok) fire(habit); });
  } else {
    fire(habit);
  }
}

// ── In-browser ticker (tab open / background) ──────────────────────────

function tick() {
  if (!('Notification' in window) || Notification.permission !== 'granted') return;
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
  if (intervalId === null) {
    const now = new Date();
    const msToNext = (60 - now.getSeconds()) * 1000 - now.getMilliseconds();
    window.setTimeout(() => {
      tick();
      intervalId = window.setInterval(tick, 60_000);
    }, msToNext);
  }
}

// ── Web Push subscription (browser closed) ─────────────────────────────

async function getSWRegistration(): Promise<ServiceWorkerRegistration | null> {
  try {
    return await navigator.serviceWorker.ready;
  } catch { return null; }
}

function urlBase64ToUint8Array(base64: string): ArrayBuffer {
  const pad = '='.repeat((4 - base64.length % 4) % 4);
  const b64 = (base64 + pad).replace(/-/g, '+').replace(/_/g, '/');
  const raw = atob(b64);
  const arr = new Uint8Array(raw.length);
  for (let i = 0; i < raw.length; i++) arr[i] = raw.charCodeAt(i);
  return arr.buffer;
}

export async function subscribePush(userId: string): Promise<boolean> {
  if (!supported()) return false;
  const granted = await requestPermission();
  if (!granted) return false;

  const reg = await getSWRegistration();
  if (!reg) return false;

  try {
    const sub = await reg.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC),
    });

    const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
    await supabase.from('push_subscriptions').upsert({
      user_id: userId,
      subscription: sub.toJSON(),
      timezone: tz,
    });
    return true;
  } catch { return false; }
}

export async function syncReminders(userId: string, habits: Habit[]) {
  const withReminder = habits.filter(h => h.reminderTime);

  // Upsert all habits with reminders
  if (withReminder.length > 0) {
    await supabase.from('reminders').upsert(
      withReminder.map(h => ({
        user_id: userId,
        habit_id: h.id,
        habit_name: h.name,
        habit_type: h.type,
        goal_minutes: h.goalMinutes ?? null,
        reminder_time: h.reminderTime,
        frequency: h.frequency,
      }))
    );
  }

  // Delete reminders for habits that no longer have one
  const withoutReminder = habits.filter(h => !h.reminderTime).map(h => h.id);
  if (withoutReminder.length > 0) {
    await supabase.from('reminders')
      .delete()
      .eq('user_id', userId)
      .in('habit_id', withoutReminder);
  }
}
