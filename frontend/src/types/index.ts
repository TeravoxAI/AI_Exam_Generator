export interface User {
  id: string
  email: string
  firstName: string
  lastName: string
  role: string
  school: string
}

export interface LoginRequest {
  email: string
  password: string
}

export interface SignupRequest {
  email: string
  password: string
  first_name: string
  last_name: string
  role: string
  school: string
}

export interface ExamRequest {
  subject: string
  grade: string
  course_page_range?: string
  activity_page_range?: string
  question_types: {
    objective: string[]
    subjective: string[]
  }
}

export interface ExamResponse {
  success: boolean
  exam?: {
    objective: Record<string, any>
    subjective: Record<string, any>
  }
  error?: string
}

export interface QuestionType {
  id: string
  label: string
  category: 'objective' | 'subjective'
}

export const OBJECTIVE_TYPES: QuestionType[] = [
  { id: 'mcq', label: 'Multiple Choice Questions (MCQ)', category: 'objective' },
  { id: 'true_false', label: 'True/False', category: 'objective' },
  { id: 'fill_in_blanks', label: 'Fill in the Blanks', category: 'objective' },
  { id: 'match_columns', label: 'Match Columns', category: 'objective' },
  { id: 'circle_correct_answer', label: 'Circle Correct Answer', category: 'objective' },
  { id: 'rearrange_sentences', label: 'Rearrange Sentences', category: 'objective' },
  { id: 'unseen_comprehension_objective', label: 'Unseen Comprehension (Objective)', category: 'objective' },
]

export const SUBJECTIVE_TYPES: QuestionType[] = [
  { id: 'short_answer', label: 'Short Answer', category: 'subjective' },
  { id: 'complete_sentences', label: 'Complete Sentences', category: 'subjective' },
  { id: 'make_sentences', label: 'Make Sentences', category: 'subjective' },
  { id: 'long_answer', label: 'Long Answer', category: 'subjective' },
  { id: 'unseen_creative_writing', label: 'Unseen Creative Writing', category: 'subjective' },
  { id: 'picture_description', label: 'Picture Description', category: 'subjective' },
  { id: 'unseen_comprehension_subjective', label: 'Unseen Comprehension (Subjective)', category: 'subjective' },
]
