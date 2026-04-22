import type { Habit } from './types';
import { supabase } from './supabase';

const VAPID_PUBLIC = 'BAfxj3T0MPa8MBbWYE9rEm7H9Tiu29leD3Mi1yti6Tn1PhaiSZ6TI20mdNaBTPyPRZqOU5gvcsHdWU5vC1PGBpw';

// habitId → timeoutId
const scheduledTimeouts = new Map<string, number>();

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

// Calcule les ms jusqu'à la prochaine occurrence de reminderTime sur l'un des jours frequency
function msUntilNext(reminderTime: string, frequency: number[]): number {
  const [hh, mm] = reminderTime.split(':').map(Number);
  const now = new Date();
  const todayDow = (now.getDay() + 6) % 7; // lundi=0 … dimanche=6

  for (let offset = 0; offset < 7; offset++) {
    const targetDow = (todayDow + offset) % 7;
    if (!frequency.includes(targetDow)) continue;

    const target = new Date(now);
    target.setDate(target.getDate() + offset);
    target.setHours(hh, mm, 0, 0);

    const ms = target.getTime() - now.getTime();
    if (ms > 500) return ms; // > 0.5s pour éviter de refirer immédiatement
  }

  return 7 * 24 * 60 * 60 * 1000; // fallback 7 jours
}

function scheduleHabit(habit: Habit) {
  if (!habit.reminderTime) return;

  const existing = scheduledTimeouts.get(habit.id);
  if (existing !== undefined) clearTimeout(existing);

  const ms = msUntilNext(habit.reminderTime, habit.frequency);
  const fireAt = new Date(Date.now() + ms);
  console.log(`[Discipline] "${habit.name}" → ${habit.reminderTime} dans ${Math.round(ms / 60000)}min (${fireAt.toLocaleTimeString()})`);

  const id = window.setTimeout(() => {
    fire(habit);
    scheduleHabit(habit); // reprogramme pour la prochaine occurrence
  }, ms);

  scheduledTimeouts.set(habit.id, id);
}

export function scheduleAll(habits: Habit[]) {
  // Annuler les timeouts des habitudes supprimées ou sans rappel
  const activeIds = new Set(habits.filter(h => h.reminderTime).map(h => h.id));
  for (const [id, tid] of scheduledTimeouts) {
    if (!activeIds.has(id)) {
      clearTimeout(tid);
      scheduledTimeouts.delete(id);
    }
  }

  // Programmer chaque habitude avec un rappel
  for (const habit of habits) {
    if (habit.reminderTime) scheduleHabit(habit);
  }
}

// ── Web Push subscription (navigateur fermé) ───────────────────────────────

async function getSWRegistration(): Promise<ServiceWorkerRegistration | null> {
  try { return await navigator.serviceWorker.ready; } catch { return null; }
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
    let sub = await reg.pushManager.getSubscription();
    if (!sub) {
      sub = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC),
      });
    }

    const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
    await supabase.from('push_subscriptions').upsert(
      { user_id: userId, subscription: sub.toJSON(), timezone: tz },
      { onConflict: 'user_id' }
    );
    return true;
  } catch { return false; }
}

export async function syncReminders(userId: string, habits: Habit[]) {
  const withReminder = habits.filter(h => h.reminderTime);
  const withoutReminder = habits.filter(h => !h.reminderTime).map(h => h.id);

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
      })),
      { onConflict: 'user_id,habit_id' }
    );
  }

  if (withoutReminder.length > 0) {
    await supabase.from('reminders')
      .delete()
      .eq('user_id', userId)
      .in('habit_id', withoutReminder);
  }
}
