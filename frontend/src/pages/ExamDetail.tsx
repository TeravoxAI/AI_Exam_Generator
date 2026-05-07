import { useState, useEffect, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { User, ArrowLeft, Download, Sparkles, BookOpen } from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'
import { getExamById, type ExamDetailResponse } from '../services/exam'
import { generateExamPDF } from '../utils/pdfGenerator'
import { PDFPreview } from '../components/PDFPreview'
import { ExamDocEditor, type ExamDocEditorHandle } from '../components/ExamDocEditor'
import { QuestionRenderer } from '../components/QuestionRenderer'
import type { ImageStore, ImageAttachment } from '../utils/imageStore'
import { DEFAULT_IMAGE } from '../utils/imageStore'

// When false → show TipTap doc editor. When true → show PDF preview (current behavior).
const PDF_UI = false

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
  const [imageStore, setImageStore] = useState<ImageStore>({})
  const docEditorRef = useRef<ExamDocEditorHandle>(null)

  // Edit state (mirrors ExamGenerator pattern)
  const [editingQuestion, setEditingQuestion] = useState<string | null>(null)
  const [editedQuestions, setEditedQuestions] = useState<Record<string, any>>({})

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
      const q = editedQuestions[id] || arr[index]
      if (q) total += q.marks || 0
    })
    return total
  }

  // ImageStore handlers
  const handleImageUpload = (key: string, file: File) => {
    const reader = new FileReader()
    reader.onload = e => {
      const dataUrl = e.target?.result as string
      setImageStore(prev => ({ ...prev, [key]: { ...DEFAULT_IMAGE, ...prev[key], dataUrl } }))
      if (!PDF_UI) docEditorRef.current?.replaceImagePlaceholder(key, dataUrl)
    }
    reader.readAsDataURL(file)
  }
  const handleImageUpdate = (key: string, patch: Partial<ImageAttachment>) => {
    setImageStore(prev => ({ ...prev, [key]: { ...prev[key], ...patch } }))
  }
  const handleImageRemove = (key: string) => {
    setImageStore(prev => { const next = { ...prev }; delete next[key]; return next })
  }

  // Edit handlers
  const startEditingQuestion = (questionId: string, question: any) => {
    setEditingQuestion(questionId)
    setEditedQuestions(prev => ({ ...prev, [questionId]: { ...question } }))
  }
  const cancelEditingQuestion = () => setEditingQuestion(null)
  const saveEditedQuestion = (questionId: string) => {
    if (!exam) return
    const parts = questionId.split('-')
    const category = parts[0]
    const typeId = parts.slice(1, -1).join('-')
    const index = parseInt(parts[parts.length - 1])
    const section = category === 'obj' ? exam.exam_content?.objective : exam.exam_content?.subjective
    if (section && Array.isArray(section[typeId])) {
      section[typeId][index] = editedQuestions[questionId]
      setExam({ ...exam })
    }
    setEditingQuestion(null)
  }
  const updateEditedQuestion = (questionId: string, field: string, value: any) => {
    setEditedQuestions(prev => ({ ...prev, [questionId]: { ...prev[questionId], [field]: value } }))
  }
  const deleteQuestion = (questionId: string) => {
    if (!exam) return
    const parts = questionId.split('-')
    const category = parts[0]
    const typeId = parts.slice(1, -1).join('-')
    const index = parseInt(parts[parts.length - 1])
    const section = category === 'obj' ? exam.exam_content?.objective : exam.exam_content?.subjective
    if (!section || !Array.isArray(section[typeId])) return
    section[typeId] = section[typeId].filter((_: any, i: number) => i !== index)
    // Rebuild selectedQuestions for this type
    const prefix = `${category}-${typeId}-`
    const newSelected = new Set<string>()
    selectedQuestions.forEach(id => { if (!id.startsWith(prefix)) newSelected.add(id) })
    section[typeId].forEach((_: any, i: number) => {
      const oldIdx = i >= index ? i + 1 : i
      if (selectedQuestions.has(`${prefix}${oldIdx}`)) newSelected.add(`${prefix}${i}`)
    })
    setExam({ ...exam })
    setSelectedQuestions(newSelected)
    if (editingQuestion?.startsWith(prefix)) setEditingQuestion(null)
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
        imageStore
      )
    } catch {
      setError('Failed to download PDF. Please try again.')
    } finally {
      setDownloading(false)
    }
  }

  const getQuestionTypeLabel = (typeId: string) =>
    typeId.split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')

  const buildQuestionNumberMap = (): Record<string, number> => {
    if (!exam?.exam_content) return {}
    const map: Record<string, number> = {}
    let qNum = 0
    const addTypes = (section: Record<string, any>) => {
      Object.entries(section).forEach(([typeId, questions]) => {
        const arr = Array.isArray(questions) ? questions : []
        if (arr.length > 0) { qNum++; map[typeId] = qNum }
      })
    }
    if (exam.exam_content.objective) addTypes(exam.exam_content.objective)
    if (exam.exam_content.subjective) addTypes(exam.exam_content.subjective)
    return map
  }

  const renderQuestionsSection = () => {
    if (!exam?.exam_content) return null
    const qNumMap = buildQuestionNumberMap()

    const renderSection = (section: Record<string, any>, category: 'objective' | 'subjective') => {
      const catPrefix = category === 'objective' ? 'obj' : 'subj'
      const headerBg = category === 'objective' ? 'bg-[var(--primary)]' : 'bg-purple-700'

      return Object.entries(section).map(([typeId, questions]) => {
        const questionArray = Array.isArray(questions) ? questions : []
        if (questionArray.length === 0) return null
        const mainQNum = qNumMap[typeId] || ''
        const typeMarks = questionArray.reduce((s: number, q: any) => s + (q.marks || 0), 0)

        return (
          <div key={typeId} className="bg-white rounded-lg border border-[var(--border)] overflow-hidden mb-4">
            <div className={`px-4 py-2 ${headerBg} text-white flex items-center justify-between`}>
              <span className="text-sm font-bold">Q{mainQNum}. {getQuestionTypeLabel(typeId)}</span>
              <span className="text-xs opacity-80">({typeMarks} marks)</span>
            </div>
            <div className="p-4">
              {questionArray.map((question: any, idx: number) => {
                const questionId = `${catPrefix}-${typeId}-${idx}`
                const isSelected = selectedQuestions.has(questionId)
                const isEditing = editingQuestion === questionId
                const editedQuestion = editedQuestions[questionId] || question

                return (
                  <QuestionRenderer
                    key={questionId}
                    question={question}
                    index={idx}
                    typeId={typeId}
                    questionId={questionId}
                    isSelected={isSelected}
                    isEditing={isEditing}
                    editedQuestion={editedQuestion}
                    onToggleSelection={() => toggleQuestionSelection(questionId)}
                    onStartEditing={() => startEditingQuestion(questionId, question)}
                    onSaveEditing={() => saveEditedQuestion(questionId)}
                    onCancelEditing={cancelEditingQuestion}
                    onUpdateField={(field, value) => updateEditedQuestion(questionId, field, value)}
                    questionImage={imageStore[questionId]?.dataUrl}
                    onImageUpload={(file) => handleImageUpload(questionId, file)}
                    onDelete={() => deleteQuestion(questionId)}
                  />
                )
              })}
            </div>
          </div>
        )
      })
    }

    return (
      <div className="space-y-0">
        {exam.exam_content.objective && Object.keys(exam.exam_content.objective).length > 0 &&
          renderSection(exam.exam_content.objective, 'objective')}
        {exam.exam_content.subjective && Object.keys(exam.exam_content.subjective).length > 0 &&
          renderSection(exam.exam_content.subjective, 'subjective')}
      </div>
    )
  }

  return (
    <div className="h-screen bg-[var(--background)] flex flex-col overflow-hidden">
      {/* Header */}
      <header className="no-print bg-[var(--primary)] text-white px-12 py-4 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-3">
          <BookOpen size={26} />
          <div>
            <span className="text-lg font-semibold">Exam Details</span>
            {exam && <p className="text-xs text-white/70">{exam.subject} • Grade {exam.grade}</p>}
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

      <main className="flex-1 flex overflow-hidden">
        {loading && (
          <div className="flex-1 flex flex-col items-center justify-center py-20 text-center">
            <Sparkles size={56} className="text-[var(--primary)] mb-4 animate-pulse" />
            <p className="text-lg font-semibold text-[var(--text-primary)]">Loading exam details...</p>
          </div>
        )}

        {!loading && error && (
          <div className="flex-1 flex flex-col items-center justify-center p-8">
            <div className="bg-white rounded-2xl shadow-lg p-8 text-center max-w-md">
              <span className="text-4xl mb-3 block">⚠️</span>
              <h3 className="text-xl font-semibold text-[var(--text-primary)] mb-2">Failed to Load Exam</h3>
              <p className="text-[var(--text-secondary)] mb-5">{error}</p>
              <div className="flex gap-3 justify-center">
                <button onClick={() => window.location.reload()} className="px-4 py-2 bg-[var(--primary)] text-white rounded-lg">Retry</button>
                <button onClick={() => navigate('/exam-history')} className="px-4 py-2 bg-[var(--background-light)] rounded-lg">Back to History</button>
              </div>
            </div>
          </div>
        )}

        {!loading && exam && (
          <div className="flex flex-1 overflow-hidden">
            {/* Left: questions panel */}
            <div className="w-[520px] shrink-0 flex flex-col overflow-hidden border-r border-[var(--border)]">
              {/* Back + info */}
              <div className="px-5 pt-4 pb-2 shrink-0 space-y-1">
                <button
                  onClick={() => navigate('/exam-history')}
                  className="flex items-center gap-2 px-3 py-1.5 text-sm text-[var(--text-primary)] hover:bg-[var(--background-light)] rounded-lg transition-colors"
                >
                  <ArrowLeft size={16} />
                  Back to History
                </button>
                <div className="flex gap-3 text-xs text-[var(--text-muted)]">
                  <span>{exam.subject} • Grade {exam.grade}</span>
                  <span>•</span>
                  <span>{selectedQuestions.size} of {exam.total_questions} selected</span>
                </div>
              </div>

              {/* Scrollable questions */}
              <div className="flex-1 overflow-y-auto px-5 py-2">
                {renderQuestionsSection()}
              </div>

              {/* Sticky toolbar */}
              <div className="shrink-0 bg-[var(--surface)] border-t border-[var(--border)] px-5 py-3 space-y-2">
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    placeholder="School name (optional)"
                    value={schoolName}
                    onChange={e => setSchoolName(e.target.value)}
                    className="flex-1 px-3 py-1.5 text-sm border border-[var(--border)] rounded-lg bg-[var(--background-light)] placeholder:text-[var(--text-muted)] focus:outline-none focus:ring-1 focus:ring-[var(--primary)]"
                  />
                </div>
                <div className="flex items-center gap-2">
                  <div className="flex items-center gap-1.5 flex-1">
                    <span className="text-xs text-[var(--text-muted)] whitespace-nowrap">Marks:</span>
                    <input
                      type="number" min="0" step="0.5"
                      placeholder={String(getTotalMarks())}
                      value={totalMarksOverride}
                      onChange={e => setTotalMarksOverride(e.target.value)}
                      className="w-20 px-2 py-1.5 text-sm border border-[var(--border)] rounded-lg bg-[var(--background-light)] text-center focus:outline-none focus:ring-1 focus:ring-[var(--primary)]"
                    />
                  </div>
                  <div className="flex items-center gap-1.5 flex-1">
                    <span className="text-xs text-[var(--text-muted)] whitespace-nowrap">Time:</span>
                    <input
                      type="text" placeholder="e.g. 1 hour 30 min"
                      value={timeAllowed}
                      onChange={e => setTimeAllowed(e.target.value)}
                      className="flex-1 px-2 py-1.5 text-sm border border-[var(--border)] rounded-lg bg-[var(--background-light)] placeholder:text-[var(--text-muted)] focus:outline-none focus:ring-1 focus:ring-[var(--primary)]"
                    />
                  </div>
                  <button
                    onClick={downloadExam}
                    disabled={selectedQuestions.size === 0 || downloading}
                    className="px-3 py-1.5 bg-[var(--primary)] text-white hover:bg-[var(--primary-dark)] rounded-lg text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1.5 shrink-0"
                  >
                    {downloading ? <><Sparkles size={14} className="animate-spin" />Generating...</> : <><Download size={14} />PDF</>}
                  </button>
                </div>
              </div>
            </div>

            {/* Right: Doc Editor or PDF Preview */}
            <div className="flex-1 overflow-hidden">
              {PDF_UI ? (
                <PDFPreview
                  exam={exam}
                  selectedQuestions={selectedQuestions}
                  schoolName={schoolName}
                  totalMarks={totalMarksOverride.trim() ? parseFloat(totalMarksOverride) : getTotalMarks()}
                  timeAllowed={timeAllowed}
                  grade={String(exam.grade || '')}
                  subject={exam.subject || ''}
                  images={imageStore}
                  onUpload={handleImageUpload}
                  onUpdate={handleImageUpdate}
                  onRemove={handleImageRemove}
                />
              ) : (
                <ExamDocEditor
                  ref={docEditorRef}
                  exam={exam}
                  selectedQuestions={selectedQuestions}
                  schoolName={schoolName}
                  totalMarks={totalMarksOverride.trim() ? parseFloat(totalMarksOverride) : getTotalMarks()}
                  timeAllowed={timeAllowed}
                  grade={String(exam.grade || '')}
                  subject={exam.subject || ''}
                />
              )}
            </div>
          </div>
        )}
      </main>
    </div>
  )
}
