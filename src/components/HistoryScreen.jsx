import { useState } from 'react'

const DAY_LABELS = { day1: 'Upper — Strength', day2: 'Lower — Strength', day3: 'Upper — Volume', day4: 'Lower — Athletic', freestyle: 'Freestyle' }
const DAY_COLORS = { day1: '#e8ff00', day2: '#4ade80', day3: '#60a5fa', day4: '#f97316', freestyle: '#7c3aed' }
const PHASE_COLORS = { accumulation: '#4ade80', intensification: '#e8ff00', deload: '#60a5fa', freestyle: '#7c3aed' }

export default function HistoryScreen({ sessions, allLogs, onBack }) {
  const [expanded, setExpanded] = useState(null)
  const [filter, setFilter] = useState('all')

  const filtered = filter === 'all' ? sessions : sessions.filter(s => s.day_type === filter)

  return (
    <div style={s.root}>
      <div style={s.topBar}>
        <button style={s.backBtn} onClick={onBack}>← Back</button>
        <span style={s.title}>HISTORY</span>
        <span style={s.count}>{sessions.length}</span>
      </div>

      <div style={s.filterRow}>
        {['all', 'day1', 'day2', 'day3', 'day4', 'freestyle'].map(f => (
          <button key={f} style={{ ...s.filterBtn, ...(filter === f ? { ...s.filterActive, borderColor: DAY_COLORS[f] || '#e8ff00', color: DAY_COLORS[f] || '#e8ff00' } : {}) }}
            onClick={() => setFilter(f)}>
            {f === 'all' ? 'All' : f === 'freestyle' ? 'Free' : f.replace('day', 'D')}
          </button>
        ))}
      </div>

      <div style={s.list}>
        {filtered.length === 0 && <div style={s.empty}>No sessions yet. Time to lift. 💪</div>}
        {filtered.map((session, i) => {
          const logs = allLogs.filter(l => l.session_id === session.id)
          const isOpen = expanded === session.id
          const color = DAY_COLORS[session.day_type] || '#888'
          const totalVol = logs.reduce((acc, log) => {
            try {
              const sets = typeof log.sets === 'string' ? JSON.parse(log.sets) : log.sets || []
              return acc + sets.reduce((a, s) => a + (parseFloat(s.weight) || 0) * (parseInt(s.reps) || 0), 0)
            } catch { return acc }
          }, 0)

          return (
            <div key={session.id} style={s.card}>
              <button style={s.cardHeader} onClick={() => setExpanded(isOpen ? null : session.id)}>
                <div style={{ ...s.cardDot, background: color }} />
                <div style={s.cardLeft}>
                  <div style={s.cardNum}>#{sessions.length - sessions.indexOf(session)}</div>
                  <div>
                    <div style={s.cardDay}>{DAY_LABELS[session.day_type] || session.day_type}</div>
                    <div style={s.cardDate}>{new Date(session.date).toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long' })}</div>
                    <div style={s.cardMeta}>
                      {session.phase && <span style={{ ...s.metaTag, color: PHASE_COLORS[session.phase] || '#888' }}>{session.phase}</span>}
                      {session.block_number && session.day_type !== 'freestyle' && <span style={s.metaTag}>Block {session.block_number}</span>}
                      {totalVol > 0 && <span style={s.metaTag}>{Math.round(totalVol)}lbs vol</span>}
                      <span style={{ ...s.metaTag, color: getFatigueColor(session.fatigue_level) }}>F{session.fatigue_level}/5</span>
                    </div>
                  </div>
                </div>
                <span style={s.chevron}>{isOpen ? '▲' : '▼'}</span>
              </button>

              {isOpen && (
                <div style={s.cardBody}>
                  {session.notes && <div style={s.sessionNotes}>"{session.notes}"</div>}
                  {logs.map(log => {
                    let sets = []
                    try { sets = typeof log.sets === 'string' ? JSON.parse(log.sets) : log.sets || [] } catch {}
                    const maxW = Math.max(...sets.map(s => parseFloat(s.weight) || 0))
                    const totalReps = sets.reduce((a, s) => a + (parseInt(s.reps) || 0), 0)
                    const avgRIR = sets.filter(s => s.rir !== '' && s.rir !== undefined && s.rir !== null).length > 0
                      ? (sets.reduce((a, s) => a + (parseInt(s.rir) || 0), 0) / sets.filter(s => s.rir !== '').length).toFixed(1)
                      : null

                    return (
                      <div key={log.id} style={s.logRow}>
                        <div style={s.logHeader}>
                          <span style={s.logName}>{log.exercise_name}</span>
                          {avgRIR && <span style={s.logRIR}>RIR {avgRIR}</span>}
                        </div>
                        <div style={s.logSets}>
                          {sets.map((set, si) => (
                            <span key={si} style={s.setChip}>{set.weight}kg×{set.reps}</span>
                          ))}
                        </div>
                        <div style={s.logStats}>
                          <span style={s.logStat}>Top: {maxW}kg</span>
                          <span style={s.logStat}>Reps: {totalReps}</span>
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

function getFatigueColor(level) {
  if (!level || level <= 2) return '#4ade80'
  if (level <= 3) return '#facc15'
  return '#f87171'
}

const s = {
  root: { minHeight: '100vh', background: '#0a0a0a', paddingBottom: 40 },
  topBar: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 20px', borderBottom: '1px solid #161616' },
  backBtn: { background: 'none', border: 'none', color: '#555', cursor: 'pointer', fontFamily: "'DM Mono', monospace", fontSize: 13 },
  title: { fontFamily: "'Bebas Neue', sans-serif", fontSize: 22, color: '#f0ede8', letterSpacing: 4 },
  count: { fontFamily: "'DM Mono', monospace", fontSize: 11, color: '#444' },
  filterRow: { display: 'flex', gap: 6, padding: '12px 16px', overflowX: 'auto', borderBottom: '1px solid #161616' },
  filterBtn: { background: '#111', border: '1px solid #1a1a1a', borderRadius: 20, padding: '6px 14px', color: '#555', cursor: 'pointer', fontFamily: "'DM Mono', monospace", fontSize: 11, flexShrink: 0 },
  filterActive: { background: '#141414', border: '1px solid' },
  list: { padding: '12px 14px' },
  empty: { textAlign: 'center', color: '#333', fontFamily: "'DM Mono', monospace", fontSize: 12, marginTop: 60 },
  card: { background: '#111', border: '1px solid #1a1a1a', borderRadius: 12, marginBottom: 10, overflow: 'hidden' },
  cardHeader: { width: '100%', background: 'none', border: 'none', display: 'flex', alignItems: 'center', gap: 10, padding: '14px 16px', cursor: 'pointer', textAlign: 'left' },
  cardDot: { width: 8, height: 8, borderRadius: '50%', flexShrink: 0 },
  cardLeft: { flex: 1, display: 'flex', gap: 10, alignItems: 'flex-start' },
  cardNum: { fontFamily: "'Bebas Neue', sans-serif", fontSize: 20, color: '#2a2a2a', letterSpacing: 1, paddingTop: 2 },
  cardDay: { fontSize: 14, color: '#f0ede8', fontWeight: 500, marginBottom: 2 },
  cardDate: { fontFamily: "'DM Mono', monospace", fontSize: 10, color: '#444', marginBottom: 5 },
  cardMeta: { display: 'flex', flexWrap: 'wrap', gap: 5 },
  metaTag: { fontFamily: "'DM Mono', monospace", fontSize: 9, color: '#555', background: '#0a0a0a', border: '1px solid #161616', borderRadius: 20, padding: '2px 7px', textTransform: 'capitalize' },
  chevron: { color: '#333', fontSize: 11 },
  cardBody: { padding: '0 16px 16px', borderTop: '1px solid #161616' },
  sessionNotes: { fontSize: 12, color: '#555', fontStyle: 'italic', padding: '10px 0', borderBottom: '1px solid #161616', marginBottom: 4 },
  logRow: { padding: '10px 0', borderBottom: '1px solid #111' },
  logHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 5 },
  logName: { fontSize: 13, color: '#f0ede8', fontWeight: 500 },
  logRIR: { fontFamily: "'DM Mono', monospace", fontSize: 10, color: '#e8ff00' },
  logSets: { display: 'flex', flexWrap: 'wrap', gap: 5, marginBottom: 5 },
  setChip: { fontFamily: "'DM Mono', monospace", fontSize: 10, background: '#0a0a0a', border: '1px solid #161616', borderRadius: 20, padding: '3px 8px', color: '#666' },
  logStats: { display: 'flex', gap: 14 },
  logStat: { fontFamily: "'DM Mono', monospace", fontSize: 10, color: '#e8ff00' },
}
