import { useState, useEffect } from 'react'
import { supabase } from './lib/supabase.js'
import HomeScreen from './components/HomeScreen.jsx'
import SetupScreen from './components/SetupScreen.jsx'
import WorkoutScreen from './components/WorkoutScreen.jsx'
import FreestyleScreen from './components/FreestyleScreen.jsx'
import HistoryScreen from './components/HistoryScreen.jsx'
import { analyzeFatigue } from './lib/programming.js'

export default function App() {
  const [screen, setScreen] = useState('home')
  const [sessions, setSessions] = useState([])
  const [allLogs, setAllLogs] = useState([])
  const [currentWorkout, setCurrentWorkout] = useState(null)
  const [selectedEquipment, setSelectedEquipment] = useState([])
  const [loading, setLoading] = useState(true)
  const [fatigue, setFatigue] = useState({ fatigued: false, deloadRecommended: false, message: null })

  useEffect(() => { loadData() }, [])

  async function loadData() {
    setLoading(true)
    try {
      const [{ data: sessionData }, { data: logData }] = await Promise.all([
        supabase.from('sessions').select('*').order('date', { ascending: false }).limit(50),
        supabase.from('logs').select('*').order('id', { ascending: false }).limit(500),
      ])
      setSessions(sessionData || [])
      setAllLogs(logData || [])
      setFatigue(analyzeFatigue(sessionData || []))
    } catch (err) {
      console.error('Load error:', err)
    }
    setLoading(false)
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
          felt: ex.felt,
        }))

      if (logsToInsert.length > 0) {
        await supabase.from('logs').insert(logsToInsert)
      }

      await loadData()
      setScreen('home')
      setCurrentWorkout(null)
    } catch (err) {
      console.error('Save error:', err)
      alert('Error saving session. Check your connection and try again.')
    }
  }

  if (loading) {
    return (
      <div style={s.loader}>
        <div style={s.loaderLogo}>LIFT</div>
        <div style={s.loaderSub}>Loading...</div>
      </div>
    )
  }

  return (
    <div style={s.root}>
      {screen === 'home' && (
        <HomeScreen
          sessions={sessions}
          allLogs={allLogs}
          fatigue={fatigue}
          sessionCount={sessions.length}
          onStartSetup={() => setScreen('setup')}
          onFreestyle={() => setScreen('freestyle')}
          onHistory={() => setScreen('history')}
        />
      )}
      {screen === 'setup' && (
        <SetupScreen
          sessionCount={sessions.length}
          allLogs={allLogs}
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
          workout={currentWorkout}
          availableEquipment={selectedEquipment}
          allLogs={allLogs}
          onFinish={(exercises, fatigueLevel, notes) => saveSession(currentWorkout, exercises, fatigueLevel, notes)}
          onBack={() => setScreen('home')}
          onUpdateWorkout={setCurrentWorkout}
        />
      )}
      {screen === 'freestyle' && (
        <FreestyleScreen
          availableEquipment={selectedEquipment}
          onFinish={async (exercises, fatigueLevel, notes) => {
            const fakeWorkout = { dayType: 'freestyle', phase: 'freestyle', blockKey: 'freestyle', sessionCount: sessions.length }
            await saveSession(fakeWorkout, exercises, fatigueLevel, notes)
          }}
          onBack={() => setScreen('home')}
        />
      )}
      {screen === 'history' && (
        <HistoryScreen
          sessions={sessions}
          allLogs={allLogs}
          onBack={() => setScreen('home')}
        />
      )}
    </div>
  )
}

const s = {
  root: { minHeight: '100vh', background: '#0a0a0a', color: '#f0ede8', fontFamily: "'DM Sans', sans-serif", maxWidth: 480, margin: '0 auto' },
  loader: { minHeight: '100vh', background: '#0a0a0a', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 12 },
  loaderLogo: { fontFamily: "'Bebas Neue', sans-serif", fontSize: 72, color: '#e8ff00', letterSpacing: 10 },
  loaderSub: { fontFamily: "'DM Mono', monospace", fontSize: 12, color: '#444', letterSpacing: 3 },
}
