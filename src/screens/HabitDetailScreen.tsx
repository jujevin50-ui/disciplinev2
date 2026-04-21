import { useNavigate, useParams } from 'react-router-dom';
import { useApp, computeStreak, computeBestStreak, computeRate, computeTotal, computeHeatmap } from '../context';
import { Icon } from '../components/Icon';

const DAY_LETTERS = ['L', 'M', 'M', 'J', 'V', 'S', 'D'];

export function HabitDetailScreen() {
  const { tokens: T, state } = useApp();
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const habit = state.habits.find(h => h.id === id);

  if (!habit) {
    return (
      <div style={{ height: '100%', background: T.paper, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ textAlign: 'center', color: T.inkMuted }}>
          <div style={{ fontSize: 16, marginBottom: 12 }}>Habitude introuvable.</div>
          <button onClick={() => navigate('/today')} style={{ color: T.accent, fontSize: 15 }}>
            ← Retour
          </button>
        </div>
      </div>
    );
  }

  const streak = computeStreak(habit.id, state.habits, state.logs);
  const best = computeBestStreak(habit.id, state.habits, state.logs);
  const rate30 = computeRate(habit.id, state.habits, state.logs, 30);
  const rate90 = computeRate(habit.id, state.habits, state.logs, 90);
  const total = computeTotal(habit.id, state.logs);
  const heatmap = computeHeatmap(habit.id, state.habits, state.logs, 20);
  const WEEKS = 20;

  return (
    <div className="hide-scrollbar" style={{
      height: '100%', background: T.paper, color: T.ink,
      overflowY: 'auto', paddingBottom: 40,
    }}>
      {/* Nav */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '52px 20px 10px',
      }}>
        <button onClick={() => navigate(-1)} style={{ color: T.inkSoft, display: 'flex', alignItems: 'center', gap: 4 }}>
          <Icon name="chevronLeft" size={22} />
        </button>
        <button onClick={() => navigate(`/habit/${habit.id}/edit`)} style={{ color: T.inkSoft }}>
          <Icon name="edit" size={18} />
        </button>
      </div>

      {/* Hero */}
      <div style={{ padding: '16px 28px 28px' }}>
        <div style={{
          fontSize: 11, letterSpacing: 2, textTransform: 'uppercase', color: T.inkMuted, marginBottom: 14,
        }}>
          Habitude · {habit.type === 'duration' ? `${habit.goalMinutes} min` : 'Oui / Non'}
        </div>
        <div style={{ fontSize: 40, lineHeight: 1.05, letterSpacing: -0.8 }}>
          {habit.name}
          {habit.type === 'duration' && habit.goalMinutes && (
            <>
              <br />
              <em style={{ color: T.accent, fontStyle: 'normal' }}>{habit.goalMinutes} minutes</em>
            </>
          )}
        </div>
        <div style={{ marginTop: 12, display: 'flex', gap: 6, flexWrap: 'wrap' }}>
          {habit.frequency.map(d => (
            <span key={d} style={{
              fontSize: 11, padding: '3px 8px', borderRadius: 6,
              background: T.paperAlt, color: T.inkSoft, letterSpacing: 0.5,
            }}>
              {DAY_LETTERS[d]}
            </span>
          ))}
        </div>
      </div>

      {/* Streak card */}
      <div style={{
        margin: '0 20px 24px',
        padding: '24px',
        background: T.ink, color: T.paper, borderRadius: 20,
        display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between',
      }}>
        <div>
          <div style={{ fontSize: 11, letterSpacing: 2, textTransform: 'uppercase', opacity: 0.6, marginBottom: 6 }}>
            Série actuelle
          </div>
          <div style={{ fontSize: 64, lineHeight: 1, letterSpacing: -2, fontWeight: 300 }}>
            {streak}
          </div>
          <div style={{ fontSize: 13, opacity: 0.7, marginTop: 4 }}>
            jour{streak !== 1 ? 's' : ''} consécutif{streak !== 1 ? 's' : ''}
          </div>
        </div>
        <div style={{ textAlign: 'right', opacity: 0.6 }}>
          <div style={{ fontSize: 11, letterSpacing: 1.5, textTransform: 'uppercase' }}>Record</div>
          <div style={{ fontSize: 28, lineHeight: 1.2 }}>{best}</div>
        </div>
      </div>

      {/* Stats grid */}
      <div style={{
        display: 'grid', gridTemplateColumns: '1fr 1fr 1fr',
        margin: '0 20px 28px',
        borderRadius: 16, overflow: 'hidden',
        border: `1px solid ${T.rule}`,
      }}>
        {[
          { k: String(total),       l: 'Total' },
          { k: `${rate30}%`,        l: '30 jours' },
          { k: `${rate90}%`,        l: '3 mois' },
        ].map((s, i) => (
          <div key={i} style={{
            background: T.paperAlt,
            padding: '18px 10px',
            textAlign: 'center',
            borderLeft: i > 0 ? `1px solid ${T.rule}` : 'none',
          }}>
            <div style={{ fontSize: 26, color: T.ink, lineHeight: 1, fontWeight: 400 }}>{s.k}</div>
            <div style={{ fontSize: 10, color: T.inkMuted, marginTop: 6, letterSpacing: 1, textTransform: 'uppercase' }}>{s.l}</div>
          </div>
        ))}
      </div>

      {/* Heatmap */}
      <div style={{ padding: '0 24px' }}>
        <div style={{
          fontSize: 11, letterSpacing: 2, textTransform: 'uppercase', color: T.inkMuted, marginBottom: 14,
        }}>
          20 dernières semaines
        </div>
        <div style={{
          display: 'grid',
          gridTemplateColumns: `repeat(${WEEKS}, 1fr)`,
          gridTemplateRows: 'repeat(7, 1fr)',
          gap: 3,
          marginBottom: 10,
        }}>
          {heatmap.flatMap((week, w) =>
            week.map((done, d) => (
              <div key={`${w}-${d}`} style={{
                aspectRatio: '1',
                gridColumn: w + 1,
                gridRow: d + 1,
                background: done ? T.accent : T.paperAlt,
                borderRadius: 2,
                opacity: done ? 0.35 + (w / WEEKS) * 0.65 : 1,
              }} />
            ))
          )}
        </div>
        <div style={{
          display: 'flex', justifyContent: 'space-between',
          fontSize: 9, color: T.inkFaint, letterSpacing: 1, textTransform: 'uppercase',
        }}>
          <span>Il y a 20 sem</span>
          <span>Aujourd'hui</span>
        </div>
      </div>
    </div>
  );
}
