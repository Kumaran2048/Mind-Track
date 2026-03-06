'use client'

export function StatCard({
    emoji, label, value, valueColor = '#1a202c', suffix = '',
}: {
    emoji: string; label: string; value: string | number
    valueColor?: string; suffix?: string
}) {
    return (
        <div style={{
            background: '#fff', borderRadius: 14, padding: '24px 20px',
            boxShadow: '0 1px 8px rgba(0,0,0,0.06)', flex: 1, textAlign: 'center',
        }}>
            <div style={{ fontSize: 32, marginBottom: 8 }}>{emoji}</div>
            <div style={{ fontSize: 28, fontWeight: 800, color: valueColor, lineHeight: 1 }}>
                {value}{suffix}
            </div>
            <div style={{ fontSize: 11, fontWeight: 700, color: '#718096', textTransform: 'uppercase', letterSpacing: 0.5, marginTop: 6 }}>
                {label}
            </div>
        </div>
    )
}
