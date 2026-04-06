import { useState } from 'react'
import { swapExercise } from '../lib/workout.js'

export default function WorkoutScreen({ workout, availableEquipment, allLogs, onFinish, onBack, onSwap }) {
  const [exercises, setExercises] = useState(workout.exercises)
  const [activeEx, setActiveEx] = useState(0)
  const [fatigueLevel, setFatigueLevel] = useState(3)
  const [notes, setNotes] = useState('')
  const [showFinish, setShowFinish] = useState(false)
  const [swapping, setSwapping] = useState(null)

  function updateSet(exIndex, setIndex, field, value) {
    setExercises(prev => {
      const updated = [...prev]
      const ex = { ...updated[exIndex] }
      ex.loggedSets = [...ex.loggedSets]
      ex.loggedSets[setIndex] = { ...ex.loggedSets[setIndex], [field]: value }
      updated[exIndex] = ex
      return updated
    })
  }

  function updateFelt(exIndex, felt) {
    setExercises(prev => {
      const updated = [...prev]
      updated[exIndex] = { ...updated[exIndex], felt }
      return updated
    })
  }

  function handleSwap(exIndex) {
    setSwapping(exIndex)
    const currentNames = exercises.map(e => e.name)
    const swapped = swapExercise(exercises[exIndex], availableEquipment, currentNames, allLogs)
    setExercises(prev => {
      const updated = [...prev]
      updated[exIndex] = swapped
      return updated
    })
    const updatedWorkout = { ...workout, exercises: exercises.map((e, i) => i === exIndex ? swapped : e) }
    onSwap(updatedWorkout)
    setTimeout(() => setSwapping(null), 600)
  }

  function addSet(exIndex) {
    setExercises(prev => {
      const updated = [...prev]
      const ex = { ...updated[exIndex] }
      const lastSet = ex.loggedSets[ex.loggedSets.length - 1]
      ex.loggedSets = [...ex.loggedSets, { reps: lastSet?.reps || '', weight: lastSet?.weight || ex.targetWeight || '' }]
      ex.sets = ex.loggedSets.length
      updated[exIndex] = ex
      return updated
    })
  }

  function removeSet(exIndex) {
    setExercises(prev => {
      const updated = [...prev]
      const ex = { ...updated[exIndex] }
      if (ex.loggedSets.length <= 1) return prev
      ex.loggedSets = ex.loggedSets.slice(0, -1)
      ex.sets = ex.loggedSets.length
      updated[exIndex] = ex
      return updated
    })
  }

  const completedCount = exercises.filter(ex =>
    ex.loggedSets.some(s => s.reps && s.weight)
  ).length

  const dayLabels = {
    upper_heavy: "Upper — Strength",
    lower_heavy: "Lower — Strength",
    upper_hypertrophy: "Upper — Volume",
    athletic: "Athletic & Power"
  }

  return (
    <div style={s.root}>
      {/* Header */}
      <div style={s.header}>
        <button style={s.backBtn} onClick={onBack}>← Exit</button>
        <div style={s.headerCenter}>
          <div style={s.dayLabel}>{dayLabels[workout.splitKey] || workout.splitKey}</div>
          <div style={s.progress}>{completedCount}/{exercises.length} done</div>
        </div>
        <button style={s.finishTopBtn} onClick={() => setShowFinish(true)}>Finish</button>
      </div>

      {/* Progress bar */}
      <div style={s.progressBar}>
        <div style={{ ...s.progressFill, width: `${(completedCount / exercises.length) * 100}%` }} />
      </div>

      {/* Exercise tabs */}
      <div style={s.tabScroll}>
        {exercises.map((ex, i) => {
          const done = ex.loggedSets.some(s => s.reps && s.weight)
          return (
            <button
              key={ex.id}
              style={{ ...s.tab, ...(activeEx === i ? s.tabActive : {}), ...(done ? s.tabDone : {}) }}
              onClick={() => setActiveEx(i)}
            >
              {i + 1}
            </button>
          )
        })}
      </div>

      {/* Active exercise */}
      {exercises[activeEx] && (
        <div style={s.exCard}>
          <div style={s.exHeader}>
            <div>
              <div style={s.exLabel}>{exercises[activeEx].label}</div>
              <div style={s.exName}>{exercises[activeEx].name}</div>
              <div style={s.exMeta}>
                <span style={s.chip}>{exercises[activeEx].sets} sets</span>
                <span style={s.chip}>{exercises[activeEx].repRange} reps</span>
                <span style={s.chip}>Rest {exercises[activeEx].rest}s</span>
              </div>
            </div>
            <button
              style={{ ...s.swapBtn, ...(swapping === activeEx ? s.swapBtnActive : {}) }}
              onClick={() => handleSwap(activeEx)}
            >
              {swapping === activeEx ? '✓' : '⇄ Swap'}
            </button>
          </div>

          {exercises[activeEx].targetWeight && (
            <div style={s.targetBanner}>
              <span style={s.targetLabel}>TARGET</span>
              <span style={s.targetVal}>{exercises[activeEx].targetWeight} kg × {exercises[activeEx].repRange}</span>
            </div>
          )}

          {/* Sets */}
          <div style={s.setsHeader}>
            <span style={s.setCol}>Set</span>
            <span style={s.setCol}>Weight (kg)</span>
            <span style={s.setCol}>Reps</span>
          </div>

          {exercises[activeEx].loggedSets.map((set, si) => (
            <div key={si} style={s.setRow}>
              <span style={s.setNum}>{si + 1}</span>
              <input
                style={s.input}
                type="number"
                inputMode="decimal"
                placeholder={exercises[activeEx].targetWeight || '0'}
                value={set.weight}
                onChange={e => updateSet(activeEx, si, 'weight', e.target.value)}
              />
              <input
                style={s.input}
                type="number"
                inputMode="numeric"
                placeholder="0"
                value={set.reps}
                onChange={e => updateSet(activeEx, si, 'reps', e.target.value)}
              />
            </div>
          ))}

          <div style={s.setActions}>
            <button style={s.setActionBtn} onClick={() => addSet(activeEx)}>+ Add Set</button>
            <button style={s.setActionBtn} onClick={() => removeSet(activeEx)}>− Remove Set</button>
          </div>

          {/* How did it feel */}
          <div style={s.feltSection}>
            <div style={s.feltLabel}>HOW DID IT FEEL?</div>
            <div style={s.feltRow}>
              {['easy', 'good', 'hard', 'failed'].map(f => (
                <button
                  key={f}
                  style={{ ...s.feltBtn, ...(exercises[activeEx].felt === f ? s.feltBtnActive : {}) }}
                  onClick={() => updateFelt(activeEx, f)}
                >
                  {feltEmoji[f]} {f}
                </button>
              ))}
            </div>
          </div>

          {/* Navigation */}
          <div style={s.navRow}>
            {activeEx > 0 && (
              <button style={s.navBtn} onClick={() => setActiveEx(activeEx - 1)}>← Prev</button>
            )}
            {activeEx < exercises.length - 1 && (
              <button style={{ ...s.navBtn, ...s.navBtnNext }} onClick={() => setActiveEx(activeEx + 1)}>
                Next →
              </button>
            )}
            {activeEx === exercises.length - 1 && (
              <button style={{ ...s.navBtn, ...s.navBtnFinish }} onClick={() => setShowFinish(true)}>
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
            <div style={s.modalTitle}>FINISH SESSION</div>
            <div style={s.modalLabel}>How was your overall fatigue?</div>
            <div style={s.fatigueRow}>
              {[1, 2, 3, 4, 5].map(n => (
                <button
                  key={n}
                  style={{ ...s.fatigueBtn, ...(fatigueLevel === n ? s.fatigueBtnActive : {}) }}
                  onClick={() => setFatigueLevel(n)}
                >
                  {n}
                </button>
              ))}
            </div>
            <div style={s.fatigueLegend}>
              <span>1 = Fresh</span><span>5 = Destroyed</span>
            </div>
            <textarea
              style={s.notesInput}
              placeholder="Any notes? (optional)"
              value={notes}
              onChange={e => setNotes(e.target.value)}
              rows={3}
            />
            <button style={s.saveBtn} onClick={() => onFinish(exercises, fatigueLevel, notes)}>
              SAVE SESSION
            </button>
            <button style={s.cancelBtn} onClick={() => setShowFinish(false)}>Continue Lifting</button>
          </div>
        </div>
      )}
    </div>
  )
}

const feltEmoji = { easy: '😌', good: '💪', hard: '😤', failed: '❌' }

const s = {
  root: { minHeight: '100vh', background: '#0a0a0a', paddingBottom: 40 },
  header: {
    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
    padding: '16px 20px', borderBottom: '1px solid #1a1a1a',
  },
  backBtn: { background: 'none', border: 'none', color: '#666', cursor: 'pointer', fontFamily: "'DM Mono', monospace", fontSize: 13 },
  headerCenter: { textAlign: 'center' },
  dayLabel: { fontFamily: "'DM Mono', monospace", fontSize: 10, color: '#555', letterSpacing: 2 },
  progress: { fontFamily: "'Bebas Neue', sans-serif", fontSize: 20, color: '#e8ff00', letterSpacing: 2 },
  finishTopBtn: { background: 'none', border: '1px solid #333', borderRadius: 8, padding: '6px 14px', color: '#888', cursor: 'pointer', fontFamily: "'DM Mono', monospace", fontSize: 12 },
  progressBar: { height: 3, background: '#1a1a1a' },
  progressFill: { height: '100%', background: '#e8ff00', transition: 'width 0.4s ease' },
  tabScroll: { display: 'flex', gap: 8, padding: '12px 20px', overflowX: 'auto' },
  tab: {
    width: 36, height: 36, borderRadius: '50%', border: '1px solid #222',
    background: '#111', color: '#555', cursor: 'pointer',
    fontFamily: "'DM Mono', monospace", fontSize: 13, flexShrink: 0,
  },
  tabActive: { border: '2px solid #e8ff00', color: '#e8ff00', background: '#141400' },
  tabDone: { background: '#0d1a00', border: '1px solid #4ade80', color: '#4ade80' },
  exCard: { margin: '0 16px', background: '#111', border: '1px solid #1a1a1a', borderRadius: 16, padding: '20px 16px' },
  exHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 },
  exLabel: { fontFamily: "'DM Mono', monospace", fontSize: 10, color: '#555', letterSpacing: 2, marginBottom: 4 },
  exName: { fontFamily: "'Bebas Neue', sans-serif", fontSize: 28, color: '#f0ede8', letterSpacing: 1, lineHeight: 1.1, marginBottom: 8 },
  exMeta: { display: 'flex', gap: 6, flexWrap: 'wrap' },
  chip: { fontFamily: "'DM Mono', monospace", fontSize: 10, background: '#1a1a1a', border: '1px solid #222', borderRadius: 20, padding: '3px 8px', color: '#666' },
  swapBtn: {
    background: 'transparent', border: '1px solid #2a2a2a', borderRadius: 8,
    padding: '8px 12px', color: '#666', cursor: 'pointer',
    fontFamily: "'DM Mono', monospace", fontSize: 12, flexShrink: 0,
    transition: 'all 0.2s',
  },
  swapBtnActive: { border: '1px solid #4ade80', color: '#4ade80' },
  targetBanner: {
    background: '#141400', border: '1px solid #2a2a00',
    borderRadius: 8, padding: '10px 14px', marginBottom: 16,
    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
  },
  targetLabel: { fontFamily: "'DM Mono', monospace", fontSize: 10, color: '#666', letterSpacing: 2 },
  targetVal: { fontFamily: "'DM Mono', monospace", fontSize: 14, color: '#e8ff00', fontWeight: 500 },
  setsHeader: { display: 'flex', gap: 8, marginBottom: 8, padding: '0 4px' },
  setCol: { fontFamily: "'DM Mono', monospace", fontSize: 10, color: '#444', letterSpacing: 1, flex: 1, textAlign: 'center' },
  setRow: { display: 'flex', gap: 8, marginBottom: 8, alignItems: 'center' },
  setNum: { fontFamily: "'DM Mono', monospace", fontSize: 13, color: '#555', width: 20, textAlign: 'center', flexShrink: 0 },
  input: {
    flex: 1, background: '#0a0a0a', border: '1px solid #222',
    borderRadius: 8, padding: '12px 8px', color: '#f0ede8',
    fontFamily: "'DM Mono', monospace", fontSize: 16, textAlign: 'center',
    outline: 'none',
  },
  setActions: { display: 'flex', gap: 8, marginTop: 8, marginBottom: 20 },
  setActionBtn: {
    flex: 1, background: 'transparent', border: '1px solid #1a1a1a',
    borderRadius: 8, padding: '8px', color: '#555', cursor: 'pointer',
    fontFamily: "'DM Mono', monospace", fontSize: 12,
  },
  feltSection: { marginBottom: 20 },
  feltLabel: { fontFamily: "'DM Mono', monospace", fontSize: 10, color: '#555', letterSpacing: 2, marginBottom: 10 },
  feltRow: { display: 'flex', gap: 6 },
  feltBtn: {
    flex: 1, background: '#0a0a0a', border: '1px solid #1a1a1a',
    borderRadius: 8, padding: '8px 4px', color: '#555', cursor: 'pointer',
    fontFamily: "'DM Sans', sans-serif", fontSize: 11, textTransform: 'capitalize',
  },
  feltBtnActive: { background: '#141400', border: '1px solid #e8ff00', color: '#e8ff00' },
  navRow: { display: 'flex', gap: 8 },
  navBtn: {
    flex: 1, background: '#0a0a0a', border: '1px solid #222',
    borderRadius: 10, padding: '14px', color: '#888', cursor: 'pointer',
    fontFamily: "'DM Mono', monospace", fontSize: 13,
  },
  navBtnNext: { background: '#141414', color: '#f0ede8' },
  navBtnFinish: { background: '#e8ff00', border: 'none', color: '#0a0a0a', fontFamily: "'Bebas Neue', sans-serif", fontSize: 18, letterSpacing: 2 },
  modal: {
    position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.85)',
    display: 'flex', alignItems: 'flex-end', justifyContent: 'center', zIndex: 100,
  },
  modalCard: {
    background: '#111', border: '1px solid #222', borderRadius: '20px 20px 0 0',
    padding: '28px 24px 40px', width: '100%', maxWidth: 480,
  },
  modalTitle: { fontFamily: "'Bebas Neue', sans-serif", fontSize: 32, color: '#e8ff00', letterSpacing: 3, marginBottom: 20 },
  modalLabel: { fontFamily: "'DM Mono', monospace", fontSize: 11, color: '#666', letterSpacing: 2, marginBottom: 12 },
  fatigueRow: { display: 'flex', gap: 8, marginBottom: 8 },
  fatigueBtn: {
    flex: 1, background: '#0a0a0a', border: '1px solid #1a1a1a',
    borderRadius: 8, padding: '12px 4px', color: '#555', cursor: 'pointer',
    fontFamily: "'Bebas Neue', sans-serif", fontSize: 22,
  },
  fatigueBtnActive: { background: '#141400', border: '1px solid #e8ff00', color: '#e8ff00' },
  fatigueLegend: { display: 'flex', justifyContent: 'space-between', fontFamily: "'DM Mono', monospace", fontSize: 10, color: '#444', marginBottom: 20 },
  notesInput: {
    width: '100%', background: '#0a0a0a', border: '1px solid #1a1a1a',
    borderRadius: 10, padding: '12px', color: '#f0ede8',
    fontFamily: "'DM Sans', sans-serif", fontSize: 14, resize: 'none',
    outline: 'none', boxSizing: 'border-box', marginBottom: 16,
  },
  saveBtn: {
    width: '100%', background: '#e8ff00', border: 'none',
    borderRadius: 12, padding: '18px',
    fontFamily: "'Bebas Neue', sans-serif", fontSize: 24, letterSpacing: 4,
    color: '#0a0a0a', cursor: 'pointer', marginBottom: 10,
  },
  cancelBtn: {
    width: '100%', background: 'transparent', border: 'none',
    color: '#555', cursor: 'pointer', fontFamily: "'DM Mono', monospace", fontSize: 13, padding: '8px',
  },
}
