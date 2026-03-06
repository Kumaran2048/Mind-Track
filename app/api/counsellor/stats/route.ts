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

    // Get all patients assigned to this counsellor
    const { data: assignments } = await supabase
        .from('counsellor_patients')
        .select('patient_user_id, nickname, added_at')
        .eq('counsellor_id', counsellor.id)

    if (!assignments || assignments.length === 0) {
        return NextResponse.json({
            totalPatients: 0, highRiskCount: 0, avgRiskScore: 0,
            riskCounts: { High: 0, Medium: 0, Low: 0, None: 0 },
        })
    }

    const riskCounts = { High: 0, Medium: 0, Low: 0, None: 0 }
    let totalRisk = 0
    let assessed = 0

    for (const a of assignments) {
        const { data: logs } = await supabase
            .from('mood_logs')
            .select('mood_score')
            .eq('user_id', a.patient_user_id)
            .order('created_at', { ascending: false })
            .limit(7)

        if (!logs || logs.length === 0) {
            riskCounts.None++
        } else {
            const avg = logs.reduce((s: number, l: any) => s + l.mood_score, 0) / logs.length
            const { score, level } = calcRisk(avg)
            riskCounts[level as keyof typeof riskCounts]++
            totalRisk += score
            assessed++
        }
    }

    return NextResponse.json({
        totalPatients: assignments.length,
        highRiskCount: riskCounts.High,
        avgRiskScore: assessed > 0 ? Math.round(totalRisk / assessed) : 0,
        riskCounts,
    })
}
