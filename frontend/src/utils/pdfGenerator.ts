import { jsPDF } from 'jspdf'

interface ExamPDFOptions {
  filename?: string
  includeAnswerKey?: boolean
  schoolName?: string
  totalMarksOverride?: number
}

// Convert numeric grade string to uppercase Roman numeral (e.g. "2" → "II")
const gradeToRoman = (grade: string): string => {
  const n = parseInt(grade)
  if (isNaN(n)) return grade
  const romans = ['I','II','III','IV','V','VI','VII','VIII','IX','X','XI','XII']
  return n >= 1 && n <= 12 ? romans[n - 1] : grade
}

// Roman numerals for sub-parts
const toRoman = (n: number): string => {
  const nums = ['i','ii','iii','iv','v','vi','vii','viii','ix','x',
                'xi','xii','xiii','xiv','xv','xvi','xvii','xviii','xix','xx']
  return n >= 1 && n <= 20 ? nums[n - 1] : String(n)
}

// Format marks: show as integer if whole, otherwise keep decimal (e.g. 0.5, 0.25)
const formatMarks = (n: number): string => Number.isInteger(n) ? String(n) : String(n)

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
  grammar_correction: 'Grammar Correction',
  parts_of_speech: 'Parts of Speech',
  drawing_exercise: 'Drawing Exercise',
}


export async function generateExamPDF(
  exam: any,
  selectedQuestions: Set<string>,
  options: ExamPDFOptions = {},
  questionImages: Record<string, string> = {}
): Promise<void> {
  const { filename = `exam_${new Date().toISOString().split('T')[0]}.pdf`, schoolName, totalMarksOverride } = options

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
    // Apply override if provided
    if (totalMarksOverride !== undefined && totalMarksOverride > 0) {
      totalMarks = totalMarksOverride
    }

    // ───────────────────────────────────────────────
    // COVER PAGE
    // ───────────────────────────────────────────────
    // School name header (editable by teacher)
    const displaySchoolName = (schoolName && schoolName.trim()) ? schoolName.trim().toUpperCase() : 'SCHOOL NAME'
    doc.setFontSize(16)
    doc.setFont('helvetica', 'bold')
    doc.text(displaySchoolName, pageWidth / 2, yPos, { align: 'center' })
    yPos += 5

    doc.setLineWidth(1)
    doc.line(margin, yPos, pageWidth - margin, yPos)
    yPos += 5

    // ── Single unified info box ──────────────────────────────────
    //  Row 1: Subject | Class | Total Marks
    //  Row 2: Date | Time Allowed
    //  Row 3: Name | Roll No | Section  (all on one line)
    //  Row 4: Instructions
    const infoBoxH = 38
    doc.setLineWidth(0.8)
    doc.rect(margin, yPos, contentWidth, infoBoxH)

    const bx = margin    // box left x
    const pad = 3        // internal padding
    const lh = 8         // line height between rows

    // Light horizontal dividers
    doc.setLineWidth(0.2)
    doc.line(bx + pad, yPos + lh + 2,      bx + contentWidth - pad, yPos + lh + 2)
    doc.line(bx + pad, yPos + lh * 2 + 3,  bx + contentWidth - pad, yPos + lh * 2 + 3)
    doc.line(bx + pad, yPos + lh * 3 + 4,  bx + contentWidth - pad, yPos + lh * 3 + 4)

    // Light vertical dividers for Row 1
    const col1x = bx + contentWidth / 3
    const col2x = bx + (contentWidth / 3) * 2
    doc.line(col1x, yPos + 1, col1x, yPos + lh + 2)
    doc.line(col2x, yPos + 1, col2x, yPos + lh + 2)

    doc.setFontSize(12)

    // Row 1 – Subject / Class / Total Marks
    const row1y = yPos + lh - 1
    doc.setFont('helvetica', 'bold')
    doc.text('Subject:', bx + pad + 1, row1y)
    doc.setFont('helvetica', 'normal')
    doc.text(exam.subject || '', bx + pad + 19, row1y)

    doc.setFont('helvetica', 'bold')
    doc.text('Class:', col1x + pad + 1, row1y)
    doc.setFont('helvetica', 'normal')
    doc.text(`Class ${gradeToRoman(String(exam.grade || ''))}`, col1x + pad + 14, row1y)

    doc.setFont('helvetica', 'bold')
    doc.text('Total Marks:', col2x + pad + 1, row1y)
    doc.setFont('helvetica', 'normal')
    doc.text(String(totalMarks), col2x + pad + 26, row1y)

    // Row 2 – Date / Time Allowed
    const row2y = yPos + lh * 2
    doc.setFont('helvetica', 'bold')
    doc.text('Date:', bx + pad + 1, row2y)
    doc.setLineWidth(0.2)
    doc.line(bx + pad + 14, row2y + 1, col1x - 4, row2y + 1)

    doc.setFont('helvetica', 'bold')
    doc.text('Time Allowed:', col1x + pad + 1, row2y)
    doc.line(col1x + pad + 30, row2y + 1, bx + contentWidth - pad, row2y + 1)

    // Row 3 – Name | Roll No | Section  (all on one line)
    // Layout: Name(~55% blank) | Roll No(~25% blank) | Section(~20% blank)
    const row3y = yPos + lh * 3 + 1
    const r3Left  = bx + pad + 1          // start of usable row area
    const r3Right = bx + contentWidth - pad  // end of row = 187

    // Name: label at r3Left, blank ends at ~57% across
    const xNameLabel       = r3Left                            // 24
    const xNameBlankStart  = xNameLabel + 13                   // 37
    const xNameBlankEnd    = r3Left + (r3Right - r3Left) * 0.55 // ~113

    // Roll No: label right after name blank, short blank (~20mm)
    const xRollLabel       = xNameBlankEnd + 3                 // ~116
    const xRollBlankStart  = xRollLabel + 18                   // ~134
    const xRollBlankEnd    = xRollBlankStart + 20              // ~154

    // Section: label right after roll blank, compact blank (~15mm)
    const xSectionLabel      = xRollBlankEnd + 3               // ~157
    const xSectionBlankStart = xSectionLabel + 19              // ~176
    const xSectionBlankEnd   = r3Right                         // 187

    doc.setFont('helvetica', 'bold')
    doc.text('Name:', xNameLabel, row3y)
    doc.setLineWidth(0.2)
    doc.line(xNameBlankStart, row3y + 1, xNameBlankEnd, row3y + 1)

    doc.setFont('helvetica', 'bold')
    doc.text('Roll No:', xRollLabel, row3y)
    doc.line(xRollBlankStart, row3y + 1, xRollBlankEnd, row3y + 1)

    doc.setFont('helvetica', 'bold')
    doc.text('Section:', xSectionLabel, row3y)
    doc.line(xSectionBlankStart, row3y + 1, xSectionBlankEnd, row3y + 1)

    // Row 4 – Instructions
    const row4y = yPos + infoBoxH - 4
    doc.setFontSize(10)
    doc.setFont('helvetica', 'bold')
    doc.text('Instructions: ', bx + pad + 1, row4y)
    doc.setFont('helvetica', 'normal')
    doc.text('Read all questions carefully. Write answers neatly. Check your work before submitting.', bx + pad + 28, row4y)

    yPos += infoBoxH + 4

    // Separator
    doc.setLineWidth(0.8)
    doc.line(margin, yPos, pageWidth - margin, yPos)
    yPos += 5

    // ───────────────────────────────────────────────
    // QUESTION RENDERING HELPERS
    // ───────────────────────────────────────────────
    let questionNum = 0

    // Draw a question group header (Q1. True / False  (5 marks))
    const addGroupHeader = (typeId: string, totalTypeMarks: number) => {
      questionNum++
      checkPageBreak(12)
      const label = TYPE_LABELS[typeId] || typeId.split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')
      doc.setFontSize(13)
      doc.setFont('helvetica', 'bold')
      doc.text(`Q${questionNum}.  ${label}`, margin, yPos)
      doc.setFont('helvetica', 'normal')
      doc.setFontSize(12)
      const marksText = `(${formatMarks(totalTypeMarks)} marks)`
      doc.text(marksText, pageWidth - margin, yPos, { align: 'right' })
      yPos += 5
    }

    // Render a passage block
    const addPassage = (passage: string) => {
      if (!passage) return
      checkPageBreak(20)
      doc.setFontSize(11)
      doc.setFont('helvetica', 'bold')
      doc.text('Passage:', margin + 5, yPos)
      yPos += 4

      doc.setFont('helvetica', 'normal')
      const lines = wrap(passage, contentWidth - 14)
      const passageBoxH = lines.length * 5 + 7
      checkPageBreak(passageBoxH + 4)
      doc.setLineWidth(0.3)
      doc.rect(margin + 5, yPos, contentWidth - 10, passageBoxH)
      doc.setFontSize(11)
      lines.forEach((line: string, i: number) => {
        doc.text(line, margin + 8, yPos + 5 + i * 5)
      })
      yPos += passageBoxH + 4
    }

    // True/False column headers — call ONCE before the first item
    const addTrueFalseColumnHeaders = () => {
      checkPageBreak(8)
      doc.setFontSize(11)
      doc.setFont('helvetica', 'bold')
      // T box: x = pageWidth-margin-20, width=6 → center at pageWidth-margin-17
      // F box: x = pageWidth-margin-9,  width=6 → center at pageWidth-margin-6
      doc.text('T', pageWidth - margin - 17, yPos, { align: 'center' })
      doc.text('F', pageWidth - margin - 6,  yPos, { align: 'center' })
      yPos += 6
    }

    // Render True/False sub-item (statement on left, two empty boxes on right — no T/F labels)
    const addTrueFalseItem = (statement: string, subIdx: number) => {
      checkPageBreak(10)
      const prefix = `(${toRoman(subIdx + 1)})  `
      doc.setFontSize(12)
      doc.setFont('helvetica', 'normal')
      const stmtLines = wrap(prefix + statement, contentWidth - 28)
      stmtLines.forEach((line: string, i: number) => {
        doc.text(line, margin + 5, yPos + i * 5.5)
      })
      // Two boxes on right — no T/F labels (they appear once as column headers)
      const boxY = yPos - 3.5
      doc.setLineWidth(0.3)
      doc.rect(pageWidth - margin - 20, boxY, 6, 5)   // T box
      doc.rect(pageWidth - margin - 9,  boxY, 6, 5)   // F box
      yPos += stmtLines.length * 5.5 + 2
    }

    // Render MCQ/Circle sub-item
    const addMCQItem = (question: any, subIdx: number) => {
      checkPageBreak(25)
      const prefix = `(${toRoman(subIdx + 1)})  `
      const qText = question.question || question.statement || ''
      const qLines = wrap(prefix + qText, contentWidth - 10)
      doc.setFontSize(12)
      doc.setFont('helvetica', 'normal')
      qLines.forEach((line: string, i: number) => {
        doc.text(line, margin + 5, yPos + i * 5.5)
      })
      yPos += qLines.length * 5.5 + 2

      if (question.options) {
        doc.setFontSize(11)
        const optLabels = ['a)', 'b)', 'c)', 'd)']
        const colW = contentWidth / 2
        question.options.forEach((opt: string, oi: number) => {
          const col = oi % 2
          const xPos = margin + 10 + col * colW
          if (col === 0 && oi > 0) yPos += 5.5
          const optText = `${optLabels[oi]} ${opt}`
          const optLines = wrap(optText, colW - 5)
          optLines.forEach((line: string, li: number) => {
            doc.text(line, xPos, yPos + li * 5)
          })
        })
        yPos += 6
      }
      yPos += 2
    }

    // Replace _______ blanks in question text with blanks sized proportionally to each answer word
    const proportionalBlanks = (questionText: string, answer: any): string => {
      let answers: string[] = []
      if (Array.isArray(answer)) {
        answers = answer.map((a: any) => String(a).trim())
      } else if (typeof answer === 'string' && answer.includes(',')) {
        answers = answer.split(',').map((a: string) => a.trim())
      } else {
        answers = [String(answer || '').trim()]
      }
      let ansIdx = 0
      return questionText.replace(/_{4,}/g, () => {
        const ans = answers[ansIdx] || answers[answers.length - 1] || ''
        ansIdx++
        // blank width = answer chars + 3 padding, clamped between 5 and 20
        const n = Math.max(5, Math.min(20, ans.length + 3))
        return '_'.repeat(n)
      })
    }

    // Render Fill in Blanks sub-item (no separate answer line)
    const addFillInBlanksItem = (question: any, subIdx: number) => {
      checkPageBreak(10)
      const prefix = `(${toRoman(subIdx + 1)})  `
      const rawText = question.question || ''
      // Make blanks proportional to the expected answer length
      const qText = proportionalBlanks(rawText, question.answer)
      doc.setFontSize(12)
      doc.setFont('helvetica', 'normal')
      const qLines = wrap(prefix + qText, contentWidth - 10)
      qLines.forEach((line: string, i: number) => {
        doc.text(line, margin + 5, yPos + i * 5.5)
      })
      yPos += qLines.length * 5.5 + 3
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
      doc.setFontSize(12)
      doc.setFont('helvetica', 'italic')
      instrLines.forEach((line: string, i: number) => {
        doc.text(line, margin + 5, yPos + i * 5.5)
      })
      yPos += instrLines.length * 5.5 + 3

      // Table headers
      const tableLeft = margin + 5
      const colAWidth = contentWidth / 2 - 5
      const colBWidth = contentWidth / 2 - 5
      const colBLeft = tableLeft + colAWidth + 8

      doc.setFont('helvetica', 'bold')
      doc.setFontSize(11)
      doc.text('Column A', tableLeft + colAWidth / 2, yPos, { align: 'center' })
      doc.text('Column B', colBLeft + colBWidth / 2, yPos, { align: 'center' })
      yPos += 3
      doc.setLineWidth(0.4)
      doc.line(tableLeft, yPos, tableLeft + colAWidth, yPos)
      doc.line(colBLeft, yPos, colBLeft + colBWidth, yPos)
      yPos += 5

      // Table rows
      doc.setFont('helvetica', 'normal')
      doc.setFontSize(11)
      for (let r = 0; r < rows; r++) {
        checkPageBreak(rowH + 2)
        const aItem = colA[r] ? String(colA[r]) : ''
        const bItem = colB[r] ? String(colB[r]) : ''
        const aLines = wrap(aItem, colAWidth - 3)
        const bLines = wrap(bItem, colBWidth - 3)
        aLines.forEach((line: string, li: number) => doc.text(line, tableLeft, yPos + li * 5))
        bLines.forEach((line: string, li: number) => doc.text(line, colBLeft, yPos + li * 5))
        yPos += Math.max(aLines.length, bLines.length) * 5 + 2
      }
      yPos += 3
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
          doc.setFontSize(12)
          doc.setFont('helvetica', 'normal')
          qLines.forEach((line: string, i: number) => {
            doc.text(line, margin + 5, yPos + i * 5.5)
          })
          yPos += qLines.length * 5.5 + 2

          // MCQ options for objective comprehension
          if (subQ.options) {
            doc.setFontSize(11)
            const optLabels = ['a)', 'b)', 'c)', 'd)']
            const colW = contentWidth / 2
            subQ.options.forEach((opt: string, oi: number) => {
              const col = oi % 2
              const xPos = margin + 12 + col * colW
              if (col === 0 && oi > 0) yPos += 5.5
              doc.text(`${optLabels[oi]} ${opt}`, xPos, yPos)
            })
            yPos += 7
          }

          // Answer lines for subjective comprehension
          if (typeId === 'unseen_comprehension_subjective') {
            // Show guidance if available
            const hints: string[] = []
            if (subQ.sentences_required) hints.push(`Write ${subQ.sentences_required} sentence${subQ.sentences_required > 1 ? 's' : ''}`)
            if (subQ.word_limit) hints.push(`(max ${subQ.word_limit} words)`)
            if (hints.length > 0) {
              checkPageBreak(6)
              doc.setFontSize(9)
              doc.setFont('helvetica', 'italic')
              doc.text(hints.join(' '), margin + 7, yPos)
              yPos += 5
            }
            const lineCount = subQ.sentences_required ? Math.min(subQ.sentences_required + 1, 5) : Math.min(Math.ceil((subQ.marks || 1) * 1.5), 4)
            for (let l = 0; l < lineCount; l++) {
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
      // Set font before getTextWidth so measurement is accurate
      doc.setFontSize(12)
      doc.setFont('helvetica', 'bold')
      const labelText = `${prefix}${word}:`
      doc.text(labelText, margin + 5, yPos)
      doc.setFont('helvetica', 'normal')
      doc.setLineWidth(0.2)
      doc.line(margin + 5 + doc.getTextWidth(labelText) + 4, yPos + 1, pageWidth - margin - 5, yPos + 1)
      yPos += 8
    }

    // Render short/long answer sub-item
    const addAnswerLinesItem = (question: any, subIdx: number, lineCount = 4) => {
      checkPageBreak(lineCount * 7 + 15)
      const prefix = `(${toRoman(subIdx + 1)})  `
      const qText = question.question || question.statement || ''
      const qLines = wrap(prefix + qText, contentWidth - 10)
      doc.setFontSize(12)
      doc.setFont('helvetica', 'normal')
      qLines.forEach((line: string, i: number) => {
        doc.text(line, margin + 5, yPos + i * 5.5)
      })
      yPos += qLines.length * 5.5 + 3
      for (let l = 0; l < lineCount; l++) {
        checkPageBreak(8)
        doc.setLineWidth(0.2)
        doc.line(margin + 5, yPos, pageWidth - margin - 5, yPos)
        yPos += 8
      }
      yPos += 2
    }

    // Render creative writing sub-item (with vocabulary words + lines_required)
    const addCreativeWritingItem = (question: any, subIdx: number) => {
      checkPageBreak(50)
      const prefix = `(${toRoman(subIdx + 1)})  `
      const promptText = question.instruction || question.prompt || ''
      // Set font BEFORE wrap() so splitTextToSize uses correct character widths
      doc.setFontSize(12)
      doc.setFont('helvetica', 'bold')
      const pLines = wrap(prefix + promptText, contentWidth - 12)
      pLines.forEach((line: string, i: number) => {
        doc.text(line, margin + 5, yPos + i * 5.5)
      })
      yPos += pLines.length * 5.5 + 3

      // Show vocabulary words if provided
      const vocabWords: string[] = question.vocabulary_words || []
      if (vocabWords.length > 0) {
        checkPageBreak(8)
        doc.setFontSize(10)
        doc.setFont('helvetica', 'bold')
        doc.text('Word Bank: ', margin + 5, yPos)
        doc.setFont('helvetica', 'normal')
        doc.text(vocabWords.join('  |  '), margin + 28, yPos)
        yPos += 7
      }

      // Use lines_required if available, else default to 6
      const linesRequired = question.lines_required || 6
      for (let l = 0; l < linesRequired; l++) {
        checkPageBreak(8)
        doc.setLineWidth(0.2)
        doc.line(margin + 5, yPos, pageWidth - margin - 5, yPos)
        yPos += 7
      }
      yPos += 2
    }

    // Render picture description sub-item
    const addPictureDescriptionItem = (question: any, subIdx: number, imageData?: string) => {
      checkPageBreak(60)
      const prefix = `(${toRoman(subIdx + 1)})  `
      const desc = question.instruction || 'Look at the picture and describe it.'
      const dLines = wrap(prefix + desc, contentWidth - 10)
      doc.setFontSize(12)
      doc.setFont('helvetica', 'normal')
      dLines.forEach((line: string, i: number) => {
        doc.text(line, margin + 5, yPos + i * 5.5)
      })
      yPos += dLines.length * 5.5 + 3

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

      // Answer lines: use lines_required if specified, else 4
      const picLinesRequired = question.lines_required || 4
      for (let l = 0; l < picLinesRequired; l++) {
        doc.setLineWidth(0.2)
        doc.line(margin + 5, yPos, pageWidth - margin - 5, yPos)
        yPos += 7
      }
      yPos += 3
    }

    // Render label figures sub-item (instruction text + image box per sub-item)
    const addLabelFiguresItem = (question: any, subIdx: number, imageData?: string) => {
      checkPageBreak(60)
      const prefix = `(${toRoman(subIdx + 1)})  `
      const desc = question.instruction || question.question || ''
      doc.setFontSize(12)
      doc.setFont('helvetica', 'normal')
      const dLines = wrap(prefix + desc, contentWidth - 10)
      dLines.forEach((line: string, i: number) => {
        doc.text(line, margin + 5, yPos + i * 5.5)
      })
      yPos += dLines.length * 5.5 + 3

      // Image box (centered)
      const imgBoxW = 70
      const imgBoxH = 50
      const imgX = margin + (contentWidth - imgBoxW) / 2
      doc.setLineWidth(0.5)
      doc.rect(imgX, yPos, imgBoxW, imgBoxH)

      if (imageData) {
        try {
          doc.addImage(imageData, 'JPEG', imgX, yPos, imgBoxW, imgBoxH)
        } catch {
          doc.setFontSize(8)
          doc.setTextColor(150, 150, 150)
          doc.text('[Figure]', imgX + imgBoxW / 2, yPos + imgBoxH / 2, { align: 'center' })
          doc.setTextColor(0, 0, 0)
        }
      } else {
        doc.setFontSize(8)
        doc.setTextColor(150, 150, 150)
        doc.text('[Figure]', imgX + imgBoxW / 2, yPos + imgBoxH / 2, { align: 'center' })
        doc.setTextColor(0, 0, 0)
      }
      yPos += imgBoxH + 5

      // One answer line for the label
      doc.setLineWidth(0.2)
      doc.line(margin + 5, yPos, pageWidth - margin - 5, yPos)
      yPos += 8
    }

    // Render a drawing exercise sub-item (question text + empty drawing box)
    const addDrawingExerciseItem = (question: any, subIdx: number, boxW = 55, boxH = 45) => {
      checkPageBreak(boxH + 20)
      const prefix = `(${toRoman(subIdx + 1)})  `
      const qText = question.question || question.instruction || ''
      doc.setFontSize(12)
      doc.setFont('helvetica', 'normal')
      const qLines = wrap(prefix + qText, contentWidth - 10)
      qLines.forEach((line: string, i: number) => {
        doc.text(line, margin + 5, yPos + i * 5.5)
      })
      yPos += qLines.length * 5.5 + 3

      // Centered drawing box
      const bx = margin + (contentWidth - boxW) / 2
      doc.setLineWidth(0.5)
      doc.rect(bx, yPos, boxW, boxH)
      doc.setFontSize(7)
      doc.setTextColor(180, 180, 180)
      doc.text('Draw here', bx + boxW / 2, yPos + boxH / 2, { align: 'center' })
      doc.setTextColor(0, 0, 0)
      yPos += boxH + 4
    }

    // Render a work-space box for calculation questions (question text + ruled work area)
    const addWorkSpaceItem = (question: any, subIdx: number, workLines = 5) => {
      checkPageBreak(workLines * 8 + 20)
      const prefix = `(${toRoman(subIdx + 1)})  `
      const qText = question.question || question.statement || ''
      doc.setFontSize(12)
      doc.setFont('helvetica', 'normal')
      const qLines = wrap(prefix + qText, contentWidth - 10)
      qLines.forEach((line: string, i: number) => {
        doc.text(line, margin + 5, yPos + i * 5.5)
      })
      yPos += qLines.length * 5.5 + 2

      if (question.partial_solution) {
        doc.setFontSize(11)
        doc.setFont('helvetica', 'italic')
        const pLines = wrap(question.partial_solution, contentWidth - 15)
        pLines.forEach((line: string, i: number) => {
          doc.text(line, margin + 10, yPos + i * 5)
        })
        yPos += pLines.length * 5 + 2
      }

      // Work space: a bordered box with light grid lines inside
      const wsH = workLines * 8
      doc.setLineWidth(0.4)
      doc.rect(margin + 5, yPos, contentWidth - 10, wsH)
      doc.setLineWidth(0.1)
      doc.setDrawColor(200, 200, 200)
      for (let l = 1; l < workLines; l++) {
        doc.line(margin + 5, yPos + l * 8, margin + 5 + contentWidth - 10, yPos + l * 8)
      }
      doc.setDrawColor(0, 0, 0)
      yPos += wsH + 4
    }

    // Render complete sentences sub-item
    const addCompleteSentencesItem = (sent: any, subIdx: number) => {
      checkPageBreak(10)
      const prefix = `(${toRoman(subIdx + 1)})  `
      const isObj = typeof sent === 'object' && sent !== null
      const text = isObj ? (sent.incomplete || sent.sentence || '') : String(sent || '')
      const qLines = wrap(prefix + text, contentWidth - 10)
      doc.setFontSize(12)
      doc.setFont('helvetica', 'normal')
      qLines.forEach((line: string, i: number) => {
        doc.text(line, margin + 5, yPos + i * 5.5)
      })
      yPos += qLines.length * 5.5 + 3
    }

    // Render rearrange sentences sub-item
    const addRearrangeSentencesItem = (question: any, subIdx: number) => {
      checkPageBreak(15)
      const prefix = `(${toRoman(subIdx + 1)})  `
      const instrText = question.instruction || 'Rearrange the following sentences:'
      // Set font before wrap so text width calculation is correct
      doc.setFontSize(12)
      doc.setFont('helvetica', 'italic')
      const iLines = wrap(prefix + instrText, contentWidth - 10)
      iLines.forEach((line: string, i: number) => {
        doc.text(line, margin + 5, yPos + i * 5.5)
      })
      yPos += iLines.length * 5.5 + 2

      const sentences: string[] = question.sentences || []
      doc.setFont('helvetica', 'normal')
      doc.setFontSize(11)
      sentences.forEach((sentence, si) => {
        checkPageBreak(6)
        const sLines = wrap(`${si + 1}. ${sentence}`, contentWidth - 15)
        sLines.forEach((line: string, li: number) => {
          doc.text(line, margin + 10, yPos + li * 5)
        })
        yPos += sLines.length * 5 + 2
      })
      yPos += 2
    }

    // Render grammar correction group (instruction + sentence list with blank lines)
    const addGrammarCorrectionItem = (question: any, subIdx: number) => {
      checkPageBreak(12)
      // Show instruction once (only for first item, caller handles this)
      const sentences: any[] = question.sentences || []
      if (sentences.length === 0) return

      // Show instruction
      if (subIdx === 0 && question.instruction) {
        const instrLines = wrap(question.instruction, contentWidth - 10)
        doc.setFontSize(10)
        doc.setFont('helvetica', 'italic')
        instrLines.forEach((line: string, i: number) => {
          doc.text(line, margin + 5, yPos + i * 4.5)
        })
        yPos += instrLines.length * 4.5 + 4
      }

      // Each incorrect sentence + blank correction line
      sentences.forEach((sent: any, si: number) => {
        checkPageBreak(14)
        const incorrectText = `(${toRoman(si + 1)})  ${sent.incorrect || ''}`
        const sLines = wrap(incorrectText, contentWidth - 10)
        doc.setFontSize(12)
        doc.setFont('helvetica', 'normal')
        sLines.forEach((line: string, li: number) => {
          doc.text(line, margin + 5, yPos + li * 5.5)
        })
        yPos += sLines.length * 5.5 + 2
        // Correction line
        doc.setLineWidth(0.2)
        doc.line(margin + 5, yPos, pageWidth - margin - 5, yPos)
        yPos += 8
      })
      yPos += 2
    }

    // Render parts of speech group (instruction + sentences with identification line)
    const addPartsOfSpeechItem = (question: any, subIdx: number) => {
      checkPageBreak(12)
      const sentences: any[] = question.sentences || []
      if (sentences.length === 0) return

      // Show instruction once for first item
      if (subIdx === 0 && question.instruction) {
        const instrLines = wrap(question.instruction, contentWidth - 10)
        doc.setFontSize(10)
        doc.setFont('helvetica', 'italic')
        instrLines.forEach((line: string, i: number) => {
          doc.text(line, margin + 5, yPos + i * 4.5)
        })
        yPos += instrLines.length * 4.5 + 4
      }

      sentences.forEach((sent: any, si: number) => {
        checkPageBreak(14)
        const sentText = `(${toRoman(si + 1)})  ${sent.sentence || ''}`
        const sLines = wrap(sentText, contentWidth - 10)
        doc.setFontSize(12)
        doc.setFont('helvetica', 'normal')
        sLines.forEach((line: string, li: number) => {
          doc.text(line, margin + 5, yPos + li * 5.5)
        })
        yPos += sLines.length * 5.5 + 2
        // Answer line
        doc.setLineWidth(0.2)
        doc.line(margin + 5, yPos, pageWidth - margin - 5, yPos)
        yPos += 8
      })
      yPos += 2
    }

    // Short practice questions (math)

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
        doc.setFontSize(14)
        doc.setFont('helvetica', 'bold')
        doc.text('SECTION A: OBJECTIVE QUESTIONS', pageWidth / 2, yPos, { align: 'center' })
        yPos += 3
        doc.setLineWidth(0.6)
        doc.line(margin, yPos, pageWidth - margin, yPos)
        yPos += 5
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

        // True/False: show T / F column headers once before items
        if (typeId === 'true_false') addTrueFalseColumnHeaders()

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
            case 'label_figures': {
              const imgId = `obj-label_figures-${filteredIndices[subIdx]}`
              addLabelFiguresItem(question, subIdx, questionImages[imgId])
              break
            }
            case 'short_practice_questions_missing_solution':
              addWorkSpaceItem(question, subIdx, 4)
              break
            case 'drawing_exercise':
              addDrawingExerciseItem(question, subIdx)
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
        doc.setFontSize(14)
        doc.setFont('helvetica', 'bold')
        doc.text('SECTION B: SUBJECTIVE QUESTIONS', pageWidth / 2, yPos, { align: 'center' })
        yPos += 3
        doc.setLineWidth(0.6)
        doc.line(margin, yPos, pageWidth - margin, yPos)
        yPos += 5
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
            case 'label_figures': {
              const imgId = `subj-label_figures-${filteredIndices[subIdx]}`
              addLabelFiguresItem(question, subIdx, questionImages[imgId])
              break
            }
            case 'short_answer':
              addAnswerLinesItem(question, subIdx, 4)
              break
            case 'long_answer':
              addAnswerLinesItem(question, subIdx, 7)
              break
            case 'practice_questions_by_topic':
            case 'real_life_story_problems':
              // Use work space box (bordered grid) for math calculation questions
              addWorkSpaceItem(question, subIdx, question.requires_drawing ? 6 : 5)
              break
            case 'grammar_correction':
              addGrammarCorrectionItem(question, subIdx)
              break
            case 'parts_of_speech':
              addPartsOfSpeechItem(question, subIdx)
              break
            default:
              addAnswerLinesItem(question, subIdx, 4)
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

      doc.setFontSize(11)
      doc.setFont('helvetica', 'normal')
      doc.text(`Subject: ${exam.subject}  |  Class: ${gradeToRoman(String(exam.grade || ''))}  |  Date: ${new Date().toLocaleDateString()}`, pageWidth / 2, yPos, { align: 'center' })
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
            doc.setFontSize(11)
            doc.setFont('helvetica', 'normal')

            if (q.sub_questions) {
              q.sub_questions.forEach((sq: any, si: number) => {
                checkPageBreak(6)
                const ansText = `  (${toRoman(si + 1)}) ${renderAKAnswer(sq.answer)}  (${formatMarks(sq.marks || 0)} marks)`
                doc.text(ansText, margin + 5, yPos)
                yPos += 5.5
              })
            } else {
              const ansText = `  (${toRoman(subIdx + 1)}) ${renderAKAnswer(q.answer)}  (${formatMarks(q.marks || 0)} marks)`
              doc.text(ansText, margin + 5, yPos)
              yPos += 5.5
            }
          })
          yPos += 3
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
            doc.setFontSize(11)
            doc.setFont('helvetica', 'normal')

            if (q.sub_questions) {
              q.sub_questions.forEach((sq: any, si: number) => {
                checkPageBreak(10)
                const ansLines = wrap(`  (${toRoman(si + 1)}) ${sq.answer || 'N/A'}  (${formatMarks(sq.marks || 0)} marks)`, contentWidth - 10)
                ansLines.forEach((line: string, li: number) => doc.text(line, margin + 5, yPos + li * 5))
                yPos += ansLines.length * 5 + 2
              })
            } else if (typeId === 'make_sentences') {
              const words: any[] = q.words || []
              words.forEach((w: any, wi: number) => {
                const word = typeof w === 'object' ? w.word : w
                const sampleAns = typeof w === 'object' && w.answer ? w.answer : '(student\'s own sentence)'
                checkPageBreak(6)
                doc.text(`  (${toRoman(wi + 1)}) ${word}: ${sampleAns}`, margin + 5, yPos)
                yPos += 5.5
              })
            } else if (typeId === 'grammar_correction') {
              const sentences: any[] = q.sentences || []
              sentences.forEach((sent: any, si: number) => {
                checkPageBreak(6)
                const ansLines = wrap(`  (${toRoman(si + 1)}) ${sent.answer || 'N/A'}`, contentWidth - 10)
                ansLines.forEach((line: string, li: number) => doc.text(line, margin + 5, yPos + li * 5))
                yPos += ansLines.length * 5 + 1.5
              })
            } else if (typeId === 'parts_of_speech') {
              const sentences: any[] = q.sentences || []
              sentences.forEach((sent: any, si: number) => {
                checkPageBreak(6)
                const ansLines = wrap(`  (${toRoman(si + 1)}) ${sent.answer || 'N/A'}`, contentWidth - 10)
                ansLines.forEach((line: string, li: number) => doc.text(line, margin + 5, yPos + li * 5))
                yPos += ansLines.length * 5 + 1.5
              })
            } else {
              const ans = q.sample_answer || q.answer || 'N/A'
              const prefix = `  (${toRoman(subIdx + 1)}) `
              const ansLines = wrap(`${prefix}${ans}  (${q.marks || 0} marks)`, contentWidth - 10)
              ansLines.forEach((line: string, li: number) => doc.text(line, margin + 5, yPos + li * 5))
              yPos += ansLines.length * 5 + 2
            }
          })
          yPos += 3
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
