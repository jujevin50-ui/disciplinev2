export type IconName =
  | 'check' | 'plus' | 'x' | 'chevron' | 'chevronLeft' | 'chevronDown'
  | 'back' | 'flame' | 'bell' | 'calendar' | 'stats' | 'moon' | 'sun'
  | 'profile' | 'settings' | 'book' | 'run' | 'droplet' | 'leaf' | 'clock'
  | 'edit' | 'trash' | 'heart' | 'coffee' | 'pen' | 'music' | 'dumbbell';

export type HabitType = 'boolean' | 'duration';

export interface Habit {
  id: string;
  name: string;
  icon: IconName;
  type: HabitType;
  goalMinutes?: number;
  frequency: number[];   // 0=Mon, 1=Tue, 2=Wed, 3=Thu, 4=Fri, 5=Sat, 6=Sun
  reminderTime?: string; // "HH:MM"
  createdAt: string;     // "YYYY-MM-DD"
}

export interface HabitLog {
  habitId: string;
  date: string;          // "YYYY-MM-DD"
  completed: boolean;
  minutes?: number;
}

export interface AppState {
  habits: Habit[];
  logs: HabitLog[];
  userName: string;
  loggedIn: boolean;     // true after first account creation — persists forever
  theme: 'light' | 'dark';
}
