import axios from 'axios'

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:8000',
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
