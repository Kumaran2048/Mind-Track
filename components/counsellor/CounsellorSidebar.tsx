'use client'

import { usePathname, useRouter } from 'next/navigation'
import { useCounsellorAuth } from '@/context/CounsellorAuthContext'
import {
    LayoutDashboard, Users, FileText, AlertTriangle, LogOut, Brain
} from 'lucide-react'

const navItems = [
    { href: '/counsellor/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
    { href: '/counsellor/patients', icon: Users, label: 'My Patients' },
    { href: '/counsellor/reports', icon: FileText, label: 'Reports' },
    { href: '/counsellor/alerts', icon: AlertTriangle, label: 'High Risk Alerts' },
]

export function CounsellorSidebar() {
    const { counsellor, logout } = useCounsellorAuth()
    const pathname = usePathname()
    const router = useRouter()

    return (
        <aside style={{
            position: 'fixed', top: 0, left: 0, bottom: 0, width: 240,
            background: '#1a202c', display: 'flex', flexDirection: 'column',
            zIndex: 100, fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
        }}>
            {/* Logo */}
            <div style={{ padding: '28px 20px 20px', borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
                    <div style={{
                        width: 36, height: 36, background: '#e53e3e', borderRadius: 10,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                    }}>
                        <Brain size={20} color="#fff" />
                    </div>
                    <div>
                        <div style={{ color: '#fff', fontWeight: 800, fontSize: 15 }}>MindTrack</div>
                        <div style={{ color: '#a0aec0', fontSize: 10, fontWeight: 600, textTransform: 'uppercase', letterSpacing: 0.5 }}>
                            Counsellor Portal
                        </div>
                    </div>
                </div>
                {counsellor && (
                    <div style={{ background: 'rgba(255,255,255,0.06)', borderRadius: 10, padding: '10px 12px' }}>
                        <div style={{ color: '#e2e8f0', fontSize: 13, fontWeight: 600 }}>
                            {counsellor.name}
                        </div>
                        <div style={{ color: '#718096', fontSize: 11, marginTop: 2 }}>
                            {counsellor.institution}
                        </div>
                    </div>
                )}
            </div>

            {/* Navigation */}
            <nav style={{ flex: 1, padding: '16px 12px', overflowY: 'auto' }}>
                {navItems.map(({ href, icon: Icon, label }) => {
                    const isActive = pathname === href || pathname.startsWith(href + '/')
                    return (
                        <button
                            key={href}
                            onClick={() => router.push(href)}
                            style={{
                                display: 'flex', alignItems: 'center', gap: 10, width: '100%',
                                padding: '10px 12px', borderRadius: 10, border: 'none', cursor: 'pointer',
                                marginBottom: 4, transition: 'all 0.15s',
                                background: isActive ? '#e53e3e' : 'transparent',
                                color: isActive ? '#fff' : '#a0aec0',
                                fontWeight: isActive ? 700 : 500, fontSize: 14,
                                textAlign: 'left',
                            }}
                        >
                            <Icon size={18} />
                            {label}
                        </button>
                    )
                })}
            </nav>

            {/* Sign Out */}
            <div style={{ padding: '16px 12px', borderTop: '1px solid rgba(255,255,255,0.08)' }}>
                <button
                    onClick={logout}
                    style={{
                        display: 'flex', alignItems: 'center', gap: 10, width: '100%',
                        padding: '10px 12px', borderRadius: 10, border: 'none', cursor: 'pointer',
                        background: 'transparent', color: '#fc8181', fontSize: 14, fontWeight: 600,
                    }}
                >
                    <LogOut size={16} />
                    Sign Out
                </button>
            </div>
        </aside>
    )
}
