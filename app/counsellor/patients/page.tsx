'use client'

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useCounsellorAuth } from '@/context/CounsellorAuthContext'
import { counsellorApi } from '@/lib/counsellorApi'
import { CounsellorSidebar } from '@/components/counsellor/CounsellorSidebar'
import { RiskPill } from '@/components/counsellor/RiskPill'
import { Trash2, UserPlus, X } from 'lucide-react'

const SUBSTANCE_COLORS: Record<string, string> = {
    Alcohol: '#fbb6ce', Caffeine: '#fbd38d', Nicotine: '#c6f6d5', Cannabis: '#bee3f8',
}

function timeAgo(dateStr: string) {
    if (!dateStr) return 'Never'
    const diff = Date.now() - new Date(dateStr).getTime()
    const h = Math.floor(diff / 3600000)
    const d = Math.floor(diff / 86400000)
    if (h < 1) return 'Just now'
    if (h < 24) return `${h}h ago`
    return `${d}d ago`
}

export default function PatientsList() {
    const { counsellor, loading: authLoading } = useCounsellorAuth()
    const router = useRouter()
    const searchParams = useSearchParams()

    const [patients, setPatients] = useState<any[]>([])
    const [filtered, setFiltered] = useState<any[]>([])
    const [activeFilter, setActiveFilter] = useState(searchParams.get('filter') || 'All')
    const [search, setSearch] = useState('')
    const [loading, setLoading] = useState(true)
    const [showModal, setShowModal] = useState(false)
    const [addEmail, setAddEmail] = useState('')
    const [addNickname, setAddNickname] = useState('')
    const [addError, setAddError] = useState('')
    const [adding, setAdding] = useState(false)

    useEffect(() => {
        if (!authLoading && !counsellor) router.push('/counsellor/login')
    }, [authLoading, counsellor])

    useEffect(() => {
        if (!counsellor) return
        counsellorApi.getPatients().then(data => {
            setPatients(data); setFiltered(data)
        }).finally(() => setLoading(false))
    }, [counsellor])

    useEffect(() => {
        let result = [...patients]
        if (activeFilter !== 'All') result = result.filter(p => p.riskLevel === activeFilter)
        if (search) result = result.filter(p => p.nickname.toLowerCase().includes(search.toLowerCase()))
        setFiltered(result)
    }, [patients, activeFilter, search])

    const handleAdd = async () => {
        if (!addEmail || !addNickname) { setAddError('Both fields are required'); return }
        setAdding(true); setAddError('')
        try {
            await counsellorApi.addPatient({ studentEmail: addEmail, nickname: addNickname })
            const fresh = await counsellorApi.getPatients()
            setPatients(fresh)
            setShowModal(false); setAddEmail(''); setAddNickname('')
        } catch (err: any) {
            setAddError(err.message)
        } finally {
            setAdding(false)
        }
    }

    const handleRemove = async (id: string, nickname: string) => {
        if (!confirm(`Remove ${nickname} from your patient list?`)) return
        await counsellorApi.removePatient(id)
        setPatients(p => p.filter(pt => pt.patientId !== id))
    }

    const font = "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif"
    const filters = ['All', 'High', 'Medium', 'Low', 'None']

    if (authLoading || !counsellor) return null

    return (
        <div style={{ display: 'flex', minHeight: '100vh', background: '#f7fafc', fontFamily: font }}>
            <CounsellorSidebar />

            <main style={{ marginLeft: 240, flex: 1, padding: '32px 36px', overflowY: 'auto' }}>
                {/* Header */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
                    <h1 style={{ fontSize: 24, fontWeight: 800, color: '#1a202c', margin: 0 }}>
                        My Patients ({filtered.length})
                    </h1>
                    <button
                        onClick={() => setShowModal(true)}
                        style={{
                            display: 'flex', alignItems: 'center', gap: 8,
                            background: '#e53e3e', color: '#fff', border: 'none',
                            padding: '10px 18px', borderRadius: 10, fontWeight: 700,
                            fontSize: 14, cursor: 'pointer',
                        }}
                    >
                        <UserPlus size={16} /> Add Patient
                    </button>
                </div>

                {/* Filters + Search */}
                <div style={{ display: 'flex', gap: 12, marginBottom: 20, flexWrap: 'wrap', alignItems: 'center' }}>
                    <div style={{ display: 'flex', gap: 8 }}>
                        {filters.map(f => (
                            <button
                                key={f}
                                onClick={() => setActiveFilter(f)}
                                style={{
                                    padding: '6px 16px', borderRadius: 20, border: 'none',
                                    cursor: 'pointer', fontWeight: 600, fontSize: 13,
                                    background: activeFilter === f ? '#e53e3e' : '#fff',
                                    color: activeFilter === f ? '#fff' : '#4a5568',
                                    boxShadow: '0 1px 4px rgba(0,0,0,0.08)',
                                }}
                            >
                                {f === 'None' ? 'Not Assessed' : f === 'All' ? 'All' : `${f} Risk`}
                            </button>
                        ))}
                    </div>
                    <input
                        value={search} onChange={e => setSearch(e.target.value)}
                        placeholder="Search by nickname..."
                        style={{
                            padding: '8px 14px', borderRadius: 10, border: '1.5px solid #e2e8f0',
                            fontSize: 13, outline: 'none', background: '#fff', minWidth: 200,
                        }}
                    />
                </div>

                {/* Table */}
                <div style={{ background: '#fff', borderRadius: 14, boxShadow: '0 1px 8px rgba(0,0,0,0.06)', overflow: 'hidden' }}>
                    {loading ? (
                        <div style={{ padding: 40, textAlign: 'center', color: '#718096' }}>Loading patients...</div>
                    ) : filtered.length === 0 ? (
                        <div style={{ padding: 40, textAlign: 'center', color: '#a0aec0' }}>
                            No patients found.{' '}
                            <button onClick={() => setShowModal(true)} style={{ color: '#e53e3e', background: 'none', border: 'none', cursor: 'pointer', fontWeight: 600 }}>
                                Add one →
                            </button>
                        </div>
                    ) : (
                        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                            <thead>
                                <tr style={{ background: '#f7fafc', borderBottom: '1px solid #e2e8f0' }}>
                                    {['PATIENT', 'RISK LEVEL', 'AVG MOOD (7d)', 'LAST ACTIVE', 'TREND', 'SUBSTANCES', 'ACTIONS'].map(h => (
                                        <th key={h} style={{ padding: '12px 16px', textAlign: 'left', fontSize: 11, fontWeight: 700, color: '#718096', letterSpacing: 0.5, whiteSpace: 'nowrap' }}>
                                            {h}
                                        </th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody>
                                {filtered.map((p, i) => (
                                    <tr
                                        key={p.patientId}
                                        style={{ borderBottom: i < filtered.length - 1 ? '1px solid #f7fafc' : 'none', cursor: 'pointer' }}
                                        onClick={() => router.push(`/counsellor/patients/${p.patientId}`)}
                                        onMouseEnter={e => (e.currentTarget.style.background = '#f7fafc')}
                                        onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                                    >
                                        <td style={{ padding: '14px 16px', fontWeight: 700, color: '#1a202c', fontSize: 14 }}>
                                            {p.nickname}
                                        </td>
                                        <td style={{ padding: '14px 16px' }}>
                                            <RiskPill level={p.riskLevel || 'None'} />
                                        </td>
                                        <td style={{ padding: '14px 16px', color: '#4a5568', fontSize: 13 }}>
                                            {p.avgMood7 ? `${p.avgMood7}/10` : 'No data'}
                                        </td>
                                        <td style={{ padding: '14px 16px', color: '#718096', fontSize: 13 }}>
                                            {timeAgo(p.lastActive)}
                                        </td>
                                        <td style={{ padding: '14px 16px', fontSize: 18 }}>{p.trend || '➡️'}</td>
                                        <td style={{ padding: '14px 16px' }}>
                                            <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                                                {Object.entries(p.substanceSummary || {}).map(([s, cnt]) => (
                                                    <span key={s} style={{
                                                        background: SUBSTANCE_COLORS[s] || '#e2e8f0',
                                                        color: '#1a202c', fontSize: 11, fontWeight: 600,
                                                        padding: '2px 8px', borderRadius: 6,
                                                    }}>
                                                        {s} ×{cnt as number}
                                                    </span>
                                                ))}
                                                {Object.keys(p.substanceSummary || {}).length === 0 && (
                                                    <span style={{ color: '#a0aec0', fontSize: 12 }}>None</span>
                                                )}
                                            </div>
                                        </td>
                                        <td style={{ padding: '14px 16px' }}>
                                            <div style={{ display: 'flex', gap: 8 }} onClick={e => e.stopPropagation()}>
                                                <button
                                                    onClick={() => router.push(`/counsellor/patients/${p.patientId}`)}
                                                    style={{ background: 'none', border: 'none', color: '#3182ce', cursor: 'pointer', fontWeight: 600, fontSize: 13 }}
                                                >
                                                    View Details
                                                </button>
                                                <button
                                                    onClick={() => handleRemove(p.patientId, p.nickname)}
                                                    style={{ background: 'none', border: 'none', color: '#e53e3e', cursor: 'pointer', padding: 4 }}
                                                >
                                                    <Trash2 size={15} />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    )}
                </div>

                {/* Privacy note */}
                <p style={{ marginTop: 16, color: '#a0aec0', fontSize: 12, fontStyle: 'italic' }}>
                    ⚠ Patient names are anonymized. Nicknames are assigned by you. No personal identifiers are shown.
                </p>
            </main>

            {/* Add Patient Modal */}
            {showModal && (
                <div style={{
                    position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000,
                }}>
                    <div style={{ background: '#fff', borderRadius: 16, padding: 32, maxWidth: 420, width: '100%', boxShadow: '0 20px 60px rgba(0,0,0,0.2)' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
                            <h3 style={{ margin: 0, fontSize: 18, fontWeight: 800, color: '#1a202c' }}>Add New Patient</h3>
                            <button onClick={() => setShowModal(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#718096' }}>
                                <X size={20} />
                            </button>
                        </div>
                        <p style={{ color: '#718096', fontSize: 13, margin: '0 0 20px' }}>
                            Enter the student's registered MindTrack email address.
                        </p>

                        {addError && (
                            <div style={{ background: '#fff5f5', border: '1px solid #fed7d7', color: '#c53030', borderRadius: 8, padding: '10px 14px', fontSize: 13, marginBottom: 14 }}>
                                {addError}
                            </div>
                        )}

                        {[
                            { label: 'Student Email', value: addEmail, set: setAddEmail, type: 'email', ph: 'student@saec.ac.in' },
                            { label: 'Nickname / Alias', value: addNickname, set: setAddNickname, type: 'text', ph: 'Patient A' },
                        ].map(f => (
                            <div key={f.label}>
                                <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: '#4a5568', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 6 }}>
                                    {f.label}
                                </label>
                                <input
                                    type={f.type} value={f.value}
                                    onChange={e => f.set(e.target.value)}
                                    placeholder={f.ph}
                                    style={{ width: '100%', padding: '10px 14px', borderRadius: 10, border: '1.5px solid #e2e8f0', fontSize: 14, outline: 'none', boxSizing: 'border-box', marginBottom: 14, background: '#f7fafc' }}
                                />
                            </div>
                        ))}

                        <div style={{ background: '#fffaf0', border: '1px solid #fbd38d', borderRadius: 8, padding: '10px 14px', fontSize: 12, color: '#744210', marginBottom: 20 }}>
                            ⚠ Only add students who have given you verbal consent to monitor their wellness data.
                        </div>

                        <div style={{ display: 'flex', gap: 10 }}>
                            <button
                                onClick={handleAdd} disabled={adding}
                                style={{ flex: 1, background: '#e53e3e', color: '#fff', border: 'none', padding: '11px', borderRadius: 10, fontWeight: 700, fontSize: 14, cursor: 'pointer', opacity: adding ? 0.7 : 1 }}
                            >
                                {adding ? 'Adding...' : 'Add to My Patients'}
                            </button>
                            <button
                                onClick={() => setShowModal(false)}
                                style={{ flex: 1, background: '#f7fafc', color: '#4a5568', border: '1px solid #e2e8f0', padding: '11px', borderRadius: 10, fontWeight: 700, fontSize: 14, cursor: 'pointer' }}
                            >
                                Cancel
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}
