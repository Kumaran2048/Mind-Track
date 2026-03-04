'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Heart, ChevronLeft, ChevronRight } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { useTheme } from 'next-themes'

interface MoodDay {
  date: string
  moodScore: number
  count: number
}

export default function CalendarPage() {
  const router = useRouter()
  const { theme } = useTheme()
  const supabase = createClient()
  const [mounted, setMounted] = useState(false)
  const [loading, setLoading] = useState(true)
  const [moodData, setMoodData] = useState<Map<string, MoodDay>>(new Map())
  const [currentMonth, setCurrentMonth] = useState(new Date())

  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    fetchMoodData()
  }, [currentMonth])

  async function fetchMoodData() {
    setLoading(true)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        router.push('/auth/login')
        return
      }

      const startDate = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1)
      const endDate = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 0)

      const { data: logs, error } = await supabase
        .from('mood_logs')
        .select('mood_score, created_at')
        .eq('user_id', user.id)
        .gte('created_at', startDate.toISOString())
        .lte('created_at', endDate.toISOString())

      if (error) throw error

      const moodMap = new Map<string, MoodDay>()
      logs?.forEach((log) => {
        const date = new Date(log.created_at).toLocaleDateString('en-US', { year: 'numeric', month: '2-digit', day: '2-digit' })
        const existing = moodMap.get(date) || { date, moodScore: 0, count: 0 }
        moodMap.set(date, {
          date,
          moodScore: (existing.moodScore * existing.count + log.mood_score) / (existing.count + 1),
          count: existing.count + 1,
        })
      })

      setMoodData(moodMap)
    } catch (error) {
      console.log('[v0] Error fetching mood data:', error)
    } finally {
      setLoading(false)
    }
  }

  const getMoodColor = (moodScore: number | undefined) => {
    if (!moodScore) return 'bg-gray-100 dark:bg-gray-800'
    if (moodScore <= 3) return 'bg-red-100 dark:bg-red-900'
    if (moodScore <= 5) return 'bg-orange-100 dark:bg-orange-900'
    if (moodScore <= 7) return 'bg-yellow-100 dark:bg-yellow-900'
    return 'bg-green-100 dark:bg-green-900'
  }

  const getMoodEmoji = (moodScore: number | undefined) => {
    if (!moodScore) return ''
    if (moodScore <= 3) return '😢'
    if (moodScore <= 5) return '😕'
    if (moodScore <= 7) return '😐'
    if (moodScore <= 9) return '🙂'
    return '😊'
  }

  const daysInMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 0).getDate()
  const firstDayOfMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1).getDay()
  const days = Array.from({ length: daysInMonth }, (_, i) => i + 1)

  if (!mounted) return null

  return (
    <div className={`min-h-screen pb-32 ${theme === 'dark' ? 'bg-gray-950' : 'bg-background'}`}>
      {/* Header */}
      <div className="bg-gradient-to-r from-red-50 to-orange-50 dark:from-gray-800 dark:to-gray-900 border-b border-gray-200 dark:border-gray-700 sticky top-0 z-10">
        <div className="max-w-md mx-auto px-4 py-4 flex items-center gap-3">
          <Link href="/dashboard" className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition">
            <ArrowLeft className="w-5 h-5 text-gray-600 dark:text-gray-400" />
          </Link>
          <h1 className="text-xl font-bold text-gray-900 dark:text-white">Mood Calendar</h1>
        </div>
      </div>

      <div className="max-w-md mx-auto px-4 py-6">
        {/* Month Navigation */}
        <div className="flex items-center justify-between mb-6">
          <button
            onClick={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1))}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <h2 className="text-lg font-bold text-gray-900 dark:text-white">
            {currentMonth.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
          </h2>
          <button
            onClick={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1))}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>

        {/* Calendar Grid */}
        {loading ? (
          <div className="text-center py-8">
            <Heart className="w-8 h-8 text-red-500 fill-red-500 mx-auto mb-2 animate-pulse" />
            <p className="text-gray-600 dark:text-gray-400">Loading calendar...</p>
          </div>
        ) : (
          <>
            {/* Day Labels */}
            <div className="grid grid-cols-7 gap-2 mb-4">
              {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
                <div key={day} className="text-center text-xs font-semibold text-gray-600 dark:text-gray-400 py-2">
                  {day}
                </div>
              ))}
            </div>

            {/* Calendar Days */}
            <div className="grid grid-cols-7 gap-2">
              {Array.from({ length: firstDayOfMonth }).map((_, i) => (
                <div key={`empty-${i}`} className="aspect-square" />
              ))}
              {days.map((day) => {
                const dateStr = `${String(currentMonth.getMonth() + 1).padStart(2, '0')}/${String(day).padStart(2, '0')}/${currentMonth.getFullYear()}`
                const dayData = moodData.get(dateStr)
                return (
                  <div
                    key={day}
                    className={`aspect-square rounded-lg flex flex-col items-center justify-center ${getMoodColor(dayData?.moodScore)} border border-gray-200 dark:border-gray-700 cursor-pointer hover:ring-2 hover:ring-red-500 transition`}
                    title={dayData ? `Mood: ${dayData.moodScore.toFixed(1)}/10 (${dayData.count} entries)` : 'No entry'}
                  >
                    <span className="text-xs font-semibold text-gray-700 dark:text-gray-300">{day}</span>
                    {dayData && <span className="text-lg mt-1">{getMoodEmoji(dayData.moodScore)}</span>}
                  </div>
                )
              })}
            </div>

            {/* Legend */}
            <div className="mt-8 p-4 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
              <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-3">Mood Scale</h3>
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 bg-red-100 dark:bg-red-900 rounded"></div>
                  <span className="text-sm text-gray-600 dark:text-gray-400">Very Low (1-3)</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 bg-orange-100 dark:bg-orange-900 rounded"></div>
                  <span className="text-sm text-gray-600 dark:text-gray-400">Low (4-5)</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 bg-yellow-100 dark:bg-yellow-900 rounded"></div>
                  <span className="text-sm text-gray-600 dark:text-gray-400">Neutral (6-7)</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 bg-green-100 dark:bg-green-900 rounded"></div>
                  <span className="text-sm text-gray-600 dark:text-gray-400">Good (8-10)</span>
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
