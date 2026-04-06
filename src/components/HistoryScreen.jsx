import { useState } from 'react'

export default function HistoryScreen({ sessions, allLogs, onBack }) {
  const [expanded, setExpanded] = useState(null)

  const dayLabels = {
    upper_heavy: "Upper — Strength",
    lower_heavy: "Lower — Strength",
    upper_hypertrophy: "Upper — Volume",
    athletic: "Athletic & Power"
  }

  return (
    <div style={s.root}>
      <div style={s.topBar}>
        <button style={s.backBtn} onClick={onBack}>← Back</button>
        <span style={s.title}>SESSION HISTORY</span>
        <span style={s.count}>{sessions.length} sessions</span>
      </div>

      <div style={s.list}>
        {sessions.length === 0 && (
          <div style={s.empty}>No sessions yet. Hit your first one! 💪</div>
        )}
        {sessions.map((session, i) => {
          const logs = allLogs.filter(l => l.session_id === session.id)
          const isOpen = expanded === session.id

          return (
            <div key={session.id} style={s.sessionCard}>
              <button style={s.sessionHeader} onClick={() => setExpanded(isOpen ? null : session.id)}>
                <div style={s.sessionLeft}>
                  <div style={s.sessionNum}>#{sessions.length - i}</div>
                  <div>
                    <div style={s.sessionDay}>{dayLabels[session.day_type] || session.day_type}</div>
                    <div style={s.sessionDate}>
                      {new Date(session.date).toLocaleDateString('en-GB', {
                        weekday: 'long', day: 'numeric', month: 'long'
                      })}
                    </div>
                  </div>
                </div>
                <div style={s.sessionRight}>
                  <span style={{ ...s.fatiguePill, background: getFatigueColor(session.fatigue_level) + '22', color: getFatigueColor(session.fatigue_level) }}>
                    Fatigue {session.fatigue_level}/5
                  </span>
                  <span style={s.chevron}>{isOpen ? '▲' : '▼'}</span>
                </div>
              </button>

              {isOpen && (
                <div style={s.sessionBody}>
                  {session.notes && (
                    <div style={s.notes}>{session.notes}</div>
                  )}
                  {logs.map(log => {
                    let sets = []
                    try { sets = typeof log.sets === 'string' ? JSON.parse(log.sets) : log.sets || [] } catch {}
                    const maxWeight = Math.max(...sets.map(s => parseFloat(s.weight) || 0))
                    const totalReps = sets.reduce((a, s) => a + (parseInt(s.reps) || 0), 0)

                    return (
                      <div key={log.id} style={s.logRow}>
                        <div style={s.logHeader}>
                          <span style={s.logName}>{log.exercise_name}</span>
                          {log.felt && <span style={s.feltTag}>{feltEmoji[log.felt]} {log.felt}</span>}
                        </div>
                        <div style={s.logSets}>
                          {sets.map((set, si) => (
                            <span key={si} style={s.setChip}>
                              {set.weight}kg × {set.reps}
                            </span>
                          ))}
                        </div>
                        <div style={s.logStats}>
                          <span style={s.logStat}>Max: {maxWeight}kg</span>
                          <span style={s.logStat}>Total reps: {totalReps}</span>
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}

const feltEmoji = { easy: '😌', good: '💪', hard: '😤', failed: '❌' }

function getFatigueColor(level) {
  if (!level) return '#333'
  if (level <= 2) return '#4ade80'
  if (level <= 3) return '#facc15'
  return '#f87171'
}

const s = {
  root: { minHeight: '100vh', background: '#0a0a0a', paddingBottom: 40 },
  topBar: {
    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
    padding: '16px 20px', borderBottom: '1px solid #1a1a1a',
  },
  backBtn: { background: 'none', border: 'none', color: '#666', cursor: 'pointer', fontFamily: "'DM Mono', monospace", fontSize: 13 },
  title: { fontFamily: "'Bebas Neue', sans-serif", fontSize: 20, color: '#f0ede8', letterSpacing: 3 },
  count: { fontFamily: "'DM Mono', monospace", fontSize: 11, color: '#555' },
  list: { padding: '16px 16px' },
  empty: { textAlign: 'center', color: '#444', fontFamily: "'DM Mono', monospace", fontSize: 13, marginTop: 60 },
  sessionCard: { background: '#111', border: '1px solid #1a1a1a', borderRadius: 12, marginBottom: 12, overflow: 'hidden' },
  sessionHeader: {
    width: '100%', background: 'none', border: 'none',
    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
    padding: '16px', cursor: 'pointer', textAlign: 'left',
  },
  sessionLeft: { display: 'flex', gap: 12, alignItems: 'center' },
  sessionNum: { fontFamily: "'Bebas Neue', sans-serif", fontSize: 24, color: '#333', letterSpacing: 1 },
  sessionDay: { fontSize: 14, color: '#f0ede8', fontWeight: 500, marginBottom: 2 },
  sessionDate: { fontFamily: "'DM Mono', monospace", fontSize: 11, color: '#555' },
  sessionRight: { display: 'flex', alignItems: 'center', gap: 8 },
  fatiguePill: { fontFamily: "'DM Mono', monospace", fontSize: 10, padding: '3px 8px', borderRadius: 20 },
  chevron: { color: '#444', fontSize: 11 },
  sessionBody: { padding: '0 16px 16px', borderTop: '1px solid #1a1a1a' },
  notes: { fontFamily: "'DM Sans', sans-serif", fontSize: 13, color: '#888', padding: '12px 0', borderBottom: '1px solid #151515', fontStyle: 'italic' },
  logRow: { padding: '12px 0', borderBottom: '1px solid #151515' },
  logHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 },
  logName: { fontSize: 14, color: '#f0ede8', fontWeight: 500 },
  feltTag: { fontFamily: "'DM Mono', monospace", fontSize: 10, color: '#666' },
  logSets: { display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 6 },
  setChip: { fontFamily: "'DM Mono', monospace", fontSize: 11, background: '#0a0a0a', border: '1px solid #1a1a1a', borderRadius: 20, padding: '3px 8px', color: '#888' },
  logStats: { display: 'flex', gap: 16 },
  logStat: { fontFamily: "'DM Mono', monospace", fontSize: 11, color: '#e8ff00' },
}
