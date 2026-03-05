'use client'

import { useState, useEffect, useRef, lazy, Suspense } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { BottomNav } from '@/components/bottom-nav'
import { Card } from '@/components/ui/card'
import { Heart, Check, ArrowLeft, Mic, MicOff, Smile } from 'lucide-react'
import Link from 'next/link'
import { useLanguage } from '@/components/language-provider'

const FaceEmotionDetector = lazy(() => import('@/components/face-emotion-detector'))

const SUBSTANCES = ['Alcohol', 'Caffeine', 'Nicotine', 'Cannabis']
const TIMES = ['Morning', 'Afternoon', 'Evening', 'Night']

export default function LogsPage() {
  const [user, setUser] = useState<any>(null)
  const [moodScore, setMoodScore] = useState(7)
  const [detectedEmotion, setDetectedEmotion] = useState<string | null>(null)
  const [showFaceDetector, setShowFaceDetector] = useState(false)
  useEffect(() => { moodScoreRef.current = moodScore }, [moodScore])
  const [substances, setSubstances] = useState<string[]>([])
  const [quantity, setQuantity] = useState('')
  const [timeOfDay, setTimeOfDay] = useState('Afternoon')
  const [journal, setJournal] = useState('')
  const [faceImageBase64, setFaceImageBase64] = useState<string | null>(null)
  const faceImageRef = useRef<string | null>(null)
  const journalRef = useRef('')  // Ref to track journal for use inside speech callbacks
  const userRef = useRef<any>(null)
  const moodScoreRef = useRef(7)
  const substancesRef = useRef<string[]>([])
  const quantityRef = useRef('')
  const timeOfDayRef = useRef('Afternoon')
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [success, setSuccess] = useState(false)

  // Voice Journal States
  const [isRecording, setIsRecording] = useState(false)
  const [liveTranscript, setLiveTranscript] = useState('')
  const [voiceSupported, setVoiceSupported] = useState(false)
  const [voiceError, setVoiceError] = useState('')
  const recognitionRef = useRef<any>(null)

  const router = useRouter()
  const supabase = createClient()
  const { t, language } = useLanguage()

  useEffect(() => {
    const checkAuth = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/auth/login'); return }
      setUser(user)
      userRef.current = user  // keep ref in sync
      setLoading(false)
    }
    checkAuth()

    // Check if Speech Recognition is supported
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition
    if (SpeechRecognition) {
      setVoiceSupported(true)
    }
  }, [])

  // Keep all refs in sync with state so voice commands use latest values
  useEffect(() => { substancesRef.current = substances }, [substances])
  useEffect(() => { quantityRef.current = quantity }, [quantity])
  useEffect(() => { timeOfDayRef.current = timeOfDay }, [timeOfDay])
  useEffect(() => { journalRef.current = journal }, [journal])
  useEffect(() => { faceImageRef.current = faceImageBase64 }, [faceImageBase64])

  const uploadFaceImage = async (userId: string, imageBase64: string | null) => {
    if (!imageBase64) return null
    try {
      const res = await fetch(imageBase64)
      const blob = await res.blob()
      const fileName = `${userId}/${Date.now()}.jpg`
      const { data, error } = await supabase.storage
        .from('mood_images')
        .upload(fileName, blob, { contentType: 'image/jpeg' })

      if (!error && data) {
        const { data: publicUrlData } = supabase.storage
          .from('mood_images')
          .getPublicUrl(fileName)
        return publicUrlData.publicUrl
      }
    } catch (err) {
      console.error("Failed to upload face image:", err)
    }
    return null
  }

  const startRecording = async () => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition
    if (!SpeechRecognition) return

    setVoiceError('') // Clear any previous error

    // Step 1: Explicitly request microphone permission
    // This triggers the browser's native popup if not yet granted
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      // Stop the stream immediately - we just needed the permission
      stream.getTracks().forEach(track => track.stop())
    } catch (err: any) {
      if (err.name === 'NotAllowedError') {
        setVoiceError('❌ Microphone access was denied. Please click the 🔒 icon near the browser URL bar, set Microphone to "Allow", then refresh the page.')
      } else {
        setVoiceError('❌ Could not access microphone: ' + err.message)
      }
      return
    }

    const recognition = new SpeechRecognition()
    recognition.continuous = true
    recognition.interimResults = true
    recognition.lang = language === 'ta' ? 'ta-IN' : 'en-US'

    recognition.onstart = () => {
      setIsRecording(true)
      setLiveTranscript('')
    }

    recognition.onresult = (event: any) => {
      let interimText = ''
      let finalText = ''

      for (let i = event.resultIndex; i < event.results.length; i++) {
        const transcript = event.results[i][0].transcript
        if (event.results[i].isFinal) {
          finalText += transcript + ' '
        } else {
          interimText += transcript
        }
      }

      if (finalText) {
        const lower = finalText.trim().toLowerCase()

        // Voice command: "stop" -> stop recording
        if (lower === 'stop.' || lower === 'stop' || lower === 'நிறுத்து.' || lower === 'நிறுத்து') {
          console.log('[Voice] "stop/நிறுத்து" command detected')
          stopRecording()
          return
        }

        // Voice command: "done" -> save the mood entry
        if (lower === 'done.' || lower === 'done' || lower === 'முடிந்தது.' || lower === 'முடிந்தது') {
          console.log('[Voice] "done/முடிந்தது" command detected — auto submitting')
          stopRecording()
          submitByVoice()
          return
        }

        // Otherwise append the transcribed text to the journal
        const updated = journalRef.current + finalText
        journalRef.current = updated
        setJournal(updated)
        setLiveTranscript(interimText)
      } else {
        setLiveTranscript(interimText)
      }
    }

    recognition.onerror = (event: any) => {
      console.error('Speech recognition error:', event.error)
      if (event.error === 'not-allowed') {
        setVoiceError('🔒 Microphone blocked. Click the 🔒 icon in your browser address bar and allow microphone access, then try again.')
      } else if (event.error === 'no-speech') {
        setVoiceError('No speech detected. Please try again.')
      } else {
        setVoiceError(`Voice error: ${event.error}. Please try again.`)
      }
      setIsRecording(false)
      setLiveTranscript('')
    }

    recognition.onend = () => {
      setIsRecording(false)
      setLiveTranscript('')
    }

    recognitionRef.current = recognition
    recognition.start()
  }

  const stopRecording = () => {
    if (recognitionRef.current) {
      recognitionRef.current.stop()
      recognitionRef.current = null
    }
    setIsRecording(false)
    setLiveTranscript('')
  }

  // Called when user says "done" — submits the form hands-free
  const submitByVoice = async () => {
    if (!userRef.current) return
    setSubmitting(true)

    // Upload image if it exists
    const face_image_url = await uploadFaceImage(userRef.current.id, faceImageRef.current)

    const { error } = await supabase.from('mood_logs').insert({
      user_id: userRef.current.id,
      mood_score: moodScoreRef.current,
      substances: substancesRef.current,
      quantity: quantityRef.current || null,
      time_of_day: timeOfDayRef.current,
      journal_text: journalRef.current,
      face_image_url: face_image_url
    })
    setSubmitting(false)
    if (!error) {
      setSuccess(true)
      setTimeout(() => { router.push('/dashboard') }, 2000)
    }
  }

  const toggleRecording = () => {
    if (isRecording) {
      stopRecording()
    } else {
      startRecording()
    }
  }

  const toggleSubstance = (substance: string) => {
    setSubstances((prev) =>
      prev.includes(substance)
        ? prev.filter((s) => s !== substance)
        : [...prev, substance]
    )
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    // Stop recording if still active
    if (isRecording) stopRecording()
    if (!user) return

    setSubmitting(true)

    // Upload image if it exists
    const face_image_url = await uploadFaceImage(user.id, faceImageBase64)

    const { error } = await supabase.from('mood_logs').insert({
      user_id: user.id,
      mood_score: moodScore,
      substances: substances,
      quantity: quantity || null,
      time_of_day: timeOfDay,
      journal_text: journal,
      face_image_url: face_image_url
    })

    setSubmitting(false)

    if (error) {
      console.error('Error logging mood:', error)
    } else {
      // Trigger alert check (fire-and-forget)
      fetch('/api/alert', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user.id }),
      }).catch(() => { }) // Silent fail if no email configured yet

      setSuccess(true)
      setTimeout(() => { router.push('/dashboard') }, 2000)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background dark:bg-gray-950">
        <Heart className="w-12 h-12 text-red-500 fill-red-500 animate-pulse" />
      </div>
    )
  }

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background dark:bg-gray-950 pb-20">
        <div className="text-center">
          <div className="mb-4 flex justify-center">
            <Check className="w-16 h-16 text-green-500" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">{t('moodLogged')}</h2>
          <p className="text-gray-600 dark:text-gray-400">{t('redirecting')}</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background dark:bg-gray-950 pb-32">
      {/* Header */}
      <div className="bg-gradient-to-r from-red-50 to-orange-50 dark:from-gray-800 dark:to-gray-900 border-b border-gray-200 dark:border-gray-700 sticky top-0 z-10">
        <div className="max-w-md mx-auto px-4 py-4 flex items-center gap-3">
          <Link href="/dashboard" className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition">
            <ArrowLeft className="w-5 h-5 text-gray-600 dark:text-gray-400" />
          </Link>
          <h1 className="text-xl font-bold text-gray-900 dark:text-white">{t('logYourMood')}</h1>
        </div>
      </div>

      <div className="max-w-md mx-auto px-4 py-6">
        <form onSubmit={handleSubmit} className="space-y-6" suppressHydrationWarning>

          {/* 📸 Facial Emotion Detection */}
          <Card className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
            <div className="p-4">
              <div className="flex items-center justify-between mb-3">
                <div>
                  <h3 className="text-sm font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                    <Smile className="w-4 h-4 text-purple-500" />
                    {t('emotionDetection')}
                  </h3>
                  <p className="text-xs text-gray-500 dark:text-gray-400">{t('letAiDetect')}</p>
                </div>
                <button
                  type="button"
                  onClick={() => setShowFaceDetector(!showFaceDetector)}
                  className={`text-xs px-3 py-1.5 rounded-full font-medium transition ${showFaceDetector
                    ? 'bg-purple-100 dark:bg-purple-900/40 text-purple-700 dark:text-purple-300'
                    : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-purple-50 hover:text-purple-600'
                    }`}
                >
                  {showFaceDetector ? t('hideCamera') : t('openCamera')}
                </button>
              </div>
              {detectedEmotion && (
                <div className="mb-2 px-3 py-1.5 bg-purple-50 dark:bg-purple-900/20 rounded-lg text-xs text-purple-700 dark:text-purple-300 font-medium">
                  {t('emotionDetected')}
                </div>
              )}
              {showFaceDetector && (
                <Suspense fallback={<div className="text-center py-4 text-sm text-gray-400">{t('loadingCamera')}</div>}>
                  <FaceEmotionDetector
                    onEmotionDetected={(mood, emotion, imageBase64) => {
                      setMoodScore(mood)
                      setDetectedEmotion(emotion)
                      if (imageBase64) {
                        setFaceImageBase64(imageBase64)
                      }
                      setShowFaceDetector(false)
                    }}
                  />
                </Suspense>
              )}
            </div>
          </Card>

          {/* Mood Score Slider */}
          <Card className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
            <div className="p-6">
              <label className="block text-sm font-semibold text-gray-900 dark:text-white mb-4">
                {t('howsYourMood')}
              </label>
              <div className="flex justify-between items-end gap-4">
                <div className="text-4xl">
                  {moodScore <= 3 ? '😢' : moodScore <= 5 ? '😕' : moodScore <= 7 ? '😐' : moodScore <= 9 ? '🙂' : '😊'}
                </div>
                <div className="flex-1">
                  <input
                    type="range"
                    min="1"
                    max="10"
                    value={moodScore}
                    onChange={(e) => setMoodScore(Number(e.target.value))}
                    className="w-full h-2 bg-gray-300 rounded-lg appearance-none cursor-pointer accent-red-500"
                    suppressHydrationWarning
                  />
                  <div className="mt-2 text-center">
                    <span className="text-2xl font-bold text-gray-900 dark:text-white">{moodScore}</span>
                    <span className="text-gray-600 dark:text-gray-400">/10</span>
                  </div>
                </div>
              </div>
            </div>
          </Card>

          {/* Substances */}
          <Card className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
            <div className="p-6">
              <label className="block text-sm font-semibold text-gray-900 dark:text-white mb-4">
                {t('substancesUsed')}
              </label>
              <div className="grid grid-cols-2 gap-3">
                {SUBSTANCES.map((substance) => (
                  <button
                    key={substance}
                    type="button"
                    onClick={() => toggleSubstance(substance)}
                    className={`p-3 rounded-lg border-2 font-medium transition text-sm ${substances.includes(substance)
                      ? 'bg-red-50 dark:bg-red-900/30 border-red-500 text-red-700 dark:text-red-300'
                      : 'bg-white dark:bg-gray-700 border-gray-200 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:border-gray-300 dark:hover:border-gray-500'
                      }`}
                  >
                    {t(substance)}
                  </button>
                ))}
              </div>
            </div>
          </Card>

          {/* Quantity */}
          {substances.length > 0 && (
            <Card className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
              <div className="p-6">
                <label className="block text-sm font-semibold text-gray-900 dark:text-white mb-2">
                  {t('quantityOpt')}
                </label>
                <input
                  type="text"
                  value={quantity}
                  onChange={(e) => setQuantity(e.target.value)}
                  placeholder="e.g., 2 drinks, 3 cups of coffee"
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
                  suppressHydrationWarning
                />
              </div>
            </Card>
          )}

          {/* Time of Day */}
          <Card className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
            <div className="p-6">
              <label className="block text-sm font-semibold text-gray-900 dark:text-white mb-4">
                {t('timeOfDay')}
              </label>
              <div className="grid grid-cols-2 gap-3">
                {TIMES.map((time) => (
                  <button
                    key={time}
                    type="button"
                    onClick={() => setTimeOfDay(time)}
                    className={`p-3 rounded-lg border-2 font-medium transition text-sm ${timeOfDay === time
                      ? 'bg-red-50 dark:bg-red-900/30 border-red-500 text-red-700 dark:text-red-300'
                      : 'bg-white dark:bg-gray-700 border-gray-200 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:border-gray-300 dark:hover:border-gray-500'
                      }`}
                  >
                    {t(time)}
                  </button>
                ))}
              </div>
            </div>
          </Card>

          {/* Journal with Voice Input */}
          <Card className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
            <div className="p-6">
              <div className="flex items-center justify-between mb-2">
                <label className="block text-sm font-semibold text-gray-900 dark:text-white">
                  {t('notesOpt')}
                </label>

                {/* Voice Journal Button */}
                {voiceSupported && (
                  <button
                    type="button"
                    onClick={toggleRecording}
                    title={isRecording ? 'Stop recording' : 'Start voice journal'}
                    className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold transition-all ${isRecording
                      ? 'bg-red-500 text-white shadow-lg shadow-red-300 dark:shadow-red-900'
                      : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-red-50 dark:hover:bg-red-900/30 hover:text-red-600'
                      }`}
                  >
                    {/* Pulsing red dot when recording */}
                    {isRecording && (
                      <span className="relative flex h-2 w-2">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-2 w-2 bg-white"></span>
                      </span>
                    )}
                    {isRecording ? (
                      <>
                        <MicOff className="w-3.5 h-3.5" />
                        {t('stop')}
                      </>
                    ) : (
                      <>
                        <Mic className="w-3.5 h-3.5" />
                        {t('voice')}
                      </>
                    )}
                  </button>
                )}
              </div>

              {/* Live Transcription Display */}
              {isRecording && (
                <div className="mb-3 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center gap-2">
                      <span className="relative flex h-2 w-2">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-500 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span>
                      </span>
                      <span className="text-xs font-semibold text-red-600 dark:text-red-400">{t('recordingSpeak')}</span>
                    </div>
                  </div>
                  <p className="text-sm text-red-700 dark:text-red-300 italic min-h-[20px] mb-2">
                    {liveTranscript || '...'}
                  </p>
                  <div className="flex gap-3 text-xs text-red-500 dark:text-red-400 border-t border-red-200 dark:border-red-700 pt-2 mt-1">
                    <span>💾 {t('sayDone')}</span>
                    <span>⏹️ {t('sayStop')}</span>
                  </div>
                </div>
              )}

              {/* Voice Error Message */}
              {voiceError && !isRecording && (
                <div className="mb-3 p-3 bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800 rounded-lg">
                  <p className="text-sm text-orange-700 dark:text-orange-300">{voiceError}</p>
                </div>
              )}

              <textarea
                value={journal}
                onChange={(e) => setJournal(e.target.value)}
                placeholder={voiceSupported ? t('voiceJournalPlaceholder') : t('normalPlaceholder')}
                rows={4}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 resize-none"
                suppressHydrationWarning
              />

              {!voiceSupported && (
                <p className="mt-1 text-xs text-gray-400 dark:text-gray-500">
                  {t('voiceNotSupported')}
                </p>
              )}
            </div>
          </Card>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={submitting}
            className="w-full bg-red-500 dark:bg-red-600 hover:bg-red-600 dark:hover:bg-red-700 text-white font-semibold py-3 rounded-lg transition disabled:opacity-50"
            suppressHydrationWarning
          >
            {submitting ? t('saving') : t('saveMoodEntry')}
          </button>
        </form>
      </div>

      <BottomNav />
    </div>
  )
}
