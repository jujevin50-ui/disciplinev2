import { useState } from 'react';
import { useApp } from '../context';

export function AuthScreen() {
  const { tokens: T, signIn, signUp } = useApp();
  const [tab, setTab] = useState<'login' | 'signup'>('signup');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const submit = async () => {
    setError('');
    if (!email.trim() || !password) return;
    if (tab === 'signup' && !name.trim()) return;
    setLoading(true);
    if (tab === 'signup') {
      const err = await signUp(email.trim(), password, name.trim());
      if (err) {
        setError(err);
        setLoading(false);
      }
      // on success, auth listener reroutes automatically
    } else {
      const err = await signIn(email.trim(), password);
      if (err) {
        setError(err === 'Invalid login credentials' ? 'Email ou mot de passe incorrect.' : err);
        setLoading(false);
      }
    }
  };

  return (
    <div style={{ height: '100%', background: T.paper, color: T.ink, display: 'flex', flexDirection: 'column' }}>
      {/* Header */}
      <div style={{ padding: '64px 28px 32px' }}>
        <h1 style={{ fontSize: 40, fontWeight: 400, letterSpacing: -0.8, margin: 0, lineHeight: 1.1 }}>
          {tab === 'signup' ? <>Bienvenue dans<br /><em style={{ color: T.accent, fontStyle: 'normal' }}>Discipline</em>.</> : <>Bon retour<br /><em style={{ color: T.accent, fontStyle: 'normal' }}>parmi nous</em>.</>}
        </h1>
        <p style={{ fontSize: 14, color: T.inkSoft, margin: '12px 0 0', lineHeight: 1.5 }}>
          {tab === 'signup' ? 'Créez un compte pour sauvegarder vos habitudes.' : 'Connectez-vous pour retrouver vos données.'}
        </p>
      </div>

      {/* Tab toggle */}
      <div style={{ display: 'flex', margin: '0 28px 28px', background: T.paperAlt, borderRadius: 12, padding: 4 }}>
        {(['signup', 'login'] as const).map(t => (
          <button key={t} onClick={() => { setTab(t); setError(''); }} style={{
            flex: 1, padding: '9px', borderRadius: 9,
            background: tab === t ? T.paper : 'transparent',
            color: tab === t ? T.ink : T.inkMuted,
            fontSize: 14, fontWeight: tab === t ? 600 : 400,
            boxShadow: tab === t ? '0 1px 3px rgba(0,0,0,0.08)' : 'none',
            transition: 'all .15s',
          }}>
            {t === 'signup' ? 'Créer un compte' : 'Se connecter'}
          </button>
        ))}
      </div>

      {/* Form */}
      <div style={{ flex: 1, padding: '0 28px', display: 'flex', flexDirection: 'column', gap: 16 }}>
        {tab === 'signup' && (
          <div>
            <div style={{ fontSize: 11, letterSpacing: 1.5, textTransform: 'uppercase', color: T.inkMuted, marginBottom: 8 }}>Prénom</div>
            <input
              autoFocus={tab === 'signup'}
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="Votre prénom"
              style={{ width: '100%', fontSize: 17, color: T.ink, borderBottom: `1.5px solid ${T.ruleStrong}`, paddingBottom: 8, caretColor: T.accent }}
            />
          </div>
        )}
        <div>
          <div style={{ fontSize: 11, letterSpacing: 1.5, textTransform: 'uppercase', color: T.inkMuted, marginBottom: 8 }}>Email</div>
          <input
            autoFocus={tab === 'login'}
            type="email"
            value={email}
            onChange={e => setEmail(e.target.value)}
            placeholder="votre@email.com"
            style={{ width: '100%', fontSize: 17, color: T.ink, borderBottom: `1.5px solid ${T.ruleStrong}`, paddingBottom: 8, caretColor: T.accent }}
          />
        </div>
        <div>
          <div style={{ fontSize: 11, letterSpacing: 1.5, textTransform: 'uppercase', color: T.inkMuted, marginBottom: 8 }}>Mot de passe</div>
          <input
            type="password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter') submit(); }}
            placeholder="6 caractères minimum"
            style={{ width: '100%', fontSize: 17, color: T.ink, borderBottom: `1.5px solid ${T.ruleStrong}`, paddingBottom: 8, caretColor: T.accent }}
          />
        </div>

        {error && (
          <div style={{ padding: '10px 14px', background: '#fef2f2', borderRadius: 10, color: '#dc2626', fontSize: 13 }}>
            {error}
          </div>
        )}

        <div style={{ flex: 1 }} />
        <button
          onClick={submit}
          disabled={loading || !email.trim() || !password || (tab === 'signup' && !name.trim())}
          style={{
            width: '100%', height: 54, borderRadius: 14,
            background: (!email.trim() || !password || (tab === 'signup' && !name.trim())) ? T.paperAlt : T.accent,
            color: (!email.trim() || !password || (tab === 'signup' && !name.trim())) ? T.inkMuted : '#fff',
            fontSize: 15, fontWeight: 600, marginBottom: 40,
            opacity: loading ? 0.7 : 1,
          }}
        >
          {loading ? '…' : tab === 'signup' ? 'Créer mon compte →' : 'Connexion →'}
        </button>
      </div>
    </div>
  );
}
