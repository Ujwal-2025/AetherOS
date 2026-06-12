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

  // Use globalThis to access process in environments where `process` isn't defined
  const apiKey = (globalThis as any)?.process?.env?.GROQ_API_KEY || (globalThis as any).GROQ_API_KEY
  if (!apiKey) {
    return new Response(JSON.stringify({ error: 'server misconfigured' }), { status: 500 })
  }

  const payload = {
    model: 'llama-3.3-70b-versatile',
    messages: [
      { role: 'system', content: SYSTEM_PROMPT },
      { role: 'user',   content: `User goal: "${goal}"\n\nReturn JSON array only:` },
    ],
    temperature: 0.7,
    max_tokens: 1024,
  }

  const url = 'https://api.groq.com/openai/v1/chat/completions'

  try {
    const groqRes = await fetch(url, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify(payload),
    })

    if (!groqRes.ok) {
      const errText = await groqRes.text()
      console.error('Groq error:', groqRes.status, errText)
      return new Response(JSON.stringify({ error: 'upstream error' }), { status: 502 })
    }

    const groqData = await groqRes.json()
    const text = groqData?.choices?.[0]?.message?.content ?? ''

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
