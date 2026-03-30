import { useState, useEffect } from 'react'
import { FileCheck, User, Sparkles, Download, GraduationCap, BookOpen, FileText, ListChecks, History } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { generateExam } from '../services/exam'
import { OBJECTIVE_TYPES, SUBJECTIVE_TYPES, MATH_OBJECTIVE_TYPES, MATH_SUBJECTIVE_TYPES, getQuestionTypes, type ExamResponse } from '../types'
import { QuestionRenderer } from '../components/QuestionRenderer'
import { generateExamPDF } from '../utils/pdfGenerator'

// Human-readable type labels for the exam view
const TYPE_LABELS: Record<string, string> = {
  mcq: 'Multiple Choice Questions',
  true_false: 'True / False',
  fill_in_blanks: 'Fill in the Blanks',
  match_columns: 'Match the Columns',
  circle_correct_answer: 'Circle the Correct Answer',
  rearrange_sentences: 'Rearrange the Sentences',
  unseen_comprehension_objective: 'Unseen Comprehension',
  short_answer: 'Short Answer Questions',
  complete_sentences: 'Complete the Sentences',
  make_sentences: 'Make Sentences',
  long_answer: 'Long Answer Questions',
  unseen_creative_writing: 'Creative Writing',
  picture_description: 'Picture Description',
  unseen_comprehension_subjective: 'Unseen Comprehension',
  fill_in_blanks_from_word_bank: 'Fill in the Blanks',
  short_practice_questions_missing_solution: 'Short Practice Questions',
  label_figures: 'Label the Figures',
  practice_questions_by_topic: 'Practice Questions',
  real_life_story_problems: 'Real-Life Story Problems',
  grammar_correction: 'Grammar Correction',
  parts_of_speech: 'Parts of Speech',
}

export default function ExamGenerator() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const [schoolName, setSchoolName] = useState('')
  const [formData, setFormData] = useState({
    grade: '',
    subject: '',
    coursePageRange: '',
    activityPageRange: '',
  })
  const [selectedObjective, setSelectedObjective] = useState<string[]>([])
  const [selectedSubjective, setSelectedSubjective] = useState<string[]>([])
  const [examResult, setExamResult] = useState<ExamResponse | null>(null)
  const [loading, setLoading] = useState(false)
  const [progress, setProgress] = useState(0)
  const [loadingMessage, setLoadingMessage] = useState('')
  const [error, setError] = useState('')
  const [selectedQuestions, setSelectedQuestions] = useState<Set<string>>(new Set())
  const [editingQuestion, setEditingQuestion] = useState<string | null>(null)
  const [editedQuestions, setEditedQuestions] = useState<Record<string, any>>({})
  const [downloading, setDownloading] = useState(false)
  const [questionImages, setQuestionImages] = useState<Record<string, string>>({})
  const [totalMarksOverride, setTotalMarksOverride] = useState<string>('')
  const [timeAllowed, setTimeAllowed] = useState<string>('')

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target

    // Auto-set page ranges when subject changes
    if (name === 'subject') {
      if (value === 'English') {
        setFormData({
          ...formData,
          subject: value,
          coursePageRange: '110-113',
          activityPageRange: '50-55'
        })
      } else if (value === 'Mathematics') {
        setFormData({
          ...formData,
          subject: value,
          coursePageRange: '143-148',
          activityPageRange: '131-133'
        })
      } else {
        setFormData({ ...formData, [name]: value })
      }
    } else {
      setFormData({ ...formData, [name]: value })
    }
  }

  const toggleQuestionType = (type: string, category: 'objective' | 'subjective') => {
    if (category === 'objective') {
      setSelectedObjective(prev =>
        prev.includes(type) ? prev.filter(t => t !== type) : [...prev, type]
      )
    } else {
      setSelectedSubjective(prev =>
        prev.includes(type) ? prev.filter(t => t !== type) : [...prev, type]
      )
    }
  }

  useEffect(() => {
    let interval: ReturnType<typeof setInterval> | null = null
    if (loading) {
      setProgress(0)
      setLoadingMessage('Initializing exam generation...')

      const startTime = Date.now()
      const targetDuration = 60000 // 60 seconds

      interval = setInterval(() => {
        const elapsed = Date.now() - startTime
        const progressPercent = Math.min((elapsed / targetDuration) * 95, 95)

        setProgress(progressPercent)

        if (progressPercent < 25) {
          setLoadingMessage('Analyzing course content...')
        } else if (progressPercent < 50) {
          setLoadingMessage('Generating questions...')
        } else if (progressPercent < 75) {
          setLoadingMessage('Applying Bloom\'s Taxonomy...')
        } else {
          setLoadingMessage('Finalizing exam...')
        }
      }, 100) // Update every 100ms for smooth animation
    } else {
      setProgress(100)
    }

    return () => {
      if (interval) clearInterval(interval)
    }
  }, [loading])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    setProgress(0)

    if (selectedObjective.length === 0 && selectedSubjective.length === 0) {
      setError('Please select at least one question type')
      setLoading(false)
      return
    }

    try {
      const result = await generateExam({
        grade: formData.grade,
        subject: formData.subject,
        course_page_range: formData.coursePageRange || undefined,
        activity_page_range: formData.activityPageRange || undefined,
        question_types: {
          objective: selectedObjective,
          subjective: selectedSubjective,
        },
      })

      setProgress(100)
      setLoadingMessage('Exam generated successfully!')

      // Validate the response
      if (!result) {
        setError('Invalid response from server. Please try again.')
        setLoading(false)
        setProgress(0)
        return
      }

      // Check if the generation was successful
      if (!result.success || !result.exam) {
        setError(result.error || 'Failed to generate exam. Please try again.')
        setLoading(false)
        setProgress(0)
        return
      }

      setTimeout(() => {
        setExamResult(result)
        setLoading(false)
        // Auto-select all questions after generation
        if (result.exam) {
          const allIds = new Set<string>()
          Object.entries(result.exam.objective || {}).forEach(([type, questions]) => {
            const arr = Array.isArray(questions) ? questions : []
            arr.forEach((_, i) => allIds.add(`obj-${type}-${i}`))
          })
          Object.entries(result.exam.subjective || {}).forEach(([type, questions]) => {
            const arr = Array.isArray(questions) ? questions : []
            arr.forEach((_, i) => allIds.add(`subj-${type}-${i}`))
          })
          setSelectedQuestions(allIds)
        }
      }, 500)
    } catch (err: any) {
      console.error('Exam generation error:', err)
      setError(err.response?.data?.detail || err.message || 'Failed to generate exam. Please try again.')
      setLoading(false)
      setProgress(0)
    }
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
    if (!examResult?.exam || selectedQuestions.size === 0) return

    setDownloading(true)
    try {
      const examData = {
        subject: formData.subject,
        grade: formData.grade,
        exam_content: examResult.exam,
        created_at: new Date().toISOString()
      }
      const filename = `${formData.subject}_Grade${formData.grade}_Exam_${new Date().toISOString().split('T')[0]}.pdf`
      const totalMarksVal = totalMarksOverride !== '' && !isNaN(parseInt(totalMarksOverride)) ? parseInt(totalMarksOverride) : undefined
      await generateExamPDF(examData, selectedQuestions, { filename, includeAnswerKey: true, schoolName, totalMarksOverride: totalMarksVal, timeAllowed: timeAllowed.trim() || undefined }, questionImages)
    } catch (error) {
      setError('Failed to download PDF. Please try again.')
    } finally {
      setDownloading(false)
    }
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

  const selectAllQuestions = () => {
    if (!examResult?.exam) return
    const allIds = new Set<string>()

    Object.entries(examResult.exam.objective || {}).forEach(([type, questions]) => {
      const questionArray = Array.isArray(questions) ? questions : []
      questionArray.forEach((_, index) => {
        allIds.add(`obj-${type}-${index}`)
      })
    })

    Object.entries(examResult.exam.subjective || {}).forEach(([type, questions]) => {
      const questionArray = Array.isArray(questions) ? questions : []
      questionArray.forEach((_, index) => {
        allIds.add(`subj-${type}-${index}`)
      })
    })

    setSelectedQuestions(allIds)
  }

  const unselectAllQuestions = () => {
    setSelectedQuestions(new Set())
  }

  const getCalculatedMarks = () => {
    if (!examResult?.exam) return 0
    let total = 0

    selectedQuestions.forEach(id => {
      const parts = id.split('-')
      const category = parts[0]
      const type = parts.slice(1, -1).join('-')
      const index = parseInt(parts[parts.length - 1])
      const questions = category === 'obj'
        ? examResult?.exam?.objective?.[type]
        : examResult?.exam?.subjective?.[type]

      const questionArray = Array.isArray(questions) ? questions : []
      if (questionArray && questionArray[index]) {
        total += questionArray[index].marks || 0
      }
    })

    return total
  }

  const getTotalMarks = () => {
    if (totalMarksOverride !== '' && !isNaN(parseInt(totalMarksOverride))) {
      return parseInt(totalMarksOverride)
    }
    return getCalculatedMarks()
  }

  const getQuestionTypeLabel = (typeId: string) => {
    const objType = OBJECTIVE_TYPES.find(t => t.id === typeId)
    const subjType = SUBJECTIVE_TYPES.find(t => t.id === typeId)
    const mathObjType = MATH_OBJECTIVE_TYPES.find(t => t.id === typeId)
    const mathSubjType = MATH_SUBJECTIVE_TYPES.find(t => t.id === typeId)
    return objType?.label || subjType?.label || mathObjType?.label || mathSubjType?.label || typeId
  }

  const startEditingQuestion = (questionId: string, question: any) => {
    setEditingQuestion(questionId)
    setEditedQuestions({
      ...editedQuestions,
      [questionId]: { ...question }
    })
  }

  const cancelEditingQuestion = () => {
    setEditingQuestion(null)
  }

  const saveEditedQuestion = (questionId: string) => {
    const [category, typeId, index] = questionId.split('-')
    const indexNum = parseInt(index)

    if (!examResult?.exam) return

    const updatedExam = { ...examResult.exam }
    const questions = category === 'obj'
      ? updatedExam.objective?.[typeId]
      : updatedExam.subjective?.[typeId]

    if (questions && questions[indexNum]) {
      questions[indexNum] = editedQuestions[questionId]
    }

    setExamResult({ ...examResult, exam: updatedExam })
    setEditingQuestion(null)
  }

  const deleteQuestion = (questionId: string) => {
    if (!examResult?.exam) return
    const parts = questionId.split('-')
    const category = parts[0]
    const typeId = parts.slice(1, -1).join('-')
    const index = parseInt(parts[parts.length - 1])

    const updatedExam = { ...examResult.exam }
    const section = category === 'obj' ? updatedExam.objective : updatedExam.subjective
    if (!section || !Array.isArray(section[typeId])) return

    section[typeId] = section[typeId].filter((_: any, i: number) => i !== index)

    // Rebuild selectedQuestions for this type to fix indices
    const prefix = `${category}-${typeId}-`
    const newSelected = new Set<string>()
    selectedQuestions.forEach(id => {
      if (!id.startsWith(prefix)) {
        newSelected.add(id)
      }
    })
    // Re-add with shifted indices
    section[typeId].forEach((_: any, i: number) => {
      // Only add if the original question at the old index was selected
      const oldIdx = i >= index ? i + 1 : i
      if (selectedQuestions.has(`${prefix}${oldIdx}`)) {
        newSelected.add(`${prefix}${i}`)
      }
    })

    setExamResult({ ...examResult, exam: updatedExam })
    setSelectedQuestions(newSelected)
    if (editingQuestion?.startsWith(prefix)) setEditingQuestion(null)
  }

  const updateEditedQuestion = (questionId: string, field: string, value: any) => {
    setEditedQuestions({
      ...editedQuestions,
      [questionId]: {
        ...editedQuestions[questionId],
        [field]: value
      }
    })
  }

  const renderQuestion = (question: any, index: number, typeId: string, category: 'objective' | 'subjective') => {
    const questionId = `${category === 'objective' ? 'obj' : 'subj'}-${typeId}-${index}`
    const isSelected = selectedQuestions.has(questionId)
    const isEditing = editingQuestion === questionId
    const editedQuestion = editedQuestions[questionId] || question

    return (
      <QuestionRenderer
        key={questionId}
        question={question}
        index={index}
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
        questionImage={questionImages[questionId]}
        onImageUpload={['picture_description', 'label_figures', 'practice_questions_by_topic', 'real_life_story_problems'].includes(typeId) ? (file) => handleImageUpload(questionId, file) : undefined}
        onDelete={() => deleteQuestion(questionId)}
      />
    )
  }

  // Build sequential Q-number map across all question types
  const buildQuestionNumberMap = (): Record<string, number> => {
    if (!examResult?.exam) return {}
    const map: Record<string, number> = {}
    let qNum = 0
    const addSection = (section: Record<string, any>) => {
      Object.entries(section).forEach(([typeId, questions]) => {
        const arr = Array.isArray(questions) ? questions : []
        if (arr.length > 0) { qNum++; map[typeId] = qNum }
      })
    }
    if (examResult.exam.objective) addSection(examResult.exam.objective)
    if (examResult.exam.subjective) addSection(examResult.exam.subjective)
    return map
  }

  const renderQuestionsSection = (filterBySelection = false) => {
    if (!examResult?.exam) return null
    const qNumMap = buildQuestionNumberMap()

    return (
      <div className="space-y-5">
        {/* Section A label */}
        {examResult.exam.objective && Object.keys(examResult.exam.objective).length > 0 && (
          <div>
            <h4 className="text-sm font-bold text-[var(--text-primary)] mb-3 pb-1 border-b-2 border-[var(--primary)] uppercase tracking-wide">
              Section A: Objective Questions
            </h4>
            <div className="space-y-4">
              {Object.entries(examResult.exam.objective).map(([typeId, questions]) => {
                const questionArray = Array.isArray(questions) ? questions : []
                if (questionArray.length === 0) return null
                if (filterBySelection) {
                  const any = questionArray.some((_, idx) => selectedQuestions.has(`obj-${typeId}-${idx}`))
                  if (!any) return null
                }
                const totalTypeMarks = questionArray.reduce((s: number, q: any) => s + (q.marks || 0), 0)
                const label = TYPE_LABELS[typeId] || getQuestionTypeLabel(typeId)

                return (
                  <div key={typeId} className="bg-white rounded-lg border border-[var(--border)] overflow-hidden">
                    {/* Q number header with collective marks */}
                    <div className="px-4 py-2 bg-[var(--primary)] text-white flex items-center justify-between">
                      <span className="text-sm font-bold">Q{qNumMap[typeId]}.  {label}</span>
                      <span className="text-xs opacity-90 font-medium">({totalTypeMarks} marks)</span>
                    </div>
                    <div className="p-4">
                      {questionArray.map((question: any, idx: number) => {
                        const questionId = `obj-${typeId}-${idx}`
                        if (filterBySelection && !selectedQuestions.has(questionId)) return null
                        return renderQuestion(question, idx, typeId, 'objective')
                      })}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* Section B label */}
        {examResult.exam.subjective && Object.keys(examResult.exam.subjective).length > 0 && (
          <div>
            <h4 className="text-sm font-bold text-[var(--text-primary)] mb-3 pb-1 border-b-2 border-purple-600 uppercase tracking-wide">
              Section B: Subjective Questions
            </h4>
            <div className="space-y-4">
              {Object.entries(examResult.exam.subjective).map(([typeId, questions]) => {
                const questionArray = Array.isArray(questions) ? questions : []
                if (questionArray.length === 0) return null
                if (filterBySelection) {
                  const any = questionArray.some((_, idx) => selectedQuestions.has(`subj-${typeId}-${idx}`))
                  if (!any) return null
                }
                const totalTypeMarks = questionArray.reduce((s: number, q: any) => s + (q.marks || 0), 0)
                const label = TYPE_LABELS[typeId] || getQuestionTypeLabel(typeId)

                return (
                  <div key={typeId} className="bg-white rounded-lg border border-[var(--border)] overflow-hidden">
                    <div className="px-4 py-2 bg-purple-700 text-white flex items-center justify-between">
                      <span className="text-sm font-bold">Q{qNumMap[typeId]}.  {label}</span>
                      <span className="text-xs opacity-90 font-medium">({totalTypeMarks} marks)</span>
                    </div>
                    <div className="p-4">
                      {questionArray.map((question: any, idx: number) => {
                        const questionId = `subj-${typeId}-${idx}`
                        if (filterBySelection && !selectedQuestions.has(questionId)) return null
                        return renderQuestion(question, idx, typeId, 'subjective')
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
      <header className="no-print bg-[var(--primary)] text-white h-18 px-12 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <FileCheck size={28} />
          <span className="text-xl font-semibold">Exam Generator</span>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate('/exam-history')}
            className="flex items-center gap-2 px-4 py-2 text-sm bg-white/10 hover:bg-white/20 rounded-md transition-colors"
          >
            <History size={16} />
            My Exams
          </button>
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
      <main className="flex-1 p-12 flex gap-8">
        {/* Form Panel */}
        <div className="no-print w-[420px] bg-[var(--surface)] rounded-2xl shadow-lg p-8 space-y-6 h-fit">
          <div>
            <h2 className="text-2xl font-semibold text-[var(--text-primary)] mb-2">
              Generate Your Exam
            </h2>
            <p className="text-sm text-[var(--text-secondary)] leading-relaxed">
              Configure the exam parameters below to generate a customized assessment.
            </p>
          </div>

          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* School Name */}
            <div>
              <label className="block text-sm font-medium text-[var(--text-primary)] mb-2">
                School Name
              </label>
              <input
                type="text"
                value={schoolName}
                onChange={(e) => setSchoolName(e.target.value)}
                placeholder="e.g., Army Public School (APS)"
                className="w-full h-11 px-4 bg-[var(--background-light)] border border-[var(--border)] rounded-[var(--radius-md)] text-[var(--text-primary)] placeholder-[var(--text-muted)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)] focus:border-transparent"
              />
            </div>

            {/* Time Allowed */}
            <div>
              <label className="block text-sm font-medium text-[var(--text-primary)] mb-2">
                Time Allowed
              </label>
              <input
                type="text"
                value={timeAllowed}
                onChange={(e) => setTimeAllowed(e.target.value)}
                placeholder="e.g., 1 Hour 30 Minutes"
                className="w-full h-11 px-4 bg-[var(--background-light)] border border-[var(--border)] rounded-[var(--radius-md)] text-[var(--text-primary)] placeholder-[var(--text-muted)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)] focus:border-transparent"
              />
            </div>

            {/* Grade Level */}
            <div>
              <label className="block text-sm font-medium text-[var(--text-primary)] mb-2">
                Grade Level
              </label>
              <input
                type="text"
                name="grade"
                value={formData.grade}
                onChange={handleChange}
                placeholder="e.g., 2, 3, 4"
                required
                className="w-full h-11 px-4 bg-[var(--background-light)] border border-[var(--border)] rounded-[var(--radius-md)] text-[var(--text-primary)] placeholder-[var(--text-muted)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)] focus:border-transparent"
              />
            </div>

            {/* Subject */}
            <div>
              <label className="block text-sm font-medium text-[var(--text-primary)] mb-2">
                Subject
              </label>
              <select
                name="subject"
                value={formData.subject}
                onChange={handleChange}
                required
                className="w-full h-11 px-4 bg-[var(--background-light)] border border-[var(--border)] rounded-[var(--radius-md)] text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)] focus:border-transparent"
              >
                <option value="">Select Subject</option>
                <option value="English">English</option>
                <option value="Mathematics">Mathematics</option>
              </select>
            </div>

            {/* Course Page Range */}
            <div>
              <label className="block text-sm font-medium text-[var(--text-primary)] mb-2">
                Course Page Range
              </label>
              <select
                name="coursePageRange"
                value={formData.coursePageRange}
                onChange={handleChange}
                required
                disabled={!formData.subject}
                className="w-full h-11 px-4 bg-[var(--background-light)] border border-[var(--border)] rounded-[var(--radius-md)] text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)] focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <option value="">Select page range</option>
                {formData.subject === 'English' && <option value="110-113">110-113</option>}
                {formData.subject === 'Mathematics' && <option value="143-148">143-148</option>}
              </select>
              {!formData.subject && (
                <p className="text-xs text-[var(--text-muted)] mt-1">Select a subject first</p>
              )}
            </div>

            {/* Activity Page Range */}
            <div>
              <label className="block text-sm font-medium text-[var(--text-primary)] mb-2">
                Activity Page Range
              </label>
              <select
                name="activityPageRange"
                value={formData.activityPageRange}
                onChange={handleChange}
                required
                disabled={!formData.subject}
                className="w-full h-11 px-4 bg-[var(--background-light)] border border-[var(--border)] rounded-[var(--radius-md)] text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)] focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <option value="">Select page range</option>
                {formData.subject === 'English' && <option value="50-55">50-55</option>}
                {formData.subject === 'Mathematics' && <option value="131-133">131-133</option>}
              </select>
              {!formData.subject && (
                <p className="text-xs text-[var(--text-muted)] mt-1">Select a subject first</p>
              )}
            </div>

            {/* Question Types */}
            <div>
              <label className="block text-sm font-medium text-[var(--text-primary)] mb-3">
                Question Types
              </label>

              {formData.subject ? (
                <>
                  {/* Objective Types */}
                  <div className="mb-4">
                    <div className="h-7 px-3 bg-[var(--primary)] text-white text-xs font-medium rounded-[var(--radius-sm)] flex items-center mb-2">
                      Objective Questions
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {getQuestionTypes(formData.subject).objective.map(type => (
                        <button
                          key={type.id}
                          type="button"
                          onClick={() => toggleQuestionType(type.id, 'objective')}
                          className={`px-3 py-1.5 text-xs font-medium rounded-[var(--radius-sm)] transition-colors ${
                            selectedObjective.includes(type.id)
                              ? 'bg-[var(--primary)] text-white'
                              : 'bg-[var(--background-light)] text-[var(--text-secondary)] hover:bg-[var(--border-light)]'
                          }`}
                        >
                          {type.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Subjective Types */}
                  <div>
                    <div className="h-7 px-3 bg-[var(--primary-light)] text-white text-xs font-medium rounded-[var(--radius-sm)] flex items-center mb-2">
                      Subjective Questions
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {getQuestionTypes(formData.subject).subjective.map(type => (
                        <button
                          key={type.id}
                          type="button"
                          onClick={() => toggleQuestionType(type.id, 'subjective')}
                          className={`px-3 py-1.5 text-xs font-medium rounded-[var(--radius-sm)] transition-colors ${
                            selectedSubjective.includes(type.id)
                              ? 'bg-[var(--primary-light)] text-white'
                              : 'bg-[var(--background-light)] text-[var(--text-secondary)] hover:bg-[var(--border-light)]'
                          }`}
                        >
                          {type.label}
                        </button>
                      ))}
                    </div>
                  </div>
                </>
              ) : (
                <div className="text-sm text-[var(--text-secondary)] italic">
                  Please select a subject first to see available question types
                </div>
              )}
            </div>

            {/* Generate Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full h-13 bg-[var(--primary)] text-white font-semibold rounded-[var(--radius-md)] hover:bg-[var(--primary-dark)] transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              <Sparkles size={18} />
              {loading ? 'Generating Exam...' : 'Generate Exam'}
            </button>
          </form>
        </div>

        {/* Output Panel */}
        <div className="flex-1 bg-[var(--surface)] rounded-2xl shadow-lg p-8 space-y-6">
          <div className="no-print flex items-center justify-between">
            <h2 className="text-2xl font-semibold text-[var(--text-primary)]">Generated Exam</h2>
          </div>

          <div className="no-print h-px bg-[var(--border-light)]" />

          {loading && (
            <div className="flex flex-col items-center justify-center py-20 text-center">
              <Sparkles size={64} className="text-[var(--primary)] mb-6 animate-pulse" />
              <p className="text-lg font-semibold text-[var(--text-primary)] mb-4">{loadingMessage}</p>
              <div className="w-full max-w-md">
                <div className="h-2 bg-[var(--background-light)] rounded-full overflow-hidden">
                  <div
                    className="h-full bg-[var(--primary)] transition-all duration-500 ease-out"
                    style={{ width: `${progress}%` }}
                  />
                </div>
                <p className="text-sm text-[var(--text-muted)] mt-2">{Math.round(progress)}%</p>
              </div>
            </div>
          )}

          {!examResult && !loading && (
            <div className="flex flex-col items-center justify-center py-20 text-center">
              <FileCheck size={64} className="text-[var(--text-muted)] mb-4" />
              <p className="text-lg text-[var(--text-secondary)]">
                Configure the parameters and click "Generate Exam" to start
              </p>
            </div>
          )}

          {examResult?.error && (
            <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-600">
              <p className="font-medium mb-1">Error generating exam</p>
              <p className="text-sm">{examResult.error}</p>
            </div>
          )}

          {examResult?.exam && (
            <div className="space-y-6">
              {/* Screen-only Metadata Display */}
              <div className="screen-only flex gap-6 text-sm mb-6">
                <div className="flex items-center gap-2">
                  <GraduationCap size={16} className="text-[var(--text-muted)]" />
                  <span className="text-[var(--text-muted)]">Grade:</span>
                  <span className="font-medium text-[var(--text-primary)]">{formData.grade}</span>
                </div>
                <div className="flex items-center gap-2">
                  <BookOpen size={16} className="text-[var(--text-muted)]" />
                  <span className="text-[var(--text-muted)]">Subject:</span>
                  <span className="font-medium text-[var(--text-primary)]">{formData.subject}</span>
                </div>
                <div className="flex items-center gap-2">
                  <FileText size={16} className="text-[var(--text-muted)]" />
                  <span className="text-[var(--text-muted)]">Pages:</span>
                  <span className="font-medium text-[var(--text-primary)]">{formData.coursePageRange || 'N/A'}</span>
                </div>
                <div className="flex items-center gap-2">
                  <ListChecks size={16} className="text-[var(--text-muted)]" />
                  <span className="text-[var(--text-muted)]">Types:</span>
                  <span className="font-medium text-[var(--text-primary)]">
                    {Object.keys(examResult.exam.objective || {}).length + Object.keys(examResult.exam.subjective || {}).length}
                  </span>
                </div>
              </div>

              {/* SCREEN VIEW - Show all questions */}
              <div className="screen-only">
                {renderQuestionsSection(false)}
              </div>

              {/* PRINT VIEW - Show only selected questions */}
              <div className="exam-print-area print-only hidden">
                {/* PROFESSIONAL EXAM HEADER */}
                <div className="exam-header">
                  {/* School Title */}
                  <div className="school-name">Army Public School (APS)</div>
                  <div className="exam-title">Examination Paper</div>

                  {/* Subject and Total Marks Row */}
                  <div className="exam-info-row">
                    <div className="exam-info-field">
                      <span>Subject:</span>
                      <span>{formData.subject}</span>
                    </div>
                    <div className="exam-info-field">
                      <span>Total Marks:</span>
                      <span>{getTotalMarks()}</span>
                    </div>
                  </div>

                  {/* Student Info Grid */}
                  <div className="student-info-grid">
                    <div className="info-item">
                      <span>Class:</span>
                      <span>{formData.grade}</span>
                    </div>
                    <div className="info-item">
                      <span>Date:</span>
                      <span>&nbsp;</span>
                    </div>
                    <div className="info-item" style={{ gridColumn: '1 / -1' }}>
                      <span>Name:</span>
                      <span>&nbsp;</span>
                    </div>
                    <div className="info-item">
                      <span>Roll No:</span>
                      <span>&nbsp;</span>
                    </div>
                    <div className="info-item">
                      <span>Section:</span>
                      <span>&nbsp;</span>
                    </div>
                  </div>

                  {/* Instructions */}
                  <div className="exam-instructions">
                    Note: Read questions carefully, don't overwrite and check your work.
                  </div>
                </div>

                {/* EXAM PAPER SECTION */}
                <div className="exam-paper-section">
                  {renderQuestionsSection(true)}
                </div>

                {/* ANSWER KEY SECTION - Starts on new page */}
                <div className="answer-key-section">
                  <div className="answer-key-header">ANSWER KEY / RUBRIC</div>
                  <div className="answer-key-meta">
                    <span className="font-bold mr-2">Subject:</span> {formData.subject}
                    <span className="font-bold mx-3">|</span>
                    <span className="font-bold mr-2">Grade:</span> {formData.grade}
                    <span className="font-bold mx-3">|</span>
                    <span className="font-bold mr-2">Date Generated:</span> {new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
                  </div>
                  {renderQuestionsSection(true)}
                </div>
              </div>
              {/* Selection Toolbar */}
              <div className="no-print sticky bottom-0 bg-[var(--surface)] border-t border-[var(--border)] pt-4 flex items-center justify-between">
                <div className="flex items-center gap-3 text-sm text-[var(--text-secondary)]">
                  <span>
                    <span className="font-semibold text-[var(--text-primary)]">{selectedQuestions.size}</span> of{' '}
                    <span className="font-semibold text-[var(--text-primary)]">
                      {Object.values(examResult.exam.objective || {}).reduce((sum, questions) =>
                        sum + (Array.isArray(questions) ? questions.length : 0), 0) +
                       Object.values(examResult.exam.subjective || {}).reduce((sum, questions) =>
                        sum + (Array.isArray(questions) ? questions.length : 0), 0)}
                    </span>{' '}
                    questions selected
                  </span>
                  <span className="text-[var(--border)]">|</span>
                  <div className="flex items-center gap-2">
                    <span>Total Marks:</span>
                    <input
                      type="number"
                      min="1"
                      value={totalMarksOverride !== '' ? totalMarksOverride : getCalculatedMarks()}
                      onChange={(e) => setTotalMarksOverride(e.target.value)}
                      onBlur={(e) => { if (e.target.value === '' || e.target.value === String(getCalculatedMarks())) setTotalMarksOverride('') }}
                      className="w-16 px-2 py-0.5 text-sm font-semibold text-[var(--text-primary)] border border-[var(--border)] rounded focus:outline-none focus:ring-1 focus:ring-[var(--primary)]"
                      title="Edit total marks for PDF"
                    />
                  </div>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={selectAllQuestions}
                    className="px-4 py-2 bg-[var(--background-light)] hover:bg-[var(--border-light)] rounded-lg text-sm font-medium transition-colors"
                  >
                    Select All
                  </button>
                  <button
                    onClick={unselectAllQuestions}
                    className="px-4 py-2 bg-[var(--background-light)] hover:bg-[var(--border-light)] rounded-lg text-sm font-medium transition-colors"
                  >
                    Unselect All
                  </button>
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
            </div>
          )}
        </div>
      </main>
    </div>
  )
}
