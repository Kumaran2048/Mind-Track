'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { BottomNav } from '@/components/bottom-nav'
import { Heart, Search, ChevronDown } from 'lucide-react'
import Link from 'next/link'
import { useLanguage } from '@/components/language-provider'
import { ProgressiveBlur } from '@/components/ui/progressive-blur'
import { PixelImage } from '@/components/ui/pixel-image'

interface MoodLog {
  id: string
  mood_score: number
  substances: string[]
  time_of_day: string
  journal_text: string
  created_at: string
  face_image_url: string | null
}

const FILTER_OPTIONS = ['All', 'Last 7 Days', 'Alcohol', 'Caffeine', 'Nicotine', 'Cannabis']

export default function HistoryPage() {
  const [user, setUser] = useState<any>(null)
  const [logs, setLogs] = useState<MoodLog[]>([])
  const [filteredLogs, setFilteredLogs] = useState<MoodLog[]>([])
  const [dateFilter, setDateFilter] = useState('')
  const [activeFilters, setActiveFilters] = useState<string[]>(['All'])
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [visibleCount, setVisibleCount] = useState(10)
  const [loading, setLoading] = useState(true)
  const router = useRouter()
  const supabase = createClient()
  const { t } = useLanguage()

  useEffect(() => {
    const fetchLogs = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/auth/login'); return }
      setUser(user)

      const { data } = await supabase
        .from('mood_logs')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })

      if (data) {
        setLogs(data)
        setFilteredLogs(data)
      }
      setLoading(false)
    }
    fetchLogs()
  }, [])

  const applyFilters = (date: string, filters: string[]) => {
    let results = [...logs]

    if (date) {
      results = results.filter((log) => log.created_at.startsWith(date))
    }

    if (filters.includes('Last 7 Days')) {
      const cutoff = new Date()
      cutoff.setDate(cutoff.getDate() - 7)
      results = results.filter((log) => new Date(log.created_at) >= cutoff)
    }

    const substanceFilters = filters.filter((f) =>
      ['Alcohol', 'Caffeine', 'Nicotine', 'Cannabis'].includes(f)
    )
    if (substanceFilters.length > 0) {
      results = results.filter((log) =>
        substanceFilters.some((f) => log.substances?.includes(f))
      )
    }

    setFilteredLogs(results)
    setVisibleCount(10)
  }

  const toggleFilter = (filter: string) => {
    let newFilters = [...activeFilters]
    if (filter === 'All') {
      newFilters = ['All']
    } else {
      newFilters = newFilters.filter((f) => f !== 'All')
      if (newFilters.includes(filter)) {
        newFilters = newFilters.filter((f) => f !== filter)
      } else {
        newFilters.push(filter)
      }
      if (newFilters.length === 0) newFilters = ['All']
    }
    setActiveFilters(newFilters)
    applyFilters(dateFilter, newFilters)
  }

  const getMoodEmoji = (score: number) => {
    if (score <= 2) return '😢'
    if (score <= 4) return '😟'
    if (score <= 6) return '😐'
    if (score <= 8) return '🙂'
    return '😊'
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-950">
        <Heart className="w-12 h-12 text-red-500 fill-red-500 animate-pulse" />
      </div>
    )
  }

  const visible = filteredLogs.slice(0, visibleCount)

  return (
    <div className="min-h-screen bg-white dark:bg-gray-950 pb-32">
      {/* Sticky header */}
      <div className="bg-white dark:bg-gray-900 border-b border-gray-100 dark:border-gray-800 sticky top-0 z-10">
        <div className="max-w-md mx-auto px-4 pt-4 pb-3">
          {/* Title + Date search */}
          <div className="flex items-center justify-between gap-3 mb-3">
            <h1 className="text-base font-bold text-gray-800 dark:text-white">{t('todays_summary')}</h1>
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400 pointer-events-none" />
              <input
                type="date"
                value={dateFilter}
                onChange={(e) => {
                  setDateFilter(e.target.value)
                  applyFilters(e.target.value, activeFilters)
                }}
                className="pl-8 pr-3 py-1.5 border border-gray-200 dark:border-gray-700 rounded-xl text-xs text-gray-600 dark:text-gray-300 focus:outline-none focus:ring-2 focus:ring-red-400 bg-gray-50 dark:bg-gray-800 w-40"
                aria-label="Filter by date"
              />
            </div>
          </div>

          {/* Filter chips */}
          <div className="flex gap-1.5 overflow-x-auto pb-1 no-scrollbar">
            {FILTER_OPTIONS.map((filter) => (
              <button
                key={filter}
                onClick={() => toggleFilter(filter)}
                className={`flex-shrink-0 px-3 py-1 rounded-full text-xs font-medium transition ${activeFilters.includes(filter)
                  ? 'bg-red-500 text-white'
                  : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
                  }`}
              >
                {filter}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Log list */}
      <div className="max-w-md mx-auto relative">
        {visible.length > 0 ? (
          <div className="relative">
            {visible.map((log, idx) => (
              <div key={log.id}>
                {/* Row */}
                <div
                  className="flex items-start gap-3 px-4 py-4 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800/50 transition"
                  onClick={() => setExpandedId(expandedId === log.id ? null : log.id)}
                >
                  {/* Emoji */}
                  <span className="text-3xl flex-shrink-0 mt-0.5">{getMoodEmoji(log.mood_score)}</span>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <p className="font-bold text-gray-900 dark:text-white text-sm">
                        {log.mood_score}/10 &nbsp;—&nbsp;{' '}
                        {new Date(log.created_at).toLocaleTimeString('en-US', {
                          hour: 'numeric',
                          minute: '2-digit',
                        })}
                      </p>
                      <ChevronDown
                        className={`w-4 h-4 text-gray-400 flex-shrink-0 transition-transform duration-200 ${expandedId === log.id ? 'rotate-180' : ''
                          }`}
                      />
                    </div>

                    {/* Substances badge */}
                    {log.substances && log.substances.length > 0 && (
                      <p className="text-xs font-semibold text-red-500 mt-0.5">Substances logged</p>
                    )}

                    {/* Journal preview — only when collapsed */}
                    {expandedId !== log.id && log.journal_text && (
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5 truncate">{log.journal_text}</p>
                    )}
                  </div>
                </div>

                {/* Expanded detail */}
                {expandedId === log.id && (
                  <div className="px-4 pb-4 space-y-3 bg-gray-50 dark:bg-gray-800/40 border-t border-gray-100 dark:border-gray-700">
                    {/* Face image — pixel-reveal animation */}
                    {log.face_image_url && (
                      <div className="mt-3">
                        <PixelImage
                          src={log.face_image_url}
                          alt="Face during entry"
                          customGrid={{ rows: 4, cols: 6 }}
                          grayscaleAnimation
                          className="border border-gray-200 dark:border-gray-700"
                        />
                      </div>
                    )}

                    {/* Date + Time of Day */}
                    <div className="flex items-center gap-2 flex-wrap pt-1">
                      <span className="text-xs bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 px-2.5 py-1 rounded-full">
                        {new Date(log.created_at).toLocaleDateString('en-US', {
                          weekday: 'short', month: 'short', day: 'numeric',
                        })}
                      </span>
                      {log.time_of_day && (
                        <span className="text-xs bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 px-2.5 py-1 rounded-full">
                          {log.time_of_day}
                        </span>
                      )}
                    </div>

                    {/* Substance tags */}
                    {log.substances && log.substances.length > 0 && (
                      <div className="flex flex-wrap gap-2">
                        {log.substances.map((s) => (
                          <span
                            key={s}
                            className="text-xs bg-orange-100 dark:bg-orange-900/40 text-orange-700 dark:text-orange-300 px-2.5 py-1 rounded-full font-medium"
                          >
                            {s}
                          </span>
                        ))}
                      </div>
                    )}

                    {/* Journal */}
                    {log.journal_text && (
                      <div>
                        <p className="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-1">
                          {t('journal_note')}
                        </p>
                        <p className="text-sm text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-xl p-3 leading-relaxed">
                          {log.journal_text}
                        </p>
                      </div>
                    )}
                  </div>
                )}

                {/* Divider */}
                {idx < visible.length - 1 && (
                  <div className="h-px bg-gray-100 dark:bg-gray-800 mx-4" />
                )}
              </div>
            ))}

            {/* Show more */}
            {visibleCount < filteredLogs.length && (
              <div className="px-4 py-4">
                <button
                  onClick={() => setVisibleCount((p) => p + 10)}
                  className="w-full flex items-center justify-center gap-2 py-3 text-sm font-medium text-gray-600 dark:text-gray-300 bg-gray-50 dark:bg-gray-800/50 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 transition"
                >
                  {t('show_more')} <ChevronDown className="w-4 h-4" />
                </button>
              </div>
            )}
            {/* Soft bottom blur — hints more content below */}
            {visibleCount < filteredLogs.length && (
              <ProgressiveBlur position="bottom" height="100px" />
            )}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-20 px-4 text-center">
            <Heart className="w-12 h-12 text-gray-200 dark:text-gray-700 mb-4" />
            <p className="text-gray-500 dark:text-gray-400 mb-4">No mood logs found</p>
            <Link href="/logs" className="text-red-500 font-semibold text-sm hover:text-red-600">
              Start logging your mood →
            </Link>
          </div>
        )}
      </div>

      <BottomNav />
    </div>
  )
}
