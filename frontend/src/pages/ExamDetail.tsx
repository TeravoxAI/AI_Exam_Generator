import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { User, ArrowLeft, Download, Sparkles, BookOpen } from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'
import { getExamById, type ExamDetailResponse } from '../services/exam'
import { generateExamPDF } from '../utils/pdfGenerator'

export default function ExamDetail() {
  const { examId } = useParams<{ examId: string }>()
  const navigate = useNavigate()
  const { user, logout } = useAuth()
  const [exam, setExam] = useState<ExamDetailResponse['exam'] | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [selectedQuestions, setSelectedQuestions] = useState<Set<string>>(new Set())
  const [downloading, setDownloading] = useState(false)

  useEffect(() => {
    const fetchExam = async () => {
      if (!examId) {
        console.log('❌ No exam ID provided')
        return
      }

      console.log('📋 Fetching exam:', examId)
      setLoading(true)
      setError('')

      try {
        const response = await getExamById(examId)
        console.log('📥 Exam response:', response)

        if (response.success && response.exam) {
          console.log('✅ Exam loaded successfully')
          console.log('Exam content:', response.exam.exam_content)
          setExam(response.exam)
          // Auto-select all questions
          selectAllQuestions(response.exam)
        } else {
          const errorMsg = response.error || 'Failed to load exam'
          console.error('❌ Exam load failed:', errorMsg)
          setError(errorMsg)
        }
      } catch (err: any) {
        console.error('❌ Error fetching exam:', err)
        const errorMsg = err.response?.data?.detail || err.message || 'Failed to load exam. Please try logging in again.'
        setError(errorMsg)
      } finally {
        setLoading(false)
      }
    }

    fetchExam()
  }, [examId])

  const selectAllQuestions = (examData: any) => {
    const allIds = new Set<string>()

    if (!examData || !examData.exam_content) {
      console.warn('⚠️ No exam content found')
      setSelectedQuestions(allIds)
      return
    }

    if (examData.exam_content?.objective) {
      Object.entries(examData.exam_content.objective).forEach(([typeId, questions]: [string, any]) => {
        const questionArray = Array.isArray(questions) ? questions : []
        questionArray.forEach((_, index) => {
          allIds.add(`obj-${typeId}-${index}`)
        })
      })
    }

    if (examData.exam_content?.subjective) {
      Object.entries(examData.exam_content.subjective).forEach(([typeId, questions]: [string, any]) => {
        const questionArray = Array.isArray(questions) ? questions : []
        questionArray.forEach((_, index) => {
          allIds.add(`subj-${typeId}-${index}`)
        })
      })
    }

    console.log(`✅ Selected ${allIds.size} questions`)
    setSelectedQuestions(allIds)
  }

  const toggleQuestionSelection = (questionId: string) => {
    setSelectedQuestions(prev => {
      const newSet = new Set(prev)
      if (newSet.has(questionId)) {
        newSet.delete(questionId)
      } else {
        newSet.add(questionId)
      }
      return newSet
    })
  }

  const getTotalMarks = () => {
    if (!exam?.exam_content) return 0
    let total = 0

    selectedQuestions.forEach(id => {
      const [category, type, index] = id.split('-')
      const questions = category === 'obj'
        ? exam.exam_content?.objective?.[type]
        : exam.exam_content?.subjective?.[type]

      const questionArray = Array.isArray(questions) ? questions : []
      if (questionArray && questionArray[parseInt(index)]) {
        total += questionArray[parseInt(index)].marks || 0
      }
    })

    return total
  }

  const downloadExam = async () => {
    if (!exam || selectedQuestions.size === 0) return

    setDownloading(true)
    try {
      const filename = `${exam.subject}_Grade${exam.grade}_Exam_${new Date().toISOString().split('T')[0]}.pdf`

      await generateExamPDF(exam, selectedQuestions, {
        filename,
        includeAnswerKey: true
      })

      console.log('✅ PDF downloaded successfully')
    } catch (error) {
      console.error('❌ PDF download failed:', error)
      setError('Failed to download PDF. Please try again.')
    } finally {
      setDownloading(false)
    }
  }

  const getQuestionTypeLabel = (typeId: string) => {
    // Convert snake_case to Title Case
    return typeId
      .split('_')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ')
  }

  const formatAnswer = (answer: any) => {
    if (!answer) return 'N/A'

    // If answer is an object (like match columns), convert to string
    if (typeof answer === 'object' && !Array.isArray(answer)) {
      return Object.entries(answer)
        .map(([key, value]) => `${key} → ${value}`)
        .join(', ')
    }

    // If answer is an array, join with commas
    if (Array.isArray(answer)) {
      return answer.join(', ')
    }

    // Otherwise return as-is
    return String(answer)
  }

  const renderQuestionsSection = (filterBySelection = false) => {
    if (!exam?.exam_content) return null

    return (
      <div className={filterBySelection ? "space-y-6" : "max-h-[600px] overflow-auto space-y-6 print:max-h-none print:overflow-visible"}>
        {/* Objective Questions */}
        {exam.exam_content.objective && Object.keys(exam.exam_content.objective).length > 0 && (
          <div className="space-y-4">
            {Object.entries(exam.exam_content.objective).map(([typeId, questions]) => {
              const questionArray = Array.isArray(questions) ? questions : []
              if (questionArray.length === 0) return null

              if (filterBySelection) {
                const filteredQuestions = questionArray.filter((_, idx) =>
                  selectedQuestions.has(`obj-${typeId}-${idx}`)
                )
                if (filteredQuestions.length === 0) return null
              }

              return (
                <div key={typeId} className="category-section bg-white rounded-lg border border-[var(--border)] overflow-hidden">
                  <div className="h-9 px-4 bg-[var(--primary)] text-white text-sm font-bold flex items-center">
                    {getQuestionTypeLabel(typeId)}
                  </div>
                  <div className="p-4">
                    {questionArray.map((question: any, idx: number) => {
                      const questionId = `obj-${typeId}-${idx}`
                      if (filterBySelection && !selectedQuestions.has(questionId)) return null

                      return (
                        <div key={questionId} className={`question-container mb-6 ${filterBySelection ? 'p-0' : 'p-4 bg-[var(--background-light)] rounded-lg'}`}>
                          {/* Screen view with checkbox */}
                          {!filterBySelection && (
                            <div className="flex items-start gap-3">
                              <input
                                type="checkbox"
                                checked={selectedQuestions.has(questionId)}
                                onChange={() => toggleQuestionSelection(questionId)}
                                className="mt-1 w-4 h-4 cursor-pointer"
                              />
                              <div className="flex-1">
                                {/* For questions with sub_questions (comprehension) */}
                                {question.sub_questions ? (
                                  <div>
                                    <div className="font-semibold text-[var(--text-primary)] mb-2">
                                      Q{idx + 1}. {question.instruction || 'Read the passage carefully'}
                                    </div>
                                    {question.passage && (
                                      <div className="p-3 bg-gray-50 rounded-lg mb-3 text-sm italic">
                                        {question.passage}
                                      </div>
                                    )}
                                    <div className="ml-4 space-y-3">
                                      {question.sub_questions.map((subQ: any, subIdx: number) => (
                                        <div key={subIdx} className="border-l-2 border-blue-300 pl-3">
                                          <p className="text-sm font-medium">{subIdx + 1}. {subQ.question}</p>
                                          <p className="text-xs text-[var(--text-muted)] mt-1">Marks: {subQ.marks}</p>
                                          <div className="mt-2 p-2 bg-green-50 border-l-4 border-green-600 text-sm">
                                            <strong>Answer:</strong> {subQ.answer || 'N/A'}
                                          </div>
                                        </div>
                                      ))}
                                    </div>
                                    <div className="mt-2 text-xs text-[var(--text-muted)]">
                                      <span>Total Marks: {question.marks || 0}</span>
                                    </div>
                                  </div>
                                ) : (
                                  /* For simple questions */
                                  <div>
                                    <div className="font-semibold text-[var(--text-primary)] mb-2">
                                      Q{idx + 1}. {question.question || question.statement || question.instruction}
                                    </div>
                                    {question.options && (
                                      <div className="ml-4 space-y-1">
                                        {question.options.map((option: string, optIdx: number) => (
                                          <div key={optIdx} className="text-sm text-[var(--text-secondary)]">
                                            {String.fromCharCode(65 + optIdx)}) {option}
                                          </div>
                                        ))}
                                      </div>
                                    )}
                                    <div className="mt-2 text-xs text-[var(--text-muted)] flex gap-4">
                                      <span>Marks: {question.marks || 0}</span>
                                      {question.difficulty && <span>Difficulty: {question.difficulty}</span>}
                                      {question.bloom_level && <span>Bloom: {question.bloom_level}</span>}
                                    </div>
                                    <div className="answer-display mt-3 p-2 bg-green-50 border-l-4 border-green-600 text-sm">
                                      <strong>Answer:</strong> {formatAnswer(question.answer)}
                                    </div>
                                  </div>
                                )}
                              </div>
                            </div>
                          )}

                          {/* Print view without checkbox */}
                          {filterBySelection && (
                            <div className="mb-4">
                              <div className="font-semibold text-black mb-1">
                                Q{idx + 1}. {question.question}
                              </div>
                              {question.options && (
                                <div className="ml-4 space-y-1 mb-2">
                                  {question.options.map((option: string, optIdx: number) => (
                                    <div key={optIdx} className="text-sm text-black">
                                      {String.fromCharCode(65 + optIdx)}) {option}
                                    </div>
                                  ))}
                                </div>
                              )}
                              <div className="text-xs text-gray-600 mb-2">Marks: {question.marks || 0}</div>
                              <div className="answer-space"></div>
                              <div className="answer-display mt-2 pt-2 border-t border-gray-300">
                                <strong className="text-sm">Answer:</strong> {formatAnswer(question.answer)}
                              </div>
                            </div>
                          )}
                        </div>
                      )
                    })}
                  </div>
                </div>
              )
            })}
          </div>
        )}

        {/* Subjective Questions */}
        {exam.exam_content.subjective && Object.keys(exam.exam_content.subjective).length > 0 && (
          <div className="space-y-4">
            {Object.entries(exam.exam_content.subjective).map(([typeId, questions]) => {
              const questionArray = Array.isArray(questions) ? questions : []
              if (questionArray.length === 0) return null

              if (filterBySelection) {
                const filteredQuestions = questionArray.filter((_, idx) =>
                  selectedQuestions.has(`subj-${typeId}-${idx}`)
                )
                if (filteredQuestions.length === 0) return null
              }

              return (
                <div key={typeId} className="category-section bg-white rounded-lg border border-[var(--border)] overflow-hidden">
                  <div className="h-9 px-4 bg-[var(--primary-light)] text-white text-sm font-bold flex items-center">
                    {getQuestionTypeLabel(typeId)}
                  </div>
                  <div className="p-4">
                    {questionArray.map((question: any, idx: number) => {
                      const questionId = `subj-${typeId}-${idx}`
                      if (filterBySelection && !selectedQuestions.has(questionId)) return null

                      return (
                        <div key={questionId} className={`question-container mb-6 ${filterBySelection ? 'p-0' : 'p-4 bg-[var(--background-light)] rounded-lg'}`}>
                          {/* Screen view with checkbox */}
                          {!filterBySelection && (
                            <div className="flex items-start gap-3">
                              <input
                                type="checkbox"
                                checked={selectedQuestions.has(questionId)}
                                onChange={() => toggleQuestionSelection(questionId)}
                                className="mt-1 w-4 h-4 cursor-pointer"
                              />
                              <div className="flex-1">
                                {/* For questions with sub_questions (comprehension) */}
                                {question.sub_questions ? (
                                  <div>
                                    <div className="font-semibold text-[var(--text-primary)] mb-2">
                                      Q{idx + 1}. {question.instruction || 'Read the passage carefully'}
                                    </div>
                                    {question.passage && (
                                      <div className="p-3 bg-gray-50 rounded-lg mb-3 text-sm italic">
                                        {question.passage}
                                      </div>
                                    )}
                                    <div className="ml-4 space-y-3">
                                      {question.sub_questions.map((subQ: any, subIdx: number) => (
                                        <div key={subIdx} className="border-l-2 border-purple-300 pl-3">
                                          <p className="text-sm font-medium">{subIdx + 1}. {subQ.question}</p>
                                          <p className="text-xs text-[var(--text-muted)] mt-1">Marks: {subQ.marks}</p>
                                          <div className="mt-2 p-2 bg-blue-50 border-l-4 border-blue-600 text-sm">
                                            <strong>Sample Answer:</strong> {subQ.answer || 'N/A'}
                                          </div>
                                        </div>
                                      ))}
                                    </div>
                                    <div className="mt-2 text-xs text-[var(--text-muted)]">
                                      <span>Total Marks: {question.marks || 0}</span>
                                    </div>
                                  </div>
                                ) : (
                                  /* For simple questions */
                                  <div>
                                    <div className="font-semibold text-[var(--text-primary)] mb-2">
                                      Q{idx + 1}. {question.question || question.statement || question.instruction || question.prompt}
                                    </div>
                                    <div className="mt-2 text-xs text-[var(--text-muted)] flex gap-4">
                                      <span>Marks: {question.marks || 0}</span>
                                      {question.difficulty && <span>Difficulty: {question.difficulty}</span>}
                                      {question.bloom_level && <span>Bloom: {question.bloom_level}</span>}
                                    </div>
                                    <div className="answer-display mt-3 p-2 bg-blue-50 border-l-4 border-blue-600 text-sm">
                                      <strong>Sample Answer:</strong> {formatAnswer(question.sample_answer || question.answer)}
                                    </div>
                                  </div>
                                )}
                              </div>
                            </div>
                          )}

                          {/* Print view without checkbox */}
                          {filterBySelection && (
                            <div className="mb-4">
                              <div className="font-semibold text-black mb-2">
                                Q{idx + 1}. {question.question}
                              </div>
                              <div className="text-xs text-gray-600 mb-2">Marks: {question.marks || 0}</div>
                              <div className="answer-space"></div>
                              <div className="answer-display mt-2 pt-2 border-t border-gray-300">
                                <strong className="text-sm">Sample Answer:</strong> {formatAnswer(question.sample_answer || question.answer)}
                              </div>
                            </div>
                          )}
                        </div>
                      )
                    })}
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[var(--background)] flex flex-col">
      {/* Header */}
      <header className="no-print bg-[var(--primary)] text-white h-18 px-12 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <BookOpen size={28} />
          <div>
            <span className="text-xl font-semibold">Exam Details</span>
            {exam && (
              <p className="text-xs text-white/70">
                {exam.subject} • Grade {exam.grade}
              </p>
            )}
          </div>
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
          {/* Back Button */}
          <button
            onClick={() => navigate('/exam-history')}
            className="mb-6 flex items-center gap-2 px-4 py-2 text-sm text-[var(--text-primary)] hover:bg-[var(--background-light)] rounded-lg transition-colors"
          >
            <ArrowLeft size={18} />
            Back to Exam History
          </button>

          {/* Error State */}
          {error && !loading && (
            <div className="bg-[var(--surface)] rounded-2xl shadow-lg p-8">
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mb-4">
                  <span className="text-3xl">⚠️</span>
                </div>
                <h3 className="text-xl font-semibold text-[var(--text-primary)] mb-2">Failed to Load Exam</h3>
                <p className="text-[var(--text-secondary)] mb-6 max-w-md">{error}</p>
                <div className="flex gap-3">
                  <button
                    onClick={() => window.location.reload()}
                    className="px-4 py-2 bg-[var(--primary)] text-white rounded-lg hover:bg-[var(--primary-dark)] transition-colors"
                  >
                    Retry
                  </button>
                  <button
                    onClick={() => navigate('/exam-history')}
                    className="px-4 py-2 bg-[var(--background-light)] text-[var(--text-primary)] rounded-lg hover:bg-[var(--border-light)] transition-colors"
                  >
                    Back to History
                  </button>
                </div>
                {error.includes('401') || error.includes('Unauthorized') || error.includes('token') ? (
                  <p className="mt-4 text-sm text-[var(--text-muted)]">
                    💡 Your session may have expired. Try <button onClick={logout} className="underline text-[var(--primary)]">logging out</button> and logging back in.
                  </p>
                ) : null}
              </div>
            </div>
          )}

          {/* Loading State */}
          {loading && (
            <div className="flex flex-col items-center justify-center py-20 text-center">
              <Sparkles size={64} className="text-[var(--primary)] mb-6 animate-pulse" />
              <p className="text-lg font-semibold text-[var(--text-primary)]">Loading exam details...</p>
            </div>
          )}

          {/* Exam Details */}
          {!loading && exam && (
            <div className="bg-[var(--surface)] rounded-2xl shadow-lg p-8 space-y-6">
              {/* Info Header */}
              <div className="border-b border-[var(--border-light)] pb-6">
                <h2 className="text-2xl font-bold text-[var(--text-primary)] mb-4">
                  {exam.subject} • Grade {exam.grade}
                </h2>

                <div className="grid grid-cols-4 gap-4">
                  <div className="bg-[var(--background-light)] rounded-lg p-4">
                    <p className="text-xs text-[var(--text-muted)] mb-1">Total Questions</p>
                    <p className="text-2xl font-bold text-[var(--primary)]">{exam.total_questions}</p>
                  </div>
                  <div className="bg-[var(--background-light)] rounded-lg p-4">
                    <p className="text-xs text-[var(--text-muted)] mb-1">Total Marks</p>
                    <p className="text-2xl font-bold text-[var(--primary)]">{exam.total_marks}</p>
                  </div>
                  <div className="bg-[var(--background-light)] rounded-lg p-4">
                    <p className="text-xs text-[var(--text-muted)] mb-1">Objective</p>
                    <p className="text-2xl font-bold text-blue-600">{exam.objective_questions_count}</p>
                  </div>
                  <div className="bg-[var(--background-light)] rounded-lg p-4">
                    <p className="text-xs text-[var(--text-muted)] mb-1">Subjective</p>
                    <p className="text-2xl font-bold text-purple-600">{exam.subjective_questions_count}</p>
                  </div>
                </div>

                <div className="mt-4 grid grid-cols-3 gap-4 text-sm">
                  <div>
                    <span className="text-[var(--text-muted)]">Created:</span>
                    <p className="font-medium text-[var(--text-primary)]">
                      {new Date(exam.created_at).toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </p>
                  </div>
                  {exam.course_page_range && (
                    <div>
                      <span className="text-[var(--text-muted)]">Course Pages:</span>
                      <p className="font-medium text-[var(--text-primary)]">{exam.course_page_range}</p>
                    </div>
                  )}
                  {exam.activity_page_range && (
                    <div>
                      <span className="text-[var(--text-muted)]">Activity Pages:</span>
                      <p className="font-medium text-[var(--text-primary)]">{exam.activity_page_range}</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Questions Display */}
              <div>
                <h3 className="text-lg font-semibold text-[var(--text-primary)] mb-4">Questions</h3>
                {renderQuestionsSection(false)}
              </div>

              {/* Selection Toolbar */}
              <div className="sticky bottom-0 bg-[var(--surface)] border-t border-[var(--border)] pt-4 flex items-center justify-between">
                <div className="text-sm text-[var(--text-secondary)]">
                  <span className="font-semibold text-[var(--text-primary)]">{selectedQuestions.size}</span> of{' '}
                  <span className="font-semibold text-[var(--text-primary)]">{exam.total_questions}</span> questions selected •
                  Total: <span className="font-semibold text-[var(--text-primary)]">{getTotalMarks()}</span> marks
                </div>
                <button
                  onClick={downloadExam}
                  disabled={selectedQuestions.size === 0 || downloading}
                  className="px-4 py-2 bg-[var(--primary)] text-white hover:bg-[var(--primary-dark)] rounded-lg text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                >
                  {downloading ? (
                    <>
                      <Sparkles size={16} className="animate-spin" />
                      Generating PDF...
                    </>
                  ) : (
                    <>
                      <Download size={16} />
                      Download PDF
                    </>
                  )}
                </button>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  )
}
