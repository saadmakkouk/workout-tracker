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

  // 3) Smart substitute
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

function isCorePattern(pattern) {
  return typeof pattern === 'string' && pattern.startsWith('core_')
}

function findSmartAlternative({ targetExercise, availableEquipment, usedExercises = [], slot = null, excludeIds = [] }) {
  const targetIsCore = isCorePattern(targetExercise.pattern)

  const candidates = Object.values(EXERCISES).filter(ex => {
    const samePattern = ex.pattern === targetExercise.pattern
    const sameCoreFamily = targetIsCore && isCorePattern(ex.pattern)

    return (
      (samePattern || sameCoreFamily) &&
      !excludeIds.includes(ex.id) &&
      (ex.equipment.length === 0 || ex.equipment.every(eq => availableEquipment.includes(eq)))
    )
  })

  if (candidates.length === 0) return null

  const usedPatterns = usedExercises.map(ex => ex.pattern)
  const usedBarbell = usedExercises.some(ex => ex.equipment?.includes('barbell'))
  const usedPrimarySamePattern = usedExercises.some(ex =>
    ex.pattern === targetExercise.pattern && ex.is_primary
  )
  const targetWantsPrimary = slot?.isPrimary ?? targetExercise.is_primary ?? false

  const scored = candidates.map(ex => {
    let score = 0

    // Strong preference: same exact muscle
    if (ex.muscle === targetExercise.muscle) score += 40

    // Strong preference: same exact pattern
    if (ex.pattern === targetExercise.pattern) score += 35
    else if (targetIsCore && isCorePattern(ex.pattern)) score += 20

    // Similar training role / difficulty
    if (ex.tier === targetExercise.tier) score += 20
    else if (Math.abs((ex.tier ?? 99) - (targetExercise.tier ?? 99)) === 1) score += 10

    // Match primary / accessory intent of the slot
    if ((ex.is_primary ?? false) === targetWantsPrimary) score += 18

    // Avoid overloading same pattern / fatigue
    if (usedPatterns.includes(ex.pattern)) score -= 6

    // If already used a primary of this pattern, penalize another primary
    if (usedPrimarySamePattern && ex.is_primary) score -= 30

    // If session already has barbell work, slightly penalize extra barbell substitutions
    if (usedBarbell && ex.equipment?.includes('barbell')) score -= 14

    // Slight preference for non-machine replacement when target was a machine movement
    if (targetExercise.equipment?.includes('machines') && !ex.equipment?.includes('machines')) score += 6

    // Slight preference for accessory-ish replacements if the slot is non-primary
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

  const exercises = dayProgramme.order.map(slot => {
    const exercise = resolveExercise(slot.exerciseId, blockKey, availableEquipment, usedExercises, slot)
    if (!exercise) return null

    usedExercises.push(exercise)

    const targetData = calculateTarget(exercise, phase, allLogs, readinessData?.multiplier || 1.0)
    const sets = buildSets(exercise, phase, targetData)

    return {
      id: `${exercise.id}_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
      exerciseId: exercise.id,
      name: exercise.name,
      muscle: exercise.muscle,
      pattern: exercise.pattern,
      isPrimary: slot.isPrimary,
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