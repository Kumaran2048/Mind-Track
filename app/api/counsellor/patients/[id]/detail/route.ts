import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'
import { verifyCounsellorToken } from '@/lib/counsellorAuth'

function calcRisk(avgMood: number) {
    const score = Math.max(0, Math.round((10 - avgMood) * 10))
    return { score, level: score >= 60 ? 'High' : score >= 30 ? 'Medium' : 'Low' }
}

export async function GET(
    req: NextRequest,
    { params }: { params: { id: string } }
) {
    const counsellor = await verifyCounsellorToken(req)
    if (!counsellor) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    // Verify patient belongs to this counsellor
    const { data: assignment, error: aErr } = await supabase
        .from('counsellor_patients')
        .select('*')
        .eq('id', params.id)
        .eq('counsellor_id', counsellor.id)
        .single()

    if (aErr || !assignment) {
        return NextResponse.json({ error: 'Patient not found' }, { status: 404 })
    }

    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()

    // Mood logs (last 30 days) — NEVER include journal text content
    const { data: rawLogs } = await supabase
        .from('mood_logs')
        .select('id, mood_score, substances, time_of_day, journal_text, created_at')
        .eq('user_id', assignment.patient_user_id)
        .gte('created_at', thirtyDaysAgo)
        .order('created_at', { ascending: true })

    // Anonymise: replace journal_text with word count only
    const moodHistory = (rawLogs || []).map((l: any) => ({
        date: l.created_at,
        mood_score: l.mood_score,
        time_of_day: l.time_of_day,
        substances: l.substances || [],
        hasJournal: !!l.journal_text,
        journalWordCount: l.journal_text ? l.journal_text.trim().split(/\s+/).length : 0,
    }))

    // Risk timeline — 10 most recent "snapshots" (grouped by day)
    const dayMap = new Map<string, number[]>()
    moodHistory.forEach((l) => {
        const day = l.date.split('T')[0]
        if (!dayMap.has(day)) dayMap.set(day, [])
        dayMap.get(day)!.push(l.mood_score)
    })

    const riskTimeline = Array.from(dayMap.entries())
        .slice(-10)
        .map(([date, scores]) => {
            const avg = scores.reduce((a, b) => a + b, 0) / scores.length
            const { score, level } = calcRisk(avg)
            return { date, riskScore: score, riskLevel: level, avgMood: Math.round(avg * 10) / 10 }
        })

    // Substance summary this week
    const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()
    const weekLogs = moodHistory.filter((l) => l.date >= weekAgo)
    const substanceSummary: Record<string, number> = {}
    weekLogs.forEach((l) => {
        l.substances.forEach((s: string) => {
            substanceSummary[s] = (substanceSummary[s] || 0) + 1
        })
    })

    // Stats
    const recent7 = [...moodHistory].reverse().slice(0, 7)
    const avgMood7 = recent7.length
        ? recent7.reduce((s, l) => s + l.mood_score, 0) / recent7.length : 0
    const { score: currentRiskScore, level: currentRiskLevel } = recent7.length
        ? calcRisk(avgMood7) : { score: 0, level: 'None' }

    // SHAP-style explanations
    const shapExplanations: string[] = []
    if (currentRiskLevel === 'High') shapExplanations.push('Persistently low mood scores (below 4/10)')
    if (avgMood7 < 5) shapExplanations.push(`Average mood of ${avgMood7.toFixed(1)}/10 this week`)
    if (substanceSummary['Alcohol']) shapExplanations.push(`Alcohol consumption: ${substanceSummary['Alcohol']}x this week`)
    if (substanceSummary['Cannabis']) shapExplanations.push(`Cannabis usage: ${substanceSummary['Cannabis']}x this week`)
    if (weekLogs.length < 3) shapExplanations.push('Irregular logging — fewer than 3 entries this week')
    if (riskTimeline.length >= 3) {
        const last = riskTimeline[riskTimeline.length - 1]
        const prev = riskTimeline[riskTimeline.length - 3]
        if (last.riskScore > prev.riskScore + 10) shapExplanations.push('Risk score increasing over past 3 days')
    }

    return NextResponse.json({
        patient: {
            id: assignment.id,
            nickname: assignment.nickname,
            riskLevel: currentRiskLevel,
            riskScore: currentRiskScore,
            addedAt: assignment.added_at,
            notes: assignment.notes,
        },
        moodHistory,
        substanceLogs: moodHistory.filter((l) => l.substances.length > 0),
        riskTimeline,
        substanceSummary,
        shapExplanations,
        stats: {
            avgMood7: Math.round(avgMood7 * 10) / 10,
            totalLogs30: moodHistory.length,
            logsThisWeek: weekLogs.length,
            currentRiskScore,
        },
    })
}
