import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../context';
import { Icon } from '../components/Icon';
import type { Habit, IconName } from '../types';

type HabitDef = Omit<Habit, 'id' | 'createdAt'>;

const SUGGESTIONS: HabitDef[] = [
  { name: 'Lire',          icon: 'book',     type: 'duration', goalMinutes: 20, frequency: [0,1,2,3,4,5,6] },
  { name: 'Méditer',       icon: 'leaf',     type: 'duration', goalMinutes: 10, frequency: [0,1,2,3,4,5,6] },
  { name: 'Bouger',        icon: 'run',      type: 'boolean',                   frequency: [0,1,2,3,4] },
  { name: 'Boire de l\'eau', icon: 'droplet', type: 'boolean',                  frequency: [0,1,2,3,4,5,6] },
  { name: 'Se coucher tôt', icon: 'moon',    type: 'boolean',                   frequency: [0,1,2,3,4,5,6] },
  { name: 'Journaling',    icon: 'pen',      type: 'duration', goalMinutes: 10, frequency: [0,1,2,3,4,5,6] },
];

export function OnboardingScreen() {
  const { tokens, finishOnboarding } = useApp();
  const navigate = useNavigate();
  const [step, setStep] = useState(0);
  const [name, setName] = useState('');
  const [selected, setSelected] = useState<Set<number>>(new Set([0, 1, 3]));

  const T = tokens;

  const toggle = (i: number) => {
    setSelected(prev => {
      const next = new Set(prev);
      if (next.has(i)) next.delete(i);
      else next.add(i);
      return next;
    });
  };

  const finish = () => {
    const habits = SUGGESTIONS.filter((_, i) => selected.has(i));
    finishOnboarding(habits, name || 'Toi');
    navigate('/today', { replace: true });
  };

  return (
    <div style={{ height: '100%', background: T.paper, color: T.ink, display: 'flex', flexDirection: 'column' }}>
      {/* Progress bar */}
      <div style={{ display: 'flex', gap: 5, padding: '56px 28px 0' }}>
        {[0, 1, 2].map(i => (
          <div key={i} style={{
            flex: 1, height: 2, borderRadius: 2,
            background: i <= step ? T.ink : T.rule,
            transition: 'background .3s',
          }} />
        ))}
      </div>

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
            placeholder="Entrez votre prénom"
            style={{
              fontSize: 26, color: T.ink,
              borderBottom: `1.5px solid ${T.ruleStrong}`,
              paddingBottom: 10, marginBottom: 40,
              width: '100%', caretColor: T.accent,
            }}
          />
          <div style={{ flex: 1 }} />
          <button
            onClick={() => setStep(1)}
            style={{
              width: '100%', height: 54, borderRadius: 14,
              background: T.ink, color: T.paper,
              fontSize: 15, fontWeight: 600, letterSpacing: -0.2,
            }}
          >
            Continuer →
          </button>
        </div>
      )}

      {step === 1 && (
        <div style={{ flex: 1, padding: '32px 28px 40px', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
          <div style={{ fontSize: 11, letterSpacing: 2, textTransform: 'uppercase', color: T.inkMuted, marginBottom: 20 }}>
            Étape 2 sur 3
          </div>
          <h1 style={{ fontSize: 40, fontWeight: 400, lineHeight: 1.05, letterSpacing: -0.8, margin: '0 0 12px' }}>
            Par quoi<br />
            <em style={{ color: T.accent, fontStyle: 'normal' }}>commencer</em> ?
          </h1>
          <p style={{ fontSize: 14, color: T.inkSoft, margin: '0 0 24px' }}>
            Sélectionnez 2 ou 3 habitudes pour débuter.
          </p>
          <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 8 }} className="hide-scrollbar">
            {SUGGESTIONS.map((s, i) => {
              const on = selected.has(i);
              return (
                <button
                  key={i}
                  onClick={() => toggle(i)}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 14,
                    padding: '14px 16px',
                    background: on ? T.ink : 'transparent',
                    border: `1.5px solid ${on ? T.ink : T.ruleStrong}`,
                    borderRadius: 14,
                    color: on ? T.paper : T.ink,
                    transition: 'all .18s',
                    textAlign: 'left',
                  }}
                >
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
            <button
              onClick={() => setStep(0)}
              style={{
                flex: 1, height: 54, borderRadius: 14,
                border: `1.5px solid ${T.ruleStrong}`, color: T.inkSoft,
                fontSize: 15, fontWeight: 500,
              }}
            >
              ← Retour
            </button>
            <button
              onClick={() => setStep(2)}
              disabled={selected.size === 0}
              style={{
                flex: 2, height: 54, borderRadius: 14,
                background: selected.size === 0 ? T.paperAlt : T.ink,
                color: selected.size === 0 ? T.inkMuted : T.paper,
                fontSize: 15, fontWeight: 600, letterSpacing: -0.2,
              }}
            >
              Continuer →
            </button>
          </div>
        </div>
      )}

      {step === 2 && (
        <div style={{ flex: 1, padding: '40px 28px 40px', display: 'flex', flexDirection: 'column' }}>
          <div style={{ fontSize: 11, letterSpacing: 2, textTransform: 'uppercase', color: T.inkMuted, marginBottom: 20 }}>
            Étape 3 sur 3
          </div>
          <h1 style={{ fontSize: 44, fontWeight: 400, lineHeight: 1.05, letterSpacing: -0.8, margin: '0 0 16px' }}>
            Tout est<br />
            <em style={{ color: T.accent, fontStyle: 'normal' }}>prêt</em>.
          </h1>
          <p style={{ fontSize: 15, color: T.inkSoft, lineHeight: 1.5, margin: '0 0 32px' }}>
            {selected.size} habitude{selected.size > 1 ? 's' : ''} sélectionnée{selected.size > 1 ? 's' : ''}.
            Vous pouvez en ajouter d'autres à tout moment.
          </p>
          <div style={{ flex: 1 }} />
          <div style={{
            background: T.paperAlt, borderRadius: 18, padding: '22px 24px', marginBottom: 24,
          }}>
            <div style={{ fontSize: 18, lineHeight: 1.35, color: T.ink }}>
              « Nous sommes ce que nous faisons de manière répétée. »
            </div>
            <div style={{ fontSize: 11, color: T.inkMuted, marginTop: 10, letterSpacing: 1, textTransform: 'uppercase' }}>
              — Aristote
            </div>
          </div>
          <button
            onClick={finish}
            style={{
              width: '100%', height: 54, borderRadius: 14,
              background: T.accent, color: '#fff',
              fontSize: 15, fontWeight: 600, letterSpacing: -0.2,
            }}
          >
            Commencer →
          </button>
        </div>
      )}
    </div>
  );
}
