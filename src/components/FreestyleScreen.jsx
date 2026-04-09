import { useState } from 'react'
import { EXERCISES, EQUIPMENT_OPTIONS, GYM_PRESETS } from '../data/exercises.js'
import { swapExercise } from '../lib/programming.js'

// Granular muscle targets mapped to exercise muscle/pattern tags
const MUSCLE_TARGETS = [
  { id: 'side_delts', label: 'Side Delts', icon: '💪', muscle: 'shoulders', patterns: ['lateral_raise'] },
  { id: 'rear_delts', label: 'Rear Delts', icon: '🔙', muscle: 'shoulders', patterns: ['rear_delt'] },
  { id: 'front_delts', label: 'Front Delts', icon: '⬆️', muscle: 'shoulders', patterns: ['vertical_press'] },
  { id: 'biceps', label: 'Biceps', icon: '💪', muscle: 'biceps', patterns: ['curl'] },
  { id: 'triceps', label: 'Triceps', icon: '🔱', muscle: 'triceps', patterns: ['tricep_extension', 'tricep_isolation', 'tricep_compound', 'dip'] },
  { id: 'chest', label: 'Chest', icon: '🏋️', muscle: 'chest', patterns: ['horizontal_press', 'incline_press', 'chest_isolation', 'dip'] },
  { id: 'lats', label: 'Lats', icon: '🦅', muscle: 'back', patterns: ['vertical_pull', 'lat_isolation'] },
  { id: 'upper_back', label: 'Upper Back', icon: '🔝', muscle: 'back', patterns: ['horizontal_pull'] },
  { id: 'core', label: 'Core / Abs', icon: '⚡', muscle: 'core', patterns: ['core'] },
  { id: 'quads', label: 'Quads', icon: '🦵', muscle: 'quads', patterns: ['squat', 'quad_isolation'] },
  { id: 'hamstrings', label: 'Hamstrings', icon: '🦵', muscle: 'hamstrings', patterns: ['hinge', 'hamstring_isolation', 'hamstring_eccentric'] },
  { id: 'glutes', label: 'Glutes', icon: '🍑', muscle: 'glutes', patterns: ['hip_thrust', 'glute_hinge'] },
  { id: 'calves', label: 'Calves', icon: '🦶', muscle: 'calves', patterns: ['calf_raise'] },
  { id: 'traps', label: 'Traps', icon: '🏔️', muscle: 'traps', patterns: ['shrug'] },
]

function generateSmartSession(selectedTargets, availableEquipment) {
  const exercises = []
  const usedPatterns = []
  const usedIds = []

  selectedTargets.forEach(target => {
    // Find best exercises for this target — pattern match is strict
    // If patterns are specified, ONLY match on pattern (not general muscle)
    // This ensures side delts only gets lateral raises, not OHP
    const candidates = Object.values(EXERCISES).filter(ex => {
      const patternMatch = target.patterns.some(p => ex.pattern === p)
      const hasEquipment = ex.equipment.length === 0 ||
        ex.equipment.every(eq => availableEquipment.includes(eq))
      const notUsed = !usedIds.includes(ex.id)
      return patternMatch && hasEquipment && notUsed
    }).sort((a, b) => (b.quality_score || 5) - (a.quality_score || 5))

    // Pick top 2 exercises per muscle target
    let added = 0
    for (const ex of candidates) {
      if (added >= 2) break

      exercises.push({
        id: `${ex.id}_${Date.now()}_${Math.random().toString(36).substr(2,4)}`,
        exerciseId: ex.id,
        name: ex.name,
        muscle: ex.muscle,
        pattern: ex.pattern,
        isPrimary: false,
        sets: Array(3).fill(null).map((_, i) => ({
          setNumber: i + 1, weight: '', reps: '', rir: '', completed: false
        })),
        repRange: ex.rep_range_accumulation,
        targetRIR: ex.rir_target_accumulation,
        restSeconds: ex.rest_accumulation,
        notes: ex.notes,
        warnings: [],
        swapHistory: [],
      })
      usedIds.push(ex.id)
      usedPatterns.push(ex.pattern)
      added++
    }
  })

  return exercises
}

export default function FreestyleScreen({ onFinish, onBack, allLogs = [] }) {
  const [mode, setMode] = useState('pick') // pick | equipment | session
  const [selectedTargets, setSelectedTargets] = useState([])
  const [equipment, setEquipment] = useState([])
  const [activePreset, setActivePreset] = useState(null)
  const [exercises, setExercises] = useState([])
  const [activeIdx, setActiveIdx] = useState(0)
  const [showFinish, setShowFinish] = useState(false)
  const [fatigueLevel, setFatigueLevel] = useState(3)
  const [sessionNotes, setSessionNotes] = useState('')
  const [swapping, setSwapping] = useState(null)
  const [showAddPicker, setShowAddPicker] = useState(false)
  const [filterTarget, setFilterTarget] = useState('all')

  function toggleTarget(target) {
    setSelectedTargets(prev =>
      prev.find(t => t.id === target.id)
        ? prev.filter(t => t.id !== target.id)
        : [...prev, target]
    )
  }

  function selectPreset(preset) {
    setActivePreset(preset.id)
    setEquipment(preset.equipment)
  }

  function toggleEquipment(id) {
    setActivePreset(null)
    setEquipment(prev => prev.includes(id) ? prev.filter(e => e !== id) : [...prev, id])
  }

  function handleGenerate() {
    const generated = generateSmartSession(selectedTargets, equipment)
    setExercises(generated)
    setActiveIdx(0)
    setMode('session')
  }

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

  function handleSwap(exIdx) {
    const ex = exercises[exIdx]
    const currentIds = exercises.map(e => e.exerciseId)
    const swapped = swapExercise(ex, equipment, currentIds, allLogs)
    if (!swapped) { alert('No alternative available with your equipment.'); return }

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
      sets: Array(3).fill(null).map((_, i) => ({ setNumber: i+1, weight: '', reps: '', rir: '', completed: false })),
      repRange: ex.rep_range_accumulation, targetRIR: ex.rir_target_accumulation,
      restSeconds: ex.rest_accumulation, notes: ex.notes, warnings: [], swapHistory: [],
    }
    setExercises(prev => [...prev, newEx])
    setActiveIdx(exercises.length)
    setShowAddPicker(false)
  }

  const activeEx = exercises[activeIdx]

  // ── STEP 1: MUSCLE PICKER ─────────────────────────────────────
  if (mode === 'pick') {
    return (
      <div style={s.root}>
        <div style={s.topBar}>
          <button style={s.backBtn} onClick={onBack}>← Back</button>
          <span style={s.title}>FREESTYLE</span>
          <span style={{ width: 50 }} />
        </div>

        <div style={s.content}>
          <div style={s.heading}>
            <div style={s.headingMeta}>FREESTYLE SESSION</div>
            <div style={s.headingTitle}>What do you want to hit?</div>
            <div style={s.headingSub}>Select all the muscles you want to train</div>
          </div>

          <div style={s.targetGrid}>
            {MUSCLE_TARGETS.map(target => {
              const selected = selectedTargets.find(t => t.id === target.id)
              return (
                <button
                  key={target.id}
                  style={{ ...s.targetBtn, ...(selected ? s.targetBtnActive : {}) }}
                  onClick={() => toggleTarget(target)}
                >
                  <span style={s.targetIcon}>{target.icon}</span>
                  <span style={{ ...s.targetLabel, color: selected ? '#e8ff00' : '#888' }}>{target.label}</span>
                  {selected && <span style={s.targetCheck}>✓</span>}
                </button>
              )
            })}
          </div>

          <button
            style={{ ...s.nextBtn, ...(selectedTargets.length === 0 ? s.nextBtnDisabled : {}) }}
            onClick={() => selectedTargets.length > 0 && setMode('equipment')}
            disabled={selectedTargets.length === 0}
          >
            NEXT →
          </button>
        </div>
      </div>
    )
  }

  // ── STEP 2: EQUIPMENT ─────────────────────────────────────────
  if (mode === 'equipment') {
    return (
      <div style={s.root}>
        <div style={s.topBar}>
          <button style={s.backBtn} onClick={() => setMode('pick')}>← Back</button>
          <span style={s.title}>FREESTYLE</span>
          <span style={{ width: 50 }} />
        </div>

        <div style={s.content}>
          <div style={s.heading}>
            <div style={s.headingMeta}>STEP 2 OF 2</div>
            <div style={s.headingTitle}>What's available?</div>
          </div>

          <div style={s.presetGrid}>
            {GYM_PRESETS.map(preset => (
              <button key={preset.id} style={{ ...s.presetBtn, ...(activePreset === preset.id ? s.presetActive : {}) }} onClick={() => selectPreset(preset)}>
                {preset.label}
              </button>
            ))}
          </div>

          <div style={s.equipLabel}>OR SELECT MANUALLY</div>
          <div style={s.equipGrid}>
            {EQUIPMENT_OPTIONS.map(eq => {
              const on = equipment.includes(eq.id)
              return (
                <button key={eq.id} style={{ ...s.equipBtn, ...(on ? s.equipActive : {}) }} onClick={() => toggleEquipment(eq.id)}>
                  <span style={s.equipIcon}>{eq.icon}</span>
                  <span style={{ ...s.equipText, color: on ? '#e8ff00' : '#888' }}>{eq.label}</span>
                </button>
              )
            })}
          </div>

          <button
            style={{ ...s.nextBtn, ...(equipment.length === 0 ? s.nextBtnDisabled : { background: '#7c3aed', color: '#fff' }) }}
            onClick={handleGenerate}
            disabled={equipment.length === 0}
          >
            GENERATE SESSION
          </button>
        </div>
      </div>
    )
  }

  // ── STEP 3: SESSION ───────────────────────────────────────────
  return (
    <div style={s.root}>
      <div style={s.topBar}>
        <button style={s.backBtn} onClick={onBack}>← Exit</button>
        <span style={s.title}>FREESTYLE</span>
        <button style={s.doneBtn} onClick={() => setShowFinish(true)}>Done</button>
      </div>

      {/* Progress bar */}
      <div style={s.progressBar}>
        <div style={{ ...s.progressFill, width: `${(exercises.filter(ex => ex.sets.some(s => s.weight && s.reps)).length / exercises.length) * 100}%` }} />
      </div>

      {/* Exercise tabs */}
      <div style={s.tabs}>
        {exercises.map((ex, i) => {
          const done = ex.sets.some(s => s.weight && s.reps)
          return (
            <button key={ex.id} style={{
              ...s.tab,
              ...(activeIdx === i ? s.tabActive : {}),
              ...(done ? s.tabDone : {}),
            }} onClick={() => setActiveIdx(i)}>
              {i + 1}
            </button>
          )
        })}
      </div>

      {/* Active exercise */}
      {activeEx && (
        <div style={s.exCard}>
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
                <span style={{ ...s.chip, color: '#7c3aed' }}>RIR {activeEx.targetRIR}</span>
                <span style={s.chip}>{activeEx.restSeconds}s rest</span>
              </div>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              <button
                style={{ ...s.swapBtn, ...(swapping === activeIdx ? { color: '#4ade80', borderColor: '#4ade80' } : {}) }}
                onClick={() => handleSwap(activeIdx)}
              >
                {swapping === activeIdx ? '✓' : '⇄'}
              </button>
              {exercises.length > 1 && (
                <button style={{ ...s.swapBtn, color: '#f87171', borderColor: '#f8717144', fontSize: 12 }}
                  onClick={() => removeExercise(activeIdx)}>
                  ✕
                </button>
              )}
            </div>
          </div>

          {activeEx.notes && (
            <div style={s.coachNote}>
              <span style={s.noteIcon}>💡</span>
              <span style={s.noteText}>{activeEx.notes}</span>
            </div>
          )}

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
                placeholder="0" value={set.weight}
                onChange={e => updateSet(activeIdx, si, 'weight', e.target.value)} />
              <input style={s.input} type="number" inputMode="numeric"
                placeholder="0" value={set.reps}
                onChange={e => updateSet(activeIdx, si, 'reps', e.target.value)} />
              <select style={s.rirSelect} value={set.rir}
                onChange={e => updateSet(activeIdx, si, 'rir', e.target.value)}>
                <option value="">—</option>
                {[0,1,2,3,4,5].map(r => <option key={r} value={r}>{r}</option>)}
              </select>
            </div>
          ))}

          <div style={s.setActions}>
            <button style={s.setBtn} onClick={() => addSet(activeIdx)}>+ Set</button>
            <button style={s.setBtn} onClick={() => removeSet(activeIdx)}>− Set</button>
          </div>

          <div style={s.navRow}>
            {activeIdx > 0 && <button style={s.navBtn} onClick={() => setActiveIdx(activeIdx - 1)}>← Prev</button>}
            {activeIdx < exercises.length - 1 && (
              <button style={{ ...s.navBtn, ...s.navNext }} onClick={() => setActiveIdx(activeIdx + 1)}>Next →</button>
            )}
            {activeIdx === exercises.length - 1 && (
              <button style={{ ...s.navBtn, background: '#7c3aed', border: 'none', color: '#fff', fontFamily: "'Bebas Neue', sans-serif", fontSize: 18, letterSpacing: 2 }}
                onClick={() => setShowFinish(true)}>
                Finish Session
              </button>
            )}
          </div>
        </div>
      )}

      {/* Add Exercise Button */}
      <button style={s.addExBtn} onClick={() => setShowAddPicker(true)}>+ Add Exercise</button>

      {/* Add Exercise Picker */}
      {showAddPicker && (
        <div style={s.modal}>
          <div style={{ ...s.modalCard, maxHeight: '85vh', overflowY: 'auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <span style={s.modalTitle}>ADD EXERCISE</span>
              <button style={{ background: 'none', border: 'none', color: '#555', cursor: 'pointer', fontSize: 18 }} onClick={() => setShowAddPicker(false)}>✕</button>
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 16 }}>
              {['all', ...selectedTargets.map(t => t.id)].map(tid => {
                const target = MUSCLE_TARGETS.find(t => t.id === tid)
                return (
                  <button key={tid} style={{ ...s.chip, cursor: 'pointer', padding: '6px 12px', ...(filterTarget === tid ? { borderColor: '#7c3aed', color: '#7c3aed', background: '#7c3aed22' } : {}) }}
                    onClick={() => setFilterTarget(tid)}>
                    {tid === 'all' ? 'All' : target?.label || tid}
                  </button>
                )
              })}
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {Object.values(EXERCISES)
                .filter(ex => {
                  const hasEquip = ex.equipment.length === 0 || ex.equipment.every(eq => equipment.includes(eq))
                  const notUsed = !exercises.find(e => e.exerciseId === ex.id)
                  if (!hasEquip || !notUsed) return false
                  if (filterTarget === 'all') return true
                  const target = MUSCLE_TARGETS.find(t => t.id === filterTarget)
                  return target && (ex.muscle === target.muscle || target.patterns.some(p => ex.pattern === p))
                })
                .sort((a, b) => (b.quality_score || 5) - (a.quality_score || 5))
                .map(ex => (
                  <button key={ex.id} style={{ background: '#0a0a0a', border: '1px solid #161616', borderRadius: 10, padding: '12px 14px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer', textAlign: 'left' }}
                    onClick={() => addExerciseToSession(ex)}>
                    <div>
                      <div style={{ fontSize: 14, color: '#f0ede8', fontWeight: 500 }}>{ex.name}</div>
                      <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 10, color: '#555', marginTop: 2 }}>{ex.muscle?.replace('_',' ')} · Q{ex.quality_score}</div>
                    </div>
                    <span style={{ color: '#7c3aed', fontSize: 18 }}>+</span>
                  </button>
                ))
              }
            </div>
          </div>
        </div>
      )}

      {/* Finish Modal */}
      {showFinish && (
        <div style={s.modal}>
          <div style={s.modalCard}>
            <div style={s.modalTitle}>SESSION DONE</div>
            <div style={s.modalSub}>{exercises.filter(ex => ex.sets.some(s => s.weight && s.reps)).length}/{exercises.length} exercises logged</div>

            <div style={s.modalLabel}>Overall fatigue?</div>
            <div style={s.fatigueRow}>
              {[1,2,3,4,5].map(n => (
                <button key={n}
                  style={{ ...s.fatigueBtn, ...(fatigueLevel === n ? { background: '#7c3aed33', border: '1px solid #7c3aed', color: '#7c3aed' } : {}) }}
                  onClick={() => setFatigueLevel(n)}>{n}
                </button>
              ))}
            </div>
            <div style={s.fatigueLegend}><span>1 — Fresh</span><span>5 — Destroyed</span></div>

            <textarea style={s.noteInput} placeholder="Session notes? (optional)"
              value={sessionNotes} onChange={e => setSessionNotes(e.target.value)} rows={3} />

            <button style={{ ...s.saveBtn, background: '#7c3aed' }}
              onClick={() => onFinish(exercises, fatigueLevel, sessionNotes)}>
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
  topBar: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 20px', borderBottom: '1px solid #161616' },
  backBtn: { background: 'none', border: 'none', color: '#555', cursor: 'pointer', fontFamily: "'DM Mono', monospace", fontSize: 13 },
  title: { fontFamily: "'Bebas Neue', sans-serif", fontSize: 22, color: '#7c3aed', letterSpacing: 4 },
  doneBtn: { background: 'none', border: '1px solid #222', borderRadius: 8, padding: '6px 14px', color: '#666', cursor: 'pointer', fontFamily: "'DM Mono', monospace", fontSize: 12 },
  content: { padding: '24px 20px' },
  heading: { marginBottom: 24 },
  headingMeta: { fontFamily: "'DM Mono', monospace", fontSize: 10, color: '#555', letterSpacing: 3, marginBottom: 6 },
  headingTitle: { fontFamily: "'Bebas Neue', sans-serif", fontSize: 36, color: '#f0ede8', letterSpacing: 2, lineHeight: 1, marginBottom: 4 },
  headingSub: { fontSize: 13, color: '#555' },
  targetGrid: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 24 },
  targetBtn: { background: '#111', border: '1px solid #1a1a1a', borderRadius: 12, padding: '14px 12px', display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', position: 'relative' },
  targetBtnActive: { background: '#141414', border: '1px solid #e8ff00' },
  targetIcon: { fontSize: 18 },
  targetLabel: { fontSize: 13, fontWeight: 500, flex: 1, textAlign: 'left' },
  targetCheck: { fontSize: 12, color: '#e8ff00' },
  presetGrid: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 20 },
  presetBtn: { background: '#111', border: '1px solid #1a1a1a', borderRadius: 10, padding: '12px 8px', color: '#666', cursor: 'pointer', fontFamily: "'DM Sans', sans-serif", fontSize: 13, fontWeight: 500 },
  presetActive: { background: '#141400', border: '1px solid #e8ff00', color: '#e8ff00' },
  equipLabel: { fontFamily: "'DM Mono', monospace", fontSize: 10, color: '#444', letterSpacing: 3, marginBottom: 12 },
  equipGrid: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 24 },
  equipBtn: { background: '#111', border: '1px solid #161616', borderRadius: 10, padding: '14px 12px', display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer' },
  equipActive: { background: '#0d1a00', border: '1px solid #4ade80' },
  equipIcon: { fontSize: 18 },
  equipText: { fontSize: 13, fontWeight: 500 },
  nextBtn: { width: '100%', background: '#e8ff00', border: 'none', borderRadius: 12, padding: '18px', fontFamily: "'Bebas Neue', sans-serif", fontSize: 24, letterSpacing: 4, color: '#0a0a0a', cursor: 'pointer' },
  nextBtnDisabled: { background: '#1a1a1a', color: '#333', cursor: 'not-allowed' },
  progressBar: { height: 3, background: '#161616' },
  progressFill: { height: '100%', background: '#7c3aed', transition: 'width 0.4s ease' },
  tabs: { display: 'flex', gap: 6, padding: '12px 16px', overflowX: 'auto' },
  tab: { width: 34, height: 34, borderRadius: '50%', border: '1px solid #222', background: '#111', color: '#555', cursor: 'pointer', fontFamily: "'DM Mono', monospace", fontSize: 12, flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' },
  tabActive: { border: '2px solid #7c3aed', background: '#141414', color: '#7c3aed' },
  tabDone: { background: '#0d1a00', border: '1px solid #4ade80', color: '#4ade80' },
  exCard: { margin: '0 14px', background: '#111', border: '1px solid #1a1a1a', borderRadius: 16, padding: '18px 16px' },
  exHeader: { display: 'flex', alignItems: 'flex-start', gap: 10, marginBottom: 10 },
  exMuscle: { fontFamily: "'DM Mono', monospace", fontSize: 9, color: '#444', letterSpacing: 2, marginBottom: 3 },
  exName: { fontFamily: "'Bebas Neue', sans-serif", fontSize: 26, color: '#f0ede8', letterSpacing: 1, lineHeight: 1.1, marginBottom: 4 },
  swapBadge: { fontFamily: "'DM Mono', monospace", fontSize: 9, color: '#7c3aed', marginBottom: 6 },
  chips: { display: 'flex', flexWrap: 'wrap', gap: 5 },
  chip: { fontFamily: "'DM Mono', monospace", fontSize: 10, background: '#0a0a0a', border: '1px solid #1a1a1a', borderRadius: 20, padding: '3px 8px', color: '#555' },
  swapBtn: { background: 'transparent', border: '1px solid #222', borderRadius: 8, padding: '8px 10px', color: '#555', cursor: 'pointer', fontFamily: "'DM Mono', monospace", fontSize: 14 },
  coachNote: { display: 'flex', gap: 8, background: '#0a0a0a', borderRadius: 8, padding: '10px 12px', marginBottom: 12 },
  noteIcon: { fontSize: 12, flexShrink: 0, marginTop: 1 },
  noteText: { fontSize: 12, color: '#555', lineHeight: 1.5 },
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
  saveBtn: { width: '100%', border: 'none', borderRadius: 12, padding: '16px', fontFamily: "'Bebas Neue', sans-serif", fontSize: 22, letterSpacing: 4, color: '#fff', cursor: 'pointer', marginBottom: 10 },
  cancelBtn: { width: '100%', background: 'transparent', border: 'none', color: '#444', cursor: 'pointer', fontFamily: "'DM Mono', monospace", fontSize: 13, padding: '8px' },
  addExBtn: { display: 'block', margin: '16px auto 0', background: 'transparent', border: '1px solid #7c3aed', borderRadius: 20, padding: '10px 24px', color: '#7c3aed', cursor: 'pointer', fontFamily: "'DM Mono', monospace", fontSize: 12, letterSpacing: 1 },
}
