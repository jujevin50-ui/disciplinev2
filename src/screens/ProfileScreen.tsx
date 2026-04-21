import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp, computeBestStreak } from '../context';
import { TabBar } from '../components/TabBar';
import { Icon } from '../components/Icon';
import { today } from '../utils';

const NUMPAD = ['1','2','3','4','5','6','7','8','9','','0','⌫'];

export function ProfileScreen() {
  const { state, tokens: T, setUserName, setTheme, setPin } = useApp();
  const navigate = useNavigate();
  const [editingName, setEditingName] = useState(false);
  const [nameInput, setNameInput] = useState(state.userName);
  const [changingPin, setChangingPin] = useState(false);
  const [newPin, setNewPin] = useState('');
  const [newPinConfirm, setNewPinConfirm] = useState('');
  const [pinPhase, setPinPhase] = useState<'create'|'confirm'>('create');
  const [pinError, setPinError] = useState(false);

  const pressNewPin = (key: string) => {
    const isConfirm = pinPhase === 'confirm';
    const current = isConfirm ? newPinConfirm : newPin;
    if (key === '⌫') {
      if (isConfirm) setNewPinConfirm(p => p.slice(0,-1));
      else setNewPin(p => p.slice(0,-1));
      setPinError(false);
      return;
    }
    if (current.length >= 4) return;
    const after = current + key;
    if (isConfirm) {
      setNewPinConfirm(after);
      if (after.length === 4) {
        if (newPin === after) {
          setPin(newPin);
          setChangingPin(false);
          setNewPin(''); setNewPinConfirm('');
          setPinPhase('create');
        } else {
          setPinError(true);
          setTimeout(() => { setNewPinConfirm(''); setPinError(false); }, 600);
        }
      }
    } else {
      setNewPin(after);
      if (after.length === 4) setPinPhase('confirm');
    }
  };

  // Compute global stats
  const allStreaks = state.habits.map(h => computeBestStreak(h.id, state.habits, state.logs));
  const bestStreak = allStreaks.length ? Math.max(...allStreaks) : 0;

  // Count active days (days with at least one completion)
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

  const initial = (state.userName || 'U')[0].toUpperCase();

  return (
    <div style={{ height: '100%', background: T.paper, position: 'relative', display: 'flex', flexDirection: 'column' }}>
      <div className="hide-scrollbar" style={{ flex: 1, overflowY: 'auto', paddingBottom: 110 }}>
        {/* Header */}
        <div style={{ padding: '52px 24px 24px' }}>
          <div style={{
            fontSize: 11, letterSpacing: 2, textTransform: 'uppercase', color: T.inkMuted, marginBottom: 14,
          }}>
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
                  style={{
                    display: 'flex', alignItems: 'center', gap: 8,
                    color: T.ink, textAlign: 'left',
                  }}
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
        <div style={{
          margin: '0 20px 24px', padding: '20px 22px',
          background: T.paperAlt, borderRadius: 18,
        }}>
          <div style={{ fontSize: 17, lineHeight: 1.4, color: T.ink }}>
            « Nous sommes ce que nous faisons de manière répétée. »
          </div>
          <div style={{
            fontSize: 11, color: T.inkMuted, marginTop: 10, letterSpacing: 1, textTransform: 'uppercase',
          }}>
            — Aristote
          </div>
        </div>

        {/* Stats */}
        <div style={{
          margin: '0 20px 28px',
          display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)',
        }}>
          {[
            { k: String(state.habits.length), l: 'Habitudes' },
            { k: String(activeDays),          l: 'Jours actifs' },
            { k: String(bestStreak),          l: 'Meilleure série' },
          ].map((s, i) => (
            <div key={i} style={{
              textAlign: 'center',
              borderLeft: i > 0 ? `1px solid ${T.rule}` : 'none',
              padding: '8px 0',
            }}>
              <div style={{ fontSize: 28, color: T.ink, lineHeight: 1 }}>{s.k}</div>
              <div style={{
                fontSize: 10, letterSpacing: 1.2, textTransform: 'uppercase',
                color: T.inkMuted, marginTop: 6,
              }}>{s.l}</div>
            </div>
          ))}
        </div>

        {/* Habitudes list */}
        {state.habits.length > 0 && (
          <div style={{ marginBottom: 20 }}>
            <div style={{
              fontSize: 11, letterSpacing: 2, textTransform: 'uppercase', color: T.inkMuted,
              padding: '0 28px 10px',
            }}>Mes habitudes</div>
            <div style={{
              background: T.paperAlt, margin: '0 20px', borderRadius: 16,
              overflow: 'hidden', border: `1px solid ${T.rule}`,
            }}>
              {state.habits.map((h, i) => (
                <button
                  key={h.id}
                  onClick={() => navigate(`/habit/${h.id}`)}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 14,
                    padding: '14px 16px', width: '100%', textAlign: 'left',
                    borderBottom: i < state.habits.length - 1 ? `1px solid ${T.rule}` : 'none',
                    color: T.ink,
                  }}
                >
                  <Icon name={h.icon} size={18} color={T.inkSoft} />
                  <div style={{ flex: 1, fontSize: 15 }}>{h.name}</div>
                  <Icon name="chevron" size={14} color={T.inkFaint} />
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Settings */}
        <div style={{ marginBottom: 20 }}>
          <div style={{
            fontSize: 11, letterSpacing: 2, textTransform: 'uppercase', color: T.inkMuted,
            padding: '0 28px 10px',
          }}>Préférences</div>
          <div style={{
            background: T.paperAlt, margin: '0 20px', borderRadius: 16,
            overflow: 'hidden', border: `1px solid ${T.rule}`,
          }}>
            {/* Theme toggle */}
            <div style={{
              display: 'flex', alignItems: 'center', gap: 14,
              padding: '14px 16px',
              borderBottom: `1px solid ${T.rule}`,
            }}>
              <Icon name={state.theme === 'dark' ? 'moon' : 'sun'} size={18} color={T.inkSoft} />
              <div style={{ flex: 1, fontSize: 15, color: T.ink }}>
                {state.theme === 'dark' ? 'Mode sombre' : 'Mode clair'}
              </div>
              <button
                onClick={() => setTheme(state.theme === 'dark' ? 'light' : 'dark')}
                style={{
                  width: 44, height: 26, borderRadius: 13,
                  background: state.theme === 'dark' ? T.accent : T.ruleStrong,
                  position: 'relative',
                }}
              >
                <div style={{
                  position: 'absolute', top: 3,
                  left: state.theme === 'dark' ? 21 : 3,
                  width: 20, height: 20, borderRadius: 10,
                  background: '#fff', transition: 'left .2s',
                }} />
              </button>
            </div>

            {/* Change PIN */}
            <button
              onClick={() => { setChangingPin(true); setNewPin(''); setNewPinConfirm(''); setPinPhase('create'); }}
              style={{
                display: 'flex', alignItems: 'center', gap: 14,
                padding: '14px 16px', width: '100%', textAlign: 'left',
                borderTop: `1px solid ${T.rule}`, color: T.ink,
              }}
            >
              <Icon name="settings" size={18} color={T.inkSoft} />
              <div style={{ flex: 1, fontSize: 15 }}>Changer le code PIN</div>
              <Icon name="chevron" size={14} color={T.inkFaint} />
            </button>

            {/* Export */}
            <button
              onClick={exportData}
              style={{
                display: 'flex', alignItems: 'center', gap: 14,
                padding: '14px 16px', width: '100%', textAlign: 'left',
                borderTop: `1px solid ${T.rule}`, color: T.ink,
              }}
            >
              <Icon name="book" size={18} color={T.inkSoft} />
              <div style={{ flex: 1, fontSize: 15 }}>Exporter mes données</div>
              <Icon name="chevron" size={14} color={T.inkFaint} />
            </button>
          </div>
        </div>

        {/* PIN change modal */}
        {changingPin && (
          <div style={{
            position: 'fixed', inset: 0, zIndex: 200,
            background: 'rgba(0,0,0,0.5)',
            display: 'flex', alignItems: 'flex-end', justifyContent: 'center',
          }}
            onClick={() => setChangingPin(false)}
          >
            <div
              onClick={e => e.stopPropagation()}
              style={{
                width: '100%', maxWidth: 430,
                background: T.paper, borderRadius: '24px 24px 0 0',
                padding: '28px 28px 40px',
                display: 'flex', flexDirection: 'column', alignItems: 'center',
              }}
            >
              <div style={{ fontSize: 18, fontWeight: 500, color: T.ink, marginBottom: 6 }}>
                {pinPhase === 'create' ? 'Nouveau code PIN' : 'Confirmer le code'}
              </div>
              <div style={{ fontSize: 13, color: T.inkMuted, marginBottom: 28 }}>
                {pinPhase === 'create' ? 'Choisissez 4 chiffres' : 'Saisissez à nouveau'}
              </div>

              {/* Dots */}
              <div style={{ display: 'flex', gap: 20, marginBottom: 32,
                animation: pinError ? 'shake .5s ease' : 'none',
              }}>
                {[0,1,2,3].map(i => {
                  const cur = pinPhase === 'confirm' ? newPinConfirm : newPin;
                  return (
                    <div key={i} style={{
                      width: 14, height: 14, borderRadius: 7,
                      background: i < cur.length ? (pinError ? '#dc2626' : T.ink) : T.ruleStrong,
                      transition: 'background .15s',
                    }} />
                  );
                })}
              </div>

              {/* Numpad */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10, width: '100%', maxWidth: 280 }}>
                {NUMPAD.map((key, i) => (
                  <button key={i} onClick={() => key !== '' && pressNewPin(key)} disabled={key === ''} style={{
                    height: 60, borderRadius: 16,
                    background: key === '' ? 'transparent' : T.paperAlt,
                    border: 'none', fontSize: key === '⌫' ? 16 : 24, fontWeight: 300,
                    color: key === '' ? 'transparent' : T.ink,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    cursor: key === '' ? 'default' : 'pointer',
                  }}>
                    {key === '⌫' ? <Icon name="x" size={16} color={T.inkSoft} /> : key}
                  </button>
                ))}
              </div>

              <button onClick={() => setChangingPin(false)} style={{
                marginTop: 20, color: T.inkMuted, fontSize: 13,
              }}>Annuler</button>
            </div>
          </div>
        )}

        {/* Version */}
        <div style={{
          textAlign: 'center', fontSize: 11, color: T.inkFaint,
          letterSpacing: 1, textTransform: 'uppercase', paddingBottom: 8,
        }}>
          Discipline v2 · {today().slice(0, 7)}
        </div>
      </div>

      <TabBar />
    </div>
  );
}
