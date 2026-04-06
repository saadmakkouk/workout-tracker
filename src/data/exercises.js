export const EXERCISE_LIBRARY = {
  // CHEST
  chest: {
    compound: [
      { name: "Barbell Bench Press", equipment: ["barbell", "bench"], movement: "horizontal_push" },
      { name: "Incline Barbell Bench Press", equipment: ["barbell", "bench"], movement: "incline_push" },
      { name: "Dumbbell Bench Press", equipment: ["dumbbells", "bench"], movement: "horizontal_push" },
      { name: "Incline Dumbbell Press", equipment: ["dumbbells", "bench"], movement: "incline_push" },
      { name: "Machine Chest Press", equipment: ["machines"], movement: "horizontal_push" },
      { name: "Push-Ups", equipment: [], movement: "horizontal_push" },
      { name: "Cable Chest Press", equipment: ["cables"], movement: "horizontal_push" },
      { name: "Dips (Chest Focused)", equipment: ["dip_bar"], movement: "dip" },
    ],
    isolation: [
      { name: "Cable Fly", equipment: ["cables"], movement: "fly" },
      { name: "Dumbbell Fly", equipment: ["dumbbells", "bench"], movement: "fly" },
      { name: "Pec Deck", equipment: ["machines"], movement: "fly" },
      { name: "Incline Cable Fly", equipment: ["cables"], movement: "fly" },
    ]
  },

  // BACK
  back: {
    compound: [
      { name: "Barbell Bent-Over Row", equipment: ["barbell"], movement: "horizontal_pull" },
      { name: "Deadlift", equipment: ["barbell"], movement: "hinge" },
      { name: "Pull-Up", equipment: ["pull_up_bar"], movement: "vertical_pull" },
      { name: "Lat Pulldown", equipment: ["cables"], movement: "vertical_pull" },
      { name: "Seated Cable Row", equipment: ["cables"], movement: "horizontal_pull" },
      { name: "Dumbbell Row", equipment: ["dumbbells", "bench"], movement: "horizontal_pull" },
      { name: "T-Bar Row", equipment: ["barbell"], movement: "horizontal_pull" },
      { name: "Machine Row", equipment: ["machines"], movement: "horizontal_pull" },
      { name: "Chest-Supported Row", equipment: ["dumbbells", "bench"], movement: "horizontal_pull" },
    ],
    isolation: [
      { name: "Straight-Arm Pulldown", equipment: ["cables"], movement: "pulldown" },
      { name: "Face Pull", equipment: ["cables"], movement: "rear_delt" },
      { name: "Dumbbell Pullover", equipment: ["dumbbells", "bench"], movement: "pullover" },
      { name: "Rear Delt Fly", equipment: ["dumbbells"], movement: "rear_delt" },
    ]
  },

  // SHOULDERS
  shoulders: {
    compound: [
      { name: "Barbell Overhead Press", equipment: ["barbell"], movement: "vertical_push" },
      { name: "Dumbbell Shoulder Press", equipment: ["dumbbells"], movement: "vertical_push" },
      { name: "Machine Shoulder Press", equipment: ["machines"], movement: "vertical_push" },
      { name: "Arnold Press", equipment: ["dumbbells"], movement: "vertical_push" },
      { name: "Push Press", equipment: ["barbell"], movement: "vertical_push" },
    ],
    isolation: [
      { name: "Dumbbell Lateral Raise", equipment: ["dumbbells"], movement: "lateral" },
      { name: "Cable Lateral Raise", equipment: ["cables"], movement: "lateral" },
      { name: "Machine Lateral Raise", equipment: ["machines"], movement: "lateral" },
      { name: "Front Raise", equipment: ["dumbbells"], movement: "front" },
      { name: "Rear Delt Machine Fly", equipment: ["machines"], movement: "rear_delt" },
      { name: "Face Pull", equipment: ["cables"], movement: "rear_delt" },
    ]
  },

  // ARMS
  biceps: {
    compound: [
      { name: "Barbell Curl", equipment: ["barbell"], movement: "curl" },
      { name: "EZ-Bar Curl", equipment: ["barbell"], movement: "curl" },
      { name: "Dumbbell Curl", equipment: ["dumbbells"], movement: "curl" },
    ],
    isolation: [
      { name: "Incline Dumbbell Curl", equipment: ["dumbbells", "bench"], movement: "curl" },
      { name: "Hammer Curl", equipment: ["dumbbells"], movement: "curl" },
      { name: "Cable Curl", equipment: ["cables"], movement: "curl" },
      { name: "Concentration Curl", equipment: ["dumbbells"], movement: "curl" },
      { name: "Machine Curl", equipment: ["machines"], movement: "curl" },
      { name: "Preacher Curl", equipment: ["barbell"], movement: "curl" },
    ]
  },

  triceps: {
    compound: [
      { name: "Close-Grip Bench Press", equipment: ["barbell", "bench"], movement: "press" },
      { name: "Dips (Tricep Focused)", equipment: ["dip_bar"], movement: "dip" },
    ],
    isolation: [
      { name: "Tricep Pushdown", equipment: ["cables"], movement: "pushdown" },
      { name: "Overhead Tricep Extension", equipment: ["cables"], movement: "extension" },
      { name: "Skull Crushers", equipment: ["barbell", "bench"], movement: "extension" },
      { name: "Dumbbell Kickback", equipment: ["dumbbells"], movement: "kickback" },
      { name: "Machine Tricep Extension", equipment: ["machines"], movement: "extension" },
    ]
  },

  // LEGS
  quads: {
    compound: [
      { name: "Barbell Back Squat", equipment: ["barbell"], movement: "squat" },
      { name: "Barbell Front Squat", equipment: ["barbell"], movement: "squat" },
      { name: "Leg Press", equipment: ["machines"], movement: "squat" },
      { name: "Hack Squat", equipment: ["machines"], movement: "squat" },
      { name: "Bulgarian Split Squat", equipment: ["dumbbells", "bench"], movement: "lunge" },
      { name: "Dumbbell Goblet Squat", equipment: ["dumbbells"], movement: "squat" },
      { name: "Walking Lunges", equipment: ["dumbbells"], movement: "lunge" },
    ],
    isolation: [
      { name: "Leg Extension", equipment: ["machines"], movement: "extension" },
      { name: "Sissy Squat", equipment: [], movement: "squat" },
    ]
  },

  hamstrings: {
    compound: [
      { name: "Romanian Deadlift", equipment: ["barbell"], movement: "hinge" },
      { name: "Stiff-Leg Deadlift", equipment: ["barbell"], movement: "hinge" },
      { name: "Dumbbell RDL", equipment: ["dumbbells"], movement: "hinge" },
      { name: "Good Morning", equipment: ["barbell"], movement: "hinge" },
    ],
    isolation: [
      { name: "Lying Leg Curl", equipment: ["machines"], movement: "curl" },
      { name: "Seated Leg Curl", equipment: ["machines"], movement: "curl" },
      { name: "Nordic Curl", equipment: [], movement: "curl" },
    ]
  },

  glutes: {
    compound: [
      { name: "Hip Thrust", equipment: ["barbell", "bench"], movement: "thrust" },
      { name: "Cable Pull-Through", equipment: ["cables"], movement: "hinge" },
      { name: "Sumo Deadlift", equipment: ["barbell"], movement: "hinge" },
    ],
    isolation: [
      { name: "Cable Kickback", equipment: ["cables"], movement: "kickback" },
      { name: "Abductor Machine", equipment: ["machines"], movement: "abduction" },
    ]
  },

  calves: {
    compound: [],
    isolation: [
      { name: "Standing Calf Raise", equipment: ["machines", "barbell"], movement: "raise" },
      { name: "Seated Calf Raise", equipment: ["machines"], movement: "raise" },
      { name: "Leg Press Calf Raise", equipment: ["machines"], movement: "raise" },
      { name: "Dumbbell Calf Raise", equipment: ["dumbbells"], movement: "raise" },
    ]
  },

  // CORE
  core: {
    compound: [],
    isolation: [
      { name: "Cable Crunch", equipment: ["cables"], movement: "crunch" },
      { name: "Hanging Leg Raise", equipment: ["pull_up_bar"], movement: "raise" },
      { name: "Ab Wheel Rollout", equipment: [], movement: "rollout" },
      { name: "Plank", equipment: [], movement: "plank" },
      { name: "Decline Sit-Up", equipment: ["bench"], movement: "crunch" },
    ]
  }
}

// WORKOUT SPLIT TEMPLATES
export const WORKOUT_SPLITS = {
  upper_heavy: {
    label: "Upper — Heavy",
    dayType: "upper_heavy",
    focus: ["chest", "back", "shoulders"],
    structure: [
      { muscle: "back", type: "compound", sets: 4, repRange: "4-6", rest: 120, label: "Back — Primary Compound" },
      { muscle: "chest", type: "compound", sets: 4, repRange: "4-6", rest: 120, label: "Chest — Primary Compound" },
      { muscle: "shoulders", type: "compound", sets: 3, repRange: "6-8", rest: 90, label: "Shoulders — Compound" },
      { muscle: "back", type: "isolation", sets: 3, repRange: "8-10", rest: 75, label: "Back — Detail" },
      { muscle: "biceps", type: "compound", sets: 3, repRange: "6-8", rest: 75, label: "Biceps" },
      { muscle: "triceps", type: "compound", sets: 3, repRange: "6-8", rest: 75, label: "Triceps" },
    ]
  },
  lower_heavy: {
    label: "Lower — Heavy",
    dayType: "lower_heavy",
    focus: ["quads", "hamstrings", "glutes"],
    structure: [
      { muscle: "quads", type: "compound", sets: 4, repRange: "4-6", rest: 180, label: "Squat Pattern — Primary" },
      { muscle: "hamstrings", type: "compound", sets: 3, repRange: "6-8", rest: 120, label: "Hinge Pattern" },
      { muscle: "quads", type: "compound", sets: 3, repRange: "8-10", rest: 90, label: "Quad — Secondary" },
      { muscle: "hamstrings", type: "isolation", sets: 3, repRange: "10-12", rest: 75, label: "Hamstring — Isolation" },
      { muscle: "glutes", type: "isolation", sets: 2, repRange: "12-15", rest: 60, label: "Glutes" },
      { muscle: "calves", type: "isolation", sets: 4, repRange: "12-15", rest: 60, label: "Calves" },
    ]
  },
  upper_hypertrophy: {
    label: "Upper — Volume",
    dayType: "upper_hypertrophy",
    focus: ["chest", "back", "shoulders", "arms"],
    structure: [
      { muscle: "chest", type: "compound", sets: 3, repRange: "10-12", rest: 75, label: "Chest — Compound" },
      { muscle: "back", type: "compound", sets: 3, repRange: "10-12", rest: 75, label: "Back — Compound" },
      { muscle: "shoulders", type: "isolation", sets: 3, repRange: "12-15", rest: 60, label: "Lateral Delts" },
      { muscle: "chest", type: "isolation", sets: 3, repRange: "12-15", rest: 60, label: "Chest — Isolation" },
      { muscle: "biceps", type: "isolation", sets: 3, repRange: "12-15", rest: 60, label: "Biceps" },
      { muscle: "triceps", type: "isolation", sets: 3, repRange: "12-15", rest: 60, label: "Triceps" },
      { muscle: "shoulders", type: "isolation", sets: 2, repRange: "15-20", rest: 45, label: "Rear Delts" },
    ]
  },
  athletic: {
    label: "Athletic & Power",
    dayType: "athletic",
    focus: ["full_body", "power", "explosiveness"],
    structure: [
      { muscle: "quads", type: "compound", sets: 4, repRange: "3-5", rest: 150, label: "Power — Lower" },
      { muscle: "back", type: "compound", sets: 4, repRange: "3-5", rest: 150, label: "Power — Upper Pull" },
      { muscle: "chest", type: "compound", sets: 3, repRange: "5-6", rest: 120, label: "Explosive — Press" },
      { muscle: "hamstrings", type: "compound", sets: 3, repRange: "6-8", rest: 90, label: "Posterior Chain" },
      { muscle: "shoulders", type: "compound", sets: 3, repRange: "5-6", rest: 90, label: "Overhead Power" },
      { muscle: "core", type: "isolation", sets: 3, repRange: "10-15", rest: 60, label: "Core — Stability" },
    ]
  }
}

export const WEEK_ROTATION = ["upper_heavy", "lower_heavy", "upper_hypertrophy", "athletic"]

export const EQUIPMENT_OPTIONS = [
  { id: "barbell", label: "Barbell", icon: "🏋️" },
  { id: "dumbbells", label: "Dumbbells", icon: "💪" },
  { id: "cables", label: "Cables", icon: "🔗" },
  { id: "machines", label: "Machines", icon: "⚙️" },
  { id: "bench", label: "Bench", icon: "🛋️" },
  { id: "pull_up_bar", label: "Pull-Up Bar", icon: "🔝" },
  { id: "dip_bar", label: "Dip Bar", icon: "⬆️" },
]

export const GYM_PRESETS = [
  { id: "full", label: "Full Gym", equipment: ["barbell", "dumbbells", "cables", "machines", "bench", "pull_up_bar", "dip_bar"] },
  { id: "apartment", label: "Apartment Gym", equipment: ["dumbbells", "cables", "machines", "bench", "pull_up_bar"] },
  { id: "dumbbells_only", label: "Dumbbells Only", equipment: ["dumbbells", "bench"] },
  { id: "bodyweight", label: "Bodyweight", equipment: ["pull_up_bar", "dip_bar"] },
]
