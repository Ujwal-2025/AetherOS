export const config = { runtime: 'edge' }

const CORS = {
  'Access-Control-Allow-Origin':  '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
}

const SYSTEM_PROMPT = `You are AetherOS, a productivity quest planner. Given a goal and target date, return ONLY a JSON object (no markdown, no explanation) with this exact shape:
{"goalId":"slug-here","goalTitle":"Short Title","dailyHabit":{"title":"Action verb task","category":"learning","priority":"high","estimatedMinutes":30},"milestones":[{"title":"Milestone task","category":"learning","priority":"high","estimatedMinutes":60,"weekOffset":4}],"thisWeek":[{"title":"First step task","category":"learning","priority":"medium","estimatedMinutes":20}]}
Rules: dailyHabit=1 recurring practice, milestones=3-5 checkpoints with weekOffset spaced to target date, thisWeek=4-5 immediate actions. category must be one of: health,work,learning,personal. priority: low/medium/high/critical.`

export default async function handler(req: Request) {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: CORS })
  }

  if (req.method !== 'POST') {
    return new Response('Method Not Allowed', { status: 405, headers: CORS })
  }

  let goal: string, targetDate: string, categories: string[]
  try {
    const body = await req.json()
    goal       = (body?.goal ?? '').trim().slice(0, 400)
    targetDate = (body?.targetDate ?? '').trim().slice(0, 50)
    categories = Array.isArray(body?.categories) ? body.categories : ['work', 'health', 'learning', 'personal']
    if (!goal) return new Response(JSON.stringify({ error: 'goal required' }), { status: 400, headers: CORS })
  } catch {
    return new Response(JSON.stringify({ error: 'invalid json' }), { status: 400, headers: CORS })
  }

  const apiKey = (process.env as Record<string, string>).GROQ_API_KEY
  if (!apiKey) {
    return new Response(JSON.stringify({ error: 'server misconfigured' }), { status: 500, headers: CORS })
  }

  const userMessage = `Goal: "${goal}". Target: ${targetDate || 'as soon as possible'}. Return JSON only.`

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
      return new Response(JSON.stringify({ error: 'upstream error' }), { status: 502, headers: CORS })
    }

    const groqData = await groqRes.json()
    const raw      = groqData?.choices?.[0]?.message?.content ?? ''
    const text     = raw.replace(/^```(?:json)?\n?/i, '').replace(/\n?```$/i, '').trim()
    const plan     = JSON.parse(text)

    if (!plan.goalId || !plan.dailyHabit || !Array.isArray(plan.milestones) || !Array.isArray(plan.thisWeek)) {
      throw new Error('incomplete plan')
    }

    return new Response(JSON.stringify(plan), {
      headers: { ...CORS, 'Content-Type': 'application/json', 'Cache-Control': 'no-store' },
    })
  } catch (err) {
    console.error('Goal plan error:', err)
    return new Response(JSON.stringify({ error: 'plan generation failed' }), { status: 500, headers: CORS })
  }
}
