export async function callAI(params: {
  provider: 'gemini' | 'openai'
  messages: { role: 'system' | 'user' | 'assistant'; content: string }[]
  expertise?: string
  memory?: any[]
  authToken?: string | null
  signal?: AbortSignal
}) {
  const { provider, messages, expertise = 'Technology', memory = [], authToken, signal } = params
  if (provider === 'openai') {
    const url = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/openai`
    return fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${authToken || import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
        apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY as string
      },
      body: JSON.stringify({ model: 'gpt-4o-mini', temperature: 0.7, messages }),
      signal
    })
  }
  // default Gemini path: reuse existing chat function
  const url = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/chat`
  return fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${authToken || import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
      apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY as string
    },
    body: JSON.stringify({ messages, expertise, memory }),
    signal
  })
}
