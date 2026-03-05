'use client'

import { useEffect, useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { BottomNav } from '@/components/bottom-nav'
import { MoodScoreCard } from '@/components/mood-score-card'
import { RiskLevelBadge } from '@/components/risk-level-badge'
import { StreakTracker } from '@/components/streak-tracker'
import { Card } from '@/components/ui/card'
import { Heart, LogOut, Calendar, MessageCircle, FileText, Search, ChevronDown } from 'lucide-react'
import Link from 'next/link'
import { useLanguage } from '@/components/language-provider'

interface MoodLog {
  id: string
  mood: number
  substances: string[]
  timestamp: string
  journal: string
  face_image_url: string | null
}

export default function DashboardPage() {
  const [user, setUser] = useState<any>(null)
  const [todayMood, setTodayMood] = useState(7)
  const [riskLevel, setRiskLevel] = useState<'low' | 'medium' | 'high'>('low')
  const [recentLogs, setRecentLogs] = useState<MoodLog[]>([])
  const [expandedLogId, setExpandedLogId] = useState<string | null>(null)
  const [dateFilter, setDateFilter] = useState('')
  const [visibleCount, setVisibleCount] = useState(5)
  const [loading, setLoading] = useState(true)
  const [mounted, setMounted] = useState(false)
  const router = useRouter()
  const supabase = createClient()
  const isInitializing = useRef(false)
  const { t } = useLanguage()

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
          .limit(100)

        if (recentData) {
          setRecentLogs(
            recentData.map((log: any) => ({
              id: log.id,
              mood: log.mood_score,
              substances: log.substances || [],
              timestamp: log.created_at,
              journal: log.journal_text || '',
              face_image_url: log.face_image_url || null,
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
      const json = await response.json()

      if (!response.ok || !json.html) {
        alert(`Failed to generate report: ${json.error || 'Unknown error'}`)
        return
      }

      // Inject a print button into the HTML and open it in a new window
      const htmlWithPrint = json.html.replace(
        '</body>',
        `<div style="position:fixed;top:16px;right:16px;z-index:9999;display:flex;gap:8px;">
           <button onclick="window.print()" style="background:#ef4444;color:#fff;border:none;padding:10px 20px;border-radius:8px;font-size:14px;font-weight:600;cursor:pointer;">
             🖨️ Save as PDF / Print
           </button>
           <button onclick="window.close()" style="background:#6b7280;color:#fff;border:none;padding:10px 16px;border-radius:8px;font-size:14px;font-weight:600;cursor:pointer;">
             ✕ Close
           </button>
         </div>
         <style>@media print { button { display:none !important; } }</style>
        </body>`
      )

      const win = window.open('', '_blank')
      if (win) {
        win.document.write(htmlWithPrint)
        win.document.close()
      } else {
        alert('Pop-up was blocked. Please allow pop-ups for this site and try again.')
      }
    } catch (error) {
      console.log('[v0] Error downloading report:', error)
      alert('Failed to generate report. Please try again.')
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
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-1">{t('good_day')}</h2>
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
            <span className="text-sm font-semibold text-gray-900 dark:text-white">{t('calendar_cta')}</span>
          </Link>
          <Link
            href="/mira"
            className="flex items-center justify-center gap-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-3 hover:bg-gray-50 dark:hover:bg-gray-700 transition"
          >
            <MessageCircle className="w-5 h-5 text-pink-500" />
            <span className="text-sm font-semibold text-gray-900 dark:text-white">{t('chat_mira')}</span>
          </Link>
        </div>

        {/* Today's Summary */}
        <Card className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 mb-6">
          <div className="p-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
              <h3 className="text-sm font-medium text-gray-600 dark:text-gray-400">{t('todays_summary')}</h3>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="date"
                  value={dateFilter}
                  onChange={(e) => {
                    setDateFilter(e.target.value)
                    setVisibleCount(5) // Reset visible count on search
                  }}
                  className="w-full sm:w-auto pl-9 pr-4 py-2 border border-gray-200 dark:border-gray-700 dark:bg-gray-800 rounded-lg text-sm text-gray-700 dark:text-gray-300 focus:outline-none focus:ring-2 focus:ring-red-500"
                  aria-label={t('search_by_date')}
                />
              </div>
            </div>
            {(() => {
              const filteredLogs = dateFilter
                ? recentLogs.filter((log) => log.timestamp.startsWith(dateFilter))
                : recentLogs

              return filteredLogs.length > 0 ? (
                <>
                  <div className="space-y-4">
                    {filteredLogs.slice(0, visibleCount).map((log) => (
                      <div key={log.id} className="pb-4 border-b border-gray-200 dark:border-gray-700 last:border-0 last:pb-0 pt-1">
                        <div
                          className="flex items-start gap-4 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700/50 p-2 -mx-2 rounded-lg transition"
                          onClick={() => setExpandedLogId(expandedLogId === log.id ? null : log.id)}
                        >
                          <div className="text-3xl">{log.mood <= 3 ? '😢' : log.mood <= 5 ? '😕' : log.mood <= 7 ? '😐' : log.mood <= 9 ? '🙂' : '😊'}</div>
                          <div className="flex-1">
                            <div className="flex justify-between items-start">
                              <p className="font-semibold text-gray-900 dark:text-white">{log.mood}/10 - {new Date(log.timestamp).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}</p>
                              <svg className={`w-4 h-4 text-gray-400 transition-transform ${expandedLogId === log.id ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                              </svg>
                            </div>
                            {expandedLogId !== log.id && (
                              <div className="mt-1">
                                {log.substances.length > 0 && <span className="text-xs text-orange-600 dark:text-orange-400 block font-medium">{t('substances_logged')}</span>}
                                {log.journal && <p className="text-sm text-gray-500 dark:text-gray-400 mt-1 truncate">{log.journal}</p>}
                              </div>
                            )}
                          </div>
                        </div>

                        {expandedLogId === log.id && (
                          <div className="mt-3 pl-14 pr-2 space-y-4 animate-in slide-in-from-top-2 duration-200">
                            {log.face_image_url && (
                              <div className="rounded-lg overflow-hidden border border-gray-200 dark:border-gray-700 bg-black/5">
                                <img src={log.face_image_url} alt="Face during entry" className="w-full h-auto object-cover max-h-48" />
                              </div>
                            )}
                            {log.substances.length > 0 && (
                              <div>
                                <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1.5 uppercase tracking-wider">Substances</p>
                                <div className="flex flex-wrap gap-2">
                                  {log.substances.map((s) => (
                                    <span key={s} className="text-xs bg-orange-100 dark:bg-orange-900 text-orange-700 dark:text-orange-200 px-2.5 py-1 rounded-full font-medium">
                                      {s}
                                    </span>
                                  ))}
                                </div>
                              </div>
                            )}
                            {log.journal && (
                              <div>
                                <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1.5 uppercase tracking-wider">{t('journal_note')}</p>
                                <p className="text-sm text-gray-700 dark:text-gray-300 bg-gray-50 dark:bg-gray-800/50 p-3 rounded-lg border border-gray-100 dark:border-gray-700">
                                  {log.journal}
                                </p>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                  {visibleCount < filteredLogs.length && (
                    <button
                      onClick={() => setVisibleCount((prev) => prev + 5)}
                      className="w-full mt-4 flex items-center justify-center gap-2 py-2 text-sm font-medium text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200 transition bg-gray-50 dark:bg-gray-800/50 rounded-lg border border-gray-100 dark:border-gray-700"
                    >
                      {t('show_more')} <ChevronDown className="w-4 h-4" />
                    </button>
                  )}
                </>
              ) : (
                <p className="text-gray-600 dark:text-gray-400">{t('no_logs')}</p>
              )
            })()}
            <Link
              href="/logs"
              className="mt-4 inline-block text-red-500 font-semibold text-sm hover:text-red-600 dark:text-red-400 dark:hover:text-red-300"
            >
              {t('log_entry_cta')}
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
              <p className="text-xs font-semibold text-blue-700 dark:text-blue-300">{t('weekly_report')}</p>
              <p className="text-xs text-blue-600 dark:text-blue-400">{t('pdf_download')}</p>
            </div>
          </button>

          <Link
            href="/emergency"
            className="flex items-center justify-center gap-2 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4 hover:bg-red-100 dark:hover:bg-red-900/30 transition text-center"
          >
            <Heart className="w-5 h-5 text-red-600 dark:text-red-400" />
            <div>
              <p className="text-xs font-semibold text-red-700 dark:text-red-300">{t('need_help')}</p>
              <p className="text-xs text-red-600 dark:text-red-400">{t('crisis_resources')}</p>
            </div>
          </Link>
        </div>
      </div>

      <BottomNav />
    </div>
  )
}
