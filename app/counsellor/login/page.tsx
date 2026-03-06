'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
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
        maxWidth: 400, width: '100%',
        boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
    } as React.CSSProperties,
    iconRing: {
        width: 80, height: 80, borderRadius: '50%',
        background: 'linear-gradient(135deg, #fff5f5, #fed7d7)',
        border: '3px solid #fc8181',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: 36, margin: '0 auto 20px',
    } as React.CSSProperties,
    title: { textAlign: 'center' as const, fontSize: 24, fontWeight: 800, color: '#1a202c', margin: '0 0 4px' },
    subtitle: { textAlign: 'center' as const, color: '#e53e3e', fontWeight: 700, fontSize: 15, margin: '0 0 4px' },
    subsubtitle: { textAlign: 'center' as const, color: '#718096', fontSize: 13, margin: '0 0 16px' },
    badge: {
        display: 'block', textAlign: 'center' as const,
        background: '#1a202c', color: '#fff', fontSize: 11, fontWeight: 700,
        padding: '6px 16px', borderRadius: 20, margin: '0 auto 24px',
        width: 'fit-content', letterSpacing: 0.5,
    } as React.CSSProperties,
    label: {
        display: 'block', fontSize: 11, fontWeight: 700, color: '#4a5568',
        textTransform: 'uppercase' as const, letterSpacing: 0.5, marginBottom: 6,
    },
    input: {
        width: '100%', padding: '10px 14px', borderRadius: 10,
        border: '1.5px solid #e2e8f0', fontSize: 14, color: '#1a202c',
        outline: 'none', boxSizing: 'border-box' as const, marginBottom: 16,
        background: '#f7fafc',
    } as React.CSSProperties,
    btn: {
        width: '100%', padding: '12px', borderRadius: 10, border: 'none',
        background: '#e53e3e', color: '#fff', fontSize: 15, fontWeight: 700,
        cursor: 'pointer', marginTop: 4,
    } as React.CSSProperties,
    error: {
        background: '#fff5f5', border: '1px solid #fed7d7',
        color: '#c53030', borderRadius: 10, padding: '10px 14px',
        fontSize: 13, marginBottom: 16,
    } as React.CSSProperties,
    footer: { textAlign: 'center' as const, marginTop: 20, fontSize: 13, color: '#718096' },
}

export default function CounsellorLogin() {
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [error, setError] = useState('')
    const [loading, setLoading] = useState(false)
    const { login } = useCounsellorAuth()

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setError('')
        setLoading(true)
        try {
            await login(email, password)
        } catch (err: any) {
            setError(err.message || 'Login failed. Please check your credentials.')
        } finally {
            setLoading(false)
        }
    }

    return (
        <div style={S.page}>
            <div style={S.card}>
                <div style={S.iconRing}>🏫</div>
                <h1 style={S.title}>Counsellor Portal</h1>
                <p style={S.subtitle}>S.A. Engineering College</p>
                <p style={S.subsubtitle}>Student Wellness Department</p>
                <span style={S.badge}>🔐 Authorized Personnel Only</span>

                {error && <div style={S.error}>⚠ {error}</div>}

                <form onSubmit={handleSubmit}>
                    <label style={S.label}>Institutional Email</label>
                    <input
                        style={S.input} type="email" required
                        value={email} onChange={e => setEmail(e.target.value)}
                        placeholder="counsellor@saec.ac.in"
                    />
                    <label style={S.label}>Password</label>
                    <input
                        style={S.input} type="password" required
                        value={password} onChange={e => setPassword(e.target.value)}
                        placeholder="••••••••"
                    />
                    <button style={{ ...S.btn, opacity: loading ? 0.7 : 1 }} disabled={loading}>
                        {loading ? 'Signing in...' : 'Sign In to Dashboard →'}
                    </button>
                </form>

                <div style={S.footer}>
                    <div style={{ marginBottom: 6 }}>
                        New counsellor?{' '}
                        <Link href="/counsellor/register" style={{ color: '#e53e3e', fontWeight: 600 }}>
                            Register here
                        </Link>
                    </div>
                    <div>
                        Student?{' '}
                        <Link href="/auth/login" style={{ color: '#718096' }}>
                            Go to student login
                        </Link>
                    </div>
                </div>
            </div>
        </div>
    )
}
