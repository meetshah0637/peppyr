/**
 * Header with navigation and auth controls
 */
import React, { useState } from 'react'
import { useAuth } from '../hooks/useAuth'
import { Logo } from './Logo'

type Page = 'templates' | 'contacts' | 'analytics';

interface HeaderAuthProps {
  currentPage: Page;
  onPageChange: (page: Page) => void;
}

export const HeaderAuth: React.FC<HeaderAuthProps> = ({ currentPage, onPageChange }) => {
  const { user, loginWithGoogle, logout } = useAuth()
  const [busy, setBusy] = useState(false)

  const handleLogin = async () => {
    setBusy(true)
    try { await loginWithGoogle() } finally { setBusy(false) }
  }

  const handleLogout = async () => {
    setBusy(true)
    try { await logout() } finally { setBusy(false) }
  }

  const navItems: { key: Page; label: string }[] = [
    { key: 'templates', label: 'Templates' },
    { key: 'contacts', label: 'Contacts' },
    { key: 'analytics', label: 'Analytics' }
  ];

  return (
    <div className="w-full bg-white border-b border-gray-200">
      <div className="max-w-7xl mx-auto">
        <div className="p-3 flex items-center justify-between gap-3 text-sm">
          <div className="flex items-center gap-6">
            <Logo width={32} height={32} showText={true} variant="compact" />
            {user && (
              <nav className="flex gap-1">
                {navItems.map(item => (
                  <button
                    key={item.key}
                    onClick={() => onPageChange(item.key)}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                      currentPage === item.key
                        ? 'bg-blue-100 text-blue-700'
                        : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                    }`}
                  >
                    {item.label}
                  </button>
                ))}
              </nav>
            )}
          </div>
          <div className="flex items-center gap-3">
            {user ? (
              <>
                <span className="text-gray-600 truncate max-w-[200px]">{user.email ?? 'Signed in'}</span>
                <button onClick={handleLogout} disabled={busy} className="px-3 py-1 rounded border border-gray-300 hover:bg-gray-50 disabled:opacity-50">Logout</button>
              </>
            ) : (
              <button onClick={handleLogin} disabled={busy} className="px-3 py-1 rounded bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50">Sign in</button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}





