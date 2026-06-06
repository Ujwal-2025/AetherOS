export const config = { runtime: 'edge' }

const SYSTEM_PROMPT = `You are AetherOS, a Solo Leveling-inspired productivity system.
The user will give you a goal and a target date. You must build a structured quest plan.

Return ONLY valid JSON — no markdown, no explanation, no code fences.

Schema:
{
  "goalId": string (slug like "learn-guitar-sep-2026"),
  "goalTitle": string (short, 3-5 words, e.g. "Learn Guitar by September"),
  "dailyHabit": {
    "title": string (max 8 words, action-oriented),
    "category": "health" | "work" | "learning" | "personal",
    "priority": "low" | "medium" | "high" | "critical",
    "estimatedMinutes": number (10-60)
  },
  "milestones": [
    {
      "title": string (max 8 words),
      "category": "health" | "work" | "learning" | "personal",
      "priority": "high" | "critical",
      "estimatedMinutes": number,
      "weekOffset": number (weeks from now when this milestone is due, e.g. 4, 8, 12)
    }
  ],
  "thisWeek": [
    {
      "title": string (max 8 words, specific and immediately actionable),
      "category": "health" | "work" | "learning" | "personal",
      "priority": "low" | "medium" | "high" | "critical",
      "estimatedMinutes": number
    }
  ]
}

Rules:
- dailyHabit: exactly 1, the core recurring practice (e.g. "Practice guitar 30 minutes")
- milestones: 3-5 items spaced evenly between now and the target date, each a major checkpoint
- thisWeek: 4-6 items that are the most important things to do THIS WEEK to start the goal
- Use web search to find real, expert-recommended approaches for the specific goal
- Titles: short, action-oriented, specific (not generic like "work on goal")
- estimatedMinutes: realistic time to complete the task`

export default async function handler(req: Request) {
  if (req.method !== 'POST') {
    return new Response('Method Not Allowed', { status: 405 })
  }

  let goal: string, targetDate: string, categories: string[]
  try {
    const body = await req.json()
    goal       = (body?.goal ?? '').trim().slice(0, 400)
    targetDate = (body?.targetDate ?? '').trim().slice(0, 50)
    categories = Array.isArray(body?.categories) ? body.categories : ['work', 'health', 'learning', 'personal']
    if (!goal) return new Response(JSON.stringify({ error: 'goal required' }), { status: 400 })
  } catch {
    return new Response(JSON.stringify({ error: 'invalid json' }), { status: 400 })
  }

  const apiKey = (process.env as Record<string, string>).GROQ_API_KEY
  if (!apiKey) {
    return new Response(JSON.stringify({ error: 'server misconfigured' }), { status: 500 })
  }

  const userMessage = `Goal: "${goal}"
Target date: ${targetDate || 'as soon as possible'}
Available categories: ${categories.join(', ')}

Build my structured quest plan. Use web search to find the best approach for this specific goal. Return only JSON.`

  const payload = {
    model: 'compound-beta',
    messages: [
      { role: 'system', content: SYSTEM_PROMPT },
      { role: 'user',   content: userMessage },
    ],
    temperature: 0.6,
    max_tokens:  1500,
  }

  try {
    const groqRes = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method:  'POST',
      headers: {
        'Content-Type':  'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify(payload),
    })

    if (!groqRes.ok) {
      const errText = await groqRes.text()
      console.error('Groq error:', groqRes.status, errText)
      return new Response(JSON.stringify({ error: 'upstream error' }), { status: 502 })
    }

    const groqData = await groqRes.json()
    const raw      = groqData?.choices?.[0]?.message?.content ?? ''
    // strip markdown code fences if model wraps the JSON
    const text     = raw.replace(/^```(?:json)?\n?/i, '').replace(/\n?```$/i, '').trim()
    const plan     = JSON.parse(text)

    // Validate required keys
    if (!plan.goalId || !plan.dailyHabit || !Array.isArray(plan.milestones) || !Array.isArray(plan.thisWeek)) {
      throw new Error('incomplete plan')
    }

    return new Response(JSON.stringify(plan), {
      headers: {
        'Content-Type':  'application/json',
        'Cache-Control': 'no-store',
      },
    })
  } catch (err) {
    console.error('Goal plan error:', err)
    return new Response(JSON.stringify({ error: 'plan generation failed' }), { status: 500 })
  }
}
