'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { useCounsellorAuth } from '@/context/CounsellorAuthContext'
import { counsellorApi } from '@/lib/counsellorApi'
import { CounsellorSidebar } from '@/components/counsellor/CounsellorSidebar'
import { RiskPill } from '@/components/counsellor/RiskPill'
import { ArrowLeft, Save } from 'lucide-react'
import {
    LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ReferenceLine,
    ResponsiveContainer, BarChart, Bar, Cell, AreaChart, Area,
} from 'recharts'

const SUBSTANCE_COLORS: Record<string, string> = {
    Alcohol: '#fbb6ce', Caffeine: '#fbd38d', Nicotine: '#c6f6d5', Cannabis: '#bee3f8',
}

const TABS = ['Overview', 'Mood History', 'Substance Logs', 'Risk Timeline', 'Notes']

function fmt(d: string) {
    return new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}
function fmtFull(d: string) {
    return new Date(d).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })
}

export default function PatientDetail() {
    const { counsellor, loading: authLoading } = useCounsellorAuth()
    const router = useRouter()
    const params = useParams()
    const id = params.id as string

    const [data, setData] = useState<any>(null)
    const [loading, setLoading] = useState(true)
    const [tab, setTab] = useState(0)
    const [notes, setNotes] = useState('')
    const [savingNotes, setSavingNotes] = useState(false)
    const [notesSaved, setNotesSaved] = useState(false)
    const [lastSaved, setLastSaved] = useState('')

    useEffect(() => {
        if (!authLoading && !counsellor) router.push('/counsellor/login')
    }, [authLoading, counsellor])

    useEffect(() => {
        if (!counsellor) return
        counsellorApi.getPatientDetail(id)
            .then(d => { setData(d); setNotes(d.patient.notes || '') })
            .catch(() => router.push('/counsellor/patients'))
            .finally(() => setLoading(false))
    }, [counsellor, id])

    const handleSaveNotes = async () => {
        setSavingNotes(true)
        try {
            await counsellorApi.updateNotes(id, notes)
            setNotesSaved(true)
            setLastSaved(new Date().toLocaleTimeString())
            setTimeout(() => setNotesSaved(false), 3000)
        } finally {
            setSavingNotes(false)
        }
    }

    const font = "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif"

    if (authLoading || !counsellor || loading) {
        return (
            <div style={{ display: 'flex', minHeight: '100vh', background: '#f7fafc', fontFamily: font }}>
                <CounsellorSidebar />
                <main style={{ marginLeft: 240, flex: 1, padding: 40, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <div style={{ color: '#718096' }}>Loading patient data...</div>
                </main>
            </div>
        )
    }

    if (!data) return null

    const { patient, moodHistory, substanceLogs, riskTimeline, substanceSummary, shapExplanations, stats } = data

    // Chart data
    const moodChartData = moodHistory.map((l: any) => ({ date: fmt(l.date), mood: l.mood_score }))

    const substanceWeekData = (() => {
        const weeks: Record<string, Record<string, number>> = {}
        substanceLogs.forEach((l: any) => {
            const w = `W${Math.ceil(new Date(l.date).getDate() / 7)}`
            if (!weeks[w]) weeks[w] = {}
            l.substances.forEach((s: string) => { weeks[w][s] = (weeks[w][s] || 0) + 1 })
        })
        return Object.entries(weeks).slice(-4).map(([week, counts]) => ({ week, ...counts }))
    })()

    const riskChartData = riskTimeline.map((r: any) => ({ date: fmt(r.date), risk: r.riskScore }))

    const riskBg = patient.riskLevel === 'High' ? '#fff5f5' : patient.riskLevel === 'Medium' ? '#fffaf0' : patient.riskLevel === 'Low' ? '#f0fff4' : '#f7fafc'
    const riskColor = patient.riskLevel === 'High' ? '#c53030' : patient.riskLevel === 'Medium' ? '#c05621' : patient.riskLevel === 'Low' ? '#276749' : '#718096'

    return (
        <div style={{ display: 'flex', minHeight: '100vh', background: '#f7fafc', fontFamily: font }}>
            <CounsellorSidebar />

            <main style={{ marginLeft: 240, flex: 1, padding: '28px 36px', overflowY: 'auto' }}>
                {/* Back */}
                <button
                    onClick={() => router.push('/counsellor/patients')}
                    style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'none', border: 'none', color: '#718096', cursor: 'pointer', fontSize: 13, fontWeight: 600, marginBottom: 20 }}
                >
                    <ArrowLeft size={16} /> Back to Patients
                </button>

                {/* Header */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 20, marginBottom: 20 }}>
                    <div>
                        <h1 style={{ fontSize: 26, fontWeight: 800, color: '#1a202c', margin: '0 0 6px' }}>{patient.nickname}</h1>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                            <RiskPill level={patient.riskLevel || 'None'} />
                            <span style={{ color: '#a0aec0', fontSize: 12 }}>
                                Patient since {new Date(patient.addedAt).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
                            </span>
                        </div>
                    </div>
                </div>

                {/* Privacy Banner */}
                <div style={{ background: '#ebf8ff', border: '1px solid #bee3f8', borderRadius: 10, padding: '10px 16px', marginBottom: 20, fontSize: 13, color: '#2c5282' }}>
                    ℹ Journal text and personal messages are hidden. You see behavioral patterns only.
                </div>

                {/* Tabs */}
                <div style={{ display: 'flex', gap: 4, marginBottom: 24, borderBottom: '2px solid #e2e8f0' }}>
                    {TABS.map((t, i) => (
                        <button
                            key={t}
                            onClick={() => setTab(i)}
                            style={{
                                padding: '10px 20px', background: 'none', border: 'none',
                                cursor: 'pointer', fontWeight: 700, fontSize: 14,
                                color: tab === i ? '#e53e3e' : '#718096',
                                borderBottom: tab === i ? '3px solid #e53e3e' : '3px solid transparent',
                                marginBottom: -2,
                            }}
                        >
                            {t}
                        </button>
                    ))}
                </div>

                {/* TAB 0: Overview */}
                {tab === 0 && (
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
                        {/* Left: stats */}
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                            {[
                                { label: 'Current Risk Score', value: `${patient.riskScore}/100`, bg: riskBg, color: riskColor },
                                { label: 'Avg Mood (7 days)', value: `${stats.avgMood7}/10`, bg: '#fff', color: '#1a202c' },
                                { label: 'Total Logs (30 days)', value: stats.totalLogs30, bg: '#fff', color: '#1a202c' },
                                { label: 'Logs This Week', value: stats.logsThisWeek, bg: '#fff', color: '#1a202c' },
                            ].map(s => (
                                <div key={s.label} style={{ background: s.bg, borderRadius: 12, padding: '16px 20px', boxShadow: '0 1px 6px rgba(0,0,0,0.06)', border: '1px solid #e2e8f0' }}>
                                    <div style={{ fontSize: 24, fontWeight: 800, color: s.color }}>{s.value}</div>
                                    <div style={{ fontSize: 11, fontWeight: 700, color: '#718096', textTransform: 'uppercase', letterSpacing: 0.5, marginTop: 4 }}>{s.label}</div>
                                </div>
                            ))}

                            {/* Substance frequency */}
                            {Object.keys(substanceSummary).length > 0 && (
                                <div style={{ background: '#fff', borderRadius: 12, padding: '16px 20px', boxShadow: '0 1px 6px rgba(0,0,0,0.06)' }}>
                                    <div style={{ fontSize: 12, fontWeight: 700, color: '#718096', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 12 }}>
                                        Substance Frequency This Week
                                    </div>
                                    {Object.entries(substanceSummary).map(([s, cnt]: any) => (
                                        <div key={s} style={{ marginBottom: 8 }}>
                                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4, fontSize: 12, fontWeight: 600, color: '#4a5568' }}>
                                                <span>{s}</span><span>{cnt}x</span>
                                            </div>
                                            <div style={{ background: '#f7fafc', borderRadius: 6, height: 8, overflow: 'hidden' }}>
                                                <div style={{ width: `${Math.min(100, (cnt / 7) * 100)}%`, height: '100%', background: SUBSTANCE_COLORS[s] || '#a0aec0', borderRadius: 6 }} />
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* Right: SHAP explanations */}
                        <div style={{ background: '#fff', borderRadius: 12, padding: '20px', boxShadow: '0 1px 6px rgba(0,0,0,0.06)', height: 'fit-content' }}>
                            <div style={{ fontSize: 14, fontWeight: 800, color: '#1a202c', marginBottom: 14 }}>Why This Risk Score?</div>
                            {shapExplanations.length > 0 ? (
                                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                                    {shapExplanations.map((ex: string, i: number) => (
                                        <div key={i} style={{ background: '#fffaf0', border: '1px solid #fbd38d', borderRadius: 8, padding: '10px 14px', fontSize: 13, color: '#744210', fontWeight: 600 }}>
                                            ⚠ {ex}
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div style={{ color: '#a0aec0', fontSize: 13 }}>No risk factors identified yet.</div>
                            )}
                        </div>
                    </div>
                )}

                {/* TAB 1: Mood History */}
                {tab === 1 && (
                    <div>
                        <div style={{ background: '#fff', borderRadius: 14, padding: 24, boxShadow: '0 1px 8px rgba(0,0,0,0.06)', marginBottom: 20 }}>
                            <ResponsiveContainer width="100%" height={280}>
                                <LineChart data={moodChartData} margin={{ top: 10, right: 16, bottom: 0, left: -16 }}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                                    <XAxis dataKey="date" tick={{ fontSize: 11, fill: '#9ca3af' }} />
                                    <YAxis domain={[0, 10]} tick={{ fontSize: 11, fill: '#9ca3af' }} />
                                    <Tooltip contentStyle={{ borderRadius: 8, fontSize: 12 }} />
                                    <ReferenceLine y={5} stroke="#9ca3af" strokeDasharray="4 4" label={{ value: 'Neutral', fontSize: 10, fill: '#9ca3af' }} />
                                    <ReferenceLine y={4} stroke="#e53e3e" strokeDasharray="4 4" label={{ value: 'Risk Threshold', fontSize: 10, fill: '#e53e3e' }} />
                                    <Line type="monotone" dataKey="mood" stroke="#e53e3e" strokeWidth={2.5} dot={{ fill: '#e53e3e', r: 4 }} activeDot={{ r: 6 }} />
                                </LineChart>
                            </ResponsiveContainer>
                        </div>
                        <div style={{ background: '#fff', borderRadius: 14, overflow: 'hidden', boxShadow: '0 1px 8px rgba(0,0,0,0.06)' }}>
                            {moodHistory.slice().reverse().slice(0, 30).map((l: any, i: number) => (
                                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 16, padding: '12px 20px', borderBottom: '1px solid #f7fafc' }}>
                                    <span style={{ color: '#718096', fontSize: 12, minWidth: 130 }}>{fmtFull(l.date)}</span>
                                    <span style={{
                                        background: l.mood_score >= 7 ? '#f0fff4' : l.mood_score >= 4 ? '#fffaf0' : '#fff5f5',
                                        color: l.mood_score >= 7 ? '#276749' : l.mood_score >= 4 ? '#c05621' : '#c53030',
                                        border: `1px solid ${l.mood_score >= 7 ? '#9ae6b4' : l.mood_score >= 4 ? '#fbd38d' : '#feb2b2'}`,
                                        padding: '2px 12px', borderRadius: 20, fontSize: 12, fontWeight: 700,
                                    }}>
                                        {l.mood_score}/10
                                    </span>
                                    {l.hasJournal && (
                                        <span style={{ color: '#a0aec0', fontSize: 12 }}>📝 Journal entry ({l.journalWordCount} words)</span>
                                    )}
                                    <span style={{ color: '#cbd5e0', fontSize: 11 }}>{l.time_of_day}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* TAB 2: Substance Logs */}
                {tab === 2 && (
                    <div>
                        {substanceWeekData.length > 0 && (
                            <div style={{ background: '#fff', borderRadius: 14, padding: 24, boxShadow: '0 1px 8px rgba(0,0,0,0.06)', marginBottom: 20 }}>
                                <div style={{ fontSize: 14, fontWeight: 700, color: '#1a202c', marginBottom: 16 }}>Substance Usage (Last 4 Weeks)</div>
                                <ResponsiveContainer width="100%" height={220}>
                                    <BarChart data={substanceWeekData} margin={{ top: 0, right: 0, bottom: 0, left: -16 }}>
                                        <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                                        <XAxis dataKey="week" tick={{ fontSize: 11 }} />
                                        <YAxis tick={{ fontSize: 11 }} />
                                        <Tooltip contentStyle={{ borderRadius: 8, fontSize: 12 }} />
                                        {['Alcohol', 'Caffeine', 'Nicotine', 'Cannabis'].map(s => (
                                            <Bar key={s} dataKey={s} fill={SUBSTANCE_COLORS[s]} radius={[4, 4, 0, 0]} maxBarSize={30} />
                                        ))}
                                    </BarChart>
                                </ResponsiveContainer>
                            </div>
                        )}
                        <div style={{ background: '#fff', borderRadius: 14, overflow: 'hidden', boxShadow: '0 1px 8px rgba(0,0,0,0.06)' }}>
                            {substanceLogs.slice().reverse().slice(0, 30).map((l: any, i: number) => (
                                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 20px', borderBottom: '1px solid #f7fafc' }}>
                                    <span style={{ color: '#718096', fontSize: 12, minWidth: 130 }}>{fmtFull(l.date)}</span>
                                    <span style={{ color: '#a0aec0', fontSize: 12 }}>{l.time_of_day}</span>
                                    <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                                        {l.substances.map((s: string) => (
                                            <span key={s} style={{ background: SUBSTANCE_COLORS[s] || '#e2e8f0', color: '#1a202c', fontSize: 11, fontWeight: 600, padding: '2px 8px', borderRadius: 6 }}>
                                                {s}
                                            </span>
                                        ))}
                                    </div>
                                </div>
                            ))}
                            {substanceLogs.length === 0 && (
                                <div style={{ padding: 40, textAlign: 'center', color: '#a0aec0' }}>No substance logs found.</div>
                            )}
                        </div>
                    </div>
                )}

                {/* TAB 3: Risk Timeline */}
                {tab === 3 && (
                    <div>
                        <div style={{ background: '#fff', borderRadius: 14, padding: 24, boxShadow: '0 1px 8px rgba(0,0,0,0.06)', marginBottom: 20 }}>
                            <ResponsiveContainer width="100%" height={280}>
                                <AreaChart data={riskChartData} margin={{ top: 10, right: 16, bottom: 0, left: -16 }}>
                                    <defs>
                                        <linearGradient id="riskGrad" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#e53e3e" stopOpacity={0.2} />
                                            <stop offset="95%" stopColor="#e53e3e" stopOpacity={0} />
                                        </linearGradient>
                                    </defs>
                                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                                    <XAxis dataKey="date" tick={{ fontSize: 11, fill: '#9ca3af' }} />
                                    <YAxis domain={[0, 100]} tick={{ fontSize: 11, fill: '#9ca3af' }} />
                                    <Tooltip contentStyle={{ borderRadius: 8, fontSize: 12 }} />
                                    <ReferenceLine y={30} stroke="#48bb78" strokeDasharray="4 4" label={{ value: 'Low', fontSize: 10, fill: '#48bb78', position: 'insideLeft' }} />
                                    <ReferenceLine y={60} stroke="#ed8936" strokeDasharray="4 4" label={{ value: 'Medium', fontSize: 10, fill: '#ed8936', position: 'insideLeft' }} />
                                    <Area type="monotone" dataKey="risk" stroke="#e53e3e" fill="url(#riskGrad)" strokeWidth={2.5} dot={{ fill: '#e53e3e', r: 4 }} />
                                </AreaChart>
                            </ResponsiveContainer>
                        </div>
                        <div style={{ background: '#fff', borderRadius: 14, overflow: 'hidden', boxShadow: '0 1px 8px rgba(0,0,0,0.06)' }}>
                            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                                <thead>
                                    <tr style={{ background: '#f7fafc', borderBottom: '1px solid #e2e8f0' }}>
                                        {['DATE', 'RISK SCORE', 'RISK LEVEL', 'AVG MOOD'].map(h => (
                                            <th key={h} style={{ padding: '12px 20px', textAlign: 'left', fontSize: 11, fontWeight: 700, color: '#718096', letterSpacing: 0.5 }}>{h}</th>
                                        ))}
                                    </tr>
                                </thead>
                                <tbody>
                                    {riskTimeline.slice().reverse().map((r: any, i: number) => (
                                        <tr key={i} style={{ borderBottom: '1px solid #f7fafc' }}>
                                            <td style={{ padding: '12px 20px', fontSize: 13, color: '#4a5568' }}>{fmt(r.date)}</td>
                                            <td style={{ padding: '12px 20px', fontWeight: 700, color: '#1a202c', fontSize: 14 }}>{r.riskScore}/100</td>
                                            <td style={{ padding: '12px 20px' }}><RiskPill level={r.riskLevel} /></td>
                                            <td style={{ padding: '12px 20px', fontSize: 13, color: '#4a5568' }}>{r.avgMood}/10</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}

                {/* TAB 4: Notes */}
                {tab === 4 && (
                    <div style={{ background: '#fff', borderRadius: 14, padding: 28, boxShadow: '0 1px 8px rgba(0,0,0,0.06)' }}>
                        <h3 style={{ fontSize: 16, fontWeight: 800, color: '#1a202c', margin: '0 0 6px' }}>Private Counsellor Notes</h3>
                        <p style={{ color: '#718096', fontSize: 13, margin: '0 0 20px' }}>
                            🔒 These notes are only visible to you. Students cannot see them.
                        </p>
                        <textarea
                            value={notes}
                            onChange={e => setNotes(e.target.value)}
                            rows={10}
                            placeholder="Write your observations, session notes, or action plans here..."
                            style={{
                                width: '100%', padding: '14px', borderRadius: 10,
                                border: '1.5px solid #e2e8f0', fontSize: 14, color: '#1a202c',
                                outline: 'none', resize: 'vertical', boxSizing: 'border-box',
                                background: '#f7fafc', lineHeight: 1.6,
                            }}
                        />
                        <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginTop: 16 }}>
                            <button
                                onClick={handleSaveNotes}
                                disabled={savingNotes}
                                style={{
                                    display: 'flex', alignItems: 'center', gap: 8,
                                    background: notesSaved ? '#48bb78' : '#e53e3e',
                                    color: '#fff', border: 'none', padding: '10px 20px',
                                    borderRadius: 10, fontWeight: 700, fontSize: 14, cursor: 'pointer',
                                    opacity: savingNotes ? 0.7 : 1, transition: 'background 0.3s',
                                }}
                            >
                                <Save size={16} />
                                {savingNotes ? 'Saving...' : notesSaved ? 'Saved ✓' : 'Save Notes'}
                            </button>
                            {lastSaved && (
                                <span style={{ color: '#a0aec0', fontSize: 12 }}>Last saved at {lastSaved}</span>
                            )}
                        </div>
                    </div>
                )}
            </main>
        </div>
    )
}
