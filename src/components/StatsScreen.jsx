import { useState } from 'react'
import { getProgressStats, getBlockSummary, getCurrentBlock, getWeeklyVolume } from '../lib/programming.js'
import { EXERCISES } from '../data/exercises.js'

const PHASE_COLORS = { accumulation: '#4ade80', intensification: '#e8ff00', deload: '#60a5fa', freestyle: '#7c3aed' }

export default function StatsScreen({ sessions, allLogs, bodyweightLog, onBack }) {
  const [tab, setTab] = useState('prs') // prs | blocks | bodyweight

  const { prMap, prContext } = getProgressStats(allLogs)

  // Weekly sets per muscle
  const PROGRAMME_MUSCLES = {
    chest: 10, back: 17, shoulders: 10, quads: 11,
    hamstrings: 16, glutes: 6, biceps: 6, triceps: 6,
    calves: 8, core: 6, lower_back: 6
  }

  // Weekly volume by week
  function getWeeklyVolumeHistory() {
    if (!sessions || sessions.length === 0) return []
    const weeks = []
    const sorted = [...sessions].sort((a, b) => new Date(a.date) - new Date(b.date))
    let weekStart = new Date(sorted[0].date)
    weekStart.setHours(0,0,0,0)
    weekStart.setDate(weekStart.getDate() - weekStart.getDay())
    
    for (let i = 0; i < 12; i++) {
      const weekEnd = new Date(weekStart)
      weekEnd.setDate(weekEnd.getDate() + 7)
      const weekSessions = sorted.filter(s => {
        const d = new Date(s.date)
        return d >= weekStart && d < weekEnd
      })
      const weekIds = weekSessions.map(s => s.id)
      const weekLogs = allLogs.filter(l => weekIds.includes(l.session_id))
      const vol = weekLogs.reduce((acc, log) => {
        try {
          const sets = typeof log.sets === 'string' ? JSON.parse(log.sets) : log.sets || []
          return acc + sets.reduce((a, s) => a + (parseFloat(s.weight)||0) * (parseInt(s.reps)||0), 0)
        } catch { return acc }
      }, 0)
      if (weekSessions.length > 0 || weeks.length > 0) {
        weeks.push({
          label: weekStart.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' }),
          volume: Math.round(vol),
          sessions: weekSessions.length
        })
      }
      weekStart = new Date(weekEnd)
    }
    return weeks.slice(-8)
  }

  const weeklyHistory = getWeeklyVolumeHistory()
  const maxVol = Math.max(...weeklyHistory.map(w => w.volume), 1)
  const sessionCount = sessions.length

  // Get block summaries for last 2 blocks
  const blockSummaries = ['block1', 'block2'].map(bk => getBlockSummary(sessions, allLogs, bk)).filter(Boolean)

  const primaryLifts = [
    'Flat Barbell Bench Press', 'Conventional Deadlift', 'Barbell Back Squat',
    'Barbell Overhead Press', 'Barbell Bent-Over Row', 'Weighted Pull-Up',
    'Romanian Deadlift', 'Incline Barbell Bench Press',
  ]
  const allTrackedLifts = Object.keys(prMap).sort()

  return (
    <div style={s.root}>
      <div style={s.topBar}>
        <button style={s.backBtn} onClick={onBack}>← Back</button>
        <span style={s.title}>STATS</span>
        <span style={s.count}>{sessionCount} sessions</span>
      </div>

      <div style={s.tabs}>
        {[['prs', 'Personal Bests'], ['blocks', 'Block Summary'], ['volume', 'Volume'], ['bodyweight', 'Bodyweight']].map(([id, label]) => (
          <button key={id} style={{ ...s.tab, ...(tab === id ? s.tabActive : {}) }} onClick={() => setTab(id)}>{label}</button>
        ))}
      </div>

      {tab === 'prs' && (
        <div style={s.content}>
          <div style={s.sectionTitle}>PRIMARY LIFTS</div>
          {primaryLifts.map(name => {
            const pr = prMap[name]
            const ctx = prContext[name]
            if (!pr) return (
              <div key={name} style={s.prRow}>
                <div style={s.prName}>{name}</div>
                <div style={s.prEmpty}>No data yet</div>
              </div>
            )
            return (
              <div key={name} style={s.prCard}>
                <div style={s.prCardHeader}>
                  <div style={s.prName}>{name}</div>
                  <div>
                    <div style={s.prWeight}>{pr} lbs</div>
                    {ctx?.reps > 0 && <div style={s.prOneRM}>~{Math.round(pr * (1 + ctx.reps / 30))} lbs 1RM</div>}
                  </div>
                </div>
                <div style={s.prMeta}>
                  {ctx && (
                    <>
                      <span style={s.prMetaItem}>📅 {new Date(ctx.date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
                      {ctx.reps > 0 && <span style={s.prMetaItem}>× {ctx.reps} reps</span>}
                      {ctx.phase && <span style={{ ...s.prMetaItem, color: PHASE_COLORS[ctx.phase] || '#888' }}>{ctx.phase}</span>}
                      {ctx.blockKey && ctx.blockKey !== 'freestyle' && <span style={s.prMetaItem}>{ctx.blockKey === 'block1' ? 'Block 1' : 'Block 2'}</span>}
                    </>
                  )}
                </div>
              </div>
            )
          })}

          {allTrackedLifts.filter(name => !primaryLifts.includes(name)).length > 0 && (
            <>
              <div style={{ ...s.sectionTitle, marginTop: 24 }}>ALL EXERCISES</div>
              {allTrackedLifts.filter(name => !primaryLifts.includes(name)).map(name => {
                const pr = prMap[name]
                const ctx = prContext[name]
                return (
                  <div key={name} style={s.prRow}>
                    <div>
                      <div style={s.prName}>{name}</div>
                      {ctx && <div style={s.prDate}>{new Date(ctx.date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: '2-digit' })}{ctx.phase ? ` · ${ctx.phase}` : ''}</div>}
                    </div>
                    <div style={s.prWeight}>{pr} lbs</div>
                  </div>
                )
              })}
            </>
          )}

          {Object.keys(prMap).length === 0 && (
            <div style={s.empty}>No PRs logged yet. Hit your first session! 💪</div>
          )}
        </div>
      )}

      {tab === 'blocks' && (
        <div style={s.content}>
          {blockSummaries.length === 0 && (
            <div style={s.empty}>Complete your first block to see summaries here.</div>
          )}
          {blockSummaries.map(summary => (
            <div key={summary.blockKey} style={s.blockCard}>
              <div style={s.blockHeader}>
                <span style={s.blockTitle}>{summary.blockKey === 'block1' ? 'Block 1' : 'Block 2'}</span>
                <span style={s.blockMeta}>{summary.sessions} sessions · Avg fatigue {summary.avgFatigue.toFixed(1)}/5</span>
              </div>
              {Object.entries(summary.progressMap).map(([name, data]) => (
                <div key={name} style={s.progressRow}>
                  <div style={s.progressName}>{name.replace('Barbell ', '').replace('Conventional ', '')}</div>
                  <div style={s.progressData}>
                    <span style={s.progressStart}>{data.start} lbs</span>
                    <span style={s.progressArrow}>→</span>
                    <span style={s.progressEnd}>{data.end} lbs</span>
                    <span style={{ ...s.progressGain, color: data.gain >= 0 ? '#4ade80' : '#f87171' }}>
                      {data.gain >= 0 ? '+' : ''}{data.gain} lbs
                    </span>
                  </div>
                </div>
              ))}
            </div>
          ))}

          <div style={s.sectionTitle}>SESSION HISTORY</div>
          {sessions.slice(0, 20).map((session, i) => {
            const logs = allLogs.filter(l => l.session_id === session.id)
            const dayLabels = { day1: 'Upper Str', day2: 'Lower Str', day3: 'Upper Vol', day4: 'Lower Ath', freestyle: 'Free' }
            return (
              <div key={session.id} style={s.sessionRow}>
                <span style={s.sessionNum}>#{sessions.length - i}</span>
                <div style={{ flex: 1 }}>
                  <div style={s.sessionDay}>{dayLabels[session.day_type] || session.day_type}</div>
                  <div style={s.sessionDate}>{new Date(session.date).toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short' })}</div>
                </div>
                <div style={s.sessionRight}>
                  {session.phase && <span style={{ ...s.phasePill, color: PHASE_COLORS[session.phase] || '#888' }}>{session.phase}</span>}
                  <span style={s.sessionEx}>{logs.length} ex</span>
                  <div style={{ width: 7, height: 7, borderRadius: '50%', background: getFatigueColor(session.fatigue_level) }} />
                </div>
              </div>
            )
          })}
        </div>
      )}

      {tab === 'volume' && (
        <div style={s.content}>
          <div style={s.sectionTitle}>WEEKLY VOLUME (LBS LIFTED)</div>
          {weeklyHistory.length === 0 && <div style={s.empty}>No data yet. Start logging sessions!</div>}
          {weeklyHistory.map((week, i) => (
            <div key={i} style={{ marginBottom: 10 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                <span style={{ fontFamily: "'DM Mono', monospace", fontSize: 11, color: '#888' }}>{week.label}</span>
                <span style={{ fontFamily: "'DM Mono', monospace", fontSize: 11, color: '#e8ff00' }}>
                  {week.volume > 0 ? `${Math.round(week.volume/1000)}k lbs` : '—'} · {week.sessions} sessions
                </span>
              </div>
              <div style={{ height: 8, background: '#161616', borderRadius: 4, overflow: 'hidden' }}>
                <div style={{
                  height: '100%',
                  width: `${week.volume > 0 ? (week.volume / maxVol) * 100 : 0}%`,
                  background: week.volume > 0 ? '#e8ff00' : '#222',
                  borderRadius: 4,
                  transition: 'width 0.4s ease'
                }} />
              </div>
            </div>
          ))}

          <div style={{ ...s.sectionTitle, marginTop: 28 }}>WEEKLY SETS PER MUSCLE</div>
          <div style={{ fontSize: 11, fontFamily: "'DM Mono', monospace", color: '#444', marginBottom: 12 }}>Based on programme design</div>
          {Object.entries(PROGRAMME_MUSCLES).map(([muscle, sets]) => {
            const low = muscle === 'calves' ? 8 : muscle === 'lower_back' ? 4 : muscle === 'glutes' ? 6 : muscle === 'biceps' || muscle === 'triceps' || muscle === 'core' ? 6 : 10
            const high = muscle === 'back' ? 20 : muscle === 'hamstrings' ? 20 : 20
            const pct = (sets / 20) * 100
            const color = sets >= low ? '#4ade80' : '#f87171'
            return (
              <div key={muscle} style={{ marginBottom: 10 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                  <span style={{ fontFamily: "'DM Mono', monospace", fontSize: 11, color: '#888', textTransform: 'capitalize' }}>{muscle.replace('_',' ')}</span>
                  <span style={{ fontFamily: "'DM Mono', monospace", fontSize: 11, color }}>
                    {sets} sets/wk
                  </span>
                </div>
                <div style={{ height: 6, background: '#161616', borderRadius: 4, overflow: 'hidden' }}>
                  <div style={{ height: '100%', width: `${pct}%`, background: color, borderRadius: 4 }} />
                </div>
              </div>
            )
          })}
        </div>
      )}

      {tab === 'bodyweight' && (
        <div style={s.content}>
          {bodyweightLog.length === 0 && (
            <div style={s.empty}>No bodyweight logged yet. Add it from the home screen.</div>
          )}
          {bodyweightLog.length > 0 && (
            <>
              <div style={s.bwCard}>
                <div style={s.bwCurrent}>{bodyweightLog[0].weight} lbs</div>
                <div style={s.bwLabel}>Current</div>
                {bodyweightLog.length > 1 && (
                  <div style={s.bwChange}>
                    {(bodyweightLog[0].weight - bodyweightLog[bodyweightLog.length - 1].weight) >= 0 ? '+' : ''}
                    {(bodyweightLog[0].weight - bodyweightLog[bodyweightLog.length - 1].weight).toFixed(1)} lbs since first entry
                  </div>
                )}
              </div>
              <div style={s.sectionTitle}>LOG</div>
              {bodyweightLog.map((entry, i) => (
                <div key={i} style={s.bwRow}>
                  <span style={s.bwDate}>{new Date(entry.date).toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short' })}</span>
                  <span style={s.bwVal}>{entry.weight} lbs</span>
                  {i < bodyweightLog.length - 1 && (
                    <span style={{ ...s.bwDiff, color: bodyweightLog[i].weight >= bodyweightLog[i+1].weight ? '#4ade80' : '#f87171' }}>
                      {(bodyweightLog[i].weight - bodyweightLog[i+1].weight) >= 0 ? '+' : ''}{(bodyweightLog[i].weight - bodyweightLog[i+1].weight).toFixed(1)}
                    </span>
                  )}
                </div>
              ))}
            </>
          )}
        </div>
      )}
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
  tabs: { display: 'flex', gap: 0, borderBottom: '1px solid #161616' },
  tab: { flex: 1, background: 'none', border: 'none', padding: '14px 4px', color: '#555', cursor: 'pointer', fontFamily: "'DM Mono', monospace", fontSize: 10, letterSpacing: 1, borderBottom: '2px solid transparent' },
  tabActive: { color: '#e8ff00', borderBottomColor: '#e8ff00' },
  content: { padding: '20px 20px' },
  sectionTitle: { fontFamily: "'DM Mono', monospace", fontSize: 10, color: '#444', letterSpacing: 3, marginBottom: 12 },
  prCard: { background: '#111', border: '1px solid #1a1a1a', borderRadius: 10, padding: '14px', marginBottom: 10 },
  prCardHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  prRow: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 0', borderBottom: '1px solid #141414' },
  prName: { fontSize: 14, color: '#f0ede8', fontWeight: 500 },
  prDate: { fontFamily: "'DM Mono', monospace", fontSize: 10, color: '#444', marginTop: 2 },
  prEmpty: { fontFamily: "'DM Mono', monospace", fontSize: 11, color: '#333' },
  prWeight: { fontFamily: "'DM Mono', monospace", fontSize: 16, color: '#e8ff00', fontWeight: 500 },
  prOneRM: { fontFamily: "'DM Mono', monospace", fontSize: 10, color: '#666', marginTop: 2, textAlign: 'right' },
  prMeta: { display: 'flex', flexWrap: 'wrap', gap: 8 },
  prMetaItem: { fontFamily: "'DM Mono', monospace", fontSize: 10, color: '#666' },
  empty: { textAlign: 'center', color: '#333', fontFamily: "'DM Mono', monospace", fontSize: 12, marginTop: 60 },
  blockCard: { background: '#111', border: '1px solid #1a1a1a', borderRadius: 12, padding: '16px', marginBottom: 16 },
  blockHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  blockTitle: { fontFamily: "'Bebas Neue', sans-serif", fontSize: 22, color: '#f0ede8', letterSpacing: 2 },
  blockMeta: { fontFamily: "'DM Mono', monospace", fontSize: 10, color: '#555' },
  progressRow: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 0', borderBottom: '1px solid #161616' },
  progressName: { fontSize: 13, color: '#888', flex: 1 },
  progressData: { display: 'flex', alignItems: 'center', gap: 6 },
  progressStart: { fontFamily: "'DM Mono', monospace", fontSize: 12, color: '#555' },
  progressArrow: { color: '#333', fontSize: 12 },
  progressEnd: { fontFamily: "'DM Mono', monospace", fontSize: 12, color: '#f0ede8' },
  progressGain: { fontFamily: "'DM Mono', monospace", fontSize: 12, fontWeight: 700 },
  sessionRow: { display: 'flex', alignItems: 'center', gap: 10, padding: '10px 0', borderBottom: '1px solid #141414' },
  sessionNum: { fontFamily: "'Bebas Neue', sans-serif", fontSize: 18, color: '#2a2a2a', width: 30 },
  sessionDay: { fontSize: 13, color: '#f0ede8', fontWeight: 500, marginBottom: 1 },
  sessionDate: { fontFamily: "'DM Mono', monospace", fontSize: 10, color: '#444' },
  sessionRight: { display: 'flex', alignItems: 'center', gap: 6 },
  phasePill: { fontFamily: "'DM Mono', monospace", fontSize: 9, textTransform: 'capitalize' },
  sessionEx: { fontFamily: "'DM Mono', monospace", fontSize: 10, color: '#555' },
  bwCard: { background: '#111', border: '1px solid #1a1a1a', borderRadius: 12, padding: '24px', textAlign: 'center', marginBottom: 24 },
  bwCurrent: { fontFamily: "'Bebas Neue', sans-serif", fontSize: 52, color: '#e8ff00', letterSpacing: 2, lineHeight: 1 },
  bwLabel: { fontFamily: "'DM Mono', monospace", fontSize: 11, color: '#555', letterSpacing: 2, marginTop: 4 },
  bwChange: { fontFamily: "'DM Mono', monospace", fontSize: 12, color: '#888', marginTop: 8 },
  bwRow: { display: 'flex', alignItems: 'center', gap: 10, padding: '10px 0', borderBottom: '1px solid #141414' },
  bwDate: { fontFamily: "'DM Mono', monospace", fontSize: 12, color: '#888', flex: 1 },
  bwVal: { fontFamily: "'DM Mono', monospace", fontSize: 14, color: '#f0ede8' },
  bwDiff: { fontFamily: "'DM Mono', monospace", fontSize: 12, width: 40, textAlign: 'right' },
}
