'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useCounsellorAuth } from '@/context/CounsellorAuthContext'
import { counsellorApi } from '@/lib/counsellorApi'
import { CounsellorSidebar } from '@/components/counsellor/CounsellorSidebar'
import { StatCard } from '@/components/counsellor/StatCard'
import { RiskPill } from '@/components/counsellor/RiskPill'
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from 'recharts'

const RISK_COLORS = { High: '#e53e3e', Medium: '#ed8936', Low: '#48bb78', 'Not Assessed': '#a0aec0' }

function timeAgo(dateStr: string) {
    if (!dateStr) return 'Never'
    const diff = Date.now() - new Date(dateStr).getTime()
    const h = Math.floor(diff / 3600000)
    const d = Math.floor(diff / 86400000)
    if (h < 1) return 'Just now'
    if (h < 24) return `${h} hour${h > 1 ? 's' : ''} ago`
    return `${d} day${d > 1 ? 's' : ''} ago`
}

export default function CounsellorDashboard() {
    const { counsellor, loading: authLoading } = useCounsellorAuth()
    const router = useRouter()
    const [stats, setStats] = useState<any>(null)
    const [patients, setPatients] = useState<any[]>([])
    const [loadingData, setLoadingData] = useState(true)

    useEffect(() => {
        if (!authLoading && !counsellor) router.push('/counsellor/login')
    }, [authLoading, counsellor])

    useEffect(() => {
        if (!counsellor) return
        Promise.all([counsellorApi.getStats(), counsellorApi.getPatients()])
            .then(([st, pt]) => { setStats(st); setPatients(pt) })
            .catch(console.error)
            .finally(() => setLoadingData(false))
    }, [counsellor])

    if (authLoading || !counsellor) {
        return (
            <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f7fafc' }}>
                <div style={{ fontSize: 32, animation: 'spin 1s linear infinite' }}>⏳</div>
            </div>
        )
    }

    const hour = new Date().getHours()
    const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening'

    const pieData = stats ? [
        { name: 'High', value: stats.riskCounts.High || 0 },
        { name: 'Medium', value: stats.riskCounts.Medium || 0 },
        { name: 'Low', value: stats.riskCounts.Low || 0 },
        { name: 'Not Assessed', value: stats.riskCounts.None || 0 },
    ].filter(d => d.value > 0) : []

    const highRiskPatients = patients.filter(p => p.riskLevel === 'High')
    const recentActivity = patients
        .filter(p => p.lastActive)
        .sort((a, b) => new Date(b.lastActive).getTime() - new Date(a.lastActive).getTime())
        .slice(0, 5)

    const font = "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif"

    return (
        <div style={{ display: 'flex', minHeight: '100vh', background: '#f7fafc', fontFamily: font }}>
            <CounsellorSidebar />

            <main style={{ marginLeft: 240, flex: 1, padding: '32px 36px', maxWidth: 1200, overflowY: 'auto' }}>
                {/* Header */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 28 }}>
                    <div>
                        <h1 style={{ fontSize: 26, fontWeight: 800, color: '#1a202c', margin: 0 }}>
                            {greeting}, {counsellor.name} 👋
                        </h1>
                        <p style={{ color: '#718096', marginTop: 6, fontSize: 14 }}>
                            Here is today's overview of your patients
                        </p>
                    </div>
                    <div style={{ color: '#718096', fontSize: 13, fontWeight: 600, textAlign: 'right', paddingTop: 4 }}>
                        {new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                    </div>
                </div>

                {/* Stats Row */}
                {loadingData ? (
                    <div style={{ color: '#718096', marginBottom: 28 }}>Loading stats...</div>
                ) : (
                    <div style={{ display: 'flex', gap: 16, marginBottom: 28 }}>
                        <StatCard emoji="👥" label="Total Patients" value={stats?.totalPatients ?? 0} />
                        <StatCard emoji="🔴" label="High Risk" value={stats?.highRiskCount ?? 0} valueColor="#c53030" />
                        <StatCard emoji="🟡" label="Medium Risk" value={stats?.riskCounts?.Medium ?? 0} valueColor="#c05621" />
                        <StatCard emoji="📊" label="Avg Risk Score" value={stats?.avgRiskScore ?? 0} suffix="/100" />
                    </div>
                )}

                {/* Two-column grid */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginBottom: 24 }}>
                    {/* Pie chart */}
                    <div style={{ background: '#fff', borderRadius: 14, padding: 24, boxShadow: '0 1px 8px rgba(0,0,0,0.06)' }}>
                        <h3 style={{ margin: '0 0 16px', fontSize: 15, fontWeight: 700, color: '#1a202c' }}>Risk Distribution</h3>
                        {pieData.length > 0 ? (
                            <>
                                <ResponsiveContainer width="100%" height={240}>
                                    <PieChart>
                                        <Pie data={pieData} cx="50%" cy="50%" outerRadius={90} dataKey="value" label={({ name, value }) => `${value}`}>
                                            {pieData.map((entry) => (
                                                <Cell key={entry.name} fill={RISK_COLORS[entry.name as keyof typeof RISK_COLORS] || '#a0aec0'} />
                                            ))}
                                        </Pie>
                                        <Tooltip />
                                    </PieChart>
                                </ResponsiveContainer>
                                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, justifyContent: 'center', marginTop: 8 }}>
                                    {pieData.map(d => (
                                        <div key={d.name} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12 }}>
                                            <span style={{ width: 10, height: 10, borderRadius: '50%', background: RISK_COLORS[d.name as keyof typeof RISK_COLORS] || '#a0aec0', display: 'inline-block' }} />
                                            <span style={{ color: '#4a5568', fontWeight: 600 }}>{d.name}: {d.value}</span>
                                        </div>
                                    ))}
                                </div>
                            </>
                        ) : (
                            <div style={{ textAlign: 'center', color: '#a0aec0', padding: '60px 0' }}>No patient data yet</div>
                        )}
                    </div>

                    {/* Alert banner */}
                    <div>
                        {highRiskPatients.length > 0 ? (
                            <div style={{
                                background: 'linear-gradient(135deg, #c53030, #e53e3e)',
                                borderRadius: 14, padding: 28, boxShadow: '0 1px 8px rgba(0,0,0,0.1)',
                                color: '#fff', height: '100%', boxSizing: 'border-box',
                                display: 'flex', flexDirection: 'column', justifyContent: 'center',
                            }}>
                                <div style={{ fontSize: 36, marginBottom: 12 }}>⚠️</div>
                                <h3 style={{ margin: '0 0 8px', fontSize: 20, fontWeight: 800 }}>
                                    {highRiskPatients.length} Student{highRiskPatients.length > 1 ? 's' : ''} Need Attention
                                </h3>
                                <p style={{ margin: '0 0 20px', opacity: 0.85, fontSize: 13 }}>
                                    These students have been at High risk for 7+ days
                                </p>
                                <button
                                    onClick={() => router.push('/counsellor/patients?filter=High')}
                                    style={{
                                        background: '#fff', color: '#e53e3e', border: 'none',
                                        padding: '10px 20px', borderRadius: 10, fontWeight: 700,
                                        fontSize: 14, cursor: 'pointer', alignSelf: 'flex-start',
                                    }}
                                >
                                    View High Risk Patients →
                                </button>
                            </div>
                        ) : (
                            <div style={{
                                background: 'linear-gradient(135deg, #276749, #38a169)',
                                borderRadius: 14, padding: 28, color: '#fff',
                                display: 'flex', flexDirection: 'column', justifyContent: 'center',
                                height: '100%', boxSizing: 'border-box',
                            }}>
                                <div style={{ fontSize: 36, marginBottom: 12 }}>✅</div>
                                <h3 style={{ margin: 0, fontSize: 18, fontWeight: 700 }}>
                                    All patients within normal range
                                </h3>
                                <p style={{ margin: '8px 0 0', opacity: 0.85, fontSize: 13 }}>
                                    No high-risk alerts at this time.
                                </p>
                            </div>
                        )}
                    </div>
                </div>

                {/* Recent Activity */}
                <div style={{ background: '#fff', borderRadius: 14, padding: 24, boxShadow: '0 1px 8px rgba(0,0,0,0.06)' }}>
                    <h3 style={{ margin: '0 0 16px', fontSize: 15, fontWeight: 700, color: '#1a202c' }}>
                        Recent Patient Activity
                    </h3>
                    {recentActivity.length === 0 ? (
                        <div style={{ color: '#a0aec0', textAlign: 'center', padding: '24px 0', fontSize: 14 }}>
                            No recent activity. Add patients to get started.
                        </div>
                    ) : (
                        <div>
                            {recentActivity.map((p) => {
                                const borderColor = p.riskLevel === 'High' ? '#e53e3e' : p.riskLevel === 'Medium' ? '#ed8936' : '#48bb78'
                                return (
                                    <div
                                        key={p.patientId}
                                        style={{
                                            display: 'flex', alignItems: 'center', gap: 14,
                                            padding: '12px 0', borderBottom: '1px solid #f7fafc',
                                            borderLeft: `3px solid ${borderColor}`, paddingLeft: 14,
                                            marginBottom: 4,
                                        }}
                                    >
                                        <div style={{ flex: 1 }}>
                                            <span style={{ fontWeight: 700, color: '#1a202c', fontSize: 14 }}>{p.nickname}</span>
                                            <span style={{ color: '#718096', fontSize: 13 }}>
                                                {' '}logged mood {p.avgMood7 ? `${p.avgMood7}/10` : '—'}
                                            </span>
                                        </div>
                                        <RiskPill level={p.riskLevel} />
                                        <span style={{ color: '#a0aec0', fontSize: 12 }}>{timeAgo(p.lastActive)}</span>
                                    </div>
                                )
                            })}
                        </div>
                    )}
                </div>
            </main>
        </div>
    )
}
