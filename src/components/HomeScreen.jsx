const PROTEIN_TARGET = 190

export default function HomeScreen({ sessions, allLogs, fatigueAlert, onStartWorkout, onViewHistory, sessionCount }) {
  const lastSession = sessions[0]
  const daysSinceLastSession = lastSession
    ? Math.floor((new Date() - new Date(lastSession.date)) / (1000 * 60 * 60 * 24))
    : null

  const nextSplitLabels = ["Upper — Strength", "Lower — Strength", "Upper — Volume", "Athletic & Power"]
  const nextSplit = nextSplitLabels[sessionCount % 4]

  // Recent PR detection — find max weight per exercise
  const prMap = {}
  allLogs.forEach(log => {
    try {
      const sets = typeof log.sets === 'string' ? JSON.parse(log.sets) : log.sets
      if (!sets) return
      const maxW = Math.max(...sets.map(s => parseFloat(s.weight) || 0))
      if (!prMap[log.exercise_name] || maxW > prMap[log.exercise_name]) {
        prMap[log.exercise_name] = maxW
      }
    } catch {}
  })

  const totalSessions = sessions.length
  const totalVolume = allLogs.reduce((acc, log) => {
    try {
      const sets = typeof log.sets === 'string' ? JSON.parse(log.sets) : log.sets
      if (!sets) return acc
      return acc + sets.reduce((a, s) => a + (parseFloat(s.weight) || 0) * (parseInt(s.reps) || 0), 0)
    } catch { return acc }
  }, 0)

  return (
    <div style={s.root}>
      {/* Header */}
      <div style={s.header}>
        <div style={s.logoRow}>
          <span style={s.logo}>LIFT</span>
          <span style={s.tagline}>Personal Strength OS</span>
        </div>
        <div style={s.proteinBanner}>
          <span style={s.proteinIcon}>🥩</span>
          <span style={s.proteinText}>Today's protein target: <strong>{PROTEIN_TARGET}g</strong></span>
        </div>
      </div>

      {/* Fatigue Alert */}
      {fatigueAlert && (
        <div style={s.fatigueCard}>
          <span style={s.fatigueIcon}>⚠️</span>
          <span style={s.fatigueText}>{fatigueAlert}</span>
        </div>
      )}

      {/* Next Session Card */}
      <div style={s.nextCard}>
        <div style={s.nextLabel}>NEXT SESSION</div>
        <div style={s.nextSplit}>{nextSplit}</div>
        {daysSinceLastSession !== null && (
          <div style={s.lastSession}>
            Last trained {daysSinceLastSession === 0 ? 'today' : daysSinceLastSession === 1 ? 'yesterday' : `${daysSinceLastSession} days ago`}
          </div>
        )}
        {!lastSession && (
          <div style={s.lastSession}>First session — let's go 🔥</div>
        )}
        <button style={s.startBtn} onClick={onStartWorkout}>
          START SESSION
        </button>
      </div>

      {/* Stats Row */}
      <div style={s.statsRow}>
        <div style={s.statBox}>
          <span style={s.statVal}>{totalSessions}</span>
          <span style={s.statLabel}>Sessions</span>
        </div>
        <div style={s.statBox}>
          <span style={s.statVal}>{totalVolume > 0 ? Math.round(totalVolume / 1000) + 'k' : '—'}</span>
          <span style={s.statLabel}>kg Lifted</span>
        </div>
        <div style={s.statBox}>
          <span style={s.statVal}>{Object.keys(prMap).length}</span>
          <span style={s.statLabel}>Exercises</span>
        </div>
      </div>

      {/* Recent Sessions */}
      {sessions.length > 0 && (
        <div style={s.section}>
          <div style={s.sectionHeader}>
            <span style={s.sectionTitle}>RECENT SESSIONS</span>
            <button style={s.historyBtn} onClick={onViewHistory}>View All →</button>
          </div>
          {sessions.slice(0, 3).map((session, i) => {
            const sessionLogs = allLogs.filter(l => l.session_id === session.id)
            const dayLabels = {
              upper_heavy: "Upper — Strength",
              lower_heavy: "Lower — Strength",
              upper_hypertrophy: "Upper — Volume",
              athletic: "Athletic & Power"
            }
            return (
              <div key={session.id} style={s.sessionRow}>
                <div style={s.sessionLeft}>
                  <div style={s.sessionDay}>{dayLabels[session.day_type] || session.day_type}</div>
                  <div style={s.sessionDate}>{new Date(session.date).toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short' })}</div>
                </div>
                <div style={s.sessionRight}>
                  <span style={s.sessionExCount}>{sessionLogs.length} exercises</span>
                  <span style={{ ...s.fatigueDot, background: getFatigueColor(session.fatigue_level) }} />
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Personal Records */}
      {Object.keys(prMap).length > 0 && (
        <div style={s.section}>
          <div style={s.sectionHeader}>
            <span style={s.sectionTitle}>TOP LIFTS</span>
          </div>
          {Object.entries(prMap)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 5)
            .map(([name, weight]) => (
              <div key={name} style={s.prRow}>
                <span style={s.prName}>{name}</span>
                <span style={s.prWeight}>{weight} kg</span>
              </div>
            ))}
        </div>
      )}

      <div style={s.footer}>Built for Saad · LIFT v1.0</div>
    </div>
  )
}

function getFatigueColor(level) {
  if (!level) return '#333'
  if (level <= 2) return '#4ade80'
  if (level <= 3) return '#facc15'
  return '#f87171'
}

const s = {
  root: { minHeight: '100vh', background: '#0a0a0a', paddingBottom: 40 },
  header: { padding: '48px 20px 24px', borderBottom: '1px solid #1a1a1a' },
  logoRow: { display: 'flex', alignItems: 'baseline', gap: 12, marginBottom: 16 },
  logo: { fontFamily: "'Bebas Neue', sans-serif", fontSize: 56, color: '#e8ff00', letterSpacing: 6, lineHeight: 1 },
  tagline: { fontFamily: "'DM Mono', monospace", fontSize: 10, color: '#444', letterSpacing: 2, textTransform: 'uppercase' },
  proteinBanner: {
    display: 'flex', alignItems: 'center', gap: 8,
    background: '#141414', border: '1px solid #1f1f1f',
    borderRadius: 8, padding: '10px 14px',
  },
  proteinIcon: { fontSize: 16 },
  proteinText: { fontFamily: "'DM Mono', monospace", fontSize: 12, color: '#888' },
  fatigueCard: {
    margin: '16px 20px 0',
    background: '#1a0f00', border: '1px solid #f97316',
    borderRadius: 10, padding: '12px 16px',
    display: 'flex', gap: 10, alignItems: 'flex-start',
  },
  fatigueIcon: { fontSize: 16, flexShrink: 0 },
  fatigueText: { fontSize: 13, color: '#f97316', lineHeight: 1.5 },
  nextCard: {
    margin: '20px 20px 0',
    background: 'linear-gradient(135deg, #141414 0%, #1a1a0a 100%)',
    border: '1px solid #2a2a1a',
    borderRadius: 16, padding: '24px 20px',
  },
  nextLabel: { fontFamily: "'DM Mono', monospace", fontSize: 10, color: '#666', letterSpacing: 3, marginBottom: 8 },
  nextSplit: { fontFamily: "'Bebas Neue', sans-serif", fontSize: 36, color: '#e8ff00', letterSpacing: 2, lineHeight: 1, marginBottom: 8 },
  lastSession: { fontSize: 13, color: '#555', marginBottom: 20, fontFamily: "'DM Mono', monospace" },
  startBtn: {
    width: '100%', background: '#e8ff00', border: 'none',
    borderRadius: 10, padding: '16px',
    fontFamily: "'Bebas Neue', sans-serif", fontSize: 22, letterSpacing: 3,
    color: '#0a0a0a', cursor: 'pointer',
  },
  statsRow: { display: 'flex', gap: 12, margin: '16px 20px 0' },
  statBox: {
    flex: 1, background: '#111', border: '1px solid #1a1a1a',
    borderRadius: 10, padding: '14px 12px',
    display: 'flex', flexDirection: 'column', gap: 4, alignItems: 'center',
  },
  statVal: { fontFamily: "'Bebas Neue', sans-serif", fontSize: 28, color: '#f0ede8', letterSpacing: 1 },
  statLabel: { fontFamily: "'DM Mono', monospace", fontSize: 10, color: '#555', letterSpacing: 1 },
  section: { margin: '24px 20px 0' },
  sectionHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  sectionTitle: { fontFamily: "'DM Mono', monospace", fontSize: 10, color: '#555', letterSpacing: 3 },
  historyBtn: { background: 'none', border: 'none', color: '#e8ff00', fontSize: 12, cursor: 'pointer', fontFamily: "'DM Mono', monospace" },
  sessionRow: {
    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
    padding: '12px 0', borderBottom: '1px solid #151515',
  },
  sessionLeft: { display: 'flex', flexDirection: 'column', gap: 3 },
  sessionDay: { fontSize: 14, color: '#f0ede8', fontWeight: 500 },
  sessionDate: { fontFamily: "'DM Mono', monospace", fontSize: 11, color: '#555' },
  sessionRight: { display: 'flex', alignItems: 'center', gap: 8 },
  sessionExCount: { fontFamily: "'DM Mono', monospace", fontSize: 11, color: '#555' },
  fatigueDot: { width: 8, height: 8, borderRadius: '50%' },
  prRow: {
    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
    padding: '10px 0', borderBottom: '1px solid #151515',
  },
  prName: { fontSize: 13, color: '#aaa' },
  prWeight: { fontFamily: "'DM Mono', monospace", fontSize: 14, color: '#e8ff00', fontWeight: 500 },
  footer: { textAlign: 'center', fontFamily: "'DM Mono', monospace", fontSize: 10, color: '#2a2a2a', marginTop: 40, letterSpacing: 2 },
}
