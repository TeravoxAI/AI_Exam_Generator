import { jsPDF } from 'jspdf'

interface ExamPDFOptions {
  filename?: string
  includeAnswerKey?: boolean
}

// Roman numerals for sub-parts
const toRoman = (n: number): string => {
  const nums = ['i','ii','iii','iv','v','vi','vii','viii','ix','x',
                'xi','xii','xiii','xiv','xv','xvi','xvii','xviii','xix','xx']
  return n >= 1 && n <= 20 ? nums[n - 1] : String(n)
}

// Human-readable labels for question types
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
}

// Default instructions per type
const TYPE_INSTRUCTIONS: Record<string, string> = {
  mcq: 'Choose the correct answer.',
  true_false: 'Write True (T) or False (F) in the space provided.',
  fill_in_blanks: 'Fill in the blanks with the correct word or phrase.',
  match_columns: 'Match Column A with the correct option in Column B.',
  circle_correct_answer: 'Circle the correct answer.',
  rearrange_sentences: 'Arrange the sentences in the correct order.',
  unseen_comprehension_objective: 'Read the passage carefully and answer the questions.',
  short_answer: 'Answer the following questions briefly.',
  complete_sentences: 'Complete the following sentences using the words given.',
  make_sentences: 'Use each of the following words to make your own sentence.',
  long_answer: 'Answer the following questions in detail.',
  unseen_creative_writing: 'Write on the following topic.',
  picture_description: 'Look at the picture and write a description.',
  unseen_comprehension_subjective: 'Read the passage carefully and answer the questions.',
  fill_in_blanks_from_word_bank: 'Fill in the blanks using words from the word bank.',
  short_practice_questions_missing_solution: 'Complete the following solutions.',
  label_figures: 'Label the parts of the following figures.',
  practice_questions_by_topic: 'Solve the following questions.',
  real_life_story_problems: 'Read and solve the following problems.',
}

export async function generateExamPDF(
  exam: any,
  selectedQuestions: Set<string>,
  options: ExamPDFOptions = {},
  questionImages: Record<string, string> = {}
): Promise<void> {
  const { filename = `exam_${new Date().toISOString().split('T')[0]}.pdf` } = options

  try {
    const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' })
    const pageWidth = 210
    const pageHeight = 297
    const margin = 20
    const contentWidth = pageWidth - 2 * margin
    let yPos = margin

    const checkPageBreak = (neededSpace: number) => {
      if (yPos + neededSpace > pageHeight - margin) {
        doc.addPage()
        yPos = margin
        return true
      }
      return false
    }

    const wrap = (text: string, maxWidth: number): string[] =>
      doc.splitTextToSize(String(text || ''), maxWidth)

    // ───────────────────────────────────────────────
    // CALCULATE TOTAL MARKS
    // ───────────────────────────────────────────────
    let totalMarks = 0
    selectedQuestions.forEach(id => {
      const parts = id.split('-')
      const category = parts[0]
      const type = parts.slice(1, -1).join('-')
      const index = parseInt(parts[parts.length - 1])
      const questions = category === 'obj'
        ? exam.exam_content?.objective?.[type]
        : exam.exam_content?.subjective?.[type]
      const q = Array.isArray(questions) ? questions[index] : null
      if (q) totalMarks += q.marks || 0
    })

    // ───────────────────────────────────────────────
    // COVER PAGE
    // ───────────────────────────────────────────────
    // School header
    doc.setFontSize(18)
    doc.setFont('helvetica', 'bold')
    doc.text('ARMY PUBLIC SCHOOL (APS)', pageWidth / 2, yPos, { align: 'center' })
    yPos += 8

    doc.setFontSize(12)
    doc.text('EXAMINATION PAPER', pageWidth / 2, yPos, { align: 'center' })
    yPos += 4

    doc.setLineWidth(1)
    doc.line(margin, yPos, pageWidth - margin, yPos)
    yPos += 7

    // Exam info row
    doc.setFontSize(10)
    doc.setFont('helvetica', 'bold')
    doc.text('Subject:', margin, yPos)
    doc.setFont('helvetica', 'normal')
    doc.text(exam.subject || '', margin + 18, yPos)

    doc.setFont('helvetica', 'bold')
    doc.text('Class:', margin + 80, yPos)
    doc.setFont('helvetica', 'normal')
    doc.text(String(exam.grade || ''), margin + 94, yPos)

    doc.setFont('helvetica', 'bold')
    doc.text('Total Marks:', margin + 120, yPos)
    doc.setFont('helvetica', 'normal')
    doc.text(String(totalMarks), margin + 148, yPos)
    yPos += 7

    // Date / Time row
    doc.setFont('helvetica', 'bold')
    doc.text('Date:', margin, yPos)
    doc.setLineWidth(0.2)
    doc.line(margin + 14, yPos + 1, margin + 70, yPos + 1)
    doc.setFont('helvetica', 'bold')
    doc.text('Time Allowed:', margin + 80, yPos)
    doc.line(margin + 113, yPos + 1, margin + 160, yPos + 1)
    yPos += 9

    // Student information box
    doc.setLineWidth(0.8)
    const boxH = 24
    doc.rect(margin, yPos, contentWidth, boxH)
    doc.setFontSize(10)
    doc.setFont('helvetica', 'bold')
    doc.text('STUDENT INFORMATION', margin + 3, yPos + 6)
    doc.setLineWidth(0.2)

    // Name
    doc.setFont('helvetica', 'bold')
    doc.text('Name:', margin + 3, yPos + 14)
    doc.setFont('helvetica', 'normal')
    doc.line(margin + 20, yPos + 15, margin + contentWidth / 2 - 5, yPos + 15)

    // Roll No
    doc.setFont('helvetica', 'bold')
    doc.text('Roll No:', margin + contentWidth / 2, yPos + 14)
    doc.setFont('helvetica', 'normal')
    doc.line(margin + contentWidth / 2 + 18, yPos + 15, margin + contentWidth - 3, yPos + 15)

    // Section
    doc.setFont('helvetica', 'bold')
    doc.text('Section:', margin + 3, yPos + 22)
    doc.setFont('helvetica', 'normal')
    doc.line(margin + 21, yPos + 23, margin + 80, yPos + 23)

    yPos += boxH + 6

    // Instructions box
    doc.setLineWidth(0.6)
    doc.rect(margin, yPos, contentWidth, 14)
    doc.setFontSize(9)
    doc.setFont('helvetica', 'bold')
    doc.text('INSTRUCTIONS: ', margin + 3, yPos + 6)
    doc.setFont('helvetica', 'normal')
    doc.text(
      'Read all questions carefully. Write your answers neatly. Check your work before submitting.',
      margin + 33, yPos + 6
    )
    yPos += 18

    // Separator
    doc.setLineWidth(0.8)
    doc.line(margin, yPos, pageWidth - margin, yPos)
    yPos += 8

    // ───────────────────────────────────────────────
    // QUESTION RENDERING HELPERS
    // ───────────────────────────────────────────────
    let questionNum = 0

    // Draw a question group header (Q1. True / False  (5 marks))
    const addGroupHeader = (typeId: string, totalTypeMarks: number) => {
      questionNum++
      checkPageBreak(16)
      const label = TYPE_LABELS[typeId] || typeId.split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')
      const instruction = TYPE_INSTRUCTIONS[typeId] || ''
      doc.setFontSize(12)
      doc.setFont('helvetica', 'bold')
      doc.text(`Q${questionNum}.  ${label}`, margin, yPos)
      doc.setFont('helvetica', 'normal')
      doc.setFontSize(10)
      const marksText = `(${totalTypeMarks} marks)`
      doc.text(marksText, pageWidth - margin, yPos, { align: 'right' })
      yPos += 5
      if (instruction) {
        doc.setFontSize(9)
        doc.setFont('helvetica', 'italic')
        doc.text(instruction, margin + 5, yPos)
        yPos += 5
      }
      doc.setLineWidth(0.4)
      doc.line(margin, yPos, pageWidth - margin, yPos)
      yPos += 6
    }

    // Render a passage block
    const addPassage = (passage: string) => {
      if (!passage) return
      checkPageBreak(20)
      doc.setFontSize(9)
      doc.setFont('helvetica', 'bold')
      doc.text('Passage:', margin + 5, yPos)
      yPos += 4

      doc.setFont('helvetica', 'normal')
      const lines = wrap(passage, contentWidth - 14)
      const passageBoxH = lines.length * 4.5 + 8
      checkPageBreak(passageBoxH + 4)
      doc.setLineWidth(0.3)
      doc.rect(margin + 5, yPos, contentWidth - 10, passageBoxH)
      doc.setFontSize(9)
      lines.forEach((line: string, i: number) => {
        doc.text(line, margin + 8, yPos + 5 + i * 4.5)
      })
      yPos += passageBoxH + 6
    }

    // Render True/False sub-item (statement on left, T [] F [] on right)
    const addTrueFalseItem = (statement: string, subIdx: number) => {
      checkPageBreak(10)
      const prefix = `(${toRoman(subIdx + 1)})  `
      const stmtLines = wrap(prefix + statement, contentWidth - 28)
      doc.setFontSize(10)
      doc.setFont('helvetica', 'normal')
      stmtLines.forEach((line: string, i: number) => {
        doc.text(line, margin + 5, yPos + i * 5)
      })
      // T / F boxes on right
      const boxY = yPos - 1
      doc.setLineWidth(0.3)
      doc.text('T', pageWidth - margin - 22, yPos)
      doc.rect(pageWidth - margin - 20, boxY, 6, 5)
      doc.text('F', pageWidth - margin - 11, yPos)
      doc.rect(pageWidth - margin - 9, boxY, 6, 5)
      yPos += stmtLines.length * 5 + 3
    }

    // Render MCQ/Circle sub-item
    const addMCQItem = (question: any, subIdx: number) => {
      checkPageBreak(25)
      const prefix = `(${toRoman(subIdx + 1)})  `
      const qText = question.question || question.statement || ''
      const qLines = wrap(prefix + qText, contentWidth - 10)
      doc.setFontSize(10)
      doc.setFont('helvetica', 'normal')
      qLines.forEach((line: string, i: number) => {
        doc.text(line, margin + 5, yPos + i * 5)
      })
      yPos += qLines.length * 5 + 2

      if (question.options) {
        doc.setFontSize(9)
        const optLabels = ['a)', 'b)', 'c)', 'd)']
        const colW = contentWidth / 2
        question.options.forEach((opt: string, oi: number) => {
          const col = oi % 2
          const xPos = margin + 10 + col * colW
          if (col === 0 && oi > 0) yPos += 5
          const optText = `${optLabels[oi]} ${opt}`
          const optLines = wrap(optText, colW - 5)
          optLines.forEach((line: string, li: number) => {
            doc.text(line, xPos, yPos + li * 4.5)
          })
          if (col === 1 || oi === question.options.length - 1) {
            // will increment yPos after the pair
          }
        })
        yPos += 6
      }
      yPos += 3
    }

    // Render Fill in Blanks sub-item (no separate answer line)
    const addFillInBlanksItem = (question: any, subIdx: number) => {
      checkPageBreak(10)
      const prefix = `(${toRoman(subIdx + 1)})  `
      const qText = question.question || ''
      const qLines = wrap(prefix + qText, contentWidth - 10)
      doc.setFontSize(10)
      doc.setFont('helvetica', 'normal')
      qLines.forEach((line: string, i: number) => {
        doc.text(line, margin + 5, yPos + i * 5)
      })
      yPos += qLines.length * 5 + 5
    }

    // Render Match Columns group (single question with two-column table)
    const addMatchColumnsItem = (question: any, subIdx: number) => {
      const colA: string[] = question.column_a || []
      const colB: string[] = question.column_b || []
      const rows = Math.max(colA.length, colB.length)
      const rowH = 7
      const neededH = rows * rowH + 20
      checkPageBreak(neededH)

      const prefix = `(${toRoman(subIdx + 1)})  `
      const instrText = question.instruction || 'Match the items in Column A with Column B.'
      const instrLines = wrap(prefix + instrText, contentWidth - 10)
      doc.setFontSize(10)
      doc.setFont('helvetica', 'italic')
      instrLines.forEach((line: string, i: number) => {
        doc.text(line, margin + 5, yPos + i * 5)
      })
      yPos += instrLines.length * 5 + 4

      // Table headers
      const tableLeft = margin + 5
      const colAWidth = contentWidth / 2 - 5
      const colBWidth = contentWidth / 2 - 5
      const colBLeft = tableLeft + colAWidth + 8

      doc.setFont('helvetica', 'bold')
      doc.setFontSize(10)
      doc.text('Column A', tableLeft + colAWidth / 2, yPos, { align: 'center' })
      doc.text('Column B', colBLeft + colBWidth / 2, yPos, { align: 'center' })
      yPos += 3
      doc.setLineWidth(0.4)
      doc.line(tableLeft, yPos, tableLeft + colAWidth, yPos)
      doc.line(colBLeft, yPos, colBLeft + colBWidth, yPos)
      yPos += 5

      // Table rows
      doc.setFont('helvetica', 'normal')
      doc.setFontSize(9)
      for (let r = 0; r < rows; r++) {
        checkPageBreak(rowH + 2)
        const aItem = colA[r] ? String(colA[r]) : ''
        const bItem = colB[r] ? String(colB[r]) : ''
        const aLines = wrap(aItem, colAWidth - 3)
        const bLines = wrap(bItem, colBWidth - 3)
        aLines.forEach((line: string, li: number) => doc.text(line, tableLeft, yPos + li * 4))
        bLines.forEach((line: string, li: number) => doc.text(line, colBLeft, yPos + li * 4))
        yPos += Math.max(aLines.length, bLines.length) * 4 + 3
      }
      yPos += 4
    }

    // Render Comprehension group (passage + sub-questions)
    const addComprehensionGroup = (questions: any[], typeId: string) => {
      questions.forEach((question) => {
        checkPageBreak(30)

        // Show passage
        addPassage(question.passage || '')

        // Sub-questions
        const subQs = question.sub_questions || []
        subQs.forEach((subQ: any, subIdx: number) => {
          checkPageBreak(12)
          const prefix = `(${toRoman(subIdx + 1)})  `
          const qText = subQ.question || subQ.statement || ''
          const qLines = wrap(prefix + qText, contentWidth - 10)
          doc.setFontSize(10)
          doc.setFont('helvetica', 'normal')
          qLines.forEach((line: string, i: number) => {
            doc.text(line, margin + 5, yPos + i * 5)
          })
          yPos += qLines.length * 5 + 2

          // MCQ options for objective comprehension
          if (subQ.options) {
            doc.setFontSize(9)
            const optLabels = ['a)', 'b)', 'c)', 'd)']
            const colW = contentWidth / 2
            subQ.options.forEach((opt: string, oi: number) => {
              const col = oi % 2
              const xPos = margin + 12 + col * colW
              if (col === 0 && oi > 0) yPos += 5
              doc.text(`${optLabels[oi]} ${opt}`, xPos, yPos)
            })
            yPos += 8
          }

          // Answer lines for subjective comprehension
          if (typeId === 'unseen_comprehension_subjective') {
            const lineCount = Math.ceil((subQ.marks || 1) * 1.5)
            for (let l = 0; l < Math.min(lineCount, 4); l++) {
              doc.setLineWidth(0.2)
              doc.line(margin + 5, yPos, pageWidth - margin - 5, yPos)
              yPos += 6
            }
          }
          yPos += 2
        })
      })
    }

    // Render Make Sentences sub-item
    const addMakeSentencesItem = (wordItem: any, subIdx: number) => {
      checkPageBreak(12)
      const isObj = typeof wordItem === 'object' && wordItem !== null
      const word = isObj ? (wordItem.word || '') : String(wordItem || '')
      const prefix = `(${toRoman(subIdx + 1)})  `
      doc.setFontSize(10)
      doc.setFont('helvetica', 'bold')
      doc.text(`${prefix}${word}:`, margin + 5, yPos)
      doc.setFont('helvetica', 'normal')
      doc.setLineWidth(0.2)
      doc.line(margin + 5 + doc.getTextWidth(`${prefix}${word}:`) + 4, yPos + 1, pageWidth - margin - 5, yPos + 1)
      yPos += 9
    }

    // Render short/long answer sub-item
    const addAnswerLinesItem = (question: any, subIdx: number, lineCount = 3) => {
      checkPageBreak(lineCount * 7 + 15)
      const prefix = `(${toRoman(subIdx + 1)})  `
      const qText = question.question || question.statement || ''
      const qLines = wrap(prefix + qText, contentWidth - 10)
      doc.setFontSize(10)
      doc.setFont('helvetica', 'normal')
      qLines.forEach((line: string, i: number) => {
        doc.text(line, margin + 5, yPos + i * 5)
      })
      yPos += qLines.length * 5 + 4
      for (let l = 0; l < lineCount; l++) {
        doc.setLineWidth(0.2)
        doc.line(margin + 5, yPos, pageWidth - margin - 5, yPos)
        yPos += 7
      }
      yPos += 3
    }

    // Render creative writing sub-item
    const addCreativeWritingItem = (question: any, subIdx: number) => {
      checkPageBreak(50)
      const prefix = `(${toRoman(subIdx + 1)})  `
      const promptText = question.prompt || question.instruction || ''
      const pLines = wrap(prefix + promptText, contentWidth - 10)
      doc.setFontSize(10)
      doc.setFont('helvetica', 'bold')
      pLines.forEach((line: string, i: number) => {
        doc.text(line, margin + 5, yPos + i * 5)
      })
      yPos += pLines.length * 5 + 5
      for (let l = 0; l < 6; l++) {
        doc.setLineWidth(0.2)
        doc.line(margin + 5, yPos, pageWidth - margin - 5, yPos)
        yPos += 8
      }
      yPos += 3
    }

    // Render picture description sub-item
    const addPictureDescriptionItem = (question: any, subIdx: number, imageData?: string) => {
      checkPageBreak(60)
      const prefix = `(${toRoman(subIdx + 1)})  `
      const desc = question.instruction || 'Look at the picture and describe it.'
      const dLines = wrap(prefix + desc, contentWidth - 10)
      doc.setFontSize(10)
      doc.setFont('helvetica', 'normal')
      dLines.forEach((line: string, i: number) => {
        doc.text(line, margin + 5, yPos + i * 5)
      })
      yPos += dLines.length * 5 + 4

      // Image or placeholder box
      const imgBoxW = 70
      const imgBoxH = 50
      const imgX = margin + (contentWidth - imgBoxW) / 2
      doc.setLineWidth(0.5)
      doc.rect(imgX, yPos, imgBoxW, imgBoxH)

      if (imageData) {
        try {
          doc.addImage(imageData, 'JPEG', imgX, yPos, imgBoxW, imgBoxH)
        } catch {
          // If image fails, show placeholder text
          doc.setFontSize(8)
          doc.setTextColor(150, 150, 150)
          doc.text('[Picture]', imgX + imgBoxW / 2, yPos + imgBoxH / 2, { align: 'center' })
          doc.setTextColor(0, 0, 0)
        }
      } else {
        doc.setFontSize(8)
        doc.setTextColor(150, 150, 150)
        doc.text('[Picture]', imgX + imgBoxW / 2, yPos + imgBoxH / 2, { align: 'center' })
        doc.setTextColor(0, 0, 0)
      }
      yPos += imgBoxH + 5

      // Answer lines
      for (let l = 0; l < 4; l++) {
        doc.setLineWidth(0.2)
        doc.line(margin + 5, yPos, pageWidth - margin - 5, yPos)
        yPos += 7
      }
      yPos += 3
    }

    // Render complete sentences sub-item
    const addCompleteSentencesItem = (sent: any, subIdx: number) => {
      checkPageBreak(10)
      const prefix = `(${toRoman(subIdx + 1)})  `
      const isObj = typeof sent === 'object' && sent !== null
      const text = isObj ? (sent.incomplete || sent.sentence || '') : String(sent || '')
      const qLines = wrap(prefix + text, contentWidth - 10)
      doc.setFontSize(10)
      doc.setFont('helvetica', 'normal')
      qLines.forEach((line: string, i: number) => {
        doc.text(line, margin + 5, yPos + i * 5)
      })
      yPos += qLines.length * 5 + 5
    }

    // Render rearrange sentences sub-item
    const addRearrangeSentencesItem = (question: any, subIdx: number) => {
      checkPageBreak(15)
      const prefix = `(${toRoman(subIdx + 1)})  `
      const instrText = question.instruction || 'Rearrange the following sentences:'
      const iLines = wrap(prefix + instrText, contentWidth - 10)
      doc.setFontSize(10)
      doc.setFont('helvetica', 'italic')
      iLines.forEach((line: string, i: number) => {
        doc.text(line, margin + 5, yPos + i * 5)
      })
      yPos += iLines.length * 5 + 3

      const sentences: string[] = question.sentences || []
      doc.setFont('helvetica', 'normal')
      doc.setFontSize(9)
      sentences.forEach((sentence, si) => {
        checkPageBreak(6)
        const sLines = wrap(`${si + 1}. ${sentence}`, contentWidth - 15)
        sLines.forEach((line: string, li: number) => {
          doc.text(line, margin + 10, yPos + li * 4.5)
        })
        yPos += sLines.length * 4.5 + 2
      })
      yPos += 3
    }

    // Short practice questions (math)
    const addShortPracticeItem = (question: any, subIdx: number) => {
      checkPageBreak(20)
      const prefix = `(${toRoman(subIdx + 1)})  `
      const qText = question.question || ''
      const qLines = wrap(prefix + qText, contentWidth - 10)
      doc.setFontSize(10)
      doc.setFont('helvetica', 'normal')
      qLines.forEach((line: string, i: number) => {
        doc.text(line, margin + 5, yPos + i * 5)
      })
      yPos += qLines.length * 5 + 3

      if (question.partial_solution) {
        doc.setFontSize(9)
        doc.setFont('helvetica', 'italic')
        const pLines = wrap(question.partial_solution, contentWidth - 15)
        pLines.forEach((line: string, i: number) => {
          doc.text(line, margin + 10, yPos + i * 4.5)
        })
        yPos += pLines.length * 4.5 + 2
      }
      doc.setLineWidth(0.2)
      doc.line(margin + 5, yPos, pageWidth - margin - 5, yPos)
      yPos += 8
    }

    // Helper: get total marks for a filtered set of questions in a type
    const getTypeTotalMarks = (questions: any[], typeId: string, category: string): number => {
      return questions.reduce((sum, q, idx) => {
        const id = `${category === 'obj' ? 'obj' : 'subj'}-${typeId}-${idx}`
        if (!selectedQuestions.has(id)) return sum
        // For questions with sub_questions, sum their marks
        if (q.sub_questions) {
          return sum + (q.sub_questions || []).reduce((s: number, sq: any) => s + (sq.marks || 0), 0)
        }
        return sum + (q.marks || 0)
      }, 0)
    }

    // ───────────────────────────────────────────────
    // SECTION A: OBJECTIVE QUESTIONS
    // ───────────────────────────────────────────────
    if (exam.exam_content?.objective) {
      const hasObjective = Object.entries(exam.exam_content.objective as Record<string, any>).some(([typeId, questions]) => {
        const arr = Array.isArray(questions) ? questions : []
        return arr.some((_, idx) => selectedQuestions.has(`obj-${typeId}-${idx}`))
      })

      if (hasObjective) {
        checkPageBreak(14)
        doc.setFontSize(13)
        doc.setFont('helvetica', 'bold')
        doc.text('SECTION A: OBJECTIVE QUESTIONS', pageWidth / 2, yPos, { align: 'center' })
        yPos += 4
        doc.setLineWidth(0.6)
        doc.line(margin, yPos, pageWidth - margin, yPos)
        yPos += 8
      }

      for (const [typeId, rawQuestions] of Object.entries(exam.exam_content.objective as Record<string, any>)) {
        const questionArray: any[] = Array.isArray(rawQuestions) ? rawQuestions : []
        const filteredIndices = questionArray
          .map((_, idx) => idx)
          .filter(idx => selectedQuestions.has(`obj-${typeId}-${idx}`))

        if (filteredIndices.length === 0) continue

        const filteredQs = filteredIndices.map(i => questionArray[i])
        const typeMarks = getTypeTotalMarks(questionArray, typeId, 'obj')

        // Special handling: comprehension handled differently
        if (typeId === 'unseen_comprehension_objective') {
          addGroupHeader(typeId, typeMarks)
          addComprehensionGroup(filteredQs, typeId)
          continue
        }

        // Special handling: match_columns rendered per question as full table
        if (typeId === 'match_columns') {
          addGroupHeader(typeId, typeMarks)
          filteredQs.forEach((q, subIdx) => addMatchColumnsItem(q, subIdx))
          continue
        }

        // Special handling: rearrange_sentences
        if (typeId === 'rearrange_sentences') {
          addGroupHeader(typeId, typeMarks)
          filteredQs.forEach((q, subIdx) => addRearrangeSentencesItem(q, subIdx))
          continue
        }

        addGroupHeader(typeId, typeMarks)

        filteredQs.forEach((question, subIdx) => {
          switch (typeId) {
            case 'true_false':
              addTrueFalseItem(question.statement || question.question || '', subIdx)
              break
            case 'fill_in_blanks':
              addFillInBlanksItem(question, subIdx)
              break
            case 'mcq':
            case 'circle_correct_answer':
              addMCQItem(question, subIdx)
              break
            case 'fill_in_blanks_from_word_bank':
              addFillInBlanksItem({ question: question.blanks_sentence }, subIdx)
              break
            case 'label_figures':
              addAnswerLinesItem({ question: question.instruction + (question.figure_description ? `\n${question.figure_description}` : '') }, subIdx, 2)
              break
            case 'short_practice_questions_missing_solution':
              addShortPracticeItem(question, subIdx)
              break
            default:
              addFillInBlanksItem(question, subIdx)
          }
        })

        yPos += 4
      }
    }

    // ───────────────────────────────────────────────
    // SECTION B: SUBJECTIVE QUESTIONS
    // ───────────────────────────────────────────────
    if (exam.exam_content?.subjective) {
      const hasSubjective = Object.entries(exam.exam_content.subjective as Record<string, any>).some(([typeId, questions]) => {
        const arr = Array.isArray(questions) ? questions : []
        return arr.some((_, idx) => selectedQuestions.has(`subj-${typeId}-${idx}`))
      })

      if (hasSubjective) {
        checkPageBreak(14)
        doc.setFontSize(13)
        doc.setFont('helvetica', 'bold')
        doc.text('SECTION B: SUBJECTIVE QUESTIONS', pageWidth / 2, yPos, { align: 'center' })
        yPos += 4
        doc.setLineWidth(0.6)
        doc.line(margin, yPos, pageWidth - margin, yPos)
        yPos += 8
      }

      for (const [typeId, rawQuestions] of Object.entries(exam.exam_content.subjective as Record<string, any>)) {
        const questionArray: any[] = Array.isArray(rawQuestions) ? rawQuestions : []
        const filteredIndices = questionArray
          .map((_, idx) => idx)
          .filter(idx => selectedQuestions.has(`subj-${typeId}-${idx}`))

        if (filteredIndices.length === 0) continue

        const filteredQs = filteredIndices.map(i => questionArray[i])
        const typeMarks = getTypeTotalMarks(questionArray, typeId, 'subj')

        // Comprehension subjective
        if (typeId === 'unseen_comprehension_subjective') {
          addGroupHeader(typeId, typeMarks)
          addComprehensionGroup(filteredQs, typeId)
          continue
        }

        addGroupHeader(typeId, typeMarks)

        filteredQs.forEach((question, subIdx) => {
          switch (typeId) {
            case 'make_sentences': {
              const words: any[] = question.words || []
              words.forEach((wordItem, wi) => addMakeSentencesItem(wordItem, wi))
              break
            }
            case 'complete_sentences': {
              // Show word bank first if available
              if (question.instruction) {
                checkPageBreak(8)
                const instLines = wrap(question.instruction, contentWidth - 10)
                doc.setFontSize(9)
                doc.setFont('helvetica', 'italic')
                instLines.forEach((line: string, i: number) => {
                  doc.text(line, margin + 5, yPos + i * 4.5)
                })
                yPos += instLines.length * 4.5 + 3
              }
              const sentences: any[] = question.sentences || []
              sentences.forEach((sent, si) => addCompleteSentencesItem(sent, si))
              break
            }
            case 'unseen_creative_writing':
              addCreativeWritingItem(question, subIdx)
              break
            case 'picture_description': {
              const imgId = `subj-picture_description-${filteredIndices[subIdx]}`
              addPictureDescriptionItem(question, subIdx, questionImages[imgId])
              break
            }
            case 'short_answer':
              addAnswerLinesItem(question, subIdx, 3)
              break
            case 'long_answer':
              addAnswerLinesItem(question, subIdx, 5)
              break
            case 'practice_questions_by_topic':
            case 'real_life_story_problems':
              addAnswerLinesItem(question, subIdx, 4)
              break
            default:
              addAnswerLinesItem(question, subIdx, 3)
          }
        })

        yPos += 4
      }
    }

    // ───────────────────────────────────────────────
    // ANSWER KEY (new page)
    // ───────────────────────────────────────────────
    if (options.includeAnswerKey !== false) {
      doc.addPage()
      yPos = margin

      doc.setFontSize(16)
      doc.setFont('helvetica', 'bold')
      doc.text('ANSWER KEY / MARKING SCHEME', pageWidth / 2, yPos, { align: 'center' })
      yPos += 5
      doc.setLineWidth(0.5)
      doc.line(margin + 20, yPos, pageWidth - margin - 20, yPos)
      yPos += 8

      doc.setFontSize(9)
      doc.setFont('helvetica', 'normal')
      doc.text(`Subject: ${exam.subject}  |  Grade: ${exam.grade}  |  Date: ${new Date().toLocaleDateString()}`, pageWidth / 2, yPos, { align: 'center' })
      yPos += 10

      let akQNum = 0
      const addAKGroupHeader = (typeId: string) => {
        akQNum++
        checkPageBreak(10)
        const label = TYPE_LABELS[typeId] || typeId
        doc.setFontSize(11)
        doc.setFont('helvetica', 'bold')
        doc.text(`Q${akQNum}. ${label}`, margin, yPos)
        yPos += 6
      }

      const renderAKAnswer = (answer: any): string => {
        if (!answer) return 'N/A'
        if (typeof answer === 'boolean') return answer ? 'True' : 'False'
        if (typeof answer === 'object' && !Array.isArray(answer)) {
          return Object.entries(answer).map(([k, v]) => `${k} → ${v}`).join(', ')
        }
        if (Array.isArray(answer)) return answer.join(', ')
        return String(answer)
      }

      // Objective answers
      if (exam.exam_content?.objective) {
        doc.setFontSize(12)
        doc.setFont('helvetica', 'bold')
        doc.text('Section A: Objective Questions', margin, yPos)
        yPos += 7

        for (const [typeId, rawQuestions] of Object.entries(exam.exam_content.objective as Record<string, any>)) {
          const questionArray: any[] = Array.isArray(rawQuestions) ? rawQuestions : []
          const filteredIndices = questionArray.map((_, i) => i).filter(i => selectedQuestions.has(`obj-${typeId}-${i}`))
          if (filteredIndices.length === 0) continue

          addAKGroupHeader(typeId)

          filteredIndices.forEach((qIdx, subIdx) => {
            const q = questionArray[qIdx]
            checkPageBreak(8)
            doc.setFontSize(9)
            doc.setFont('helvetica', 'normal')

            if (q.sub_questions) {
              q.sub_questions.forEach((sq: any, si: number) => {
                checkPageBreak(6)
                const ansText = `  (${toRoman(si + 1)}) ${renderAKAnswer(sq.answer)}  (${sq.marks || 0} marks)`
                doc.text(ansText, margin + 5, yPos)
                yPos += 5
              })
            } else {
              const ansText = `  (${toRoman(subIdx + 1)}) ${renderAKAnswer(q.answer)}  (${q.marks || 0} marks)`
              doc.text(ansText, margin + 5, yPos)
              yPos += 5
            }
          })
          yPos += 4
        }
      }

      // Subjective answers
      if (exam.exam_content?.subjective) {
        checkPageBreak(12)
        doc.setFontSize(12)
        doc.setFont('helvetica', 'bold')
        doc.text('Section B: Subjective Questions', margin, yPos)
        yPos += 7

        for (const [typeId, rawQuestions] of Object.entries(exam.exam_content.subjective as Record<string, any>)) {
          const questionArray: any[] = Array.isArray(rawQuestions) ? rawQuestions : []
          const filteredIndices = questionArray.map((_, i) => i).filter(i => selectedQuestions.has(`subj-${typeId}-${i}`))
          if (filteredIndices.length === 0) continue

          addAKGroupHeader(typeId)

          filteredIndices.forEach((qIdx, subIdx) => {
            const q = questionArray[qIdx]
            checkPageBreak(12)
            doc.setFontSize(9)
            doc.setFont('helvetica', 'normal')

            if (q.sub_questions) {
              q.sub_questions.forEach((sq: any, si: number) => {
                checkPageBreak(10)
                const ansLines = wrap(`  (${toRoman(si + 1)}) ${sq.answer || 'N/A'}  (${sq.marks || 0} marks)`, contentWidth - 10)
                ansLines.forEach((line: string, li: number) => doc.text(line, margin + 5, yPos + li * 4.5))
                yPos += ansLines.length * 4.5 + 2
              })
            } else if (typeId === 'make_sentences') {
              // No answer for make_sentences
              const words: any[] = q.words || []
              words.forEach((w: any, wi: number) => {
                const word = typeof w === 'object' ? w.word : w
                const sampleAns = typeof w === 'object' && w.answer ? w.answer : '(student\'s own sentence)'
                checkPageBreak(6)
                doc.text(`  (${toRoman(wi + 1)}) ${word}: ${sampleAns}`, margin + 5, yPos)
                yPos += 5
              })
            } else {
              const ans = q.sample_answer || q.answer || 'N/A'
              const prefix = `  (${toRoman(subIdx + 1)}) `
              const ansLines = wrap(`${prefix}${ans}  (${q.marks || 0} marks)`, contentWidth - 10)
              ansLines.forEach((line: string, li: number) => doc.text(line, margin + 5, yPos + li * 4.5))
              yPos += ansLines.length * 4.5 + 2
            }
          })
          yPos += 4
        }
      }
    }

    doc.save(filename)
    console.log('✅ PDF generated successfully:', filename)
  } catch (error) {
    console.error('❌ PDF generation failed:', error)
    throw new Error('Failed to generate PDF. Please try again.')
  }
}
