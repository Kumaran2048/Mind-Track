export const maxDuration = 30;

export async function POST(req: Request) {
  try {
    const { messages } = await req.json();
    const apiKey = process.env.GROQ_API_KEY;
    if (!apiKey) throw new Error('Missing Groq API Key');

    const lastMessage = messages[messages.length - 1].content;

    // Direct call to Groq's free API - no libraries needed
    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: 'llama-3.1-8b-instant', // Current active free Llama model on Groq
        messages: [
          {
            role: 'system',
            content: 'You are Mira, a compassionate mental wellness AI companion. Keep responses warm, supportive, and concise (1-2 sentences).'
          },
          ...messages.map((m: any) => ({ role: m.role, content: m.content }))
        ],
        temperature: 0.7,
        max_tokens: 200,
      })
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error?.message || 'Groq API error');
    }

    const text = data.choices?.[0]?.message?.content || "I'm here for you. Could you tell me more?";

    return new Response(JSON.stringify({ text }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (err: any) {
    console.error('[Mira API Error]:', err.message);
    return new Response(JSON.stringify({ error: err.message }), { status: 500 });
  }
}
