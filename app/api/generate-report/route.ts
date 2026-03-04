import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Calculate date range (last 7 days)
    const endDate = new Date()
    const startDate = new Date(endDate.getTime() - 7 * 24 * 60 * 60 * 1000)

    // Fetch mood logs for the week
    const { data: logs, error } = await supabase
      .from('mood_logs')
      .select('mood_score, substances_used, created_at, journal_text')
      .eq('user_id', user.id)
      .gte('created_at', startDate.toISOString())
      .lte('created_at', endDate.toISOString())
      .order('created_at', { ascending: false })

    if (error) throw error

    // Calculate statistics
    const stats = {
      totalEntries: logs?.length || 0,
      averageMood: logs && logs.length > 0 ? (logs.reduce((sum, l) => sum + l.mood_score, 0) / logs.length).toFixed(1) : 0,
      highestMood: logs && logs.length > 0 ? Math.max(...logs.map((l) => l.mood_score)) : 0,
      lowestMood: logs && logs.length > 0 ? Math.min(...logs.map((l) => l.mood_score)) : 0,
      mostCommonSubstance: calculateMostCommonSubstance(logs),
    }

    // Generate HTML PDF content
    const htmlContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="UTF-8">
          <style>
            body {
              font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Arial, sans-serif;
              max-width: 800px;
              margin: 0 auto;
              padding: 40px;
              background: #fff;
              color: #333;
            }
            .header {
              text-align: center;
              border-bottom: 3px solid #ef4444;
              padding-bottom: 20px;
              margin-bottom: 30px;
            }
            .header h1 {
              color: #000;
              margin: 0;
              font-size: 28px;
            }
            .header p {
              color: #666;
              margin: 5px 0 0 0;
            }
            .stats-grid {
              display: grid;
              grid-template-columns: 1fr 1fr;
              gap: 15px;
              margin-bottom: 30px;
            }
            .stat-card {
              background: #f9fafb;
              border: 1px solid #e5e7eb;
              border-radius: 8px;
              padding: 15px;
              text-align: center;
            }
            .stat-value {
              font-size: 24px;
              font-weight: bold;
              color: #ef4444;
            }
            .stat-label {
              font-size: 12px;
              color: #666;
              margin-top: 5px;
            }
            .section-title {
              font-size: 18px;
              font-weight: bold;
              margin-top: 30px;
              margin-bottom: 15px;
              border-left: 4px solid #ef4444;
              padding-left: 10px;
            }
            .entry {
              background: #f9fafb;
              border: 1px solid #e5e7eb;
              border-radius: 8px;
              padding: 12px;
              margin-bottom: 10px;
            }
            .entry-header {
              display: flex;
              justify-content: space-between;
              margin-bottom: 8px;
            }
            .entry-date {
              font-size: 12px;
              color: #666;
            }
            .entry-mood {
              font-size: 16px;
              font-weight: bold;
              color: #ef4444;
            }
            .entry-text {
              font-size: 12px;
              color: #666;
              line-height: 1.5;
            }
            .footer {
              margin-top: 40px;
              padding-top: 20px;
              border-top: 1px solid #e5e7eb;
              text-align: center;
              font-size: 12px;
              color: #666;
            }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>📊 Your Weekly Mood Report</h1>
            <p>${startDate.toLocaleDateString()} - ${endDate.toLocaleDateString()}</p>
          </div>

          <div class="stats-grid">
            <div class="stat-card">
              <div class="stat-value">${stats.totalEntries}</div>
              <div class="stat-label">Entries Logged</div>
            </div>
            <div class="stat-card">
              <div class="stat-value">${stats.averageMood}/10</div>
              <div class="stat-label">Average Mood</div>
            </div>
            <div class="stat-card">
              <div class="stat-value">${stats.highestMood}</div>
              <div class="stat-label">Highest Mood</div>
            </div>
            <div class="stat-card">
              <div class="stat-value">${stats.lowestMood}</div>
              <div class="stat-label">Lowest Mood</div>
            </div>
          </div>

          ${stats.mostCommonSubstance ? `
            <div style="background: #fef2f2; border-left: 4px solid #ef4444; padding: 15px; margin-bottom: 30px;">
              <strong>Most Tracked Substance:</strong> ${stats.mostCommonSubstance}
            </div>
          ` : ''}

          <div class="section-title">📝 Recent Entries</div>
          ${
            logs && logs.length > 0
              ? logs
                  .slice(0, 10)
                  .map(
                    (log) => `
            <div class="entry">
              <div class="entry-header">
                <span class="entry-date">${new Date(log.created_at).toLocaleDateString()}</span>
                <span class="entry-mood">${log.mood_score}/10</span>
              </div>
              ${log.journal_text ? `<div class="entry-text">${log.journal_text.substring(0, 100)}...</div>` : ''}
            </div>
          `
                  )
                  .join('')
              : '<p style="color: #999;">No entries this week</p>'
          }

          <div class="footer">
            <p>Generated on ${new Date().toLocaleDateString()} | MindTrack Wellness Report</p>
          </div>
        </body>
      </html>
    `

    return NextResponse.json({ html: htmlContent })
  } catch (error) {
    console.error('[v0] Error generating report:', error)
    return NextResponse.json({ error: 'Failed to generate report' }, { status: 500 })
  }
}

function calculateMostCommonSubstance(logs: any[]): string | null {
  const substanceCount: Record<string, number> = {}

  logs?.forEach((log) => {
    if (log.substances_used && Array.isArray(log.substances_used)) {
      log.substances_used.forEach((substance: string) => {
        substanceCount[substance] = (substanceCount[substance] || 0) + 1
      })
    }
  })

  const entries = Object.entries(substanceCount)
  if (entries.length === 0) return null

  return entries.sort((a, b) => b[1] - a[1])[0][0]
}
