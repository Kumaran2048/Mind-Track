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

    // ── Step 1: Get all students who have ever logged a mood ──────────────────
    // Distinct user_ids from mood_logs
    const { data: allLogs } = await supabase
        .from('mood_logs')
        .select('user_id')
        .order('user_id')

    if (!allLogs || allLogs.length === 0) return NextResponse.json([])

    // De-duplicate user IDs
    const allUserIds = [...new Set(allLogs.map((l: any) => l.user_id))]

    // ── Step 2: Get counsellor's existing manual assignments (custom nicknames) ─
    const { data: assignments } = await supabase
        .from('counsellor_patients')
        .select('id, patient_user_id, nickname, notes, added_at')
        .eq('counsellor_id', counsellor.id)

    // Build lookup: userId → assignment row
    const assignmentMap = new Map<string, any>()
    assignments?.forEach((a: any) => assignmentMap.set(a.patient_user_id, a))

    // ── Step 3: Auto-create counsellor_patients rows for new students ─────────
    let autoIndex = assignmentMap.size + 1
    const toInsert: any[] = []
    for (const uid of allUserIds) {
        if (!assignmentMap.has(uid)) {
            toInsert.push({
                counsellor_id: counsellor.id,
                patient_user_id: uid,
                nickname: `Student ${autoIndex}`,
                notes: '',
            })
            autoIndex++
        }
    }

    if (toInsert.length > 0) {
        const { data: inserted } = await supabase
            .from('counsellor_patients')
            .insert(toInsert)
            .select('id, patient_user_id, nickname, notes, added_at')
        inserted?.forEach((a: any) => assignmentMap.set(a.patient_user_id, a))
    }

    // ── Step 4: Fetch mood data for every student ─────────────────────────────
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()

    const patients = await Promise.all(
        allUserIds.map(async (uid, idx) => {
            const a = assignmentMap.get(uid)
            if (!a) return null

            // Last 7 mood logs
            const { data: recentLogs } = await supabase
                .from('mood_logs')
                .select('mood_score, substances, created_at')
                .eq('user_id', uid)
                .order('created_at', { ascending: false })
                .limit(7)

            // Logs in last 7 days for trend direction
            const { data: trendLogs } = await supabase
                .from('mood_logs')
                .select('mood_score, created_at')
                .eq('user_id', uid)
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

                if (trendLogs && trendLogs.length >= 3) {
                    const half = Math.floor(trendLogs.length / 2)
                    const firstAvg = trendLogs.slice(0, half).reduce((s: number, l: any) => s + l.mood_score, 0) / half
                    const secondAvg = trendLogs.slice(half).reduce((s: number, l: any) => s + l.mood_score, 0) / (trendLogs.length - half)
                    if (secondAvg > firstAvg + 0.5) trend = '📈'
                    else if (secondAvg < firstAvg - 0.5) trend = '📉'
                }
            }

            // Substance summary this week
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

    const validPatients = patients.filter(Boolean) as any[]

    // Sort: High → Medium → Low → None
    const order: Record<string, number> = { High: 0, Medium: 1, Low: 2, None: 3 }
    validPatients.sort((a, b) => (order[a.riskLevel] ?? 3) - (order[b.riskLevel] ?? 3))

    return NextResponse.json(validPatients)
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
