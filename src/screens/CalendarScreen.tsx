import { useState } from 'react';
import { useApp, computeCalendar } from '../context';
import { TabBar } from '../components/TabBar';
import { Icon } from '../components/Icon';
import { today, getDaysInMonth, getMonthStartDow, getMonthName } from '../utils';

export function CalendarScreen() {
  const { state, tokens: T } = useApp();
  const todayStr = today();
  const todayDate = new Date(todayStr + 'T00:00:00');

  const [year, setYear] = useState(todayDate.getFullYear());
  const [month, setMonth] = useState(todayDate.getMonth());

  const goBack = () => {
    if (month === 0) { setMonth(11); setYear(y => y - 1); }
    else setMonth(m => m - 1);
  };
  const goFwd = () => {
    if (month === 11) { setMonth(0); setYear(y => y + 1); }
    else setMonth(m => m + 1);
  };

  const calData = computeCalendar(year, month, state.habits, state.logs);
  const daysInMonth = getDaysInMonth(year, month);
  const startOffset = getMonthStartDow(year, month); // 0=Mon

  // Calendar cells: nulls for offset, then day numbers
  const cells: (number | null)[] = [
    ...Array(startOffset).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ];

  // Monthly summary
  const todayDayNum = year === todayDate.getFullYear() && month === todayDate.getMonth()
    ? todayDate.getDate() : daysInMonth;

  let monthDue = 0, monthDone = 0, perfectDays = 0;
  for (let d = 1; d <= todayDayNum; d++) {
    const data = calData.get(d);
    if (data) {
      monthDue += data.total;
      monthDone += data.done;
      if (data.done === data.total) perfectDays++;
    }
  }
  const monthRate = monthDue > 0 ? Math.round((monthDone / monthDue) * 100) : 0;

  const isFuture = (day: number) => {
    const ds = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    return ds > todayStr;
  };
  const isToday = (day: number) => {
    return year === todayDate.getFullYear() && month === todayDate.getMonth() && day === todayDate.getDate();
  };

  return (
    <div style={{ height: '100%', background: T.paper, position: 'relative', display: 'flex', flexDirection: 'column' }}>
      {/* Header */}
      <div style={{ padding: '52px 24px 16px' }}>
        <div style={{
          fontSize: 11, letterSpacing: 2, textTransform: 'uppercase', color: T.inkMuted, marginBottom: 8,
        }}>
          Historique
        </div>
        <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between' }}>
          <div style={{ fontSize: 36, letterSpacing: -0.6, color: T.ink, lineHeight: 1 }}>
            {getMonthName(month)}{' '}
            <em style={{ color: T.accent, fontStyle: 'normal' }}>{year}</em>
          </div>
          <div style={{ display: 'flex', gap: 16, color: T.inkSoft }}>
            <button onClick={goBack} style={{ color: T.inkSoft }}>
              <Icon name="chevronLeft" size={20} />
            </button>
            <button onClick={goFwd} style={{ color: T.inkSoft }}>
              <Icon name="chevron" size={20} />
            </button>
          </div>
        </div>
      </div>

      <div className="hide-scrollbar" style={{ flex: 1, overflowY: 'auto', paddingBottom: 100 }}>
        {/* Weekday header */}
        <div style={{
          display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)',
          padding: '0 20px', marginBottom: 6,
        }}>
          {['L', 'M', 'M', 'J', 'V', 'S', 'D'].map((d, i) => (
            <div key={i} style={{
              textAlign: 'center', fontSize: 10, letterSpacing: 1.5,
              color: T.inkMuted, textTransform: 'uppercase',
            }}>{d}</div>
          ))}
        </div>

        {/* Calendar grid */}
        <div style={{
          display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)',
          padding: '0 20px', gap: 2,
        }}>
          {cells.map((day, i) => {
            if (day === null) return <div key={i} style={{ aspectRatio: '1' }} />;
            const data = calData.get(day);
            const future = isFuture(day);
            const todayCell = isToday(day);
            const fillRatio = data ? data.done / data.total : 0;
            return (
              <div key={i} style={{
                aspectRatio: '1', position: 'relative',
                display: 'flex', flexDirection: 'column',
                alignItems: 'center', justifyContent: 'center',
                gap: 3, padding: 3,
                background: todayCell ? T.ink : 'transparent',
                color: todayCell ? T.paper : future ? T.inkFaint : T.ink,
                borderRadius: 10,
              }}>
                <div style={{
                  fontSize: 13, fontWeight: todayCell ? 600 : 400,
                  fontVariantNumeric: 'tabular-nums',
                }}>{day}</div>
                {!future && !todayCell && data && fillRatio > 0 && (
                  <div style={{
                    width: '70%', height: 3,
                    background: fillRatio === 1 ? T.done : T.accent,
                    borderRadius: 2, opacity: 0.3 + fillRatio * 0.7,
                  }} />
                )}
                {todayCell && (
                  <div style={{ width: '70%', height: 3, background: T.paper, borderRadius: 2, opacity: 0.5 }} />
                )}
              </div>
            );
          })}
        </div>

        {/* Monthly summary */}
        <div style={{
          margin: '20px 20px 0', padding: '18px 20px',
          background: T.paperAlt, borderRadius: 16,
        }}>
          <div style={{
            display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 14,
          }}>
            <div style={{ fontSize: 20, color: T.ink }}>Ce mois-ci</div>
            <div style={{ fontSize: 12, color: T.inkMuted }}>{todayDayNum} jours</div>
          </div>
          <div style={{ display: 'flex', gap: 28 }}>
            <div>
              <div style={{ fontSize: 26, color: T.ink, lineHeight: 1 }}>{monthRate}%</div>
              <div style={{ fontSize: 10, letterSpacing: 1.2, textTransform: 'uppercase', color: T.inkMuted, marginTop: 4 }}>
                Réussite
              </div>
            </div>
            <div>
              <div style={{ fontSize: 26, color: T.ink, lineHeight: 1 }}>{perfectDays}</div>
              <div style={{ fontSize: 10, letterSpacing: 1.2, textTransform: 'uppercase', color: T.inkMuted, marginTop: 4 }}>
                Parfaits
              </div>
            </div>
            <div>
              <div style={{ fontSize: 26, color: T.ink, lineHeight: 1 }}>{monthDone}</div>
              <div style={{ fontSize: 10, letterSpacing: 1.2, textTransform: 'uppercase', color: T.inkMuted, marginTop: 4 }}>
                Complétés
              </div>
            </div>
          </div>
        </div>
      </div>

      <TabBar />
    </div>
  );
}
