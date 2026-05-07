import { jsPDF } from 'jspdf'
import type { ImageStore } from './imageStore'

interface ExamPDFOptions {
  filename?: string
  includeAnswerKey?: boolean
  schoolName?: string
  totalMarksOverride?: number
  timeAllowed?: string
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
  questionImagesOrStore: Record<string, string> | ImageStore = {}
): Promise<void> {
  // Accept either legacy Record<string,string> or new ImageStore
  const isImageStore = (v: any): v is ImageStore =>
    Object.values(v).length === 0 || (typeof Object.values(v)[0] === 'object' && 'dataUrl' in (Object.values(v)[0] as any))
  const imageStore: ImageStore = isImageStore(questionImagesOrStore)
    ? (questionImagesOrStore as ImageStore)
    : Object.fromEntries(Object.entries(questionImagesOrStore as Record<string, string>).map(([k, v]) => [k, { dataUrl: v, widthMm: 55, heightMm: 42, alignment: 'center' as const }]))
  const { filename = `exam_${new Date().toISOString().split('T')[0]}.pdf`, schoolName, totalMarksOverride, timeAllowed } = options

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
    // COVER PAGE  (open layout — no box, like sample papers)
    // ───────────────────────────────────────────────
    const displaySchoolName = (schoolName && schoolName.trim()) ? schoolName.trim().toUpperCase() : 'SCHOOL NAME'
    doc.setFontSize(16)
    doc.setFont('helvetica', 'bold')
    doc.text(displaySchoolName, pageWidth / 2, yPos, { align: 'center' })
    yPos += 9

    // Row 1 – Subject (left) | Total Marks (right)
    doc.setFontSize(12)
    doc.setFont('helvetica', 'bold')
    doc.text('Subject: ', margin, yPos)
    doc.setFont('helvetica', 'normal')
    doc.text(exam.subject || '', margin + doc.getTextWidth('Subject: '), yPos)
    doc.setFont('helvetica', 'bold')
    doc.text(`Total Marks: [   /${totalMarks}]`, pageWidth - margin, yPos, { align: 'right' })
    yPos += 7

    // Row 2 – Class (left) | Date (centre) | Time (right)
    doc.setFont('helvetica', 'bold')
    doc.text('Class: ', margin, yPos)
    doc.setFont('helvetica', 'normal')
    doc.text(gradeToRoman(String(exam.grade || '').replace(/^class\s*/i, '')), margin + doc.getTextWidth('Class: '), yPos)

    doc.setFont('helvetica', 'bold')
    const dateLabel = 'Date: '
    const dateLabelW = doc.getTextWidth(dateLabel)
    const dateCx = pageWidth / 2 - 15
    doc.text(dateLabel, dateCx, yPos)
    doc.setLineWidth(0.3)
    doc.line(dateCx + dateLabelW, yPos + 1, dateCx + dateLabelW + 28, yPos + 1)

    doc.setFont('helvetica', 'bold')
    doc.text('Time: ', pageWidth - margin - 35, yPos)
    doc.setFont('helvetica', 'normal')
    if (timeAllowed) {
      doc.text(timeAllowed, pageWidth - margin - 35 + doc.getTextWidth('Time: '), yPos)
    } else {
      doc.setLineWidth(0.3)
      doc.line(pageWidth - margin - 35 + doc.getTextWidth('Time: '), yPos + 1, pageWidth - margin, yPos + 1)
    }
    yPos += 7

    // Row 3 – Name | Roll No | Section
    doc.setFont('helvetica', 'bold')
    doc.text('Name: ', margin, yPos)
    doc.setLineWidth(0.3)
    const nameBlankStart = margin + doc.getTextWidth('Name: ')
    const nameBlankEnd   = margin + 65
    doc.line(nameBlankStart, yPos + 1, nameBlankEnd, yPos + 1)

    doc.setFont('helvetica', 'bold')
    const rollX = nameBlankEnd + 5
    doc.text('Roll No. ', rollX, yPos)
    const rollBlankStart = rollX + doc.getTextWidth('Roll No. ')
    const rollBlankEnd   = rollBlankStart + 22
    doc.line(rollBlankStart, yPos + 1, rollBlankEnd, yPos + 1)

    doc.setFont('helvetica', 'bold')
    const secX = rollBlankEnd + 5
    doc.text('Section: ', secX, yPos)
    const secBlankStart = secX + doc.getTextWidth('Section: ')
    doc.line(secBlankStart, yPos + 1, pageWidth - margin, yPos + 1)
    yPos += 9

    // Double horizontal rule separator
    doc.setLineWidth(1.2)
    doc.line(margin, yPos, pageWidth - margin, yPos)
    yPos += 2.5
    doc.setLineWidth(0.4)
    doc.line(margin, yPos, pageWidth - margin, yPos)
    yPos += 6

    // Note line (outside box, after separator — like samples)
    doc.setFontSize(11)
    doc.setFont('helvetica', 'bold')
    doc.text('Note: ', margin, yPos)
    doc.setFont('helvetica', 'normal')
    doc.text("Read questions carefully, don't over write and check your work.", margin + doc.getTextWidth('Note: '), yPos)
    yPos += 8

    // ───────────────────────────────────────────────
    // QUESTION RENDERING HELPERS
    // ───────────────────────────────────────────────
    let questionNum = 0
    let ix = margin  // updated per question group to align sub-items under label text

    // Helper: build marks display string — [0.5×4= /2] if uniform per-item, else [  /total]
    const buildMarksDisplay = (qs: any[], total: number): string => {
      if (qs.length > 0) {
        const perItem = qs[0]?.marks
        if (perItem && qs.every((q: any) => q.marks === perItem)) {
          return `[${formatMarks(perItem)}×${qs.length}=  /${formatMarks(total)}]`
        }
      }
      return `[   /${formatMarks(total)}]`
    }

    // Draw a question group header: Q.1.  Fill in the Blanks    [0.5×4= /2]
    const addGroupHeader = (typeId: string, totalTypeMarks: number, marksDisplay?: string) => {
      questionNum++
      checkPageBreak(12)
      const label = TYPE_LABELS[typeId] || typeId.split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')
      doc.setFontSize(12)
      doc.setFont('helvetica', 'bold')
      const qPrefix = `Q.${questionNum}.  `
      ix = margin + doc.getTextWidth(qPrefix)  // sub-items align under first letter of label
      doc.text(`${qPrefix}${label}`, margin, yPos)
      doc.setFontSize(12)
      const marksText = marksDisplay ?? `[   /${formatMarks(totalTypeMarks)}]`
      doc.text(marksText, pageWidth - margin, yPos, { align: 'right' })
      yPos += 7  // tight gap — items start close below header like sample
    }

    // Render an inline image — uses per-image dimensions from imageStore when available
    const addInlineImage = (imageData: string, imgW = 55, imgH = 42, imageKey?: string) => {
      // Override dimensions with per-image settings if provided
      const attachment = imageKey ? imageStore[imageKey] : undefined
      const w = attachment?.widthMm ?? imgW
      const h = attachment?.heightMm ?? imgH
      const align = attachment?.alignment ?? 'center'
      checkPageBreak(h + 6)
      let imgX: number
      if (align === 'left') imgX = ix
      else if (align === 'right') imgX = pageWidth - margin - w
      else imgX = ix + (contentWidth - (ix - margin) - w) / 2
      doc.setLineWidth(0.3)
      doc.rect(imgX, yPos, w, h)
      try {
        doc.addImage(imageData, 'JPEG', imgX, yPos, w, h)
      } catch {
        try {
          doc.addImage(imageData, 'PNG', imgX, yPos, w, h)
        } catch {
          doc.setFontSize(8)
          doc.setTextColor(150, 150, 150)
          doc.text('[Image]', imgX + w / 2, yPos + h / 2, { align: 'center' })
          doc.setTextColor(0, 0, 0)
        }
      }
      yPos += h + 4
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

    // Fixed right-side positions for T/F boxes — shared by header + items
    const TF_BOX_SIZE = 5
    const TF_GAP      = 5
    const TF_F_X      = pageWidth - margin - TF_BOX_SIZE
    const TF_T_X      = TF_F_X - TF_GAP - TF_BOX_SIZE
    const TF_T_CX     = TF_T_X + TF_BOX_SIZE / 2
    const TF_F_CX     = TF_F_X + TF_BOX_SIZE / 2

    // True/False column headers — call ONCE before the first item
    const addTrueFalseColumnHeaders = () => {
      checkPageBreak(8)
      doc.setFontSize(11)
      doc.setFont('helvetica', 'bold')
      doc.text('T', TF_T_CX, yPos, { align: 'center' })
      doc.text('F', TF_F_CX, yPos, { align: 'center' })
      yPos += 5
    }

    // Render True/False sub-item — boxes aligned exactly under T/F headers
    const addTrueFalseItem = (statement: string, subIdx: number, imageData?: string, imageKey?: string) => {
      checkPageBreak(10)
      const prefix = `${toRoman(subIdx + 1)})  `
      if (imageData) addInlineImage(imageData, 50, 38, imageKey)
      doc.setFontSize(11)
      doc.setFont('helvetica', 'normal')
      // Text width: from ix to left edge of T box, minus small gap
      const tfTextW = TF_T_X - ix - 4
      const stmtLines = wrap(prefix + statement, tfTextW)
      const rowH = stmtLines.length * 5.5
      stmtLines.forEach((line: string, i: number) => {
        doc.text(line, ix, yPos + i * 5.5)
      })
      // Boxes vertically centred on the row
      const boxY = yPos + (rowH - TF_BOX_SIZE) / 2 - 1.5
      doc.setLineWidth(0.3)
      doc.rect(TF_T_X, boxY, TF_BOX_SIZE, TF_BOX_SIZE)
      doc.rect(TF_F_X, boxY, TF_BOX_SIZE, TF_BOX_SIZE)
      yPos += rowH + 2.5
    }

    // Render MCQ sub-item — vertical option list (one per line), good for math equations
    const addMCQItem = (question: any, subIdx: number, imageData?: string, imageKey?: string) => {
      checkPageBreak(25)
      const prefix = `${toRoman(subIdx + 1)})  `
      const qText = question.question || question.statement || ''
      const qLines = wrap(prefix + qText, contentWidth - (ix - margin) - 10)
      doc.setFontSize(12)
      doc.setFont('helvetica', 'normal')
      qLines.forEach((line: string, i: number) => {
        doc.text(line, ix, yPos + i * 5.5)
      })
      yPos += qLines.length * 5.5 + 2
      if (imageData) addInlineImage(imageData, 55, 42, imageKey)

      if (question.options) {
        doc.setFontSize(11)
        const optLabels = ['a)', 'b)', 'c)', 'd)']
        const optIndent = ix + 4
        const optWidth = contentWidth - (optIndent - margin) - 5
        question.options.forEach((opt: string, oi: number) => {
          checkPageBreak(6)
          const optText = `${optLabels[oi]}  ${opt}`
          const optLines = wrap(optText, optWidth)
          optLines.forEach((line: string, li: number) => {
            doc.text(line, optIndent, yPos + li * 5.5)
          })
          yPos += optLines.length * 5.5
        })
        yPos += 3
      }
      yPos += 2
    }

    // Render Circle/Tick sub-item — no image case (fallback)
    const addCircleItem = (question: any, subIdx: number, imageData?: string, imageKey?: string) => {
      checkPageBreak(25)
      const prefix = `${toRoman(subIdx + 1)})  `
      const qText = question.question || question.statement || ''
      const qLines = wrap(prefix + qText, contentWidth - (ix - margin) - 10)
      doc.setFontSize(12)
      doc.setFont('helvetica', 'normal')
      qLines.forEach((line: string, i: number) => {
        doc.text(line, ix, yPos + i * 5.5)
      })
      yPos += qLines.length * 5.5 + 3
      if (imageData) addInlineImage(imageData, 55, 42, imageKey)

      if (question.options) {
        const opts: string[] = question.options
        const optIndent = ix + 4
        doc.setFontSize(11)
        if (opts.length <= 3) {
          const colW = (contentWidth - (optIndent - margin)) / opts.length
          opts.forEach((opt: string, oi: number) => {
            const xPos = optIndent + oi * colW
            const boxSize = 4
            doc.setLineWidth(0.3)
            doc.rect(xPos, yPos - boxSize + 1, boxSize, boxSize)
            doc.text(` ${opt}`, xPos + boxSize + 1, yPos)
          })
          yPos += 8
        } else {
          const colW = (contentWidth - (optIndent - margin)) / 2
          opts.forEach((opt: string, oi: number) => {
            const col = oi % 2
            const xPos = optIndent + col * colW
            if (col === 0 && oi > 0) yPos += 7
            const boxSize = 4
            doc.setLineWidth(0.3)
            doc.rect(xPos, yPos - boxSize + 1, boxSize, boxSize)
            const optLines = wrap(` ${opt}`, colW - boxSize - 3)
            optLines.forEach((line: string, li: number) => {
              doc.text(line, xPos + boxSize + 1, yPos + li * 5.5)
            })
          })
          yPos += 8
        }
      }
      yPos += 2
    }

    // Render circle/tick group as horizontal picture grid (like sample Q2: a.m./p.m.)
    // Used when ≥2 items each have an image — renders all items side-by-side in one row
    const addCircleGroupHorizontal = (questions: any[], itemImages: (string | undefined)[]) => {
      const count = questions.length
      const usableW = contentWidth - (ix - margin)
      const cellW   = usableW / count
      const imgH    = 36
      const imgW    = Math.min(cellW - 6, 44)

      checkPageBreak(imgH + 35)

      // Row 1 — images
      for (let i = 0; i < count; i++) {
        const cellX = ix + i * cellW
        const imgX  = cellX + (cellW - imgW) / 2
        doc.setLineWidth(0.3)
        doc.rect(imgX, yPos, imgW, imgH)
        const img = itemImages[i]
        if (img) {
          try { doc.addImage(img, 'JPEG', imgX, yPos, imgW, imgH) }
          catch {
            doc.setFontSize(7); doc.setTextColor(150,150,150)
            doc.text('[img]', imgX + imgW/2, yPos + imgH/2, { align: 'center' })
            doc.setTextColor(0,0,0)
          }
        }
      }
      yPos += imgH + 4

      // Row 2 — roman numeral + question label below each image
      doc.setFontSize(10)
      doc.setFont('helvetica', 'normal')
      let maxLabelH = 0
      for (let i = 0; i < count; i++) {
        const cellX = ix + i * cellW
        const qText = questions[i].question || questions[i].statement || ''
        const label = `${toRoman(i+1)}) ${qText}`
        const lLines = wrap(label, cellW - 4)
        lLines.forEach((line: string, li: number) => {
          doc.text(line, cellX, yPos + li * 4.5)
        })
        maxLabelH = Math.max(maxLabelH, lLines.length * 4.5)
      }
      yPos += maxLabelH + 4

      // Row 3 — options with □ checkboxes (one set per cell)
      const sampleOpts: string[] = questions[0]?.options || []
      if (sampleOpts.length > 0) {
        doc.setFontSize(10)
        const boxSize = 3.5
        for (let i = 0; i < count; i++) {
          const cellX = ix + i * cellW
          const opts: string[] = questions[i].options || sampleOpts
          const optSpacing = (cellW - 4) / opts.length
          opts.forEach((opt: string, oi: number) => {
            const oxPos = cellX + oi * optSpacing
            doc.setLineWidth(0.25)
            doc.rect(oxPos, yPos - boxSize + 1, boxSize, boxSize)
            doc.text(` ${opt}`, oxPos + boxSize + 1, yPos)
          })
        }
        yPos += 9
      }
    }


    // Render Fill in Blanks sub-item — blanks as drawn lines, not underscores
    const addFillInBlanksItem = (question: any, subIdx: number, imageData?: string, imageKey?: string) => {
      checkPageBreak(14)
      if (imageData) addInlineImage(imageData, 55, 42, imageKey)
      const prefix = `${toRoman(subIdx + 1)})  `
      const rawText = question.question || ''
      // Split text at blank markers (___) so we can draw real lines
      const segments = rawText.split(/_{3,}/)
      doc.setFontSize(12)
      doc.setFont('helvetica', 'normal')

      // Measure the prefix width so we can start text correctly
      let xCursor = ix
      const baseY = yPos

      // Render prefix
      doc.text(prefix, xCursor, baseY)
      xCursor += doc.getTextWidth(prefix)

      // Render each text segment with a drawn blank line between segments
      const blankWidth = 38  // mm — wide enough to write a word clearly
      segments.forEach((seg: string, si: number) => {
        // Render text segment
        if (seg) {
          // Check if text overflows line — wrap to next line if needed
          const segWidth = doc.getTextWidth(seg)
          if (xCursor + segWidth > pageWidth - margin) {
            yPos += 7
            xCursor = ix + doc.getTextWidth(prefix) // re-indent to align under text
          }
          doc.text(seg, xCursor, yPos)
          xCursor += doc.getTextWidth(seg)
        }
        // After each segment except the last, draw a blank line
        if (si < segments.length - 1) {
          if (xCursor + blankWidth > pageWidth - margin) {
            yPos += 7
            xCursor = ix + doc.getTextWidth(prefix)
          }
          doc.setLineWidth(0.4)
          doc.line(xCursor + 2, yPos + 1, xCursor + 2 + blankWidth, yPos + 1)
          xCursor += blankWidth + 4
        }
      })

      yPos = baseY + 12  // generous spacing between items
    }

    // Render Match Columns — horizontal picture layout when colA has images (like sample Q3)
    const addMatchColumnsItem = (question: any, subIdx: number, colAImages?: Record<number, string>, colBImages?: Record<number, string>) => {
      const colA: string[] = question.column_a || []
      const colB: string[] = question.column_b || []
      const rows = Math.max(colA.length, colB.length)

      const prefix = `${toRoman(subIdx + 1)})`
      doc.setFontSize(12)
      doc.setFont('helvetica', 'bold')
      doc.text(prefix, ix, yPos)
      yPos += 6

      // ── Horizontal picture layout (when any colA images uploaded) ──────────────
      const allColAHaveImages = rows > 0 && Array.from({ length: rows }, (_, r) => r).every(r => !!colAImages?.[r])
      if (allColAHaveImages && colAImages) {
        const usableW = contentWidth - (ix - margin)
        const cellW   = usableW / rows
        const imgH    = 32
        const imgW    = Math.min(cellW - 6, 38)
        checkPageBreak(imgH + 40)

        // Row 1 — images with number below
        for (let r = 0; r < rows; r++) {
          const cellX = ix + r * cellW
          const imgX  = cellX + (cellW - imgW) / 2
          doc.setLineWidth(0.3)
          doc.rect(imgX, yPos, imgW, imgH)
          try { doc.addImage(colAImages[r], 'JPEG', imgX, yPos, imgW, imgH) }
          catch {
            doc.setFontSize(7); doc.setTextColor(150,150,150)
            doc.text('[img]', imgX + imgW/2, yPos + imgH/2, { align: 'center' })
            doc.setTextColor(0,0,0)
          }
        }
        yPos += imgH + 3

        // Numbers below images
        doc.setFontSize(10); doc.setFont('helvetica', 'bold')
        for (let r = 0; r < rows; r++) {
          const cellX = ix + r * cellW + cellW/2
          doc.text(`${r + 1}`, cellX, yPos, { align: 'center' })
        }
        yPos += 8

        // Separator
        doc.setLineWidth(0.3)
        doc.line(ix, yPos, pageWidth - margin, yPos)
        yPos += 6

        // Column B items in a row (like the labels at the bottom of sample Q3)
        doc.setFontSize(11); doc.setFont('helvetica', 'normal')
        const bCellW = usableW / rows
        colB.forEach((bItem: string, r: number) => {
          const bX = ix + r * bCellW
          const bText = `${String.fromCharCode(97 + r)}) ${bItem}`
          const bLines = wrap(bText, bCellW - 4)
          bLines.forEach((line: string, li: number) => {
            doc.text(line, bX, yPos + li * 5)
          })
        })
        yPos += 8

        // Answer row: 1-___ 2-___ 3-___ ...
        doc.setFontSize(11); doc.setFont('helvetica', 'bold')
        doc.text('Ans:', ix, yPos)
        let ansX = ix + doc.getTextWidth('Ans:  ')
        for (let r = 0; r < rows; r++) {
          doc.text(`${r + 1}.`, ansX, yPos)
          ansX += doc.getTextWidth(`${r + 1}.`)
          doc.setLineWidth(0.3)
          doc.line(ansX + 1, yPos + 1, ansX + 14, yPos + 1)
          ansX += 20
        }
        yPos += 8
        return
      }

      // ── Standard two-column table layout (no images) ─────────────────────────
      const tableLeft = margin + 5
      const colAWidth = contentWidth / 2 - 5
      const colBWidth = contentWidth / 2 - 5
      const colBLeft  = tableLeft + colAWidth + 8

      doc.setFont('helvetica', 'bold'); doc.setFontSize(11)
      doc.text('Column A', tableLeft + colAWidth / 2, yPos, { align: 'center' })
      doc.text('Column B', colBLeft  + colBWidth / 2, yPos, { align: 'center' })
      yPos += 3
      doc.setLineWidth(0.4)
      doc.line(tableLeft, yPos, tableLeft + colAWidth, yPos)
      doc.line(colBLeft,  yPos, colBLeft  + colBWidth, yPos)
      yPos += 5

      // Strip any leading numbering the LLM already included (e.g. "1. Clockwise" → "Clockwise")
      const stripLeadingNum  = (s: string) => s.replace(/^\d+[\.\)]\s*/, '').replace(/^[A-Ea-e][\.\)]\s*/, '')

      doc.setFont('helvetica', 'normal'); doc.setFontSize(11)
      for (let r = 0; r < rows; r++) {
        const aRaw  = colA[r] ? stripLeadingNum(String(colA[r])) : ''
        const bRaw  = colB[r] ? stripLeadingNum(String(colB[r])) : ''
        const aItem = aRaw ? `${r + 1}.  ${aRaw}` : ''
        const bItem = bRaw ? `${String.fromCharCode(65 + r)}.  ${bRaw}` : ''
        const aLines = wrap(aItem, colAWidth - 3)
        const bLines = wrap(bItem, colBWidth - 3)

        // Calculate row height including any images
        const aImgData = colAImages?.[r]
        const bImgData = colBImages?.[r]
        const aImgKey = `obj-match_columns-${subIdx}-colA-${r}`
        const bImgKey = `obj-match_columns-${subIdx}-colB-${r}`
        const aImg = imageStore[aImgKey]
        const bImg = imageStore[bImgKey]
        const aImgH = aImg ? aImg.heightMm : (aImgData ? 20 : 0)
        const bImgH = bImg ? bImg.heightMm : (bImgData ? 20 : 0)
        const rowH = Math.max(aLines.length, bLines.length) * 5 + Math.max(aImgH, bImgH) + (aImgData || bImgData ? 4 : 0)
        checkPageBreak(rowH + 4)

        aLines.forEach((line: string, li: number) => doc.text(line, tableLeft, yPos + li * 5))
        bLines.forEach((line: string, li: number) => doc.text(line, colBLeft,  yPos + li * 5))
        const textH = Math.max(aLines.length, bLines.length) * 5 + 2
        let rowImgY = yPos + textH

        if (aImgData) {
          const imgW = aImg ? aImg.widthMm : 30
          const imgH = aImg ? aImg.heightMm : 20
          try { doc.addImage(aImgData, 'JPEG', tableLeft, rowImgY, imgW, imgH) }
          catch { try { doc.addImage(aImgData, 'PNG', tableLeft, rowImgY, imgW, imgH) } catch {} }
        }
        if (bImgData) {
          const imgW = bImg ? bImg.widthMm : 30
          const imgH = bImg ? bImg.heightMm : 20
          try { doc.addImage(bImgData, 'JPEG', colBLeft, rowImgY, imgW, imgH) }
          catch { try { doc.addImage(bImgData, 'PNG', colBLeft, rowImgY, imgW, imgH) } catch {} }
        }

        yPos += rowH + 2
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
          const prefix = `${toRoman(subIdx + 1)})  `
          const qText = subQ.question || subQ.statement || ''
          const qLines = wrap(prefix + qText, contentWidth - (ix - margin) - 10)
          doc.setFontSize(12)
          doc.setFont('helvetica', 'normal')
          qLines.forEach((line: string, i: number) => {
            doc.text(line, ix, yPos + i * 5.5)
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

          // Answer lines for subjective comprehension (no hint text shown on paper)
          if (typeId === 'unseen_comprehension_subjective') {
            const lineCount = subQ.sentences_required ? Math.min(subQ.sentences_required + 2, 6) : Math.min(Math.ceil((subQ.marks || 1) * 1.5), 5)
            for (let l = 0; l < lineCount; l++) {
              doc.setLineWidth(0.2)
              doc.line(margin, yPos, pageWidth - margin, yPos)
              yPos += 12
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
      const prefix = `${toRoman(subIdx + 1)})  `
      // Set font before getTextWidth so measurement is accurate
      doc.setFontSize(12)
      doc.setFont('helvetica', 'bold')
      const labelText = `${prefix}${word}:`
      doc.text(labelText, ix, yPos)
      doc.setFont('helvetica', 'normal')
      doc.setLineWidth(0.2)
      doc.line(ix + doc.getTextWidth(labelText) + 4, yPos + 1, pageWidth - margin - 5, yPos + 1)
      yPos += 8
    }

    // Render short/long answer sub-item — with "Ans:" prefixed answer lines
    const addAnswerLinesItem = (question: any, subIdx: number, lineCount = 4, imageData?: string, imageKey?: string) => {
      checkPageBreak(lineCount * 12 + 15)
      const prefix = `${toRoman(subIdx + 1)})  `
      const qText = question.question || question.statement || ''
      const qLines = wrap(prefix + qText, contentWidth - (ix - margin) - 10)
      doc.setFontSize(12)
      doc.setFont('helvetica', 'normal')
      qLines.forEach((line: string, i: number) => {
        doc.text(line, ix, yPos + i * 5.5)
      })
      yPos += qLines.length * 5.5 + 4
      if (imageData) addInlineImage(imageData, 55, 42, imageKey)
      // First line has "Ans:" label, rest are plain lines
      for (let l = 0; l < lineCount; l++) {
        checkPageBreak(13)
        doc.setLineWidth(0.2)
        if (l === 0) {
          doc.setFontSize(11)
          doc.setFont('helvetica', 'bold')
          doc.text('Ans:', ix, yPos)
          doc.setFont('helvetica', 'normal')
          doc.line(ix + doc.getTextWidth('Ans:') + 3, yPos + 1, pageWidth - margin, yPos + 1)
        } else {
          doc.line(ix, yPos + 1, pageWidth - margin, yPos + 1)
        }
        yPos += 12
      }
      yPos += 2
    }

    // Render creative writing sub-item (with vocabulary words + lines_required)
    const addCreativeWritingItem = (question: any, subIdx: number) => {
      checkPageBreak(50)
      const prefix = `${toRoman(subIdx + 1)})  `
      // Use prompt (topic) only — skip meta-instructions like "write one sentence"
      const promptText = question.prompt || question.topic || ''
      // Set font BEFORE wrap() so splitTextToSize uses correct character widths
      doc.setFontSize(12)
      doc.setFont('helvetica', 'bold')
      const pLines = wrap(prefix + promptText, contentWidth - (ix - margin) - 12)
      pLines.forEach((line: string, i: number) => {
        doc.text(line, ix, yPos + i * 5.5)
      })
      yPos += pLines.length * 5.5 + 3

      // Show vocabulary words in a bordered box
      const vocabWords: string[] = question.vocabulary_words || []
      if (vocabWords.length > 0) {
        checkPageBreak(14)
        const wbBoxH = 9
        doc.setLineWidth(0.4)
        doc.rect(ix, yPos, contentWidth - (ix - margin), wbBoxH)
        doc.setFontSize(10)
        doc.setFont('helvetica', 'bold')
        doc.text('Word Bank: ', ix + 3, yPos + 6)
        doc.setFont('helvetica', 'normal')
        doc.text(vocabWords.join('   |   '), ix + 3 + doc.getTextWidth('Word Bank: '), yPos + 6)
        yPos += wbBoxH + 4
      }

      // Use lines_required if available, else default to 6
      const linesRequired = question.lines_required || 6
      for (let l = 0; l < linesRequired; l++) {
        checkPageBreak(13)
        doc.setLineWidth(0.2)
        doc.line(margin, yPos, pageWidth - margin, yPos)
        yPos += 12
      }
      yPos += 2
    }

    // Render picture description sub-item
    const addPictureDescriptionItem = (question: any, subIdx: number, imageData?: string, imageKey?: string) => {
      checkPageBreak(60)
      const prefix = `${toRoman(subIdx + 1)})  `
      const desc = question.instruction || 'Look at the picture and describe it.'
      const dLines = wrap(prefix + desc, contentWidth - (ix - margin) - 10)
      doc.setFontSize(12)
      doc.setFont('helvetica', 'normal')
      dLines.forEach((line: string, i: number) => {
        doc.text(line, ix, yPos + i * 5.5)
      })
      yPos += dLines.length * 5.5 + 3

      // Image or placeholder box — use per-image dimensions if available
      const attachment = imageKey ? imageStore[imageKey] : undefined
      const imgBoxW = attachment?.widthMm ?? 70
      const imgBoxH = attachment?.heightMm ?? 50
      const align = attachment?.alignment ?? 'center'
      let imgX: number
      if (align === 'left') imgX = margin
      else if (align === 'right') imgX = pageWidth - margin - imgBoxW
      else imgX = margin + (contentWidth - imgBoxW) / 2
      doc.setLineWidth(0.5)
      doc.rect(imgX, yPos, imgBoxW, imgBoxH)

      if (imageData) {
        try {
          doc.addImage(imageData, 'JPEG', imgX, yPos, imgBoxW, imgBoxH)
        } catch {
          try { doc.addImage(imageData, 'PNG', imgX, yPos, imgBoxW, imgBoxH) } catch {
            doc.setFontSize(8)
            doc.setTextColor(150, 150, 150)
            doc.text('[Picture]', imgX + imgBoxW / 2, yPos + imgBoxH / 2, { align: 'center' })
            doc.setTextColor(0, 0, 0)
          }
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
        doc.line(margin, yPos, pageWidth - margin, yPos)
        yPos += 12
      }
      yPos += 3
    }

    // Render label figures sub-item (instruction text + image box per sub-item)
    const addLabelFiguresItem = (_question: any, subIdx: number, imageData?: string, imageKey?: string) => {
      checkPageBreak(60)
      const prefix = `${toRoman(subIdx + 1)})`
      // Only show the sub-item number — no repeated instruction text
      doc.setFontSize(12)
      doc.setFont('helvetica', 'bold')
      doc.text(prefix, ix, yPos)
      yPos += 6

      // Image box — use per-image dimensions if available
      const attachment = imageKey ? imageStore[imageKey] : undefined
      const imgBoxW = attachment?.widthMm ?? 70
      const imgBoxH = attachment?.heightMm ?? 50
      const align = attachment?.alignment ?? 'center'
      let imgX: number
      if (align === 'left') imgX = margin
      else if (align === 'right') imgX = pageWidth - margin - imgBoxW
      else imgX = margin + (contentWidth - imgBoxW) / 2
      doc.setLineWidth(0.5)
      doc.rect(imgX, yPos, imgBoxW, imgBoxH)

      if (imageData) {
        try {
          doc.addImage(imageData, 'JPEG', imgX, yPos, imgBoxW, imgBoxH)
        } catch {
          try { doc.addImage(imageData, 'PNG', imgX, yPos, imgBoxW, imgBoxH) } catch {
            doc.setFontSize(8)
            doc.setTextColor(150, 150, 150)
            doc.text('[Figure]', imgX + imgBoxW / 2, yPos + imgBoxH / 2, { align: 'center' })
            doc.setTextColor(0, 0, 0)
          }
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
      doc.line(margin, yPos, pageWidth - margin, yPos)
      yPos += 10
    }

    // Render a drawing exercise sub-item (question text + empty drawing box)
    const addDrawingExerciseItem = (question: any, subIdx: number, boxW = 110, boxH = 40) => {
      checkPageBreak(boxH + 25)
      const prefix = `${toRoman(subIdx + 1)})  `
      const qText = question.question || question.instruction || ''
      doc.setFontSize(12)
      doc.setFont('helvetica', 'normal')
      const qLines = wrap(prefix + qText, contentWidth - (ix - margin) - 10)
      qLines.forEach((line: string, i: number) => {
        doc.text(line, ix, yPos + i * 5.5)
      })
      yPos += qLines.length * 5.5 + 5

      // Rectangular drawing box (wide, not square)
      const bx = margin + (contentWidth - boxW) / 2
      doc.setLineWidth(0.5)
      doc.rect(bx, yPos, boxW, boxH)
      doc.setFontSize(8)
      doc.setTextColor(180, 180, 180)
      doc.text('Draw here', bx + boxW / 2, yPos + boxH / 2, { align: 'center' })
      doc.setTextColor(0, 0, 0)
      yPos += boxH + 12
    }

    // Render a work-space box for calculation questions (question text + ruled work area)
    // Render real-life story problem: shows context sentence, then question, then answer lines
    const addStoryProblemItem = (question: any, subIdx: number) => {
      checkPageBreak(50)
      const prefix = `${toRoman(subIdx + 1)})  `
      doc.setFontSize(12)

      const context = question.context || ''
      const qText = question.question || ''

      // Render prefix + context
      if (context) {
        doc.setFontSize(12)
        doc.setFont('helvetica', 'italic')
        const ctxLines = wrap(prefix + context, contentWidth - 10)
        ctxLines.forEach((line: string, i: number) => {
          doc.text(line, ix, yPos + i * 5.5)
        })
        yPos += ctxLines.length * 5.5 + 1

        // Show question on next line if it adds new information
        if (qText && !context.toLowerCase().includes(qText.toLowerCase().slice(0, 20))) {
          doc.setFont('helvetica', 'bold')
          const qLines = wrap(qText, contentWidth - 10)
          qLines.forEach((line: string, i: number) => {
            doc.text(line, ix + 5, yPos + i * 5.5)
          })
          yPos += qLines.length * 5.5 + 2
        } else {
          yPos += 2
        }
      } else {
        doc.setFontSize(12)
        doc.setFont('helvetica', 'normal')
        const qLines = wrap(prefix + qText, contentWidth - 10)
        qLines.forEach((line: string, i: number) => {
          doc.text(line, ix, yPos + i * 5.5)
        })
        yPos += qLines.length * 5.5 + 2
      }

      // Structured workspace using solution_steps — filter out any diagram-related steps
      const solutionSteps: string[] = (question.solution_steps || [])
        .filter((s: string) => !s.toLowerCase().includes('diagram') && !s.toLowerCase().includes('count the turn'))
      if (solutionSteps.length > 0) {
        checkPageBreak(solutionSteps.length * 14 + 5)
        solutionSteps.forEach((stepLabel: string) => {
          checkPageBreak(14)
          doc.setFontSize(11)
          doc.setFont('helvetica', 'bold')
          doc.text(stepLabel, ix, yPos)
          doc.setLineWidth(0.2)
          doc.line(ix + doc.getTextWidth(stepLabel) + 4, yPos + 1, pageWidth - margin, yPos + 1)
          yPos += 12
        })
      } else {
        for (let l = 0; l < 4; l++) {
          checkPageBreak(13)
          doc.setLineWidth(0.2)
          doc.line(margin, yPos, pageWidth - margin, yPos)
          yPos += 12
        }
      }
      yPos += 3
    }

    const addWorkSpaceItem = (question: any, subIdx: number, workLines = 5) => {
      checkPageBreak(workLines * 8 + 20)
      const prefix = `${toRoman(subIdx + 1)})  `
      const qText = question.question || question.statement || ''
      doc.setFontSize(12)
      doc.setFont('helvetica', 'normal')
      const qLines = wrap(prefix + qText, contentWidth - (ix - margin) - 10)
      qLines.forEach((line: string, i: number) => {
        doc.text(line, ix, yPos + i * 5.5)
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
      yPos += wsH + 12
    }

    // Render complete sentences sub-item
    const addCompleteSentencesItem = (sent: any, subIdx: number) => {
      checkPageBreak(10)
      const prefix = `${toRoman(subIdx + 1)})  `
      const isObj = typeof sent === 'object' && sent !== null
      const text = isObj ? (sent.incomplete || sent.sentence || '') : String(sent || '')
      const qLines = wrap(prefix + text, contentWidth - (ix - margin) - 10)
      doc.setFontSize(12)
      doc.setFont('helvetica', 'normal')
      qLines.forEach((line: string, i: number) => {
        doc.text(line, ix, yPos + i * 5.5)
      })
      yPos += qLines.length * 5.5 + 3
    }

    // Render rearrange sentences sub-item
    const addRearrangeSentencesItem = (question: any, subIdx: number) => {
      checkPageBreak(15)
      const prefix = `${toRoman(subIdx + 1)})  `
      // No verbose instruction — Q header label is sufficient
      const sentences: string[] = question.sentences || []
      doc.setFontSize(12)
      doc.setFont('helvetica', 'normal')

      // If sentences list, show them numbered
      if (sentences.length > 0) {
        const introLines = wrap(prefix, contentWidth - (ix - margin) - 10)
        introLines.forEach((line: string, i: number) => {
          doc.text(line, ix, yPos + i * 5.5)
        })
        yPos += introLines.length * 5.5 + 1
        doc.setFontSize(11)
        sentences.forEach((sentence, si) => {
          checkPageBreak(6)
          const sLines = wrap(`${si + 1}. ${sentence}`, contentWidth - (ix - margin) - 15)
          sLines.forEach((line: string, li: number) => {
            doc.text(line, ix + 5, yPos + li * 5)
          })
          yPos += sLines.length * 5 + 2
        })
      }
      yPos += 2
    }

    // Render grammar correction group (sentence list with blank correction lines)
    const addGrammarCorrectionItem = (question: any, _subIdx: number) => {
      checkPageBreak(12)
      const sentences: any[] = question.sentences || []
      if (sentences.length === 0) return

      // No instruction text — Q header label is sufficient
      // Each incorrect sentence + blank correction line
      sentences.forEach((sent: any, si: number) => {
        checkPageBreak(16)
        const incorrectText = `${toRoman(si + 1)})  ${sent.incorrect || ''}`
        const sLines = wrap(incorrectText, contentWidth - (ix - margin) - 10)
        doc.setFontSize(12)
        doc.setFont('helvetica', 'normal')
        sLines.forEach((line: string, li: number) => {
          doc.text(line, ix, yPos + li * 5.5)
        })
        yPos += sLines.length * 5.5 + 2
        // Correction line
        doc.setLineWidth(0.2)
        doc.line(ix, yPos, pageWidth - margin - 5, yPos)
        yPos += 10
      })
      yPos += 2
    }

    // Render parts of speech group (sentences with identification line)
    const addPartsOfSpeechItem = (question: any, _subIdx: number) => {
      checkPageBreak(12)
      const sentences: any[] = question.sentences || []
      if (sentences.length === 0) return

      // No instruction text — Q header label is sufficient
      sentences.forEach((sent: any, si: number) => {
        checkPageBreak(16)
        const sentText = `${toRoman(si + 1)})  ${sent.sentence || ''}`
        const sLines = wrap(sentText, contentWidth - (ix - margin) - 10)
        doc.setFontSize(12)
        doc.setFont('helvetica', 'normal')
        sLines.forEach((line: string, li: number) => {
          doc.text(line, ix, yPos + li * 5.5)
        })
        yPos += sLines.length * 5.5 + 2
        // Answer line
        doc.setLineWidth(0.2)
        doc.line(ix, yPos, pageWidth - margin - 5, yPos)
        yPos += 10
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
      // Section A header removed — continuous flow per teacher feedback

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
          addGroupHeader(typeId, typeMarks, buildMarksDisplay(filteredQs, typeMarks))
          addComprehensionGroup(filteredQs, typeId)
          continue
        }

        // Special handling: match_columns rendered per question as full table
        if (typeId === 'match_columns') {
          addGroupHeader(typeId, typeMarks, buildMarksDisplay(filteredQs, typeMarks))
          filteredQs.forEach((q, subIdx) => {
            const origIdx = filteredIndices[subIdx]
            const colAImgs: Record<number, string> = {}
            const colBImgs: Record<number, string> = {}
            const colALen = (q.column_a || []).length
            const colBLen = (q.column_b || []).length
            for (let r = 0; r < colALen; r++) {
              const key = `obj-match_columns-${origIdx}-colA-${r}`
              if (imageStore[key]) colAImgs[r] = imageStore[key].dataUrl
            }
            for (let r = 0; r < colBLen; r++) {
              const key = `obj-match_columns-${origIdx}-colB-${r}`
              if (imageStore[key]) colBImgs[r] = imageStore[key].dataUrl
            }
            addMatchColumnsItem(
              q, subIdx,
              Object.keys(colAImgs).length > 0 ? colAImgs : undefined,
              Object.keys(colBImgs).length > 0 ? colBImgs : undefined
            )
          })
          continue
        }

        // Special handling: rearrange_sentences
        if (typeId === 'rearrange_sentences') {
          addGroupHeader(typeId, typeMarks, buildMarksDisplay(filteredQs, typeMarks))
          filteredQs.forEach((q, subIdx) => addRearrangeSentencesItem(q, subIdx))
          continue
        }

        addGroupHeader(typeId, typeMarks, buildMarksDisplay(filteredQs, typeMarks))

        // circle_correct_answer: use horizontal grid if all items have images (like sample Q2 a.m./p.m.)
        if (typeId === 'circle_correct_answer') {
          const circleImgs = filteredIndices.map(oi => imageStore[`obj-circle_correct_answer-${oi}`]?.dataUrl)
          const allHaveImages = filteredQs.length >= 2 && circleImgs.every(Boolean)
          if (allHaveImages) {
            addCircleGroupHorizontal(filteredQs, circleImgs)
          } else {
            filteredQs.forEach((q, subIdx) => {
              const circleImgId = `obj-circle_correct_answer-${filteredIndices[subIdx]}`
              addCircleItem(q, subIdx, circleImgs[subIdx], circleImgId)
            })
          }
          yPos += 4
          continue
        }

        // True/False: show T / F column headers once before items
        if (typeId === 'true_false') addTrueFalseColumnHeaders()

        filteredQs.forEach((question, subIdx) => {
          switch (typeId) {
            case 'true_false': {
              const tfImgId = `obj-true_false-${filteredIndices[subIdx]}`
              addTrueFalseItem(question.statement || question.question || '', subIdx, imageStore[tfImgId]?.dataUrl, tfImgId)
              break
            }
            case 'fill_in_blanks': {
              const fibImgId = `obj-fill_in_blanks-${filteredIndices[subIdx]}`
              addFillInBlanksItem(question, subIdx, imageStore[fibImgId]?.dataUrl, fibImgId)
              break
            }
            case 'mcq': {
              const mcqImgId = `obj-mcq-${filteredIndices[subIdx]}`
              addMCQItem(question, subIdx, imageStore[mcqImgId]?.dataUrl, mcqImgId)
              break
            }
            case 'circle_correct_answer': {
              const circleImgId = `obj-circle_correct_answer-${filteredIndices[subIdx]}`
              addCircleItem(question, subIdx, imageStore[circleImgId]?.dataUrl, circleImgId)
              break
            }
            case 'fill_in_blanks_from_word_bank': {
              // Word bank in a bordered box — show once before first item
              const wordBank: string[] = question.word_bank || []
              if (wordBank.length > 0 && subIdx === 0) {
                checkPageBreak(14)
                const wbLabel = 'Word Bank:  '
                const wbText = wordBank.join('     ')
                const wbContent = wbLabel + wbText
                const wbLines = wrap(wbContent, contentWidth - 10)
                const wbBoxH = wbLines.length * 5.5 + 6
                doc.setLineWidth(0.4)
                doc.rect(ix, yPos, contentWidth - (ix - margin), wbBoxH)
                doc.setFontSize(11)
                doc.setFont('helvetica', 'bold')
                doc.text('Word Bank:', ix + 3, yPos + 5)
                doc.setFont('helvetica', 'normal')
                const wordsText = wordBank.join('     ')
                const wordsX = ix + 3 + doc.getTextWidth('Word Bank:  ')
                doc.text(wordsText, wordsX, yPos + 5)
                yPos += wbBoxH + 4
              }
              addFillInBlanksItem({ question: question.blanks_sentence, answer: question.answer }, subIdx)
              break
            }
            case 'label_figures': {
              const imgId = `obj-label_figures-${filteredIndices[subIdx]}`
              addLabelFiguresItem(question, subIdx, imageStore[imgId]?.dataUrl, imgId)
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

        yPos += 7
      }
    }

    // ───────────────────────────────────────────────
    // SECTION B: SUBJECTIVE QUESTIONS
    // ───────────────────────────────────────────────
    if (exam.exam_content?.subjective) {
      // Section B header removed — continuous flow per teacher feedback

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
          addGroupHeader(typeId, typeMarks, buildMarksDisplay(filteredQs, typeMarks))
          addComprehensionGroup(filteredQs, typeId)
          continue
        }

        addGroupHeader(typeId, typeMarks, buildMarksDisplay(filteredQs, typeMarks))

        filteredQs.forEach((question, subIdx) => {
          switch (typeId) {
            case 'make_sentences': {
              const words: any[] = question.words || []
              words.forEach((wordItem, wi) => addMakeSentencesItem(wordItem, wi))
              break
            }
            case 'complete_sentences': {
              // No instruction text — Q header label is sufficient
              const sentences: any[] = question.sentences || []
              sentences.forEach((sent, si) => addCompleteSentencesItem(sent, si))
              break
            }
            case 'unseen_creative_writing':
              addCreativeWritingItem(question, subIdx)
              break
            case 'picture_description': {
              const imgId = `subj-picture_description-${filteredIndices[subIdx]}`
              addPictureDescriptionItem(question, subIdx, imageStore[imgId]?.dataUrl, imgId)
              break
            }
            case 'label_figures': {
              const imgId = `subj-label_figures-${filteredIndices[subIdx]}`
              addLabelFiguresItem(question, subIdx, imageStore[imgId]?.dataUrl, imgId)
              break
            }
            case 'short_answer': {
              const saImgId = `subj-short_answer-${filteredIndices[subIdx]}`
              addAnswerLinesItem(question, subIdx, 4, imageStore[saImgId]?.dataUrl, saImgId)
              break
            }
            case 'long_answer': {
              const laImgId = `subj-long_answer-${filteredIndices[subIdx]}`
              addAnswerLinesItem(question, subIdx, 7, imageStore[laImgId]?.dataUrl, laImgId)
              break
            }
            case 'practice_questions_by_topic':
              addWorkSpaceItem(question, subIdx, question.requires_drawing ? 6 : 5)
              break
            case 'real_life_story_problems':
              addStoryProblemItem(question, subIdx)
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

        yPos += 7
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
      doc.text(`Subject: ${exam.subject}  |  Class: ${gradeToRoman(String(exam.grade || '').replace(/^class\s*/i, ''))}  |  Date: ${new Date().toLocaleDateString()}`, pageWidth / 2, yPos, { align: 'center' })
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
        if (typeof answer === 'boolean') return answer ? 'True' : 'False'
        if (answer === null || answer === undefined || answer === '') return 'N/A'
        if (typeof answer === 'string' && answer.toLowerCase() === 'true') return 'True'
        if (typeof answer === 'string' && answer.toLowerCase() === 'false') return 'False'
        if (typeof answer === 'object' && !Array.isArray(answer)) {
          return Object.entries(answer).map(([k, v]) => `${k} -> ${v}`).join(', ')
        }
        if (Array.isArray(answer)) return answer.join(', ')
        return String(answer)
      }

      // Objective answers
      if (exam.exam_content?.objective) {
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
                const ansText = `  ${toRoman(si + 1)})${renderAKAnswer(sq.answer)}  (${formatMarks(sq.marks || 0)} marks)`
                doc.text(ansText, margin + 5, yPos)
                yPos += 5.5
              })
            } else {
              const ansText = `  ${toRoman(subIdx + 1)}) ${renderAKAnswer(q.answer)}  (${formatMarks(q.marks || 0)} marks)`
              doc.text(ansText, margin + 5, yPos)
              yPos += 5.5
            }
          })
          yPos += 3
        }
      }

      // Subjective answers
      if (exam.exam_content?.subjective) {
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
                const ansLines = wrap(`  ${toRoman(si + 1)})${sq.answer || 'N/A'}  (${formatMarks(sq.marks || 0)} marks)`, contentWidth - 10)
                ansLines.forEach((line: string, li: number) => doc.text(line, margin + 5, yPos + li * 5))
                yPos += ansLines.length * 5 + 2
              })
            } else if (typeId === 'make_sentences') {
              const words: any[] = q.words || []
              words.forEach((w: any, wi: number) => {
                const word = typeof w === 'object' ? w.word : w
                const sampleAns = typeof w === 'object' && w.answer ? w.answer : '(student\'s own sentence)'
                checkPageBreak(6)
                doc.text(`  ${toRoman(wi + 1)}) ${word}: ${sampleAns}`, margin + 5, yPos)
                yPos += 5.5
              })
            } else if (typeId === 'grammar_correction') {
              const sentences: any[] = q.sentences || []
              sentences.forEach((sent: any, si: number) => {
                checkPageBreak(6)
                const ansLines = wrap(`  ${toRoman(si + 1)})${sent.answer || 'N/A'}`, contentWidth - 10)
                ansLines.forEach((line: string, li: number) => doc.text(line, margin + 5, yPos + li * 5))
                yPos += ansLines.length * 5 + 1.5
              })
            } else if (typeId === 'parts_of_speech') {
              const sentences: any[] = q.sentences || []
              sentences.forEach((sent: any, si: number) => {
                checkPageBreak(6)
                const ansLines = wrap(`  ${toRoman(si + 1)})${sent.answer || 'N/A'}`, contentWidth - 10)
                ansLines.forEach((line: string, li: number) => doc.text(line, margin + 5, yPos + li * 5))
                yPos += ansLines.length * 5 + 1.5
              })
            } else {
              const ans = q.sample_answer || q.answer || 'N/A'
              const prefix = `  ${toRoman(subIdx + 1)}) `
              const ansLines = wrap(`${prefix}${ans}  (${q.marks || 0} marks)`, contentWidth - 10)
              ansLines.forEach((line: string, li: number) => doc.text(line, margin + 5, yPos + li * 5))
              yPos += ansLines.length * 5 + 2
            }
          })
          yPos += 3
        }
      }
    }

    // Add "Page X of Y" to every page
    const totalPages = doc.getNumberOfPages()
    for (let p = 1; p <= totalPages; p++) {
      doc.setPage(p)
      doc.setFontSize(9)
      doc.setFont('helvetica', 'normal')
      doc.setTextColor(100, 100, 100)
      doc.text(`Page ${p} of ${totalPages}`, pageWidth / 2, pageHeight - 8, { align: 'center' })
      doc.setTextColor(0, 0, 0)
    }

    doc.save(filename)
    console.log('✅ PDF generated successfully:', filename)
  } catch (error) {
    console.error('❌ PDF generation failed:', error)
    throw new Error('Failed to generate PDF. Please try again.')
  }
}
