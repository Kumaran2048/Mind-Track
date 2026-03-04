import { Card } from '@/components/ui/card'

interface MoodScoreCardProps {
  moodScore: number
  trend: 'up' | 'down' | 'stable'
}

export function MoodScoreCard({ moodScore, trend }: MoodScoreCardProps) {
  const getMoodEmoji = (score: number) => {
    if (score <= 3) return '😢'
    if (score <= 5) return '😕'
    if (score <= 7) return '😐'
    if (score <= 9) return '🙂'
    return '😊'
  }

  const getMoodLabel = (score: number) => {
    if (score <= 2) return 'Very Poor'
    if (score <= 4) return 'Poor'
    if (score <= 6) return 'Fair'
    if (score <= 8) return 'Good'
    return 'Excellent'
  }

  return (
    <Card className="bg-white border border-gray-200">
      <div className="p-6">
        <h3 className="text-sm font-medium text-gray-600 mb-4">Today's Mood Score</h3>
        <div className="flex items-center justify-between">
          <div>
            <div className="text-5xl mb-2">{getMoodEmoji(moodScore)}</div>
            <p className="text-3xl font-bold text-gray-900">{moodScore}/10</p>
            <p className="text-sm text-gray-600 mt-1">{getMoodLabel(moodScore)}</p>
          </div>
          <div className="text-right">
            <div className={`text-2xl ${trend === 'up' ? 'text-green-500' : trend === 'down' ? 'text-red-500' : 'text-gray-400'}`}>
              {trend === 'up' ? '↑' : trend === 'down' ? '↓' : '→'}
            </div>
            <p className="text-xs text-gray-600 mt-2">
              {trend === 'up' ? 'Improving' : trend === 'down' ? 'Declining' : 'Stable'}
            </p>
          </div>
        </div>
      </div>
    </Card>
  )
}
