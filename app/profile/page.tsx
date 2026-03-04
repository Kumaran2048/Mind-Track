'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { BottomNav } from '@/components/bottom-nav'
import { Card } from '@/components/ui/card'
import { Heart, LogOut, Mail, Shield } from 'lucide-react'

export default function ProfilePage() {
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [loggingOut, setLoggingOut] = useState(false)
  const [stats, setStats] = useState({
    totalLogs: 0,
    averageMood: 0,
    streakDays: 0,
  })
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    const loadProfile = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user) {
        router.push('/auth/login')
        return
      }

      setUser(user)

      // Fetch stats
      const { data: logs } = await supabase
        .from('mood_logs')
        .select('mood_score, created_at')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })

      if (logs && logs.length > 0) {
        const avgMood =
          logs.reduce((sum, log) => sum + log.mood_score, 0) / logs.length

        // Calculate streak
        let streak = 0
        let currentDate = new Date()
        const sortedByDate = [...logs].sort(
          (a, b) =>
            new Date(b.created_at).getTime() -
            new Date(a.created_at).getTime()
        )

        for (const log of sortedByDate) {
          const logDate = new Date(log.created_at)
          if (
            logDate.toDateString() === currentDate.toDateString() ||
            (currentDate.getTime() - logDate.getTime() <
              24 * 60 * 60 * 1000 &&
              logDate.toDateString() !==
                new Date(
                  currentDate.getTime() - 24 * 60 * 60 * 1000
                ).toDateString())
          ) {
            streak++
            currentDate = new Date(
              currentDate.getTime() - 24 * 60 * 60 * 1000
            )
          } else {
            break
          }
        }

        setStats({
          totalLogs: logs.length,
          averageMood: Math.round(avgMood * 10) / 10,
          streakDays: streak,
        })
      }

      setLoading(false)
    }

    loadProfile()
  }, [])

  const handleLogout = async () => {
    setLoggingOut(true)
    await supabase.auth.signOut()
    router.push('/auth/login')
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <Heart className="w-12 h-12 text-red-500 fill-red-500 animate-pulse" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-white pb-32">
      {/* Header */}
      <div className="bg-gradient-to-r from-red-50 to-orange-50 border-b border-gray-200">
        <div className="max-w-md mx-auto px-4 py-4">
          <h1 className="text-xl font-bold text-gray-900">Profile</h1>
        </div>
      </div>

      <div className="max-w-md mx-auto px-4 py-6">
        {/* User Info Card */}
        <Card className="bg-gradient-to-r from-red-50 to-orange-50 border border-red-200 mb-6">
          <div className="p-6">
            <div className="flex items-center gap-4 mb-4">
              <div className="w-12 h-12 bg-red-500 rounded-full flex items-center justify-center">
                <Heart className="w-6 h-6 text-white fill-white" />
              </div>
              <div>
                <p className="font-semibold text-gray-900">
                  {user?.email}
                </p>
                <p className="text-xs text-gray-600">
                  Member since{' '}
                  {new Date(user?.created_at).toLocaleDateString('en-US', {
                    month: 'short',
                    year: 'numeric',
                  })}
                </p>
              </div>
            </div>
          </div>
        </Card>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-3 mb-6">
          <Card className="bg-white border border-gray-200">
            <div className="p-4 text-center">
              <p className="text-2xl font-bold text-red-500">
                {stats.totalLogs}
              </p>
              <p className="text-xs text-gray-600 mt-1">Mood Logs</p>
            </div>
          </Card>
          <Card className="bg-white border border-gray-200">
            <div className="p-4 text-center">
              <p className="text-2xl font-bold text-orange-500">
                {stats.averageMood}
              </p>
              <p className="text-xs text-gray-600 mt-1">Avg Mood</p>
            </div>
          </Card>
          <Card className="bg-white border border-gray-200">
            <div className="p-4 text-center">
              <p className="text-2xl font-bold text-green-500">
                {stats.streakDays}
              </p>
              <p className="text-xs text-gray-600 mt-1">Day Streak</p>
            </div>
          </Card>
        </div>

        {/* Account Settings */}
        <h2 className="text-lg font-bold text-gray-900 mb-4">Account</h2>

        <Card className="bg-white border border-gray-200 mb-4">
          <div className="p-4 flex items-center gap-3">
            <Mail className="w-5 h-5 text-gray-400" />
            <div className="flex-1">
              <p className="text-sm text-gray-600">Email Address</p>
              <p className="font-medium text-gray-900">{user?.email}</p>
            </div>
          </div>
        </Card>

        <Card className="bg-white border border-gray-200 mb-6">
          <div className="p-4 flex items-center gap-3">
            <Shield className="w-5 h-5 text-gray-400" />
            <div className="flex-1">
              <p className="text-sm text-gray-600">Password</p>
              <p className="font-medium text-gray-900">••••••••</p>
            </div>
            <button className="text-red-500 text-sm font-semibold hover:text-red-600">
              Change
            </button>
          </div>
        </Card>

        {/* About */}
        <h2 className="text-lg font-bold text-gray-900 mb-4">About MindTrack</h2>

        <Card className="bg-white border border-gray-200 mb-6">
          <div className="p-6 text-center">
            <Heart className="w-10 h-10 text-red-500 fill-red-500 mx-auto mb-3" />
            <p className="font-bold text-gray-900 mb-2">MindTrack v1.0</p>
            <p className="text-sm text-gray-600 mb-4">
              A mental wellness app designed to help you track your mood and
              understand patterns in your emotional health.
            </p>
            <p className="text-xs text-gray-500">
              This app is for self-awareness only and is not a substitute for
              professional mental health care.
            </p>
          </div>
        </Card>

        {/* Logout */}
        <button
          onClick={handleLogout}
          disabled={loggingOut}
          className="w-full flex items-center justify-center gap-2 bg-red-50 hover:bg-red-100 text-red-600 font-semibold py-3 rounded-lg transition border border-red-200 disabled:opacity-50"
        >
          <LogOut className="w-5 h-5" />
          {loggingOut ? 'Signing out...' : 'Sign Out'}
        </button>
      </div>

      <BottomNav />
    </div>
  )
}
