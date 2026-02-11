import { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import api from '../services/api'
import type { User, LoginRequest, SignupRequest } from '../types'

interface AuthContextType {
  isAuthenticated: boolean
  user: User | null
  loading: boolean
  login: (credentials: LoginRequest) => Promise<any>
  signup: (userData: SignupRequest) => Promise<any>
  logout: () => void
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

const AUTH_KEY = 'exam_gen_auth'

export function AuthProvider({ children }: { children: ReactNode }) {
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const authData = localStorage.getItem(AUTH_KEY)
    if (authData) {
      try {
        const { user, token } = JSON.parse(authData)
        setUser(user)
        setIsAuthenticated(true)
        api.defaults.headers.common['Authorization'] = `Bearer ${token}`
      } catch (error) {
        console.error('Failed to parse auth data:', error)
        localStorage.removeItem(AUTH_KEY)
      }
    }
    setLoading(false)
  }, [])

  const login = async (credentials: LoginRequest) => {
    const { data } = await api.post('/auth/login', credentials)

    // Check if login was successful
    if (!data.success || !data.token || !data.user) {
      throw new Error(data.error || data.message || 'Login failed')
    }

    localStorage.setItem(AUTH_KEY, JSON.stringify(data))
    setUser(data.user)
    setIsAuthenticated(true)
    api.defaults.headers.common['Authorization'] = `Bearer ${data.token}`
    return data
  }

  const signup = async (userData: SignupRequest) => {
    const { data } = await api.post('/auth/signup', userData)

    // Check if signup was successful
    if (!data.success || !data.token || !data.user) {
      throw new Error(data.error || data.message || 'Signup failed')
    }

    localStorage.setItem(AUTH_KEY, JSON.stringify(data))
    setUser(data.user)
    setIsAuthenticated(true)
    api.defaults.headers.common['Authorization'] = `Bearer ${data.token}`
    return data
  }

  const logout = () => {
    localStorage.removeItem(AUTH_KEY)
    setUser(null)
    setIsAuthenticated(false)
    delete api.defaults.headers.common['Authorization']
  }

  return (
    <AuthContext.Provider value={{ isAuthenticated, user, loading, login, signup, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
