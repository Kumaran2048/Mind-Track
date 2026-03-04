'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { BottomNav } from '@/components/bottom-nav'
import { Card } from '@/components/ui/card'
import { Heart, Search, Filter, X } from 'lucide-react'
import Link from 'next/link'

interface MoodLog {
  id: string
  mood_score: number
  substances: string[]
  time_of_day: string
  journal_text: string
  created_at: string
}

const FILTER_OPTIONS = ['All', 'Last 7 Days', 'Alcohol', 'Caffeine', 'Nicotine', 'Cannabis']

export default function HistoryPage() {
  const [user, setUser] = useState<any>(null)
  const [logs, setLogs] = useState<MoodLog[]>([])
  const [filteredLogs, setFilteredLogs] = useState<MoodLog[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  const [activeFilters, setActiveFilters] = useState<string[]>(['All'])
  const [loading, setLoading] = useState(true)
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    const fetchLogs = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user) {
        router.push('/auth/login')
        return
      }

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

  const applyFilters = (query: string, filters: string[]) => {
    let results = [...logs]

    // Apply date filter
    if (filters.includes('Last 7 Days')) {
      const sevenDaysAgo = new Date()
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)
      results = results.filter(
        (log) => new Date(log.created_at) >= sevenDaysAgo
      )
    }

    // Apply substance filters
    const substanceFilters = filters.filter(
      (f) => ['Alcohol', 'Caffeine', 'Nicotine', 'Cannabis'].includes(f)
    )
    if (substanceFilters.length > 0) {
      results = results.filter((log) =>
        substanceFilters.some((f) => log.substances?.includes(f))
      )
    }

    // Apply search query
    if (query.trim()) {
      results = results.filter(
        (log) =>
          log.journal_text?.toLowerCase().includes(query.toLowerCase()) ||
          log.mood_score.toString().includes(query)
      )
    }

    setFilteredLogs(results)
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
      if (newFilters.length === 0) {
        newFilters = ['All']
      }
    }

    setActiveFilters(newFilters)
    applyFilters(searchQuery, newFilters)
  }

  const handleSearch = (query: string) => {
    setSearchQuery(query)
    applyFilters(query, activeFilters)
  }

  const getMoodEmoji = (score: number) => {
    if (score <= 3) return '😢'
    if (score <= 5) return '😕'
    if (score <= 7) return '😐'
    if (score <= 9) return '🙂'
    return '😊'
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <Heart className="w-12 h-12 text-red-500 fill-red-500 animate-pulse" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-32">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-md mx-auto px-4 py-4">
          <h1 className="text-xl font-bold text-gray-900 mb-4">Your History</h1>

          {/* Search Bar */}
          <div className="relative mb-4">
            <Search className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => handleSearch(e.target.value)}
              placeholder="Search notes, moods..."
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
            />
          </div>

          {/* Filters */}
          <div className="flex flex-wrap gap-2">
            {FILTER_OPTIONS.map((filter) => (
              <button
                key={filter}
                onClick={() => toggleFilter(filter)}
                className={`px-3 py-1 rounded-full text-sm font-medium transition ${
                  activeFilters.includes(filter)
                    ? 'bg-red-500 text-white'
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
              >
                {filter}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="max-w-md mx-auto px-4 py-6">
        {filteredLogs.length > 0 ? (
          <div className="space-y-4">
            {filteredLogs.map((log) => (
              <Card
                key={log.id}
                className="bg-white border border-gray-200 overflow-hidden hover:shadow-md transition"
              >
                <div className="p-4">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div className="text-3xl">
                        {getMoodEmoji(log.mood_score)}
                      </div>
                      <div>
                        <p className="font-semibold text-gray-900">
                          {log.mood_score}/10
                        </p>
                        <p className="text-xs text-gray-600">
                          {new Date(log.created_at).toLocaleDateString('en-US', {
                            month: 'short',
                            day: 'numeric',
                            hour: 'numeric',
                            minute: '2-digit',
                          })}
                        </p>
                      </div>
                    </div>
                    <span className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded">
                      {log.time_of_day}
                    </span>
                  </div>

                  {log.substances && log.substances.length > 0 && (
                    <div className="flex flex-wrap gap-2 mb-3">
                      {log.substances.map((substance) => (
                        <span
                          key={substance}
                          className="text-xs bg-orange-100 text-orange-700 px-2 py-1 rounded font-medium"
                        >
                          {substance}
                        </span>
                      ))}
                    </div>
                  )}

                  {log.journal_text && (
                    <p className="text-sm text-gray-600 line-clamp-2">
                      {log.journal_text}
                    </p>
                  )}
                </div>
              </Card>
            ))}
          </div>
        ) : (
          <Card className="bg-white border border-gray-200 text-center py-12">
            <Heart className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-600 mb-4">No logs found</p>
            <Link
              href="/logs"
              className="text-red-500 font-semibold hover:text-red-600"
            >
              Start logging your mood
            </Link>
          </Card>
        )}
      </div>

      <BottomNav />
    </div>
  )
}
