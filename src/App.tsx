import { useEffect } from 'react';
import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useApp } from './context';
import { AuthScreen } from './screens/AuthScreen';
import { OnboardingScreen } from './screens/OnboardingScreen';
import { TodayScreen } from './screens/TodayScreen';
import { CreateHabitScreen } from './screens/CreateHabitScreen';
import { HabitDetailScreen } from './screens/HabitDetailScreen';
import { CalendarScreen } from './screens/CalendarScreen';
import { StatsScreen } from './screens/StatsScreen';
import { ProfileScreen } from './screens/ProfileScreen';

function Guard() {
  const { session, state } = useApp();
  if (!session) return <Navigate to="/auth" replace />;
  if (!state.habits.length) return <Navigate to="/onboarding" replace />;
  return <Navigate to="/today" replace />;
}

function AppShell() {
  const { session, authLoading, tokens } = useApp();

  useEffect(() => {
    document.body.style.background = tokens.canvas;
  }, [tokens]);

  if (authLoading) {
    return (
      <div style={{ width: '100%', maxWidth: 430, height: '100dvh', margin: '0 auto', background: tokens.paper, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ width: 32, height: 32, borderRadius: 16, border: `2px solid ${tokens.ruleStrong}`, borderTopColor: tokens.accent, animation: 'spin 0.7s linear infinite' }} />
      </div>
    );
  }

  return (
    <div style={{ width: '100%', maxWidth: 430, height: '100dvh', margin: '0 auto', position: 'relative', background: tokens.paper, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
      <Routes>
        <Route path="/"               element={<Guard />} />
        <Route path="/auth"           element={!session ? <AuthScreen /> : <Guard />} />
        <Route path="/onboarding"     element={session ? <OnboardingScreen /> : <Navigate to="/auth" replace />} />
        <Route path="/today"          element={session ? <TodayScreen /> : <Navigate to="/auth" replace />} />
        <Route path="/create"         element={session ? <CreateHabitScreen /> : <Navigate to="/auth" replace />} />
        <Route path="/habit/:id"      element={session ? <HabitDetailScreen /> : <Navigate to="/auth" replace />} />
        <Route path="/habit/:id/edit" element={session ? <CreateHabitScreen /> : <Navigate to="/auth" replace />} />
        <Route path="/calendar"       element={session ? <CalendarScreen /> : <Navigate to="/auth" replace />} />
        <Route path="/stats"          element={session ? <StatsScreen /> : <Navigate to="/auth" replace />} />
        <Route path="/profile"        element={session ? <ProfileScreen /> : <Navigate to="/auth" replace />} />
        <Route path="*"               element={<Guard />} />
      </Routes>
    </div>
  );
}

export function App() {
  return (
    <HashRouter>
      <AppShell />
    </HashRouter>
  );
}
