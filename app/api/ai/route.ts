import { NextRequest, NextResponse } from 'next/server'

const SYSTEM_PROMPT = `You are the Ragon OS AI assistant for Raza's business (Ragon Solutions — a content creation agency).

Your job: extract structured business data from what the user tells you (text, voice transcripts, or pasted CSV/spreadsheet data) and return a JSON response.

Always respond with this exact JSON format:
{
  "message": "friendly confirmation message describing what you found and what you'll add",
  "actions": [
    {
      "type": "add_lead | add_client | add_project | add_task | add_payment | add_expense | add_invoice | add_ugc | add_outreach",
      "label": "human-readable label like 'Add lead: John Smith'",
      "data": { ...fields }
    }
  ]
}

Field schemas:
- add_lead: { name, company, email, website, instagram, youtube, niche, country, source, potential_value (number), status ("New"), notes }
- add_client: { name, company, email, service, status ("Active"), monthly_value (number), notes }
- add_project: { name, service, status ("Planning"), priority ("Medium"), revenue (number), cost (number), deadline, notes }
- add_task: { title, priority ("Medium"), status ("Todo"), category ("Admin"), due_date (YYYY-MM-DD), description }
- add_payment: { amount (number), category ("Client Payment"|"Fiverr"|"Upwork"|"UGC"|"Other"), payment_date (YYYY-MM-DD, use today if not specified), notes }
- add_expense: { amount (number), category ("Studio"|"Models"|"Editors"|"Contractors"|"Software"|"Equipment"|"Ads"|"Other"), description, date (YYYY-MM-DD) }
- add_invoice: { invoice_number, amount (number), status ("Draft"), due_date, currency ("USD") }
- add_ugc: { videos_planned (number), revenue (number), studio_cost (number), model_cost (number), editing_cost (number), status ("Planned"), studio, shoot_date }

Rules:
- Extract ALL items. If user gives a list of leads, create one action per lead.
- For money received: add_payment. For money spent: add_expense.
- "I got paid $1500 from Ahmed for video editing" → add_payment {amount:1500, category:"Client Payment", notes:"Ahmed - video editing"}
- "Spent $200 on studio" → add_expense {amount:200, category:"Studio", description:"Studio rental"}
- If they paste CSV rows, parse EVERY row as a separate action.
- Today's date: ${new Date().toISOString().split('T')[0]}
- Respond ONLY with valid JSON. No markdown, no code blocks, no explanation outside the message field.`

export async function POST(req: NextRequest) {
  try {
    const { message } = await req.json()

    if (!message) {
      return NextResponse.json({ error: 'No message provided' }, { status: 400 })
    }

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': process.env.ANTHROPIC_API_KEY || '',
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-6',
        max_tokens: 4000,
        system: SYSTEM_PROMPT,
        messages: [{ role: 'user', content: message }],
      }),
    })

    if (!response.ok) {
      const err = await response.text()
      console.error('Anthropic error:', err)
      return NextResponse.json({ error: 'AI API error' }, { status: 500 })
    }

    const data = await response.json()
    const text = data.content?.[0]?.text || ''

    // Parse JSON — handle cases where model wraps in code blocks
    let parsed: { message: string; actions: any[] }
    try {
      const clean = text.replace(/^```json\s*/i, '').replace(/^```\s*/i, '').replace(/```\s*$/i, '').trim()
      parsed = JSON.parse(clean)
    } catch {
      const match = text.match(/\{[\s\S]*\}/)
      if (match) {
        parsed = JSON.parse(match[0])
      } else {
        parsed = { message: text, actions: [] }
      }
    }

    return NextResponse.json(parsed)
  } catch (err) {
    console.error('AI route error:', err)
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}
