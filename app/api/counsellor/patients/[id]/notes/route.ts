import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'
import { verifyCounsellorToken } from '@/lib/counsellorAuth'

// PATCH /api/counsellor/patients/[id]/notes
export async function PATCH(
    req: NextRequest,
    { params }: { params: { id: string } }
) {
    const counsellor = await verifyCounsellorToken(req)
    if (!counsellor) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    const { notes } = await req.json()

    const { error } = await supabase
        .from('counsellor_patients')
        .update({ notes: notes ?? '' })
        .eq('id', params.id)
        .eq('counsellor_id', counsellor.id)

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ success: true, savedAt: new Date().toISOString() })
}
