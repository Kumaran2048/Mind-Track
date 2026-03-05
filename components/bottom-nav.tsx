'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Home, BarChart3, BookOpen, User, MessageCircle } from 'lucide-react'
import { useState, useEffect } from 'react'
import { useLanguage } from '@/components/language-provider'
import { AnimatedThemeToggler } from '@/components/ui/animated-theme-toggler'

export function BottomNav() {
  const pathname = usePathname()
  const [mounted, setMounted] = useState(false)
  const { t } = useLanguage()

  useEffect(() => {
    setMounted(true)
  }, [])

  const isActive = (path: string) => {
    if (path === '/dashboard' && pathname === '/dashboard') return true
    if (path === '/history' && pathname === '/history') return true
    if (path === '/insights' && pathname === '/insights') return true
    if (path === '/logs' && pathname === '/logs') return true
    if (path === '/profile' && pathname === '/profile') return true
    if (path === '/mira' && pathname === '/mira') return true
    return false
  }

  const navItems = [
    { href: '/dashboard', icon: Home, label: t('home') },
    { href: '/insights', icon: BarChart3, label: t('insights') },
    { href: '/mira', icon: MessageCircle, label: t('mira') },
    { href: '/logs', icon: BookOpen, label: t('logs') },
    { href: '/profile', icon: User, label: t('profile') },
  ]

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-background border-t border-border px-4 py-3 dark:bg-gray-900">
      <div className="flex justify-around items-center max-w-md mx-auto">
        {navItems.map((item) => {
          const Icon = item.icon
          const active = isActive(item.href)
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex flex-col items-center gap-1 py-2 px-4 rounded-lg transition ${active
                ? 'text-red-500'
                : 'text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-100'
                }`}
            >
              <Icon className="w-6 h-6" />
              <span className="text-xs font-medium">{item.label}</span>
            </Link>
          )
        })}
        {/* Animated theme toggler */}
        <div className="flex flex-col items-center gap-1 py-2 px-3">
          <AnimatedThemeToggler />
          <span className="text-xs font-medium text-gray-500 dark:text-gray-400">{t('theme')}</span>
        </div>
      </div>
    </nav>
  )
}
