import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp, activateSession } from '../context';
import { Icon } from '../components/Icon';

const KEYS = ['1','2','3','4','5','6','7','8','9','','0','⌫'];

export function LoginScreen() {
  const { state, tokens: T, checkPin } = useApp();
  const navigate = useNavigate();
  const [input, setInput] = useState('');
  const [error, setError] = useState(false);
  const [shake, setShake] = useState(false);

  const initial = (state.userName || 'U')[0].toUpperCase();

  // Auto-submit when 4 digits entered
  useEffect(() => {
    if (input.length !== 4) return;
    if (checkPin(input)) {
      activateSession();
      navigate('/today', { replace: true });
    } else {
      setShake(true);
      setError(true);
      setTimeout(() => {
        setInput('');
        setShake(false);
        setError(false);
      }, 600);
    }
  }, [input, checkPin, navigate]);

  const press = (key: string) => {
    if (key === '⌫') {
      setInput(p => p.slice(0, -1));
      setError(false);
    } else if (key === '') {
      // empty cell, do nothing
    } else if (input.length < 4) {
      setInput(p => p + key);
    }
  };

  return (
    <div style={{
      height: '100%',
      background: T.paper,
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: '60px 32px 40px',
    }}>
      {/* Identity */}
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 14 }}>
        <div style={{
          width: 80, height: 80, borderRadius: 40,
          background: T.accent, color: '#fff',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 36, fontWeight: 500,
        }}>
          {initial}
        </div>
        <div style={{ fontSize: 22, fontWeight: 500, color: T.ink, letterSpacing: -0.3 }}>
          {state.userName || 'Bienvenue'}
        </div>
        <div style={{ fontSize: 14, color: T.inkMuted }}>Entrez votre code PIN</div>
      </div>

      {/* PIN dots */}
      <div style={{
        display: 'flex', gap: 20, alignItems: 'center',
        animation: shake ? 'shake .5s ease' : 'none',
      }}>
        <style>{`
          @keyframes shake {
            0%,100% { transform: translateX(0); }
            15% { transform: translateX(-10px); }
            30% { transform: translateX(10px); }
            45% { transform: translateX(-8px); }
            60% { transform: translateX(8px); }
            75% { transform: translateX(-4px); }
            90% { transform: translateX(4px); }
          }
        `}</style>
        {[0,1,2,3].map(i => (
          <div key={i} style={{
            width: 16, height: 16, borderRadius: 8,
            background: i < input.length
              ? (error ? '#dc2626' : T.ink)
              : T.ruleStrong,
            transition: 'background .15s',
          }} />
        ))}
      </div>

      {/* Numpad */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(3, 1fr)',
        gap: 12,
        width: '100%',
        maxWidth: 300,
      }}>
        {KEYS.map((key, i) => (
          <button
            key={i}
            onClick={() => key !== '' && press(key)}
            disabled={key === ''}
            style={{
              height: 72,
              borderRadius: 20,
              background: key === '' ? 'transparent' : key === '⌫' ? T.paperAlt : T.paperAlt,
              border: 'none',
              fontSize: key === '⌫' ? 20 : 28,
              fontWeight: key === '⌫' ? 400 : 300,
              color: key === '' ? 'transparent' : T.ink,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: key === '' ? 'default' : 'pointer',
              transition: 'background .1s',
              letterSpacing: -0.5,
            }}
            onMouseDown={e => {
              if (key !== '') (e.currentTarget as HTMLButtonElement).style.background = T.ruleStrong;
            }}
            onMouseUp={e => {
              (e.currentTarget as HTMLButtonElement).style.background = T.paperAlt;
            }}
          >
            {key === '⌫' ? <Icon name="x" size={18} color={T.inkSoft} /> : key}
          </button>
        ))}
      </div>

      {/* Forgot PIN */}
      <button
        onClick={() => {
          if (confirm('Réinitialiser le PIN ? Toutes vos données seront conservées.')) {
            navigate('/reset-pin');
          }
        }}
        style={{ fontSize: 13, color: T.inkMuted }}
      >
        PIN oublié ?
      </button>
    </div>
  );
}
