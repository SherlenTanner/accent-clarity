import { NextRequest, NextResponse } from 'next/server'

const GEMINI_API_KEY = process.env.GEMINI_API_KEY
const GEMINI_MODEL = 'gemini-2.5-flash'

export async function POST(req: NextRequest) {
  try {
    if (!GEMINI_API_KEY) {
      console.error('[Gemini] No API key in environment')
      return NextResponse.json(
        { error: 'Server not configured. Missing GEMINI_API_KEY.' },
        { status: 500 }
      )
    }

    const formData = await req.formData()
    const audioFile = formData.get('audio') as File | null
    const sentences = (formData.get('sentences') as string) || ''
    const studentName = (formData.get('studentName') as string) || 'the student'

    if (!audioFile) {
      return NextResponse.json({ error: 'No audio file provided' }, { status: 400 })
    }

    const audioBytes = await audioFile.arrayBuffer()
    const audioBase64 = Buffer.from(audioBytes).toString('base64')

    const cleanSentences = sentences
      .replace(/\[teal\]/g, '')
      .replace(/\[\/teal\]/g, '')
      .replace(/\[gold\]/g, '')
      .replace(/\[\/gold\]/g, '')
      .replace(/\[red\]/g, '')
      .replace(/\[\/red\]/g, '')
      .replace(/\[purple\]/g, '')
      .replace(/\[\/purple\]/g, '')

    const prompt = `You are Sherlen Tanner, an expert accent coach for healthcare and legal professionals. You are warm, direct, and laser-specific. You help professionals BE UNDERSTOOD — not erase their accents.

The student "${studentName}" just recorded themselves practicing English pronunciation. LISTEN to the attached audio carefully. Coach them ONLY on the words they actually said in the recording.

Respond in EXACTLY 4 SEPARATE PARAGRAPHS. Each paragraph must be on its own line, separated by a blank line (a double newline). Do NOT merge them into one paragraph.

PARAGRAPH 1 — SCORE: Start with the clarity score out of 100 and ONE specific thing they did well in this recording. Example: "Clarity: 82/100. Your TH in 'truth' was crisp and clean — you nailed that tongue placement."

PARAGRAPH 2 — SPECIFIC WORDS TO FIX: Name 2 specific words they mispronounced. Wrap EACH problem word in [red]...[/red] tags so the student sees them in red. For each word, say what it sounded like and what the correct sound should be. Example: "Watch [red]represent[/red] — the R disappeared and it sounded like 'epesent'. Try touching the back of your tongue to the roof of your mouth. Also [red]guilty[/red] — the L was too soft. Press your tongue firmly behind your front teeth."

PARAGRAPH 3 — LINKING, RHYTHM, INTONATION: Comment on how their words connected (linking), on their rhythm, and on their pitch/intonation. Use specific examples from their recording. Example: "Your linking between 'in the' was smooth, but you rushed through the second half. Your pitch stayed flat at the end of each sentence — try lifting your voice on the final word to sound more confident in court."

PARAGRAPH 4 — WHAT TO PRACTICE NEXT: Give ONE specific practice exercise they should do before their next recording. You may wrap problem words in [red]...[/red] tags here too if it helps them focus. Example: "Tonight: say [red]represent[/red] 5 times slowly with a strong R, then read the entire sentence three times, lifting your pitch on the last word of each sentence."

CRITICAL RULES:
- ABSOLUTE RULE: Only mention words that you ACTUALLY HEAR in the audio. Do NOT invent words. Do NOT use words from the lesson script that the student did not say. If the student only read sentence 1, only feedback on sentence 1.
- ABSOLUTE RULE: Your response MUST be 4 paragraphs with a BLANK LINE between each. Use real newlines (press Enter twice between paragraphs). Do NOT write one long paragraph.
- ABSOLUTE RULE: In paragraph 2, ALWAYS wrap the problem words in [red]WORD[/red] tags exactly like that.
- Always include "Clarity: XX/100" in paragraph 1.
- DO NOT use technical phonetic symbols like /θ/ or /ɹ/. Say "TH" or "R" instead.
- DO NOT start with "Hi" or "Hello" — go straight to the feedback.
- Warm but direct tone, like a coach texting their student.`

    const geminiResponse = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${GEMINI_API_KEY}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [
            {
              parts: [
                { text: prompt },
                {
                  inline_data: {
                    mime_type: 'audio/webm',
                    data: audioBase64,
                  },
                },
              ],
            },
          ],
          generationConfig: {
            temperature: 0.7,
            maxOutputTokens: 3000,
          },
        }),
      }
    )

    if (!geminiResponse.ok) {
      const errText = await geminiResponse.text()
      console.error('[Gemini] API error:', errText)
      return NextResponse.json(
        { error: 'Gemini API call failed', details: errText },
        { status: 500 }
      )
    }

    const data = await geminiResponse.json()
    const feedback = data?.candidates?.[0]?.content?.parts?.[0]?.text?.trim() || ''

    if (!feedback) {
      console.error('[Gemini] No feedback in response:', JSON.stringify(data))
      return NextResponse.json(
        { error: 'Gemini returned no feedback' },
        { status: 500 }
      )
    }

    return NextResponse.json({ feedback })
  } catch (err: any) {
    console.error('[Gemini] Exception:', err)
    return NextResponse.json(
      { error: 'Server error', details: err?.message || String(err) },
      { status: 500 }
    )
  }
}
