import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'
import { verifyCounsellorToken } from '@/lib/counsellorAuth'

export async function POST(req: NextRequest) {
    const counsellor = await verifyCounsellorToken(req)
    if (!counsellor) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    const { studentEmail, nickname } = await req.json()
    if (!studentEmail || !nickname) {
        return NextResponse.json({ error: 'Student email and nickname are required' }, { status: 400 })
    }

    // Find the student's user by email in Supabase auth
    const { data: usersData, error: userErr } = await supabase.auth.admin.listUsers()
    if (userErr) return NextResponse.json({ error: 'Could not look up user' }, { status: 500 })

    const student = usersData?.users?.find(
        (u) => u.email?.toLowerCase() === studentEmail.toLowerCase().trim()
    )

    if (!student) {
        return NextResponse.json({ error: 'No MindTrack account found with that email address' }, { status: 404 })
    }

    // Add the patient
    const { data, error } = await supabase
        .from('counsellor_patients')
        .insert({
            counsellor_id: counsellor.id,
            patient_user_id: student.id,
            nickname: nickname.trim(),
        })
        .select()
        .single()

    if (error) {
        if (error.code === '23505') {
            return NextResponse.json({ error: 'This student is already in your patient list' }, { status: 409 })
        }
        return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ patient: data }, { status: 201 })
}
