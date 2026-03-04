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

export function StreakTracker({ userId }: { userId: string }) {
  const supabase = createClient()
  const [streak, setStreak] = useState<StreakData>({ currentStreak: 0, longestStreak: 0, lastActiveDate: null })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchStreakData()
  }, [userId])

  async function fetchStreakData() {
    try {
      const { data, error } = await supabase.from('streaks').select('*').eq('user_id', userId).single()

      if (error && error.code !== 'PGRST116') {
        console.log('[v0] Error fetching streak:', error)
        return
      }

      if (data) {
        setStreak({
          currentStreak: data.current_streak || 0,
          longestStreak: data.longest_streak || 0,
          lastActiveDate: data.last_active_date,
        })
      }
    } catch (err) {
      console.log('[v0] Error:', err)
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
