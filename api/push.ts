import type { VercelRequest, VercelResponse } from '@vercel/node';
import webpush from 'web-push';
import { createClient } from '@supabase/supabase-js';

webpush.setVapidDetails(
  'mailto:discipline@app.local',
  process.env.VAPID_PUBLIC_KEY!,
  process.env.VAPID_PRIVATE_KEY!
);

const supabase = createClient(
  process.env.VITE_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

function localHHMM(tz: string): string {
  try {
    return new Date().toLocaleTimeString('fr-FR', {
      timeZone: tz, hour: '2-digit', minute: '2-digit', hour12: false,
    }).slice(0, 5);
  } catch {
    return new Date().toISOString().slice(11, 16);
  }
}

function localDow(tz: string): number {
  try {
    const day = new Date().toLocaleDateString('en-US', { timeZone: tz, weekday: 'short' });
    return ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].indexOf(day);
  } catch {
    return (new Date().getDay() + 6) % 7;
  }
}

export default async function handler(_req: VercelRequest, res: VercelResponse) {
  const { data: subs } = await supabase
    .from('push_subscriptions')
    .select('user_id, subscription, timezone');

  if (!subs || subs.length === 0) return res.status(200).json({ sent: 0 });

  let sent = 0;

  for (const sub of subs) {
    const tz = sub.timezone || 'UTC';
    const nowStr = localHHMM(tz);
    const dow = localDow(tz);

    const { data: reminders } = await supabase
      .from('reminders')
      .select('habit_name, habit_type, goal_minutes, frequency')
      .eq('user_id', sub.user_id)
      .eq('reminder_time', nowStr);

    for (const r of reminders ?? []) {
      const freq: number[] = Array.isArray(r.frequency) ? r.frequency : [];
      if (!freq.includes(dow)) continue;

      try {
        await webpush.sendNotification(
          sub.subscription,
          JSON.stringify({
            title: r.habit_name,
            body: r.habit_type === 'duration' ? `${r.goal_minutes} min` : '',
            tag: `habit-${r.habit_name}`,
          })
        );
        sent++;
      } catch (e: unknown) {
        const status = (e as { statusCode?: number }).statusCode;
        if (status === 410 || status === 404) {
          await supabase.from('push_subscriptions').delete().eq('user_id', sub.user_id);
        }
      }
    }
  }

  res.status(200).json({ sent });
}
