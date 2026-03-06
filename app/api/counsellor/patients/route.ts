import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'
import { verifyCounsellorToken } from '@/lib/counsellorAuth'

function calcRisk(avgMood: number) {
    const score = Math.max(0, Math.round((10 - avgMood) * 10))
    const level = score >= 60 ? 'High' : score >= 30 ? 'Medium' : 'Low'
    return { score, level }
}

export async function GET(req: NextRequest) {
    const counsellor = await verifyCounsellorToken(req)
    if (!counsellor) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    const { data: assignments } = await supabase
        .from('counsellor_patients')
        .select('id, patient_user_id, nickname, notes, added_at')
        .eq('counsellor_id', counsellor.id)

    if (!assignments || assignments.length === 0) return NextResponse.json([])

    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()

    const patients = await Promise.all(
        assignments.map(async (a) => {
            // Last 7 mood logs
            const { data: recentLogs } = await supabase
                .from('mood_logs')
                .select('mood_score, substances, created_at')
                .eq('user_id', a.patient_user_id)
                .order('created_at', { ascending: false })
                .limit(7)

            // Last 30 days for trend
            const { data: olderLogs } = await supabase
                .from('mood_logs')
                .select('mood_score, created_at')
                .eq('user_id', a.patient_user_id)
                .gte('created_at', sevenDaysAgo)
                .order('created_at', { ascending: true })

            let riskLevel = 'None'
            let riskScore = 0
            let avgMood7 = 0
            let lastActive = null
            let trend = '➡️'

            if (recentLogs && recentLogs.length > 0) {
                avgMood7 = recentLogs.reduce((s: number, l: any) => s + l.mood_score, 0) / recentLogs.length
                const r = calcRisk(avgMood7)
                riskLevel = r.level
                riskScore = r.score
                lastActive = recentLogs[0].created_at

                if (olderLogs && olderLogs.length >= 3) {
                    const half = Math.floor(olderLogs.length / 2)
                    const firstHalf = olderLogs.slice(0, half)
                    const secondHalf = olderLogs.slice(half)
                    const firstAvg = firstHalf.reduce((s: number, l: any) => s + l.mood_score, 0) / firstHalf.length
                    const secondAvg = secondHalf.reduce((s: number, l: any) => s + l.mood_score, 0) / secondHalf.length
                    if (secondAvg > firstAvg + 0.5) trend = '📈'
                    else if (secondAvg < firstAvg - 0.5) trend = '📉'
                }
            }

            // Substance summary (last 7 days)
            const substanceSummary: Record<string, number> = {}
            recentLogs?.forEach((l: any) => {
                l.substances?.forEach((s: string) => {
                    substanceSummary[s] = (substanceSummary[s] || 0) + 1
                })
            })

            return {
                patientId: a.id,
                nickname: a.nickname,
                riskLevel,
                riskScore,
                avgMood7: Math.round(avgMood7 * 10) / 10,
                lastActive,
                trend,
                substanceSummary,
                totalLogsThisWeek: recentLogs?.length || 0,
                notes: a.notes,
                addedAt: a.added_at,
                shapExplanations: buildShapExplanations(recentLogs || [], substanceSummary, riskLevel),
            }
        })
    )

    // Sort: High first, then Medium, Low, None
    const order: Record<string, number> = { High: 0, Medium: 1, Low: 2, None: 3 }
    patients.sort((a, b) => (order[a.riskLevel] ?? 3) - (order[b.riskLevel] ?? 3))

    return NextResponse.json(patients)
}

function buildShapExplanations(
    logs: any[], substances: Record<string, number>, riskLevel: string
): string[] {
    const out: string[] = []
    if (riskLevel === 'High') out.push('Consistently low mood scores (below 4) detected')
    if (riskLevel !== 'None' && riskLevel !== 'Low') out.push('Mood score trending downward over past 7 days')
    if (substances['Alcohol']) out.push(`Alcohol consumption logged ${substances['Alcohol']}x this week`)
    if (substances['Cannabis']) out.push(`Cannabis usage logged ${substances['Cannabis']}x this week`)
    if (logs.length < 3 && riskLevel !== 'None') out.push('Irregular logging pattern — missed days detected')
    return out.slice(0, 4)
}
