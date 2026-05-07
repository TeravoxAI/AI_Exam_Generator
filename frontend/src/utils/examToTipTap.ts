/**
 * Converts exam JSON → TipTap document JSON.
 * Layout matches sample papers exactly:
 *  - Q header bold left, marks right on same line
 *  - Items: i) ii) iii) indented (NOT roman with parens)
 *  - True/False: □ T  □ F inline right of statement — no instruction text
 *  - Match columns: two plain text columns, no table boxes
 *  - Drawing exercise: bordered div via custom class
 *  - Circle correct answer: options each on own line a) b) c)
 *  - Image placeholders: bordered rect placeholder
 */

const toRoman = (n: number): string => {
  const r = ['i','ii','iii','iv','v','vi','vii','viii','ix','x','xi','xii','xiii','xiv','xv','xvi','xvii','xviii','xix','xx']
  return n >= 1 && n <= 20 ? r[n - 1] : String(n)
}

const gradeToRoman = (g: string): string => {
  const n = parseInt(g)
  if (isNaN(n)) return g
  const r = ['I','II','III','IV','V','VI','VII','VIII','IX','X','XI','XII']
  return n >= 1 && n <= 12 ? r[n - 1] : g
}


const stripNum = (s: string) =>
  s.replace(/^\d+[\.\)]\s*/, '').replace(/^[A-Ea-e][\.\)]\s*/, '')

// ── Node helpers ──────────────────────────────────────────────────────────────

// Plain paragraph
const p = (text: string, bold = false, italic = false): any => ({
  type: 'paragraph',
  content: text ? [{
    type: 'text', text,
    ...(bold || italic ? { marks: [...(bold ? [{ type: 'bold' }] : []), ...(italic ? [{ type: 'italic' }] : [])] } : {}),
  }] : [],
})

// Paragraph with mixed inline content (bold label + normal text on same line)
const pMixed = (...parts: Array<{ text: string; bold?: boolean; italic?: boolean }>): any => ({
  type: 'paragraph',
  content: parts.filter(pt => pt.text).map(pt => ({
    type: 'text', text: pt.text,
    ...(pt.bold || pt.italic ? { marks: [...(pt.bold ? [{ type: 'bold' }] : []), ...(pt.italic ? [{ type: 'italic' }] : [])] } : {}),
  })),
})

const blank = (): any => p('')

// Q header: "Q.1.  Fill in the blanks.    [0.5×4= /2]"
const qHeader = (qNum: number, label: string, marksStr: string): any => ({
  type: 'paragraph',
  content: [
    { type: 'text', text: `Q.${qNum}.  ${label}`, marks: [{ type: 'bold' }] },
    { type: 'text', text: `    ${marksStr}`, marks: [{ type: 'bold' }] },
  ],
  attrs: { textAlign: 'left', class: 'q-header' },
})

// Indented item line: "    i)  text"
const item = (idx: number, text: string, bold = false): any =>
  p(`    ${toRoman(idx + 1)})  ${text}`, bold)

// Blank line placeholder (for answer lines) — underscored line
const ansLine = (prefix = ''): any =>
  p(`${prefix}${'_'.repeat(60)}`)

// Spacer between question groups (3 blank lines = ~60px gap for page-break snapping)
const qSpacer = (): any[] => [blank(), blank(), blank()]

// Image placeholder box — rendered as a special paragraph with class + data-qid
const imgPlaceholder = (label = 'Insert image here', qid = ''): any => ({
  type: 'paragraph',
  attrs: { class: 'img-placeholder', 'data-qid': qid || null },
  content: [{ type: 'text', text: qid ? `[ Upload image for this question ]` : `[ ${label} ]`, marks: [{ type: 'italic' }] }],
})

// Drawing box placeholder
const drawingBox = (instruction = ''): any => ({
  type: 'paragraph',
  attrs: { class: 'drawing-box' },
  content: instruction ? [{ type: 'text', text: instruction }] : [],
})

// ── Question type serializers ─────────────────────────────────────────────────

function serializeTrueFalse(questions: any[], marks: number, qNum: number): any[] {
  const nodes: any[] = []
  nodes.push(qHeader(qNum, 'Write T for True and F for False.', `[${marks > 0 ? `0.5×${questions.length}= /${marks}` : `   /${marks}`}]`))
  questions.forEach((q, i) => {
    const stmt = q.statement || q.question || ''
    nodes.push({ type: 'trueFalseRow', attrs: { idx: i, text: stmt } })
  })
  nodes.push(...qSpacer())
  return nodes
}

function serializeMCQ(questions: any[], marks: number, qNum: number): any[] {
  const nodes: any[] = []
  const perItem = questions.length > 0 ? questions[0].marks : 0
  const uniform = perItem && questions.every((q: any) => q.marks === perItem)
  const mStr = uniform ? `[${perItem}×${questions.length}= /${marks}]` : `[   /${marks}]`
  nodes.push(qHeader(qNum, 'Choose the correct answer.', mStr))
  questions.forEach((q, i) => {
    nodes.push(item(i, q.question || q.statement || ''))
    const opts = q.options || []
    opts.forEach((opt: string, oi: number) => {
      nodes.push(p(`        ${String.fromCharCode(97 + oi)})  ${opt}`))
    })
    nodes.push(blank())
  })
  nodes.push(...qSpacer())
  return nodes
}

function serializeFillInBlanks(questions: any[], marks: number, qNum: number): any[] {
  const nodes: any[] = []
  const perItem = questions.length > 0 ? questions[0].marks : 0
  const uniform = perItem && questions.every((q: any) => q.marks === perItem)
  const mStr = uniform ? `[${perItem}×${questions.length}= /${marks}]` : `[   /${marks}]`
  nodes.push(qHeader(qNum, 'Fill in the blanks.', mStr))
  questions.forEach((q, i) => {
    const text = (q.question || '').replace(/_{3,}/g, '____________')
    nodes.push(item(i, text))
  })
  nodes.push(...qSpacer())
  return nodes
}

function serializeFillInBlanksWordBank(questions: any[], marks: number, qNum: number): any[] {
  const nodes: any[] = []
  const perItem = questions.length > 0 ? questions[0].marks : 0
  const uniform = perItem && questions.every((q: any) => q.marks === perItem)
  const mStr = uniform ? `[${perItem}×${questions.length}= /${marks}]` : `[   /${marks}]`
  nodes.push(qHeader(qNum, 'Fill in the blanks using the word bank.', mStr))
  const wb: string[] = questions[0]?.word_bank || []
  if (wb.length > 0) {
    nodes.push(pMixed({ text: '    Word Bank:  ', bold: true }, { text: wb.join('   |   ') }))
  }
  questions.forEach((q, i) => {
    const text = (q.blanks_sentence || '').replace(/_{3,}/g, '____________')
    nodes.push(item(i, text))
  })
  nodes.push(...qSpacer())
  return nodes
}

function matchTable(colA: string[], colB: string[]): any {
  const rows = Math.max(colA.length, colB.length)
  const tableRows: any[] = [
    // Header row
    {
      type: 'tableRow',
      content: [
        { type: 'tableHeader', content: [{ type: 'paragraph', content: [{ type: 'text', text: 'Column A', marks: [{ type: 'bold' }] }] }] },
        { type: 'tableHeader', content: [{ type: 'paragraph', content: [{ type: 'text', text: 'Column B', marks: [{ type: 'bold' }] }] }] },
      ],
    },
  ]
  for (let r = 0; r < rows; r++) {
    const aText = colA[r] ? `${r + 1}.  ${stripNum(String(colA[r]))}` : ''
    const bText = colB[r] ? `${String.fromCharCode(65 + r)}.  ${stripNum(String(colB[r]))}` : ''
    tableRows.push({
      type: 'tableRow',
      content: [
        { type: 'tableCell', content: [{ type: 'paragraph', content: aText ? [{ type: 'text', text: aText }] : [] }] },
        { type: 'tableCell', content: [{ type: 'paragraph', content: bText ? [{ type: 'text', text: bText }] : [] }] },
      ],
    })
  }
  return { type: 'table', content: tableRows }
}

function serializeMatchColumns(questions: any[], marks: number, qNum: number): any[] {
  const nodes: any[] = []
  const perItem = questions.length > 0 ? questions[0].marks : 0
  const uniform = perItem && questions.every((q: any) => q.marks === perItem)
  const mStr = uniform ? `[${perItem}×${questions.length}= /${marks}]` : `[   /${marks}]`
  nodes.push(qHeader(qNum, 'Match the columns.', mStr))

  questions.forEach((q, qi) => {
    if (questions.length > 1) nodes.push(item(qi, '', true))
    const colA: string[] = q.column_a || []
    const colB: string[] = q.column_b || []
    nodes.push(matchTable(colA, colB))
    nodes.push(...qSpacer())
  })
  return nodes
}

function serializeCircleAnswer(questions: any[], marks: number, qNum: number): any[] {
  const nodes: any[] = []
  const perItem = questions.length > 0 ? questions[0].marks : 0
  const uniform = perItem && questions.every((q: any) => q.marks === perItem)
  const mStr = uniform ? `[${perItem}×${questions.length}= /${marks}]` : `[   /${marks}]`
  nodes.push(qHeader(qNum, 'Circle the correct answer.', mStr))
  questions.forEach((q, i) => {
    nodes.push(item(i, q.question || q.statement || ''))
    const opts = q.options || []
    opts.forEach((opt: string, oi: number) => {
      nodes.push(p(`        ${String.fromCharCode(97 + oi)})  ${opt}`))
    })
    nodes.push(blank())
  })
  nodes.push(...qSpacer())
  return nodes
}

function serializeShortAnswer(questions: any[], marks: number, qNum: number, lineCount = 3): any[] {
  const nodes: any[] = []
  const perItem = questions.length > 0 ? questions[0].marks : 0
  const uniform = perItem && questions.every((q: any) => q.marks === perItem)
  const mStr = uniform ? `[${perItem}×${questions.length}= /${marks}]` : `[   /${marks}]`
  nodes.push(qHeader(qNum, 'Answer the following questions.', mStr))
  questions.forEach((q, i) => {
    nodes.push(item(i, q.question || q.statement || ''))
    nodes.push(ansLine('    Ans:  '))
    for (let l = 1; l < lineCount; l++) nodes.push(ansLine('           '))
    nodes.push(blank())
  })
  nodes.push(...qSpacer())
  return nodes
}

function serializeLongAnswer(questions: any[], marks: number, qNum: number): any[] {
  const nodes: any[] = []
  nodes.push(qHeader(qNum, 'Answer the following questions in detail.', `[   /${marks}]`))
  questions.forEach((q, i) => {
    nodes.push(item(i, q.question || q.statement || ''))
    nodes.push(ansLine('    Ans:  '))
    for (let l = 1; l < 6; l++) nodes.push(ansLine('           '))
    nodes.push(blank())
  })
  nodes.push(...qSpacer())
  return nodes
}

function serializeMakeSentences(questions: any[], marks: number, qNum: number): any[] {
  const nodes: any[] = []
  nodes.push(qHeader(qNum, 'Make sentences using the following words.', `[   /${marks}]`))
  questions.forEach((q) => {
    const words: any[] = q.words || []
    words.forEach((w, wi) => {
      const word = typeof w === 'object' ? w.word : w
      nodes.push(pMixed({ text: `    ${toRoman(wi + 1)})  `, bold: false }, { text: word, bold: true }, { text: ':  ' + '_'.repeat(48) }))
    })
    nodes.push(blank())
  })
  nodes.push(...qSpacer())
  return nodes
}

function serializeCompleteSentences(questions: any[], marks: number, qNum: number): any[] {
  const nodes: any[] = []
  nodes.push(qHeader(qNum, 'Complete the sentences.', `[   /${marks}]`))
  questions.forEach((q) => {
    const sents: any[] = q.sentences || []
    sents.forEach((s, si) => {
      const text = typeof s === 'object' ? (s.incomplete || s.sentence || '') : String(s)
      nodes.push(item(si, text.replace(/_{3,}/g, '____________')))
    })
    nodes.push(blank())
  })
  nodes.push(...qSpacer())
  return nodes
}

function serializeCreativeWriting(questions: any[], marks: number, qNum: number): any[] {
  const nodes: any[] = []
  nodes.push(qHeader(qNum, 'Write a paragraph on the following topic.', `[   /${marks}]`))
  questions.forEach((q, i) => {
    const prompt = q.prompt || q.topic || ''
    nodes.push(item(i, prompt, true))
    const vocab: string[] = q.vocabulary_words || []
    if (vocab.length > 0) {
      nodes.push(pMixed({ text: '        Word Bank:  ', bold: true }, { text: vocab.join('   |   ') }))
    }
    const lines = q.lines_required || 6
    for (let l = 0; l < lines; l++) nodes.push(ansLine('    '))
    nodes.push(blank())
  })
  nodes.push(...qSpacer())
  return nodes
}

function serializeComprehension(questions: any[], marks: number, qNum: number, typeId: string): any[] {
  const nodes: any[] = []
  nodes.push(qHeader(qNum, 'Read the passage and answer the questions.', `[   /${marks}]`))
  questions.forEach((q) => {
    if (q.passage) {
      nodes.push(p('    Passage:', true))
      nodes.push(p(`    ${q.passage}`, false, true))
      nodes.push(blank())
    }
    const subQs: any[] = q.sub_questions || []
    subQs.forEach((sq, si) => {
      nodes.push(item(si, sq.question || ''))
      if (sq.options) {
        sq.options.forEach((o: string, oi: number) => {
          nodes.push(p(`        ${String.fromCharCode(97 + oi)})  ${o}`))
        })
      }
      if (typeId === 'unseen_comprehension_subjective') {
        nodes.push(ansLine('    Ans:  '))
        nodes.push(ansLine('           '))
      }
      nodes.push(blank())
    })
  })
  nodes.push(...qSpacer())
  return nodes
}

function serializeRearrange(questions: any[], marks: number, qNum: number): any[] {
  const nodes: any[] = []
  nodes.push(qHeader(qNum, 'Rearrange the sentences.', `[   /${marks}]`))
  questions.forEach((q, i) => {
    nodes.push(item(i, '', true))
    const sents: string[] = q.sentences || []
    sents.forEach((s, si) => nodes.push(p(`        ${si + 1}.  ${s}`)))
    nodes.push(ansLine('    Ans:  '))
    nodes.push(blank())
  })
  nodes.push(...qSpacer())
  return nodes
}

function serializeGrammarCorrection(questions: any[], marks: number, qNum: number): any[] {
  const nodes: any[] = []
  nodes.push(qHeader(qNum, 'Correct the following sentences.', `[   /${marks}]`))
  questions.forEach((q) => {
    const sents: any[] = q.sentences || []
    sents.forEach((s, si) => {
      nodes.push(item(si, s.incorrect || ''))
      nodes.push(ansLine('    Corrected:  '))
    })
    nodes.push(blank())
  })
  nodes.push(...qSpacer())
  return nodes
}

function serializePartsOfSpeech(questions: any[], marks: number, qNum: number): any[] {
  const nodes: any[] = []
  nodes.push(qHeader(qNum, 'Identify the parts of speech.', `[   /${marks}]`))
  questions.forEach((q) => {
    const sents: any[] = q.sentences || []
    sents.forEach((s, si) => {
      nodes.push(item(si, s.sentence || ''))
      nodes.push(ansLine('    Answer:  '))
    })
    nodes.push(blank())
  })
  nodes.push(...qSpacer())
  return nodes
}

function serializePracticeQuestions(questions: any[], marks: number, qNum: number, typeId: string): any[] {
  const nodes: any[] = []
  const label = typeId === 'short_practice_questions_missing_solution' ? 'Complete the following.' : 'Solve the following.'
  nodes.push(qHeader(qNum, label, `[   /${marks}]`))
  questions.forEach((q, i) => {
    nodes.push(item(i, q.question || ''))
    if (q.partial_solution) nodes.push(p(`        ${q.partial_solution}`, false, true))
    // Work box
    nodes.push(drawingBox())
    nodes.push(blank())
  })
  nodes.push(...qSpacer())
  return nodes
}

function serializeStoryProblems(questions: any[], marks: number, qNum: number): any[] {
  const nodes: any[] = []
  nodes.push(qHeader(qNum, 'Solve the following story problems.', `[   /${marks}]`))
  questions.forEach((q, i) => {
    if (q.context) nodes.push(item(i, q.context, false))
    if (q.question) nodes.push(p(`        ${q.question}`, true))
    const steps: string[] = (q.solution_steps || []).filter((s: string) => !s.toLowerCase().includes('diagram'))
    if (steps.length > 0) {
      steps.forEach(s => nodes.push(pMixed({ text: `    ${s}:  `, bold: true }, { text: '_'.repeat(44) })))
    } else {
      nodes.push(ansLine('    Given:  '))
      nodes.push(ansLine('    Work:   '))
      nodes.push(ansLine('    Answer: '))
    }
    nodes.push(blank())
  })
  nodes.push(...qSpacer())
  return nodes
}

function serializePictureDescription(questions: any[], marks: number, qNum: number, qids: string[]): any[] {
  const nodes: any[] = []
  nodes.push(qHeader(qNum, 'Look at the picture and describe it.', `[   /${marks}]`))
  questions.forEach((q, i) => {
    if (q.instruction) nodes.push(item(i, q.instruction))
    nodes.push(imgPlaceholder('Picture goes here — upload from left panel', qids[i] || ''))
    const lines = q.lines_required || 4
    nodes.push(ansLine('    Ans:  '))
    for (let l = 1; l < lines; l++) nodes.push(ansLine('           '))
    nodes.push(blank())
  })
  nodes.push(...qSpacer())
  return nodes
}

function serializeLabelFigures(questions: any[], marks: number, qNum: number, qids: string[]): any[] {
  const nodes: any[] = []
  nodes.push(qHeader(qNum, 'Label the figures.', `[   /${marks}]`))
  questions.forEach((_q, i) => {
    nodes.push(item(i, ''))
    nodes.push(imgPlaceholder('Figure goes here — upload from left panel', qids[i] || ''))
    nodes.push(ansLine('    Label:  '))
    nodes.push(blank())
  })
  nodes.push(...qSpacer())
  return nodes
}

function serializeDrawingExercise(questions: any[], marks: number, qNum: number): any[] {
  const nodes: any[] = []
  nodes.push(qHeader(qNum, 'Draw the following.', `[   /${marks}]`))
  questions.forEach((q, i) => {
    nodes.push(item(i, q.question || q.instruction || ''))
    // Actual bordered drawing box
    nodes.push(drawingBox())
    nodes.push(blank())
  })
  nodes.push(...qSpacer())
  return nodes
}

// ── Cover page ────────────────────────────────────────────────────────────────

function buildCoverNodes(exam: any, _sel: Set<string>, opts: {
  schoolName?: string; totalMarks: number; timeAllowed?: string
}): any[] {
  const school = (opts.schoolName?.trim() || 'SCHOOL NAME').toUpperCase()
  const grade = gradeToRoman(String(exam.grade || '').replace(/^class\s*/i, ''))
  const subject = exam.subject || ''
  const time = opts.timeAllowed || ''

  return [
    { type: 'paragraph', attrs: { textAlign: 'center' }, content: [{ type: 'text', text: school, marks: [{ type: 'bold' }] }] },
    blank(),
    pMixed({ text: 'Subject: ', bold: true }, { text: subject }, { text: '                                    ' }, { text: `Total Marks: [   /${opts.totalMarks}]`, bold: true }),
    pMixed({ text: 'Class: ', bold: true }, { text: grade }, { text: '                Date: ', bold: true }, { text: '_'.repeat(14) }, { text: '                Time: ', bold: true }, { text: time || '_'.repeat(14) }),
    pMixed({ text: 'Name: ', bold: true }, { text: '_'.repeat(24) }, { text: '   Roll No. ', bold: true }, { text: '_'.repeat(10) }, { text: '   Section: ', bold: true }, { text: '_'.repeat(10) }),
    { type: 'horizontalRule' },
    pMixed({ text: 'Note: ', bold: true }, { text: "Read questions carefully, don't over write and check your work." }),
    blank(),
  ]
}

// ── Main export ───────────────────────────────────────────────────────────────

export function examToTipTapDoc(
  exam: any,
  selectedQuestions: Set<string>,
  opts: { schoolName?: string; totalMarks: number; timeAllowed?: string }
): any {
  const examContent = exam?.exam_content || exam
  const nodes: any[] = []

  nodes.push(...buildCoverNodes(
    { ...exam, subject: exam.subject || examContent?.subject || '', grade: exam.grade || examContent?.grade || '' },
    selectedQuestions,
    opts
  ))

  const getTypeMarks = (section: Record<string, any>, cat: string): Record<string, number> => {
    const result: Record<string, number> = {}
    Object.entries(section).forEach(([typeId, qs]) => {
      const arr = Array.isArray(qs) ? qs : []
      result[typeId] = arr.reduce((sum: number, _: any, idx: number) => {
        if (!selectedQuestions.has(`${cat}-${typeId}-${idx}`)) return sum
        return sum + (arr[idx]?.marks || 0)
      }, 0)
    })
    return result
  }

  let qNum = 0

  const processSection = (section: Record<string, any> | undefined, cat: 'obj' | 'subj') => {
    if (!section) return
    const typeMarksMap = getTypeMarks(section, cat)

    Object.entries(section).forEach(([typeId, rawQs]) => {
      const arr = Array.isArray(rawQs) ? rawQs : []
      const filteredQs: any[] = []
      const filteredQids: string[] = []
      arr.forEach((q: any, idx: number) => {
        if (selectedQuestions.has(`${cat}-${typeId}-${idx}`)) {
          filteredQs.push(q)
          filteredQids.push(`${cat}-${typeId}-${idx}`)
        }
      })
      if (filteredQs.length === 0) return

      qNum++
      const marks = typeMarksMap[typeId] || 0

      switch (typeId) {
        case 'true_false':           nodes.push(...serializeTrueFalse(filteredQs, marks, qNum)); break
        case 'mcq':                  nodes.push(...serializeMCQ(filteredQs, marks, qNum)); break
        case 'fill_in_blanks':       nodes.push(...serializeFillInBlanks(filteredQs, marks, qNum)); break
        case 'fill_in_blanks_from_word_bank': nodes.push(...serializeFillInBlanksWordBank(filteredQs, marks, qNum)); break
        case 'match_columns':        nodes.push(...serializeMatchColumns(filteredQs, marks, qNum)); break
        case 'circle_correct_answer': nodes.push(...serializeCircleAnswer(filteredQs, marks, qNum)); break
        case 'short_answer':         nodes.push(...serializeShortAnswer(filteredQs, marks, qNum, 3)); break
        case 'long_answer':          nodes.push(...serializeLongAnswer(filteredQs, marks, qNum)); break
        case 'make_sentences':       nodes.push(...serializeMakeSentences(filteredQs, marks, qNum)); break
        case 'complete_sentences':   nodes.push(...serializeCompleteSentences(filteredQs, marks, qNum)); break
        case 'unseen_creative_writing': nodes.push(...serializeCreativeWriting(filteredQs, marks, qNum)); break
        case 'unseen_comprehension_objective':
        case 'unseen_comprehension_subjective':
          nodes.push(...serializeComprehension(filteredQs, marks, qNum, typeId)); break
        case 'rearrange_sentences':  nodes.push(...serializeRearrange(filteredQs, marks, qNum)); break
        case 'grammar_correction':   nodes.push(...serializeGrammarCorrection(filteredQs, marks, qNum)); break
        case 'parts_of_speech':      nodes.push(...serializePartsOfSpeech(filteredQs, marks, qNum)); break
        case 'short_practice_questions_missing_solution':
        case 'practice_questions_by_topic':
          nodes.push(...serializePracticeQuestions(filteredQs, marks, qNum, typeId)); break
        case 'real_life_story_problems': nodes.push(...serializeStoryProblems(filteredQs, marks, qNum)); break
        case 'picture_description':  nodes.push(...serializePictureDescription(filteredQs, marks, qNum, filteredQids)); break
        case 'label_figures':        nodes.push(...serializeLabelFigures(filteredQs, marks, qNum, filteredQids)); break
        case 'drawing_exercise':     nodes.push(...serializeDrawingExercise(filteredQs, marks, qNum)); break
        default:                     nodes.push(...serializeShortAnswer(filteredQs, marks, qNum, 3))
      }
    })
  }

  processSection(examContent?.objective, 'obj')
  processSection(examContent?.subjective, 'subj')

  return { type: 'doc', content: nodes.length ? nodes : [p('')] }
}
