import { useState, useEffect } from 'react'
import api from './api'
import type { User, LoginRequest, SignupRequest } from '../types'

const AUTH_KEY = 'exam_gen_auth'

export function useAuth() {
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const authData = localStorage.getItem(AUTH_KEY)
    if (authData) {
      const { user, token } = JSON.parse(authData)
      setUser(user)
      setIsAuthenticated(true)
      api.defaults.headers.common['Authorization'] = `Bearer ${token}`
    }
    setLoading(false)
  }, [])

  const login = async (credentials: LoginRequest) => {
    const { data } = await api.post('/auth/login', credentials)
    localStorage.setItem(AUTH_KEY, JSON.stringify(data))
    setUser(data.user)
    setIsAuthenticated(true)
    api.defaults.headers.common['Authorization'] = `Bearer ${data.token}`
    return data
  }

  const signup = async (userData: SignupRequest) => {
    const { data } = await api.post('/auth/signup', userData)
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

  return { isAuthenticated, user, loading, login, signup, logout }
}
