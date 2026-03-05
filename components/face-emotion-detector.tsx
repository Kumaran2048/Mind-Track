'use client'

import { useEffect, useRef, useState } from 'react'
import { Camera, CameraOff, RefreshCw, Smile } from 'lucide-react'

// Maps detected expressions to mood scores (0-10)
const EMOTION_TO_MOOD: Record<string, number> = {
    happy: 9,
    surprised: 7,
    neutral: 6,
    disgusted: 3,
    fearful: 2,
    sad: 2,
    angry: 1,
}

const EMOTION_LABELS: Record<string, string> = {
    happy: '😄 Happy',
    surprised: '😮 Surprised',
    neutral: '😐 Neutral',
    disgusted: '😒 Disgusted',
    fearful: '😨 Fearful',
    sad: '😢 Sad',
    angry: '😠 Angry',
    fallback_neutral: '⚠️ Neutral (Fallback Mode)',
}

interface FaceEmotionDetectorProps {
    onEmotionDetected: (mood: number, emotion: string, imageBase64?: string | null) => void
}

export default function FaceEmotionDetector({ onEmotionDetected }: FaceEmotionDetectorProps) {
    const videoRef = useRef<HTMLVideoElement>(null)
    const canvasRef = useRef<HTMLCanvasElement>(null)
    const streamRef = useRef<MediaStream | null>(null)
    const intervalRef = useRef<any>(null)
    const faceDetectorRef = useRef<any>(null)

    const [isActive, setIsActive] = useState(false)
    const [isLoading, setIsLoading] = useState(false)
    const [detectedEmotion, setDetectedEmotion] = useState<string | null>(null)
    const [confidence, setConfidence] = useState(0)
    const [error, setError] = useState('')
    const [faceApiLoaded, setFaceApiLoaded] = useState(false)

    useEffect(() => {
        // Dynamically load face-api.js only on client
        let faceapi: any = null
        const loadFaceApi = async () => {
            try {
                faceapi = await import('face-api.js')
                await faceapi.nets.tinyFaceDetector.loadFromUri('/models')
                await faceapi.nets.faceExpressionNet.loadFromUri('/models')
                setFaceApiLoaded(true)
                    ; (window as any).__faceapi = faceapi
            } catch (e) {
                console.warn('face-api model load failed, using fallback mode')
                setFaceApiLoaded(false)
            }
        }
        loadFaceApi()

        return () => {
            stopCamera()
        }
    }, [])

    const startCamera = async () => {
        setIsLoading(true)
        setError('')
        try {
            const stream = await navigator.mediaDevices.getUserMedia({
                video: { facingMode: 'user', width: 320, height: 240 }
            })
            streamRef.current = stream
            setIsActive(true)

            // Wait for React to render the video element
            setTimeout(async () => {
                if (videoRef.current && streamRef.current) {
                    videoRef.current.srcObject = streamRef.current
                    try {
                        await videoRef.current.play()
                    } catch (e) {
                        console.error("Video playback failed:", e)
                    }
                }

                setIsLoading(false)

                if (faceApiLoaded) {
                    startDetection()
                } else {
                    // Fallback: simulate emotion detection after 2 seconds
                    setIsLoading(true)
                    setTimeout(() => {
                        setIsLoading(false)
                        setDetectedEmotion('fallback_neutral')
                        setConfidence(1.0)

                        let fallbackImageBase64 = null
                        if (videoRef.current) {
                            const canvas = document.createElement('canvas')
                            const video = videoRef.current
                            canvas.width = video.videoWidth || 320
                            canvas.height = video.videoHeight || 240
                            const ctx = canvas.getContext('2d')
                            if (ctx) {
                                ctx.drawImage(video, 0, 0, canvas.width, canvas.height)
                                fallbackImageBase64 = canvas.toDataURL('image/jpeg', 0.8)
                            }
                        }

                        onEmotionDetected(6, 'fallback_neutral', fallbackImageBase64)
                    }, 2500)
                }
            }, 50)
        } catch (err: any) {
            setIsLoading(false)
            setError('Camera access denied. Please allow camera permissions and try again.')
        }
    }

    const startDetection = () => {
        const faceapi = (window as any).__faceapi
        if (!faceapi || !videoRef.current) return

        intervalRef.current = setInterval(async () => {
            const video = videoRef.current
            if (!video || video.readyState !== 4) return

            try {
                const detections = await faceapi
                    .detectAllFaces(video, new faceapi.TinyFaceDetectorOptions())
                    .withFaceExpressions()

                if (detections && detections.length > 0) {
                    const expressions = detections[0].expressions
                    const topEmotion = Object.keys(expressions).reduce((a, b) =>
                        expressions[a] > expressions[b] ? a : b
                    )
                    const conf = expressions[topEmotion]

                    setDetectedEmotion(topEmotion)
                    setConfidence(conf)

                    if (conf > 0.5) {
                        const moodScore = EMOTION_TO_MOOD[topEmotion] ?? 5

                        let imageBase64 = null
                        if (videoRef.current) {
                            const canvas = document.createElement('canvas')
                            const video = videoRef.current
                            canvas.width = video.videoWidth || 320
                            canvas.height = video.videoHeight || 240
                            const ctx = canvas.getContext('2d')
                            if (ctx) {
                                ctx.drawImage(video, 0, 0, canvas.width, canvas.height)
                                imageBase64 = canvas.toDataURL('image/jpeg', 0.8)
                            }
                        }

                        onEmotionDetected(moodScore, topEmotion, imageBase64)
                    }
                }
            } catch (e) {
                // Silent fail during detection
            }
        }, 1500)
    }

    const stopCamera = () => {
        if (intervalRef.current) clearInterval(intervalRef.current)
        if (streamRef.current) {
            streamRef.current.getTracks().forEach(t => t.stop())
            streamRef.current = null
        }
        setIsActive(false)
        setDetectedEmotion(null)
    }

    const retryDetection = () => {
        stopCamera()
        setTimeout(startCamera, 300)
    }

    return (
        <div className="rounded-xl border-2 border-dashed border-purple-200 dark:border-purple-800 bg-purple-50 dark:bg-purple-900/10 p-4">
            <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                    <Smile className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                    <span className="text-sm font-semibold text-purple-700 dark:text-purple-300">
                        Auto Emotion Detection
                    </span>
                    <span className="text-xs bg-purple-100 dark:bg-purple-800 text-purple-600 dark:text-purple-300 px-2 py-0.5 rounded-full font-medium">
                        AI
                    </span>
                </div>
                {isActive && (
                    <button
                        type="button"
                        onClick={retryDetection}
                        className="text-purple-500 hover:text-purple-700 transition"
                        title="Retry detection"
                    >
                        <RefreshCw className="w-4 h-4" />
                    </button>
                )}
            </div>

            {!isActive ? (
                <div className="text-center py-3">
                    <p className="text-xs text-gray-500 dark:text-gray-400 mb-3">
                        Let the camera detect your emotion and auto-fill your mood score
                    </p>
                    <button
                        type="button"
                        onClick={startCamera}
                        disabled={isLoading}
                        className="flex items-center gap-2 mx-auto bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition disabled:opacity-50"
                    >
                        {isLoading ? (
                            <RefreshCw className="w-4 h-4 animate-spin" />
                        ) : (
                            <Camera className="w-4 h-4" />
                        )}
                        {isLoading ? 'Loading...' : 'Detect My Emotion'}
                    </button>
                </div>
            ) : (
                <div className="space-y-3">
                    {/* Camera preview */}
                    <div className="relative rounded-lg overflow-hidden bg-black aspect-video max-h-40">
                        <video
                            ref={videoRef}
                            className="w-full h-full object-cover"
                            autoPlay
                            muted
                            playsInline
                        />
                        <canvas ref={canvasRef} className="absolute inset-0 w-full h-full" />

                        {/* Scanning overlay */}
                        {!detectedEmotion && (
                            <div className="absolute inset-0 flex items-center justify-center">
                                <div className="border-2 border-purple-400 rounded-lg w-20 h-24 animate-pulse opacity-70" />
                            </div>
                        )}
                    </div>

                    {/* Detected Emotion Result */}
                    {detectedEmotion ? (
                        <div className="flex items-center justify-between bg-white dark:bg-gray-800 rounded-lg px-3 py-2 border border-purple-100 dark:border-purple-700">
                            <div>
                                <p className="text-xs text-gray-500 dark:text-gray-400">Detected emotion</p>
                                <p className="text-sm font-bold text-gray-900 dark:text-white">
                                    {EMOTION_LABELS[detectedEmotion] ?? detectedEmotion}
                                </p>
                            </div>
                            <div className="text-right">
                                <p className="text-xs text-gray-500 dark:text-gray-400">Confidence</p>
                                <p className="text-sm font-bold text-purple-600 dark:text-purple-400">
                                    {Math.round(confidence * 100)}%
                                </p>
                            </div>
                        </div>
                    ) : (
                        <p className="text-xs text-center text-gray-500 dark:text-gray-400 animate-pulse">
                            Scanning your face... look at the camera
                        </p>
                    )}

                    {/* Stop button */}
                    <button
                        type="button"
                        onClick={stopCamera}
                        className="w-full flex items-center justify-center gap-2 text-xs text-gray-500 hover:text-red-500 transition py-1"
                    >
                        <CameraOff className="w-3 h-3" />
                        Stop camera
                    </button>
                </div>
            )}

            {error && (
                <p className="text-xs text-red-500 mt-2">{error}</p>
            )}
        </div>
    )
}
