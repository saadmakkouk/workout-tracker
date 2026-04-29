import { useState } from 'react'
import { EQUIPMENT_OPTIONS, GYM_PRESETS, PROGRAMME } from '../data/exercises.js'
import { generateWorkout, getNextDayType, getCurrentPhase, checkConsecutiveDays } from '../lib/programming.js'

export default function SetupScreen({ sessionCount, allLogs, recentSessions, sessions, onStart, onBack }) {
  const [step, setStep] = useState('session') // session | equipment
  const [selectedSession, setSelectedSession] = useState(null)
  const [equipment, setEquipment] = useState([])
  const [activePreset, setActivePreset] = useState(null)

  const suggestedType = getNextDayType(recentSessions || [])

  const sessionOptions = Object.values(PROGRAMME)

  function handleSessionSelect(session) {
    setSelectedSession(session)
  }

  function handleSessionConfirm() {
    setStep('equipment')
  }

  function selectPreset(preset) {
    setActivePreset(preset.id)
    setEquipment(preset.equipment)
  }

  function toggleEquipment(id) {
    setActivePreset(null)
    setEquipment(prev => prev.includes(id) ? prev.filter(e => e !== id) : [...prev, id])
  }

  function handleStart() {
    if (equipment.length === 0 || !selectedSession) return
    // Count sessions of this type for phase calculation
    const sessionTypeCount = (sessions || []).filter(s => s.day_type === selectedSession.id).length
    const workout = generateWorkout(sessionTypeCount, selectedSession.id, equipment, allLogs)
    onStart(equipment, workout)
  }

  return (
    <div style={s.root}>
      <div style={s.topBar}>
        <button style={s.backBtn} onClick={step === 'session' ? onBack : () => setStep('session')}>← Back</button>
        <div style={s.steps}>
          {['session', 'equipment'].map((st, i) => (
            <div key={st} style={{
              ...s.stepDot,
              ...(step === st ? s.stepDotActive : step === 'equipment' && i < 1 ? s.stepDotDone : {})
            }} />
          ))}
        </div>
        <span style={{ width: 60 }} />
      </div>

      <div style={s.content}>
        {step === 'session' && (
          <>
            <div style={s.heading}>
              <div style={s.headingMeta}>WHAT ARE YOU TRAINING?</div>
              <div style={s.headingTitle}>Pick Your Session</div>
            </div>

            <div style={s.sessionGrid}>
              {sessionOptions.map(session => {
                const isSelected = selectedSession?.id === session.id
                const isSuggested = session.id === suggestedType && session.isBlocked
                return (
                  <button
                    key={session.id}
                    style={{
                      ...s.sessionBtn,
                      ...(isSelected ? { ...s.sessionBtnActive, borderColor: session.color } : {}),
                    }}
                    onClick={() => handleSessionSelect(session)}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
                      <div style={{ ...s.sessionDot, background: session.color }} />
                      <div style={s.sessionLabel}>{session.label}</div>
                      {session.isBlocked && <div style={s.blockedTag}>TRACKED</div>}
                    </div>
                    <div style={s.sessionFocus}>{session.focus}</div>
                    {isSuggested && <div style={{ ...s.suggestedTag, background: session.color }}>SUGGESTED</div>}
                  </button>
                )
              })}
            </div>

            <button
              style={{
                ...s.nextBtn,
                ...(selectedSession ? { background: selectedSession.color, color: '#0a0a0a' } : s.nextBtnDisabled)
              }}
              onClick={handleSessionConfirm}
              disabled={!selectedSession}
            >
              CONTINUE →
            </button>
          </>
        )}

        {step === 'equipment' && (
          <>
            <div style={s.heading}>
              <div style={s.headingMeta}>{selectedSession?.label?.toUpperCase()}</div>
              <div style={s.headingTitle}>What's Available?</div>
            </div>

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

            <div style={s.equipLabel}>OR SELECT MANUALLY</div>
            <div style={s.equipGrid}>
              {EQUIPMENT_OPTIONS.map(eq => {
                const on = equipment.includes(eq.id)
                return (
                  <button
                    key={eq.id}
                    style={{ ...s.equipBtn, ...(on ? s.equipActive : {}) }}
                    onClick={() => toggleEquipment(eq.id)}
                  >
                    <span style={s.equipIcon}>{eq.icon}</span>
                    <span style={{ ...s.equipText, color: on ? '#e8ff00' : '#888' }}>{eq.label}</span>
                  </button>
                )
              })}
            </div>

            <button
              style={{
                ...s.nextBtn,
                ...(equipment.length === 0
                  ? s.nextBtnDisabled
                  : { background: selectedSession?.color || '#e8ff00', color: '#0a0a0a' })
              }}
              onClick={handleStart}
              disabled={equipment.length === 0}
            >
              GENERATE WORKOUT
            </button>
          </>
        )}
      </div>
    </div>
  )
}

const s = {
  root: { minHeight: '100vh', background: '#0a0a0a' },
  topBar: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 20px', borderBottom: '1px solid #161616' },
  backBtn: { background: 'none', border: 'none', color: '#555', cursor: 'pointer', fontFamily: "'DM Mono', monospace", fontSize: 13 },
  steps: { display: 'flex', gap: 6 },
  stepDot: { width: 6, height: 6, borderRadius: '50%', background: '#222' },
  stepDotActive: { background: '#e8ff00', width: 18, borderRadius: 3 },
  stepDotDone: { background: '#4ade80' },
  content: { padding: '24px 20px' },
  heading: { marginBottom: 24 },
  headingMeta: { fontFamily: "'DM Mono', monospace", fontSize: 10, color: '#555', letterSpacing: 3, marginBottom: 6 },
  headingTitle: { fontFamily: "'Bebas Neue', sans-serif", fontSize: 36, color: '#f0ede8', letterSpacing: 2, lineHeight: 1 },
  sessionGrid: { display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 24 },
  sessionBtn: { background: '#111', border: '1px solid #1a1a1a', borderRadius: 12, padding: '16px', cursor: 'pointer', position: 'relative', textAlign: 'left' },
  sessionBtnActive: { background: '#141414', border: '2px solid' },
  sessionDot: { width: 10, height: 10, borderRadius: '50%', flexShrink: 0 },
  sessionLabel: { fontSize: 15, color: '#f0ede8', fontWeight: 500, flex: 1 },
  sessionFocus: { fontFamily: "'DM Mono', monospace", fontSize: 11, color: '#555', marginLeft: 20 },
  blockedTag: { fontFamily: "'DM Mono', monospace", fontSize: 8, color: '#4ade80', background: '#0d1a00', border: '1px solid #4ade8044', borderRadius: 10, padding: '2px 6px', letterSpacing: 1 },
  suggestedTag: { position: 'absolute', top: -1, right: 12, fontFamily: "'DM Mono', monospace", fontSize: 8, color: '#0a0a0a', padding: '2px 8px', borderRadius: '0 0 6px 6px', letterSpacing: 1 },
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
}
