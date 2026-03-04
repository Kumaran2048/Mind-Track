'use client'

import { useState, useRef, useEffect } from 'react'
import { Mic, Stop, Play, Trash2, Send } from 'lucide-react'
import { Card } from '@/components/ui/card'

interface VoiceRecorderProps {
  onSave: (audioBlob: Blob, duration: number) => void
  disabled?: boolean
}

export function VoiceJournalRecorder({ onSave, disabled }: VoiceRecorderProps) {
  const [isRecording, setIsRecording] = useState(false)
  const [recordedAudio, setRecordedAudio] = useState<Blob | null>(null)
  const [duration, setDuration] = useState(0)
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const chunksRef = useRef<Blob[]>([])
  const timerRef = useRef<NodeJS.Timeout | null>(null)

  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current)
    }
  }, [])

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      const mediaRecorder = new MediaRecorder(stream)
      chunksRef.current = []

      mediaRecorder.ondataavailable = (e) => {
        chunksRef.current.push(e.data)
      }

      mediaRecorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: 'audio/webm' })
        setRecordedAudio(blob)
        stream.getTracks().forEach((track) => track.stop())
      }

      mediaRecorderRef.current = mediaRecorder
      mediaRecorder.start()
      setIsRecording(true)
      setDuration(0)

      timerRef.current = setInterval(() => {
        setDuration((prev) => prev + 1)
      }, 1000)
    } catch (error) {
      console.log('[v0] Error accessing microphone:', error)
      alert('Unable to access microphone. Please check permissions.')
    }
  }

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop()
      setIsRecording(false)
      if (timerRef.current) clearInterval(timerRef.current)
    }
  }

  const clearRecording = () => {
    setRecordedAudio(null)
    setDuration(0)
  }

  const handleSave = () => {
    if (recordedAudio) {
      onSave(recordedAudio, duration)
      clearRecording()
    }
  }

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`
  }

  return (
    <Card className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 mb-6">
      <div className="p-6">
        <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
          <Mic className="w-4 h-4 text-red-500" />
          Voice Journal
        </h3>

        {!recordedAudio ? (
          <div className="space-y-4">
            {!isRecording ? (
              <button
                onClick={startRecording}
                disabled={disabled}
                className="w-full py-3 bg-red-500 hover:bg-red-600 dark:bg-red-600 dark:hover:bg-red-700 text-white rounded-lg font-semibold flex items-center justify-center gap-2 transition disabled:opacity-50"
              >
                <Mic className="w-5 h-5" />
                Start Recording
              </button>
            ) : (
              <div className="space-y-3">
                <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-3 text-center">
                  <div className="flex items-center justify-center gap-2 mb-2">
                    <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse"></div>
                    <span className="text-sm font-semibold text-red-700 dark:text-red-300">Recording...</span>
                  </div>
                  <p className="text-2xl font-bold text-red-600 dark:text-red-400">{formatTime(duration)}</p>
                </div>
                <button
                  onClick={stopRecording}
                  className="w-full py-3 bg-gray-300 hover:bg-gray-400 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-900 dark:text-white rounded-lg font-semibold flex items-center justify-center gap-2 transition"
                >
                  <Stop className="w-5 h-5" />
                  Stop Recording
                </button>
              </div>
            )}
          </div>
        ) : (
          <div className="space-y-3">
            <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-3">
              <p className="text-xs text-green-700 dark:text-green-300 mb-2">Recording saved</p>
              <p className="text-lg font-bold text-green-600 dark:text-green-400">{formatTime(duration)}</p>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={clearRecording}
                className="py-2 bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-900 dark:text-white rounded-lg font-semibold flex items-center justify-center gap-2 transition text-sm"
              >
                <Trash2 className="w-4 h-4" />
                Clear
              </button>
              <button
                onClick={handleSave}
                className="py-2 bg-green-500 hover:bg-green-600 dark:bg-green-600 dark:hover:bg-green-700 text-white rounded-lg font-semibold flex items-center justify-center gap-2 transition text-sm"
              >
                <Send className="w-4 h-4" />
                Save
              </button>
            </div>
          </div>
        )}
      </div>
    </Card>
  )
}
