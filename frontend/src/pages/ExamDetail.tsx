import { useState, useEffect, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { User, ArrowLeft, Download, Sparkles, BookOpen, Upload, Image } from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'
import { getExamById, type ExamDetailResponse } from '../services/exam'
import { generateExamPDF } from '../utils/pdfGenerator'

// Roman numerals for sub-part labels
const toRoman = (n: number): string => {
  const nums = ['i','ii','iii','iv','v','vi','vii','viii','ix','x',
                'xi','xii','xiii','xiv','xv','xvi','xvii','xviii','xix','xx']
  return n >= 1 && n <= 20 ? nums[n - 1] : String(n)
}

export default function ExamDetail() {
  const { examId } = useParams<{ examId: string }>()
  const navigate = useNavigate()
  const { user, logout } = useAuth()
  const [exam, setExam] = useState<ExamDetailResponse['exam'] | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [selectedQuestions, setSelectedQuestions] = useState<Set<string>>(new Set())
  const [downloading, setDownloading] = useState(false)
  const [schoolName, setSchoolName] = useState('')
  const [totalMarksOverride, setTotalMarksOverride] = useState<string>('')
  const [timeAllowed, setTimeAllowed] = useState<string>('')
  // questionImages: maps questionId -> base64 data URL for Picture Description
  const [questionImages, setQuestionImages] = useState<Record<string, string>>({})
  const fileInputRefs = useRef<Record<string, HTMLInputElement | null>>({})

  useEffect(() => {
    const fetchExam = async () => {
      if (!examId) return
      setLoading(true)
      setError('')
      try {
        const response = await getExamById(examId)
        if (response.success && response.exam) {
          setExam(response.exam)
          selectAllQuestions(response.exam)
        } else {
          setError(response.error || 'Failed to load exam')
        }
      } catch (err: any) {
        setError(err.response?.data?.detail || err.message || 'Failed to load exam. Please try logging in again.')
      } finally {
        setLoading(false)
      }
    }
    fetchExam()
  }, [examId])

  const selectAllQuestions = (examData: any) => {
    const allIds = new Set<string>()
    if (!examData?.exam_content) { setSelectedQuestions(allIds); return }
    if (examData.exam_content?.objective) {
      Object.entries(examData.exam_content.objective).forEach(([typeId, questions]: [string, any]) => {
        const arr = Array.isArray(questions) ? questions : []
        arr.forEach((_, i) => allIds.add(`obj-${typeId}-${i}`))
      })
    }
    if (examData.exam_content?.subjective) {
      Object.entries(examData.exam_content.subjective).forEach(([typeId, questions]: [string, any]) => {
        const arr = Array.isArray(questions) ? questions : []
        arr.forEach((_, i) => allIds.add(`subj-${typeId}-${i}`))
      })
    }
    setSelectedQuestions(allIds)
  }

  const toggleQuestionSelection = (questionId: string) => {
    setSelectedQuestions(prev => {
      const next = new Set(prev)
      if (next.has(questionId)) next.delete(questionId)
      else next.add(questionId)
      return next
    })
  }

  const getTotalMarks = () => {
    if (!exam?.exam_content) return 0
    let total = 0
    selectedQuestions.forEach(id => {
      const parts = id.split('-')
      const category = parts[0]
      const type = parts.slice(1, -1).join('-')
      const index = parseInt(parts[parts.length - 1])
      const questions = category === 'obj'
        ? exam.exam_content?.objective?.[type]
        : exam.exam_content?.subjective?.[type]
      const arr = Array.isArray(questions) ? questions : []
      if (arr[index]) total += arr[index].marks || 0
    })
    return total
  }

  const handleImageUpload = (questionId: string, file: File) => {
    const reader = new FileReader()
    reader.onload = (e) => {
      const dataUrl = e.target?.result as string
      setQuestionImages(prev => ({ ...prev, [questionId]: dataUrl }))
    }
    reader.readAsDataURL(file)
  }

  const downloadExam = async () => {
    if (!exam || selectedQuestions.size === 0) return
    setDownloading(true)
    try {
      const filename = `${exam.subject}_Grade${exam.grade}_Exam_${new Date().toISOString().split('T')[0]}.pdf`
      const totalMarksVal = totalMarksOverride.trim() ? parseFloat(totalMarksOverride) : undefined
      await generateExamPDF(
        exam,
        selectedQuestions,
        { filename, includeAnswerKey: true, schoolName: schoolName.trim() || undefined, totalMarksOverride: totalMarksVal, timeAllowed: timeAllowed.trim() || undefined },
        questionImages
      )
    } catch (error) {
      setError('Failed to download PDF. Please try again.')
    } finally {
      setDownloading(false)
    }
  }

  const getQuestionTypeLabel = (typeId: string) =>
    typeId.split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')

  const formatAnswer = (answer: any) => {
    if (!answer) return 'N/A'
    if (typeof answer === 'boolean') return answer ? 'True' : 'False'
    if (typeof answer === 'object' && !Array.isArray(answer))
      return Object.entries(answer).map(([k, v]) => `${k} → ${v}`).join(', ')
    if (Array.isArray(answer)) return answer.join(', ')
    return String(answer)
  }

  // Build a sequential question-number map: typeId -> Q number (across all types)
  const buildQuestionNumberMap = (): Record<string, number> => {
    if (!exam?.exam_content) return {}
    const map: Record<string, number> = {}
    let qNum = 0
    const addTypes = (section: Record<string, any>) => {
      Object.entries(section).forEach(([typeId, questions]) => {
        const arr = Array.isArray(questions) ? questions : []
        if (arr.length > 0) {
          qNum++
          map[typeId] = qNum
        }
      })
    }
    if (exam.exam_content.objective) addTypes(exam.exam_content.objective)
    if (exam.exam_content.subjective) addTypes(exam.exam_content.subjective)
    return map
  }

  const renderQuestionsSection = () => {
    if (!exam?.exam_content) return null
    const qNumMap = buildQuestionNumberMap()

    return (
      <div className="space-y-6">
        {/* Objective Questions */}
        {exam.exam_content.objective && Object.keys(exam.exam_content.objective).length > 0 && (
          <div>
            <div className="space-y-4">
              {Object.entries(exam.exam_content.objective).map(([typeId, questions]) => {
                const questionArray = Array.isArray(questions) ? questions : []
                if (questionArray.length === 0) return null
                const mainQNum = qNumMap[typeId] || ''
                const typeMarks = questionArray.reduce((s: number, q: any) => s + (q.marks || 0), 0)

                return (
                  <div key={typeId} className="bg-white rounded-lg border border-[var(--border)] overflow-hidden">
                    {/* Question type header */}
                    <div className="px-4 py-2 bg-[var(--primary)] text-white flex items-center justify-between">
                      <span className="text-sm font-bold">
                        Q{mainQNum}. {getQuestionTypeLabel(typeId)}
                      </span>
                      <span className="text-xs opacity-80">({typeMarks} marks)</span>
                    </div>

                    {/* Individual items */}
                    <div className="p-4 space-y-3">
                      {questionArray.map((question: any, idx: number) => {
                        const questionId = `obj-${typeId}-${idx}`
                        const isSelected = selectedQuestions.has(questionId)

                        return (
                          <div key={questionId}
                            className={`flex items-start gap-3 p-3 rounded-lg border transition-colors ${isSelected ? 'bg-[var(--background-light)] border-[var(--border-light)]' : 'bg-white border-dashed border-gray-200 opacity-50'}`}>
                            <input
                              type="checkbox"
                              checked={isSelected}
                              onChange={() => toggleQuestionSelection(questionId)}
                              className="mt-1 w-4 h-4 cursor-pointer accent-[var(--primary)] shrink-0"
                            />
                            <div className="flex-1 min-w-0">
                              {/* Sub-part label */}
                              <span className="text-xs font-bold text-[var(--text-secondary)] mr-1">({toRoman(idx + 1)})</span>

                              {/* Question content based on type */}
                              {typeId === 'unseen_comprehension_objective' ? (
                                <div>
                                  {question.passage && (
                                    <div className="mt-1 p-3 bg-gray-50 rounded-lg border border-gray-200 text-sm italic text-gray-700 mb-3">
                                      <p className="text-xs font-bold text-gray-500 mb-1 not-italic">Passage:</p>
                                      {question.passage}
                                    </div>
                                  )}
                                  {(question.sub_questions || []).map((subQ: any, si: number) => (
                                    <div key={si} className="ml-2 mb-2 border-l-2 border-blue-200 pl-3">
                                      <p className="text-sm font-medium">{toRoman(si + 1)}. {subQ.question}</p>
                                      {subQ.options && (
                                        <div className="ml-3 mt-1 grid grid-cols-2 gap-1">
                                          {subQ.options.map((opt: string, oi: number) => (
                                            <span key={oi} className="text-xs text-gray-600">
                                              {String.fromCharCode(97 + oi)}) {opt}
                                            </span>
                                          ))}
                                        </div>
                                      )}
                                      <div className="mt-1 text-xs text-green-700 bg-green-50 px-2 py-1 rounded border-l-2 border-green-400">
                                        <strong>Answer:</strong> {subQ.answer}  <span className="text-gray-400">({subQ.marks} marks)</span>
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              ) : typeId === 'match_columns' ? (
                                <div>
                                  {question.instruction && (
                                    <p className="text-xs italic text-gray-500 mb-2">{question.instruction}</p>
                                  )}
                                  <div className="grid grid-cols-2 gap-4">
                                    <div>
                                      <p className="text-xs font-semibold text-gray-500 mb-1">Column A</p>
                                      {(question.column_a || []).map((item: string, i: number) => (
                                        <p key={i} className="text-sm">{i + 1}. {item}</p>
                                      ))}
                                    </div>
                                    <div>
                                      <p className="text-xs font-semibold text-gray-500 mb-1">Column B</p>
                                      {(question.column_b || []).map((item: string, i: number) => (
                                        <p key={i} className="text-sm">{String.fromCharCode(65 + i)}. {item}</p>
                                      ))}
                                    </div>
                                  </div>
                                  {question.answer && (
                                    <div className="mt-2 text-xs text-green-700 bg-green-50 px-2 py-1 rounded border-l-2 border-green-400">
                                      <strong>Answer:</strong> {formatAnswer(question.answer)}
                                    </div>
                                  )}
                                </div>
                              ) : typeId === 'true_false' ? (
                                <div>
                                  <span className="text-sm text-[var(--text-primary)]">{question.statement}</span>
                                  <div className="mt-1 text-xs text-green-700 bg-green-50 px-2 py-1 rounded inline-block border-l-2 border-green-400 ml-2">
                                    <strong>Answer:</strong> {question.answer ? 'True' : 'False'}
                                  </div>
                                </div>
                              ) : (
                                <div>
                                  <span className="text-sm text-[var(--text-primary)]">
                                    {question.question || question.statement || question.instruction}
                                  </span>
                                  {question.options && (
                                    <div className="mt-1 ml-2 grid grid-cols-2 gap-1">
                                      {question.options.map((opt: string, oi: number) => (
                                        <span key={oi} className="text-xs text-gray-600">
                                          {String.fromCharCode(97 + oi)}) {opt}
                                        </span>
                                      ))}
                                    </div>
                                  )}
                                  {question.answer !== undefined && (
                                    <div className="mt-1 text-xs text-green-700 bg-green-50 px-2 py-1 rounded border-l-2 border-green-400">
                                      <strong>Answer:</strong> {formatAnswer(question.answer)}
                                      <span className="text-gray-400 ml-2">({question.marks} marks)</span>
                                    </div>
                                  )}
                                </div>
                              )}
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* Subjective Questions */}
        {exam.exam_content.subjective && Object.keys(exam.exam_content.subjective).length > 0 && (
          <div>
            <div className="space-y-4">
              {Object.entries(exam.exam_content.subjective).map(([typeId, questions]) => {
                const questionArray = Array.isArray(questions) ? questions : []
                if (questionArray.length === 0) return null
                const mainQNum = qNumMap[typeId] || ''
                const typeMarks = questionArray.reduce((s: number, q: any) => s + (q.marks || 0), 0)

                return (
                  <div key={typeId} className="bg-white rounded-lg border border-[var(--border)] overflow-hidden">
                    <div className="px-4 py-2 bg-purple-700 text-white flex items-center justify-between">
                      <span className="text-sm font-bold">
                        Q{mainQNum}. {getQuestionTypeLabel(typeId)}
                      </span>
                      <span className="text-xs opacity-80">({typeMarks} marks)</span>
                    </div>

                    <div className="p-4 space-y-3">
                      {questionArray.map((question: any, idx: number) => {
                        const questionId = `subj-${typeId}-${idx}`
                        const isSelected = selectedQuestions.has(questionId)

                        return (
                          <div key={questionId}
                            className={`flex items-start gap-3 p-3 rounded-lg border transition-colors ${isSelected ? 'bg-[var(--background-light)] border-[var(--border-light)]' : 'bg-white border-dashed border-gray-200 opacity-50'}`}>
                            <input
                              type="checkbox"
                              checked={isSelected}
                              onChange={() => toggleQuestionSelection(questionId)}
                              className="mt-1 w-4 h-4 cursor-pointer accent-purple-600 shrink-0"
                            />
                            <div className="flex-1 min-w-0">
                              <span className="text-xs font-bold text-[var(--text-secondary)] mr-1">({toRoman(idx + 1)})</span>

                              {typeId === 'unseen_comprehension_subjective' ? (
                                <div>
                                  {question.passage && (
                                    <div className="mt-1 p-3 bg-gray-50 rounded-lg border border-gray-200 text-sm italic text-gray-700 mb-3">
                                      <p className="text-xs font-bold text-gray-500 mb-1 not-italic">Passage:</p>
                                      {question.passage}
                                    </div>
                                  )}
                                  {(question.sub_questions || []).map((subQ: any, si: number) => (
                                    <div key={si} className="ml-2 mb-2 border-l-2 border-purple-200 pl-3">
                                      <p className="text-sm font-medium">{toRoman(si + 1)}. {subQ.question}</p>
                                      <p className="text-xs text-gray-500">({subQ.marks} marks)</p>
                                      <div className="mt-1 text-xs text-blue-700 bg-blue-50 px-2 py-1 rounded border-l-2 border-blue-400">
                                        <strong>Sample Answer:</strong> {subQ.answer}
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              ) : typeId === 'make_sentences' ? (
                                <div>
                                  {question.instruction && (
                                    <p className="text-xs italic text-gray-500 mb-2">{question.instruction}</p>
                                  )}
                                  {(question.words || []).map((wordItem: any, wi: number) => {
                                    const isObj = typeof wordItem === 'object' && wordItem !== null
                                    const word = isObj ? wordItem.word : wordItem
                                    const sampleAns = isObj ? wordItem.answer : null
                                    return (
                                      <div key={wi} className="mb-1">
                                        <span className="text-sm font-semibold">{toRoman(wi + 1)}. {word}</span>
                                        {sampleAns && (
                                          <div className="mt-0.5 text-xs text-blue-700 bg-blue-50 px-2 py-0.5 rounded border-l-2 border-blue-400">
                                            <strong>Sample:</strong> {sampleAns}
                                          </div>
                                        )}
                                      </div>
                                    )
                                  })}
                                </div>
                              ) : typeId === 'picture_description' ? (
                                <div>
                                  <p className="text-sm text-[var(--text-primary)] mb-2">
                                    {question.instruction || 'Look at the picture and describe it.'}
                                  </p>
                                  {/* Image upload */}
                                  <div className="mb-2">
                                    {questionImages[`subj-picture_description-${idx}`] ? (
                                      <div className="relative inline-block">
                                        <img
                                          src={questionImages[`subj-picture_description-${idx}`]}
                                          alt="Question image"
                                          className="max-w-[200px] max-h-[150px] rounded border border-gray-300 object-contain"
                                        />
                                        <button
                                          onClick={() => {
                                            const newImages = { ...questionImages }
                                            delete newImages[`subj-picture_description-${idx}`]
                                            setQuestionImages(newImages)
                                          }}
                                          className="absolute top-1 right-1 bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs hover:bg-red-600"
                                        >×</button>
                                      </div>
                                    ) : (
                                      <div>
                                        <input
                                          type="file"
                                          accept="image/*"
                                          className="hidden"
                                          ref={el => { fileInputRefs.current[`subj-picture_description-${idx}`] = el }}
                                          onChange={(e) => {
                                            const file = e.target.files?.[0]
                                            if (file) handleImageUpload(`subj-picture_description-${idx}`, file)
                                          }}
                                        />
                                        <button
                                          onClick={() => fileInputRefs.current[`subj-picture_description-${idx}`]?.click()}
                                          className="flex items-center gap-2 px-3 py-1.5 text-xs bg-[var(--background-light)] border border-dashed border-[var(--border)] rounded-lg hover:bg-blue-50 hover:border-blue-300 transition-colors"
                                        >
                                          <Upload size={12} />
                                          Upload Picture for this Question
                                        </button>
                                        {question.image_description && (
                                          <p className="mt-1 text-xs italic text-gray-400">{question.image_description}</p>
                                        )}
                                      </div>
                                    )}
                                  </div>
                                  {question.answer && (
                                    <div className="text-xs text-blue-700 bg-blue-50 px-2 py-1 rounded border-l-2 border-blue-400">
                                      <strong>Sample Answer:</strong> {question.answer}
                                    </div>
                                  )}
                                </div>
                              ) : typeId === 'unseen_creative_writing' ? (
                                <div>
                                  {question.instruction && (
                                    <p className="text-sm italic text-gray-500 mb-1">{question.instruction}</p>
                                  )}
                                  {question.prompt && (
                                    <div className="p-2 bg-amber-50 border border-amber-200 rounded text-sm font-medium text-amber-900 mb-2">
                                      Topic: {question.prompt}
                                    </div>
                                  )}
                                  {question.answer && (
                                    <div className="text-xs text-blue-700 bg-blue-50 px-2 py-1 rounded border-l-2 border-blue-400">
                                      <strong>Sample Answer:</strong> {question.answer}
                                    </div>
                                  )}
                                </div>
                              ) : typeId === 'complete_sentences' ? (
                                <div>
                                  {question.instruction && (
                                    <p className="text-xs italic text-gray-500 mb-2">{question.instruction}</p>
                                  )}
                                  {(question.sentences || []).map((sent: any, si: number) => {
                                    const isObj = typeof sent === 'object' && sent !== null
                                    const text = isObj ? sent.incomplete || sent.sentence : sent
                                    const ans = isObj ? sent.answer : null
                                    return (
                                      <div key={si} className="mb-1">
                                        <p className="text-sm">{toRoman(si + 1)}. {text}</p>
                                        {ans && (
                                          <div className="mt-0.5 text-xs text-blue-700 bg-blue-50 px-2 py-0.5 rounded border-l-2 border-blue-400">
                                            <strong>Answer:</strong> {ans}
                                          </div>
                                        )}
                                      </div>
                                    )
                                  })}
                                </div>
                              ) : (
                                <div>
                                  <span className="text-sm text-[var(--text-primary)]">
                                    {question.question || question.statement || question.instruction || question.prompt}
                                  </span>
                                  {(question.sample_answer || question.answer) && (
                                    <div className="mt-2 text-xs text-blue-700 bg-blue-50 px-2 py-1 rounded border-l-2 border-blue-400">
                                      <strong>Sample Answer:</strong> {question.sample_answer || question.answer}
                                      <span className="text-gray-400 ml-2">({question.marks} marks)</span>
                                    </div>
                                  )}
                                </div>
                              )}
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )}
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[var(--background)] flex flex-col">
      {/* Header */}
      <header className="no-print bg-[var(--primary)] text-white px-12 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <BookOpen size={26} />
          <div>
            <span className="text-lg font-semibold">Exam Details</span>
            {exam && (
              <p className="text-xs text-white/70">{exam.subject} • Grade {exam.grade}</p>
            )}
          </div>
        </div>
        <div className="flex items-center gap-3">
          <User size={28} />
          <span className="text-sm font-medium">{user?.firstName} {user?.lastName}</span>
          <button onClick={logout} className="ml-4 px-4 py-2 text-sm bg-white/10 hover:bg-white/20 rounded-md transition-colors">
            Logout
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 p-8">
        <div className="max-w-5xl mx-auto">
          {/* Back */}
          <button
            onClick={() => navigate('/exam-history')}
            className="mb-4 flex items-center gap-2 px-3 py-1.5 text-sm text-[var(--text-primary)] hover:bg-[var(--background-light)] rounded-lg transition-colors"
          >
            <ArrowLeft size={16} />
            Back to Exam History
          </button>

          {/* Error */}
          {error && !loading && (
            <div className="bg-white rounded-2xl shadow-lg p-8 text-center">
              <div className="w-14 h-14 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <span className="text-2xl">⚠️</span>
              </div>
              <h3 className="text-xl font-semibold text-[var(--text-primary)] mb-2">Failed to Load Exam</h3>
              <p className="text-[var(--text-secondary)] mb-5">{error}</p>
              <div className="flex gap-3 justify-center">
                <button onClick={() => window.location.reload()} className="px-4 py-2 bg-[var(--primary)] text-white rounded-lg">Retry</button>
                <button onClick={() => navigate('/exam-history')} className="px-4 py-2 bg-[var(--background-light)] rounded-lg">Back to History</button>
              </div>
            </div>
          )}

          {/* Loading */}
          {loading && (
            <div className="flex flex-col items-center justify-center py-20 text-center">
              <Sparkles size={56} className="text-[var(--primary)] mb-4 animate-pulse" />
              <p className="text-lg font-semibold text-[var(--text-primary)]">Loading exam details...</p>
            </div>
          )}

          {/* Exam Details */}
          {!loading && exam && (
            <div className="bg-[var(--surface)] rounded-2xl shadow-lg overflow-hidden">
              {/* Info Header */}
              <div className="p-6 border-b border-[var(--border-light)]">
                <h2 className="text-xl font-bold text-[var(--text-primary)] mb-4">
                  {exam.subject} • Grade {exam.grade}
                </h2>
                <div className="grid grid-cols-4 gap-3">
                  {[
                    { label: 'Total Questions', value: exam.total_questions, color: 'text-[var(--primary)]' },
                    { label: 'Total Marks', value: exam.total_marks, color: 'text-[var(--primary)]' },
                    { label: 'Objective', value: exam.objective_questions_count, color: 'text-blue-600' },
                    { label: 'Subjective', value: exam.subjective_questions_count, color: 'text-purple-600' },
                  ].map(({ label, value, color }) => (
                    <div key={label} className="bg-[var(--background-light)] rounded-lg p-3">
                      <p className="text-xs text-[var(--text-muted)] mb-0.5">{label}</p>
                      <p className={`text-2xl font-bold ${color}`}>{value}</p>
                    </div>
                  ))}
                </div>
                <div className="mt-3 flex gap-6 text-sm text-[var(--text-muted)]">
                  <span>Created: {new Date(exam.created_at).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })}</span>
                  {exam.course_page_range && <span>Course Pages: {exam.course_page_range}</span>}
                  {exam.activity_page_range && <span>Activity Pages: {exam.activity_page_range}</span>}
                </div>
              </div>

              {/* Picture Description Note */}
              {((exam.exam_content?.subjective?.picture_description as any[] | undefined) ?? []).length > 0 && (
                <div className="mx-6 mt-4 p-3 bg-amber-50 border border-amber-200 rounded-lg flex items-center gap-2 text-sm text-amber-800">
                  <Image size={16} />
                  <span>Upload images for Picture Description questions using the upload button next to each question.</span>
                </div>
              )}

              {/* Questions */}
              <div className="p-6">
                <h3 className="text-base font-semibold text-[var(--text-primary)] mb-4">Questions</h3>
                {renderQuestionsSection()}
              </div>

              {/* Download Toolbar */}
              <div className="sticky bottom-0 bg-[var(--surface)] border-t border-[var(--border)] px-6 py-4 space-y-3">
                {/* PDF options row */}
                <div className="flex items-center gap-3">
                  <input
                    type="text"
                    placeholder="School name (optional)"
                    value={schoolName}
                    onChange={(e) => setSchoolName(e.target.value)}
                    className="flex-1 px-3 py-1.5 text-sm border border-[var(--border)] rounded-lg bg-[var(--background-light)] placeholder:text-[var(--text-muted)] focus:outline-none focus:ring-1 focus:ring-[var(--primary)]"
                  />
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs text-[var(--text-muted)] whitespace-nowrap">Total Marks:</span>
                    <input
                      type="number"
                      min="0"
                      step="0.5"
                      placeholder={String(getTotalMarks())}
                      value={totalMarksOverride}
                      onChange={(e) => setTotalMarksOverride(e.target.value)}
                      className="w-20 px-2 py-1.5 text-sm border border-[var(--border)] rounded-lg bg-[var(--background-light)] text-center focus:outline-none focus:ring-1 focus:ring-[var(--primary)]"
                    />
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs text-[var(--text-muted)] whitespace-nowrap">Time:</span>
                    <input
                      type="text"
                      placeholder="e.g. 1 hour 30 min"
                      value={timeAllowed}
                      onChange={(e) => setTimeAllowed(e.target.value)}
                      className="w-32 px-2 py-1.5 text-sm border border-[var(--border)] rounded-lg bg-[var(--background-light)] placeholder:text-[var(--text-muted)] focus:outline-none focus:ring-1 focus:ring-[var(--primary)]"
                    />
                  </div>
                </div>
                {/* Actions row */}
                <div className="flex items-center justify-between">
                  <div className="text-sm text-[var(--text-secondary)]">
                    <span className="font-semibold text-[var(--text-primary)]">{selectedQuestions.size}</span> of{' '}
                    <span className="font-semibold text-[var(--text-primary)]">{exam.total_questions}</span> questions selected •
                    Total: <span className="font-semibold text-[var(--text-primary)]">{totalMarksOverride.trim() ? totalMarksOverride : getTotalMarks()}</span> marks
                  </div>
                  <button
                    onClick={downloadExam}
                    disabled={selectedQuestions.size === 0 || downloading}
                    className="px-4 py-2 bg-[var(--primary)] text-white hover:bg-[var(--primary-dark)] rounded-lg text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                  >
                    {downloading ? (
                      <><Sparkles size={15} className="animate-spin" />Generating PDF...</>
                    ) : (
                      <><Download size={15} />Download PDF</>
                    )}
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  )
}
