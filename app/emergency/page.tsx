'use client'

import { useState } from 'react'
import { Heart, Phone, MessageCircle, AlertTriangle, Zap } from 'lucide-react'
import { Card } from '@/components/ui/card'
import Link from 'next/link'

const CRISIS_RESOURCES = [
  {
    name: 'National Crisis Hotline',
    number: '988',
    description: 'Free, confidential, 24/7 support',
    icon: Phone,
  },
  {
    name: 'Crisis Text Line',
    number: 'Text 741741',
    description: 'Text-based mental health support',
    icon: MessageCircle,
  },
  {
    name: 'Emergency Services',
    number: '911',
    description: 'For immediate life-threatening emergencies',
    icon: AlertTriangle,
  },
]

const GROUNDING_TECHNIQUES = [
  {
    name: '5-4-3-2-1 Technique',
    description: 'Name 5 things you see, 4 you hear, 3 you feel, 2 you smell, 1 you taste',
  },
  {
    name: 'Box Breathing',
    description: 'Breathe in for 4, hold for 4, out for 4, hold for 4. Repeat 5 times.',
  },
  {
    name: 'Progressive Muscle Relaxation',
    description:
      'Tense and relax each muscle group from toes to head, 5 seconds each',
  },
  {
    name: 'Grounding Through Touch',
    description:
      'Hold ice, splash cold water, or touch different textures to anchor yourself',
  },
  {
    name: 'Walk & Observe',
    description: 'Take a 5-10 minute walk and notice small details around you',
  },
  {
    name: 'Guided Imagery',
    description:
      'Visualize a safe, calm place in detail - colors, sounds, smells',
  },
]

export default function EmergencyPage() {
  const [expandedTechnique, setExpandedTechnique] = useState<string | null>(null)

  return (
    <div className="min-h-screen bg-gradient-to-b from-red-50 to-white pb-20">
      {/* Header */}
      <div className="bg-gradient-to-r from-red-50 to-orange-50 border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-md mx-auto px-4 py-4">
          <Link href="/dashboard" className="text-gray-600 text-sm font-medium mb-4 inline-block hover:text-gray-900">
            ← Back to dashboard
          </Link>
          <div className="flex items-center gap-3">
            <Heart className="w-6 h-6 text-red-500 fill-red-500" />
            <h1 className="text-2xl font-bold text-gray-900">You're Not Alone</h1>
          </div>
        </div>
      </div>

      <div className="max-w-md mx-auto px-4 py-6">
        {/* Intro */}
        <Card className="bg-white border border-gray-200 mb-6">
          <div className="p-6 text-center">
            <p className="text-gray-700 mb-2">
              If you're struggling, there are people who care and want to help.
            </p>
            <p className="text-sm text-gray-600">
              Reach out to a crisis counselor, call a helpline, or use these
              grounding techniques to feel more stable right now.
            </p>
          </div>
        </Card>

        {/* Crisis Resources */}
        <h2 className="text-xl font-bold text-gray-900 mb-4">Crisis Resources</h2>
        <div className="space-y-3 mb-8">
          {CRISIS_RESOURCES.map((resource) => {
            const Icon = resource.icon
            return (
              <Card
                key={resource.name}
                className="bg-white border-2 border-red-200 hover:shadow-lg transition"
              >
                <a
                  href={`tel:${resource.number.replace(/\D/g, '')}`}
                  className="p-4 flex items-start gap-4"
                >
                  <Icon className="w-6 h-6 text-red-500 flex-shrink-0 mt-1" />
                  <div className="flex-1">
                    <p className="font-bold text-gray-900">{resource.name}</p>
                    <p className="text-lg font-semibold text-red-600">
                      {resource.number}
                    </p>
                    <p className="text-sm text-gray-600 mt-1">
                      {resource.description}
                    </p>
                  </div>
                  <span className="text-2xl">→</span>
                </a>
              </Card>
            )
          })}
        </div>

        {/* Grounding Techniques */}
        <h2 className="text-xl font-bold text-gray-900 mb-4">
          Grounding Techniques
        </h2>
        <p className="text-sm text-gray-600 mb-4">
          Try one of these techniques to help you feel more present and calm:
        </p>

        <div className="space-y-3 mb-8">
          {GROUNDING_TECHNIQUES.map((technique) => (
            <Card
              key={technique.name}
              className="bg-white border border-gray-200 cursor-pointer hover:shadow-md transition"
              onClick={() =>
                setExpandedTechnique(
                  expandedTechnique === technique.name ? null : technique.name
                )
              }
            >
              <div className="p-4">
                <div className="flex items-center gap-3">
                  <Zap className="w-5 h-5 text-orange-500 flex-shrink-0" />
                  <div className="flex-1">
                    <p className="font-semibold text-gray-900">
                      {technique.name}
                    </p>
                    {expandedTechnique === technique.name && (
                      <p className="text-sm text-gray-600 mt-2">
                        {technique.description}
                      </p>
                    )}
                  </div>
                  <span
                    className={`text-xl transition transform ${
                      expandedTechnique === technique.name ? 'rotate-180' : ''
                    }`}
                  >
                    ↓
                  </span>
                </div>
              </div>
            </Card>
          ))}
        </div>

        {/* Additional Support */}
        <Card className="bg-gradient-to-r from-orange-50 to-red-50 border border-orange-200 mb-6">
          <div className="p-6">
            <h3 className="font-bold text-gray-900 mb-2">Remember:</h3>
            <ul className="text-sm text-gray-700 space-y-2">
              <li>✓ Your feelings are valid</li>
              <li>✓ This is temporary - things can get better</li>
              <li>✓ You deserve support and care</li>
              <li>✓ Reaching out is a sign of strength</li>
            </ul>
          </div>
        </Card>

        {/* Return to Dashboard */}
        <Link
          href="/dashboard"
          className="block text-center bg-red-500 hover:bg-red-600 text-white font-semibold py-3 rounded-lg transition"
        >
          Back to Dashboard
        </Link>
      </div>
    </div>
  )
}
