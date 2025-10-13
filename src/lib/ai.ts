export async function callAI(params: {
  provider: 'gemini' | 'openai'
  messages: { role: 'system' | 'user' | 'assistant'; content: string }[]
  expertise?: string
  memory?: any[]
  signal?: AbortSignal
}) {
  const { provider, messages, expertise = 'Technology', memory = [], signal } = params
  if (provider === 'openai') {
    const url = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/openai`
    return fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ model: 'gpt-4o-mini', temperature: 0.7, messages }),
      signal
    })
  }
  // default Gemini path: reuse existing chat function
  const url = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/chat`
  return fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ messages, expertise, memory }),
    signal
  })
}
