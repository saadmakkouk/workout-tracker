import { EXERCISES, PROGRAMME, BLOCK_ROTATIONS, WARNINGS } from '../data/exercises.js'

// ─── PHASE LOGIC ─────────────────────────────────────────────────────────────
// Accumulation: weeks 1-3 — higher reps, RIR 2-3, building volume
// Intensification: weeks 4-6 — lower reps, RIR 0-1, pushing strength
// Deload: week 7 — RIR 4-5, recovery
// New block: week 8 — exercise rotations, back to accumulation

export function getCurrentPhase(sessionCount) {
  const weekInBlock = Math.floor((sessionCount % 28) / 4) + 1
  if (weekInBlock <= 3) return { phase: 'accumulation', week: weekInBlock, label: 'Accumulation' }
  if (weekInBlock <= 6) return { phase: 'intensification', week: weekInBlock, label: 'Intensification' }
  return { phase: 'deload', week: weekInBlock, label: 'Deload' }
}

export function getCurrentBlock(sessionCount) {
  const blockNumber = Math.floor(sessionCount / 28) % 2
  return blockNumber === 0 ? 'block1' : 'block2'
}

export function getDayType(sessionCount) {
  const dayIndex = sessionCount % 4
  const days = ['day1', 'day2', 'day3', 'day4']
  return days[dayIndex]
}

// ─── EXERCISE RESOLUTION ─────────────────────────────────────────────────────
// Resolves which exercise to use based on current block rotation and equipment

export function resolveExercise(baseExerciseId, blockKey, availableEquipment) {
  const rotation = BLOCK_ROTATIONS[blockKey]
  const resolvedId = rotation?.[baseExerciseId] || baseExerciseId
  const exercise = EXERCISES[resolvedId]

  if (!exercise) return EXERCISES[baseExerciseId]

  // Check if equipment is available
  const hasEquipment = exercise.equipment.length === 0 ||
    exercise.equipment.every(eq => availableEquipment.includes(eq))

  if (!hasEquipment) {
    // Fall back to base exercise and check that
    const baseExercise = EXERCISES[baseExerciseId]
    const baseHasEquipment = baseExercise.equipment.length === 0 ||
      baseExercise.equipment.every(eq => availableEquipment.includes(eq))
    if (baseHasEquipment) return baseExercise

    // Find alternative with same pattern
    return findAlternative(exercise.pattern, availableEquipment, baseExerciseId) || exercise
  }

  return exercise
}

function findAlternative(pattern, availableEquipment, excludeId) {
  const alternatives = Object.values(EXERCISES).filter(ex =>
    ex.pattern === pattern &&
    ex.id !== excludeId &&
    (ex.equipment.length === 0 || ex.equipment.every(eq => availableEquipment.includes(eq)))
  )
  return alternatives[0] || null
}

// ─── WORKOUT GENERATION ──────────────────────────────────────────────────────

export function generateWorkout(sessionCount, availableEquipment, allLogs) {
  const dayType = getDayType(sessionCount)
  const phase = getCurrentPhase(sessionCount)
  const blockKey = getCurrentBlock(sessionCount)
  const dayProgramme = PROGRAMME[dayType]

  const exercises = dayProgramme.order.map(slot => {
    const exercise = resolveExercise(slot.exerciseId, blockKey, availableEquipment)
    const targetData = calculateTarget(exercise, phase, allLogs)
    const sets = buildSets(exercise, phase, targetData)

    return {
      id: `${exercise.id}_${Date.now()}_${Math.random()}`,
      exerciseId: exercise.id,
      name: exercise.name,
      muscle: exercise.muscle,
      pattern: exercise.pattern,
      isPrimary: slot.isPrimary,
      supersetWith: slot.supersetWith,
      sets,
      repRange: phase.phase === 'accumulation' ? exercise.rep_range_accumulation : exercise.rep_range_strength,
      targetRIR: phase.phase === 'deload' ? 4 : phase.phase === 'intensification' ? exercise.rir_target_strength : exercise.rir_target_accumulation,
      restSeconds: phase.phase === 'accumulation' ? exercise.rest_accumulation : exercise.rest_strength,
      notes: exercise.notes,
      warnings: [],
      felt: null,
      completed: false,
    }
  })

  // Check for warnings
  const warningsMap = generateWarnings(exercises, allLogs, sessionCount)
  exercises.forEach(ex => {
    ex.warnings = warningsMap[ex.exerciseId] || []
  })

  return {
    dayType,
    dayLabel: dayProgramme.label,
    dayFocus: dayProgramme.focus,
    dayDescription: dayProgramme.description,
    phase: phase.phase,
    phaseLabel: phase.label,
    week: phase.week,
    blockKey,
    sessionCount,
    exercises,
  }
}

// ─── TARGET CALCULATION ──────────────────────────────────────────────────────
// Based on previous performance and RIR data

function calculateTarget(exercise, phase, allLogs) {
  const history = allLogs
    .filter(l => l.exercise_name === exercise.name)
    .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))

  if (history.length === 0) return { weight: null, reps: null, source: 'first_time' }

  const lastLog = history[0]
  let sets = []
  try { sets = typeof lastLog.sets === 'string' ? JSON.parse(lastLog.sets) : lastLog.sets || [] } catch { sets = [] }

  if (sets.length === 0) return { weight: null, reps: null, source: 'no_data' }

  const weights = sets.map(s => parseFloat(s.weight)).filter(w => !isNaN(w) && w > 0)
  const reps = sets.map(s => parseInt(s.reps)).filter(r => !isNaN(r) && r > 0)
  const rirs = sets.map(s => parseInt(s.rir)).filter(r => !isNaN(r))

  if (weights.length === 0) return { weight: null, reps: null, source: 'no_weight' }

  const avgWeight = weights.reduce((a, b) => a + b, 0) / weights.length
  const avgRIR = rirs.length > 0 ? rirs.reduce((a, b) => a + b, 0) / rirs.length : 2
  const avgReps = reps.length > 0 ? reps.reduce((a, b) => a + b, 0) / reps.length : 0

  const targetRIR = phase.phase === 'deload' ? 4 : phase.phase === 'intensification' ? exercise.rir_target_strength : exercise.rir_target_accumulation

  let newWeight = avgWeight

  // RIR-based progression
  if (avgRIR > targetRIR + 1) {
    // More in the tank than needed — increase weight
    newWeight = avgWeight + getIncrement(avgWeight, exercise.isPrimary)
  } else if (avgRIR < targetRIR - 1) {
    // Closer to failure than intended — maintain or slight decrease
    newWeight = avgWeight * 0.975
  }
  // else — right in the zone, maintain weight

  // Deload — reduce to 60% of recent weight
  if (phase.phase === 'deload') {
    newWeight = avgWeight * 0.6
  }

  return {
    weight: Math.round(newWeight * 4) / 4, // round to nearest 0.25
    reps: avgReps,
    lastRIR: avgRIR,
    source: 'calculated',
  }
}

function getIncrement(weight, isPrimary) {
  if (isPrimary) {
    if (weight < 60) return 2.5
    if (weight < 100) return 2.5
    if (weight < 150) return 5
    return 5
  } else {
    if (weight < 30) return 1.25
    if (weight < 60) return 2.5
    return 2.5
  }
}

function buildSets(exercise, phase, targetData) {
  const setCount = exercise.sets_default
  return Array(setCount).fill(null).map((_, i) => ({
    setNumber: i + 1,
    weight: targetData.weight || '',
    reps: '',
    rir: '',
    completed: false,
  }))
}

// ─── WARNINGS ENGINE ─────────────────────────────────────────────────────────

function generateWarnings(exercises, allLogs, sessionCount) {
  const warningsMap = {}

  exercises.forEach(ex => {
    const warnings = []
    const history = allLogs.filter(l => l.exercise_name === ex.name)
      .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))

    // Stalled 3 sessions
    if (history.length >= 3) {
      const last3 = history.slice(0, 3)
      const weights = last3.map(l => {
        try {
          const sets = typeof l.sets === 'string' ? JSON.parse(l.sets) : l.sets || []
          return Math.max(...sets.map(s => parseFloat(s.weight) || 0))
        } catch { return 0 }
      })
      if (weights.length === 3 && weights[0] === weights[1] && weights[1] === weights[2] && weights[0] > 0) {
        warnings.push(WARNINGS.STALLED_THREE_SESSIONS)
      }
    }

    // RIR trending down
    if (history.length >= 3) {
      const last3Rirs = history.slice(0, 3).map(l => {
        try {
          const sets = typeof l.sets === 'string' ? JSON.parse(l.sets) : l.sets || []
          const rirs = sets.map(s => parseInt(s.rir)).filter(r => !isNaN(r))
          return rirs.length > 0 ? rirs.reduce((a, b) => a + b, 0) / rirs.length : null
        } catch { return null }
      }).filter(r => r !== null)

      if (last3Rirs.length === 3 && last3Rirs[0] < last3Rirs[1] && last3Rirs[1] < last3Rirs[2]) {
        warnings.push(WARNINGS.RIR_TRENDING_DOWN)
      }
    }

    if (warnings.length > 0) warningsMap[ex.exerciseId] = warnings
  })

  return warningsMap
}

// ─── FATIGUE ANALYSIS ────────────────────────────────────────────────────────

export function analyzeFatigue(recentSessions) {
  if (!recentSessions || recentSessions.length < 2) return { fatigued: false, deloadRecommended: false, message: null }

  const recent = recentSessions.slice(0, 4)
  const avgFatigue = recent.reduce((a, b) => a + (b.fatigue_level || 3), 0) / recent.length

  if (avgFatigue >= 4.5) {
    return { fatigued: true, deloadRecommended: true, message: WARNINGS.DELOAD_RECOMMENDED }
  }
  if (avgFatigue >= 3.8) {
    return { fatigued: true, deloadRecommended: false, message: WARNINGS.HIGH_FATIGUE_DETECTED }
  }
  return { fatigued: false, deloadRecommended: false, message: null }
}

// ─── SWAP EXERCISE ────────────────────────────────────────────────────────────

export function swapExercise(currentExercise, availableEquipment, currentExerciseIds, allLogs) {
  const pattern = currentExercise.pattern
  const recentNames = allLogs.slice(0, 20).map(l => l.exercise_name)

  const candidates = Object.values(EXERCISES).filter(ex =>
    ex.pattern === pattern &&
    ex.id !== currentExercise.exerciseId &&
    !currentExerciseIds.includes(ex.id) &&
    (ex.equipment.length === 0 || ex.equipment.every(eq => availableEquipment.includes(eq)))
  )

  if (candidates.length === 0) return null

  // Prefer exercises not recently done
  const fresh = candidates.filter(ex => !recentNames.includes(ex.name))
  const chosen = fresh.length > 0 ? fresh[0] : candidates[0]

  return chosen
}

// ─── PROGRESS STATS ──────────────────────────────────────────────────────────

export function getProgressStats(allLogs) {
  const prMap = {}
  const volumeMap = {}

  allLogs.forEach(log => {
    try {
      const sets = typeof log.sets === 'string' ? JSON.parse(log.sets) : log.sets || []
      const maxWeight = Math.max(...sets.map(s => parseFloat(s.weight) || 0))
      const totalVolume = sets.reduce((a, s) => a + (parseFloat(s.weight) || 0) * (parseInt(s.reps) || 0), 0)

      if (!prMap[log.exercise_name] || maxWeight > prMap[log.exercise_name]) {
        prMap[log.exercise_name] = maxWeight
      }
      volumeMap[log.exercise_name] = (volumeMap[log.exercise_name] || 0) + totalVolume
    } catch {}
  })

  return { prMap, volumeMap }
}

export function getWeeklyVolume(sessions, allLogs) {
  const oneWeekAgo = new Date()
  oneWeekAgo.setDate(oneWeekAgo.getDate() - 7)

  const recentSessions = sessions.filter(s => new Date(s.date) > oneWeekAgo)
  const recentSessionIds = recentSessions.map(s => s.id)
  const recentLogs = allLogs.filter(l => recentSessionIds.includes(l.session_id))

  return recentLogs.reduce((acc, log) => {
    try {
      const sets = typeof log.sets === 'string' ? JSON.parse(log.sets) : log.sets || []
      return acc + sets.reduce((a, s) => a + (parseFloat(s.weight) || 0) * (parseInt(s.reps) || 0), 0)
    } catch { return acc }
  }, 0)
}
