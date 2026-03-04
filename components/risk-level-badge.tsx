import { AlertCircle, AlertTriangle, CheckCircle } from 'lucide-react'

interface RiskLevelBadgeProps {
  riskLevel: 'low' | 'medium' | 'high'
}

export function RiskLevelBadge({ riskLevel }: RiskLevelBadgeProps) {
  const getConfig = () => {
    switch (riskLevel) {
      case 'low':
        return {
          bg: 'bg-green-50',
          border: 'border-green-200',
          text: 'text-green-700',
          icon: CheckCircle,
          label: 'Low Risk',
        }
      case 'medium':
        return {
          bg: 'bg-yellow-50',
          border: 'border-yellow-200',
          text: 'text-yellow-700',
          icon: AlertTriangle,
          label: 'Medium Risk',
        }
      case 'high':
        return {
          bg: 'bg-red-50',
          border: 'border-red-200',
          text: 'text-red-700',
          icon: AlertCircle,
          label: 'High Risk',
        }
    }
  }

  const config = getConfig()
  const Icon = config.icon

  return (
    <div className={`${config.bg} border ${config.border} ${config.text} px-4 py-3 rounded-lg flex items-center gap-3`}>
      <Icon className="w-5 h-5" />
      <div>
        <p className="font-semibold text-sm">{config.label}</p>
        <p className="text-xs opacity-75">Based on recent patterns</p>
      </div>
    </div>
  )
}
