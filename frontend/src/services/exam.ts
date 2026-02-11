import api from './api'
import type { ExamRequest, ExamResponse } from '../types'

export async function generateExam(request: ExamRequest): Promise<ExamResponse> {
  const { data } = await api.post<ExamResponse>('/generate-exam-questions', request)
  return data
}
