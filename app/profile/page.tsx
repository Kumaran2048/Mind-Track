'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { BottomNav } from '@/components/bottom-nav'
import { Card } from '@/components/ui/card'
import { Heart, LogOut, Mail, Shield, UserCheck, Check, AlertTriangle, Globe } from 'lucide-react'
import { useLanguage } from '@/components/language-provider'

export default function ProfilePage() {
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [loggingOut, setLoggingOut] = useState(false)
  const [stats, setStats] = useState({ totalLogs: 0, averageMood: 0, streakDays: 0 })

  // Trusted Contact State
  const [trustedEmail, setTrustedEmail] = useState('')
  const [trustedName, setTrustedName] = useState('')
  const [savingContact, setSavingContact] = useState(false)
  const [contactSaved, setContactSaved] = useState(false)

  const router = useRouter()
  const supabase = createClient()
  const { language, setLanguage, t } = useLanguage()

  useEffect(() => {
    const loadProfile = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/auth/login'); return }
      setUser(user)

      // Fetch mood stats
      const { data: logs } = await supabase
        .from('mood_logs')
        .select('mood_score, created_at')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })

      if (logs && logs.length > 0) {
        const avgMood = logs.reduce((sum, log) => sum + log.mood_score, 0) / logs.length
        let streak = 0
        let currentDate = new Date()
        const sorted = [...logs].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
        for (const log of sorted) {
          const logDate = new Date(log.created_at)
          if (logDate.toDateString() === currentDate.toDateString() ||
            (currentDate.getTime() - logDate.getTime() < 24 * 60 * 60 * 1000 &&
              logDate.toDateString() !== new Date(currentDate.getTime() - 24 * 60 * 60 * 1000).toDateString())) {
            streak++
            currentDate = new Date(currentDate.getTime() - 24 * 60 * 60 * 1000)
          } else break
        }
        setStats({ totalLogs: logs.length, averageMood: Math.round(avgMood * 10) / 10, streakDays: streak })
      }

      // Fetch existing trusted contact
      const { data: profile } = await supabase
        .from('profiles')
        .select('trusted_contact_email, trusted_contact_name')
        .eq('id', user.id)
        .single()

      if (profile) {
        setTrustedEmail(profile.trusted_contact_email || '')
        setTrustedName(profile.trusted_contact_name || '')
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

  const saveTrustedContact = async () => {
    if (!user || !trustedEmail) return
    setSavingContact(true)
    const { error } = await supabase
      .from('profiles')
      .upsert({
        id: user.id,
        trusted_contact_email: trustedEmail,
        trusted_contact_name: trustedName,
      })
    setSavingContact(false)
    if (!error) {
      setContactSaved(true)
      setTimeout(() => setContactSaved(false), 3000)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white dark:bg-gray-950">
        <Heart className="w-12 h-12 text-red-500 fill-red-500 animate-pulse" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-white dark:bg-gray-950 pb-32">
      {/* Header */}
      <div className="bg-gradient-to-r from-red-50 to-orange-50 dark:from-gray-800 dark:to-gray-900 border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-md mx-auto px-4 py-4">
          <h1 className="text-xl font-bold text-gray-900 dark:text-white">Profile</h1>
        </div>
      </div>

      <div className="max-w-md mx-auto px-4 py-6 space-y-6">
        {/* User Info Card */}
        <Card className="bg-gradient-to-r from-red-50 to-orange-50 dark:from-gray-800 dark:to-gray-700 border border-red-200 dark:border-gray-600">
          <div className="p-6 flex items-center gap-4">
            <div className="w-12 h-12 bg-red-500 rounded-full flex items-center justify-center">
              <Heart className="w-6 h-6 text-white fill-white" />
            </div>
            <div>
              <p className="font-semibold text-gray-900 dark:text-white">{user?.email}</p>
              <p className="text-xs text-gray-600 dark:text-gray-400">
                Member since {new Date(user?.created_at).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}
              </p>
            </div>
          </div>
        </Card>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-3">
          <Card className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
            <div className="p-4 text-center">
              <p className="text-2xl font-bold text-red-500">{stats.totalLogs}</p>
              <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">Mood Logs</p>
            </div>
          </Card>
          <Card className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
            <div className="p-4 text-center">
              <p className="text-2xl font-bold text-orange-500">{stats.averageMood}</p>
              <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">Avg Mood</p>
            </div>
          </Card>
          <Card className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
            <div className="p-4 text-center">
              <p className="text-2xl font-bold text-green-500">{stats.streakDays}</p>
              <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">Day Streak</p>
            </div>
          </Card>
        </div>

        {/* 🌍 Language Preferences */}
        <div>
          <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
            <Globe className="w-5 h-5 text-indigo-500" />
            {t('languageSettings')}
          </h2>
          <Card className="bg-indigo-50 dark:bg-indigo-900/10 border border-indigo-200 dark:border-indigo-800 p-5">
            <div className="flex gap-4">
              <button
                onClick={() => setLanguage('en')}
                className={`flex-1 py-2 px-4 rounded-lg font-semibold transition text-sm ${language === 'en' ? 'bg-indigo-500 text-white' : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-gray-700'}`}
              >
                English
              </button>
              <button
                onClick={() => setLanguage('ta')}
                className={`flex-1 py-2 px-4 rounded-lg font-semibold transition text-sm ${language === 'ta' ? 'bg-indigo-500 text-white' : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-gray-700'}`}
              >
                தமிழ் (Tamil)
              </button>
            </div>
          </Card>
        </div>

        {/* 🆘 Trusted Contact / Alert System */}
        <div>
          <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-orange-500" />
            {t('parentGuardianAlert')}
          </h2>
          <Card className="bg-orange-50 dark:bg-orange-900/10 border border-orange-200 dark:border-orange-800">
            <div className="p-5 space-y-4">
              <div className="flex items-start gap-3">
                <UserCheck className="w-5 h-5 text-orange-600 dark:text-orange-400 mt-0.5 flex-shrink-0" />
                <p className="text-sm text-orange-800 dark:text-orange-300">
                  {t('trustedContactInfo')}
                </p>
              </div>

              <div className="space-y-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                    {t('trustedContactName')}
                  </label>
                  <input
                    type="text"
                    value={trustedName}
                    onChange={e => setTrustedName(e.target.value)}
                    placeholder="e.g. Mom, Dad, Guardian"
                    className="w-full px-3 py-2 text-sm border border-orange-200 dark:border-orange-700 bg-white dark:bg-gray-800 dark:text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-400"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                    {t('trustedContactEmail')}
                  </label>
                  <input
                    type="email"
                    value={trustedEmail}
                    onChange={e => setTrustedEmail(e.target.value)}
                    placeholder="parent@example.com"
                    className="w-full px-3 py-2 text-sm border border-orange-200 dark:border-orange-700 bg-white dark:bg-gray-800 dark:text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-400"
                  />
                </div>

                <button
                  onClick={saveTrustedContact}
                  disabled={savingContact || !trustedEmail}
                  className="w-full flex items-center justify-center gap-2 bg-orange-500 hover:bg-orange-600 text-white font-semibold py-2.5 rounded-lg transition disabled:opacity-50 text-sm"
                >
                  {contactSaved ? (
                    <><Check className="w-4 h-4" /> {t('contactSaved')}</>
                  ) : savingContact ? (
                    t('saving')
                  ) : (
                    <><UserCheck className="w-4 h-4" /> {t('saveTrustedContact')}</>
                  )}
                </button>
              </div>

              {trustedEmail && !contactSaved && (
                <p className="text-xs text-orange-600 dark:text-orange-400 text-center">
                  ✅ Currently alerting: <strong>{trustedName || trustedEmail}</strong>
                </p>
              )}
            </div>
          </Card>
        </div>

        {/* Account Settings */}
        <div>
          <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-3">Account</h2>
          <div className="space-y-3">
            <Card className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
              <div className="p-4 flex items-center gap-3">
                <Mail className="w-5 h-5 text-gray-400" />
                <div className="flex-1">
                  <p className="text-xs text-gray-500 dark:text-gray-400">Email Address</p>
                  <p className="font-medium text-gray-900 dark:text-white">{user?.email}</p>
                </div>
              </div>
            </Card>
            <Card className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
              <div className="p-4 flex items-center gap-3">
                <Shield className="w-5 h-5 text-gray-400" />
                <div className="flex-1">
                  <p className="text-xs text-gray-500 dark:text-gray-400">Password</p>
                  <p className="font-medium text-gray-900 dark:text-white">••••••••</p>
                </div>
              </div>
            </Card>
          </div>
        </div>

        {/* About */}
        <div>
          <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-3">About MindTrack</h2>
          <Card className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
            <div className="p-6 text-center">
              <Heart className="w-10 h-10 text-red-500 fill-red-500 mx-auto mb-3" />
              <p className="font-bold text-gray-900 dark:text-white mb-2">MindTrack v1.0</p>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                A mental wellness app designed to help you track your mood and understand patterns in your emotional health.
              </p>
              <p className="text-xs text-gray-400 dark:text-gray-500">
                This app is for self-awareness only and is not a substitute for professional mental health care.
              </p>
            </div>
          </Card>
        </div>

        <button
          onClick={handleLogout}
          disabled={loggingOut}
          className="w-full flex items-center justify-center gap-2 bg-red-50 dark:bg-red-900/20 hover:bg-red-100 text-red-600 dark:text-red-400 font-semibold py-3 rounded-lg transition border border-red-200 dark:border-red-800 disabled:opacity-50"
        >
          <LogOut className="w-5 h-5" />
          {loggingOut ? t('signingOut') : t('signOut')}
        </button>
      </div>

      <BottomNav />
    </div>
  )
}
