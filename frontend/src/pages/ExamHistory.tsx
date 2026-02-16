import { useState, useEffect } from 'react'
import { User, FileCheck, Clock, BookOpen, Zap, ArrowLeft } from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'
import { getMyExams, type ExamHistoryItem } from '../services/exam'
import { useNavigate } from 'react-router-dom'

export default function ExamHistory() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const [exams, setExams] = useState<ExamHistoryItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    const fetchExams = async () => {
      setLoading(true)
      setError('')
      const response = await getMyExams()

      if (response.success && response.exams) {
        setExams(response.exams)
      } else {
        setError(response.error || 'Failed to load exams')
      }
      setLoading(false)
    }

    fetchExams()
  }, [])

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const getSubjectColor = (subject: string) => {
    switch (subject.toLowerCase()) {
      case 'english':
        return 'bg-blue-100 text-blue-800'
      case 'mathematics':
        return 'bg-purple-100 text-purple-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  return (
    <div className="min-h-screen bg-[var(--background)] flex flex-col">
      {/* Header */}
      <header className="bg-[var(--primary)] text-white h-18 px-12 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <FileCheck size={28} />
          <span className="text-xl font-semibold">Exam History</span>
        </div>
        <div className="flex items-center gap-3">
          <User size={32} />
          <span className="text-sm font-medium">
            {user?.firstName} {user?.lastName}
          </span>
          <button
            onClick={logout}
            className="ml-4 px-4 py-2 text-sm bg-white/10 hover:bg-white/20 rounded-md transition-colors"
          >
            Logout
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 p-12">
        <div className="max-w-6xl mx-auto">
          {/* Back Button & Title */}
          <div className="mb-8 flex items-center gap-4">
            <button
              onClick={() => navigate('/exam')}
              className="p-2 hover:bg-[var(--background-light)] rounded-lg transition-colors"
            >
              <ArrowLeft size={24} className="text-[var(--text-primary)]" />
            </button>
            <div>
              <h1 className="text-3xl font-bold text-[var(--text-primary)] mb-2">
                Your Generated Exams
              </h1>
              <p className="text-[var(--text-secondary)]">
                View all exams you've created with timestamps
              </p>
            </div>
          </div>

          {/* Error Message */}
          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-600">
              {error}
            </div>
          )}

          {/* Loading State */}
          {loading && (
            <div className="flex flex-col items-center justify-center py-20 text-center">
              <Zap size={64} className="text-[var(--primary)] mb-6 animate-pulse" />
              <p className="text-lg font-semibold text-[var(--text-primary)]">
                Loading your exams...
              </p>
            </div>
          )}

          {/* Empty State */}
          {!loading && exams.length === 0 && !error && (
            <div className="flex flex-col items-center justify-center py-20 text-center bg-[var(--surface)] rounded-2xl">
              <FileCheck size={64} className="text-[var(--text-muted)] mb-4" />
              <p className="text-lg text-[var(--text-secondary)] mb-4">
                You haven't generated any exams yet
              </p>
              <button
                onClick={() => navigate('/exam')}
                className="px-6 py-2 bg-[var(--primary)] text-white rounded-lg hover:bg-[var(--primary-dark)] transition-colors"
              >
                Create Your First Exam
              </button>
            </div>
          )}

          {/* Exams List */}
          {!loading && exams.length > 0 && (
            <div className="space-y-4">
              {/* Summary Card */}
              <div className="bg-[var(--surface)] rounded-2xl shadow-lg p-6 mb-6">
                <div className="grid grid-cols-4 gap-4">
                  <div className="bg-[var(--background-light)] rounded-lg p-4">
                    <p className="text-[var(--text-muted)] text-sm mb-1">Total Exams</p>
                    <p className="text-3xl font-bold text-[var(--primary)]">{exams.length}</p>
                  </div>
                  <div className="bg-[var(--background-light)] rounded-lg p-4">
                    <p className="text-[var(--text-muted)] text-sm mb-1">English Exams</p>
                    <p className="text-3xl font-bold text-blue-600">
                      {exams.filter(e => e.subject.toLowerCase() === 'english').length}
                    </p>
                  </div>
                  <div className="bg-[var(--background-light)] rounded-lg p-4">
                    <p className="text-[var(--text-muted)] text-sm mb-1">Math Exams</p>
                    <p className="text-3xl font-bold text-purple-600">
                      {exams.filter(e => e.subject.toLowerCase() === 'mathematics').length}
                    </p>
                  </div>
                  <div className="bg-[var(--background-light)] rounded-lg p-4">
                    <p className="text-[var(--text-muted)] text-sm mb-1">Total Questions</p>
                    <p className="text-3xl font-bold text-[var(--primary-light)]">
                      {exams.reduce((sum, e) => sum + e.total_questions, 0)}
                    </p>
                  </div>
                </div>
              </div>

              {/* Exams Table */}
              <div className="bg-[var(--surface)] rounded-2xl shadow-lg overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="bg-[var(--background-light)] border-b border-[var(--border)]">
                        <th className="px-6 py-4 text-left text-sm font-semibold text-[var(--text-primary)]">
                          Subject
                        </th>
                        <th className="px-6 py-4 text-left text-sm font-semibold text-[var(--text-primary)]">
                          Grade
                        </th>
                        <th className="px-6 py-4 text-left text-sm font-semibold text-[var(--text-primary)]">
                          Questions
                        </th>
                        <th className="px-6 py-4 text-left text-sm font-semibold text-[var(--text-primary)]">
                          Marks
                        </th>
                        <th className="px-6 py-4 text-left text-sm font-semibold text-[var(--text-primary)]">
                          Page Ranges
                        </th>
                        <th className="px-6 py-4 text-left text-sm font-semibold text-[var(--text-primary)]">
                          Created
                        </th>
                        <th className="px-6 py-4 text-left text-sm font-semibold text-[var(--text-primary)]">
                          Exam ID
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {exams.map((exam, index) => (
                        <tr
                          key={exam.exam_id}
                          onClick={() => navigate(`/exam/${exam.exam_id}`)}
                          className={`border-b border-[var(--border-light)] hover:bg-blue-50 transition-colors cursor-pointer ${
                            index % 2 === 0 ? 'bg-white' : 'bg-[var(--background-light)]'
                          }`}
                        >
                          <td className="px-6 py-4 text-sm">
                            <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getSubjectColor(exam.subject)}`}>
                              {exam.subject}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-sm font-medium text-[var(--text-primary)]">
                            Grade {exam.grade}
                          </td>
                          <td className="px-6 py-4 text-sm text-[var(--text-secondary)]">
                            <div className="space-y-1">
                              <div className="flex items-center gap-1">
                                <BookOpen size={14} />
                                <span>{exam.total_questions} total</span>
                              </div>
                              <div className="text-xs text-[var(--text-muted)]">
                                {exam.objective_questions_count} obj / {exam.subjective_questions_count} subj
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 text-sm font-semibold text-[var(--primary)]">
                            {exam.total_marks}
                          </td>
                          <td className="px-6 py-4 text-xs text-[var(--text-muted)]">
                            {exam.course_page_range && (
                              <div>Course: {exam.course_page_range}</div>
                            )}
                            {exam.activity_page_range && (
                              <div>Activity: {exam.activity_page_range}</div>
                            )}
                            {!exam.course_page_range && !exam.activity_page_range && (
                              <span className="text-[var(--text-muted)]">N/A</span>
                            )}
                          </td>
                          <td className="px-6 py-4 text-sm text-[var(--text-secondary)]">
                            <div className="flex items-center gap-2">
                              <Clock size={14} className="text-[var(--primary)]" />
                              {formatDate(exam.created_at)}
                            </div>
                          </td>
                          <td className="px-6 py-4 text-xs font-mono text-[var(--text-muted)]">
                            <code className="bg-[var(--background)] px-2 py-1 rounded">
                              {exam.exam_id.substring(0, 8)}...
                            </code>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  )
}
