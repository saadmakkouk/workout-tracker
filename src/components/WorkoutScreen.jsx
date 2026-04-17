import { useState, useRef } from 'react'
import { EXERCISES } from '../data/exercises.js'
import { swapExercise, getWarmupSets } from '../lib/programming.js'

export default function WorkoutScreen({ workout, availableEquipment, allLogs, exerciseNotes, onFinish, onBack, onUpdateWorkout, onSaveExerciseNote }) {
  const [exercises, setExercises] = useState(workout.exercises)
  const [activeIdx, setActiveIdx] = useState(0)
  const [showFinish, setShowFinish] = useState(false)
  const [fatigueLevel, setFatigueLevel] = useState(3)
  const [sessionNotes, setSessionNotes] = useState('')
  const [swapping, setSwapping] = useState(null)
  const [dismissedWarnings, setDismissedWarnings] = useState({})
  const [restRemaining, setRestRemaining] = useState(null)
  const [showWarmup, setShowWarmup] = useState(false)
  const [showExNote, setShowExNote] = useState(false)
  const [showAddPicker, setShowAddPicker] = useState(false)
  const [filterMuscle, setFilterMuscle] = useState('all')
  const [exNoteText, setExNoteText] = useState('')
  const timerRef = useRef(null)

  const activeEx = exercises[activeIdx]
  const phaseColor = { accumulation: '#4ade80', intensification: '#e8ff00', deload: '#60a5fa' }[workout.phase] || '#e8ff00'
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
      if (ex.sets.length >= 7 && !window.confirm('Adding more than 7 sets exceeds the recommended range. Continue?')) return prev
      const last = ex.sets[ex.sets.length - 1]
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

  function startRest(seconds) {
    if (timerRef.current) clearInterval(timerRef.current)
    setRestRemaining(seconds)
    timerRef.current = setInterval(() => {
      setRestRemaining(prev => {
        if (prev <= 1) { clearInterval(timerRef.current); return null }
        return prev - 1
      })
    }, 1000)
  }

  function handleSwap(exIdx) {
    const ex = exercises[exIdx]
    const currentIds = exercises.map(e => e.exerciseId)
    const swapped = swapExercise(ex, availableEquipment, currentIds, allLogs)
    if (!swapped) { alert('No alternative available with your current equipment.'); return }

    setSwapping(exIdx)
    setExercises(prev => {
      const updated = [...prev]
      const warmupSets = ex.isPrimary ? getWarmupSets(ex.sets[0]?.weight) : []
      updated[exIdx] = {
        ...updated[exIdx],
        exerciseId: swapped.id, name: swapped.name,
        muscle: swapped.muscle, pattern: swapped.pattern,
        notes: swapped.notes, warnings: [],
        warmupSets,
        swapHistory: [...(updated[exIdx].swapHistory || []), ex.name],
        sets: updated[exIdx].sets.map(s => ({ ...s, reps: '', rir: '' })),
      }
      return updated
    })
    setTimeout(() => setSwapping(null), 800)
  }

  function removeExercise(exIdx) {
    if (exercises.length <= 1) return
    const newExercises = exercises.filter((_, i) => i !== exIdx)
    setExercises(newExercises)
    setActiveIdx(Math.min(activeIdx, newExercises.length - 1))
  }

  function addExerciseToSession(ex) {
    const newEx = {
      id: `${ex.id}_${Date.now()}_${Math.random().toString(36).substr(2,4)}`,
      exerciseId: ex.id, name: ex.name, muscle: ex.muscle, pattern: ex.pattern,
      isPrimary: false,
      sets: Array(ex.sets_default || 3).fill(null).map((_, i) => ({
        setNumber: i+1, weight: '', reps: '', rir: '', completed: false
      })),
      repRange: ex.rep_range_accumulation,
      targetRIR: ex.rir_target_accumulation,
      restSeconds: ex.rest_accumulation,
      notes: ex.notes, warnings: [], swapHistory: [],
    }
    setExercises(prev => [...prev, newEx])
    setActiveIdx(exercises.length)
    setShowAddPicker(false)
  }

  function openExNote() {
    setExNoteText(exerciseNotes[activeEx?.name] || '')
    setShowExNote(true)
  }

  function saveExNote() {
    if (activeEx) onSaveExerciseNote(activeEx.name, exNoteText)
    setShowExNote(false)
  }

  const activeWarnings = (activeEx?.warnings || []).filter(w => !(dismissedWarnings[activeEx?.exerciseId] || []).includes(w))
  const myNote = activeEx ? exerciseNotes[activeEx.name] : null
  const warmupSets = activeEx?.isPrimary && activeEx?.sets[0]?.weight ? getWarmupSets(activeEx.sets[0].weight) : []

  return (
    <div style={s.root}>
      {/* Header */}
      <div style={s.header}>
        <button style={s.backBtn} onClick={onBack}>← Exit</button>
        <div style={s.headerCenter}>
          <div style={s.dayLabel}>{workout.dayLabel}</div>
          <div style={{ ...s.phaseTag, color: phaseColor }}>{workout.phaseLabel} · Wk {workout.week}</div>
        </div>
        <button style={s.doneBtn} onClick={() => setShowFinish(true)}>Done</button>
      </div>

      {/* Progress bar */}
      <div style={s.progressBar}>
        <div style={{ ...s.progressFill, width: `${(completedCount / exercises.length) * 100}%`, background: phaseColor }} />
      </div>

      {/* Readiness adjustment banner */}
      {workout.readinessAdjustment && workout.readinessAdjustment.multiplier !== 1.0 && (
        <div style={{ ...s.readinessBanner, borderColor: workout.readinessAdjustment.color }}>
          <span style={{ color: workout.readinessAdjustment.color }}>{workout.readinessAdjustment.label}</span>
        </div>
      )}

      {/* Rest timer */}
      {restRemaining !== null && (
        <div style={s.restBanner}>
          <span style={s.restText}>REST — {Math.floor(restRemaining / 60)}:{String(restRemaining % 60).padStart(2, '0')}</span>
          <button style={s.restSkip} onClick={() => { clearInterval(timerRef.current); setRestRemaining(null) }}>Skip</button>
        </div>
      )}

      {/* Exercise tabs */}
      <div style={s.tabs}>
        {exercises.map((ex, i) => {
          const done = ex.sets.some(s => s.weight && s.reps)
          const isAthletic = ex.pattern === 'power'
          return (
            <button key={ex.id} style={{
              ...s.tab,
              ...(activeIdx === i ? { ...s.tabActive, borderColor: phaseColor, color: phaseColor } : {}),
              ...(done ? s.tabDone : {}),
              ...(isAthletic ? { background: '#0a0014', borderColor: '#7c3aed', color: '#7c3aed' } : {}),
            }} onClick={() => setActiveIdx(i)}>
              {isAthletic ? '⚡' : i + 1}
            </button>
          )
        })}
      </div>

      {/* Active exercise */}
      {activeEx && (
        <div style={s.exCard}>
          {activeEx.isPrimary && <div style={{ ...s.primaryBadge, background: phaseColor }}>PRIMARY</div>}

          <div style={s.exHeader}>
            <div style={{ flex: 1 }}>
              <div style={s.exMuscle}>{activeEx.muscle?.replace('_', ' ').toUpperCase()}</div>
              <div style={s.exName}>{activeEx.name}</div>
              {activeEx.swapHistory?.length > 0 && (
                <div style={s.swapBadge}>↔ Swapped from {activeEx.swapHistory[activeEx.swapHistory.length - 1]}</div>
              )}
              <div style={s.chips}>
                <span style={s.chip}>{activeEx.sets.length} sets</span>
                <span style={s.chip}>{activeEx.repRange} reps</span>
                <span style={{ ...s.chip, color: phaseColor }}>RIR {activeEx.targetRIR}</span>
                <span style={s.chip}>{activeEx.restSeconds}s rest</span>
              </div>
            </div>
            <div style={s.exActions}>
              <button style={{ ...s.swapBtn, ...(swapping === activeIdx ? { color: '#4ade80', borderColor: '#4ade80' } : {}) }} onClick={() => handleSwap(activeIdx)}>
                {swapping === activeIdx ? '✓' : '⇄'}
              </button>
              <button style={s.noteBtn} onClick={openExNote}>📝</button>
              {exercises.length > 1 && (
                <button style={{ ...s.noteBtn, color: '#f87171' }} onClick={() => removeExercise(activeIdx)}>✕</button>
              )}
            </div>
          </div>

          {/* Exercise coaching note */}
          {activeEx.notes && (
            <div style={s.coachNote}>
              <span style={s.noteIcon}>💡</span>
              <span style={s.noteText}>{activeEx.notes}</span>
            </div>
          )}

          {/* My personal note */}
          {myNote && (
            <div style={s.myNote} onClick={openExNote}>
              <span style={s.noteIcon}>📝</span>
              <span style={{ ...s.noteText, color: '#e8ff00' }}>{myNote}</span>
            </div>
          )}

          {/* Warnings */}
          {activeWarnings.map((w, wi) => (
            <div key={wi} style={s.warning}>
              <span style={s.warningText}>⚠️ {w}</span>
              <button style={s.dismissBtn} onClick={() => setDismissedWarnings(p => ({ ...p, [activeEx.exerciseId]: [...(p[activeEx.exerciseId] || []), w] }))}>✕</button>
            </div>
          ))}

          {/* Warmup sets for primary lifts */}
          {activeEx.isPrimary && warmupSets.length > 0 && (
            <div style={s.warmupSection}>
              <button style={s.warmupToggle} onClick={() => setShowWarmup(!showWarmup)}>
                {showWarmup ? '▼' : '▶'} Warm-up Sets
              </button>
              {showWarmup && (
                <div style={s.warmupSets}>
                  {warmupSets.map((ws, i) => (
                    <div key={i} style={s.warmupRow}>
                      <span style={s.warmupLabel}>{ws.label}</span>
                      <span style={s.warmupVal}>{ws.weight} lbs × {ws.reps}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Sets */}
          <div style={s.setsHeader}>
            <span style={{ ...s.setCol, flex: 0.5 }}>Set</span>
            <span style={s.setCol}>Weight lbs</span>
            <span style={s.setCol}>Reps</span>
            <span style={s.setCol}>RIR</span>
          </div>
          {activeEx.sets.map((set, si) => (
            <div key={si} style={s.setRow}>
              <span style={{ ...s.setNum, flex: 0.5 }}>{si + 1}</span>
              <input style={s.input} type="number" inputMode="decimal"
                placeholder={activeEx.sets[0]?.weight || '0'} value={set.weight}
                onChange={e => updateSet(activeIdx, si, 'weight', e.target.value)} />
              <input style={s.input} type="number" inputMode="numeric"
                placeholder="0" value={set.reps}
                onChange={e => updateSet(activeIdx, si, 'reps', e.target.value)} />
              <select style={s.rirSelect} value={set.rir}
                onChange={e => {
                  updateSet(activeIdx, si, 'rir', e.target.value)
                  if (e.target.value !== '' && si === activeEx.sets.length - 1) startRest(activeEx.restSeconds)
                }}>
                <option value="">—</option>
                {[0,1,2,3,4,5].map(r => <option key={r} value={r}>{r}</option>)}
              </select>
            </div>
          ))}

          {/* Set controls */}
          <div style={s.setActions}>
            <button style={s.setBtn} onClick={() => addSet(activeIdx)}>+ Set</button>
            <button style={s.setBtn} onClick={() => removeSet(activeIdx)}>− Set</button>
            <button style={{ ...s.setBtn, color: '#60a5fa' }} onClick={() => startRest(activeEx.restSeconds)}>
              ⏱ {activeEx.restSeconds}s
            </button>
          </div>

          {/* Navigation */}
          <div style={s.navRow}>
            {activeIdx > 0 && <button style={s.navBtn} onClick={() => setActiveIdx(activeIdx - 1)}>← Prev</button>}
            {activeIdx < exercises.length - 1 && (
              <button style={{ ...s.navBtn, ...s.navNext }} onClick={() => setActiveIdx(activeIdx + 1)}>Next →</button>
            )}
            {activeIdx === exercises.length - 1 && (
              <button style={{ ...s.navBtn, background: phaseColor, border: 'none', color: '#0a0a0a', fontFamily: "'Bebas Neue', sans-serif", fontSize: 18, letterSpacing: 2 }} onClick={() => setShowFinish(true)}>
                Finish Session
              </button>
            )}
          </div>
        </div>
      )}

      {/* Add Exercise Button */}
      <div style={{ padding: '12px 14px 0' }}>
        <button style={s.addExBtn} onClick={() => setShowAddPicker(true)}>+ Add Exercise</button>
      </div>

      {/* Add Exercise Picker */}
      {showAddPicker && (
        <div style={s.modal}>
          <div style={{ ...s.modalCard, maxHeight: '85vh', overflowY: 'auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <span style={s.modalTitle}>ADD EXERCISE</span>
              <button style={{ background: 'none', border: 'none', color: '#555', cursor: 'pointer', fontSize: 18 }} onClick={() => setShowAddPicker(false)}>✕</button>
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 16 }}>
              {['all','chest','back','shoulders','biceps','triceps','quads','hamstrings','glutes','calves','core'].map(m => (
                <button key={m} style={{ background: filterMuscle === m ? '#14140a' : '#0a0a0a', border: `1px solid ${filterMuscle === m ? '#e8ff00' : '#1a1a1a'}`, borderRadius: 20, padding: '5px 12px', color: filterMuscle === m ? '#e8ff00' : '#555', cursor: 'pointer', fontFamily: "'DM Mono', monospace", fontSize: 10, textTransform: 'capitalize' }}
                  onClick={() => setFilterMuscle(m)}>
                  {m === 'all' ? 'All' : m.replace('_',' ')}
                </button>
              ))}
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {Object.values(EXERCISES)
                .filter(ex => {
                  const hasEquip = ex.equipment.length === 0 || ex.equipment.every(eq => availableEquipment.includes(eq))
                  const notUsed = !exercises.find(e => e.exerciseId === ex.id)
                  const muscleMatch = filterMuscle === 'all' || ex.muscle === filterMuscle
                  return hasEquip && notUsed && muscleMatch
                })
                .sort((a, b) => (b.quality_score || 5) - (a.quality_score || 5))
                .map(ex => (
                  <button key={ex.id} style={{ background: '#0a0a0a', border: '1px solid #161616', borderRadius: 10, padding: '12px 14px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer', textAlign: 'left' }}
                    onClick={() => addExerciseToSession(ex)}>
                    <div>
                      <div style={{ fontSize: 14, color: '#f0ede8', fontWeight: 500 }}>{ex.name}</div>
                      <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 10, color: '#555', marginTop: 2 }}>{ex.muscle?.replace('_',' ')} · Q{ex.quality_score}</div>
                    </div>
                    <span style={{ color: '#e8ff00', fontSize: 18 }}>+</span>
                  </button>
                ))
              }
            </div>
          </div>
        </div>
      )}

      {/* Exercise Note Modal */}
      {showExNote && (
        <div style={s.modal}>
          <div style={s.modalCard}>
            <div style={s.modalTitle}>MY NOTE</div>
            <div style={s.modalSub}>{activeEx?.name}</div>
            <textarea
              style={s.noteInput}
              placeholder="Your coaching notes for this exercise... (form cues, feel, what works)"
              value={exNoteText}
              onChange={e => setExNoteText(e.target.value)}
              rows={5}
              autoFocus
            />
            <button style={{ ...s.saveBtn, background: '#e8ff00' }} onClick={saveExNote}>Save Note</button>
            <button style={s.cancelBtn} onClick={() => setShowExNote(false)}>Cancel</button>
          </div>
        </div>
      )}

      {/* Finish Modal */}
      {showFinish && (
        <div style={s.modal}>
          <div style={s.modalCard}>
            <div style={s.modalTitle}>SESSION DONE</div>
            <div style={s.modalSub}>{completedCount}/{exercises.length} exercises logged</div>

            <div style={s.modalLabel}>Overall fatigue?</div>
            <div style={s.fatigueRow}>
              {[1,2,3,4,5].map(n => (
                <button key={n} style={{ ...s.fatigueBtn, ...(fatigueLevel === n ? { background: phaseColor + '33', borderColor: phaseColor, color: phaseColor } : {}) }}
                  onClick={() => setFatigueLevel(n)}>{n}</button>
              ))}
            </div>
            <div style={s.fatigueLegend}><span>1 — Fresh</span><span>5 — Destroyed</span></div>

            <textarea style={s.noteInput} placeholder="Session notes? (optional)" value={sessionNotes}
              onChange={e => setSessionNotes(e.target.value)} rows={3} />

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
  doneBtn: { background: 'none', border: '1px solid #222', borderRadius: 8, padding: '6px 14px', color: '#666', cursor: 'pointer', fontFamily: "'DM Mono', monospace", fontSize: 12 },
  progressBar: { height: 3, background: '#161616' },
  progressFill: { height: '100%', transition: 'width 0.4s ease' },
  readinessBanner: { padding: '8px 20px', borderBottom: '1px solid', fontSize: 12, fontFamily: "'DM Mono', monospace" },
  restBanner: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#0d1a00', padding: '10px 20px', borderBottom: '1px solid #1a2e00' },
  restText: { fontFamily: "'Bebas Neue', sans-serif", fontSize: 22, color: '#4ade80', letterSpacing: 3 },
  restSkip: { background: 'none', border: 'none', color: '#555', cursor: 'pointer', fontFamily: "'DM Mono', monospace", fontSize: 12 },
  tabs: { display: 'flex', gap: 6, padding: '12px 16px', overflowX: 'auto' },
  tab: { width: 34, height: 34, borderRadius: '50%', border: '1px solid #222', background: '#111', color: '#555', cursor: 'pointer', fontFamily: "'DM Mono', monospace", fontSize: 12, flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' },
  tabActive: { border: '2px solid', background: '#141400' },
  tabDone: { background: '#0d1a00', border: '1px solid #4ade80', color: '#4ade80' },
  exCard: { margin: '0 14px', background: '#111', border: '1px solid #1a1a1a', borderRadius: 16, padding: '18px 16px', position: 'relative' },
  primaryBadge: { position: 'absolute', top: -1, right: 16, fontSize: 9, fontWeight: 700, color: '#0a0a0a', fontFamily: "'DM Mono', monospace", letterSpacing: 1.5, padding: '3px 10px', borderRadius: '0 0 8px 8px' },
  exHeader: { display: 'flex', alignItems: 'flex-start', gap: 10, marginBottom: 10 },
  exMuscle: { fontFamily: "'DM Mono', monospace", fontSize: 9, color: '#444', letterSpacing: 2, marginBottom: 3 },
  exName: { fontFamily: "'Bebas Neue', sans-serif", fontSize: 26, color: '#f0ede8', letterSpacing: 1, lineHeight: 1.1, marginBottom: 4 },
  swapBadge: { fontFamily: "'DM Mono', monospace", fontSize: 9, color: '#7c3aed', marginBottom: 6 },
  chips: { display: 'flex', flexWrap: 'wrap', gap: 5 },
  chip: { fontFamily: "'DM Mono', monospace", fontSize: 10, background: '#0a0a0a', border: '1px solid #1a1a1a', borderRadius: 20, padding: '3px 8px', color: '#555' },
  exActions: { display: 'flex', flexDirection: 'column', gap: 6 },
  swapBtn: { background: 'transparent', border: '1px solid #222', borderRadius: 8, padding: '8px 10px', color: '#555', cursor: 'pointer', fontFamily: "'DM Mono', monospace", fontSize: 14 },
  noteBtn: { background: 'transparent', border: '1px solid #222', borderRadius: 8, padding: '8px 10px', cursor: 'pointer', fontSize: 14 },
  coachNote: { display: 'flex', gap: 8, background: '#0a0a0a', borderRadius: 8, padding: '10px 12px', marginBottom: 8 },
  myNote: { display: 'flex', gap: 8, background: '#141400', borderRadius: 8, padding: '8px 12px', marginBottom: 8, cursor: 'pointer', border: '1px solid #2a2a00' },
  noteIcon: { fontSize: 12, flexShrink: 0, marginTop: 1 },
  noteText: { fontSize: 12, color: '#555', lineHeight: 1.5 },
  warning: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#1a0f00', border: '1px solid #92400e', borderRadius: 8, padding: '8px 12px', marginBottom: 8 },
  warningText: { fontSize: 11, color: '#d97706', flex: 1 },
  dismissBtn: { background: 'none', border: 'none', color: '#555', cursor: 'pointer', fontSize: 14 },
  warmupSection: { marginBottom: 12 },
  warmupToggle: { background: 'none', border: 'none', color: '#555', cursor: 'pointer', fontFamily: "'DM Mono', monospace", fontSize: 11, letterSpacing: 1 },
  warmupSets: { marginTop: 8, display: 'flex', flexDirection: 'column', gap: 4 },
  warmupRow: { display: 'flex', justifyContent: 'space-between', padding: '6px 12px', background: '#0a0a0a', borderRadius: 6 },
  warmupLabel: { fontFamily: "'DM Mono', monospace", fontSize: 11, color: '#555' },
  warmupVal: { fontFamily: "'DM Mono', monospace", fontSize: 11, color: '#888' },
  setsHeader: { display: 'flex', gap: 6, marginBottom: 6 },
  setCol: { fontFamily: "'DM Mono', monospace", fontSize: 9, color: '#333', flex: 1, textAlign: 'center' },
  setRow: { display: 'flex', gap: 6, marginBottom: 6 },
  setNum: { fontFamily: "'DM Mono', monospace", fontSize: 12, color: '#444', flex: 0.5, textAlign: 'center', paddingTop: 12 },
  input: { flex: 1, background: '#0a0a0a', border: '1px solid #1a1a1a', borderRadius: 8, padding: '12px 4px', color: '#f0ede8', fontFamily: "'DM Mono', monospace", fontSize: 16, textAlign: 'center', outline: 'none' },
  rirSelect: { flex: 1, background: '#0a0a0a', border: '1px solid #1a1a1a', borderRadius: 8, padding: '12px 4px', color: '#f0ede8', fontFamily: "'DM Mono', monospace", fontSize: 14, textAlign: 'center', outline: 'none' },
  setActions: { display: 'flex', gap: 6, marginTop: 10, marginBottom: 16 },
  setBtn: { flex: 1, background: 'transparent', border: '1px solid #1a1a1a', borderRadius: 8, padding: '8px', color: '#555', cursor: 'pointer', fontFamily: "'DM Mono', monospace", fontSize: 12 },
  navRow: { display: 'flex', gap: 8 },
  navBtn: { flex: 1, background: '#0a0a0a', border: '1px solid #1a1a1a', borderRadius: 10, padding: '14px', color: '#666', cursor: 'pointer', fontFamily: "'DM Mono', monospace", fontSize: 13 },
  navNext: { background: '#141414', color: '#f0ede8' },
  modal: { position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.9)', display: 'flex', alignItems: 'flex-end', zIndex: 100 },
  modalCard: { background: '#111', border: '1px solid #1a1a1a', borderRadius: '20px 20px 0 0', padding: '28px 24px 48px', width: '100%', maxWidth: 480, margin: '0 auto' },
  modalTitle: { fontFamily: "'Bebas Neue', sans-serif", fontSize: 28, color: '#f0ede8', letterSpacing: 3, marginBottom: 4 },
  modalSub: { fontFamily: "'DM Mono', monospace", fontSize: 11, color: '#555', marginBottom: 20 },
  modalLabel: { fontFamily: "'DM Mono', monospace", fontSize: 10, color: '#555', letterSpacing: 2, marginBottom: 12 },
  fatigueRow: { display: 'flex', gap: 8, marginBottom: 8 },
  fatigueBtn: { flex: 1, background: '#0a0a0a', border: '1px solid #1a1a1a', borderRadius: 8, padding: '14px', color: '#555', cursor: 'pointer', fontFamily: "'Bebas Neue', sans-serif", fontSize: 24 },
  fatigueLegend: { display: 'flex', justifyContent: 'space-between', fontFamily: "'DM Mono', monospace", fontSize: 10, color: '#333', marginBottom: 20 },
  noteInput: { width: '100%', background: '#0a0a0a', border: '1px solid #1a1a1a', borderRadius: 10, padding: '12px', color: '#f0ede8', fontFamily: "'DM Sans', sans-serif", fontSize: 13, resize: 'none', outline: 'none', boxSizing: 'border-box', marginBottom: 16 },
  saveBtn: { width: '100%', border: 'none', borderRadius: 12, padding: '16px', fontFamily: "'Bebas Neue', sans-serif", fontSize: 22, letterSpacing: 4, color: '#0a0a0a', cursor: 'pointer', marginBottom: 10 },
  cancelBtn: { width: '100%', background: 'transparent', border: 'none', color: '#444', cursor: 'pointer', fontFamily: "'DM Mono', monospace", fontSize: 13, padding: '8px' },
  addExBtn: { width: '100%', background: 'transparent', border: '1px solid #222', borderRadius: 10, padding: '12px', color: '#555', cursor: 'pointer', fontFamily: "'DM Mono', monospace", fontSize: 12, letterSpacing: 1 },
}
