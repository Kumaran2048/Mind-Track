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
        <div className="rounded-xl overflow-hidden border border-cyan-900/60 bg-[#041922]">
            {/* Top bar */}
            <div className="flex items-center justify-between px-4 py-2.5 border-b border-cyan-900/40">
                <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse shadow-[0_0_6px_#22d3ee]" />
                    <span className="text-xs font-mono font-bold text-cyan-400 tracking-widest uppercase">
                        AI Emotion Scanner
                    </span>
                </div>
                <div className="flex items-center gap-2">
                    <span className="text-xs font-mono text-cyan-600">v2.1</span>
                    {isActive && (
                        <button
                            type="button"
                            onClick={retryDetection}
                            className="text-cyan-500 hover:text-cyan-300 transition"
                            title="Retry"
                        >
                            <RefreshCw className="w-3.5 h-3.5" />
                        </button>
                    )}
                </div>
            </div>

            {!isActive ? (
                /* ── IDLE STATE ─────────────────────────────── */
                <div className="flex flex-col items-center justify-center py-10 gap-4 relative overflow-hidden">
                    {/* Background grid */}
                    <div
                        className="absolute inset-0 opacity-10"
                        style={{
                            backgroundImage: 'linear-gradient(#22d3ee 1px, transparent 1px), linear-gradient(90deg, #22d3ee 1px, transparent 1px)',
                            backgroundSize: '24px 24px',
                        }}
                    />

                    {/* Pulsing face icon */}
                    <div className="relative">
                        <div className="w-20 h-20 rounded-full border-2 border-dashed border-cyan-500/60 animate-[spin_12s_linear_infinite] flex items-center justify-center">
                            <div className="w-14 h-14 rounded-full border border-cyan-400/40 flex items-center justify-center">
                                <Smile className="w-8 h-8 text-cyan-400 opacity-80" />
                            </div>
                        </div>
                        {/* Corner brackets */}
                        <span className="absolute -top-1 -left-1 w-3 h-3 border-t-2 border-l-2 border-cyan-400" />
                        <span className="absolute -top-1 -right-1 w-3 h-3 border-t-2 border-r-2 border-cyan-400" />
                        <span className="absolute -bottom-1 -left-1 w-3 h-3 border-b-2 border-l-2 border-cyan-400" />
                        <span className="absolute -bottom-1 -right-1 w-3 h-3 border-b-2 border-r-2 border-cyan-400" />
                    </div>

                    <p className="text-xs font-mono text-cyan-600 text-center px-6 z-10">
                        AWAITING BIOMETRIC INPUT<br />
                        <span className="text-cyan-800">position face within frame</span>
                    </p>

                    <button
                        type="button"
                        onClick={startCamera}
                        disabled={isLoading}
                        className="z-10 flex items-center gap-2 border border-cyan-500 text-cyan-300 hover:bg-cyan-500/20 px-5 py-2 rounded font-mono text-xs font-bold tracking-widest uppercase transition disabled:opacity-40"
                    >
                        {isLoading ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Camera className="w-3.5 h-3.5" />}
                        {isLoading ? 'LOADING...' : 'INITIATE SCAN'}
                    </button>
                </div>
            ) : (
                /* ── ACTIVE / SCANNING STATE ────────────────── */
                <div className="space-y-0">
                    {/* Camera viewport with HUD overlays */}
                    <div className="relative bg-black overflow-hidden" style={{ aspectRatio: '4/3', maxHeight: 220 }}>
                        {/* Live video feed */}
                        <video
                            ref={videoRef}
                            className="w-full h-full object-cover opacity-80"
                            autoPlay muted playsInline
                        />
                        <canvas ref={canvasRef} className="absolute inset-0 w-full h-full" />

                        {/* Background grid */}
                        <div
                            className="absolute inset-0 pointer-events-none opacity-10"
                            style={{
                                backgroundImage: 'linear-gradient(#22d3ee 1px, transparent 1px), linear-gradient(90deg, #22d3ee 1px, transparent 1px)',
                                backgroundSize: '20px 20px',
                            }}
                        />

                        {/* Outer corner brackets */}
                        <span className="absolute top-2 left-2 w-5 h-5 border-t-2 border-l-2 border-cyan-400 shadow-[0_0_8px_#22d3ee]" />
                        <span className="absolute top-2 right-2 w-5 h-5 border-t-2 border-r-2 border-cyan-400 shadow-[0_0_8px_#22d3ee]" />
                        <span className="absolute bottom-2 left-2 w-5 h-5 border-b-2 border-l-2 border-cyan-400 shadow-[0_0_8px_#22d3ee]" />
                        <span className="absolute bottom-2 right-2 w-5 h-5 border-b-2 border-r-2 border-cyan-400 shadow-[0_0_8px_#22d3ee]" />

                        {/* Face targeting reticle */}
                        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                            <div className="relative">
                                {/* Outer dashed spinning ring */}
                                <div className="w-28 h-28 rounded-full border-2 border-dashed border-cyan-400/70 animate-[spin_8s_linear_infinite] shadow-[0_0_12px_#22d3ee50]" />
                                {/* Inner circle */}
                                <div className="absolute inset-3 rounded-full border border-cyan-500/40" />
                                {/* Centre dot */}
                                <div className="absolute inset-0 flex items-center justify-center">
                                    <div className="w-1.5 h-1.5 rounded-full bg-cyan-400 shadow-[0_0_6px_#22d3ee]" />
                                </div>
                                {/* Crosshair lines */}
                                <div className="absolute inset-0 flex items-center justify-center">
                                    <div className="w-full h-px bg-cyan-400/20" />
                                </div>
                                <div className="absolute inset-0 flex items-center justify-center">
                                    <div className="h-full w-px bg-cyan-400/20" />
                                </div>
                            </div>
                        </div>

                        {/* Vertical scanning line */}
                        {!detectedEmotion && (
                            <div
                                className="absolute inset-x-0 h-0.5 bg-gradient-to-r from-transparent via-cyan-400 to-transparent shadow-[0_0_8px_#22d3ee] opacity-90"
                                style={{ animation: 'scanLine 2s ease-in-out infinite' }}
                            />
                        )}

                        {/* Detection success flash */}
                        {detectedEmotion && (
                            <div className="absolute inset-0 border-2 border-cyan-400/60 shadow-[inset_0_0_30px_#22d3ee30] pointer-events-none" />
                        )}

                        {/* Status overlay — bottom of video */}
                        <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-[#041922]/90 to-transparent px-3 py-2">
                            {detectedEmotion ? (
                                <div className="text-center">
                                    <p className="text-xs font-mono text-cyan-500 uppercase tracking-widest">FACE DETECTED</p>
                                    <p className="text-sm font-mono font-bold text-cyan-300 tracking-wide mt-0.5">
                                        "{EMOTION_LABELS[detectedEmotion]?.replace(/^[^ ]+ /, '') ?? detectedEmotion.toUpperCase()}"
                                    </p>
                                </div>
                            ) : (
                                <p className="text-xs font-mono text-cyan-600 text-center animate-pulse tracking-widest uppercase">
                                    SCANNING...
                                </p>
                            )}
                        </div>
                    </div>

                    {/* Readout bar */}
                    <div className="px-4 py-3 border-t border-cyan-900/40 flex items-center justify-between gap-3">
                        {detectedEmotion ? (
                            <>
                                <div>
                                    <p className="text-[10px] font-mono text-cyan-700 uppercase tracking-widest">EXPRESSION</p>
                                    <p className="text-sm font-mono font-bold text-cyan-300">
                                        {EMOTION_LABELS[detectedEmotion] ?? detectedEmotion}
                                    </p>
                                </div>
                                <div className="text-right">
                                    <p className="text-[10px] font-mono text-cyan-700 uppercase tracking-widest">CONFIDENCE</p>
                                    <p className="text-sm font-mono font-bold text-cyan-400">
                                        {Math.round(confidence * 100)}%
                                    </p>
                                </div>
                                <div className="text-right">
                                    <p className="text-[10px] font-mono text-cyan-700 uppercase tracking-widest">MOOD SCORE</p>
                                    <p className="text-sm font-mono font-bold text-cyan-400">
                                        {EMOTION_TO_MOOD[detectedEmotion] ?? 5}/10
                                    </p>
                                </div>
                            </>
                        ) : (
                            <p className="text-xs font-mono text-cyan-700 animate-pulse w-full text-center">
                                ALIGN FACE WITH RETICLE...
                            </p>
                        )}
                    </div>

                    {/* Stop button */}
                    <div className="px-4 pb-3">
                        <button
                            type="button"
                            onClick={stopCamera}
                            className="w-full flex items-center justify-center gap-2 text-[10px] font-mono text-cyan-800 hover:text-red-400 border border-cyan-900/60 hover:border-red-500/40 rounded py-1.5 transition tracking-widest uppercase"
                        >
                            <CameraOff className="w-3 h-3" />
                            TERMINATE SCAN
                        </button>
                    </div>
                </div>
            )}

            {error && (
                <p className="text-xs font-mono text-red-400 px-4 pb-3 text-center">{error}</p>
            )}

            {/* Scanning line keyframe */}
            <style>{`
                @keyframes scanLine {
                    0%   { top: 10%; }
                    50%  { top: 85%; }
                    100% { top: 10%; }
                }
            `}</style>
        </div>
    )
}

