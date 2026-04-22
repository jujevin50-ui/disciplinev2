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
    // Fallback UTC si timezone invalide
    return new Date().toLocaleTimeString('fr-FR', {
      timeZone: 'UTC', hour: '2-digit', minute: '2-digit', hour12: false,
    }).slice(0, 5);
  }
}

// Monday=0 … Sunday=6
function localDow(tz: string): number {
  try {
    const day = new Date().toLocaleDateString('en-US', { timeZone: tz, weekday: 'short' });
    return ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].indexOf(day);
  } catch {
    return (new Date().getDay() + 6) % 7;
  }
}

export default async function handler(_req: VercelRequest, res: VercelResponse) {
  const startTime = Date.now();
  console.log(`[push] cron invoked at ${new Date().toISOString()}`);

  const { data: subs, error: subErr } = await supabase
    .from('push_subscriptions')
    .select('user_id, subscription, timezone');

  if (subErr) {
    console.error('[push] Error fetching subscriptions:', subErr.message);
    return res.status(500).json({ error: subErr.message });
  }

  if (!subs || subs.length === 0) {
    console.log('[push] No subscriptions found');
    return res.status(200).json({ sent: 0 });
  }

  console.log(`[push] ${subs.length} subscription(s) à vérifier`);

  let sent = 0;
  let skipped = 0;
  let expired = 0;

  for (const sub of subs) {
    const tz = sub.timezone || 'UTC';
    const nowStr = localHHMM(tz);
    const dow = localDow(tz);

    console.log(`[push] user=${sub.user_id} tz=${tz} heure_locale=${nowStr} dow=${dow}`);

    const { data: reminders, error: remErr } = await supabase
      .from('reminders')
      .select('habit_name, habit_type, goal_minutes, frequency, reminder_time')
      .eq('user_id', sub.user_id)
      .eq('reminder_time', nowStr);

    if (remErr) {
      console.error(`[push] Error fetching reminders for ${sub.user_id}:`, remErr.message);
      continue;
    }

    console.log(`[push]   ${(reminders ?? []).length} rappel(s) à cette heure`);

    for (const r of reminders ?? []) {
      const freqArr: number[] = Array.isArray(r.frequency) ? r.frequency : [];
      if (!freqArr.includes(dow)) {
        console.log(`[push]   "${r.habit_name}" skipped (dow ${dow} not in [${freqArr}])`);
        skipped++;
        continue;
      }

      try {
        await webpush.sendNotification(
          sub.subscription,
          JSON.stringify({
            title: r.habit_name,
            body: r.habit_type === 'duration' ? `${r.goal_minutes} min` : '',
            tag: `habit-${r.habit_name}`,
          })
        );
        console.log(`[push]   ✓ Sent "${r.habit_name}" → user ${sub.user_id}`);
        sent++;
      } catch (e: unknown) {
        const status = (e as { statusCode?: number }).statusCode;
        if (status === 410 || status === 404) {
          // Subscription expirée → la supprimer
          console.log(`[push]   ✗ Expired subscription for user ${sub.user_id}, removing`);
          await supabase.from('push_subscriptions').delete().eq('user_id', sub.user_id);
          expired++;
        } else {
          console.error(`[push]   ✗ Send error for "${r.habit_name}":`, e);
        }
      }
    }
  }

  const duration = Date.now() - startTime;
  console.log(`[push] done in ${duration}ms | sent=${sent} skipped=${skipped} expired=${expired}`);
  res.status(200).json({ sent, skipped, expired, duration_ms: duration });
}
