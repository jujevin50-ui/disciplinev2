import { useNavigate } from 'react-router-dom';
import { useApp, computeRate, computeStreak, computeGlobalStats } from '../context';
import { TabBar } from '../components/TabBar';
import { Icon } from '../components/Icon';

export function StatsScreen() {
  const { state, tokens: T } = useApp();
  const navigate = useNavigate();

  const { rate, weeklyRates } = computeGlobalStats(state.habits, state.logs, 84);
  const maxRate = Math.max(...weeklyRates, 1);

  const habitStats = state.habits.map(h => ({
    ...h,
    rate: computeRate(h.id, state.habits, state.logs, 30),
    streak: computeStreak(h.id, state.habits, state.logs),
  })).sort((a, b) => b.rate - a.rate);

  return (
    <div style={{ height: '100%', background: T.paper, position: 'relative', display: 'flex', flexDirection: 'column' }}>
      <div className="hide-scrollbar" style={{ flex: 1, overflowY: 'auto', paddingBottom: 110 }}>
        {/* Header */}
        <div style={{ padding: '52px 24px 10px' }}>
          <div style={{
            fontSize: 11, letterSpacing: 2, textTransform: 'uppercase', color: T.inkMuted, marginBottom: 10,
          }}>
            Statistiques
          </div>
          <div style={{ fontSize: 36, letterSpacing: -0.6, color: T.ink, lineHeight: 1.05 }}>
            Vos <em style={{ color: T.accent, fontStyle: 'normal' }}>progrès</em>.
          </div>
        </div>

        {/* Global rate card */}
        <div style={{
          padding: '24px', margin: '20px',
          background: T.ink, color: T.paper, borderRadius: 20,
        }}>
          <div style={{ fontSize: 11, letterSpacing: 2, textTransform: 'uppercase', opacity: 0.6 }}>
            Taux de réussite · 12 semaines
          </div>
          <div style={{
            fontSize: 80, lineHeight: 1, letterSpacing: -3, marginTop: 6, fontWeight: 300,
          }}>
            {rate}<span style={{ fontSize: 40, opacity: 0.5 }}>%</span>
          </div>

          {/* Weekly bar chart */}
          <div style={{
            marginTop: 20, display: 'flex', alignItems: 'flex-end', gap: 4, height: 44,
          }}>
            {weeklyRates.map((v, i) => (
              <div key={i} style={{
                flex: 1,
                height: `${(v / maxRate) * 100}%`,
                background: i === weeklyRates.length - 1 ? T.accent : 'rgba(255,255,255,0.28)',
                borderRadius: 2,
                minHeight: 2,
              }} />
            ))}
          </div>
          <div style={{
            display: 'flex', justifyContent: 'space-between', marginTop: 8,
            fontSize: 9, opacity: 0.45, letterSpacing: 1, textTransform: 'uppercase',
          }}>
            <span>Il y a 12 sem</span>
            <span>Cette sem</span>
          </div>
        </div>

        {/* Per-habit */}
        {habitStats.length === 0 ? (
          <div style={{ padding: '24px', textAlign: 'center', color: T.inkMuted }}>
            <div style={{ fontSize: 15, marginBottom: 8 }}>Aucune habitude encore.</div>
            <div style={{ fontSize: 13 }}>Ajoutez des habitudes depuis l'écran Aujourd'hui.</div>
          </div>
        ) : (
          <div style={{ padding: '0 24px' }}>
            <div style={{
              fontSize: 11, letterSpacing: 2, textTransform: 'uppercase', color: T.inkMuted, marginBottom: 14,
            }}>
              Par habitude · 30 jours
            </div>
            {habitStats.map(h => (
              <button
                key={h.id}
                onClick={() => navigate(`/habit/${h.id}`)}
                style={{
                  width: '100%', padding: '14px 0',
                  borderBottom: `1px solid ${T.rule}`,
                  textAlign: 'left',
                }}
              >
                <div style={{
                  display: 'flex', justifyContent: 'space-between',
                  alignItems: 'center', marginBottom: 8,
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <Icon name={h.icon} size={16} color={T.inkSoft} />
                    <span style={{ fontSize: 18, color: T.ink }}>{h.name}</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <span style={{
                      fontSize: 11, color: T.inkMuted,
                      display: 'flex', alignItems: 'center', gap: 3,
                    }}>
                      <Icon name="flame" size={11} color={T.inkMuted} />
                      {h.streak}
                    </span>
                    <span style={{
                      fontSize: 14, color: T.ink, fontWeight: 500,
                      fontVariantNumeric: 'tabular-nums',
                    }}>
                      {h.rate}%
                    </span>
                  </div>
                </div>
                <div style={{ height: 3, background: T.rule, borderRadius: 2, position: 'relative' }}>
                  <div style={{
                    position: 'absolute', inset: 0, width: `${h.rate}%`,
                    background: h.rate >= 80 ? T.done : h.rate >= 50 ? T.accent : T.inkMuted,
                    borderRadius: 2, transition: 'width .4s ease',
                  }} />
                </div>
              </button>
            ))}
          </div>
        )}
      </div>

      <TabBar />
    </div>
  );
}
