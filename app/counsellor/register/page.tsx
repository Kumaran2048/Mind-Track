'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useCounsellorAuth } from '@/context/CounsellorAuthContext'

const S = {
    page: {
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #1a202c, #2d3748)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
        padding: '20px',
    } as React.CSSProperties,
    card: {
        background: '#fff', borderRadius: 20, padding: 36,
        maxWidth: 420, width: '100%',
        boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
    } as React.CSSProperties,
    iconRing: {
        width: 72, height: 72, borderRadius: '50%',
        background: 'linear-gradient(135deg, #fff5f5, #fed7d7)',
        border: '3px solid #fc8181',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: 32, margin: '0 auto 16px',
    } as React.CSSProperties,
    title: { textAlign: 'center' as const, fontSize: 22, fontWeight: 800, color: '#1a202c', margin: '0 0 4px' },
    subtitle: { textAlign: 'center' as const, color: '#718096', fontSize: 13, margin: '0 0 24px' },
    label: {
        display: 'block', fontSize: 11, fontWeight: 700, color: '#4a5568',
        textTransform: 'uppercase' as const, letterSpacing: 0.5, marginBottom: 6,
    },
    input: {
        width: '100%', padding: '10px 14px', borderRadius: 10,
        border: '1.5px solid #e2e8f0', fontSize: 14, color: '#1a202c',
        outline: 'none', boxSizing: 'border-box' as const, marginBottom: 14,
        background: '#f7fafc',
    } as React.CSSProperties,
    btn: {
        width: '100%', padding: '12px', borderRadius: 10, border: 'none',
        background: '#e53e3e', color: '#fff', fontSize: 15, fontWeight: 700, cursor: 'pointer',
    } as React.CSSProperties,
    error: {
        background: '#fff5f5', border: '1px solid #fed7d7',
        color: '#c53030', borderRadius: 10, padding: '10px 14px',
        fontSize: 13, marginBottom: 14,
    } as React.CSSProperties,
    footer: { textAlign: 'center' as const, marginTop: 20, fontSize: 13, color: '#718096' },
}

export default function CounsellorRegister() {
    const [form, setForm] = useState({
        name: '', email: '', password: '',
        institution: 'S.A. Engineering College',
        department: 'Student Wellness',
    })
    const [error, setError] = useState('')
    const [loading, setLoading] = useState(false)
    const { register } = useCounsellorAuth()

    const set = (k: string, v: string) => setForm(f => ({ ...f, [k]: v }))

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setError('')
        if (form.password.length < 6) { setError('Password must be at least 6 characters'); return }
        setLoading(true)
        try {
            await register(form)
        } catch (err: any) {
            setError(err.message || 'Registration failed. Please try again.')
        } finally {
            setLoading(false)
        }
    }

    return (
        <div style={S.page}>
            <div style={S.card}>
                <div style={S.iconRing}>🏫</div>
                <h1 style={S.title}>Create Counsellor Account</h1>
                <p style={S.subtitle}>Join the MindTrack Counsellor Portal</p>

                {error && <div style={S.error}>⚠ {error}</div>}

                <form onSubmit={handleSubmit}>
                    {[
                        { label: 'Full Name', key: 'name', type: 'text', ph: 'Dr. Priya Sharma' },
                        { label: 'Institutional Email', key: 'email', type: 'email', ph: 'counsellor@saec.ac.in' },
                        { label: 'Password (min 6 characters)', key: 'password', type: 'password', ph: '••••••••' },
                        { label: 'Institution', key: 'institution', type: 'text', ph: 'S.A. Engineering College' },
                        { label: 'Department', key: 'department', type: 'text', ph: 'Student Wellness' },
                    ].map(f => (
                        <div key={f.key}>
                            <label style={S.label}>{f.label}</label>
                            <input
                                style={S.input} type={f.type} required
                                value={(form as any)[f.key]}
                                onChange={e => set(f.key, e.target.value)}
                                placeholder={f.ph}
                            />
                        </div>
                    ))}
                    <button style={{ ...S.btn, opacity: loading ? 0.7 : 1 }} disabled={loading}>
                        {loading ? 'Creating account...' : 'Create Counsellor Account →'}
                    </button>
                </form>

                <div style={S.footer}>
                    Already have an account?{' '}
                    <Link href="/counsellor/login" style={{ color: '#e53e3e', fontWeight: 600 }}>
                        Sign in
                    </Link>
                </div>
            </div>
        </div>
    )
}
