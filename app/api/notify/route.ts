import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { Resend } from 'resend'
import { CATEGORY_LABELS } from '@/lib/types'

export async function POST(request: NextRequest) {
  try {
    const { reportId, status } = await request.json()

    if (!reportId || !status) {
      return NextResponse.json({ error: 'Missing reportId or status' }, { status: 400 })
    }

    // Only notify for verified or resolved
    if (status !== 'verified' && status !== 'resolved') {
      return NextResponse.json({ message: 'No notification needed' }, { status: 200 })
    }

    const resendApiKey = process.env.RESEND_API_KEY
    if (!resendApiKey) {
      console.warn('[notify] Missing RESEND_API_KEY, skipping email')
      return NextResponse.json({ message: 'Email skipped (missing key)' }, { status: 200 })
    }
    const resend = new Resend(resendApiKey)

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

    if (!supabaseServiceKey) {
      console.warn('[notify] Missing SUPABASE_SERVICE_ROLE_KEY, skipping user lookup')
      return NextResponse.json({ error: 'Server misconfiguration' }, { status: 500 })
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    // Fetch the report to get user_id and details
    const { data: report, error: reportError } = await supabase
      .from('reports')
      .select('*')
      .eq('id', reportId)
      .single()

    if (reportError || !report) {
      return NextResponse.json({ error: 'Report not found' }, { status: 404 })
    }

    if (!report.user_id) {
      return NextResponse.json({ message: 'Anonymous report, skipping email' }, { status: 200 })
    }

    // Fetch the user's email using auth admin API
    const { data: userData, error: userError } = await supabase.auth.admin.getUserById(report.user_id)

    if (userError || !userData?.user?.email) {
      return NextResponse.json({ message: 'User or email not found, skipping' }, { status: 200 })
    }

    const email = userData.user.email
    const catLabel = CATEGORY_LABELS[report.category as keyof typeof CATEGORY_LABELS] ?? report.category

    let subject = ''
    let html = ''

    if (status === 'verified') {
      subject = 'Your report has been verified'
      html = `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; color: #1C1B19;">
          <div style="background: #D4502A; padding: 12px; color: #F2EEE6; font-weight: bold; text-transform: uppercase;">
            CivicTag Update
          </div>
          <div style="padding: 24px; border: 1px solid #e5e5e5; border-top: none;">
            <p>Your reported issue (<strong>${catLabel}</strong>) has been verified by the community.</p>
            <p><strong>Description:</strong> ${report.description}</p>
            <p>Current verifications: ${report.verification_count}</p>
          </div>
        </div>
      `
    } else if (status === 'resolved') {
      subject = 'Your reported issue has been resolved'
      html = `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; color: #1C1B19;">
          <div style="background: #D4502A; padding: 12px; color: #F2EEE6; font-weight: bold; text-transform: uppercase;">
            CivicTag Update
          </div>
          <div style="padding: 24px; border: 1px solid #e5e5e5; border-top: none;">
            <p>Your reported issue (<strong>${catLabel}</strong>) has been marked as resolved.</p>
            <p><strong>Description:</strong> ${report.description}</p>
            <p>Thank you for contributing to your community!</p>
          </div>
        </div>
      `
    }

    await resend.emails.send({
      from: 'CivicTag <onboarding@resend.dev>',
      to: email,
      subject,
      html,
    })

    return NextResponse.json({ success: true }, { status: 200 })
  } catch (err) {
    console.error('[notify] Unhandled error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
