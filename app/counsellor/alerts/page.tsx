'use client'
import { CounsellorSidebar } from '@/components/counsellor/CounsellorSidebar'
export default function CounsellorAlerts() {
    return (
        <div style={{ display: 'flex', minHeight: '100vh', background: '#f7fafc', fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif" }}>
            <CounsellorSidebar />
            <main style={{ marginLeft: 240, flex: 1, padding: '48px 36px', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 12 }}>
                <div style={{ fontSize: 48 }}>🚨</div>
                <h2 style={{ fontSize: 22, fontWeight: 700, color: '#1a202c', margin: 0 }}>High Risk Alerts</h2>
                <p style={{ color: '#718096', fontSize: 14 }}>Real-time alert system coming soon. Check the Patients list for current risk levels.</p>
            </main>
        </div>
    )
}
