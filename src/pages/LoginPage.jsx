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
    <div className="max-w-sm mx-auto mt-20 px-4">
      <div className="flex justify-end mb-4">
        <button onClick={toggle} className="text-xl px-2 py-1 rounded hover:bg-gray-100 dark:hover:bg-gray-700" aria-label="Toggle dark mode">
          {dark ? '☀️' : '🌙'}
        </button>
      </div>
      <h1 className="text-2xl font-bold mb-6 text-center">Recipe Book</h1>
      <form onSubmit={handleSubmit} className="space-y-4">
        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={e => setEmail(e.target.value)}
          className="border dark:border-gray-600 rounded px-3 py-2 w-full bg-white dark:bg-gray-800 dark:text-gray-100 placeholder-gray-400"
          required
        />
        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={e => setPassword(e.target.value)}
          className="border dark:border-gray-600 rounded px-3 py-2 w-full bg-white dark:bg-gray-800 dark:text-gray-100 placeholder-gray-400"
          required
        />
        {error && <p className="text-red-500 text-sm">{error}</p>}
        <button
          type="submit"
          disabled={loading}
          className="bg-blue-600 text-white px-4 py-2 rounded w-full disabled:opacity-50 hover:bg-blue-700"
        >
          {loading ? 'Logging in...' : 'Login'}
        </button>
      </form>
      <p className="mt-4 text-center text-sm text-gray-600 dark:text-gray-400">
        No account? <Link to="/register" className="text-blue-600 dark:text-blue-400 underline">Register</Link>
      </p>
    </div>
  )
}
