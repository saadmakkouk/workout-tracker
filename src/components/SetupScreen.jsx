import { useState } from 'react'
import { EQUIPMENT_OPTIONS, GYM_PRESETS, PROGRAMME } from '../data/exercises.js'
import { generateWorkout, getDayType, getCurrentPhase, getCurrentBlock, getReadinessMultiplier, checkConsecutiveDays } from '../lib/programming.js'

const DAY_OPTIONS = [
  { id: 'day1', label: 'Upper — Strength', focus: 'Bench & Row', color: '#e8ff00' },
  { id: 'day2', label: 'Lower — Strength', focus: 'Squat', color: '#4ade80' },
  { id: 'day3', label: 'Upper — Volume', focus: 'OHP & Volume', color: '#60a5fa' },
  { id: 'day4', label: 'Lower — Athletic', focus: 'Deadlift & Power', color: '#f97316' },
]

export default function SetupScreen({ sessionCount, allLogs, recentSessions, onStart, onBack }) {
  const [step, setStep] = useState('day') // day | readiness | equipment
  const [selectedDay, setSelectedDay] = useState(getDayType(sessionCount))
  const [equipment, setEquipment] = useState([])
  const [activePreset, setActivePreset] = useState(null)
  const [readiness, setReadiness] = useState({ sleep: 'ok', stress: 'medium', physical: 'normal' })
  const [consecutiveWarning, setConsecutiveWarning] = useState(null)

  const phase = getCurrentPhase(sessionCount)
  const suggestedDay = getDayType(sessionCount)

  function selectDay(dayId) {
    const warning = checkConsecutiveDays(dayId, recentSessions)
    setConsecutiveWarning(warning)
    setSelectedDay(dayId)
  }

  function handleDayConfirm() {
    setStep('readiness')
  }

  function handleReadinessConfirm() {
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
    if (equipment.length === 0) return
    const readinessData = getReadinessMultiplier(readiness.sleep, readiness.stress, readiness.physical)
    const workout = generateWorkout(sessionCount, selectedDay, equipment, allLogs, readiness)
    onStart(equipment, workout)
  }

  const readinessData = getReadinessMultiplier(readiness.sleep, readiness.stress, readiness.physical)
  const selectedDayInfo = DAY_OPTIONS.find(d => d.id === selectedDay)

  return (
    <div style={s.root}>
      <div style={s.topBar}>
        <button style={s.backBtn} onClick={step === 'day' ? onBack : () => setStep(step === 'equipment' ? 'readiness' : 'day')}>← Back</button>
        <div style={s.steps}>
          {['day', 'readiness', 'equipment'].map((st, i) => (
            <div key={st} style={{ ...s.stepDot, ...(step === st ? s.stepDotActive : step === 'equipment' && i < 2 ? s.stepDotDone : step === 'readiness' && i < 1 ? s.stepDotDone : {}) }} />
          ))}
        </div>
      </div>

      <div style={s.content}>

        {/* STEP 1: DAY PICKER */}
        {step === 'day' && (
          <>
            <div style={s.heading}>
              <div style={s.headingMeta}>{phase.label.toUpperCase()} · WK {phase.week}</div>
              <div style={s.headingTitle}>What are you training?</div>
            </div>

            {consecutiveWarning && (
              <div style={s.warning}>⚠️ {consecutiveWarning}</div>
            )}

            <div style={s.dayGrid}>
              {DAY_OPTIONS.map(day => {
                const isSuggested = day.id === suggestedDay
                const isSelected = day.id === selectedDay
                return (
                  <button
                    key={day.id}
                    style={{ ...s.dayBtn, ...(isSelected ? { ...s.dayBtnActive, borderColor: day.color } : {}) }}
                    onClick={() => selectDay(day.id)}
                  >
                    <div style={{ ...s.dayDot, background: day.color }} />
                    <div style={s.dayLabel}>{day.label}</div>
                    <div style={s.dayFocus}>{day.focus}</div>
                    {isSuggested && <div style={s.suggestedTag}>SUGGESTED</div>}
                  </button>
                )
              })}
            </div>

            <button style={{ ...s.nextBtn, background: selectedDayInfo?.color, color: '#0a0a0a' }} onClick={handleDayConfirm}>
              Continue →
            </button>
          </>
        )}

        {/* STEP 2: READINESS CHECK */}
        {step === 'readiness' && (
          <>
            <div style={s.heading}>
              <div style={s.headingMeta}>READINESS CHECK</div>
              <div style={s.headingTitle}>How are you feeling?</div>
              <div style={s.headingSub}>Helps the app adjust your target weights</div>
            </div>

            <div style={s.readinessSection}>
              <div style={s.readinessLabel}>Sleep last night</div>
              <div style={s.readinessRow}>
                {[['poor', '😴 Poor'], ['ok', '😐 Ok'], ['good', '😊 Good']].map(([val, label]) => (
                  <button key={val} style={{ ...s.readinessBtn, ...(readiness.sleep === val ? s.readinessBtnActive : {}) }} onClick={() => setReadiness(r => ({ ...r, sleep: val }))}>
                    {label}
                  </button>
                ))}
              </div>
            </div>

            <div style={s.readinessSection}>
              <div style={s.readinessLabel}>Stress level</div>
              <div style={s.readinessRow}>
                {[['high', '😤 High'], ['medium', '😌 Medium'], ['low', '🙂 Low']].map(([val, label]) => (
                  <button key={val} style={{ ...s.readinessBtn, ...(readiness.stress === val ? s.readinessBtnActive : {}) }} onClick={() => setReadiness(r => ({ ...r, stress: val }))}>
                    {label}
                  </button>
                ))}
              </div>
            </div>

            <div style={s.readinessSection}>
              <div style={s.readinessLabel}>Body feels</div>
              <div style={s.readinessRow}>
                {[['beatup', '💢 Beat up'], ['normal', '👌 Normal'], ['fresh', '⚡ Fresh']].map(([val, label]) => (
                  <button key={val} style={{ ...s.readinessBtn, ...(readiness.physical === val ? s.readinessBtnActive : {}) }} onClick={() => setReadiness(r => ({ ...r, physical: val }))}>
                    {label}
                  </button>
                ))}
              </div>
            </div>

            <div style={{ ...s.readinessSummary, borderColor: readinessData.color }}>
              <span style={{ color: readinessData.color }}>{readinessData.multiplier > 1 ? '↑' : readinessData.multiplier < 1 ? '↓' : '→'}</span>
              <span style={s.readinessSummaryText}>{readinessData.label}</span>
            </div>

            <button style={s.nextBtn} onClick={handleReadinessConfirm}>Continue →</button>
          </>
        )}

        {/* STEP 3: EQUIPMENT */}
        {step === 'equipment' && (
          <>
            <div style={s.heading}>
              <div style={s.headingMeta}>{selectedDayInfo?.label.toUpperCase()}</div>
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

            <button style={{ ...s.nextBtn, ...(equipment.length === 0 ? s.nextBtnDisabled : { background: selectedDayInfo?.color, color: '#0a0a0a' }) }} onClick={handleStart} disabled={equipment.length === 0}>
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
  stepDotActive: { background: '#e8ff00', width: 18 },
  stepDotDone: { background: '#4ade80' },
  content: { padding: '24px 20px' },
  heading: { marginBottom: 24 },
  headingMeta: { fontFamily: "'DM Mono', monospace", fontSize: 10, color: '#555', letterSpacing: 3, marginBottom: 6 },
  headingTitle: { fontFamily: "'Bebas Neue', sans-serif", fontSize: 36, color: '#f0ede8', letterSpacing: 2, lineHeight: 1, marginBottom: 4 },
  headingSub: { fontSize: 13, color: '#555' },
  warning: { background: '#1a0f00', border: '1px solid #92400e', borderRadius: 10, padding: '10px 14px', fontSize: 12, color: '#d97706', marginBottom: 16 },
  dayGrid: { display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 24 },
  dayBtn: { background: '#111', border: '1px solid #1a1a1a', borderRadius: 12, padding: '16px', display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer', position: 'relative', textAlign: 'left' },
  dayBtnActive: { background: '#141414', border: '2px solid' },
  dayDot: { width: 10, height: 10, borderRadius: '50%', flexShrink: 0 },
  dayLabel: { fontSize: 15, color: '#f0ede8', fontWeight: 500, flex: 1 },
  dayFocus: { fontFamily: "'DM Mono', monospace", fontSize: 11, color: '#555' },
  suggestedTag: { position: 'absolute', top: -1, right: 12, fontFamily: "'DM Mono', monospace", fontSize: 8, color: '#0a0a0a', background: '#e8ff00', padding: '2px 8px', borderRadius: '0 0 6px 6px', letterSpacing: 1 },
  readinessSection: { marginBottom: 20 },
  readinessLabel: { fontFamily: "'DM Mono', monospace", fontSize: 10, color: '#555', letterSpacing: 2, marginBottom: 10 },
  readinessRow: { display: 'flex', gap: 8 },
  readinessBtn: { flex: 1, background: '#111', border: '1px solid #1a1a1a', borderRadius: 10, padding: '12px 4px', color: '#666', cursor: 'pointer', fontFamily: "'DM Sans', sans-serif", fontSize: 12, fontWeight: 500 },
  readinessBtnActive: { background: '#141414', border: '1px solid #e8ff00', color: '#e8ff00' },
  readinessSummary: { display: 'flex', gap: 8, alignItems: 'center', border: '1px solid', borderRadius: 10, padding: '12px 16px', marginBottom: 24 },
  readinessSummaryText: { fontSize: 13, color: '#aaa' },
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
