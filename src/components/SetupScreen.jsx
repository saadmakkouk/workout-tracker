import { useState } from 'react'
import { EQUIPMENT_OPTIONS, GYM_PRESETS, PROGRAMME } from '../data/exercises.js'
import { generateWorkout, getDayType, getCurrentPhase, getCurrentBlock } from '../lib/programming.js'

export default function SetupScreen({ sessionCount, allLogs, onStart, onBack }) {
  const [selected, setSelected] = useState([])
  const [activePreset, setActivePreset] = useState(null)

  const dayType = getDayType(sessionCount)
  const phase = getCurrentPhase(sessionCount)
  const nextDay = PROGRAMME[dayType]

  function selectPreset(preset) {
    setActivePreset(preset.id)
    setSelected(preset.equipment)
  }

  function toggleEquipment(id) {
    setActivePreset(null)
    setSelected(prev => prev.includes(id) ? prev.filter(e => e !== id) : [...prev, id])
  }

  function handleStart() {
    if (selected.length === 0) return
    const workout = generateWorkout(sessionCount, selected, allLogs)
    onStart(selected, workout)
  }

  return (
    <div style={s.root}>
      <div style={s.topBar}>
        <button style={s.backBtn} onClick={onBack}>← Back</button>
      </div>
      <div style={s.content}>
        <div style={s.heading}>
          <div style={s.headingMeta}>TODAY · {phase.label.toUpperCase()} · WK {phase.week}</div>
          <div style={s.headingTitle}>{nextDay?.label}</div>
          <div style={s.headingFocus}>{nextDay?.description}</div>
        </div>

        <div style={s.section}>
          <div style={s.sectionLabel}>QUICK SELECT</div>
          <div style={s.presetGrid}>
            {GYM_PRESETS.map(preset => (
              <button
                key={preset.id}
                style={{ ...s.presetBtn, ...(activePreset === preset.id ? s.presetActive : {}) }}
                onClick={() => selectPreset(preset)}
              >
                {preset.label}
              </button>
            ))}
          </div>
        </div>

        <div style={s.section}>
          <div style={s.sectionLabel}>OR SELECT EQUIPMENT</div>
          <div style={s.equipGrid}>
            {EQUIPMENT_OPTIONS.map(eq => {
              const on = selected.includes(eq.id)
              return (
                <button
                  key={eq.id}
                  style={{ ...s.equipBtn, ...(on ? s.equipActive : {}) }}
                  onClick={() => toggleEquipment(eq.id)}
                >
                  <span style={s.equipIcon}>{eq.icon}</span>
                  <span style={{ ...s.equipLabel, color: on ? '#e8ff00' : '#888' }}>{eq.label}</span>
                </button>
              )
            })}
          </div>
        </div>

        <button
          style={{ ...s.goBtn, ...(selected.length === 0 ? s.goBtnDisabled : {}) }}
          onClick={handleStart}
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
  topBar: { padding: '16px 20px', borderBottom: '1px solid #161616' },
  backBtn: { background: 'none', border: 'none', color: '#555', cursor: 'pointer', fontFamily: "'DM Mono', monospace", fontSize: 13 },
  content: { padding: '24px 20px' },
  heading: { marginBottom: 32 },
  headingMeta: { fontFamily: "'DM Mono', monospace", fontSize: 10, color: '#555', letterSpacing: 3, marginBottom: 6 },
  headingTitle: { fontFamily: "'Bebas Neue', sans-serif", fontSize: 40, color: '#e8ff00', letterSpacing: 2, lineHeight: 1, marginBottom: 8 },
  headingFocus: { fontSize: 13, color: '#555', lineHeight: 1.5 },
  section: { marginBottom: 28 },
  sectionLabel: { fontFamily: "'DM Mono', monospace", fontSize: 10, color: '#444', letterSpacing: 3, marginBottom: 12 },
  presetGrid: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 },
  presetBtn: { background: '#111', border: '1px solid #1a1a1a', borderRadius: 10, padding: '12px 8px', color: '#666', cursor: 'pointer', fontFamily: "'DM Sans', sans-serif", fontSize: 13, fontWeight: 500 },
  presetActive: { background: '#141400', border: '1px solid #e8ff00', color: '#e8ff00' },
  equipGrid: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 },
  equipBtn: { background: '#111', border: '1px solid #161616', borderRadius: 10, padding: '14px 12px', display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer' },
  equipActive: { background: '#0d1a00', border: '1px solid #4ade80' },
  equipIcon: { fontSize: 18 },
  equipLabel: { fontSize: 13, fontWeight: 500 },
  goBtn: { width: '100%', background: '#e8ff00', border: 'none', borderRadius: 12, padding: '18px', fontFamily: "'Bebas Neue', sans-serif", fontSize: 24, letterSpacing: 4, color: '#0a0a0a', cursor: 'pointer' },
  goBtnDisabled: { background: '#1a1a1a', color: '#333', cursor: 'not-allowed' },
}
