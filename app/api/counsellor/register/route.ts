import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'
import { hashPassword } from '@/lib/counsellorAuth'
import { randomUUID } from 'crypto'

export async function POST(req: NextRequest) {
    try {
        const supabase = createClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.SUPABASE_SERVICE_ROLE_KEY!
        )

        const { email, password, name, institution, department } = await req.json()

        if (!email || !password || !name) {
            return NextResponse.json({ error: 'Name, email, and password are required' }, { status: 400 })
        }
        if (password.length < 6) {
            return NextResponse.json({ error: 'Password must be at least 6 characters' }, { status: 400 })
        }

        const hashed = hashPassword(password)

        const { data: counsellor, error } = await supabase
            .from('counsellors')
            .insert({
                email: email.toLowerCase().trim(),
                name: name.trim(),
                institution: institution?.trim() || 'S.A. Engineering College',
                department: department?.trim() || 'Student Wellness',
                password_hash: hashed,
            })
            .select('id, email, name, institution, department, created_at')
            .single()

        if (error) {
            if (error.code === '23505') {
                return NextResponse.json({ error: 'An account with this email already exists' }, { status: 409 })
            }
            return NextResponse.json({ error: error.message }, { status: 500 })
        }

        // Create session
        const token = randomUUID()
        const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)

        await supabase.from('counsellor_sessions').insert({
            token,
            counsellor_id: counsellor!.id,
            expires_at: expiresAt.toISOString(),
        })

        return NextResponse.json({ counsellor, token }, { status: 201 })
    } catch (err: any) {
        return NextResponse.json({ error: err.message }, { status: 500 })
    }
}
