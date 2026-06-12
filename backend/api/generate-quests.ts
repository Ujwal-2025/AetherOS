export const config = { runtime: 'edge' }

const SYSTEM_PROMPT = `You are AetherOS, a Solo Leveling-inspired productivity system.
Given a user goal, return ONLY a JSON array of exactly 5 quests. No explanation, no markdown.

Each quest: { "title": string, "description": string, "category": "health"|"work"|"learning"|"personal", "priority": "low"|"medium"|"high"|"critical", "xpReward": number 10-100 }

Rules:
- Spread quests across different categories when possible
- xpReward: low=10-25, medium=30-50, high=60-80, critical=90-100
- Titles: short, action-oriented (max 6 words)
- Descriptions: 1-2 sentences, specific and actionable`

export default async function handler(req: Request) {
  if (req.method !== 'POST') {
    return new Response('Method Not Allowed', { status: 405 })
  }

  let goal: string
  try {
    const body = await req.json()
    goal = (body?.goal ?? '').trim().slice(0, 300)
    if (!goal) return new Response(JSON.stringify({ error: 'goal required' }), { status: 400 })
  } catch {
    return new Response(JSON.stringify({ error: 'invalid json' }), { status: 400 })
  }

  const apiKey = (process.env as Record<string, string>).GEMINI_API_KEY
  if (!apiKey) {
    return new Response(JSON.stringify({ error: 'server misconfigured' }), { status: 500 })
  }

  const payload = {
    contents: [
      {
        parts: [
          { text: `${SYSTEM_PROMPT}\n\nUser goal: "${goal}"\n\nReturn JSON array only:` }
        ]
      }
    ],
    generationConfig: {
      temperature: 0.7,
      maxOutputTokens: 1024,
    }
  }

  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`

  try {
    const geminiRes = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    })

    if (!geminiRes.ok) {
      const errText = await geminiRes.text()
      console.error('Gemini error:', geminiRes.status, errText)
      return new Response(JSON.stringify({ error: 'upstream error' }), { status: 502 })
    }

    const geminiData = await geminiRes.json()
    const text = geminiData?.candidates?.[0]?.content?.parts?.[0]?.text ?? ''

    // Strip markdown fences if present
    const clean = text.replace(/^```(?:json)?\n?/, '').replace(/\n?```$/, '').trim()

    const quests = JSON.parse(clean)
    if (!Array.isArray(quests)) throw new Error('not array')

    return new Response(JSON.stringify(quests), {
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'no-store',
      },
    })
  } catch (err) {
    console.error('Parse error:', err)
    return new Response(JSON.stringify({ error: 'parse failed' }), { status: 500 })
  }
}
