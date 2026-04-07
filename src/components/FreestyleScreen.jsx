import { useState } from 'react'
import { EXERCISES } from '../data/exercises.js'

export default function FreestyleScreen({ onFinish, onBack }) {
  const [exercises, setExercises] = useState([])
  const [showPicker, setShowPicker] = useState(false)
  const [filterMuscle, setFilterMuscle] = useState('all')
  const [activeIdx, setActiveIdx] = useState(null)
  const [showFinish, setShowFinish] = useState(false)
  const [fatigueLevel, setFatigueLevel] = useState(3)
  const [sessionNotes, setSessionNotes] = useState('')

  const muscles = ['all', 'chest', 'back', 'shoulders', 'biceps', 'triceps', 'quads', 'hamstrings', 'glutes', 'calves', 'core', 'lower_back', 'traps', 'full_body']
  const availableExercises = Object.values(EXERCISES).filter(ex =>
    filterMuscle === 'all' || ex.muscle === filterMuscle
  )

  function addExercise(ex) {
    const newEx = {
      id: `${ex.id}_${Date.now()}`, exerciseId: ex.id, name: ex.name,
      muscle: ex.muscle, pattern: ex.pattern, isPrimary: false,
      sets: [{ setNumber: 1, weight: '', reps: '', rir: '', completed: false }],
      repRange: ex.rep_range_accumulation, targetRIR: ex.rir_target_accumulation,
      restSeconds: ex.rest_accumulation, notes: ex.notes, warnings: [], swapHistory: [],
    }
    setExercises(prev => [...prev, newEx])
    setActiveIdx(exercises.length)
    setShowPicker(false)
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

  return (
    <div style={s.root}>
      <div style={s.topBar}>
        <button style={s.backBtn} onClick={onBack}>← Back</button>
        <span style={s.title}>FREESTYLE</span>
        {exercises.length > 0 && <button style={s.doneBtn} onClick={() => setShowFinish(true)}>Done</button>}
        {exercises.length === 0 && <span style={{ width: 50 }} />}
      </div>

      {exercises.length === 0 && (
        <div style={s.empty}><div style={s.emptyText}>Add exercises to start</div></div>
      )}

      {exercises.map((ex, exIdx) => (
        <div key={ex.id} style={{ ...s.exCard, ...(activeIdx === exIdx ? s.exCardActive : {}) }} onClick={() => setActiveIdx(exIdx)}>
          <div style={s.exName}>{ex.name}</div>
          <div style={s.exMuscle}>{ex.muscle?.replace('_', ' ')}</div>
          {activeIdx === exIdx && (
            <>
              {ex.notes && <div style={s.exNote}>{ex.notes}</div>}
              <div style={s.setsHeader}>
                <span style={s.setCol}>Set</span>
                <span style={s.setCol}>Weight</span>
                <span style={s.setCol}>Reps</span>
                <span style={s.setCol}>RIR</span>
              </div>
              {ex.sets.map((set, si) => (
                <div key={si} style={s.setRow}>
                  <span style={s.setNum}>{si + 1}</span>
                  <input style={s.input} type="number" inputMode="decimal" placeholder="0" value={set.weight} onChange={e => updateSet(exIdx, si, 'weight', e.target.value)} />
                  <input style={s.input} type="number" inputMode="numeric" placeholder="0" value={set.reps} onChange={e => updateSet(exIdx, si, 'reps', e.target.value)} />
                  <select style={s.rirSelect} value={set.rir} onChange={e => updateSet(exIdx, si, 'rir', e.target.value)}>
                    <option value="">—</option>
                    {[0,1,2,3,4,5].map(r => <option key={r} value={r}>{r}</option>)}
                  </select>
                </div>
              ))}
              <div style={s.setActions}>
                <button style={s.setBtn} onClick={() => addSet(exIdx)}>+ Set</button>
                <button style={s.setBtn} onClick={() => removeSet(exIdx)}>− Set</button>
              </div>
            </>
          )}
        </div>
      ))}

      <button style={s.addBtn} onClick={() => setShowPicker(true)}>+ Add Exercise</button>

      {showPicker && (
        <div style={s.modal}>
          <div style={s.modalCard}>
            <div style={s.modalHeader}>
              <span style={s.modalTitle}>PICK EXERCISE</span>
              <button style={s.closeBtn} onClick={() => setShowPicker(false)}>✕</button>
            </div>
            <div style={s.muscleFilter}>
              {muscles.map(m => (
                <button key={m} style={{ ...s.muscleBtn, ...(filterMuscle === m ? s.muscleBtnActive : {}) }} onClick={() => setFilterMuscle(m)}>
                  {m === 'all' ? 'All' : m.replace('_', ' ')}
                </button>
              ))}
            </div>
            <div style={s.exList}>
              {availableExercises.map(ex => (
                <button key={ex.id} style={s.exPickBtn} onClick={() => addExercise(ex)}>
                  <span style={s.exPickName}>{ex.name}</span>
                  <span style={s.exPickMuscle}>{ex.muscle?.replace('_', ' ')}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {showFinish && (
        <div style={s.modal}>
          <div style={s.modalCard}>
            <div style={s.modalTitle}>SAVE SESSION</div>
            <div style={s.modalLabel}>Overall fatigue?</div>
            <div style={s.fatigueRow}>
              {[1,2,3,4,5].map(n => (
                <button key={n} style={{ ...s.fatigueBtn, ...(fatigueLevel === n ? s.fatigueBtnActive : {}) }} onClick={() => setFatigueLevel(n)}>{n}</button>
              ))}
            </div>
            <textarea style={s.noteInput} placeholder="Notes (optional)" value={sessionNotes} onChange={e => setSessionNotes(e.target.value)} rows={3} />
            <button style={s.saveBtn} onClick={() => onFinish(exercises, fatigueLevel, sessionNotes)}>SAVE</button>
            <button style={s.cancelBtn} onClick={() => setShowFinish(false)}>Keep Going</button>
          </div>
        </div>
      )}
    </div>
  )
}

const s = {
  root: { minHeight: '100vh', background: '#0a0a0a', paddingBottom: 100 },
  topBar: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 20px', borderBottom: '1px solid #161616' },
  backBtn: { background: 'none', border: 'none', color: '#555', cursor: 'pointer', fontFamily: "'DM Mono', monospace", fontSize: 13 },
  title: { fontFamily: "'Bebas Neue', sans-serif", fontSize: 22, color: '#7c3aed', letterSpacing: 4 },
  doneBtn: { background: 'none', border: '1px solid #222', borderRadius: 8, padding: '6px 14px', color: '#888', cursor: 'pointer', fontFamily: "'DM Mono', monospace", fontSize: 12 },
  empty: { display: 'flex', alignItems: 'center', justifyContent: 'center', height: '40vh' },
  emptyText: { fontFamily: "'DM Mono', monospace", fontSize: 12, color: '#333' },
  exCard: { margin: '10px 14px 0', background: '#111', border: '1px solid #1a1a1a', borderRadius: 12, padding: '16px', cursor: 'pointer' },
  exCardActive: { border: '1px solid #7c3aed' },
  exName: { fontFamily: "'Bebas Neue', sans-serif", fontSize: 22, color: '#f0ede8', letterSpacing: 1, marginBottom: 2 },
  exMuscle: { fontFamily: "'DM Mono', monospace", fontSize: 9, color: '#444', letterSpacing: 1, textTransform: 'uppercase', marginBottom: 10 },
  exNote: { fontSize: 12, color: '#555', lineHeight: 1.5, marginBottom: 12, background: '#0a0a0a', borderRadius: 8, padding: '8px 10px' },
  setsHeader: { display: 'flex', gap: 6, marginBottom: 6 },
  setCol: { fontFamily: "'DM Mono', monospace", fontSize: 9, color: '#333', flex: 1, textAlign: 'center' },
  setRow: { display: 'flex', gap: 6, marginBottom: 6 },
  setNum: { fontFamily: "'DM Mono', monospace", fontSize: 12, color: '#444', flex: 0.4, textAlign: 'center', paddingTop: 12 },
  input: { flex: 1, background: '#0a0a0a', border: '1px solid #1a1a1a', borderRadius: 8, padding: '10px 4px', color: '#f0ede8', fontFamily: "'DM Mono', monospace", fontSize: 15, textAlign: 'center', outline: 'none' },
  rirSelect: { flex: 1, background: '#0a0a0a', border: '1px solid #1a1a1a', borderRadius: 8, padding: '10px 4px', color: '#f0ede8', fontFamily: "'DM Mono', monospace", fontSize: 13, textAlign: 'center', outline: 'none' },
  setActions: { display: 'flex', gap: 6, marginTop: 8 },
  setBtn: { flex: 1, background: 'transparent', border: '1px solid #1a1a1a', borderRadius: 8, padding: '8px', color: '#555', cursor: 'pointer', fontFamily: "'DM Mono', monospace", fontSize: 12 },
  addBtn: { position: 'fixed', bottom: 24, left: '50%', transform: 'translateX(-50%)', background: '#7c3aed', border: 'none', borderRadius: 30, padding: '14px 32px', fontFamily: "'Bebas Neue', sans-serif", fontSize: 18, letterSpacing: 3, color: '#fff', cursor: 'pointer', boxShadow: '0 4px 20px rgba(124,58,237,0.4)' },
  modal: { position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.9)', display: 'flex', alignItems: 'flex-end', zIndex: 100 },
  modalCard: { background: '#111', border: '1px solid #1a1a1a', borderRadius: '20px 20px 0 0', padding: '24px 20px 48px', width: '100%', maxWidth: 480, margin: '0 auto', maxHeight: '85vh', overflowY: 'auto' },
  modalHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  modalTitle: { fontFamily: "'Bebas Neue', sans-serif", fontSize: 28, color: '#f0ede8', letterSpacing: 3 },
  closeBtn: { background: 'none', border: 'none', color: '#555', cursor: 'pointer', fontSize: 18 },
  muscleFilter: { display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 16 },
  muscleBtn: { background: '#0a0a0a', border: '1px solid #1a1a1a', borderRadius: 20, padding: '5px 12px', color: '#555', cursor: 'pointer', fontFamily: "'DM Mono', monospace", fontSize: 10, textTransform: 'capitalize' },
  muscleBtnActive: { background: '#7c3aed22', border: '1px solid #7c3aed', color: '#7c3aed' },
  exList: { display: 'flex', flexDirection: 'column', gap: 6 },
  exPickBtn: { background: '#0a0a0a', border: '1px solid #161616', borderRadius: 10, padding: '12px 14px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer', textAlign: 'left' },
  exPickName: { fontSize: 14, color: '#f0ede8', fontWeight: 500 },
  exPickMuscle: { fontFamily: "'DM Mono', monospace", fontSize: 10, color: '#555', textTransform: 'capitalize' },
  modalLabel: { fontFamily: "'DM Mono', monospace", fontSize: 10, color: '#555', letterSpacing: 2, marginBottom: 12, marginTop: 16 },
  fatigueRow: { display: 'flex', gap: 8, marginBottom: 16 },
  fatigueBtn: { flex: 1, background: '#0a0a0a', border: '1px solid #1a1a1a', borderRadius: 8, padding: '12px', color: '#555', cursor: 'pointer', fontFamily: "'Bebas Neue', sans-serif", fontSize: 22 },
  fatigueBtnActive: { background: '#7c3aed22', border: '1px solid #7c3aed', color: '#7c3aed' },
  noteInput: { width: '100%', background: '#0a0a0a', border: '1px solid #1a1a1a', borderRadius: 10, padding: '12px', color: '#f0ede8', fontFamily: "'DM Sans', sans-serif", fontSize: 13, resize: 'none', outline: 'none', boxSizing: 'border-box', marginBottom: 16 },
  saveBtn: { width: '100%', background: '#7c3aed', border: 'none', borderRadius: 12, padding: '16px', fontFamily: "'Bebas Neue', sans-serif", fontSize: 22, letterSpacing: 4, color: '#fff', cursor: 'pointer', marginBottom: 10 },
  cancelBtn: { width: '100%', background: 'transparent', border: 'none', color: '#444', cursor: 'pointer', fontFamily: "'DM Mono', monospace", fontSize: 13, padding: '8px' },
}
