import { createClient } from '@supabase/supabase-js'

/**
 * Verifies the Bearer token from an incoming API request.
 * Returns the counsellor object if valid, null otherwise.
 * Uses service role key so it bypasses RLS.
 */
export async function verifyCounsellorToken(request: Request): Promise<any | null> {
    try {
        const auth = request.headers.get('Authorization')
        if (!auth?.startsWith('Bearer ')) return null
        const token = auth.slice(7).trim()
        if (!token) return null

        const supabase = createClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.SUPABASE_SERVICE_ROLE_KEY!
        )

        const { data: session, error } = await supabase
            .from('counsellor_sessions')
            .select('counsellor_id, expires_at, counsellors(id, email, name, institution, department, created_at)')
            .eq('token', token)
            .single()

        if (error || !session) return null
        if (new Date(session.expires_at) < new Date()) {
            // Expired — clean up
            await supabase.from('counsellor_sessions').delete().eq('token', token)
            return null
        }

        return session.counsellors as any
    } catch {
        return null
    }
}

/**
 * Hash a password using SHA-256 + app secret.
 */
export function hashPassword(password: string): string {
    const { createHash } = require('crypto')
    const secret = process.env.COUNSELLOR_SECRET || 'mindtrack-counsellor-secret-2024'
    return createHash('sha256').update(password + secret).digest('hex')
}
