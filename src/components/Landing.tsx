/**
 * Landing/Auth page with Peppyr logo and Sign in/Sign up options.
 */
import React, { useState } from 'react'
import { useAuth } from '../hooks/useAuth'
import { Logo } from './Logo'

export const Landing: React.FC = () => {
  const { loginWithGoogle, signup, login } = useAuth()
  const [mode, setMode] = useState<'signin' | 'signup'>('signin')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleEmail = async () => {
    setBusy(true)
    setError(null)
    try {
      if (mode === 'signin') {
        await login(email, password)
      } else {
        await signup(email, password)
      }
    } catch (e: any) {
      setError(e?.message || 'Authentication failed')
    } finally {
      setBusy(false)
    }
  }

  const handleGoogle = async () => {
    setBusy(true)
    setError(null)
    try { await loginWithGoogle() } catch (e: any) { setError(e?.message || 'Google sign-in failed') } finally { setBusy(false) }
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-lg border border-gray-200 p-8">
        {/* Logo */}
        <div className="flex items-center justify-center mb-6">
          <Logo width={48} height={48} showText={true} textPosition="right" />
        </div>

        <h1 className="text-xl font-semibold text-gray-900 mb-2 text-center">Appointment Library</h1>
        <p className="text-gray-600 text-center mb-6">Sign {mode === 'signin' ? 'in' : 'up'} to access your private templates.</p>

        {error && (
          <div className="mb-4 text-sm text-red-600 bg-red-50 border border-red-200 rounded p-2">{error}</div>
        )}

        {/* Email form */}
        <div className="space-y-3 mb-4">
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Email"
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Password"
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <button
            onClick={handleEmail}
            disabled={busy}
            className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
          >
            {mode === 'signin' ? 'Sign in' : 'Create account'}
          </button>
        </div>

        <div className="flex items-center gap-2 my-4">
          <div className="flex-1 h-px bg-gray-200" />
          <span className="text-xs text-gray-500">or</span>
          <div className="flex-1 h-px bg-gray-200" />
        </div>

        <button
          onClick={handleGoogle}
          disabled={busy}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 flex items-center justify-center gap-2"
        >
          <svg className="w-4 h-4" viewBox="0 0 533.5 544.3"><path fill="#4285f4" d="M533.5 278.4c0-17.4-1.6-34.1-4.6-50.4H272.1v95.3h146.9c-6.3 34.1-25 62.9-53.5 82.2v68h86.5c50.6-46.6 81.5-115.3 81.5-195.1z"/><path fill="#34a853" d="M272.1 544.3c72.9 0 134.2-24.1 178.9-65.6l-86.5-68c-24.1 16.1-55 25.8-92.4 25.8-71 0-131.2-47.9-152.7-112.5H31.1v70.4c44.6 88.6 136.2 149.9 241 149.9z"/><path fill="#fbbc05" d="M119.4 324c-10.3-30.8-10.3-64 0-94.8v-70.4H31.1c-41.9 83.8-41.9 182.3 0 266.1L119.4 324z"/><path fill="#ea4335" d="M272.1 107.7c39.6-.6 77.6 14 106.5 40.9l79.7-79.7C408.5 25 343.7-.1 272.1 0 167.3 0 75.7 61.3 31.1 149.9l88.3 70.4c21.4-64.7 81.7-112.6 152.7-112.6z"/></svg>
          Continue with Google
        </button>

        <div className="text-center mt-6 text-sm text-gray-600">
          {mode === 'signin' ? (
            <>Don't have an account?{' '}
              <button className="text-blue-600 hover:underline" onClick={() => setMode('signup')}>Sign up</button>
            </>
          ) : (
            <>Already have an account?{' '}
              <button className="text-blue-600 hover:underline" onClick={() => setMode('signin')}>Sign in</button>
            </>
          )}
        </div>
      </div>
    </div>
  )
}


