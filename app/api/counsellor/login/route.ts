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

        const { email, password } = await req.json()
        if (!email || !password) {
            return NextResponse.json({ error: 'Email and password are required' }, { status: 400 })
        }

        const hashed = hashPassword(password)

        const { data: counsellor, error } = await supabase
            .from('counsellors')
            .select('*')
            .eq('email', email.toLowerCase().trim())
            .eq('password_hash', hashed)
            .single()

        if (error || !counsellor) {
            return NextResponse.json({ error: 'Invalid email or password' }, { status: 401 })
        }

        // Create a session token
        const token = randomUUID()
        const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)

        await supabase.from('counsellor_sessions').insert({
            token,
            counsellor_id: counsellor.id,
            expires_at: expiresAt.toISOString(),
        })

        const { password_hash, ...safe } = counsellor
        return NextResponse.json({ counsellor: safe, token })
    } catch (err: any) {
        return NextResponse.json({ error: err.message }, { status: 500 })
    }
}
