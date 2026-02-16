import { jsPDF } from 'jspdf'

interface ExamPDFOptions {
  filename?: string
  includeAnswerKey?: boolean
}

interface Question {
  question?: string
  instruction?: string
  passage?: string
  statement?: string
  prompt?: string
  options?: string[]
  answer?: string
  sample_answer?: string
  marks?: number
  difficulty?: string
  bloom_level?: string
  column_a?: any[]
  column_b?: any[]
  sentences?: string[]
  words?: string[]
  word_bank?: string[]
  sub_questions?: any[]
  correct_order?: string[]
}

export async function generateExamPDF(
  exam: any,
  selectedQuestions: Set<string>,
  options: ExamPDFOptions = {}
): Promise<void> {
  const {
    filename = `exam_${new Date().toISOString().split('T')[0]}.pdf`
  } = options

  try {
    console.log('📄 Starting PDF generation with jsPDF...')

    const doc = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4'
    })

    const pageWidth = 210 // A4 width in mm
    const pageHeight = 297 // A4 height in mm
    const margin = 20
    const contentWidth = pageWidth - (2 * margin)
    let yPos = margin

    // Helper function to add new page if needed
    const checkPageBreak = (neededSpace: number) => {
      if (yPos + neededSpace > pageHeight - margin) {
        doc.addPage()
        yPos = margin
        return true
      }
      return false
    }

    // Helper function to wrap text
    const wrapText = (text: string, maxWidth: number) => {
      return doc.splitTextToSize(text, maxWidth)
    }

    // PAGE 1: COVER PAGE
    // School header
    doc.setFontSize(20)
    doc.setFont('helvetica', 'bold')
    doc.text('ARMY PUBLIC SCHOOL (APS)', pageWidth / 2, yPos, { align: 'center' })
    yPos += 10

    doc.setFontSize(14)
    doc.text('EXAMINATION PAPER', pageWidth / 2, yPos, { align: 'center' })
    yPos += 3

    // Header line
    doc.setLineWidth(1)
    doc.line(margin, yPos, pageWidth - margin, yPos)
    yPos += 15

    // Exam info table
    doc.setFontSize(11)
    doc.setFont('helvetica', 'bold')
    doc.text('Subject:', margin, yPos)
    doc.setFont('helvetica', 'normal')
    doc.text(exam.subject, margin + 40, yPos)
    yPos += 8

    doc.setFont('helvetica', 'bold')
    doc.text('Grade/Class:', margin, yPos)
    doc.setFont('helvetica', 'normal')
    doc.text(exam.grade, margin + 40, yPos)
    yPos += 8

    // Calculate total marks
    let totalMarks = 0
    selectedQuestions.forEach(id => {
      const [category, type, index] = id.split('-')
      const questions = category === 'obj'
        ? exam.exam_content?.objective?.[type]
        : exam.exam_content?.subjective?.[type]
      const questionArray = Array.isArray(questions) ? questions : []
      if (questionArray && questionArray[parseInt(index)]) {
        totalMarks += questionArray[parseInt(index)].marks || 0
      }
    })

    doc.setFont('helvetica', 'bold')
    doc.text('Total Marks:', margin, yPos)
    doc.setFont('helvetica', 'normal')
    doc.text(totalMarks.toString(), margin + 40, yPos)
    yPos += 8

    doc.setFont('helvetica', 'bold')
    doc.text('Total Questions:', margin, yPos)
    doc.setFont('helvetica', 'normal')
    doc.text(selectedQuestions.size.toString(), margin + 40, yPos)
    yPos += 8

    doc.setFont('helvetica', 'bold')
    doc.text('Date:', margin, yPos)
    doc.setFont('helvetica', 'normal')
    doc.setLineWidth(0.2)
    doc.line(margin + 40, yPos + 1, margin + 100, yPos + 1)
    yPos += 15

    // Student info
    doc.setFontSize(12)
    doc.setFont('helvetica', 'bold')
    doc.text('STUDENT INFORMATION:', margin, yPos)
    yPos += 8

    doc.setFontSize(11)
    doc.text('Name:', margin, yPos)
    doc.setLineWidth(0.2)
    doc.line(margin + 30, yPos + 1, pageWidth - margin - 80, yPos + 1)
    doc.text('Section:', pageWidth - margin - 70, yPos)
    doc.line(pageWidth - margin - 40, yPos + 1, pageWidth - margin, yPos + 1)
    yPos += 15

    // Instructions
    doc.setFontSize(10)
    doc.setFont('helvetica', 'italic')
    const instructions = 'INSTRUCTIONS: Read all questions carefully. Write your answers neatly. Check your work before submitting.'
    const wrappedInstructions = wrapText(instructions, contentWidth - 10)
    doc.rect(margin, yPos, contentWidth, 15)
    doc.text(wrappedInstructions, pageWidth / 2, yPos + 8, { align: 'center' })

    // PAGE 2+: OBJECTIVE QUESTIONS
    doc.addPage()
    yPos = margin

    doc.setFontSize(16)
    doc.setFont('helvetica', 'bold')
    doc.text('SECTION A: OBJECTIVE QUESTIONS', pageWidth / 2, yPos, { align: 'center' })
    yPos += 12

    if (exam.exam_content?.objective) {
      for (const [typeId, questions] of Object.entries(exam.exam_content.objective)) {
        const questionArray = Array.isArray(questions) ? questions : []
        const filteredQuestions = questionArray.filter((_, idx) =>
          selectedQuestions.has(`obj-${typeId}-${idx}`)
        )

        if (filteredQuestions.length === 0) continue

        checkPageBreak(20)

        // Question type header
        doc.setFontSize(13)
        doc.setFont('helvetica', 'bold')
        const typeLabel = typeId.split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')
        doc.text(typeLabel, margin, yPos)
        yPos += 2
        doc.setLineWidth(0.5)
        doc.line(margin, yPos, pageWidth - margin, yPos)
        yPos += 8

        // Questions
        questionArray.forEach((question: Question, idx: number) => {
          const questionId = `obj-${typeId}-${idx}`
          if (!selectedQuestions.has(questionId)) return

          checkPageBreak(35)

          doc.setFontSize(11)
          doc.setFont('helvetica', 'bold')

          // Handle different question structures
          let questionText = `Q${idx + 1}. `
          if (question.question) {
            questionText += question.question
          } else if (question.statement) {
            questionText += question.statement
          } else if (question.instruction) {
            questionText += question.instruction
          } else if (question.passage) {
            questionText += 'Read the passage carefully and answer the questions.'
          } else if (question.prompt) {
            questionText += question.prompt
          } else {
            questionText += '[Question content]'
          }
          questionText += ` (${question.marks || 0} marks)`

          const wrappedQuestion = wrapText(questionText, contentWidth)
          doc.text(wrappedQuestion, margin, yPos)
          yPos += wrappedQuestion.length * 5

          // Options (for MCQs)
          if (question.options) {
            doc.setFont('helvetica', 'normal')
            doc.setFontSize(10)
            question.options.forEach((option: string, optIdx: number) => {
              const optionText = `${String.fromCharCode(65 + optIdx)}) ${option}`
              const wrappedOption = wrapText(optionText, contentWidth - 10)
              doc.text(wrappedOption, margin + 5, yPos)
              yPos += wrappedOption.length * 5
            })
            // MCQs don't need answer line - students circle the option
            yPos += 5
          } else {
            // For fill_in_blanks and other types, add clear answer space
            yPos += 5
            doc.setFont('helvetica', 'italic')
            doc.setFontSize(9)
            doc.text('Answer:', margin, yPos)
            yPos += 1
            doc.setLineWidth(0.3)
            doc.line(margin + 20, yPos, margin + 100, yPos)
            yPos += 10
          }
        })

        yPos += 5
      }
    }

    // SUBJECTIVE QUESTIONS - Start on new page
    doc.addPage()
    yPos = margin

    doc.setFontSize(16)
    doc.setFont('helvetica', 'bold')
    doc.text('SECTION B: SUBJECTIVE QUESTIONS', pageWidth / 2, yPos, { align: 'center' })
    yPos += 12

    if (exam.exam_content?.subjective) {
      for (const [typeId, questions] of Object.entries(exam.exam_content.subjective)) {
        const questionArray = Array.isArray(questions) ? questions : []
        const filteredQuestions = questionArray.filter((_, idx) =>
          selectedQuestions.has(`subj-${typeId}-${idx}`)
        )

        if (filteredQuestions.length === 0) continue

        checkPageBreak(20)

        // Question type header
        doc.setFontSize(13)
        doc.setFont('helvetica', 'bold')
        const typeLabel = typeId.split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')
        doc.text(typeLabel, margin, yPos)
        yPos += 2
        doc.setLineWidth(0.5)
        doc.line(margin, yPos, pageWidth - margin, yPos)
        yPos += 8

        // Questions
        questionArray.forEach((question: Question, idx: number) => {
          const questionId = `subj-${typeId}-${idx}`
          if (!selectedQuestions.has(questionId)) return

          checkPageBreak(40)

          doc.setFontSize(11)
          doc.setFont('helvetica', 'bold')

          // Handle different question structures
          let questionText = `Q${idx + 1}. `
          if (question.question) {
            questionText += question.question
          } else if (question.statement) {
            questionText += question.statement
          } else if (question.instruction) {
            questionText += question.instruction
          } else if (question.passage) {
            questionText += 'Read the passage carefully and answer the questions.'
          } else if (question.prompt) {
            questionText += question.prompt
          } else {
            questionText += '[Question content]'
          }
          questionText += ` (${question.marks || 0} marks)`

          const wrappedQuestion = wrapText(questionText, contentWidth)
          doc.text(wrappedQuestion, margin, yPos)
          yPos += wrappedQuestion.length * 5 + 5

          // Answer lines
          for (let i = 0; i < 3; i++) {
            doc.setLineWidth(0.2)
            doc.line(margin, yPos, pageWidth - margin, yPos)
            yPos += 8
          }
          yPos += 5
        })

        yPos += 5
      }
    }

    // ANSWER KEY
    doc.addPage()
    yPos = margin

    doc.setFontSize(18)
    doc.setFont('helvetica', 'bold')
    doc.text('ANSWER KEY / RUBRIC', pageWidth / 2, yPos, { align: 'center' })
    yPos += 5
    doc.setLineWidth(0.5)
    doc.line(margin + 30, yPos, pageWidth - margin - 30, yPos)
    yPos += 10

    doc.setFontSize(10)
    doc.setFont('helvetica', 'normal')
    doc.text(`Subject: ${exam.subject}  |  Grade: ${exam.grade}  |  Generated: ${new Date().toLocaleDateString()}`, pageWidth / 2, yPos, { align: 'center' })
    yPos += 12

    // Objective answers
    if (exam.exam_content?.objective) {
      doc.setFontSize(14)
      doc.setFont('helvetica', 'bold')
      doc.text('Objective Questions', margin, yPos)
      yPos += 8

      for (const [typeId, questions] of Object.entries(exam.exam_content.objective)) {
        const questionArray = Array.isArray(questions) ? questions : []
        const filteredQuestions = questionArray.filter((_, idx) =>
          selectedQuestions.has(`obj-${typeId}-${idx}`)
        )

        if (filteredQuestions.length === 0) continue

        checkPageBreak(15)

        doc.setFontSize(12)
        doc.setFont('helvetica', 'bold')
        const typeLabel = typeId.split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')
        doc.text(typeLabel, margin, yPos)
        yPos += 6

        questionArray.forEach((question: Question, idx: number) => {
          if (!selectedQuestions.has(`obj-${typeId}-${idx}`)) return

          checkPageBreak(15)

          doc.setFontSize(10)
          doc.setFont('helvetica', 'bold')
          doc.text(`Q${idx + 1}:`, margin + 2, yPos)
          doc.setFont('helvetica', 'normal')

          const answerText = `Answer: ${question.answer || 'N/A'}  (${question.marks} marks)`
          const wrappedAnswer = wrapText(answerText, contentWidth - 15)
          doc.text(wrappedAnswer, margin + 12, yPos)
          yPos += wrappedAnswer.length * 5 + 3
        })
        yPos += 3
      }
    }

    // Subjective answers
    if (exam.exam_content?.subjective) {
      checkPageBreak(20)

      doc.setFontSize(14)
      doc.setFont('helvetica', 'bold')
      doc.text('Subjective Questions', margin, yPos)
      yPos += 8

      for (const [typeId, questions] of Object.entries(exam.exam_content.subjective)) {
        const questionArray = Array.isArray(questions) ? questions : []
        const filteredQuestions = questionArray.filter((_, idx) =>
          selectedQuestions.has(`subj-${typeId}-${idx}`)
        )

        if (filteredQuestions.length === 0) continue

        checkPageBreak(15)

        doc.setFontSize(12)
        doc.setFont('helvetica', 'bold')
        const typeLabel = typeId.split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')
        doc.text(typeLabel, margin, yPos)
        yPos += 6

        questionArray.forEach((question: Question, idx: number) => {
          if (!selectedQuestions.has(`subj-${typeId}-${idx}`)) return

          const answer = question.sample_answer || question.answer || 'N/A'
          const wrappedAnswer = wrapText(`Sample Answer: ${answer}`, contentWidth - 10)

          // Calculate needed space
          const neededSpace = 10 + (wrappedAnswer.length * 5)
          checkPageBreak(neededSpace)

          doc.setFontSize(10)
          doc.setFont('helvetica', 'bold')
          doc.text(`Q${idx + 1}:`, margin + 2, yPos)
          yPos += 5

          doc.setFont('helvetica', 'normal')
          doc.text(wrappedAnswer, margin + 2, yPos)
          yPos += wrappedAnswer.length * 5 + 2

          doc.setFont('helvetica', 'italic')
          doc.setFontSize(9)
          doc.text(`Marks: ${question.marks}`, margin + 2, yPos)
          yPos += 8
        })
        yPos += 3
      }
    }

    // Save the PDF
    doc.save(filename)
    console.log('✅ PDF generated successfully:', filename)
  } catch (error) {
    console.error('❌ PDF generation failed:', error)
    throw new Error('Failed to generate PDF. Please try again.')
  }
}
