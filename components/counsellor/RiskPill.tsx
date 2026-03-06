'use client'

export function RiskPill({ level }: { level: string }) {
    const styles: Record<string, React.CSSProperties> = {
        High: {
            background: '#fff5f5', color: '#c53030', border: '1px solid #feb2b2',
            padding: '3px 12px', borderRadius: 20, fontSize: 12, fontWeight: 700,
            display: 'inline-block', whiteSpace: 'nowrap',
        },
        Medium: {
            background: '#fffaf0', color: '#c05621', border: '1px solid #fbd38d',
            padding: '3px 12px', borderRadius: 20, fontSize: 12, fontWeight: 700,
            display: 'inline-block', whiteSpace: 'nowrap',
        },
        Low: {
            background: '#f0fff4', color: '#276749', border: '1px solid #9ae6b4',
            padding: '3px 12px', borderRadius: 20, fontSize: 12, fontWeight: 700,
            display: 'inline-block', whiteSpace: 'nowrap',
        },
        None: {
            background: '#f7fafc', color: '#718096', border: '1px solid #e2e8f0',
            padding: '3px 12px', borderRadius: 20, fontSize: 12, fontWeight: 700,
            display: 'inline-block', whiteSpace: 'nowrap',
        },
    }
    const s = styles[level] || styles.None
    return <span style={s}>{level === 'None' ? 'Not Assessed' : level}</span>
}
