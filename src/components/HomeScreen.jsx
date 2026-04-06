import { getProgressStats, getWeeklyVolume, getCurrentPhase, getCurrentBlock, getDayType } from '../lib/programming.js'
import { PROGRAMME, BLOCK_ROTATIONS, EXERCISES } from '../data/exercises.js'

export default function HomeScreen({ sessions, allLogs, fatigue, sessionCount, onStartSetup, onFreestyle, onHistory }) {
  const { prMap } = getProgressStats(allLogs)
  const weeklyVolume = getWeeklyVolume(sessions, allLogs)
  const lastSession = sessions[0]
  const daysSinceLast = lastSession ? Math.floor((new Date() - new Date(lastSession.date)) / 86400000) : null

  const phase = getCurrentPhase(sessionCount)
  const blockKey = getCurrentBlock(sessionCount)
  const dayType = getDayType(sessionCount)
  const nextDay = PROGRAMME[dayType]

  const blockNum = blockKey === 'block1' ? 1 : 2
  const weekInBlock = phase.week

  const primaryLifts = [
    { id: 'flat_barbell_bench', label: 'Bench' },
    { id: 'conventional_deadlift', label: 'Deadlift' },
    { id: 'back_squat', label: 'Squat' },
    { id: 'barbell_ohp', label: 'OHP' },
    { id: 'barbell_row', label: 'Row' },
  ]

  return (
    <div style={s.root}>
      <div style={s.header}>
        <div style={s.logoRow}>
          <span style={s.logo}>LIFT</span>
          <div style={s.blockInfo}>
            <span style={s.blockBadge}>Block {blockNum}</span>
            <span style={s.phaseBadge}>{phase.label}</span>
            <span style={s.weekBadge}>Wk {weekInBlock}</span>
          </div>
        </div>

        {fatigue.deloadRecommended && (
          <div style={s.deloadAlert}>
            <span>⚠️</span>
            <span style={s.alertText}>{fatigue.message}</span>
          </div>
        )}
        {fatigue.fatigued && !fatigue.deloadRecommended && (
          <div style={s.fatigueAlert}>
            <span>💛</span>
            <span style={s.alertText}>{fatigue.message}</span>
          </div>
        )}
      </div>

      <div style={s.nextCard}>
        <div style={s.nextMeta}>NEXT SESSION</div>
        <div style={s.nextTitle}>{nextDay?.label}</div>
        <div style={s.nextFocus}>{nextDay?.focus}</div>
        {daysSinceLast !== null && (
          <div style={s.lastTrained}>
            Last trained {daysSinceLast === 0 ? 'today' : daysSinceLast === 1 ? 'yesterday' : `${daysSinceLast} days ago`}
          </div>
        )}
        {!lastSession && <div style={s.lastTrained}>First session — time to build 🔥</div>}
        <button style={s.startBtn} onClick={onStartSetup}>START SESSION</button>
        <button style={s.freestyleBtn} onClick={onFreestyle}>Freestyle Session</button>
      </div>

      <div style={s.statsRow}>
        {[
          { val: sessionCount, label: 'Sessions' },
          { val: weeklyVolume > 0 ? `${Math.round(weeklyVolume / 1000)}k` : '—', label: 'kg This Week' },
          { val: Object.keys(prMap).length, label: 'Lifts Tracked' },
        ].map(st => (
          <div key={st.label} style={s.statBox}>
            <span style={s.statVal}>{st.val}</span>
            <span style={s.statLabel}>{st.label}</span>
          </div>
        ))}
      </div>

      {Object.keys(prMap).length > 0 && (
        <div style={s.section}>
          <div style={s.sectionHeader}>
            <span style={s.sectionTitle}>TOP LIFTS</span>
            <button style={s.historyBtn} onClick={onHistory}>History →</button>
          </div>
          {primaryLifts.map(lift => {
            const ex = EXERCISES[lift.id]
            const pr = prMap[ex?.name]
            if (!pr) return null
            return (
              <div key={lift.id} style={s.prRow}>
                <span style={s.prName}>{lift.label}</span>
                <span style={s.prWeight}>{pr} kg</span>
              </div>
            )
          })}
        </div>
      )}

      {sessions.length > 0 && (
        <div style={s.section}>
          <div style={s.sectionHeader}>
            <span style={s.sectionTitle}>RECENT</span>
          </div>
          {sessions.slice(0, 3).map(session => {
            const logs = allLogs.filter(l => l.session_id === session.id)
            const dayLabels = {
              day1: 'Upper — Strength', day2: 'Lower — Strength',
              day3: 'Upper — Volume', day4: 'Lower — Athletic', freestyle: 'Freestyle',
            }
            return (
              <div key={session.id} style={s.sessionRow}>
                <div>
                  <div style={s.sessionDay}>{dayLabels[session.day_type] || session.day_type}</div>
                  <div style={s.sessionDate}>{new Date(session.date).toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short' })}</div>
                </div>
                <div style={s.sessionRight}>
                  <span style={s.sessionCount}>{logs.length} exercises</span>
                  <div style={{ ...s.fatigueDot, background: getFatigueColor(session.fatigue_level) }} />
                </div>
              </div>
            )
          })}
        </div>
      )}

      <div style={s.footer}>LIFT · Built for Saad</div>
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
  header: { padding: '44px 20px 20px', borderBottom: '1px solid #161616' },
  logoRow: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 },
  logo: { fontFamily: "'Bebas Neue', sans-serif", fontSize: 52, color: '#e8ff00', letterSpacing: 6, lineHeight: 1 },
  blockInfo: { display: 'flex', gap: 6, alignItems: 'center' },
  blockBadge: { fontFamily: "'DM Mono', monospace", fontSize: 10, background: '#e8ff0022', color: '#e8ff00', padding: '3px 8px', borderRadius: 20, letterSpacing: 1 },
  phaseBadge: { fontFamily: "'DM Mono', monospace", fontSize: 10, background: '#ffffff11', color: '#888', padding: '3px 8px', borderRadius: 20, letterSpacing: 1 },
  weekBadge: { fontFamily: "'DM Mono', monospace", fontSize: 10, background: '#ffffff11', color: '#888', padding: '3px 8px', borderRadius: 20, letterSpacing: 1 },
  deloadAlert: { display: 'flex', gap: 8, alignItems: 'flex-start', background: '#1a0000', border: '1px solid #f87171', borderRadius: 10, padding: '10px 14px' },
  fatigueAlert: { display: 'flex', gap: 8, alignItems: 'flex-start', background: '#1a1400', border: '1px solid #facc15', borderRadius: 10, padding: '10px 14px' },
  alertText: { fontSize: 12, color: '#ccc', lineHeight: 1.5 },
  nextCard: { margin: '16px 20px 0', background: '#111', border: '1px solid #1a1a1a', borderRadius: 16, padding: '20px' },
  nextMeta: { fontFamily: "'DM Mono', monospace", fontSize: 10, color: '#555', letterSpacing: 3, marginBottom: 6 },
  nextTitle: { fontFamily: "'Bebas Neue', sans-serif", fontSize: 36, color: '#e8ff00', letterSpacing: 2, lineHeight: 1, marginBottom: 2 },
  nextFocus: { fontSize: 13, color: '#666', marginBottom: 4 },
  lastTrained: { fontFamily: "'DM Mono', monospace", fontSize: 11, color: '#444', marginBottom: 16 },
  startBtn: { width: '100%', background: '#e8ff00', border: 'none', borderRadius: 10, padding: '16px', fontFamily: "'Bebas Neue', sans-serif", fontSize: 22, letterSpacing: 4, color: '#0a0a0a', cursor: 'pointer', marginBottom: 8 },
  freestyleBtn: { width: '100%', background: 'transparent', border: '1px solid #222', borderRadius: 10, padding: '12px', fontFamily: "'DM Mono', monospace", fontSize: 12, color: '#555', cursor: 'pointer' },
  statsRow: { display: 'flex', gap: 10, margin: '16px 20px 0' },
  statBox: { flex: 1, background: '#111', border: '1px solid #161616', borderRadius: 10, padding: '12px 8px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3 },
  statVal: { fontFamily: "'Bebas Neue', sans-serif", fontSize: 26, color: '#f0ede8', letterSpacing: 1 },
  statLabel: { fontFamily: "'DM Mono', monospace", fontSize: 9, color: '#555', letterSpacing: 1, textTransform: 'uppercase' },
  section: { margin: '24px 20px 0' },
  sectionHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  sectionTitle: { fontFamily: "'DM Mono', monospace", fontSize: 10, color: '#444', letterSpacing: 3 },
  historyBtn: { background: 'none', border: 'none', color: '#e8ff00', fontSize: 12, cursor: 'pointer', fontFamily: "'DM Mono', monospace" },
  prRow: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 0', borderBottom: '1px solid #141414' },
  prName: { fontSize: 13, color: '#888' },
  prWeight: { fontFamily: "'DM Mono', monospace", fontSize: 14, color: '#e8ff00', fontWeight: 500 },
  sessionRow: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 0', borderBottom: '1px solid #141414' },
  sessionDay: { fontSize: 14, color: '#f0ede8', fontWeight: 500, marginBottom: 2 },
  sessionDate: { fontFamily: "'DM Mono', monospace", fontSize: 11, color: '#444' },
  sessionRight: { display: 'flex', alignItems: 'center', gap: 8 },
  sessionCount: { fontFamily: "'DM Mono', monospace", fontSize: 11, color: '#555' },
  fatigueDot: { width: 8, height: 8, borderRadius: '50%' },
  footer: { textAlign: 'center', fontFamily: "'DM Mono', monospace", fontSize: 10, color: '#1f1f1f', marginTop: 40, letterSpacing: 2 },
}
