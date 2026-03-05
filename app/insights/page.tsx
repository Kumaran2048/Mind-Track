'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { BottomNav } from '@/components/bottom-nav'
import { Heart, FileText, AlertTriangle } from 'lucide-react'
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
  const [riskLabel, setRiskLabel] = useState<'Low' | 'Medium' | 'High'>('Low')
  const [riskFactors, setRiskFactors] = useState<string[]>([])
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
    // Weekly bar data
    const last7Days = Array.from({ length: 7 }, (_, i) => {
      const date = new Date()
      date.setDate(date.getDate() - i)
      return date.toISOString().split('T')[0]
    }).reverse()

    const weeklyChartData = last7Days.map((day) => {
      const dayLogs = logs.filter((log) => log.created_at.split('T')[0] === day)
      const avgMood =
        dayLogs.length > 0
          ? dayLogs.reduce((sum, log) => sum + log.mood_score, 0) / dayLogs.length
          : 0
      return {
        day: new Date(day).toLocaleDateString('en-US', { weekday: 'short' }),
        mood: Math.round(avgMood * 10) / 10,
      }
    })

    setWeeklyData(weeklyChartData)

    // Risk score trend (simulate 7-day scores scaled 0-60)
    const riskTrend = last7Days.map((day) => {
      const dayLogs = logs.filter((log) => log.created_at.split('T')[0] === day)
      const avgMood =
        dayLogs.length > 0
          ? dayLogs.reduce((sum, log) => sum + log.mood_score, 0) / dayLogs.length
          : 5
      const riskScore = Math.max(0, Math.round((10 - avgMood) * 6))
      return {
        day: new Date(day).toLocaleDateString('en-US', { weekday: 'short' }),
        risk: riskScore,
      }
    })

    // Substance correlations → risk factors
    const substanceMap: { [key: string]: number[] } = {}
    logs.forEach((log) => {
      if (log.substances && log.substances.length > 0) {
        log.substances.forEach((substance) => {
          if (!substanceMap[substance]) substanceMap[substance] = []
          substanceMap[substance].push(log.mood_score)
        })
      }
    })

    const correlationData = Object.entries(substanceMap).map(([substance, moods]) => {
      const avgMood = moods.reduce((a, b) => a + b, 0) / moods.length
      return {
        substance,
        avgMood: Math.round(avgMood * 10) / 10,
        frequency: moods.length,
        riskScore: Math.round((10 - avgMood) * 10),
        caution: avgMood < 5,
      }
    })

    setCorrelations(correlationData)

    // Overall risk
    if (logs.length > 0) {
      const avgMood =
        logs.slice(0, 7).reduce((sum, log) => sum + log.mood_score, 0) / Math.min(logs.length, 7)
      const riskPercent = Math.max(0, Math.round((10 - avgMood) * 10))
      setRiskPercentage(riskPercent)
      setRiskLabel(riskPercent < 30 ? 'Low' : riskPercent < 60 ? 'Medium' : 'High')

      // Derive risk factors from high-frequency substances with low mood correlation
      const factors = correlationData
        .filter((c) => c.caution)
        .map((c) => `High ${c.substance.toLowerCase()}`)
      if (avgMood < 5) factors.unshift('Irregular sleep')
      setRiskFactors(factors.slice(0, 3))
    }
  }

  const riskColors: Record<string, { dot: string; badge: string; text: string }> = {
    Low: { dot: 'bg-green-500', badge: 'bg-green-50 text-green-700 border border-green-200', text: 'text-green-600' },
    Medium: { dot: 'bg-orange-500', badge: 'bg-orange-50 text-orange-700 border border-orange-200', text: 'text-orange-600' },
    High: { dot: 'bg-red-500', badge: 'bg-red-50 text-red-700 border border-red-200', text: 'text-red-600' },
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-950">
        <Heart className="w-12 h-12 text-red-500 fill-red-500 animate-pulse" />
      </div>
    )
  }

  const colors = riskColors[riskLabel]

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 pb-32">
      {/* Header */}
      <div className="bg-white dark:bg-gray-900 border-b border-gray-100 dark:border-gray-800 sticky top-0 z-10">
        <div className="max-w-md mx-auto px-4 py-4 flex items-center justify-between">
          <h1 className="text-lg font-bold text-gray-900 dark:text-white">Insights</h1>
          <button
            onClick={async () => {
              const response = await fetch('/api/generate-report', { method: 'POST' })
              const json = await response.json()
              if (!json.html) return alert('Failed to generate report')
              const win = window.open('', '_blank')
              if (win) { win.document.write(json.html); win.document.close() }
            }}
            className="flex items-center gap-1.5 text-xs font-semibold text-gray-600 dark:text-gray-300 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 px-3 py-1.5 rounded-lg transition"
          >
            <FileText className="w-3.5 h-3.5" />
            Full Report
          </button>
        </div>
      </div>

      <div className="max-w-md mx-auto px-4 py-5 space-y-4">

        {/* AI Risk Assessment */}
        <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm p-4">
          <p className="text-sm font-bold text-gray-900 dark:text-white mb-3">AI Risk Assessment</p>
          <div className="flex items-center gap-2 mb-3">
            <span className={`inline-flex items-center gap-1.5 text-sm font-semibold px-3 py-1 rounded-full ${colors.badge}`}>
              <span className={`w-2 h-2 rounded-full ${colors.dot}`} />
              {riskLabel} &nbsp;—&nbsp; {riskPercentage}
            </span>
          </div>
          {riskFactors.length > 0 && (
            <>
              <p className="text-xs text-gray-500 mb-2">Identified Risk Factors:</p>
              <div className="flex flex-wrap gap-2">
                {riskFactors.map((factor, i) => (
                  <span
                    key={i}
                    className="inline-flex items-center gap-1 text-xs font-medium px-2.5 py-1 rounded-full bg-yellow-50 text-yellow-800 border border-yellow-200"
                  >
                    <AlertTriangle className="w-3 h-3" />
                    {factor}
                  </span>
                ))}
              </div>
            </>
          )}
          {logs.length === 0 && (
            <p className="text-xs text-gray-400 dark:text-gray-500 mt-2">Log more moods to unlock personalized insights.</p>
          )}
        </div>

        {/* Risk Score Trend */}
        <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm p-4">
          <p className="text-sm font-bold text-gray-900 dark:text-white mb-4">Risk Score Trend</p>
          <ResponsiveContainer width="100%" height={180}>
            <LineChart
              data={weeklyData.map((d, i) => ({
                day: d.day,
                risk: Math.max(0, Math.round((10 - (d.mood || 5)) * 6)),
              }))}
              margin={{ top: 4, right: 8, bottom: 0, left: -20 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
              <XAxis dataKey="day" tick={{ fontSize: 11, fill: '#9ca3af' }} axisLine={false} tickLine={false} />
              <YAxis domain={[0, 60]} tick={{ fontSize: 11, fill: '#9ca3af' }} axisLine={false} tickLine={false} />
              <Tooltip
                contentStyle={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: 8, fontSize: 12 }}
              />
              <Line
                type="monotone"
                dataKey="risk"
                stroke="#ef4444"
                strokeWidth={2}
                dot={{ fill: '#ef4444', r: 3, strokeWidth: 0 }}
                activeDot={{ r: 5 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Mood History (7 Days) */}
        <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm p-4">
          <p className="text-sm font-bold text-gray-900 dark:text-white mb-4">Mood History (7 Days)</p>
          <ResponsiveContainer width="100%" height={180}>
            <BarChart data={weeklyData} margin={{ top: 4, right: 8, bottom: 0, left: -20 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" vertical={false} />
              <XAxis dataKey="day" tick={{ fontSize: 11, fill: '#9ca3af' }} axisLine={false} tickLine={false} />
              <YAxis domain={[0, 10]} tick={{ fontSize: 11, fill: '#9ca3af' }} axisLine={false} tickLine={false} />
              <Tooltip
                contentStyle={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: 8, fontSize: 12 }}
              />
              <Bar dataKey="mood" fill="#3b82f6" radius={[4, 4, 0, 0]} maxBarSize={36} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Key Correlations (only if data exists) */}
        {correlations.length > 0 && (
          <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm p-4">
            <p className="text-sm font-bold text-gray-900 dark:text-white mb-3">Key Correlations</p>
            <div className="space-y-2">
              {correlations.map((corr) => (
                <div
                  key={corr.substance}
                  className="flex items-center justify-between px-3 py-2.5 bg-gray-50 dark:bg-gray-800 rounded-xl"
                >
                  <div>
                    <p className="text-sm font-semibold text-gray-800 dark:text-white">{corr.substance}</p>
                    <p className="text-xs text-gray-400 dark:text-gray-500">{corr.frequency}x used · Avg mood: {corr.avgMood}/10</p>
                  </div>
                  {corr.caution && (
                    <AlertTriangle className="w-4 h-4 text-yellow-500 ml-2 flex-shrink-0" />
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Calendar CTA */}
        <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm">
          <Link
            href="/calendar"
            className="flex items-center justify-between px-4 py-4 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition rounded-2xl"
          >
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-gray-100 dark:bg-gray-800 rounded-lg flex items-center justify-center">
                <svg className="w-4 h-4 text-gray-500 dark:text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
              <div>
                <p className="text-sm font-semibold text-gray-900 dark:text-white">Mood Calendar</p>
                <p className="text-xs text-gray-400 dark:text-gray-500">View your 90-day mood heatmap</p>
              </div>
            </div>
            <svg className="w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </Link>
        </div>

      </div>

      <BottomNav />
    </div>
  )
}
