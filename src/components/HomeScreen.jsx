import { useState } from 'react'
import { getProgressStats, getWeeklyVolume, getCurrentPhase, getCurrentBlock, getDayType, getWeekSchedule, getBlockNumber } from '../lib/programming.js'
import { PROGRAMME, EXERCISES } from '../data/exercises.js'

const DAY_COLORS = { day1: '#e8ff00', day2: '#4ade80', day3: '#60a5fa', day4: '#f97316', freestyle: '#7c3aed' }

export default function HomeScreen({ sessions, allLogs, bodyweightLog, fatigue, sessionCount, onStartSetup, onFreestyle, onHistory, onStats, onSaveBodyweight }) {
  const [showBWInput, setShowBWInput] = useState(false)
  const [bwValue, setBwValue] = useState('')

  const { prMap, prContext } = getProgressStats(allLogs)
  const weeklyVolume = getWeeklyVolume(sessions, allLogs)
  const lastSession = sessions[0]
  const daysSinceLast = lastSession ? Math.floor((new Date() - new Date(lastSession.date)) / 86400000) : null

  const phase = getCurrentPhase(sessionCount)
  const blockKey = getCurrentBlock(sessionCount)
  const blockNum = getBlockNumber(sessionCount)
  const dayType = getDayType(sessionCount)
  const nextDay = PROGRAMME[dayType]
  const weekSchedule = getWeekSchedule(sessionCount)
  const dayColor = DAY_COLORS[dayType] || '#e8ff00'

  const primaryLifts = [
    { id: 'flat_barbell_bench', label: 'Bench' },
    { id: 'conventional_deadlift', label: 'Deadlift' },
    { id: 'back_squat', label: 'Squat' },
    { id: 'barbell_ohp', label: 'OHP' },
    { id: 'barbell_row', label: 'Row' },
  ]

  const latestBW = bodyweightLog[0]?.weight

  function handleSaveBW() {
    if (bwValue && parseFloat(bwValue) > 0) {
      onSaveBodyweight(bwValue)
      setBwValue('')
      setShowBWInput(false)
    }
  }

  return (
    <div style={s.root}>
      <div style={s.header}>
        <div style={s.logoRow}>
          <span style={s.logo}>LIFT</span>
          <div style={s.headerRight}>
            <div style={s.blockPills}>
              <span style={s.pill}>Block {blockNum}</span>
              <span style={{ ...s.pill, color: getPhaseColor(phase.phase) }}>{phase.label}</span>
              <span style={s.pill}>Wk {phase.week}</span>
            </div>
            {latestBW && <div style={s.bwDisplay} onClick={() => setShowBWInput(true)}>{latestBW} kg ✏️</div>}
            {!latestBW && <button style={s.bwBtn} onClick={() => setShowBWInput(true)}>+ Weight</button>}
          </div>
        </div>

        {showBWInput && (
          <div style={s.bwInputRow}>
            <input
              style={s.bwInput} type="number" inputMode="decimal"
              placeholder="Body weight kg" value={bwValue}
              onChange={e => setBwValue(e.target.value)}
              autoFocus
            />
            <button style={s.bwSave} onClick={handleSaveBW}>Save</button>
            <button style={s.bwCancel} onClick={() => setShowBWInput(false)}>✕</button>
          </div>
        )}

        {fatigue.deloadRecommended && (
          <div style={s.alert}>⚠️ <span style={s.alertText}>{fatigue.message}</span></div>
        )}
        {fatigue.fatigued && !fatigue.deloadRecommended && (
          <div style={{ ...s.alert, borderColor: '#facc15', background: '#1a1400' }}>💛 <span style={s.alertText}>{fatigue.message}</span></div>
        )}
      </div>

      {/* Next Session Card */}
      <div style={{ ...s.nextCard, borderColor: dayColor + '44' }}>
        <div style={s.nextMeta}>NEXT SESSION</div>
        <div style={{ ...s.nextTitle, color: dayColor }}>{nextDay?.label}</div>
        <div style={s.nextFocus}>{nextDay?.focus}</div>
        {daysSinceLast !== null && (
          <div style={s.lastTrained}>
            Last trained {daysSinceLast === 0 ? 'today' : daysSinceLast === 1 ? 'yesterday' : `${daysSinceLast} days ago`}
          </div>
        )}
        {!lastSession && <div style={s.lastTrained}>First session — time to build 🔥</div>}
        <button style={{ ...s.startBtn, background: dayColor }} onClick={onStartSetup}>START SESSION</button>
        <button style={s.freestyleBtn} onClick={onFreestyle}>Freestyle Session</button>
      </div>

      {/* Week Schedule Preview */}
      <div style={s.section}>
        <div style={s.sectionTitle}>UPCOMING SESSIONS</div>
        <div style={s.scheduleGrid}>
          {weekSchedule.map((day, i) => (
            <div key={i} style={{ ...s.scheduleCard, ...(day.isNext ? { ...s.scheduleCardActive, borderColor: DAY_COLORS[day.dayType] } : {}) }}>
              <div style={{ ...s.scheduleDot, background: DAY_COLORS[day.dayType] }} />
              <div style={s.scheduleLabel}>{day.label.split('—')[1]?.trim() || day.label}</div>
              <div style={s.scheduleFocus}>{day.focus.split('&')[0]?.trim()}</div>
              {day.isNext && <div style={s.scheduleNext}>NEXT</div>}
            </div>
          ))}
        </div>
      </div>

      {/* Stats Row */}
      <div style={s.statsRow}>
        {[
          { val: sessionCount, label: 'Sessions' },
          { val: weeklyVolume > 0 ? `${Math.round(weeklyVolume / 1000)}k` : '—', label: 'kg/Week' },
          { val: Object.keys(prMap).length, label: 'Lifts' },
        ].map(st => (
          <div key={st.label} style={s.statBox} onClick={onStats}>
            <span style={s.statVal}>{st.val}</span>
            <span style={s.statLabel}>{st.label}</span>
          </div>
        ))}
      </div>

      {/* Primary Lift PRs */}
      {Object.keys(prMap).length > 0 && (
        <div style={s.section}>
          <div style={s.sectionHeader}>
            <span style={s.sectionTitle}>TOP LIFTS</span>
            <button style={s.linkBtn} onClick={onStats}>Full Stats →</button>
          </div>
          {primaryLifts.map(lift => {
            const ex = EXERCISES[lift.id]
            const pr = prMap[ex?.name]
            const ctx = prContext[ex?.name]
            if (!pr) return null
            return (
              <div key={lift.id} style={s.prRow}>
                <div>
                  <div style={s.prName}>{lift.label}</div>
                  {ctx && <div style={s.prDate}>{new Date(ctx.date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: '2-digit' })}</div>}
                </div>
                <span style={s.prWeight}>{pr} kg</span>
              </div>
            )
          })}
        </div>
      )}

      {/* Recent Sessions */}
      {sessions.length > 0 && (
        <div style={s.section}>
          <div style={s.sectionHeader}>
            <span style={s.sectionTitle}>RECENT</span>
            <button style={s.linkBtn} onClick={onHistory}>History →</button>
          </div>
          {sessions.slice(0, 3).map(session => {
            const logs = allLogs.filter(l => l.session_id === session.id)
            const dayLabels = { day1: 'Upper Strength', day2: 'Lower Strength', day3: 'Upper Volume', day4: 'Lower Athletic', freestyle: 'Freestyle' }
            const color = DAY_COLORS[session.day_type] || '#888'
            return (
              <div key={session.id} style={s.sessionRow}>
                <div style={{ ...s.sessionDot, background: color }} />
                <div style={{ flex: 1 }}>
                  <div style={s.sessionDay}>{dayLabels[session.day_type] || session.day_type}</div>
                  <div style={s.sessionDate}>{new Date(session.date).toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short' })}</div>
                </div>
                <div style={s.sessionRight}>
                  <span style={s.sessionCount}>{logs.length} ex</span>
                  <div style={{ ...s.fatigueDot, background: getFatigueColor(session.fatigue_level) }} />
                </div>
              </div>
            )
          })}
        </div>
      )}

      <div style={s.footer}>LIFT v2 · Built for Saad</div>
    </div>
  )
}

function getFatigueColor(level) {
  if (!level || level <= 2) return '#4ade80'
  if (level <= 3) return '#facc15'
  return '#f87171'
}

function getPhaseColor(phase) {
  return { accumulation: '#4ade80', intensification: '#e8ff00', deload: '#60a5fa' }[phase] || '#888'
}

const s = {
  root: { minHeight: '100vh', background: '#0a0a0a', paddingBottom: 40 },
  header: { padding: '44px 20px 20px', borderBottom: '1px solid #161616' },
  logoRow: { display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 10 },
  logo: { fontFamily: "'Bebas Neue', sans-serif", fontSize: 52, color: '#e8ff00', letterSpacing: 6, lineHeight: 1 },
  headerRight: { display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 6 },
  blockPills: { display: 'flex', gap: 4 },
  pill: { fontFamily: "'DM Mono', monospace", fontSize: 9, background: '#161616', color: '#666', padding: '3px 7px', borderRadius: 20, letterSpacing: 1 },
  bwDisplay: { fontFamily: "'DM Mono', monospace", fontSize: 11, color: '#888', cursor: 'pointer' },
  bwBtn: { background: 'none', border: '1px solid #222', borderRadius: 20, padding: '3px 10px', color: '#555', cursor: 'pointer', fontFamily: "'DM Mono', monospace", fontSize: 10 },
  bwInputRow: { display: 'flex', gap: 8, alignItems: 'center', marginTop: 10 },
  bwInput: { flex: 1, background: '#111', border: '1px solid #222', borderRadius: 8, padding: '10px 12px', color: '#f0ede8', fontFamily: "'DM Mono', monospace", fontSize: 14, outline: 'none' },
  bwSave: { background: '#e8ff00', border: 'none', borderRadius: 8, padding: '10px 16px', color: '#0a0a0a', cursor: 'pointer', fontFamily: "'Bebas Neue', sans-serif", fontSize: 16, letterSpacing: 2 },
  bwCancel: { background: 'none', border: 'none', color: '#555', cursor: 'pointer', fontSize: 16 },
  alert: { display: 'flex', gap: 8, alignItems: 'flex-start', background: '#1a0000', border: '1px solid #f87171', borderRadius: 10, padding: '10px 14px', marginTop: 12 },
  alertText: { fontSize: 12, color: '#ccc', lineHeight: 1.5 },
  nextCard: { margin: '16px 20px 0', background: '#111', border: '1px solid', borderRadius: 16, padding: '20px' },
  nextMeta: { fontFamily: "'DM Mono', monospace", fontSize: 10, color: '#555', letterSpacing: 3, marginBottom: 6 },
  nextTitle: { fontFamily: "'Bebas Neue', sans-serif", fontSize: 36, letterSpacing: 2, lineHeight: 1, marginBottom: 2 },
  nextFocus: { fontSize: 13, color: '#666', marginBottom: 4 },
  lastTrained: { fontFamily: "'DM Mono', monospace", fontSize: 11, color: '#444', marginBottom: 16 },
  startBtn: { width: '100%', border: 'none', borderRadius: 10, padding: '16px', fontFamily: "'Bebas Neue', sans-serif", fontSize: 22, letterSpacing: 4, color: '#0a0a0a', cursor: 'pointer', marginBottom: 8 },
  freestyleBtn: { width: '100%', background: 'transparent', border: '1px solid #222', borderRadius: 10, padding: '12px', fontFamily: "'DM Mono', monospace", fontSize: 12, color: '#555', cursor: 'pointer' },
  section: { margin: '24px 20px 0' },
  sectionHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  sectionTitle: { fontFamily: "'DM Mono', monospace", fontSize: 10, color: '#444', letterSpacing: 3 },
  linkBtn: { background: 'none', border: 'none', color: '#e8ff00', fontSize: 12, cursor: 'pointer', fontFamily: "'DM Mono', monospace" },
  scheduleGrid: { display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8 },
  scheduleCard: { background: '#111', border: '1px solid #1a1a1a', borderRadius: 10, padding: '10px 8px', display: 'flex', flexDirection: 'column', gap: 3, position: 'relative' },
  scheduleCardActive: { background: '#141414', border: '2px solid' },
  scheduleDot: { width: 6, height: 6, borderRadius: '50%', marginBottom: 2 },
  scheduleLabel: { fontFamily: "'DM Mono', monospace", fontSize: 9, color: '#666', letterSpacing: 0.5 },
  scheduleFocus: { fontFamily: "'DM Mono', monospace", fontSize: 8, color: '#444' },
  scheduleNext: { fontFamily: "'DM Mono', monospace", fontSize: 8, color: '#e8ff00', letterSpacing: 1, marginTop: 2 },
  statsRow: { display: 'flex', gap: 10, margin: '16px 20px 0' },
  statBox: { flex: 1, background: '#111', border: '1px solid #161616', borderRadius: 10, padding: '12px 8px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3, cursor: 'pointer' },
  statVal: { fontFamily: "'Bebas Neue', sans-serif", fontSize: 26, color: '#f0ede8', letterSpacing: 1 },
  statLabel: { fontFamily: "'DM Mono', monospace", fontSize: 9, color: '#555', letterSpacing: 1, textTransform: 'uppercase' },
  prRow: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 0', borderBottom: '1px solid #141414' },
  prName: { fontSize: 13, color: '#888', marginBottom: 2 },
  prDate: { fontFamily: "'DM Mono', monospace", fontSize: 10, color: '#333' },
  prWeight: { fontFamily: "'DM Mono', monospace", fontSize: 14, color: '#e8ff00', fontWeight: 500 },
  sessionRow: { display: 'flex', alignItems: 'center', gap: 10, padding: '10px 0', borderBottom: '1px solid #141414' },
  sessionDot: { width: 8, height: 8, borderRadius: '50%', flexShrink: 0 },
  sessionDay: { fontSize: 13, color: '#f0ede8', fontWeight: 500, marginBottom: 1 },
  sessionDate: { fontFamily: "'DM Mono', monospace", fontSize: 10, color: '#444' },
  sessionRight: { display: 'flex', alignItems: 'center', gap: 8 },
  sessionCount: { fontFamily: "'DM Mono', monospace", fontSize: 10, color: '#555' },
  fatigueDot: { width: 7, height: 7, borderRadius: '50%' },
  footer: { textAlign: 'center', fontFamily: "'DM Mono', monospace", fontSize: 10, color: '#1f1f1f', marginTop: 40, letterSpacing: 2 },
}
