import { useEffect } from 'react';
import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useApp } from './context';
import { OnboardingScreen } from './screens/OnboardingScreen';
import { TodayScreen } from './screens/TodayScreen';
import { CreateHabitScreen } from './screens/CreateHabitScreen';
import { HabitDetailScreen } from './screens/HabitDetailScreen';
import { CalendarScreen } from './screens/CalendarScreen';
import { StatsScreen } from './screens/StatsScreen';
import { ProfileScreen } from './screens/ProfileScreen';

function Guard() {
  const { state } = useApp();
  // loggedIn=true → toujours aller sur /today (données en localStorage)
  return <Navigate to={state.loggedIn ? '/today' : '/onboarding'} replace />;
}

function AppShell() {
  const { tokens } = useApp();

  useEffect(() => {
    document.body.style.background = tokens.canvas;
  }, [tokens]);

  return (
    <div style={{
      width: '100%',
      maxWidth: 430,
      height: '100dvh',
      margin: '0 auto',
      position: 'relative',
      background: tokens.paper,
      overflow: 'hidden',
      display: 'flex',
      flexDirection: 'column',
    }}>
      <Routes>
        <Route path="/"               element={<Guard />} />
        <Route path="/onboarding"     element={<OnboardingScreen />} />
        <Route path="/today"          element={<TodayScreen />} />
        <Route path="/create"         element={<CreateHabitScreen />} />
        <Route path="/habit/:id"      element={<HabitDetailScreen />} />
        <Route path="/habit/:id/edit" element={<CreateHabitScreen />} />
        <Route path="/calendar"       element={<CalendarScreen />} />
        <Route path="/stats"          element={<StatsScreen />} />
        <Route path="/profile"        element={<ProfileScreen />} />
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
