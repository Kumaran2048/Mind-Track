'use client'

import { useEffect, useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { BottomNav } from '@/components/bottom-nav'
import { MoodScoreCard } from '@/components/mood-score-card'
import { RiskLevelBadge } from '@/components/risk-level-badge'
import { StreakTracker } from '@/components/streak-tracker'
import { Card } from '@/components/ui/card'
import { Heart, LogOut, Calendar, MessageCircle, FileText } from 'lucide-react'
import Link from 'next/link'

interface MoodLog {
  mood: number
  substances: string[]
  timestamp: string
  journal: string
}

export default function DashboardPage() {
  const [user, setUser] = useState<any>(null)
  const [todayMood, setTodayMood] = useState(7)
  const [riskLevel, setRiskLevel] = useState<'low' | 'medium' | 'high'>('low')
  const [recentLogs, setRecentLogs] = useState<MoodLog[]>([])
  const [loading, setLoading] = useState(true)
  const [mounted, setMounted] = useState(false)
  const router = useRouter()
  const supabase = createClient()
  const isInitializing = useRef(false)

  useEffect(() => {
    setMounted(true)
    
    if (isInitializing.current) return
    isInitializing.current = true

    // Get initial session and listen for changes
    const initDashboard = async () => {
      try {
        const {
          data: { session },
        } = await supabase.auth.getSession()

        if (!session?.user) {
          setLoading(false)
          router.push('/auth/login')
          return
        }

        setUser(session.user)

        // Fetch today's mood log
        const today = new Date().toISOString().split('T')[0]
        const { data: logs } = await supabase
          .from('mood_logs')
          .select('*')
          .eq('user_id', session.user.id)
          .gte('created_at', `${today}T00:00:00`)
          .order('created_at', { ascending: false })
          .limit(1)

        if (logs && logs.length > 0) {
          setTodayMood(logs[0].mood_score)
        }

        // Fetch recent logs for summary
        const { data: recentData } = await supabase
          .from('mood_logs')
          .select('*')
          .eq('user_id', session.user.id)
          .order('created_at', { ascending: false })
          .limit(5)

        if (recentData) {
          setRecentLogs(
            recentData.map((log: any) => ({
              mood: log.mood_score,
              substances: log.substances || [],
              timestamp: log.created_at,
              journal: log.journal_text || '',
            }))
          )

          // Calculate risk level
          const averageMood = recentData.length > 0
            ? recentData.reduce((sum: number, log: any) => sum + log.mood_score, 0) / recentData.length
            : 7

          if (averageMood < 4) {
            setRiskLevel('high')
          } else if (averageMood < 6) {
            setRiskLevel('medium')
          } else {
            setRiskLevel('low')
          }
        }

        setLoading(false)
      } catch (error) {
        console.log('[v0] Dashboard init error:', error)
        setLoading(false)
      }
    }

    initDashboard()

    // Only listen for explicit sign-out events
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'SIGNED_OUT') {
        router.push('/auth/login')
      }
    })

    return () => {
      subscription?.unsubscribe()
    }
  }, [])

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push('/auth/login')
  }

  const downloadWeeklyReport = async () => {
    try {
      const response = await fetch('/api/generate-report', { method: 'POST' })
      const { html } = await response.json()

      if (!html) {
        alert('Failed to generate report')
        return
      }

      // Create a simple PDF by opening in new window
      const win = window.open()
      if (win) {
        win.document.write(html)
        win.document.close()
        setTimeout(() => win.print(), 500)
      }
    } catch (error) {
      console.log('[v0] Error downloading report:', error)
      alert('Failed to generate report')
    }
  }

  if (!mounted || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background dark:bg-gray-950">
        <div className="text-center">
          <Heart className="w-12 h-12 text-red-500 fill-red-500 mx-auto mb-4 animate-pulse" />
          <p className="text-gray-600 dark:text-gray-400">Loading your dashboard...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background dark:bg-gray-950 pb-32">
      {/* Header */}
      <div className="bg-gradient-to-r from-red-50 to-orange-50 dark:from-gray-800 dark:to-gray-900 border-b border-gray-200 dark:border-gray-700 sticky top-0 z-10">
        <div className="max-w-md mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center gap-2">
            <Heart className="w-6 h-6 text-red-500 fill-red-500" />
            <h1 className="text-xl font-bold text-gray-900 dark:text-white">MindTrack</h1>
          </div>
          <button
            onClick={handleLogout}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition"
            title="Sign out"
          >
            <LogOut className="w-5 h-5 text-gray-600 dark:text-gray-400" />
          </button>
        </div>
      </div>

      <div className="max-w-md mx-auto px-4 py-6">
        {/* Greeting */}
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-1">Good day</h2>
        <p className="text-gray-600 dark:text-gray-400 mb-6">
          {new Date().toLocaleDateString('en-US', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric',
          })}
        </p>

        {/* Mood Score Card */}
        <div className="mb-6">
          <MoodScoreCard moodScore={todayMood} trend="stable" />
        </div>

        {/* Risk Level Badge */}
        <div className="mb-6">
          <RiskLevelBadge riskLevel={riskLevel} />
        </div>

        {/* Streak Tracker */}
        {user && <StreakTracker userId={user.id} />}

        {/* Quick Actions */}
        <div className="grid grid-cols-2 gap-3 mb-6">
          <Link
            href="/calendar"
            className="flex items-center justify-center gap-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-3 hover:bg-gray-50 dark:hover:bg-gray-700 transition"
          >
            <Calendar className="w-5 h-5 text-red-500" />
            <span className="text-sm font-semibold text-gray-900 dark:text-white">Calendar</span>
          </Link>
          <Link
            href="/mira"
            className="flex items-center justify-center gap-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-3 hover:bg-gray-50 dark:hover:bg-gray-700 transition"
          >
            <MessageCircle className="w-5 h-5 text-pink-500" />
            <span className="text-sm font-semibold text-gray-900 dark:text-white">Chat Mira</span>
          </Link>
        </div>

        {/* Today's Summary */}
        <Card className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 mb-6">
          <div className="p-6">
            <h3 className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-4">Today's Summary</h3>
            {recentLogs.length > 0 ? (
              <div className="space-y-4">
                {recentLogs.slice(0, 2).map((log, idx) => (
                  <div key={idx} className="flex items-start gap-4 pb-4 border-b border-gray-200 dark:border-gray-700 last:border-0 last:pb-0">
                    <div className="text-3xl">{log.mood <= 3 ? '😢' : log.mood <= 5 ? '😕' : log.mood <= 7 ? '😐' : log.mood <= 9 ? '🙂' : '😊'}</div>
                    <div className="flex-1">
                      <p className="font-semibold text-gray-900 dark:text-white">{log.mood}/10 - {new Date(log.timestamp).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}</p>
                      {log.substances.length > 0 && (
                        <div className="flex flex-wrap gap-2 mt-2">
                          {log.substances.map((s) => (
                            <span key={s} className="text-xs bg-orange-100 dark:bg-orange-900 text-orange-700 dark:text-orange-200 px-2 py-1 rounded">
                              {s}
                            </span>
                          ))}
                        </div>
                      )}
                      {log.journal && <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">{log.journal.substring(0, 50)}...</p>}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-600 dark:text-gray-400">No mood logs yet. Start tracking your mood!</p>
            )}
            <Link
              href="/logs"
              className="mt-4 inline-block text-red-500 font-semibold text-sm hover:text-red-600 dark:text-red-400 dark:hover:text-red-300"
            >
              Log a mood entry →
            </Link>
          </div>
        </Card>

        {/* Report & Help CTAs */}
        <div className="grid grid-cols-2 gap-3 mb-6">
          <button
            onClick={() => downloadWeeklyReport()}
            className="flex items-center justify-center gap-2 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4 hover:bg-blue-100 dark:hover:bg-blue-900/30 transition text-center"
          >
            <FileText className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            <div>
              <p className="text-xs font-semibold text-blue-700 dark:text-blue-300">Weekly Report</p>
              <p className="text-xs text-blue-600 dark:text-blue-400">PDF Download</p>
            </div>
          </button>

          <Link
            href="/emergency"
            className="flex items-center justify-center gap-2 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4 hover:bg-red-100 dark:hover:bg-red-900/30 transition text-center"
          >
            <Heart className="w-5 h-5 text-red-600 dark:text-red-400" />
            <div>
              <p className="text-xs font-semibold text-red-700 dark:text-red-300">Need help?</p>
              <p className="text-xs text-red-600 dark:text-red-400">Crisis resources</p>
            </div>
          </Link>
        </div>
      </div>

      <BottomNav />
    </div>
  )
}
