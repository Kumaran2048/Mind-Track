'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { BottomNav } from '@/components/bottom-nav'
import { Card } from '@/components/ui/card'
import { Heart, Check, ArrowLeft } from 'lucide-react'
import Link from 'next/link'

const SUBSTANCES = ['Alcohol', 'Caffeine', 'Nicotine', 'Cannabis']
const TIMES = ['Morning', 'Afternoon', 'Evening', 'Night']

export default function LogsPage() {
  const [user, setUser] = useState<any>(null)
  const [moodScore, setMoodScore] = useState(7)
  const [substances, setSubstances] = useState<string[]>([])
  const [quantity, setQuantity] = useState('')
  const [timeOfDay, setTimeOfDay] = useState('Afternoon')
  const [journal, setJournal] = useState('')
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [success, setSuccess] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    const checkAuth = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user) {
        router.push('/auth/login')
        return
      }

      setUser(user)
      setLoading(false)
    }

    checkAuth()
  }, [])

  const toggleSubstance = (substance: string) => {
    setSubstances((prev) =>
      prev.includes(substance)
        ? prev.filter((s) => s !== substance)
        : [...prev, substance]
    )
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user) return

    setSubmitting(true)

    const { error } = await supabase.from('mood_logs').insert({
      user_id: user.id,
      mood_score: moodScore,
      substances: substances,
      quantity: quantity || null,
      time_of_day: timeOfDay,
      journal_text: journal,
    })

    setSubmitting(false)

    if (error) {
      console.error('Error logging mood:', error)
    } else {
      setSuccess(true)
      setTimeout(() => {
        router.push('/dashboard')
      }, 2000)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background dark:bg-gray-950">
        <Heart className="w-12 h-12 text-red-500 fill-red-500 animate-pulse" />
      </div>
    )
  }

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background dark:bg-gray-950 pb-20">
        <div className="text-center">
          <div className="mb-4 flex justify-center">
            <Check className="w-16 h-16 text-green-500" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Mood logged!</h2>
          <p className="text-gray-600 dark:text-gray-400">Redirecting to dashboard...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background dark:bg-gray-950 pb-32">
      {/* Header */}
      <div className="bg-gradient-to-r from-red-50 to-orange-50 dark:from-gray-800 dark:to-gray-900 border-b border-gray-200 dark:border-gray-700 sticky top-0 z-10">
        <div className="max-w-md mx-auto px-4 py-4 flex items-center gap-3">
          <Link href="/dashboard" className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition">
            <ArrowLeft className="w-5 h-5 text-gray-600 dark:text-gray-400" />
          </Link>
          <h1 className="text-xl font-bold text-gray-900 dark:text-white">Log Your Mood</h1>
        </div>
      </div>

      <div className="max-w-md mx-auto px-4 py-6">
        <form onSubmit={handleSubmit} className="space-y-6" suppressHydrationWarning>
          {/* Mood Score Slider */}
          <Card className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
            <div className="p-6">
              <label className="block text-sm font-semibold text-gray-900 dark:text-white mb-4">
                How's your mood?
              </label>
              <div className="flex justify-between items-end gap-4">
                <div className="text-4xl">
                  {moodScore <= 3 ? '😢' : moodScore <= 5 ? '😕' : moodScore <= 7 ? '😐' : moodScore <= 9 ? '🙂' : '😊'}
                </div>
                <div className="flex-1">
                  <input
                    type="range"
                    min="1"
                    max="10"
                    value={moodScore}
                    onChange={(e) => setMoodScore(Number(e.target.value))}
                    className="w-full h-2 bg-gray-300 rounded-lg appearance-none cursor-pointer accent-red-500"
                    suppressHydrationWarning
                  />
                  <div className="mt-2 text-center">
                    <span className="text-2xl font-bold text-gray-900 dark:text-white">{moodScore}</span>
                    <span className="text-gray-600 dark:text-gray-400">/10</span>
                  </div>
                </div>
              </div>
            </div>
          </Card>

          {/* Substances */}
          <Card className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
            <div className="p-6">
              <label className="block text-sm font-semibold text-gray-900 dark:text-white mb-4">
                Substances used today
              </label>
              <div className="grid grid-cols-2 gap-3">
                {SUBSTANCES.map((substance) => (
                  <button
                    key={substance}
                    type="button"
                    onClick={() => toggleSubstance(substance)}
                    className={`p-3 rounded-lg border-2 font-medium transition text-sm ${
                      substances.includes(substance)
                        ? 'bg-red-50 dark:bg-red-900/30 border-red-500 text-red-700 dark:text-red-300'
                        : 'bg-white dark:bg-gray-700 border-gray-200 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:border-gray-300 dark:hover:border-gray-500'
                    }`}
                  >
                    {substance}
                  </button>
                ))}
              </div>
            </div>
          </Card>

          {/* Quantity */}
          {substances.length > 0 && (
            <Card className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
              <div className="p-6">
                <label className="block text-sm font-semibold text-gray-900 dark:text-white mb-2">
                  Quantity (optional)
                </label>
                <input
                  type="text"
                  value={quantity}
                  onChange={(e) => setQuantity(e.target.value)}
                  placeholder="e.g., 2 drinks, 3 cups of coffee"
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
                  suppressHydrationWarning
                />
              </div>
            </Card>
          )}

          {/* Time of Day */}
          <Card className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
            <div className="p-6">
              <label className="block text-sm font-semibold text-gray-900 dark:text-white mb-4">
                Time of day
              </label>
              <div className="grid grid-cols-2 gap-3">
                {TIMES.map((time) => (
                  <button
                    key={time}
                    type="button"
                    onClick={() => setTimeOfDay(time)}
                    className={`p-3 rounded-lg border-2 font-medium transition text-sm ${
                      timeOfDay === time
                        ? 'bg-red-50 dark:bg-red-900/30 border-red-500 text-red-700 dark:text-red-300'
                        : 'bg-white dark:bg-gray-700 border-gray-200 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:border-gray-300 dark:hover:border-gray-500'
                    }`}
                  >
                    {time}
                  </button>
                ))}
              </div>
            </div>
          </Card>

          {/* Journal */}
          <Card className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
            <div className="p-6">
              <label className="block text-sm font-semibold text-gray-900 dark:text-white mb-2">
                Notes (optional)
              </label>
              <textarea
                value={journal}
                onChange={(e) => setJournal(e.target.value)}
                placeholder="How are you feeling? What's on your mind?"
                rows={4}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 resize-none"
                suppressHydrationWarning
              />
            </div>
          </Card>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={submitting}
            className="w-full bg-red-500 dark:bg-red-600 hover:bg-red-600 dark:hover:bg-red-700 text-white font-semibold py-3 rounded-lg transition disabled:opacity-50"
            suppressHydrationWarning
          >
            {submitting ? 'Saving...' : 'Save Mood Entry'}
          </button>
        </form>
      </div>

      <BottomNav />
    </div>
  )
}
