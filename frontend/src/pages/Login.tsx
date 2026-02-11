import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { FileCheck } from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'

export default function Login() {
  const navigate = useNavigate()
  const { login } = useAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      await login({ email, password })
      navigate('/generator')
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Login failed. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen">
      {/* Left Panel - Brand */}
      <div className="hidden lg:flex lg:w-1/2 bg-[var(--primary)] text-white flex-col items-center justify-center p-12">
        <FileCheck size={64} className="mb-6" />
        <h1 className="text-4xl font-semibold text-center mb-6">Exam Generator</h1>
        <p className="text-base opacity-80 text-center max-w-md leading-relaxed">
          Generate AI-powered exams aligned with Bloom's Taxonomy in seconds
        </p>
      </div>

      {/* Right Panel - Login Form */}
      <div className="flex-1 bg-[var(--surface)] flex items-center justify-center p-12">
        <div className="w-full max-w-sm">
          {/* Form Header */}
          <div className="mb-6">
            <h2 className="text-3xl font-semibold text-[var(--text-primary)] mb-2">Welcome Back</h2>
            <p className="text-sm text-[var(--text-secondary)]">Sign in to your account to continue</p>
          </div>

          {/* Error Message */}
          {error && (
            <div className="mb-6 p-3 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm">
              {error}
            </div>
          )}

          {/* Login Form */}
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Email Field */}
            <div>
              <label className="block text-sm font-medium text-[var(--text-primary)] mb-1.5">
                Email
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="your.email@example.com"
                required
                className="w-full h-12 px-4 bg-[var(--background-light)] border border-[var(--border)] rounded-[var(--radius-md)] text-[var(--text-primary)] placeholder-[var(--text-muted)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)] focus:border-transparent"
              />
            </div>

            {/* Password Field */}
            <div>
              <label className="block text-sm font-medium text-[var(--text-primary)] mb-1.5">
                Password
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                className="w-full h-12 px-4 bg-[var(--background-light)] border border-[var(--border)] rounded-[var(--radius-md)] text-[var(--text-primary)] placeholder-[var(--text-muted)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)] focus:border-transparent"
              />
            </div>

            {/* Login Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full h-12 bg-[var(--primary)] text-white font-semibold rounded-[var(--radius-md)] hover:bg-[var(--primary-dark)] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Signing in...' : 'Sign In'}
            </button>
          </form>

          {/* Signup Prompt */}
          <div className="mt-6 text-center flex items-center justify-center gap-1">
            <span className="text-sm text-[var(--text-secondary)]">Don't have an account?</span>
            <Link
              to="/signup"
              className="text-sm font-semibold text-[var(--primary)] hover:text-[var(--primary-dark)]"
            >
              Sign Up
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
