import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { FileCheck, ChevronDown } from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'

export default function Signup() {
  const navigate = useNavigate()
  const { signup } = useAuth()
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    role: '',
    school: '',
  })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      await signup({
        email: formData.email,
        password: formData.password,
        first_name: formData.firstName,
        last_name: formData.lastName,
        role: formData.role,
        school: formData.school,
      })
      navigate('/generator')
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Signup failed. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen">
      {/* Left Panel - Brand */}
      <div className="hidden lg:flex lg:w-[560px] bg-[var(--primary)] text-white flex-col items-center justify-center p-12">
        <FileCheck size={64} className="mb-6" />
        <h1 className="text-4xl font-semibold text-center mb-6">Exam Generator</h1>
        <p className="text-base opacity-80 text-center max-w-sm leading-relaxed">
          Join educators creating AI-powered exams with pedagogical precision
        </p>
      </div>

      {/* Right Panel - Signup Form */}
      <div className="flex-1 bg-[var(--surface)] flex items-center justify-center p-12">
        <div className="w-full max-w-md">
          {/* Form Header */}
          <div className="mb-5">
            <h2 className="text-3xl font-semibold text-[var(--text-primary)] mb-2">Create Account</h2>
            <p className="text-sm text-[var(--text-secondary)]">Fill in your details to get started</p>
          </div>

          {/* Error Message */}
          {error && (
            <div className="mb-5 p-3 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm">
              {error}
            </div>
          )}

          {/* Signup Form */}
          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Name Row */}
            <div className="grid grid-cols-2 gap-4">
              {/* First Name */}
              <div>
                <label className="block text-sm font-medium text-[var(--text-primary)] mb-1.5">
                  First Name
                </label>
                <input
                  type="text"
                  name="firstName"
                  value={formData.firstName}
                  onChange={handleChange}
                  placeholder="John"
                  required
                  className="w-full h-12 px-4 bg-[var(--background-light)] border border-[var(--border)] rounded-[var(--radius-md)] text-[var(--text-primary)] placeholder-[var(--text-muted)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)] focus:border-transparent"
                />
              </div>

              {/* Last Name */}
              <div>
                <label className="block text-sm font-medium text-[var(--text-primary)] mb-1.5">
                  Last Name
                </label>
                <input
                  type="text"
                  name="lastName"
                  value={formData.lastName}
                  onChange={handleChange}
                  placeholder="Doe"
                  required
                  className="w-full h-12 px-4 bg-[var(--background-light)] border border-[var(--border)] rounded-[var(--radius-md)] text-[var(--text-primary)] placeholder-[var(--text-muted)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)] focus:border-transparent"
                />
              </div>
            </div>

            {/* Email Field */}
            <div>
              <label className="block text-sm font-medium text-[var(--text-primary)] mb-1.5">
                Email
              </label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
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
                name="password"
                value={formData.password}
                onChange={handleChange}
                placeholder="••••••••"
                required
                minLength={6}
                className="w-full h-12 px-4 bg-[var(--background-light)] border border-[var(--border)] rounded-[var(--radius-md)] text-[var(--text-primary)] placeholder-[var(--text-muted)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)] focus:border-transparent"
              />
            </div>

            {/* Role & School Row */}
            <div className="grid grid-cols-2 gap-4">
              {/* Role */}
              <div>
                <label className="block text-sm font-medium text-[var(--text-primary)] mb-1.5">
                  Role
                </label>
                <div className="relative">
                  <select
                    name="role"
                    value={formData.role}
                    onChange={handleChange}
                    required
                    className="w-full h-12 px-4 bg-[var(--background-light)] border border-[var(--border)] rounded-[var(--radius-md)] text-[var(--text-primary)] appearance-none focus:outline-none focus:ring-2 focus:ring-[var(--primary)] focus:border-transparent"
                  >
                    <option value="">Select role</option>
                    <option value="teacher">Teacher</option>
                    <option value="administrator">Administrator</option>
                    <option value="coordinator">Coordinator</option>
                  </select>
                  <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 text-[var(--text-muted)] pointer-events-none" size={20} />
                </div>
              </div>

              {/* School */}
              <div>
                <label className="block text-sm font-medium text-[var(--text-primary)] mb-1.5">
                  School
                </label>
                <input
                  type="text"
                  name="school"
                  value={formData.school}
                  onChange={handleChange}
                  placeholder="Your School"
                  required
                  className="w-full h-12 px-4 bg-[var(--background-light)] border border-[var(--border)] rounded-[var(--radius-md)] text-[var(--text-primary)] placeholder-[var(--text-muted)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)] focus:border-transparent"
                />
              </div>
            </div>

            {/* Signup Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full h-12 bg-[var(--primary)] text-white font-semibold rounded-[var(--radius-md)] hover:bg-[var(--primary-dark)] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Creating account...' : 'Create Account'}
            </button>
          </form>

          {/* Login Prompt */}
          <div className="mt-5 text-center flex items-center justify-center gap-1">
            <span className="text-sm text-[var(--text-secondary)]">Already have an account?</span>
            <Link
              to="/login"
              className="text-sm font-semibold text-[var(--primary)] hover:text-[var(--primary-dark)]"
            >
              Sign In
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
