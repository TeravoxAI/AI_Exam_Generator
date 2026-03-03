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
  { id: 'grammar_correction', label: 'Grammar Correction', category: 'subjective' },
  { id: 'parts_of_speech', label: 'Parts of Speech', category: 'subjective' },
]

// Mathematics Question Types (9 specific types for embedded assessment)
export const MATH_OBJECTIVE_TYPES: QuestionType[] = [
  { id: 'match_columns', label: 'Match the Columns', category: 'objective' },
  { id: 'fill_in_blanks', label: 'Fill in the Blanks', category: 'objective' },
  { id: 'circle_correct_answer', label: 'Circle the Correct Answer (MCQs)', category: 'objective' },
  { id: 'fill_in_blanks_from_word_bank', label: 'Fill in Blanks from Word Bank', category: 'objective' },
  { id: 'true_false', label: 'True/False Statements', category: 'objective' },
  { id: 'label_figures', label: 'Label the Figures', category: 'objective' },
  { id: 'short_practice_questions_missing_solution', label: 'Short Practice (Missing Solution)', category: 'objective' },
  { id: 'drawing_exercise', label: 'Drawing Exercise (Shapes/Diagrams)', category: 'objective' },
]

export const MATH_SUBJECTIVE_TYPES: QuestionType[] = [
  { id: 'practice_questions_by_topic', label: 'Practice Questions by Topic', category: 'subjective' },
  { id: 'real_life_story_problems', label: 'Real-Life Story Problems', category: 'subjective' },
]

// Get question types based on subject
export function getQuestionTypes(subject: string) {
  if (subject.toLowerCase() === 'mathematics') {
    return {
      objective: MATH_OBJECTIVE_TYPES,
      subjective: MATH_SUBJECTIVE_TYPES,
    }
  }
  // Default to English
  return {
    objective: OBJECTIVE_TYPES,
    subjective: SUBJECTIVE_TYPES,
  }
}
