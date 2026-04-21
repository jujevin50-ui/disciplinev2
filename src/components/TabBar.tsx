import { useNavigate, useLocation } from 'react-router-dom';
import { useApp } from '../context';
import { Icon } from './Icon';
import type { IconName } from '../types';

const TABS: { id: string; label: string; icon: IconName; path: string }[] = [
  { id: 'today',    label: "Aujourd'hui", icon: 'sun',      path: '/today' },
  { id: 'calendar', label: 'Historique',  icon: 'calendar', path: '/calendar' },
  { id: 'stats',    label: 'Stats',       icon: 'stats',    path: '/stats' },
  { id: 'profile',  label: 'Profil',      icon: 'profile',  path: '/profile' },
];

export function TabBar() {
  const { tokens } = useApp();
  const navigate = useNavigate();
  const location = useLocation();

  const activeId = TABS.find(t => location.pathname === t.path)?.id ?? 'today';

  return (
    <div style={{
      position: 'absolute',
      left: 0, right: 0, bottom: 0,
      paddingBottom: 'env(safe-area-inset-bottom, 20px)',
      paddingTop: 10,
      background: tokens.paper,
      borderTop: `0.5px solid ${tokens.rule}`,
      display: 'flex',
      justifyContent: 'space-around',
      zIndex: 100,
    }}>
      {TABS.map(t => {
        const active = t.id === activeId;
        return (
          <button
            key={t.id}
            onClick={() => navigate(t.path)}
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: 3,
              minWidth: 60,
              padding: '4px 0',
              color: active ? tokens.ink : tokens.inkMuted,
              background: 'none',
            }}
          >
            <Icon name={t.icon} size={22} strokeWidth={active ? 2.2 : 1.5} />
            <span style={{
              fontSize: 10,
              fontWeight: active ? 600 : 400,
              letterSpacing: 0.1,
            }}>{t.label}</span>
          </button>
        );
      })}
    </div>
  );
}
