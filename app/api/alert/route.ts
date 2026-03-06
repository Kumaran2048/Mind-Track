import { createClient } from '@supabase/supabase-js'
import { Resend } from 'resend'

export async function POST(req: Request) {
  // Initialise clients inside the handler so env vars are read at request-time,
  // not at build-time (which causes "supabaseUrl is required" on Vercel).
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
  const resend = new Resend(process.env.RESEND_API_KEY)

  try {
    const { userId } = await req.json()
    if (!userId) return new Response('Missing userId', { status: 400 })

    // 1. Get the most recent mood log for this user
    const { data: logs, error: logsError } = await supabase
      .from('mood_logs')
      .select('mood_score, created_at')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(1)

    if (logsError || !logs || logs.length === 0) {
      return new Response(JSON.stringify({ alert: false, reason: 'Not enough data' }), { status: 200 })
    }

    // 2. Check if the most recent entry is high-risk (score <= 4)
    const allHighRisk = logs.every((log: { mood_score: number }) => log.mood_score <= 4)

    if (!allHighRisk) {
      return new Response(JSON.stringify({ alert: false }), { status: 200 })
    }

    // 3. Get user profile for trusted contact email
    const { data: profile } = await supabase
      .from('profiles')
      .select('trusted_contact_email, trusted_contact_name')
      .eq('id', userId)
      .single()

    if (!profile?.trusted_contact_email) {
      return new Response(JSON.stringify({ alert: true, emailSent: false, reason: 'No trusted contact set' }), { status: 200 })
    }

    // 4. Get user email
    const { data: userData } = await supabase.auth.admin.getUserById(userId)
    const userEmail = userData?.user?.email || 'your loved one'

    // 5. Send alert email via Resend
    await resend.emails.send({
      from: 'onboarding@resend.dev',
      to: profile.trusted_contact_email,
      subject: '⚠️ MindTrack: Wellness Alert for Someone You Care About',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background: linear-gradient(135deg, #ef4444, #f97316); padding: 20px; border-radius: 12px 12px 0 0; text-align: center;">
            <h1 style="color: white; margin: 0; font-size: 24px;">🧠 MindTrack Wellness Alert</h1>
          </div>
          <div style="background: #fff7f7; border: 1px solid #fecaca; border-top: none; border-radius: 0 0 12px 12px; padding: 24px;">
            <p style="font-size: 16px; color: #374151;">Dear ${profile.trusted_contact_name || 'Trusted Contact'},</p>
            <p style="font-size: 15px; color: #374151;">
              Someone you care about has reported a <strong style="color: #dc2626;">high-risk mood score (4/10 or below)</strong> in their MindTrack wellness journal today.
            </p>
            <div style="background: #fee2e2; border-left: 4px solid #dc2626; padding: 16px; border-radius: 0 8px 8px 0; margin: 16px 0;">
              <p style="margin: 0; font-weight: bold; color: #b91c1c;">⚠️ This may indicate they need support</p>
              <p style="margin: 8px 0 0; color: #b91c1c; font-size: 14px;">Please check in with them when you can.</p>
            </div>
            <p style="font-size: 14px; color: #6b7280;">
              This is an automated alert from MindTrack. The user has pre-authorized you as their trusted contact.
            </p>
            <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 20px 0;" />
            <p style="font-size: 12px; color: #9ca3af; text-align: center;">
              MindTrack — Mental Wellness Tracker | This alert is not a substitute for professional mental health care.
              <br>If you believe this person is in immediate danger, please call emergency services.
            </p>
          </div>
        </div>
      `,
    })

    console.log(`[Alert] Sent high-risk alert email to ${profile.trusted_contact_email}`)
    return new Response(JSON.stringify({ alert: true, emailSent: true }), { status: 200 })

  } catch (err: any) {
    console.error('[Alert API Error]:', err.message)
    return new Response(JSON.stringify({ error: err.message }), { status: 500 })
  }
}
