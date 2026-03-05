'use client'

import { useState, useEffect } from 'react'
import { Flame, Award } from 'lucide-react'
import { Card } from '@/components/ui/card'
import { createClient } from '@/lib/supabase/client'

interface StreakData {
  currentStreak: number
  longestStreak: number
  lastActiveDate: string | null
}

/** Compute streaks directly from mood_logs rows (as fallback or primary). */
function computeStreaksFromLogs(logs: { created_at: string }[]): StreakData {
  if (!logs || logs.length === 0) {
    return { currentStreak: 0, longestStreak: 0, lastActiveDate: null }
  }

  // Get unique days (YYYY-MM-DD), sorted newest first
  const days = Array.from(
    new Set(logs.map((l) => l.created_at.split('T')[0]))
  ).sort((a, b) => (a > b ? -1 : 1))

  const today = new Date().toISOString().split('T')[0]
  const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0]

  let current = 0
  let longest = 0
  let streak = 0
  let prevDay: string | null = null

  // Walk days newest→oldest to build streaks
  for (const day of days) {
    if (prevDay === null) {
      // Start streak only if last entry is today or yesterday
      if (day === today || day === yesterday) {
        streak = 1
      } else {
        streak = 0
      }
    } else {
      const prev = new Date(prevDay)
      const curr = new Date(day)
      const diff = Math.round((prev.getTime() - curr.getTime()) / 86400000)
      if (diff === 1) {
        streak += 1
      } else {
        streak = 0
      }
    }
    if (streak > longest) longest = streak
    prevDay = day
  }

  // Re-compute current streak (consecutive days ending today or yesterday)
  current = 0
  for (let i = 0; i < days.length; i++) {
    const expected = new Date(Date.now() - i * 86400000).toISOString().split('T')[0]
    if (days[i] === expected) {
      current += 1
    } else {
      break
    }
  }

  return {
    currentStreak: current,
    longestStreak: Math.max(longest, current),
    lastActiveDate: days[0] ?? null,
  }
}

export function StreakTracker({ userId }: { userId: string }) {
  const supabase = createClient()
  const [streak, setStreak] = useState<StreakData>({ currentStreak: 0, longestStreak: 0, lastActiveDate: null })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchStreakData()
  }, [userId])

  async function fetchStreakData() {
    try {
      // --- Try the streaks table first ---
      const { data, error } = await supabase
        .from('streaks')
        .select('*')
        .eq('user_id', userId)
        .maybeSingle() // uses maybeSingle() → returns null instead of 406 when no row

      if (!error && data) {
        setStreak({
          currentStreak: data.current_streak || 0,
          longestStreak: data.longest_streak || 0,
          lastActiveDate: data.last_active_date,
        })
        return
      }

      // --- Fallback: compute from mood_logs (covers 406 / table missing) ---
      const { data: logs } = await supabase
        .from('mood_logs')
        .select('created_at')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })

      setStreak(computeStreaksFromLogs(logs ?? []))
    } catch (err) {
      console.log('[v0] StreakTracker error, using fallback:', err)
      // Don't crash — just show zeroes
    } finally {
      setLoading(false)
    }
  }

  if (loading) return null

  return (
    <Card className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 mb-6">
      <div className="p-6">
        <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
          <Flame className="w-4 h-4 text-orange-500" />
          Your Streak
        </h3>

        <div className="grid grid-cols-2 gap-4">
          <div className="text-center p-3 rounded-lg bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800">
            <p className="text-3xl font-bold text-orange-600 dark:text-orange-400">{streak.currentStreak}</p>
            <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">Current Streak</p>
            <p className="text-xs text-gray-500 dark:text-gray-500">days</p>
          </div>

          <div className="text-center p-3 rounded-lg bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800">
            <p className="text-3xl font-bold text-yellow-600 dark:text-yellow-400 flex items-center justify-center gap-1">
              <Award className="w-6 h-6" />
              {streak.longestStreak}
            </p>
            <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">Longest Streak</p>
          </div>
        </div>

        {streak.lastActiveDate && (
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-4 text-center">
            Last active: {new Date(streak.lastActiveDate).toLocaleDateString()}
          </p>
        )}
      </div>
    </Card>
  )
}
