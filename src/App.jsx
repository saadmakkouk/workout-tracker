import { useState, useEffect } from 'react'
import { supabase } from './lib/supabase.js'
import SetupScreen from './components/SetupScreen.jsx'
import WorkoutScreen from './components/WorkoutScreen.jsx'
import HistoryScreen from './components/HistoryScreen.jsx'
import HomeScreen from './components/HomeScreen.jsx'
import { generateWorkout, analyzeFatigue } from './lib/workout.js'

export default function App() {
  const [screen, setScreen] = useState('home') // home | setup | workout | history
  const [sessions, setSessions] = useState([])
  const [allLogs, setAllLogs] = useState([])
  const [currentWorkout, setCurrentWorkout] = useState(null)
  const [selectedEquipment, setSelectedEquipment] = useState([])
  const [loading, setLoading] = useState(true)
  const [fatigueAlert, setFatigueAlert] = useState(null)

  useEffect(() => {
    loadData()
  }, [])

  async function loadData() {
    setLoading(true)
    try {
      const { data: sessionData } = await supabase
        .from('sessions')
        .select('*')
        .order('date', { ascending: false })
        .limit(20)

      const { data: logData } = await supabase
        .from('logs')
        .select('*')
        .order('id', { ascending: false })
        .limit(200)

      setSessions(sessionData || [])
      setAllLogs(logData || [])

      const fatigue = analyzeFatigue(sessionData || [])
      setFatigueAlert(fatigue.fatigued ? fatigue.message : null)
    } catch (err) {
      console.error('Load error:', err)
    }
    setLoading(false)
  }

  function handleStartSetup(equipment) {
    setSelectedEquipment(equipment)
    const sessionNum = sessions.length
    const workout = generateWorkout(sessionNum, equipment, allLogs)
    setCurrentWorkout(workout)
    setScreen('workout')
  }

  async function handleFinishWorkout(loggedExercises, fatigueLevel, notes) {
    try {
      // Save session
      const { data: sessionData, error: sessionError } = await supabase
        .from('sessions')
        .insert({
          day_type: currentWorkout.splitKey,
          equipment: selectedEquipment,
          fatigue_level: fatigueLevel,
          notes: notes || null,
        })
        .select()
        .single()

      if (sessionError) throw sessionError

      // Save logs
      const logsToInsert = loggedExercises.map(ex => ({
        session_id: sessionData.id,
        exercise_name: ex.name,
        sets: JSON.stringify(ex.loggedSets),
        target_weight: ex.targetWeight,
        target_reps: ex.repRange,
        felt: ex.felt,
      }))

      await supabase.from('logs').insert(logsToInsert)

      await loadData()
      setScreen('home')
      setCurrentWorkout(null)
    } catch (err) {
      console.error('Save error:', err)
      alert('Error saving workout. Check your connection.')
    }
  }

  function handleSwapAndContinue(updatedWorkout) {
    setCurrentWorkout(updatedWorkout)
  }

  if (loading) {
    return (
      <div style={styles.loader}>
        <div style={styles.loaderText}>LIFT</div>
        <div style={styles.loaderSub}>Loading your data...</div>
      </div>
    )
  }

  return (
    <div style={styles.root}>
      {screen === 'home' && (
        <HomeScreen
          sessions={sessions}
          allLogs={allLogs}
          fatigueAlert={fatigueAlert}
          onStartWorkout={() => setScreen('setup')}
          onViewHistory={() => setScreen('history')}
          sessionCount={sessions.length}
        />
      )}
      {screen === 'setup' && (
        <SetupScreen
          onStart={handleStartSetup}
          onBack={() => setScreen('home')}
          sessionCount={sessions.length}
        />
      )}
      {screen === 'workout' && currentWorkout && (
        <WorkoutScreen
          workout={currentWorkout}
          availableEquipment={selectedEquipment}
          allLogs={allLogs}
          onFinish={handleFinishWorkout}
          onBack={() => setScreen('home')}
          onSwap={handleSwapAndContinue}
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

const styles = {
  root: {
    minHeight: '100vh',
    background: '#0a0a0a',
    color: '#f0ede8',
    fontFamily: "'DM Sans', sans-serif",
    maxWidth: 480,
    margin: '0 auto',
    position: 'relative',
    overflowX: 'hidden',
  },
  loader: {
    minHeight: '100vh',
    background: '#0a0a0a',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  loaderText: {
    fontFamily: "'Bebas Neue', sans-serif",
    fontSize: 64,
    color: '#e8ff00',
    letterSpacing: 8,
  },
  loaderSub: {
    fontFamily: "'DM Mono', monospace",
    fontSize: 12,
    color: '#555',
    letterSpacing: 2,
  }
}
