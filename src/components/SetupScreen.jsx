import { useState } from 'react'
import { EQUIPMENT_OPTIONS, GYM_PRESETS, WEEK_ROTATION, WORKOUT_SPLITS } from '../data/exercises.js'

export default function SetupScreen({ onStart, onBack, sessionCount }) {
  const [selected, setSelected] = useState([])
  const [activePreset, setActivePreset] = useState(null)

  const nextSplitKey = WEEK_ROTATION[sessionCount % WEEK_ROTATION.length]
  const nextSplit = WORKOUT_SPLITS[nextSplitKey]

  function selectPreset(preset) {
    setActivePreset(preset.id)
    setSelected(preset.equipment)
  }

  function toggleEquipment(id) {
    setActivePreset(null)
    setSelected(prev =>
      prev.includes(id) ? prev.filter(e => e !== id) : [...prev, id]
    )
  }

  return (
    <div style={s.root}>
      <div style={s.topBar}>
        <button style={s.backBtn} onClick={onBack}>← Back</button>
      </div>

      <div style={s.content}>
        <div style={s.heading}>
          <div style={s.headingLabel}>TODAY'S SESSION</div>
          <div style={s.headingTitle}>{nextSplit.label}</div>
        </div>

        <div style={s.section}>
          <div style={s.sectionLabel}>QUICK SELECT</div>
          <div style={s.presetGrid}>
            {GYM_PRESETS.map(preset => (
              <button
                key={preset.id}
                style={{ ...s.presetBtn, ...(activePreset === preset.id ? s.presetBtnActive : {}) }}
                onClick={() => selectPreset(preset)}
              >
                {preset.label}
              </button>
            ))}
          </div>
        </div>

        <div style={s.section}>
          <div style={s.sectionLabel}>OR PICK EQUIPMENT</div>
          <div style={s.equipGrid}>
            {EQUIPMENT_OPTIONS.map(eq => {
              const isSelected = selected.includes(eq.id)
              return (
                <button
                  key={eq.id}
                  style={{ ...s.equipBtn, ...(isSelected ? s.equipBtnActive : {}) }}
                  onClick={() => toggleEquipment(eq.id)}
                >
                  <span style={s.equipIcon}>{eq.icon}</span>
                  <span style={s.equipLabel}>{eq.label}</span>
                </button>
              )
            })}
          </div>
        </div>

        {selected.length === 0 && (
          <div style={s.hint}>Select at least one piece of equipment to continue</div>
        )}

        <button
          style={{ ...s.startBtn, ...(selected.length === 0 ? s.startBtnDisabled : {}) }}
          onClick={() => selected.length > 0 && onStart(selected)}
          disabled={selected.length === 0}
        >
          GENERATE WORKOUT
        </button>
      </div>
    </div>
  )
}

const s = {
  root: { minHeight: '100vh', background: '#0a0a0a' },
  topBar: { padding: '16px 20px', borderBottom: '1px solid #1a1a1a' },
  backBtn: { background: 'none', border: 'none', color: '#666', cursor: 'pointer', fontFamily: "'DM Mono', monospace", fontSize: 13 },
  content: { padding: '24px 20px' },
  heading: { marginBottom: 32 },
  headingLabel: { fontFamily: "'DM Mono', monospace", fontSize: 10, color: '#555', letterSpacing: 3, marginBottom: 6 },
  headingTitle: { fontFamily: "'Bebas Neue', sans-serif", fontSize: 42, color: '#e8ff00', letterSpacing: 3, lineHeight: 1 },
  section: { marginBottom: 28 },
  sectionLabel: { fontFamily: "'DM Mono', monospace", fontSize: 10, color: '#555', letterSpacing: 3, marginBottom: 12 },
  presetGrid: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 },
  presetBtn: {
    background: '#111', border: '1px solid #222', borderRadius: 10,
    padding: '12px 8px', color: '#888', cursor: 'pointer',
    fontFamily: "'DM Sans', sans-serif", fontSize: 13, fontWeight: 500,
    transition: 'all 0.15s',
  },
  presetBtnActive: { background: '#1a1a0a', border: '1px solid #e8ff00', color: '#e8ff00' },
  equipGrid: { display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 8 },
  equipBtn: {
    background: '#111', border: '1px solid #1a1a1a', borderRadius: 10,
    padding: '14px 12px', display: 'flex', alignItems: 'center', gap: 10,
    cursor: 'pointer', transition: 'all 0.15s',
  },
  equipBtnActive: { background: '#0d1a00', border: '1px solid #4ade80' },
  equipIcon: { fontSize: 20 },
  equipLabel: { fontFamily: "'DM Sans', sans-serif", fontSize: 13, color: '#aaa', fontWeight: 500 },
  hint: { fontFamily: "'DM Mono', monospace", fontSize: 11, color: '#444', textAlign: 'center', marginBottom: 20 },
  startBtn: {
    width: '100%', background: '#e8ff00', border: 'none',
    borderRadius: 12, padding: '18px',
    fontFamily: "'Bebas Neue', sans-serif", fontSize: 24, letterSpacing: 4,
    color: '#0a0a0a', cursor: 'pointer', marginTop: 8,
  },
  startBtnDisabled: { background: '#1a1a1a', color: '#333', cursor: 'not-allowed' },
}
