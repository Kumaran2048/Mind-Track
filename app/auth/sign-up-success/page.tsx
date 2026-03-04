'use client'

import Link from 'next/link'
import { Heart, CheckCircle } from 'lucide-react'

export default function SignUpSuccessPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-white px-4">
      <div className="w-full max-w-md text-center">
        <div className="flex justify-center mb-8">
          <div className="flex items-center gap-2">
            <Heart className="w-8 h-8 text-red-500 fill-red-500" />
            <h1 className="text-3xl font-bold text-gray-900">MindTrack</h1>
          </div>
        </div>

        <div className="bg-gray-50 rounded-lg p-8">
          <div className="flex justify-center mb-6">
            <CheckCircle className="w-16 h-16 text-green-500" />
          </div>

          <h2 className="text-2xl font-bold text-gray-900 mb-2">Account created!</h2>
          <p className="text-gray-600 mb-6">
            Please check your email to confirm your account. Once confirmed, you can sign in and start tracking your mental wellness.
          </p>

          <Link
            href="/auth/login"
            className="inline-block bg-red-500 hover:bg-red-600 text-white font-semibold py-2 px-6 rounded-lg transition"
          >
            Go to Sign In
          </Link>
        </div>
      </div>
    </div>
  )
}
