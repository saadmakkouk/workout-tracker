import { useState, useEffect } from 'react'
import { supabase } from './lib/supabase.js'
import HomeScreen from './components/HomeScreen.jsx'
import SetupScreen from './components/SetupScreen.jsx'
import WorkoutScreen from './components/WorkoutScreen.jsx'
import FreestyleScreen from './components/FreestyleScreen.jsx'
import StatsScreen from './components/StatsScreen.jsx'
import HistoryScreen from './components/HistoryScreen.jsx'
import { analyzeFatigue } from './lib/programming.js'

export default function App() {
  const [screen, setScreen] = useState('home')
  const [sessions, setSessions] = useState([])
  const [allLogs, setAllLogs] = useState([])
  const [bodyweightLog, setBodyweightLog] = useState([])
  const [currentWorkout, setCurrentWorkout] = useState(null)
  const [selectedEquipment, setSelectedEquipment] = useState([])
  const [loading, setLoading] = useState(true)
  const [fatigue, setFatigue] = useState({ fatigued: false, deloadRecommended: false, message: null })
  const [exerciseNotes, setExerciseNotes] = useState({})

  useEffect(() => { loadData() }, [])

  async function loadData() {
    setLoading(true)
    try {
      const [{ data: sessionData }, { data: logData }, { data: bwData }] = await Promise.all([
        supabase.from('sessions').select('*').order('date', { ascending: false }).limit(100),
        supabase.from('logs').select('*').order('created_at', { ascending: false }).limit(1000),
        supabase.from('bodyweight').select('*').order('date', { ascending: false }).limit(60).catch(() => ({ data: [] })),
      ])
      setSessions(sessionData || [])
      setAllLogs(logData || [])
      setBodyweightLog(bwData || [])
      setFatigue(analyzeFatigue(sessionData || []))

      // Load exercise notes from localStorage as lightweight persistent store
      try {
        const savedNotes = JSON.parse(localStorage.getItem('lift_exercise_notes') || '{}')
        setExerciseNotes(savedNotes)
      } catch {}
    } catch (err) {
      console.error('Load error:', err)
    }
    setLoading(false)
  }

  function saveExerciseNote(exerciseName, note) {
    const updated = { ...exerciseNotes, [exerciseName]: note }
    setExerciseNotes(updated)
    try { localStorage.setItem('lift_exercise_notes', JSON.stringify(updated)) } catch {}
  }

  async function saveSession(workout, exercises, fatigueLevel, sessionNotes) {
    try {
      const { data: sessionData, error } = await supabase
        .from('sessions')
        .insert({
          day_type: workout.dayType,
          equipment: selectedEquipment,
          fatigue_level: fatigueLevel,
          notes: sessionNotes || null,
          phase: workout.phase,
          block_key: workout.blockKey,
          block_number: workout.blockNumber,
          session_number: workout.sessionCount,
        })
        .select().single()

      if (error) throw error

      const logsToInsert = exercises
        .filter(ex => ex.sets.some(s => s.weight && s.reps))
        .map(ex => ({
          session_id: sessionData.id,
          exercise_name: ex.name,
          exercise_id: ex.exerciseId,
          sets: JSON.stringify(ex.sets),
          target_reps: ex.repRange,
          target_rir: ex.targetRIR,
          phase: workout.phase,
          block_key: workout.blockKey,
        }))

      if (logsToInsert.length > 0) await supabase.from('logs').insert(logsToInsert)

      await loadData()
      setScreen('home')
      setCurrentWorkout(null)
    } catch (err) {
      console.error('Save error:', err)
      alert('Error saving. Check connection.')
    }
  }

  async function saveBodyweight(weight) {
    try {
      await supabase.from('bodyweight').insert({ weight: parseFloat(weight), date: new Date().toISOString() })
      await loadData()
    } catch (err) {
      console.error('BW save error:', err)
    }
  }

  if (loading) {
    return (
      <div style={s.loader}>
        <div style={s.logo}>LIFT</div>
        <div style={s.loaderSub}>Loading...</div>
      </div>
    )
  }

  return (
    <div style={s.root}>
      {screen === 'home' && (
        <HomeScreen
          sessions={sessions} allLogs={allLogs} bodyweightLog={bodyweightLog}
          fatigue={fatigue} sessionCount={sessions.length}
          onStartSetup={() => setScreen('setup')}
          onFreestyle={() => setScreen('freestyle')}
          onHistory={() => setScreen('history')}
          onStats={() => setScreen('stats')}
          onSaveBodyweight={saveBodyweight}
        />
      )}
      {screen === 'setup' && (
        <SetupScreen
          sessionCount={sessions.length} allLogs={allLogs} recentSessions={sessions.slice(0, 3)}
          onStart={(equipment, workout) => {
            setSelectedEquipment(equipment)
            setCurrentWorkout(workout)
            setScreen('workout')
          }}
          onBack={() => setScreen('home')}
        />
      )}
      {screen === 'workout' && currentWorkout && (
        <WorkoutScreen
          workout={currentWorkout} availableEquipment={selectedEquipment}
          allLogs={allLogs} exerciseNotes={exerciseNotes}
          onFinish={(exercises, fatigueLevel, notes) => saveSession(currentWorkout, exercises, fatigueLevel, notes)}
          onBack={() => setScreen('home')}
          onUpdateWorkout={setCurrentWorkout}
          onSaveExerciseNote={saveExerciseNote}
        />
      )}
      {screen === 'freestyle' && (
        <FreestyleScreen
          onFinish={async (exercises, fatigueLevel, notes) => {
            const fakeWorkout = { dayType: 'freestyle', phase: 'freestyle', blockKey: 'freestyle', blockNumber: 0, sessionCount: sessions.length }
            await saveSession(fakeWorkout, exercises, fatigueLevel, notes)
          }}
          onBack={() => setScreen('home')}
        />
      )}
      {screen === 'stats' && (
        <StatsScreen
          sessions={sessions} allLogs={allLogs} bodyweightLog={bodyweightLog}
          onBack={() => setScreen('home')}
        />
      )}
      {screen === 'history' && (
        <HistoryScreen
          sessions={sessions} allLogs={allLogs}
          onBack={() => setScreen('home')}
        />
      )}
    </div>
  )
}

const s = {
  root: { minHeight: '100vh', background: '#0a0a0a', color: '#f0ede8', fontFamily: "'DM Sans', sans-serif", maxWidth: 480, margin: '0 auto' },
  loader: { minHeight: '100vh', background: '#0a0a0a', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 12 },
  logo: { fontFamily: "'Bebas Neue', sans-serif", fontSize: 72, color: '#e8ff00', letterSpacing: 10 },
  loaderSub: { fontFamily: "'DM Mono', monospace", fontSize: 12, color: '#444', letterSpacing: 3 },
}
