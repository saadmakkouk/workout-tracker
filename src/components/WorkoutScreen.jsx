import { useState, useRef } from 'react'
import { EXERCISES } from '../data/exercises.js'
import { swapExercise } from '../lib/programming.js'

const RIR_LABELS = { 0: 'Max', 1: '1 left', 2: '2 left', 3: '3 left', 4: '4 left', 5: '5+ left' }
const PHASE_COLORS = { accumulation: '#4ade80', intensification: '#e8ff00', deload: '#60a5fa' }

export default function WorkoutScreen({ workout, availableEquipment, allLogs, onFinish, onBack, onUpdateWorkout }) {
  const [exercises, setExercises] = useState(workout.exercises)
  const [activeIdx, setActiveIdx] = useState(0)
  const [showFinish, setShowFinish] = useState(false)
  const [fatigueLevel, setFatigueLevel] = useState(3)
  const [sessionNotes, setSessionNotes] = useState('')
  const [swapping, setSwapping] = useState(null)
  const [dismissedWarnings, setDismissedWarnings] = useState({})
  const [restTimer, setRestTimer] = useState(null)
  const [restRemaining, setRestRemaining] = useState(0)
  const timerRef = useRef(null)

  const activeEx = exercises[activeIdx]
  const phaseColor = PHASE_COLORS[workout.phase] || '#e8ff00'
  const completedCount = exercises.filter(ex => ex.sets.some(s => s.weight && s.reps)).length

  function updateSet(exIdx, setIdx, field, value) {
    setExercises(prev => {
      const updated = [...prev]
      const ex = { ...updated[exIdx], sets: [...updated[exIdx].sets] }
      ex.sets[setIdx] = { ...ex.sets[setIdx], [field]: value }
      updated[exIdx] = ex
      return updated
    })
  }

  function addSet(exIdx) {
    setExercises(prev => {
      const updated = [...prev]
      const ex = { ...updated[exIdx], sets: [...updated[exIdx].sets] }
      const last = ex.sets[ex.sets.length - 1]

      // Warning if exceeding recommended
      if (ex.sets.length >= 6) {
        if (!window.confirm('Adding more than 6 sets exceeds the recommended range. Continue?')) return prev
      }

      ex.sets.push({ setNumber: ex.sets.length + 1, weight: last?.weight || '', reps: '', rir: '', completed: false })
      updated[exIdx] = ex
      return updated
    })
  }

  function removeSet(exIdx) {
    setExercises(prev => {
      const updated = [...prev]
      const ex = { ...updated[exIdx], sets: [...updated[exIdx].sets] }
      if (ex.sets.length <= 1) return prev
      ex.sets = ex.sets.slice(0, -1)
      updated[exIdx] = ex
      return updated
    })
  }

  function startRestTimer(seconds) {
    if (timerRef.current) clearInterval(timerRef.current)
    setRestTimer(seconds)
    setRestRemaining(seconds)
    timerRef.current = setInterval(() => {
      setRestRemaining(prev => {
        if (prev <= 1) {
          clearInterval(timerRef.current)
          setRestTimer(null)
          return 0
        }
        return prev - 1
      })
    }, 1000)
  }

  function handleSwap(exIdx) {
    const ex = exercises[exIdx]
    const currentIds = exercises.map(e => e.exerciseId)
    const swapped = swapExercise(ex, availableEquipment, currentIds, allLogs)

    if (!swapped) {
      alert('No alternative available with your current equipment for this movement pattern.')
      return
    }

    setSwapping(exIdx)
    setExercises(prev => {
      const updated = [...prev]
      updated[exIdx] = {
        ...updated[exIdx],
        exerciseId: swapped.id,
        name: swapped.name,
        muscle: swapped.muscle,
        pattern: swapped.pattern,
        notes: swapped.notes,
        sets: updated[exIdx].sets.map(s => ({ ...s, reps: '', rir: '' })),
        warnings: [],
      }
      return updated
    })
    setTimeout(() => setSwapping(null), 800)
  }

  function dismissWarning(exId, warningText) {
    setDismissedWarnings(prev => ({
      ...prev,
      [exId]: [...(prev[exId] || []), warningText]
    }))
  }

  const activeWarnings = activeEx?.warnings?.filter(w =>
    !(dismissedWarnings[activeEx.exerciseId] || []).includes(w)
  ) || []

  const isSupersetPair = activeEx?.supersetWith !== null

  return (
    <div style={s.root}>
      {/* Header */}
      <div style={s.header}>
        <button style={s.backBtn} onClick={onBack}>← Exit</button>
        <div style={s.headerCenter}>
          <div style={s.dayLabel}>{workout.dayLabel}</div>
          <div style={{ ...s.phaseTag, color: phaseColor }}>{workout.phaseLabel} · Wk {workout.week}</div>
        </div>
        <button style={s.finishBtn} onClick={() => setShowFinish(true)}>Done</button>
      </div>

      {/* Progress */}
      <div style={s.progressBar}>
        <div style={{ ...s.progressFill, width: `${(completedCount / exercises.length) * 100}%`, background: phaseColor }} />
      </div>

      {/* Rest timer */}
      {restTimer !== null && (
        <div style={s.restBanner}>
          <span style={s.restText}>REST — {Math.floor(restRemaining / 60)}:{String(restRemaining % 60).padStart(2, '0')}</span>
          <button style={s.restSkip} onClick={() => { clearInterval(timerRef.current); setRestTimer(null) }}>Skip</button>
        </div>
      )}

      {/* Exercise tabs */}
      <div style={s.tabs}>
        {exercises.map((ex, i) => {
          const done = ex.sets.some(s => s.weight && s.reps)
          const isAthletic = ex.pattern === 'power'
          return (
            <button
              key={ex.id}
              style={{
                ...s.tab,
                ...(activeIdx === i ? { ...s.tabActive, borderColor: phaseColor, color: phaseColor } : {}),
                ...(done ? s.tabDone : {}),
                ...(isAthletic ? s.tabAthetic : {}),
              }}
              onClick={() => setActiveIdx(i)}
            >
              {isAthletic ? '⚡' : i + 1}
            </button>
          )
        })}
      </div>

      {/* Active exercise */}
      {activeEx && (
        <div style={s.exCard}>
          {/* Superset indicator */}
          {isSupersetPair && (
            <div style={s.supersetBadge}>⇄ SUPERSET</div>
          )}

          {/* Primary badge */}
          {activeEx.isPrimary && (
            <div style={{ ...s.primaryBadge, background: phaseColor }}>PRIMARY LIFT</div>
          )}

          <div style={s.exHeader}>
            <div style={{ flex: 1 }}>
              <div style={s.exPattern}>{activeEx.muscle?.toUpperCase().replace('_', ' ')}</div>
              <div style={s.exName}>{activeEx.name}</div>
              <div style={s.exChips}>
                <span style={s.chip}>{activeEx.sets.length} sets</span>
                <span style={s.chip}>{activeEx.repRange} reps</span>
                <span style={{ ...s.chip, color: phaseColor }}>RIR {activeEx.targetRIR}</span>
                <span style={s.chip}>Rest {activeEx.restSeconds}s</span>
              </div>
            </div>
            <button
              style={{ ...s.swapBtn, ...(swapping === activeIdx ? { color: '#4ade80', borderColor: '#4ade80' } : {}) }}
              onClick={() => handleSwap(activeIdx)}
            >
              {swapping === activeIdx ? '✓ Swapped' : '⇄ Swap'}
            </button>
          </div>

          {/* Exercise notes */}
          {activeEx.notes && (
            <div style={s.exerciseNote}>
              <span style={s.noteIcon}>💡</span>
              <span style={s.noteText}>{activeEx.notes}</span>
            </div>
          )}

          {/* Warnings */}
          {activeWarnings.map((warning, wi) => (
            <div key={wi} style={s.warning}>
              <span style={s.warningText}>⚠️ {warning}</span>
              <button style={s.dismissBtn} onClick={() => dismissWarning(activeEx.exerciseId, warning)}>Dismiss</button>
            </div>
          ))}

          {/* Sets */}
          <div style={s.setsHeader}>
            <span style={{ ...s.setCol, flex: 0.4 }}>Set</span>
            <span style={s.setCol}>Weight kg</span>
            <span style={s.setCol}>Reps</span>
            <span style={s.setCol}>RIR</span>
          </div>

          {activeEx.sets.map((set, si) => (
            <div key={si} style={s.setRow}>
              <span style={{ ...s.setNum, flex: 0.4 }}>{si + 1}</span>
              <input
                style={s.input}
                type="number"
                inputMode="decimal"
                placeholder={activeEx.sets[0]?.weight || '0'}
                value={set.weight}
                onChange={e => updateSet(activeIdx, si, 'weight', e.target.value)}
              />
              <input
                style={s.input}
                type="number"
                inputMode="numeric"
                placeholder="0"
                value={set.reps}
                onChange={e => updateSet(activeIdx, si, 'reps', e.target.value)}
              />
              <select
                style={s.rirSelect}
                value={set.rir}
                onChange={e => {
                  updateSet(activeIdx, si, 'rir', e.target.value)
                  if (e.target.value !== '' && si === activeEx.sets.length - 1) {
                    startRestTimer(activeEx.restSeconds)
                  }
                }}
              >
                <option value="">—</option>
                {[0, 1, 2, 3, 4, 5].map(r => (
                  <option key={r} value={r}>{r}</option>
                ))}
              </select>
            </div>
          ))}

          {/* Add / Remove sets */}
          <div style={s.setActions}>
            <button style={s.setActionBtn} onClick={() => addSet(activeIdx)}>+ Set</button>
            <button style={s.setActionBtn} onClick={() => removeSet(activeIdx)}>− Set</button>
            <button style={{ ...s.setActionBtn, color: '#e8ff00' }} onClick={() => startRestTimer(activeEx.restSeconds)}>
              ⏱ {activeEx.restSeconds}s
            </button>
          </div>

          {/* Navigation */}
          <div style={s.navRow}>
            {activeIdx > 0 && (
              <button style={s.navBtn} onClick={() => setActiveIdx(activeIdx - 1)}>← Prev</button>
            )}
            {activeIdx < exercises.length - 1 && (
              <button style={{ ...s.navBtn, ...s.navNext }} onClick={() => setActiveIdx(activeIdx + 1)}>Next →</button>
            )}
            {activeIdx === exercises.length - 1 && (
              <button style={{ ...s.navBtn, ...s.navFinish, background: phaseColor }} onClick={() => setShowFinish(true)}>
                Finish Session
              </button>
            )}
          </div>
        </div>
      )}

      {/* Finish Modal */}
      {showFinish && (
        <div style={s.modal}>
          <div style={s.modalCard}>
            <div style={s.modalTitle}>SESSION COMPLETE</div>
            <div style={s.modalMeta}>{completedCount}/{exercises.length} exercises logged</div>

            <div style={s.modalLabel}>Overall fatigue today?</div>
            <div style={s.fatigueRow}>
              {[1, 2, 3, 4, 5].map(n => (
                <button
                  key={n}
                  style={{ ...s.fatigueBtn, ...(fatigueLevel === n ? { ...s.fatigueBtnActive, background: phaseColor + '33', borderColor: phaseColor, color: phaseColor } : {}) }}
                  onClick={() => setFatigueLevel(n)}
                >
                  {n}
                </button>
              ))}
            </div>
            <div style={s.fatigueLegend}>
              <span>1 — Fresh</span><span>5 — Destroyed</span>
            </div>

            <textarea
              style={s.notesInput}
              placeholder="Any notes? (optional — form cues, what felt good, what didn't)"
              value={sessionNotes}
              onChange={e => setSessionNotes(e.target.value)}
              rows={3}
            />

            <button style={{ ...s.saveBtn, background: phaseColor }} onClick={() => onFinish(exercises, fatigueLevel, sessionNotes)}>
              SAVE SESSION
            </button>
            <button style={s.cancelBtn} onClick={() => setShowFinish(false)}>Keep Lifting</button>
          </div>
        </div>
      )}
    </div>
  )
}

const s = {
  root: { minHeight: '100vh', background: '#0a0a0a', paddingBottom: 40 },
  header: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 20px', borderBottom: '1px solid #161616' },
  backBtn: { background: 'none', border: 'none', color: '#555', cursor: 'pointer', fontFamily: "'DM Mono', monospace", fontSize: 13 },
  headerCenter: { textAlign: 'center' },
  dayLabel: { fontFamily: "'DM Mono', monospace", fontSize: 10, color: '#555', letterSpacing: 2 },
  phaseTag: { fontFamily: "'Bebas Neue', sans-serif", fontSize: 18, letterSpacing: 2 },
  finishBtn: { background: 'none', border: '1px solid #222', borderRadius: 8, padding: '6px 14px', color: '#666', cursor: 'pointer', fontFamily: "'DM Mono', monospace", fontSize: 12 },
  progressBar: { height: 3, background: '#161616' },
  progressFill: { height: '100%', transition: 'width 0.4s ease' },
  restBanner: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#0d1a00', padding: '10px 20px', borderBottom: '1px solid #1a2e00' },
  restText: { fontFamily: "'Bebas Neue', sans-serif", fontSize: 22, color: '#4ade80', letterSpacing: 3 },
  restSkip: { background: 'none', border: 'none', color: '#555', cursor: 'pointer', fontFamily: "'DM Mono', monospace", fontSize: 12 },
  tabs: { display: 'flex', gap: 6, padding: '12px 16px', overflowX: 'auto' },
  tab: { width: 34, height: 34, borderRadius: '50%', border: '1px solid #222', background: '#111', color: '#555', cursor: 'pointer', fontFamily: "'DM Mono', monospace", fontSize: 12, flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' },
  tabActive: { border: '2px solid', background: '#141400' },
  tabDone: { background: '#0d1a00', border: '1px solid #4ade80', color: '#4ade80' },
  tabAthetic: { background: '#0a0014', border: '1px solid #7c3aed', color: '#7c3aed' },
  exCard: { margin: '0 14px', background: '#111', border: '1px solid #1a1a1a', borderRadius: 16, padding: '18px 16px', position: 'relative' },
  supersetBadge: { fontFamily: "'DM Mono', monospace", fontSize: 9, color: '#60a5fa', letterSpacing: 2, marginBottom: 8 },
  primaryBadge: { position: 'absolute', top: -1, right: 16, fontSize: 9, fontWeight: 700, color: '#0a0a0a', fontFamily: "'DM Mono', monospace", letterSpacing: 1.5, padding: '3px 10px', borderRadius: '0 0 8px 8px' },
  exHeader: { display: 'flex', alignItems: 'flex-start', gap: 10, marginBottom: 12 },
  exPattern: { fontFamily: "'DM Mono', monospace", fontSize: 9, color: '#444', letterSpacing: 2, marginBottom: 4 },
  exName: { fontFamily: "'Bebas Neue', sans-serif", fontSize: 26, color: '#f0ede8', letterSpacing: 1, lineHeight: 1.1, marginBottom: 8 },
  exChips: { display: 'flex', flexWrap: 'wrap', gap: 5 },
  chip: { fontFamily: "'DM Mono', monospace", fontSize: 10, background: '#0a0a0a', border: '1px solid #1a1a1a', borderRadius: 20, padding: '3px 8px', color: '#555' },
  swapBtn: { background: 'transparent', border: '1px solid #222', borderRadius: 8, padding: '8px 10px', color: '#555', cursor: 'pointer', fontFamily: "'DM Mono', monospace", fontSize: 11, flexShrink: 0, transition: 'all 0.2s' },
  exerciseNote: { display: 'flex', gap: 8, background: '#0a0a0a', borderRadius: 8, padding: '10px 12px', marginBottom: 12 },
  noteIcon: { fontSize: 12, flexShrink: 0 },
  noteText: { fontSize: 12, color: '#555', lineHeight: 1.5 },
  warning: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#1a0f00', border: '1px solid #92400e', borderRadius: 8, padding: '8px 12px', marginBottom: 8 },
  warningText: { fontSize: 11, color: '#d97706', lineHeight: 1.4, flex: 1 },
  dismissBtn: { background: 'none', border: 'none', color: '#555', cursor: 'pointer', fontFamily: "'DM Mono', monospace", fontSize: 10, flexShrink: 0, marginLeft: 8 },
  setsHeader: { display: 'flex', gap: 6, marginBottom: 6 },
  setCol: { fontFamily: "'DM Mono', monospace", fontSize: 9, color: '#333', letterSpacing: 1, flex: 1, textAlign: 'center' },
  setRow: { display: 'flex', gap: 6, marginBottom: 6, alignItems: 'center' },
  setNum: { fontFamily: "'DM Mono', monospace", fontSize: 12, color: '#444', flex: 0.4, textAlign: 'center' },
  input: { flex: 1, background: '#0a0a0a', border: '1px solid #1a1a1a', borderRadius: 8, padding: '12px 4px', color: '#f0ede8', fontFamily: "'DM Mono', monospace", fontSize: 16, textAlign: 'center', outline: 'none' },
  rirSelect: { flex: 1, background: '#0a0a0a', border: '1px solid #1a1a1a', borderRadius: 8, padding: '12px 4px', color: '#f0ede8', fontFamily: "'DM Mono', monospace", fontSize: 14, textAlign: 'center', outline: 'none' },
  setActions: { display: 'flex', gap: 6, marginTop: 10, marginBottom: 16 },
  setActionBtn: { flex: 1, background: 'transparent', border: '1px solid #1a1a1a', borderRadius: 8, padding: '8px 4px', color: '#555', cursor: 'pointer', fontFamily: "'DM Mono', monospace", fontSize: 12 },
  navRow: { display: 'flex', gap: 8 },
  navBtn: { flex: 1, background: '#0a0a0a', border: '1px solid #1a1a1a', borderRadius: 10, padding: '14px', color: '#666', cursor: 'pointer', fontFamily: "'DM Mono', monospace", fontSize: 13 },
  navNext: { background: '#141414', color: '#f0ede8' },
  navFinish: { border: 'none', color: '#0a0a0a', fontFamily: "'Bebas Neue', sans-serif", fontSize: 18, letterSpacing: 2 },
  modal: { position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.9)', display: 'flex', alignItems: 'flex-end', zIndex: 100 },
  modalCard: { background: '#111', border: '1px solid #1a1a1a', borderRadius: '20px 20px 0 0', padding: '28px 24px 48px', width: '100%', maxWidth: 480, margin: '0 auto' },
  modalTitle: { fontFamily: "'Bebas Neue', sans-serif", fontSize: 32, color: '#f0ede8', letterSpacing: 3, marginBottom: 4 },
  modalMeta: { fontFamily: "'DM Mono', monospace", fontSize: 11, color: '#555', marginBottom: 24 },
  modalLabel: { fontFamily: "'DM Mono', monospace", fontSize: 10, color: '#555', letterSpacing: 2, marginBottom: 12 },
  fatigueRow: { display: 'flex', gap: 8, marginBottom: 8 },
  fatigueBtn: { flex: 1, background: '#0a0a0a', border: '1px solid #1a1a1a', borderRadius: 8, padding: '14px 4px', color: '#555', cursor: 'pointer', fontFamily: "'Bebas Neue', sans-serif", fontSize: 24 },
  fatigueBtnActive: { background: '#141400' },
  fatigueLegend: { display: 'flex', justifyContent: 'space-between', fontFamily: "'DM Mono', monospace", fontSize: 10, color: '#333', marginBottom: 20 },
  notesInput: { width: '100%', background: '#0a0a0a', border: '1px solid #1a1a1a', borderRadius: 10, padding: '12px', color: '#f0ede8', fontFamily: "'DM Sans', sans-serif", fontSize: 13, resize: 'none', outline: 'none', boxSizing: 'border-box', marginBottom: 16 },
  saveBtn: { width: '100%', border: 'none', borderRadius: 12, padding: '18px', fontFamily: "'Bebas Neue', sans-serif", fontSize: 24, letterSpacing: 4, color: '#0a0a0a', cursor: 'pointer', marginBottom: 10 },
  cancelBtn: { width: '100%', background: 'transparent', border: 'none', color: '#444', cursor: 'pointer', fontFamily: "'DM Mono', monospace", fontSize: 13, padding: '8px' },
}
