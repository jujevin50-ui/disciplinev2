import type { Habit } from './types';
import { supabase } from './supabase';

const VAPID_PUBLIC = 'BAfxj3T0MPa8MBbWYE9rEm7H9Tiu29leD3Mi1yti6Tn1PhaiSZ6TI20mdNaBTPyPRZqOU5gvcsHdWU5vC1PGBpw';

function urlBase64ToUint8Array(base64: string): ArrayBuffer {
  const pad = '='.repeat((4 - base64.length % 4) % 4);
  const b64 = (base64 + pad).replace(/-/g, '+').replace(/_/g, '/');
  const raw = atob(b64);
  const arr = new Uint8Array(raw.length);
  for (let i = 0; i < raw.length; i++) arr[i] = raw.charCodeAt(i);
  return arr.buffer;
}

export async function subscribePush(userId: string): Promise<boolean> {
  if (!('Notification' in window) || !('serviceWorker' in navigator) || !('PushManager' in window)) {
    return false;
  }

  if (Notification.permission !== 'granted') {
    const result = await Notification.requestPermission();
    if (result !== 'granted') return false;
  }

  try {
    const reg = await navigator.serviceWorker.ready;
    let sub = await reg.pushManager.getSubscription();
    if (!sub) {
      sub = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC),
      });
    }

    const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
    const { error } = await supabase.from('push_subscriptions').upsert(
      { user_id: userId, subscription: sub.toJSON(), timezone: tz },
      { onConflict: 'user_id' }
    );
    return !error;
  } catch {
    return false;
  }
}

export async function syncReminders(userId: string, habits: Habit[]) {
  const withReminder = habits.filter(h => h.reminderTime);
  const withoutIds = habits.filter(h => !h.reminderTime).map(h => h.id);

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

  if (withoutIds.length > 0) {
    await supabase.from('reminders')
      .delete()
      .eq('user_id', userId)
      .in('habit_id', withoutIds);
  }
}
