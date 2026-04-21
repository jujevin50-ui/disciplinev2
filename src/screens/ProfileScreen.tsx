import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp, computeBestStreak } from '../context';
import { TabBar } from '../components/TabBar';
import { Icon } from '../components/Icon';
import { today } from '../utils';

export function ProfileScreen() {
  const { state, tokens: T, setUserName, setTheme, signOut } = useApp();
  const navigate = useNavigate();
  const [editingName, setEditingName] = useState(false);
  const [nameInput, setNameInput] = useState(state.userName);
  const [confirmLogout, setConfirmLogout] = useState(false);

  const allStreaks = state.habits.map(h => computeBestStreak(h.id, state.habits, state.logs));
  const bestStreak = allStreaks.length ? Math.max(...allStreaks) : 0;
  const activeDays = new Set(state.logs.filter(l => l.completed).map(l => l.date)).size;

  const saveName = () => {
    if (nameInput.trim()) setUserName(nameInput.trim());
    setEditingName(false);
  };

  const exportData = () => {
    const data = JSON.stringify({ habits: state.habits, logs: state.logs }, null, 2);
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `discipline-export-${today()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleLogout = async () => {
    await signOut();
    navigate('/auth', { replace: true });
  };

  const initial = (state.userName || 'U')[0].toUpperCase();

  return (
    <div style={{ height: '100%', background: T.paper, position: 'relative', display: 'flex', flexDirection: 'column' }}>
      <div className="hide-scrollbar" style={{ flex: 1, overflowY: 'auto', paddingBottom: 110 }}>

        {/* Header */}
        <div style={{ padding: '52px 24px 24px' }}>
          <div style={{ fontSize: 11, letterSpacing: 2, textTransform: 'uppercase', color: T.inkMuted, marginBottom: 14 }}>
            Profil
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 18 }}>
            <div style={{
              width: 64, height: 64, borderRadius: 32,
              background: T.accent, color: '#fff',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 28, fontWeight: 500, flexShrink: 0,
            }}>
              {initial}
            </div>
            <div style={{ flex: 1 }}>
              {editingName ? (
                <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                  <input
                    autoFocus
                    value={nameInput}
                    onChange={e => setNameInput(e.target.value)}
                    onKeyDown={e => { if (e.key === 'Enter') saveName(); if (e.key === 'Escape') setEditingName(false); }}
                    style={{
                      fontSize: 20, color: T.ink, flex: 1,
                      borderBottom: `1.5px solid ${T.accent}`, paddingBottom: 4,
                    }}
                  />
                  <button onClick={saveName} style={{ color: T.accent, fontSize: 13, fontWeight: 600 }}>OK</button>
                </div>
              ) : (
                <button
                  onClick={() => { setNameInput(state.userName); setEditingName(true); }}
                  style={{ display: 'flex', alignItems: 'center', gap: 8, color: T.ink, textAlign: 'left' }}
                >
                  <span style={{ fontSize: 24, lineHeight: 1.1 }}>{state.userName || 'Votre nom'}</span>
                  <Icon name="edit" size={14} color={T.inkMuted} />
                </button>
              )}
              <div style={{ fontSize: 12, color: T.inkMuted, marginTop: 4 }}>
                {state.habits.length} habitude{state.habits.length !== 1 ? 's' : ''} actives
              </div>
            </div>
          </div>
        </div>

        {/* Quote */}
        <div style={{ margin: '0 20px 24px', padding: '20px 22px', background: T.paperAlt, borderRadius: 18 }}>
          <div style={{ fontSize: 17, lineHeight: 1.4, color: T.ink }}>
            « Nous sommes ce que nous faisons de manière répétée. »
          </div>
          <div style={{ fontSize: 11, color: T.inkMuted, marginTop: 10, letterSpacing: 1, textTransform: 'uppercase' }}>
            — Aristote
          </div>
        </div>

        {/* Stats */}
        <div style={{ margin: '0 20px 28px', display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)' }}>
          {[
            { k: String(state.habits.length), l: 'Habitudes' },
            { k: String(activeDays),          l: 'Jours actifs' },
            { k: String(bestStreak),          l: 'Meilleure série' },
          ].map((s, i) => (
            <div key={i} style={{
              textAlign: 'center', padding: '8px 0',
              borderLeft: i > 0 ? `1px solid ${T.rule}` : 'none',
            }}>
              <div style={{ fontSize: 28, color: T.ink, lineHeight: 1 }}>{s.k}</div>
              <div style={{ fontSize: 10, letterSpacing: 1.2, textTransform: 'uppercase', color: T.inkMuted, marginTop: 6 }}>{s.l}</div>
            </div>
          ))}
        </div>

        {/* Habitudes */}
        {state.habits.length > 0 && (
          <div style={{ marginBottom: 20 }}>
            <div style={{ fontSize: 11, letterSpacing: 2, textTransform: 'uppercase', color: T.inkMuted, padding: '0 28px 10px' }}>
              Mes habitudes
            </div>
            <div style={{ background: T.paperAlt, margin: '0 20px', borderRadius: 16, overflow: 'hidden', border: `1px solid ${T.rule}` }}>
              {state.habits.map((h, i) => (
                <button key={h.id} onClick={() => navigate(`/habit/${h.id}`)} style={{
                  display: 'flex', alignItems: 'center', gap: 14,
                  padding: '14px 16px', width: '100%', textAlign: 'left',
                  borderBottom: i < state.habits.length - 1 ? `1px solid ${T.rule}` : 'none',
                  color: T.ink,
                }}>
                  <Icon name={h.icon} size={18} color={T.inkSoft} />
                  <div style={{ flex: 1, fontSize: 15 }}>{h.name}</div>
                  <Icon name="chevron" size={14} color={T.inkFaint} />
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Préférences */}
        <div style={{ marginBottom: 20 }}>
          <div style={{ fontSize: 11, letterSpacing: 2, textTransform: 'uppercase', color: T.inkMuted, padding: '0 28px 10px' }}>
            Préférences
          </div>
          <div style={{ background: T.paperAlt, margin: '0 20px', borderRadius: 16, overflow: 'hidden', border: `1px solid ${T.rule}` }}>
            {/* Thème */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '14px 16px', borderBottom: `1px solid ${T.rule}` }}>
              <Icon name={state.theme === 'dark' ? 'moon' : 'sun'} size={18} color={T.inkSoft} />
              <div style={{ flex: 1, fontSize: 15, color: T.ink }}>
                {state.theme === 'dark' ? 'Mode sombre' : 'Mode clair'}
              </div>
              <button
                onClick={() => setTheme(state.theme === 'dark' ? 'light' : 'dark')}
                style={{ width: 44, height: 26, borderRadius: 13, background: state.theme === 'dark' ? T.accent : T.ruleStrong, position: 'relative' }}
              >
                <div style={{
                  position: 'absolute', top: 3, left: state.theme === 'dark' ? 21 : 3,
                  width: 20, height: 20, borderRadius: 10, background: '#fff', transition: 'left .2s',
                }} />
              </button>
            </div>
            {/* Export */}
            <button onClick={exportData} style={{
              display: 'flex', alignItems: 'center', gap: 14, padding: '14px 16px',
              width: '100%', textAlign: 'left', color: T.ink,
            }}>
              <Icon name="book" size={18} color={T.inkSoft} />
              <div style={{ flex: 1, fontSize: 15 }}>Exporter mes données</div>
              <Icon name="chevron" size={14} color={T.inkFaint} />
            </button>
          </div>
        </div>

        {/* Déconnexion */}
        <div style={{ margin: '0 20px 32px' }}>
          {confirmLogout ? (
            <div style={{ padding: 16, background: T.paperAlt, borderRadius: 16, border: `1px solid ${T.ruleStrong}` }}>
              <div style={{ fontSize: 14, color: T.ink, fontWeight: 500, marginBottom: 6 }}>
                Réinitialiser le compte ?
              </div>
              <div style={{ fontSize: 13, color: T.inkMuted, marginBottom: 16 }}>
                Toutes vos habitudes et données seront supprimées.
              </div>
              <div style={{ display: 'flex', gap: 8 }}>
                <button onClick={() => setConfirmLogout(false)} style={{
                  flex: 1, padding: '10px', borderRadius: 10,
                  border: `1px solid ${T.ruleStrong}`, color: T.inkSoft, fontSize: 14,
                }}>Annuler</button>
                <button onClick={handleLogout} style={{
                  flex: 1, padding: '10px', borderRadius: 10,
                  background: '#dc2626', color: '#fff', fontSize: 14, fontWeight: 600,
                }}>Réinitialiser</button>
              </div>
            </div>
          ) : (
            <button onClick={() => setConfirmLogout(true)} style={{
              width: '100%', padding: '14px', borderRadius: 14,
              border: `1.5px solid ${T.ruleStrong}`, color: T.inkMuted,
              fontSize: 14, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
            }}>
              <Icon name="x" size={16} color={T.inkMuted} />
              Réinitialiser le compte
            </button>
          )}
        </div>

        <div style={{ textAlign: 'center', fontSize: 11, color: T.inkFaint, letterSpacing: 1, textTransform: 'uppercase', paddingBottom: 8 }}>
          Discipline v2
        </div>
      </div>

      <TabBar />
    </div>
  );
}
