import api from './api'
import type { ExamRequest, ExamResponse } from '../types'

export async function generateExam(request: ExamRequest): Promise<ExamResponse> {
  const { data } = await api.post<ExamResponse>('/generate-exam-questions', request)
  return data
}

export interface ExamHistoryItem {
  exam_id: string
  subject: string
  grade: string
  created_at: string
  total_marks: number
  total_questions: number
  objective_questions_count: number
  subjective_questions_count: number
  course_page_range?: string
  activity_page_range?: string
}

export interface ExamHistoryResponse {
  success: boolean
  user_id?: string
  total_exams: number
  exams: ExamHistoryItem[]
  error?: string
}

export async function getMyExams(): Promise<ExamHistoryResponse> {
  try {
    const { data } = await api.get<ExamHistoryResponse>('/get-my-exams')
    return data
  } catch (error: any) {
    console.error('Error fetching exam history:', error)
    return {
      success: false,
      total_exams: 0,
      exams: [],
      error: error.response?.data?.detail || error.message || 'Failed to fetch exam history'
    }
  }
}

export interface ExamDetailResponse {
  success: boolean
  exam?: {
    exam_id: string
    subject: string
    grade: string
    created_at: string
    total_marks: number
    total_questions: number
    objective_questions_count: number
    subjective_questions_count: number
    course_page_range?: string
    activity_page_range?: string
    exam_content: {
      objective?: Record<string, any[]>
      subjective?: Record<string, any[]>
    }
    metadata?: Record<string, any>
  }
  error?: string
}

export async function getExamById(exam_id: string): Promise<ExamDetailResponse> {
  try {
    const { data } = await api.get<ExamDetailResponse>(`/get-exam/${exam_id}`)
    return data
  } catch (error: any) {
    console.error(`Error fetching exam ${exam_id}:`, error)
    return {
      success: false,
      error: error.response?.data?.detail || error.message || 'Failed to fetch exam details'
    }
  }
}
