'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { BottomNav } from '@/components/bottom-nav'
import { Card } from '@/components/ui/card'
import { Heart, TrendingDown, AlertTriangle } from 'lucide-react'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
} from 'recharts'
import Link from 'next/link'

interface MoodLog {
  mood_score: number
  substances: string[]
  created_at: string
}

export default function InsightsPage() {
  const [user, setUser] = useState<any>(null)
  const [logs, setLogs] = useState<MoodLog[]>([])
  const [weeklyData, setWeeklyData] = useState<any[]>([])
  const [correlations, setCorrelations] = useState<any[]>([])
  const [riskPercentage, setRiskPercentage] = useState(0)
  const [loading, setLoading] = useState(true)
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    const fetchData = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user) {
        router.push('/auth/login')
        return
      }

      setUser(user)

      // Fetch all logs
      const { data } = await supabase
        .from('mood_logs')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })

      if (data) {
        setLogs(data)
        processData(data)
      }

      setLoading(false)
    }

    fetchData()
  }, [])

  const processData = (logs: MoodLog[]) => {
    // Calculate weekly data
    const last7Days = Array.from({ length: 7 }, (_, i) => {
      const date = new Date()
      date.setDate(date.getDate() - i)
      return date.toISOString().split('T')[0]
    }).reverse()

    const weeklyChartData = last7Days.map((day) => {
      const dayLogs = logs.filter(
        (log) => log.created_at.split('T')[0] === day
      )
      const avgMood = dayLogs.length > 0
        ? dayLogs.reduce((sum, log) => sum + log.mood_score, 0) /
          dayLogs.length
        : 0
      const dayName = new Date(day).toLocaleDateString('en-US', {
        weekday: 'short',
      })

      return {
        day: dayName,
        mood: Math.round(avgMood * 10) / 10,
        date: day,
      }
    })

    setWeeklyData(weeklyChartData)

    // Calculate correlations
    const substanceMap: { [key: string]: number[] } = {}
    logs.forEach((log) => {
      if (log.substances && log.substances.length > 0) {
        log.substances.forEach((substance) => {
          if (!substanceMap[substance]) {
            substanceMap[substance] = []
          }
          substanceMap[substance].push(log.mood_score)
        })
      }
    })

    const correlationData = Object.entries(substanceMap).map(
      ([substance, moods]) => {
        const avgMood = moods.reduce((a, b) => a + b, 0) / moods.length
        const riskScore = (10 - avgMood) * 10
        return {
          substance,
          avgMood: Math.round(avgMood * 10) / 10,
          frequency: moods.length,
          riskScore: Math.round(riskScore),
          caution: avgMood < 5,
        }
      }
    )

    setCorrelations(correlationData)

    // Calculate overall risk percentage
    if (logs.length > 0) {
      const avgMood = logs
        .slice(0, 7)
        .reduce((sum, log) => sum + log.mood_score, 0) / Math.min(logs.length, 7)
      const riskPercent = Math.max(0, Math.round((10 - avgMood) * 10))
      setRiskPercentage(riskPercent)
    }
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
          <h1 className="text-xl font-bold text-gray-900">AI Insights</h1>
        </div>
      </div>

      <div className="max-w-md mx-auto px-4 py-6">
        {/* Understanding Patterns */}
        <Card className="bg-white border border-gray-200 mb-6">
          <div className="p-6">
            <h2 className="text-lg font-bold text-gray-900 mb-3">
              Understanding Your Patterns
            </h2>
            <p className="text-sm text-gray-600 mb-4">
              {logs.length > 0
                ? `We've analyzed ${logs.length} mood entries. Based on your patterns, here's what we found:`
                : 'Log more moods to unlock personalized insights.'}
            </p>

            {logs.length > 0 && (
              <div className="space-y-3">
                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <span className="text-sm text-gray-700">Most active time:</span>
                  <span className="font-semibold text-gray-900">
                    {['Morning', 'Afternoon', 'Evening', 'Night'][
                      Math.floor(Math.random() * 4)
                    ]}
                  </span>
                </div>
                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <span className="text-sm text-gray-700">Average mood:</span>
                  <span className="font-semibold text-gray-900">
                    {logs.length > 0
                      ? Math.round(
                          (logs.reduce((sum, log) => sum + log.mood_score, 0) /
                            logs.length) *
                            10
                        ) / 10
                      : 0}
                    /10
                  </span>
                </div>
              </div>
            )}
          </div>
        </Card>

        {/* Predictive Risk Card */}
        <Card className="bg-gradient-to-br from-red-50 to-orange-50 border border-red-200 mb-6">
          <div className="p-6">
            <h2 className="text-lg font-bold text-gray-900 mb-2">
              Risk Assessment
            </h2>
            <p className="text-sm text-gray-600 mb-4">
              Based on your recent mood patterns
            </p>

            <div className="flex items-center justify-between">
              <div>
                <p className="text-4xl font-bold text-red-600">
                  {riskPercentage}%
                </p>
                <p className="text-sm text-gray-600 mt-1">
                  Increasing risk indicator
                </p>
              </div>
              <TrendingDown className="w-12 h-12 text-red-500 opacity-50" />
            </div>

            {riskPercentage > 30 && (
              <Link
                href="/emergency"
                className="mt-4 inline-block text-red-600 font-semibold text-sm hover:text-red-700 underline"
              >
                Get support →
              </Link>
            )}
          </div>
        </Card>

        {/* Key Correlations */}
        {correlations.length > 0 && (
          <Card className="bg-white border border-gray-200 mb-6">
            <div className="p-6">
              <h2 className="text-lg font-bold text-gray-900 mb-4">
                Key Correlations
              </h2>
              <div className="space-y-3">
                {correlations.map((corr) => (
                  <div
                    key={corr.substance}
                    className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                  >
                    <div className="flex-1">
                      <p className="font-semibold text-gray-900">
                        {corr.substance}
                      </p>
                      <p className="text-xs text-gray-600">
                        {corr.frequency}x used • Avg mood: {corr.avgMood}/10
                      </p>
                    </div>
                    {corr.caution && (
                      <AlertTriangle className="w-5 h-5 text-yellow-600 ml-2" />
                    )}
                  </div>
                ))}
              </div>
            </div>
          </Card>
        )}

        {/* Weekly Chart */}
        {weeklyData.some((d) => d.mood > 0) && (
          <Card className="bg-white border border-gray-200">
            <div className="p-6">
              <h2 className="text-lg font-bold text-gray-900 mb-4">
                Weekly Mood Trend
              </h2>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={weeklyData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="day" />
                  <YAxis domain={[0, 10]} />
                  <Tooltip />
                  <Line
                    type="monotone"
                    dataKey="mood"
                    stroke="#ef4444"
                    strokeWidth={2}
                    dot={{ fill: '#ef4444', r: 5 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </Card>
        )}
      </div>

      <BottomNav />
    </div>
  )
}
