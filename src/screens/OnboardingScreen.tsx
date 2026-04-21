import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp, activateSession } from '../context';
import { Icon } from '../components/Icon';
import type { Habit, IconName } from '../types';

type HabitDef = Omit<Habit, 'id' | 'createdAt'>;

const SUGGESTIONS: HabitDef[] = [
  { name: 'Lire',           icon: 'book',    type: 'duration', goalMinutes: 20, frequency: [0,1,2,3,4,5,6] },
  { name: 'Méditer',        icon: 'leaf',    type: 'duration', goalMinutes: 10, frequency: [0,1,2,3,4,5,6] },
  { name: 'Bouger',         icon: 'run',     type: 'boolean',                   frequency: [0,1,2,3,4] },
  { name: "Boire de l'eau", icon: 'droplet', type: 'boolean',                   frequency: [0,1,2,3,4,5,6] },
  { name: 'Se coucher tôt', icon: 'moon',   type: 'boolean',                   frequency: [0,1,2,3,4,5,6] },
  { name: 'Journaling',     icon: 'pen',     type: 'duration', goalMinutes: 10, frequency: [0,1,2,3,4,5,6] },
];

const NUMPAD = ['1','2','3','4','5','6','7','8','9','','0','⌫'];

export function OnboardingScreen() {
  const { tokens: T, finishOnboarding } = useApp();
  const navigate = useNavigate();
  const [step, setStep] = useState(0);
  const [name, setName] = useState('');
  const [selected, setSelected] = useState<Set<number>>(new Set([0, 1, 3]));
  const [pin, setPin] = useState('');
  const [pinConfirm, setPinConfirm] = useState('');
  const [pinStep, setPinStep] = useState<'create' | 'confirm'>('create');
  const [pinError, setPinError] = useState(false);

  const toggle = (i: number) => {
    setSelected(prev => {
      const next = new Set(prev);
      if (next.has(i)) next.delete(i);
      else next.add(i);
      return next;
    });
  };

  const pressPin = (key: string, isConfirm: boolean) => {
    const current = isConfirm ? pinConfirm : pin;
    const setter = isConfirm ? setPinConfirm : setPin;
    if (key === '⌫') {
      setter(p => p.slice(0, -1));
      setPinError(false);
    } else if (current.length < 4) {
      setter(p => p + key);
    }
  };

  const currentPin = pinStep === 'create' ? pin : pinConfirm;

  const finish = (finalPin: string) => {
    const habits = SUGGESTIONS.filter((_, i) => selected.has(i));
    finishOnboarding(habits, name || 'Toi', finalPin);
    activateSession();
    navigate('/today', { replace: true });
  };

  // Progress steps: 0=welcome, 1=habits, 2=pin, 3=done
  const TOTAL_STEPS = 3;

  return (
    <div style={{ height: '100%', background: T.paper, color: T.ink, display: 'flex', flexDirection: 'column' }}>
      {/* Progress bar */}
      <div style={{ display: 'flex', gap: 5, padding: '56px 28px 0' }}>
        {Array.from({ length: TOTAL_STEPS }).map((_, i) => (
          <div key={i} style={{
            flex: 1, height: 2, borderRadius: 2,
            background: i < step ? T.accent : i === step ? T.ink : T.rule,
            transition: 'background .3s',
          }} />
        ))}
      </div>

      {/* ── Step 0: Name ── */}
      {step === 0 && (
        <div style={{ flex: 1, padding: '40px 28px 40px', display: 'flex', flexDirection: 'column' }}>
          <div style={{ fontSize: 11, letterSpacing: 2, textTransform: 'uppercase', color: T.inkMuted, marginBottom: 20 }}>
            Étape 1 sur 3
          </div>
          <h1 style={{ fontSize: 44, fontWeight: 400, lineHeight: 1.05, letterSpacing: -0.8, margin: '0 0 16px' }}>
            Bienvenue dans<br />
            <em style={{ color: T.accent, fontStyle: 'normal' }}>Discipline</em>.
          </h1>
          <p style={{ fontSize: 15, color: T.inkSoft, lineHeight: 1.5, margin: '0 0 32px', maxWidth: 280 }}>
            Construisez des habitudes durables, une journée à la fois.
          </p>
          <div style={{ fontSize: 11, letterSpacing: 1.5, textTransform: 'uppercase', color: T.inkMuted, marginBottom: 10 }}>
            Votre prénom
          </div>
          <input
            autoFocus
            value={name}
            onChange={e => setName(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter' && name.trim()) setStep(1); }}
            placeholder="Entrez votre prénom"
            style={{
              fontSize: 26, color: T.ink, width: '100%',
              borderBottom: `1.5px solid ${T.ruleStrong}`, paddingBottom: 10,
              marginBottom: 40, caretColor: T.accent,
            }}
          />
          <div style={{ flex: 1 }} />
          <button
            onClick={() => setStep(1)}
            disabled={!name.trim()}
            style={{
              width: '100%', height: 54, borderRadius: 14,
              background: name.trim() ? T.ink : T.paperAlt,
              color: name.trim() ? T.paper : T.inkMuted,
              fontSize: 15, fontWeight: 600,
            }}
          >
            Continuer →
          </button>
        </div>
      )}

      {/* ── Step 1: Habits ── */}
      {step === 1 && (
        <div style={{ flex: 1, padding: '32px 28px 40px', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
          <div style={{ fontSize: 11, letterSpacing: 2, textTransform: 'uppercase', color: T.inkMuted, marginBottom: 20 }}>
            Étape 2 sur 3
          </div>
          <h1 style={{ fontSize: 40, fontWeight: 400, lineHeight: 1.05, letterSpacing: -0.8, margin: '0 0 12px' }}>
            Par quoi<br />
            <em style={{ color: T.accent, fontStyle: 'normal' }}>commencer</em> ?
          </h1>
          <p style={{ fontSize: 14, color: T.inkSoft, margin: '0 0 20px' }}>
            Sélectionnez 2 ou 3 habitudes pour débuter.
          </p>
          <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 8 }} className="hide-scrollbar">
            {SUGGESTIONS.map((s, i) => {
              const on = selected.has(i);
              return (
                <button key={i} onClick={() => toggle(i)} style={{
                  display: 'flex', alignItems: 'center', gap: 14,
                  padding: '14px 16px',
                  background: on ? T.ink : 'transparent',
                  border: `1.5px solid ${on ? T.ink : T.ruleStrong}`,
                  borderRadius: 14,
                  color: on ? T.paper : T.ink,
                  transition: 'all .18s', textAlign: 'left',
                }}>
                  <div style={{
                    width: 34, height: 34, borderRadius: 10,
                    background: on ? 'rgba(255,255,255,0.12)' : T.paperAlt,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    color: on ? T.paper : T.ink, flexShrink: 0,
                  }}>
                    <Icon name={s.icon as IconName} size={18} />
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 15, fontWeight: 500 }}>{s.name}</div>
                    <div style={{ fontSize: 12, opacity: 0.6, marginTop: 2 }}>
                      {s.type === 'duration' ? `${s.goalMinutes} min · quotidien` : 'Quotidien'}
                    </div>
                  </div>
                  <div style={{
                    width: 22, height: 22, borderRadius: 11,
                    border: `1.5px solid ${on ? T.paper : T.ruleStrong}`,
                    background: on ? T.paper : 'transparent',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    color: T.ink, flexShrink: 0,
                  }}>
                    {on && <Icon name="check" size={12} strokeWidth={2.5} />}
                  </div>
                </button>
              );
            })}
          </div>
          <div style={{ display: 'flex', gap: 10, marginTop: 16 }}>
            <button onClick={() => setStep(0)} style={{
              flex: 1, height: 54, borderRadius: 14,
              border: `1.5px solid ${T.ruleStrong}`, color: T.inkSoft, fontSize: 15,
            }}>← Retour</button>
            <button onClick={() => setStep(2)} disabled={selected.size === 0} style={{
              flex: 2, height: 54, borderRadius: 14,
              background: selected.size === 0 ? T.paperAlt : T.ink,
              color: selected.size === 0 ? T.inkMuted : T.paper,
              fontSize: 15, fontWeight: 600,
            }}>Continuer →</button>
          </div>
        </div>
      )}

      {/* ── Step 2: PIN ── */}
      {step === 2 && (
        <div style={{ flex: 1, padding: '32px 28px 40px', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          <div style={{ fontSize: 11, letterSpacing: 2, textTransform: 'uppercase', color: T.inkMuted, marginBottom: 20, alignSelf: 'flex-start' }}>
            Étape 3 sur 3
          </div>
          <div style={{ fontSize: 36, fontWeight: 400, lineHeight: 1.05, letterSpacing: -0.6, marginBottom: 8, alignSelf: 'flex-start' }}>
            {pinStep === 'create' ? (
              <>Choisissez votre <em style={{ color: T.accent, fontStyle: 'normal' }}>code PIN</em></>
            ) : (
              <>Confirmez votre <em style={{ color: T.accent, fontStyle: 'normal' }}>code PIN</em></>
            )}
          </div>
          <p style={{ fontSize: 14, color: T.inkSoft, margin: '0 0 32px', alignSelf: 'flex-start' }}>
            {pinStep === 'create'
              ? 'Ce code vous sera demandé à chaque ouverture.'
              : 'Saisissez à nouveau le même code pour confirmer.'}
          </p>

          {/* Dots */}
          <div style={{
            display: 'flex', gap: 20, marginBottom: 40,
            animation: pinError ? 'shake .5s ease' : 'none',
          }}>
            <style>{`@keyframes shake{0%,100%{transform:translateX(0)}15%{transform:translateX(-10px)}30%{transform:translateX(10px)}45%{transform:translateX(-8px)}60%{transform:translateX(8px)}75%{transform:translateX(-4px)}90%{transform:translateX(4px)}}`}</style>
            {[0,1,2,3].map(i => (
              <div key={i} style={{
                width: 16, height: 16, borderRadius: 8,
                background: i < currentPin.length ? (pinError ? '#dc2626' : T.ink) : T.ruleStrong,
                transition: 'background .15s',
              }} />
            ))}
          </div>

          {/* Numpad */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10, width: '100%', maxWidth: 280 }}>
            {NUMPAD.map((key, i) => (
              <button
                key={i}
                onClick={() => {
                  if (key === '') return;
                  pressPin(key, pinStep === 'confirm');
                  // Check auto-advance after state update
                  if (key !== '⌫') {
                    const after = (pinStep === 'confirm' ? pinConfirm : pin) + key;
                    if (after.length === 4) {
                      if (pinStep === 'create') {
                        setPin(after);
                        setPinStep('confirm');
                      } else {
                        setPinConfirm(after);
                        if (pin === after) {
                          finish(pin);
                        } else {
                          setPinError(true);
                          setTimeout(() => {
                            setPinConfirm('');
                            setPinError(false);
                          }, 600);
                        }
                      }
                    }
                  }
                }}
                disabled={key === ''}
                style={{
                  height: 64, borderRadius: 18,
                  background: key === '' ? 'transparent' : T.paperAlt,
                  border: 'none',
                  fontSize: key === '⌫' ? 16 : 26,
                  fontWeight: 300, color: key === '' ? 'transparent' : T.ink,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  cursor: key === '' ? 'default' : 'pointer',
                }}
              >
                {key === '⌫' ? <Icon name="x" size={18} color={T.inkSoft} /> : key}
              </button>
            ))}
          </div>

          <button onClick={() => setStep(1)} style={{
            marginTop: 'auto', color: T.inkMuted, fontSize: 13, paddingTop: 24,
          }}>← Retour</button>
        </div>
      )}
    </div>
  );
}
