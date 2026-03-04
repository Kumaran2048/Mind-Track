'use client'

import { useState, useRef, useEffect } from 'react'
import Link from 'next/link'
import { ArrowLeft, Send, Loader, Heart } from 'lucide-react'

export default function MiraPage() {
  const [messages, setMessages] = useState<{ id: string, role: 'user' | 'assistant', content: string }[]>([])
  const [input, setInput] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  async function sendMessage(e: React.FormEvent) {
    e.preventDefault()
    if (!input.trim() || isLoading) return

    const userMessage = { id: Date.now().toString(), role: 'user' as const, content: input }
    setMessages(prev => [...prev, userMessage])
    setInput('')
    setIsLoading(true)

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: [...messages, userMessage] })
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'API failed')
      }

      setMessages(prev => [...prev, {
        id: 'ai-' + Date.now(),
        role: 'assistant',
        content: data.text || "I'm here for you, but I had a small glitch. Can you say that again?"
      }])
    } catch (err: any) {
      console.error('Chat Error:', err)
      alert('Mira Glitch: ' + err.message + '. Please ensure your Gemini API key is active.')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 pb-36">
      <header className="bg-white dark:bg-gray-900 border-b p-4 sticky top-0 z-10 shadow-sm">
        <div className="max-w-2xl mx-auto flex items-center gap-4">
          <Link href="/dashboard" className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition-colors">
            <ArrowLeft className="w-6 h-6 text-gray-600 dark:text-gray-400" />
          </Link>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-red-500 flex items-center justify-center text-white font-bold text-sm">M</div>
            <h1 className="text-xl font-bold dark:text-white">Mira Wellness</h1>
          </div>
        </div>
      </header>

      <main className="max-w-2xl mx-auto p-4 space-y-6">
        {messages.length === 0 && (
          <div className="text-center py-20 animate-in fade-in duration-700">
            <div className="w-20 h-20 bg-red-50 dark:bg-red-900/20 rounded-full flex items-center justify-center mx-auto mb-6">
              <Heart className="w-10 h-10 text-red-500 fill-red-500" />
            </div>
            <h2 className="text-2xl font-bold dark:text-white mb-2">Hello, I'm Mira</h2>
            <p className="text-gray-500 dark:text-gray-400">Your wellness companion. How are you feeling right now?</p>
          </div>
        )}

        {messages.map((m) => (
          <div key={m.id} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'} animate-in slide-in-from-bottom-2 duration-300`}>
            <div className={`p-4 rounded-2xl max-w-[85%] shadow-sm ${m.role === 'user'
              ? 'bg-red-500 text-white rounded-tr-none'
              : 'bg-white dark:bg-gray-800 dark:text-white border border-gray-100 dark:border-gray-700 rounded-tl-none'
              }`}>
              {m.content}
            </div>
          </div>
        ))}

        {isLoading && (
          <div className="flex justify-start animate-pulse">
            <div className="p-4 bg-white dark:bg-gray-800 border dark:border-gray-700 rounded-2xl rounded-tl-none flex items-center gap-3">
              <Loader className="w-4 h-4 animate-spin text-red-500" />
              <span className="text-gray-600 dark:text-gray-400">Mira is listening...</span>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} className="h-4" />
      </main>

      <footer className="fixed bottom-0 left-0 right-0 bg-white dark:bg-gray-900 border-t p-4 z-20">
        <form onSubmit={sendMessage} className="max-w-2xl mx-auto flex gap-3">
          <input
            className="flex-1 p-4 bg-gray-50 dark:bg-gray-800 border dark:border-gray-700 rounded-2xl outline-none focus:ring-2 focus:ring-red-500 transition-all dark:text-white"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Tell Mira how you're feeling..."
            disabled={isLoading}
          />
          <button
            type="submit"
            disabled={!input.trim() || isLoading}
            className="bg-red-500 hover:bg-red-600 disabled:bg-gray-300 dark:disabled:bg-gray-800 text-white p-4 rounded-2xl transition-all shadow-md active:scale-95"
          >
            <Send className="w-6 h-6" />
          </button>
        </form>
      </footer>
    </div>
  )
}
