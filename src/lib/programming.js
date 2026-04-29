import { EXERCISES, PROGRAMME, BLOCK_ROTATIONS, WARNINGS } from '../data/exercises.js'

// ─── PHASE LOGIC ─────────────────────────────────────────────────
// Each block = 28 sessions (4 days × 7 weeks)
// Accumulation: sessions 0-11 (weeks 1-3)
// Intensification: sessions 12-23 (weeks 4-6)
// Deload: sessions 24-27 (week 7)

export function getCurrentPhase(sessionCount) {
  const posInBlock = sessionCount % 28
  if (posInBlock < 12) return { phase: 'accumulation', week: Math.floor(posInBlock / 4) + 1, label: 'Accumulation' }
  if (posInBlock < 24) return { phase: 'intensification', week: Math.floor((posInBlock - 12) / 4) + 4, label: 'Intensification' }
  return { phase: 'deload', week: 7, label: 'Deload' }
}

export function getCurrentBlock(sessionCount) {
  return Math.floor(sessionCount / 28) % 2 === 0 ? 'block1' : 'block2'
}

export function getDayType(sessionCount) {
  return ['day1', 'day2', 'day3', 'day4'][sessionCount % 4]
}

// Get next day type based on what's missing in current cycle
export function getNextDayType(sessions) {
  if (!sessions || sessions.length === 0) return 'day1'
  const days = ['day1', 'day2', 'day3', 'day4']
  const programmed = sessions.filter(s => days.includes(s.day_type))
  if (programmed.length === 0) return 'day1'

  // Figure out current cycle — group sessions into cycles of 4
  // Count how many complete cycles of all 4 days have been done
  // Then find which days are missing in the current incomplete cycle
  const totalProgrammed = programmed.length
  const completedFullCycles = Math.floor(totalProgrammed / 4)

  // Sessions in current cycle (most recent incomplete cycle)
  const currentCycleSessions = programmed.slice(0, totalProgrammed - (completedFullCycles * 4))
  const doneInCurrentCycle = currentCycleSessions.map(s => s.day_type)

  // Find first missing day in order
  const missing = days.filter(d => !doneInCurrentCycle.includes(d))

  if (missing.length === 0) {
    // All 4 done — start next cycle from day1
    return 'day1'
  }

  // Return the first missing day in order
  return missing[0]
}

export function getBlockNumber(sessionCount) {
  return Math.floor(sessionCount / 28) + 1
}

// ─── WEEK SCHEDULE PREVIEW ───────────────────────────────────────
export function getWeekSchedule(sessionCount) {
  const days = []
  const dayLabels = { day1: 'Upper — Strength', day2: 'Lower — Strength', day3: 'Upper — Volume', day4: 'Lower — Athletic' }
  const dayFocus = { day1: 'Bench & Row', day2: 'Squat', day3: 'OHP & Volume', day4: 'Deadlift & Power' }

  for (let i = 0; i < 4; i++) {
    const futureCount = sessionCount + i
    const dayType = getDayType(futureCount)
    const phase = getCurrentPhase(futureCount)
    days.push({
      sessionOffset: i,
      dayType,
      label: dayLabels[dayType],
      focus: dayFocus[dayType],
      phase: phase.phase,
      week: phase.week,
      isNext: i === 0,
    })
  }
  return days
}

// ─── READINESS ADJUSTMENT ────────────────────────────────────────
export function getReadinessMultiplier(sleep, stress, physical) {
  const sleepScore = { poor: 0, ok: 1, good: 2 }[sleep] ?? 1
  const stressScore = { high: 0, medium: 1, low: 2 }[stress] ?? 1
  const physicalScore = { beatup: 0, normal: 1, fresh: 2 }[physical] ?? 1
  const total = sleepScore + stressScore + physicalScore
  if (total <= 1) return { multiplier: 0.9, label: 'Rough day — weights scaled back 10%', color: '#f87171' }
  if (total <= 3) return { multiplier: 0.95, label: 'Slightly off — minor adjustment', color: '#facc15' }
  if (total >= 5) return { multiplier: 1.05, label: 'Feeling great — slight bump up', color: '#4ade80' }
  return { multiplier: 1.0, label: 'Normal day — standard weights', color: '#888' }
}

// ─── WARM-UP CALCULATOR ──────────────────────────────────────────
export function getWarmupSets(workingWeight) {
  if (!workingWeight || workingWeight <= 0) return []
  const w = parseFloat(workingWeight)
  if (isNaN(w)) return []
  const sets = []
  if (w >= 60) sets.push({ weight: Math.round(w * 0.3), reps: 10, label: 'Warm-up 1' })
  if (w >= 80) sets.push({ weight: Math.round(w * 0.5), reps: 5, label: 'Warm-up 2' })
  if (w >= 100) sets.push({ weight: Math.round(w * 0.7), reps: 3, label: 'Warm-up 3' })
  if (w >= 120) sets.push({ weight: Math.round(w * 0.85), reps: 1, label: 'Activation' })
  return sets
}

// ─── EXERCISE RESOLUTION ─────────────────────────────────────────
export function resolveExercise(baseExerciseId, blockKey, availableEquipment, usedExercises = [], slot = null) {
  const rotation = BLOCK_ROTATIONS[blockKey]
  const resolvedId = rotation?.[baseExerciseId] || baseExerciseId

  const baseExercise = EXERCISES[baseExerciseId]
  const rotatedExercise = EXERCISES[resolvedId]
  const preferredExercise = rotatedExercise || baseExercise
  if (!preferredExercise) return null

  const usedExerciseIds = usedExercises.map(ex => ex.id)

  // 1) Prefer rotated exercise if available and unused
  if (exerciseIsUsable(rotatedExercise, availableEquipment, usedExerciseIds)) {
    return rotatedExercise
  }

  // 2) Fall back to base exercise if available and unused
  if (exerciseIsUsable(baseExercise, availableEquipment, usedExerciseIds)) {
    return baseExercise
  }

  // 3) Smart substitute: same pattern, but ranked intelligently
  const substitute = findSmartAlternative({
    targetExercise: preferredExercise,
    availableEquipment,
    usedExercises,
    slot,
    excludeIds: [baseExerciseId, resolvedId, ...usedExerciseIds],
  })

  return substitute || null
}

function exerciseIsUsable(exercise, availableEquipment, usedExerciseIds = []) {
  if (!exercise) return false
  const hasEquipment =
    exercise.equipment.length === 0 ||
    exercise.equipment.every(eq => availableEquipment.includes(eq))
  return hasEquipment && !usedExerciseIds.includes(exercise.id)
}

function findSmartAlternative({ targetExercise, availableEquipment, usedExercises = [], slot = null, excludeIds = [] }) {
  const candidates = Object.values(EXERCISES).filter(ex =>
    ex.pattern === targetExercise.pattern &&
    !excludeIds.includes(ex.id) &&
    (ex.equipment.length === 0 || ex.equipment.every(eq => availableEquipment.includes(eq)))
  )

  if (candidates.length === 0) return null

  const usedPatterns = usedExercises.map(ex => ex.pattern)
  const usedBarbell = usedExercises.some(ex => ex.equipment?.includes('barbell'))
  const usedPrimarySamePattern = usedExercises.some(ex => ex.pattern === targetExercise.pattern && ex.is_primary)
  const targetWantsPrimary = slot?.isPrimary ?? targetExercise.is_primary ?? false

  const scored = candidates.map(ex => {
    let score = 0

    // ── QUALITY SCORE (dominant factor — evidence-based exercise ranking) ──
    // Scale 1-10, multiplied by 5 so quality contributes up to 50 points
    // Best evidence-based exercise always wins over a worse one
    score += (ex.quality_score ?? 5) * 5

    // Strong preference: same muscle
    if (ex.muscle === targetExercise.muscle) score += 40

    // Match primary / accessory intent of the slot
    if ((ex.is_primary ?? false) === targetWantsPrimary) score += 18

    // Tier as tiebreaker only — quality score is dominant
    if (ex.tier === targetExercise.tier) score += 8
    else if (Math.abs((ex.tier ?? 99) - (targetExercise.tier ?? 99)) === 1) score += 4

    // ── DUPLICATE PREVENTION (untouched) ──
    // Prefer exercises that keep the day varied instead of piling on fatigue
    if (usedPatterns.includes(ex.pattern)) score -= 6

    // If we've already used a primary of this pattern, penalize another primary hard
    if (usedPrimarySamePattern && ex.is_primary) score -= 30

    // If the workout already includes barbell work, slightly penalize extra barbell substitutes
    if (usedBarbell && ex.equipment?.includes('barbell')) score -= 14

    // Slight preference for non-machine replacements when machines are unavailable
    if (targetExercise.equipment?.includes('machines') && !ex.equipment?.includes('machines')) score += 6

    // Prefer lower-fatigue accessory-ish options when replacing a non-primary slot
    if (!targetWantsPrimary && !(ex.is_primary ?? false)) score += 10

    return { ex, score }
  })

  scored.sort((a, b) => b.score - a.score)
  return scored[0]?.ex || null
}

// ─── WORKOUT GENERATION ──────────────────────────────────────────
export function generateWorkout(sessionCount, dayType, availableEquipment, allLogs, readiness = null) {
  const phase = getCurrentPhase(sessionCount)
  const blockKey = getCurrentBlock(sessionCount)
  const dayProgramme = PROGRAMME[dayType]
  const readinessData = readiness ? getReadinessMultiplier(readiness.sleep, readiness.stress, readiness.physical) : null

  const usedExercises = []

  // Apply A/B/C priority filtering based on readiness
  const readinessMultiplier = readinessData?.multiplier || 1.0
  const filteredOrder = dayProgramme.order.filter(slot => {
    const priority = slot.priority || 'B'
    if (readinessMultiplier <= 0.90) return priority !== 'C' // rough — drop C
    if (readinessMultiplier <= 0.95) return true // slightly off — keep all but reduce C sets
    return true // normal/great — full session
  })

  const exercises = filteredOrder.map(slot => {
    const exercise = resolveExercise(slot.exerciseId, blockKey, availableEquipment, usedExercises, slot)
    if (!exercise) return null

    usedExercises.push(exercise)

    // On slightly off days reduce C slot sets by 1
    const setsReduction = (readinessMultiplier <= 0.95 && readinessMultiplier > 0.90 && slot.priority === 'C') ? 1 : 0

    const targetData = calculateTarget(exercise, phase, allLogs, readinessMultiplier)
    const sets = buildSets(exercise, phase, targetData, setsReduction)

    return {
      id: `${exercise.id}_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
      exerciseId: exercise.id,
      name: exercise.name,
      muscle: exercise.muscle,
      pattern: exercise.pattern,
      isPrimary: slot.isPrimary,
      priority: slot.priority || 'B',
      sets,
      repRange: phase.phase === 'accumulation'
        ? exercise.rep_range_accumulation
        : phase.phase === 'deload'
          ? exercise.rep_range_accumulation
          : exercise.rep_range_strength,
      targetRIR: phase.phase === 'deload'
        ? 4
        : phase.phase === 'intensification'
          ? exercise.rir_target_strength
          : exercise.rir_target_accumulation,
      restSeconds: phase.phase === 'accumulation' ? exercise.rest_accumulation : exercise.rest_strength,
      notes: exercise.notes,
      warnings: [],
      completed: false,
      swapHistory: [],
    }
  }).filter(Boolean)

  // Generate warnings
  const warningsMap = generateWarnings(exercises, allLogs, dayType)
  exercises.forEach(ex => { ex.warnings = warningsMap[ex.exerciseId] || [] })

  // Warmup sets for primary lifts
  exercises.forEach(ex => {
    if (ex.isPrimary && ex.sets[0]?.weight) {
      ex.warmupSets = getWarmupSets(ex.sets[0].weight)
    }
  })

  return {
    dayType, dayLabel: dayProgramme.label, dayFocus: dayProgramme.focus,
    dayDescription: dayProgramme.description, dayColor: dayProgramme.color,
    phase: phase.phase, phaseLabel: phase.label, week: phase.week,
    blockKey, blockNumber: getBlockNumber(sessionCount), sessionCount,
    readinessAdjustment: readinessData,
    exercises,
  }
}

// ─── TARGET CALCULATION ──────────────────────────────────────────
function calculateTarget(exercise, phase, allLogs, readinessMultiplier = 1.0) {
  const history = allLogs
    .filter(l => l.exercise_name === exercise.name)
    .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))

  if (history.length === 0) return { weight: null, reps: null, source: 'first_time' }

  const lastLog = history[0]
  let sets = []
  try { sets = typeof lastLog.sets === 'string' ? JSON.parse(lastLog.sets) : lastLog.sets || [] } catch { sets = [] }
  if (sets.length === 0) return { weight: null, reps: null, source: 'no_data' }

  const weights = sets.map(s => parseFloat(s.weight)).filter(w => !isNaN(w) && w > 0)
  const rirs = sets.map(s => parseInt(s.rir)).filter(r => !isNaN(r))
  if (weights.length === 0) return { weight: null, reps: null, source: 'no_weight' }

  // Use top weight from last session not average — avoids warmup sets pulling it down
  const topWeight = Math.max(...weights)
  const topSetRIR = sets.find(s => parseFloat(s.weight) === topWeight)
  const avgRIR = rirs.length > 0 ? rirs.reduce((a, b) => a + b, 0) / rirs.length : 2
  const topRIR = topSetRIR?.rir !== '' && topSetRIR?.rir !== undefined ? parseInt(topSetRIR.rir) : avgRIR
  const targetRIR = phase.phase === 'deload' ? 4 : phase.phase === 'intensification' ? exercise.rir_target_strength : exercise.rir_target_accumulation

  let newWeight = topWeight
  if (phase.phase === 'deload') {
    newWeight = topWeight * 0.6
  } else if (topRIR > targetRIR + 1) {
    // Had more in the tank — increase weight
    newWeight = topWeight + getIncrement(topWeight, exercise.is_primary)
  } else if (topRIR < targetRIR - 1) {
    // Was too hard — slight reduction
    newWeight = topWeight * 0.975
  }
  // else topRIR is on target — keep same weight

  newWeight = Math.round(newWeight * readinessMultiplier * 4) / 4
  return { weight: newWeight, reps: null, lastRIR: avgRIR, source: 'calculated' }
}

function getIncrement(weight, isPrimary) {
  if (isPrimary) { return weight < 100 ? 2.5 : 5 }
  return weight < 60 ? 1.25 : 2.5
}

function buildSets(exercise, phase, targetData, setsReduction = 0) {
  const totalSets = Math.max(1, exercise.sets_default - setsReduction)
  return Array(totalSets).fill(null).map((_, i) => ({
    setNumber: i + 1, weight: targetData.weight || '', reps: '', rir: '', completed: false,
  }))
}

// ─── WARNINGS ENGINE ─────────────────────────────────────────────
function generateWarnings(exercises, allLogs, dayType) {
  const warningsMap = {}
  exercises.forEach(ex => {
    const warnings = []
    const history = allLogs.filter(l => l.exercise_name === ex.name)
      .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))

    if (history.length >= 3) {
      const last3Weights = history.slice(0, 3).map(l => {
        try {
          const sets = typeof l.sets === 'string' ? JSON.parse(l.sets) : l.sets || []
          return Math.max(...sets.map(s => parseFloat(s.weight) || 0))
        } catch { return 0 }
      })
      if (last3Weights[0] > 0 && last3Weights[0] === last3Weights[1] && last3Weights[1] === last3Weights[2]) {
        warnings.push(WARNINGS.STALLED_THREE)
      }

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

// ─── CONSECUTIVE DAY WARNING ─────────────────────────────────────
export function checkConsecutiveDays(selectedDayType, recentSessions) {
  if (!recentSessions || recentSessions.length === 0) return null
  const last = recentSessions[0]
  const hoursSinceLast = (new Date() - new Date(last.date)) / 3600000
  if (hoursSinceLast > 36) return null

  const isLower = (d) => d === 'day2' || d === 'day4'
  const isUpper = (d) => d === 'day1' || d === 'day3'

  if (isLower(selectedDayType) && isLower(last.day_type)) return WARNINGS.CONSECUTIVE_LOWER
  if (isUpper(selectedDayType) && isUpper(last.day_type)) return WARNINGS.CONSECUTIVE_UPPER
  return null
}

// ─── SWAP EXERCISE ────────────────────────────────────────────────
export function swapExercise(currentExercise, availableEquipment, currentExerciseIds, allLogs) {
  const recentNames = allLogs.slice(0, 20).map(l => l.exercise_name)
  const candidates = Object.values(EXERCISES).filter(ex =>
    ex.pattern === currentExercise.pattern &&
    ex.id !== currentExercise.exerciseId &&
    !currentExerciseIds.includes(ex.id) &&
    (ex.equipment.length === 0 || ex.equipment.every(eq => availableEquipment.includes(eq)))
  )
  if (candidates.length === 0) return null

  // Sort by quality score descending — best evidence-based exercise first
  // Prefer exercises not recently done, but quality score wins
  const scored = candidates.map(ex => {
    let score = (ex.quality_score ?? 5) * 5
    if (recentNames.includes(ex.name)) score -= 10
    return { ex, score }
  })
  scored.sort((a, b) => b.score - a.score)
  return scored[0].ex
}

// ─── FATIGUE ANALYSIS ────────────────────────────────────────────
export function analyzeFatigue(recentSessions) {
  if (!recentSessions || recentSessions.length < 2) return { fatigued: false, deloadRecommended: false, message: null }
  const recent = recentSessions.slice(0, 4)
  const avgFatigue = recent.reduce((a, b) => a + (b.fatigue_level || 3), 0) / recent.length
  if (avgFatigue >= 4.5) return { fatigued: true, deloadRecommended: true, message: WARNINGS.DELOAD_RECOMMENDED }
  if (avgFatigue >= 3.8) return { fatigued: true, deloadRecommended: false, message: WARNINGS.HIGH_FATIGUE }
  return { fatigued: false, deloadRecommended: false, message: null }
}

// ─── PROGRESS STATS ──────────────────────────────────────────────
export function getProgressStats(allLogs) {
  const prMap = {}
  const prContext = {}

  allLogs.forEach(log => {
    try {
      const sets = typeof log.sets === 'string' ? JSON.parse(log.sets) : log.sets || []
      // Find the best set — highest weight, and reps from THAT same set
      const bestSet = sets.reduce((best, s) => {
        const w = parseFloat(s.weight) || 0
        return w > (parseFloat(best?.weight) || 0) ? s : best
      }, sets[0])
      const maxWeight = parseFloat(bestSet?.weight) || 0
      const prReps = parseInt(bestSet?.reps) || 0

      if (!prMap[log.exercise_name] || maxWeight > prMap[log.exercise_name]) {
        prMap[log.exercise_name] = maxWeight
        prContext[log.exercise_name] = {
          weight: maxWeight,
          reps: prReps,
          date: log.created_at,
          sessionId: log.session_id,
          phase: log.phase,
          blockKey: log.block_key,
        }
      }
    } catch {}
  })
  return { prMap, prContext }
}

export function getWeeklyVolume(sessions, allLogs) {
  const oneWeekAgo = new Date()
  oneWeekAgo.setDate(oneWeekAgo.getDate() - 7)
  const recentIds = sessions.filter(s => new Date(s.date) > oneWeekAgo).map(s => s.id)
  return allLogs.filter(l => recentIds.includes(l.session_id)).reduce((acc, log) => {
    try {
      const sets = typeof log.sets === 'string' ? JSON.parse(log.sets) : log.sets || []
      return acc + sets.reduce((a, s) => a + (parseFloat(s.weight) || 0) * (parseInt(s.reps) || 0), 0)
    } catch { return acc }
  }, 0)
}

// ─── BLOCK COMPLETION SUMMARY ────────────────────────────────────
export function getBlockSummary(sessions, allLogs, blockKey) {
  const blockSessions = sessions.filter(s => s.block_key === blockKey)
  if (blockSessions.length === 0) return null

  const blockIds = blockSessions.map(s => s.id)
  const blockLogs = allLogs.filter(l => blockIds.includes(l.session_id))

  const primaryExercises = ['Flat Barbell Bench Press', 'Barbell Bent-Over Row', 'Barbell Overhead Press', 'Barbell Back Squat', 'Conventional Deadlift']
  const progressMap = {}

  primaryExercises.forEach(name => {
    const logs = blockLogs.filter(l => l.exercise_name === name)
      .sort((a, b) => new Date(a.created_at) - new Date(b.created_at))

    if (logs.length >= 2) {
      const firstSets = (() => { try { return typeof logs[0].sets === 'string' ? JSON.parse(logs[0].sets) : logs[0].sets || [] } catch { return [] } })()
      const lastSets = (() => { try { return typeof logs[logs.length - 1].sets === 'string' ? JSON.parse(logs[logs.length - 1].sets) : logs[logs.length - 1].sets || [] } catch { return [] } })()
      const firstMax = Math.max(...firstSets.map(s => parseFloat(s.weight) || 0))
      const lastMax = Math.max(...lastSets.map(s => parseFloat(s.weight) || 0))
      if (firstMax > 0) {
        progressMap[name] = { start: firstMax, end: lastMax, gain: lastMax - firstMax, sessions: logs.length }
      }
    }
  })

  const avgFatigue = blockSessions.reduce((a, b) => a + (b.fatigue_level || 3), 0) / blockSessions.length

  return { blockKey, sessions: blockSessions.length, progressMap, avgFatigue }
}