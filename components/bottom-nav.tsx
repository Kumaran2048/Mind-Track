'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Home, BarChart3, BookOpen, User, Moon, Sun, MessageCircle } from 'lucide-react'
import { useTheme } from 'next-themes'
import { useState, useEffect } from 'react'

export function BottomNav() {
  const pathname = usePathname()
  const { theme, setTheme } = useTheme()
  const [mounted, setMounted] = useState(false)

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
    { href: '/dashboard', icon: Home, label: 'Home' },
    { href: '/insights', icon: BarChart3, label: 'Insights' },
    { href: '/mira', icon: MessageCircle, label: 'Mira' },
    { href: '/logs', icon: BookOpen, label: 'Logs' },
    { href: '/profile', icon: User, label: 'Profile' },
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
              className={`flex flex-col items-center gap-1 py-2 px-4 rounded-lg transition ${
                active
                  ? 'text-red-500'
                  : 'text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-100'
              }`}
            >
              <Icon className="w-6 h-6" />
              <span className="text-xs font-medium">{item.label}</span>
            </Link>
          )
        })}
        {mounted && (
          <button
            onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
            className="flex flex-col items-center gap-1 py-2 px-4 rounded-lg transition text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-100"
            title={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
            aria-label="Toggle theme"
          >
            {theme === 'dark' ? (
              <Sun className="w-6 h-6" />
            ) : (
              <Moon className="w-6 h-6" />
            )}
            <span className="text-xs font-medium">Theme</span>
          </button>
        )}
      </div>
    </nav>
  )
}
