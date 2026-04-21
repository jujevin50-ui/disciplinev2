import { useNavigate } from 'react-router-dom';
import { useApp, computeStreak } from '../context';
import { TabBar } from '../components/TabBar';
import { Icon } from '../components/Icon';
import { today, formatDisplayDate, getDow } from '../utils';

export function TodayScreen() {
  const { state, tokens: T, toggleLog } = useApp();
  const navigate = useNavigate();
  const todayStr = today();
  const todayDow = getDow(todayStr);

  const habits = state.habits
    .filter(h => h.frequency.includes(todayDow))
    .map(h => ({
      ...h,
      done: state.logs.some(l => l.habitId === h.id && l.date === todayStr && l.completed),
      streak: computeStreak(h.id, state.habits, state.logs),
    }));

  const doneCount = habits.filter(h => h.done).length;
  const total = habits.length;
  const progress = total > 0 ? doneCount / total : 0;

  const displayDate = formatDisplayDate(todayStr);

  return (
    <div style={{ height: '100%', background: T.paper, position: 'relative', display: 'flex', flexDirection: 'column' }}>
      {/* Header */}
      <div style={{ padding: '56px 24px 16px' }}>
        <div style={{
          fontSize: 11, letterSpacing: 2, textTransform: 'uppercase',
          color: T.inkMuted, marginBottom: 10,
        }}>
          {displayDate}
        </div>
        <div style={{ fontSize: 36, lineHeight: 1, color: T.ink, letterSpacing: -0.6, marginBottom: 8 }}>
          Bonjour, <em style={{ color: T.accent, fontStyle: 'normal' }}>{state.userName || 'toi'}</em>.
        </div>
        <div style={{
          fontSize: 13, color: T.inkSoft, display: 'flex', alignItems: 'center', gap: 6, marginBottom: 16,
        }}>
          <span style={{ fontVariantNumeric: 'tabular-nums' }}>{doneCount} sur {total}</span>
          {total > 0 && (
            <>
              <span style={{ color: T.inkFaint }}>·</span>
              <Icon name="flame" size={13} color={T.accent} />
              <span style={{ fontWeight: 500, fontVariantNumeric: 'tabular-nums' }}>
                {Math.max(...habits.map(h => h.streak), 0)} jours
              </span>
            </>
          )}
        </div>

        {/* Progress bar */}
        <div style={{ height: 2, background: T.rule, borderRadius: 2, position: 'relative' }}>
          <div style={{
            position: 'absolute', left: 0, top: 0, bottom: 0,
            width: `${progress * 100}%`,
            background: T.ink, borderRadius: 2,
            transition: 'width .3s ease',
          }} />
        </div>
      </div>

      {/* Habit list */}
      <div
        className="hide-scrollbar"
        style={{ flex: 1, overflowY: 'auto', padding: '0 16px', paddingBottom: 110 }}
      >
        {habits.length === 0 ? (
          <div style={{
            textAlign: 'center', color: T.inkMuted,
            padding: '60px 24px',
          }}>
            <div style={{ fontSize: 15, marginBottom: 8 }}>Aucune habitude pour aujourd'hui.</div>
            <div style={{ fontSize: 13 }}>Appuyez sur + pour en ajouter une.</div>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {habits.map(h => (
              <button
                key={h.id}
                onClick={() => toggleLog(h.id, todayStr)}
                style={{
                  display: 'flex', alignItems: 'center', gap: 14,
                  padding: '16px',
                  borderRadius: 16,
                  background: h.done ? T.doneSoft : T.paperAlt,
                  border: 'none',
                  opacity: h.done ? 0.7 : 1,
                  transition: 'all .18s',
                  textAlign: 'left',
                  cursor: 'pointer',
                }}
              >
                {/* Check button */}
                <div style={{
                  width: 32, height: 32, borderRadius: 16, flexShrink: 0,
                  border: `1.5px solid ${h.done ? T.done : T.ruleStrong}`,
                  background: h.done ? T.done : 'transparent',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  color: T.paper,
                }}>
                  {h.done && <Icon name="check" size={15} strokeWidth={2.5} />}
                </div>

                {/* Info */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{
                    fontSize: 16, fontWeight: 500, color: T.ink,
                    textDecoration: h.done ? 'line-through' : 'none',
                    textDecorationColor: T.inkMuted,
                  }}>
                    {h.name}
                  </div>
                  <div style={{
                    fontSize: 12, color: T.inkMuted, marginTop: 2,
                    display: 'flex', alignItems: 'center', gap: 6,
                  }}>
                    {h.type === 'duration' && h.goalMinutes && (
                      <span>{h.goalMinutes} min</span>
                    )}
                    {h.type === 'boolean' && <span>Oui / Non</span>}
                    <span style={{ color: T.inkFaint }}>·</span>
                    <Icon name="flame" size={11} color={T.inkMuted} />
                    <span style={{ fontVariantNumeric: 'tabular-nums' }}>{h.streak}</span>
                  </div>
                </div>

                <div style={{ color: T.inkFaint, flexShrink: 0 }}>
                  <Icon name="chevron" size={15} />
                </div>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* FAB */}
      <button
        onClick={() => navigate('/create')}
        style={{
          position: 'absolute', right: 24, bottom: 98,
          width: 52, height: 52, borderRadius: 26,
          background: T.ink, color: T.paper,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          boxShadow: '0 6px 20px rgba(0,0,0,0.2)',
          zIndex: 50,
        }}
      >
        <Icon name="plus" size={22} strokeWidth={2} color={T.paper} />
      </button>

      <TabBar />
    </div>
  );
}
