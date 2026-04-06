import { EXERCISE_LIBRARY, WORKOUT_SPLITS, WEEK_ROTATION } from '../data/exercises.js'

// Generate workout based on session number and available equipment
export function generateWorkout(sessionNumber, availableEquipment, pastLogs = []) {
  const splitIndex = sessionNumber % WEEK_ROTATION.length
  const splitKey = WEEK_ROTATION[splitIndex]
  const split = WORKOUT_SPLITS[splitKey]

  const exercises = split.structure.map((slot) => {
    const muscleGroup = EXERCISE_LIBRARY[slot.muscle]
    if (!muscleGroup) return null

    const pool = slot.type === 'compound'
      ? muscleGroup.compound
      : [...muscleGroup.isolation, ...muscleGroup.compound]

    // Filter by available equipment
    const filtered = pool.filter(ex =>
      ex.equipment.length === 0 ||
      ex.equipment.every(eq => availableEquipment.includes(eq))
    )

    if (filtered.length === 0) return null

    // Find previously used exercise for this slot to avoid repeats
    const recentNames = pastLogs.slice(-8).map(l => l.exercise_name)
    const preferred = filtered.filter(ex => !recentNames.includes(ex.name))
    const chosen = preferred.length > 0
      ? preferred[Math.floor(Math.random() * preferred.length)]
      : filtered[Math.floor(Math.random() * filtered.length)]

    // Find previous performance for this exercise
    const prevLog = pastLogs
      .filter(l => l.exercise_name === chosen.name)
      .sort((a, b) => new Date(b.date) - new Date(a.date))[0]

    const targetWeight = calculateTargetWeight(chosen.name, slot.repRange, prevLog, sessionNumber)

    return {
      id: Math.random().toString(36).substr(2, 9),
      name: chosen.name,
      muscle: slot.muscle,
      equipment: chosen.equipment,
      sets: slot.sets,
      repRange: slot.repRange,
      targetWeight,
      rest: slot.rest,
      label: slot.label,
      felt: null,
      loggedSets: Array(slot.sets).fill(null).map(() => ({ reps: '', weight: targetWeight || '' }))
    }
  }).filter(Boolean)

  return {
    splitKey,
    splitLabel: split.label,
    exercises,
    sessionNumber
  }
}

// Swap a single exercise for an alternative hitting the same muscle
export function swapExercise(exercise, availableEquipment, currentWorkoutNames = [], pastLogs = []) {
  const muscleGroup = EXERCISE_LIBRARY[exercise.muscle]
  if (!muscleGroup) return exercise

  const pool = [...muscleGroup.compound, ...muscleGroup.isolation]
  const filtered = pool.filter(ex =>
    ex.name !== exercise.name &&
    !currentWorkoutNames.includes(ex.name) &&
    (ex.equipment.length === 0 || ex.equipment.every(eq => availableEquipment.includes(eq)))
  )

  if (filtered.length === 0) return exercise

  const recentNames = pastLogs.slice(-8).map(l => l.exercise_name)
  const preferred = filtered.filter(ex => !recentNames.includes(ex.name))
  const chosen = preferred.length > 0
    ? preferred[Math.floor(Math.random() * preferred.length)]
    : filtered[Math.floor(Math.random() * filtered.length)]

  const prevLog = pastLogs
    .filter(l => l.exercise_name === chosen.name)
    .sort((a, b) => new Date(b.date) - new Date(a.date))[0]

  const targetWeight = calculateTargetWeight(chosen.name, exercise.repRange, prevLog, 0)

  return {
    ...exercise,
    name: chosen.name,
    equipment: chosen.equipment,
    targetWeight,
    loggedSets: Array(exercise.sets).fill(null).map(() => ({ reps: '', weight: targetWeight || '' }))
  }
}

function calculateTargetWeight(exerciseName, repRange, prevLog, sessionNumber) {
  if (!prevLog || !prevLog.sets) return null

  try {
    const sets = typeof prevLog.sets === 'string' ? JSON.parse(prevLog.sets) : prevLog.sets
    if (!sets || sets.length === 0) return null

    const weights = sets.map(s => parseFloat(s.weight)).filter(w => !isNaN(w))
    const reps = sets.map(s => parseInt(s.reps)).filter(r => !isNaN(r))

    if (weights.length === 0) return null

    const avgWeight = weights.reduce((a, b) => a + b, 0) / weights.length
    const avgReps = reps.length > 0 ? reps.reduce((a, b) => a + b, 0) / reps.length : 0

    const topRange = parseInt(repRange.split('-')[1]) || 8

    // Progressive overload logic
    if (prevLog.felt === 'easy' || avgReps >= topRange) {
      // Hit top of range or felt easy — add weight
      return Math.round((avgWeight + getIncrement(avgWeight)) * 4) / 4
    } else if (prevLog.felt === 'failed' || avgReps < topRange - 3) {
      // Missed reps significantly — same weight
      return Math.round(avgWeight * 4) / 4
    } else {
      // Normal — same weight, try for more reps
      return Math.round(avgWeight * 4) / 4
    }
  } catch {
    return null
  }
}

function getIncrement(weight) {
  if (weight < 20) return 1.25
  if (weight < 60) return 2.5
  if (weight < 100) return 2.5
  return 5
}

// Analyze fatigue from recent sessions
export function analyzeFatigue(recentSessions) {
  if (recentSessions.length < 3) return { fatigued: false, message: null }

  const recentFelt = recentSessions.slice(-3).map(s => s.fatigue_level)
  const avgFatigue = recentFelt.reduce((a, b) => a + b, 0) / recentFelt.length

  if (avgFatigue >= 4) {
    return {
      fatigued: true,
      message: "Your last 3 sessions show high fatigue. Consider a deload or rest day before pushing heavy again."
    }
  }

  return { fatigued: false, message: null }
}

export function getSessionLabel(splitKey, sessionNumber) {
  const labels = {
    upper_heavy: "Upper Body — Strength",
    lower_heavy: "Lower Body — Strength",
    upper_hypertrophy: "Upper Body — Volume",
    athletic: "Athletic & Power"
  }
  return labels[splitKey] || "Workout"
}
