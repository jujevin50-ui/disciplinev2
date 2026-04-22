import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useApp } from '../context';
import { Icon } from '../components/Icon';
import type { Habit, HabitType, IconName } from '../types';

const DAY_LABELS = ['L', 'M', 'M', 'J', 'V', 'S', 'D'];
const ALL_DAYS = [0, 1, 2, 3, 4, 5, 6];

const ICONS: IconName[] = ['book', 'run', 'droplet', 'leaf', 'moon', 'bell', 'clock', 'heart', 'coffee', 'pen', 'music', 'dumbbell', 'sun', 'flame'];

export function CreateHabitScreen() {
  const { tokens: T, addHabit, updateHabit, deleteHabit, state, enablePush } = useApp();
  const navigate = useNavigate();
  const { id } = useParams<{ id?: string }>();
  const isEditing = !!id;
  const existing = id ? state.habits.find(h => h.id === id) : undefined;

  const [name, setName] = useState(existing?.name ?? '');
  const [icon, setIcon] = useState<IconName>(existing?.icon ?? 'book');
  const [type, setType] = useState<HabitType>(existing?.type ?? 'boolean');
  const [goalMinutes, setGoalMinutes] = useState(existing?.goalMinutes ?? 20);
  const [frequency, setFrequency] = useState<number[]>(existing?.frequency ?? ALL_DAYS);
  const [reminderTime, setReminderTime] = useState(existing?.reminderTime ?? '');
  const [reminderEnabled, setReminderEnabled] = useState(!!(existing?.reminderTime));
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const toggleDay = (d: number) => {
    setFrequency(prev =>
      prev.includes(d) ? prev.filter(x => x !== d) : [...prev, d].sort()
    );
  };

  const canSave = name.trim().length > 0 && frequency.length > 0;

  const handleSave = () => {
    if (!canSave) return;
    const data: Omit<Habit, 'id' | 'createdAt'> = {
      name: name.trim(),
      icon,
      type,
      goalMinutes: type === 'duration' ? goalMinutes : undefined,
      frequency,
      reminderTime: reminderEnabled && reminderTime ? reminderTime : undefined,
    };
    if (isEditing && id) {
      updateHabit(id, data);
    } else {
      addHabit(data);
    }
    navigate(-1);
  };

  const handleDelete = () => {
    if (id) {
      deleteHabit(id);
      navigate('/today', { replace: true });
    }
  };

  return (
    <div style={{ height: '100%', background: T.paper, color: T.ink, display: 'flex', flexDirection: 'column' }}>
      {/* Nav bar */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '56px 20px 10px',
      }}>
        <button onClick={() => navigate(-1)} style={{ color: T.inkSoft, fontSize: 15 }}>
          Annuler
        </button>
        <div style={{ fontSize: 14, fontWeight: 600, color: T.ink }}>
          {isEditing ? 'Modifier' : 'Nouvelle habitude'}
        </div>
        <button
          onClick={handleSave}
          disabled={!canSave}
          style={{ color: canSave ? T.accent : T.inkFaint, fontSize: 15, fontWeight: 600 }}
        >
          {isEditing ? 'Sauvegarder' : 'Créer'}
        </button>
      </div>

      <div className="hide-scrollbar" style={{ flex: 1, overflowY: 'auto', padding: '8px 24px 40px' }}>
        {/* Title */}
        <div style={{ fontSize: 32, lineHeight: 1.05, letterSpacing: -0.6, marginBottom: 28, marginTop: 8 }}>
          Quelle <em style={{ color: T.accent, fontStyle: 'normal' }}>discipline</em> adopter ?
        </div>

        {/* Name */}
        <div style={{ marginBottom: 28 }}>
          <div style={{ fontSize: 11, letterSpacing: 1.5, textTransform: 'uppercase', color: T.inkMuted, marginBottom: 10 }}>
            Nom
          </div>
          <input
            autoFocus={!isEditing}
            value={name}
            onChange={e => setName(e.target.value)}
            placeholder="Nom de l'habitude…"
            style={{
              fontSize: 22, color: T.ink, width: '100%',
              borderBottom: `1.5px solid ${T.ruleStrong}`, paddingBottom: 10,
              caretColor: T.accent,
            }}
          />
        </div>

        {/* Icon */}
        <div style={{ marginBottom: 28 }}>
          <div style={{ fontSize: 11, letterSpacing: 1.5, textTransform: 'uppercase', color: T.inkMuted, marginBottom: 10 }}>
            Icône
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
            {ICONS.map(ic => (
              <button
                key={ic}
                onClick={() => setIcon(ic)}
                style={{
                  width: 44, height: 44, borderRadius: 12,
                  border: `1.5px solid ${icon === ic ? T.ink : T.rule}`,
                  background: icon === ic ? T.ink : T.paperAlt,
                  color: icon === ic ? T.paper : T.inkSoft,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}
              >
                <Icon name={ic} size={18} />
              </button>
            ))}
          </div>
        </div>

        {/* Type */}
        <div style={{ marginBottom: 28 }}>
          <div style={{ fontSize: 11, letterSpacing: 1.5, textTransform: 'uppercase', color: T.inkMuted, marginBottom: 10 }}>
            Type de suivi
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            {(['boolean', 'duration'] as HabitType[]).map(t => (
              <button
                key={t}
                onClick={() => setType(t)}
                style={{
                  flex: 1, padding: '14px 12px', borderRadius: 12,
                  border: `1.5px solid ${type === t ? T.ink : T.ruleStrong}`,
                  background: type === t ? T.ink : 'transparent',
                  color: type === t ? T.paper : T.inkSoft,
                  textAlign: 'center',
                }}
              >
                <div style={{ fontSize: 14, fontWeight: 500 }}>
                  {t === 'boolean' ? 'Oui / Non' : 'Durée'}
                </div>
                <div style={{ fontSize: 11, opacity: 0.6, marginTop: 3 }}>
                  {t === 'boolean' ? 'Fait ou pas fait' : 'Minutes à accumuler'}
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Goal minutes (duration only) */}
        {type === 'duration' && (
          <div style={{ marginBottom: 28 }}>
            <div style={{ fontSize: 11, letterSpacing: 1.5, textTransform: 'uppercase', color: T.inkMuted, marginBottom: 10 }}>
              Objectif (minutes)
            </div>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              {[5, 10, 15, 20, 30, 45, 60].map(min => (
                <button
                  key={min}
                  onClick={() => setGoalMinutes(min)}
                  style={{
                    padding: '8px 16px', borderRadius: 10,
                    border: `1.5px solid ${goalMinutes === min ? T.ink : T.ruleStrong}`,
                    background: goalMinutes === min ? T.ink : 'transparent',
                    color: goalMinutes === min ? T.paper : T.inkSoft,
                    fontSize: 14, fontWeight: 500,
                  }}
                >
                  {min}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Frequency */}
        <div style={{ marginBottom: 28 }}>
          <div style={{ fontSize: 11, letterSpacing: 1.5, textTransform: 'uppercase', color: T.inkMuted, marginBottom: 10 }}>
            Fréquence
          </div>
          <div style={{ display: 'flex', gap: 6 }}>
            {DAY_LABELS.map((label, i) => {
              const on = frequency.includes(i);
              return (
                <button
                  key={i}
                  onClick={() => toggleDay(i)}
                  style={{
                    flex: 1, aspectRatio: '1',
                    border: `1.5px solid ${on ? T.ink : T.ruleStrong}`,
                    background: on ? T.ink : 'transparent',
                    color: on ? T.paper : T.inkSoft,
                    borderRadius: 10,
                    fontSize: 13, fontWeight: 500,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}
                >
                  {label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Reminder */}
        <div style={{ marginBottom: 28 }}>
          <div style={{ fontSize: 11, letterSpacing: 1.5, textTransform: 'uppercase', color: T.inkMuted, marginBottom: 10 }}>
            Rappel
          </div>
          <div style={{
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            padding: '14px 16px', background: T.paperAlt, borderRadius: 12,
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <Icon name="bell" size={18} color={T.inkSoft} />
              <span style={{ fontSize: 15, color: T.ink }}>Activer un rappel</span>
            </div>
            <button
              onClick={async () => {
                if (!reminderEnabled) {
                  const ok = await enablePush();
                  if (!ok) return;
                }
                setReminderEnabled(v => !v);
              }}
              style={{
                width: 44, height: 26, borderRadius: 13,
                background: reminderEnabled ? T.accent : T.ruleStrong,
                position: 'relative', transition: 'background .2s',
              }}
            >
              <div style={{
                position: 'absolute', top: 3, left: reminderEnabled ? 21 : 3,
                width: 20, height: 20, borderRadius: 10, background: '#fff',
                transition: 'left .2s',
              }} />
            </button>
          </div>
          {reminderEnabled && (
            <div style={{ marginTop: 10, padding: '14px 16px', background: T.paperAlt, borderRadius: 12 }}>
              <input
                type="time"
                value={reminderTime}
                onChange={e => setReminderTime(e.target.value)}
                style={{ fontSize: 24, color: T.ink, width: '100%', textAlign: 'center' }}
              />
            </div>
          )}
        </div>

        {/* Delete (edit only) */}
        {isEditing && (
          <div style={{ marginTop: 12 }}>
            {showDeleteConfirm ? (
              <div style={{
                padding: '16px', background: '#fef2f2', borderRadius: 12,
                border: '1px solid #fecaca',
              }}>
                <div style={{ fontSize: 14, color: '#991b1b', marginBottom: 12, fontWeight: 500 }}>
                  Supprimer cette habitude et tout son historique ?
                </div>
                <div style={{ display: 'flex', gap: 8 }}>
                  <button
                    onClick={() => setShowDeleteConfirm(false)}
                    style={{
                      flex: 1, padding: '10px', borderRadius: 10,
                      border: `1px solid ${T.ruleStrong}`, color: T.inkSoft, fontSize: 14,
                    }}
                  >
                    Annuler
                  </button>
                  <button
                    onClick={handleDelete}
                    style={{
                      flex: 1, padding: '10px', borderRadius: 10,
                      background: '#dc2626', color: '#fff', fontSize: 14, fontWeight: 600,
                    }}
                  >
                    Supprimer
                  </button>
                </div>
              </div>
            ) : (
              <button
                onClick={() => setShowDeleteConfirm(true)}
                style={{
                  width: '100%', padding: '14px', borderRadius: 12,
                  border: `1.5px solid #fecaca`, color: '#dc2626',
                  fontSize: 14, fontWeight: 500,
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                }}
              >
                <Icon name="trash" size={16} color="#dc2626" />
                Supprimer l'habitude
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
