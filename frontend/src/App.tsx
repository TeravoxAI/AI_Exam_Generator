import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import Login from './pages/Login'
import Signup from './pages/Signup'
import ExamGenerator from './pages/ExamGenerator'
import ExamHistory from './pages/ExamHistory'
import ExamDetail from './pages/ExamDetail'
import { AuthProvider, useAuth } from './contexts/AuthContext'

function PrivateRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, loading } = useAuth()

  if (loading) {
    return <div>Loading...</div>
  }

  return isAuthenticated ? <>{children}</> : <Navigate to="/login" />
}

function AppRoutes() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/signup" element={<Signup />} />
      {/* More specific routes MUST come before general routes */}
      <Route
        path="/exam/:examId"
        element={
          <PrivateRoute>
            <ExamDetail />
          </PrivateRoute>
        }
      />
      <Route
        path="/exam"
        element={
          <PrivateRoute>
            <ExamGenerator />
          </PrivateRoute>
        }
      />
      <Route
        path="/exam-history"
        element={
          <PrivateRoute>
            <ExamHistory />
          </PrivateRoute>
        }
      />
      <Route path="/generator" element={<Navigate to="/exam" />} />
      <Route path="/" element={<Navigate to="/exam" />} />
    </Routes>
  )
}

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <AppRoutes />
      </BrowserRouter>
    </AuthProvider>
  )
}

export default App
