# 1-Minute Tier (Quick)
Recipe.create(
    tier: '1min',
    title: 'The Soldering Iron',
    base_duration_sec: 60,
    steps_json: JSON.generate([
        { time: 10, text: "Splash face with cold water." },
        { time: 20, text: "Wash behind ears." },
        { time: 20, text: "Quick rinse." },
        { time: 10, text: "Towel off." }
    ])
)

# 2-Minute Tier (Standard)
Recipe.create(
    tier: '2min',
    title: 'The Algorithm',
    base_duration_sec: 120,
    steps_json: JSON.generate([
        { time: 20, text: "Soak hair." },
        { time: 40, text: "Shampoo thoroughly." },
        { time: 30, text: "Body wash speed run." },
        { time: 30, text: "Rinse all." }
    ])
)

# 3-Minute Tier (Thinking)
Recipe.create(
    tier: '3min',
    title: 'Deep Thought',
    base_duration_sec: 180,
    steps_json: JSON.generate([
        { time: 30, text: "Warm up in shower stream." },
        { time: 60, text: "Contemplate existence while shampooing." },
        { time: 60, text: "Solve coding bug." },
        { time: 30, text: "Cool down rinse." }
    ])
)

puts "Seeded #{Recipe.count} recipes."
