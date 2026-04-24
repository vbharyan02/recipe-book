import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import supabase from '../lib/supabase'
import { useTheme } from '../lib/ThemeContext'

export default function LoginPage() {
  const navigate = useNavigate()
  const { dark, toggle } = useTheme()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState(null)
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e) {
    e.preventDefault()
    setError(null)
    setLoading(true)
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    setLoading(false)
    if (error) {
      if (error.message.includes('Invalid login credentials')) {
        setError('Wrong email or password.')
      } else if (error.message.includes('Email not confirmed')) {
        setError('Please check your email to confirm your account.')
      } else {
        setError(error.message)
      }
      return
    }
    navigate('/')
  }

  return (
    <div className="min-h-screen bg-amber-50 dark:bg-gray-950 flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <div className="flex justify-end mb-2">
          <button
            onClick={toggle}
            className="p-2 rounded-xl hover:bg-amber-100 dark:hover:bg-gray-800 transition-colors"
            aria-label="Toggle dark mode"
          >
            {dark ? '☀️' : '🌙'}
          </button>
        </div>
        <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-xl p-8 border border-amber-100 dark:border-gray-800">
          <div className="text-center mb-8">
            <div className="text-5xl mb-3">🍳</div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Recipe Book</h1>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Sign in to your kitchen</p>
          </div>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Email</label>
              <input
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={e => setEmail(e.target.value)}
                className="border border-gray-200 dark:border-gray-700 rounded-xl px-4 py-2.5 w-full bg-gray-50 dark:bg-gray-800 dark:text-gray-100 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-amber-400 focus:border-transparent transition"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Password</label>
              <input
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={e => setPassword(e.target.value)}
                className="border border-gray-200 dark:border-gray-700 rounded-xl px-4 py-2.5 w-full bg-gray-50 dark:bg-gray-800 dark:text-gray-100 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-amber-400 focus:border-transparent transition"
                required
              />
            </div>
            {error && (
              <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl px-4 py-3">
                <p className="text-red-600 dark:text-red-400 text-sm">{error}</p>
              </div>
            )}
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-amber-500 hover:bg-amber-600 text-white font-semibold py-2.5 rounded-xl transition-all duration-150 disabled:opacity-50 disabled:cursor-not-allowed shadow-sm hover:shadow-md"
            >
              {loading ? 'Signing in...' : 'Sign In'}
            </button>
          </form>
          <p className="mt-6 text-center text-sm text-gray-600 dark:text-gray-400">
            No account?{' '}
            <Link to="/register" className="text-amber-600 dark:text-amber-400 font-medium hover:underline">
              Create one
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
