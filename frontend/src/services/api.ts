import axios from 'axios'

// Use relative URL for production (Vercel), localhost for development
const getBaseURL = () => {
  // If VITE_API_URL is explicitly set, use it
  if (import.meta.env.VITE_API_URL) {
    return import.meta.env.VITE_API_URL
  }
  // In development (vite dev), use localhost with Vite proxy
  // In production (deployed), use relative URL (same domain)
  return import.meta.env.DEV ? 'http://localhost:8000' : ''
}

const api = axios.create({
  baseURL: getBaseURL(),
  headers: {
    'Content-Type': 'application/json',
  },
})

// Add request interceptor to include auth token from localStorage
api.interceptors.request.use(
  (config) => {
    const authData = localStorage.getItem('exam_gen_auth')
    if (authData) {
      try {
        const { token } = JSON.parse(authData)
        if (token) {
          config.headers.Authorization = `Bearer ${token}`
        }
      } catch (error) {
        console.error('Failed to parse auth data:', error)
      }
    }
    return config
  },
  (error) => {
    return Promise.reject(error)
  }
)

export default api
