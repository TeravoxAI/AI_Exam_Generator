import { Edit2, Save, X, Upload, Trash2 } from 'lucide-react'
import { useRef, useCallback } from 'react'

// Mathematical / shape symbols palette (shown in edit mode)
const MATH_SYMBOLS = [
  '+', '−', '×', '÷', '=', '≠', '<', '>', '≤', '≥',
  '²', '³', '√', 'π', '∞', '°', '½', '¼', '¾',
  '□', '△', '○', '▷', '♦', '%', '∑', '∠', '⊥', '∥',
]

function SymbolPalette({ onInsert }: { onInsert: (sym: string) => void }) {
  return (
    <div className="flex flex-wrap gap-1 p-2 bg-[var(--background-light)] border border-[var(--border)] rounded-lg mb-2">
      <span className="text-xs text-[var(--text-muted)] w-full mb-1">Symbols &amp; Shapes:</span>
      {MATH_SYMBOLS.map((sym) => (
        <button
          key={sym}
          type="button"
          // onMouseDown + preventDefault keeps the textarea focused/selection intact
          onMouseDown={(e) => { e.preventDefault(); onInsert(sym) }}
          className="w-7 h-7 flex items-center justify-center text-sm border border-[var(--border)] rounded hover:bg-[var(--primary)] hover:text-white transition-colors font-mono cursor-pointer"
          title={`Insert ${sym}`}
        >
          {sym}
        </button>
      ))}
    </div>
  )
}

// Roman numeral helper for sub-part labels
const toRoman = (n: number): string => {
  const nums = ['i','ii','iii','iv','v','vi','vii','viii','ix','x',
                'xi','xii','xiii','xiv','xv','xvi','xvii','xviii','xix','xx']
  return n >= 1 && n <= 20 ? nums[n - 1] : String(n)
}

interface QuestionProps {
  question: any
  index: number
  typeId: string
  questionId: string
  isSelected: boolean
  isEditing: boolean
  editedQuestion: any
  onToggleSelection: () => void
  onStartEditing: () => void
  onSaveEditing: () => void
  onCancelEditing: () => void
  onUpdateField: (field: string, value: any) => void
  // Image support for Picture Description
  questionImage?: string
  onImageUpload?: (file: File) => void
  onDelete?: () => void
}

// Math question types that benefit from symbol palette + image upload
const MATH_IMAGE_TYPES = ['label_figures', 'drawing_exercise']
const MATH_SYMBOL_TYPES = [
  'fill_in_blanks_from_word_bank', 'short_practice_questions_missing_solution',
  'label_figures', 'practice_questions_by_topic', 'real_life_story_problems', 'drawing_exercise',
]

export function QuestionRenderer({
  question,
  index,
  typeId,
  isSelected,
  isEditing,
  editedQuestion,
  onToggleSelection,
  onStartEditing,
  onSaveEditing,
  onCancelEditing,
  onUpdateField,
  questionImage,
  onImageUpload,
  onDelete,
}: QuestionProps) {
  const fileInputRef = useRef<HTMLInputElement>(null)
  const activeTextareaRef = useRef<HTMLTextAreaElement | null>(null)

  const insertSymbol = useCallback((sym: string) => {
    const ta = activeTextareaRef.current
    if (!ta) return
    const start = ta.selectionStart ?? ta.value.length
    const end = ta.selectionEnd ?? ta.value.length
    const newVal = ta.value.slice(0, start) + sym + ta.value.slice(end)
    // Determine which field this textarea maps to by its data-field attribute
    const field = ta.getAttribute('data-field') || 'question'
    onUpdateField(field, newVal)
    // Re-focus and set cursor after inserted symbol
    requestAnimationFrame(() => {
      ta.focus()
      ta.setSelectionRange(start + sym.length, start + sym.length)
    })
  }, [onUpdateField])

  const trackTextarea = (e: React.FocusEvent<HTMLTextAreaElement>) => {
    activeTextareaRef.current = e.currentTarget
  }
  // Render specific question type content
  const renderQuestionContent = () => {
    switch (typeId) {
      case 'mcq':
      case 'circle_correct_answer':
        return renderMCQ()
      case 'true_false':
        return renderTrueFalse()
      case 'fill_in_blanks':
        return renderFillInBlanks()
      case 'match_columns':
        return renderMatchColumns()
      case 'rearrange_sentences':
        return renderRearrangeSentences()
      case 'unseen_comprehension_objective':
        return renderComprehensionObjective()
      case 'short_answer':
      case 'long_answer':
        return renderShortLongAnswer()
      case 'complete_sentences':
        return renderCompleteSentences()
      case 'make_sentences':
        return renderMakeSentences()
      case 'unseen_creative_writing':
        return renderCreativeWriting()
      case 'picture_description':
        return renderPictureDescription()
      case 'unseen_comprehension_subjective':
        return renderComprehensionSubjective()
      // Math question types
      case 'fill_in_blanks_from_word_bank':
        return renderFillInBlanksWordBank()
      case 'short_practice_questions_missing_solution':
        return renderShortPracticeQuestions()
      case 'label_figures':
        return renderLabelFigures()
      case 'practice_questions_by_topic':
        return renderPracticeQuestions()
      case 'real_life_story_problems':
        return renderRealLifeStoryProblems()
      case 'drawing_exercise':
        return renderDrawingExercise()
      case 'grammar_correction':
        return renderGrammarCorrection()
      case 'parts_of_speech':
        return renderPartsOfSpeech()
      default:
        return <div className="text-xs text-[var(--text-muted)]">Unknown question type: {typeId}</div>
    }
  }

  const renderMCQ = () => (
    <>
      {isEditing ? (
        <>
          {MATH_SYMBOL_TYPES.includes(typeId) && <SymbolPalette onInsert={insertSymbol} />}
          <textarea
            data-field="question"
            onFocus={trackTextarea}
            value={editedQuestion.question}
            onChange={(e) => onUpdateField('question', e.target.value)}
            className="w-full p-2 text-sm border border-[var(--border)] rounded-lg mb-3 min-h-[60px] resize-y"
          />
        </>
      ) : (
        <p className="text-sm text-[var(--text-primary)] mb-3">{question.question}</p>
      )}
      {question.options && (
        <div className="space-y-2">
          {(isEditing ? editedQuestion.options : question.options).map((option: string, idx: number) => (
            <div key={idx} className="flex items-start gap-2">
              <span className="text-xs font-medium text-[var(--text-secondary)] min-w-[20px] mt-1">
                {String.fromCharCode(65 + idx)}.
              </span>
              {isEditing ? (
                <>
                  <input
                    type="text"
                    value={option}
                    onChange={(e) => {
                      const newOptions = [...editedQuestion.options]
                      newOptions[idx] = e.target.value
                      onUpdateField('options', newOptions)
                    }}
                    className="flex-1 px-2 py-1 text-sm border border-[var(--border)] rounded"
                  />
                  <button type="button" onClick={() => onUpdateField('options', editedQuestion.options.filter((_: any, i: number) => i !== idx))}
                    className="text-red-400 hover:text-red-600 mt-1 shrink-0"><X size={12} /></button>
                </>
              ) : (
                <span className="text-sm text-[var(--text-secondary)]">{option}</span>
              )}
            </div>
          ))}
          {isEditing && (
            <button type="button" onClick={() => onUpdateField('options', [...editedQuestion.options, ''])}
              className="text-xs text-[var(--primary)] hover:underline ml-6">+ Add option</button>
          )}
          <div className="answer-space"></div>
          <div className="answer-display mt-3 pt-3 border-t border-[var(--border-light)]">
            {isEditing ? (
              <div className="flex items-center gap-2">
                <span className="text-xs font-medium text-[var(--text-muted)]">Answer:</span>
                <input
                  type="text"
                  value={editedQuestion.answer}
                  onChange={(e) => onUpdateField('answer', e.target.value)}
                  className="px-2 py-1 text-xs border border-[var(--border)] rounded"
                />
              </div>
            ) : (
              <div>
                <span className="font-bold text-sm">Answer:</span> <span className="text-sm">{question.answer}</span>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  )

  const renderTrueFalse = () => (
    <>
      {isEditing ? (
        <textarea
          value={editedQuestion.statement}
          onChange={(e) => onUpdateField('statement', e.target.value)}
          className="w-full p-2 text-sm border border-[var(--border)] rounded-lg mb-3 min-h-[60px] resize-y"
        />
      ) : (
        <p className="text-sm text-[var(--text-primary)] mb-3">{question.statement}</p>
      )}
      <div className="answer-space"></div>
      <div className="answer-display mt-3 pt-3 border-t border-[var(--border-light)]">
        {isEditing ? (
          <div className="flex items-center gap-2">
            <span className="text-xs font-medium text-[var(--text-muted)]">Answer:</span>
            <select
              value={editedQuestion.answer ? 'true' : 'false'}
              onChange={(e) => onUpdateField('answer', e.target.value === 'true')}
              className="px-2 py-1 text-xs border border-[var(--border)] rounded"
            >
              <option value="true">True</option>
              <option value="false">False</option>
            </select>
          </div>
        ) : (
          <div>
            <span className="font-bold text-sm">Answer:</span> <span className="text-sm">{question.answer ? 'True' : 'False'}</span>
          </div>
        )}
      </div>
    </>
  )

  const renderFillInBlanks = () => (
    <>
      {isEditing ? (
        <>
          <textarea
            value={editedQuestion.question}
            onChange={(e) => onUpdateField('question', e.target.value)}
            className="w-full p-2 text-sm border border-[var(--border)] rounded-lg mb-2 min-h-[60px] resize-y"
          />
          <div className="flex items-center gap-2 mb-2">
            <span className="text-xs font-medium text-[var(--text-muted)]">Answer:</span>
            <input
              type="text"
              value={editedQuestion.answer}
              onChange={(e) => onUpdateField('answer', e.target.value)}
              className="flex-1 px-2 py-1 text-xs border border-[var(--border)] rounded"
            />
          </div>
        </>
      ) : (
        <p className="text-sm text-[var(--text-primary)] mb-2">{question.question}</p>
      )}
      {/* No separate answer line — student writes in the blank within the sentence */}
      <div className="answer-display mt-3 pt-3 border-t border-[var(--border-light)]">
        <div>
          <span className="font-bold text-sm">Answer:</span> <span className="text-sm">{question.answer}</span>
        </div>
      </div>
    </>
  )

  const renderMatchColumns = () => {
    const colA: string[] = isEditing ? (editedQuestion.column_a || []) : (question.column_a || [])
    const colB: string[] = isEditing ? (editedQuestion.column_b || []) : (question.column_b || [])
    // Strip leading "1." / "A." prefixes the LLM may include
    const stripNum = (s: string) => s.replace(/^\d+[\.\)]\s*/, '').replace(/^[A-Ea-e][\.\)]\s*/, '')
    return (
      <>
        {isEditing ? (
          <textarea
            value={editedQuestion.instruction || ''}
            onChange={(e) => onUpdateField('instruction', e.target.value)}
            className="w-full p-2 text-sm border border-[var(--border)] rounded-lg mb-3 min-h-[40px] resize-y"
            placeholder="Instruction..."
          />
        ) : (
          question.instruction && (
            <p className="text-sm italic text-[var(--text-secondary)] mb-3">{question.instruction}</p>
          )
        )}
        <div className="grid grid-cols-2 gap-4 mb-3">
          <div>
            <p className="text-xs font-medium text-[var(--text-muted)] mb-2">Column A</p>
            <div className="space-y-1">
              {colA.map((item: string, idx: number) => (
                <div key={idx} className="flex items-center gap-2">
                  <span className="text-sm text-[var(--text-secondary)] shrink-0">{idx + 1}.</span>
                  {isEditing ? (
                    <>
                      <input
                        type="text"
                        value={stripNum(item)}
                        onChange={(e) => {
                          const newArr = [...colA]
                          newArr[idx] = e.target.value
                          onUpdateField('column_a', newArr)
                        }}
                        className="flex-1 px-2 py-0.5 text-sm border border-[var(--border)] rounded"
                      />
                      <button type="button" onClick={() => onUpdateField('column_a', colA.filter((_, i) => i !== idx))}
                        className="text-red-400 hover:text-red-600 shrink-0"><X size={12} /></button>
                    </>
                  ) : (
                    <span className="text-sm text-[var(--text-primary)]">{stripNum(item)}</span>
                  )}
                </div>
              ))}
              {isEditing && (
                <button type="button" onClick={() => onUpdateField('column_a', [...colA, ''])}
                  className="text-xs text-[var(--primary)] hover:underline mt-1">+ Add row</button>
              )}
            </div>
          </div>
          <div>
            <p className="text-xs font-medium text-[var(--text-muted)] mb-2">Column B</p>
            <div className="space-y-1">
              {colB.map((item: string, idx: number) => (
                <div key={idx} className="flex items-center gap-2">
                  <span className="text-sm text-[var(--text-secondary)] shrink-0">{String.fromCharCode(65 + idx)}.</span>
                  {isEditing ? (
                    <>
                      <input
                        type="text"
                        value={stripNum(item)}
                        onChange={(e) => {
                          const newArr = [...colB]
                          newArr[idx] = e.target.value
                          onUpdateField('column_b', newArr)
                        }}
                        className="flex-1 px-2 py-0.5 text-sm border border-[var(--border)] rounded"
                      />
                      <button type="button" onClick={() => onUpdateField('column_b', colB.filter((_, i) => i !== idx))}
                        className="text-red-400 hover:text-red-600 shrink-0"><X size={12} /></button>
                    </>
                  ) : (
                    <span className="text-sm text-[var(--text-primary)]">{stripNum(item)}</span>
                  )}
                </div>
              ))}
              {isEditing && (
                <button type="button" onClick={() => onUpdateField('column_b', [...colB, ''])}
                  className="text-xs text-[var(--primary)] hover:underline mt-1">+ Add row</button>
              )}
            </div>
          </div>
        </div>
        <div className="answer-space"></div>
        {question.answer && (
          <div className="answer-display mt-3 pt-3 border-t border-[var(--border-light)]">
            <div className="mb-2">
              <span className="font-bold text-sm">Answer:</span>
            </div>
            <div className="space-y-1">
              {Object.entries(question.answer).map(([key, value]: [string, any], idx: number) => (
                <div key={idx} className="text-sm text-[var(--text-secondary)]">
                  {key} → {value}
                </div>
              ))}
            </div>
          </div>
        )}
      </>
    )
  }

  const renderRearrangeSentences = () => (
    <>
      {question.instruction && (
        <p className="text-sm italic text-[var(--text-secondary)] mb-3">{question.instruction}</p>
      )}
      <div className="space-y-2 mb-3">
        {question.sentences?.map((sentence: string, idx: number) => (
          <div key={idx} className="flex items-start gap-2 p-2 bg-[var(--background-light)] rounded">
            <span className="text-xs font-medium text-[var(--text-secondary)]">{idx + 1}.</span>
            <span className="text-sm text-[var(--text-primary)]">{sentence}</span>
          </div>
        ))}
      </div>
      <div className="answer-space"></div>
      {question.answer && Array.isArray(question.answer) && (
        <div className="answer-display mt-3 pt-3 border-t border-[var(--border-light)]">
          <div className="mb-2">
            <span className="font-bold text-sm">Answer:</span>
          </div>
          <div className="space-y-1">
            {question.answer.map((sentence: string, idx: number) => (
              <div key={idx} className="text-sm text-[var(--text-secondary)]">
                {idx + 1}. {sentence}
              </div>
            ))}
          </div>
        </div>
      )}
    </>
  )

  const renderComprehensionObjective = () => {
    const q = isEditing ? editedQuestion : question
    const updateSubQ = (idx: number, field: string, val: any) => {
      const newSubs = [...(editedQuestion.sub_questions || [])]
      newSubs[idx] = { ...newSubs[idx], [field]: val }
      onUpdateField('sub_questions', newSubs)
    }
    const updateSubQOption = (subIdx: number, optIdx: number, val: string) => {
      const newSubs = [...(editedQuestion.sub_questions || [])]
      const newOpts = [...(newSubs[subIdx].options || [])]
      newOpts[optIdx] = val
      newSubs[subIdx] = { ...newSubs[subIdx], options: newOpts }
      onUpdateField('sub_questions', newSubs)
    }
    return (
      <>
        {isEditing ? (
          <>
            <div className="mb-2">
              <label className="text-xs font-medium text-[var(--text-muted)] block mb-1">Instruction:</label>
              <textarea
                data-field="instruction"
                onFocus={trackTextarea}
                value={q.instruction || ''}
                onChange={(e) => onUpdateField('instruction', e.target.value)}
                className="w-full p-2 text-sm border border-[var(--border)] rounded-lg min-h-[40px] resize-y"
                placeholder="Instruction..."
              />
            </div>
            <div className="mb-3">
              <label className="text-xs font-medium text-[var(--text-muted)] block mb-1">Passage:</label>
              <textarea
                data-field="passage"
                onFocus={trackTextarea}
                value={q.passage || ''}
                onChange={(e) => onUpdateField('passage', e.target.value)}
                className="w-full p-2 text-sm border border-[var(--border)] rounded-lg min-h-[80px] resize-y"
              />
            </div>
          </>
        ) : (
          <>
            {q.instruction && <p className="text-sm italic text-[var(--text-secondary)] mb-3">{q.instruction}</p>}
            <div className="p-3 bg-[var(--background-light)] rounded-lg mb-3">
              <p className="text-sm text-[var(--text-primary)] leading-relaxed">{q.passage}</p>
            </div>
          </>
        )}
        <div className="space-y-3">
          {(q.sub_questions || []).map((subQ: any, idx: number) => (
            <div key={idx} className="pl-4 border-l-2 border-[var(--border)]">
              <p className="text-xs font-medium text-[var(--text-muted)] mb-1">{idx + 1}. ({subQ.marks} marks)</p>
              {isEditing ? (
                <>
                  <textarea
                    value={subQ.question || subQ.statement || ''}
                    onChange={(e) => updateSubQ(idx, subQ.question !== undefined ? 'question' : 'statement', e.target.value)}
                    className="w-full p-1.5 text-sm border border-[var(--border)] rounded mb-2 min-h-[40px] resize-y"
                    placeholder="Sub-question..."
                  />
                  {subQ.options && (
                    <div className="ml-2 space-y-1 mb-2">
                      {subQ.options.map((opt: string, oi: number) => (
                        <div key={oi} className="flex items-center gap-2">
                          <span className="text-xs text-[var(--text-muted)] min-w-[16px]">{String.fromCharCode(65 + oi)}.</span>
                          <input
                            type="text"
                            value={opt}
                            onChange={(e) => updateSubQOption(idx, oi, e.target.value)}
                            className="flex-1 px-2 py-0.5 text-xs border border-[var(--border)] rounded"
                          />
                        </div>
                      ))}
                    </div>
                  )}
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-[var(--text-muted)]">Answer:</span>
                    <input
                      type="text"
                      value={typeof subQ.answer === 'boolean' ? String(subQ.answer) : (subQ.answer || '')}
                      onChange={(e) => updateSubQ(idx, 'answer', e.target.value)}
                      className="flex-1 px-2 py-0.5 text-xs border border-[var(--border)] rounded"
                    />
                  </div>
                </>
              ) : (
                <>
                  {subQ.question && <p className="text-sm text-[var(--text-primary)]">{subQ.question}</p>}
                  {subQ.statement && <p className="text-sm text-[var(--text-primary)]">{subQ.statement}</p>}
                  {subQ.options && (
                    <div className="mt-1 ml-3 space-y-1">
                      {subQ.options.map((opt: string, optIdx: number) => (
                        <div key={optIdx} className="text-xs text-[var(--text-secondary)]">
                          {String.fromCharCode(65 + optIdx)}. {opt}
                        </div>
                      ))}
                    </div>
                  )}
                  <div className="answer-space"></div>
                  {subQ.answer !== undefined && (
                    <div className="answer-display mt-2">
                      <span className="font-bold text-sm">Answer:</span>{' '}
                      <span className="text-sm">{typeof subQ.answer === 'boolean' ? (subQ.answer ? 'True' : 'False') : subQ.answer}</span>
                    </div>
                  )}
                </>
              )}
            </div>
          ))}
        </div>
      </>
    )
  }

  const renderShortLongAnswer = () => (
    <>
      {isEditing ? (
        <>
          {MATH_SYMBOL_TYPES.includes(typeId) && <SymbolPalette onInsert={insertSymbol} />}
          <textarea
            data-field="question"
            onFocus={trackTextarea}
            value={editedQuestion.question}
            onChange={(e) => onUpdateField('question', e.target.value)}
            className="w-full p-2 text-sm border border-[var(--border)] rounded-lg mb-3 min-h-[60px] resize-y"
          />
        </>
      ) : (
        <p className="text-sm text-[var(--text-primary)] mb-3">{question.question}</p>
      )}
      {/* Image upload for math types that need figures */}
      {(MATH_IMAGE_TYPES.includes(typeId) && (questionImage || onImageUpload)) && (
        <div className="mb-3">
          {questionImage ? (
            <div className="relative inline-block">
              <img src={questionImage} alt="Question figure" className="max-w-full max-h-[200px] rounded-lg border border-[var(--border)] object-contain" />
              <button onClick={() => onImageUpload && fileInputRef.current?.click()} className="no-print absolute bottom-2 right-2 px-2 py-1 bg-white/90 border border-[var(--border)] rounded text-xs text-[var(--text-secondary)] hover:bg-white transition-colors">Change</button>
            </div>
          ) : (
            <div onClick={() => onImageUpload && fileInputRef.current?.click()} className={`border-2 border-dashed rounded-lg p-4 text-center transition-colors ${onImageUpload ? 'border-[var(--border)] hover:border-[var(--primary)] hover:bg-blue-50 cursor-pointer' : 'border-[var(--border-light)] bg-[var(--background-light)]'}`}>
              {onImageUpload ? (
                <>
                  <Upload size={18} className="mx-auto mb-1 text-[var(--text-muted)]" />
                  <p className="text-xs font-medium text-[var(--text-primary)]">Click to upload figure / image</p>
                </>
              ) : (
                <p className="text-xs text-[var(--text-muted)] italic">[Figure placeholder]</p>
              )}
            </div>
          )}
          {onImageUpload && (
            <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={(e) => { const file = e.target.files?.[0]; if (file) onImageUpload(file) }} />
          )}
        </div>
      )}
      <div className="answer-space bg-[var(--background-light)] border border-[var(--border)] rounded-lg p-3 min-h-[60px]">
      </div>
      {question.answer && (
        <div className="answer-display mt-3 pt-3 border-t border-[var(--border-light)]">
          <div className="mb-2">
            <span className="font-bold text-sm">Sample Answer:</span>
          </div>
          <div className="p-3 bg-[var(--background-light)] rounded-lg">
            <p className="text-sm text-[var(--text-primary)] leading-relaxed">{question.answer}</p>
          </div>
        </div>
      )}
    </>
  )

  const renderCompleteSentences = () => (
    <>
      {question.instruction && (
        <p className="text-sm italic text-[var(--text-secondary)] mb-3">{question.instruction}</p>
      )}
      <div className="space-y-3">
        {question.sentences?.map((sent: any, idx: number) => {
          // Handle both formats: string or object with incomplete/answer/marks
          const isObject = typeof sent === 'object' && sent !== null
          const sentenceText = isObject ? sent.incomplete : sent
          const sentenceMarks = isObject && sent.marks ? sent.marks : null
          const sentenceAnswer = isObject && sent.answer ? sent.answer : null

          return (
            <div key={idx} className="pl-4 border-l-2 border-[var(--border)]">
              <p className="text-xs font-medium text-[var(--text-muted)] mb-1">
                {idx + 1}. {sentenceMarks && `(${sentenceMarks} marks)`}
              </p>
              <p className="text-sm text-[var(--text-primary)] mb-2">{sentenceText}</p>
              <div className="answer-space bg-[var(--background-light)] rounded p-2">
              </div>
              {sentenceAnswer && (
                <div className="answer-display mt-2 pt-2 border-t border-[var(--border-light)]">
                  <div>
                    <span className="font-bold text-sm">Sample Answer:</span> <span className="text-sm">{sentenceAnswer}</span>
                  </div>
                </div>
              )}
            </div>
          )
        })}
      </div>
    </>
  )

  const renderMakeSentences = () => (
    <>
      {question.instruction && (
        <p className="text-sm italic text-[var(--text-secondary)] mb-3">{question.instruction}</p>
      )}

      {/* If no instruction or words, show the question field */}
      {!question.instruction && !question.words && question.question && (
        <p className="text-sm text-[var(--text-primary)] mb-3">{question.question}</p>
      )}

      {/* Display words if available */}
      {question.words && question.words.length > 0 ? (
        <div className="space-y-3">
          {question.words.map((wordItem: any, idx: number) => {
            // Handle both formats: string or object with word/answer
            const isObject = typeof wordItem === 'object' && wordItem !== null
            const wordText = isObject ? wordItem.word : wordItem
            const wordAnswer = isObject && wordItem.answer ? wordItem.answer : null

            return (
              <div key={idx} className="pl-4 border-l-2 border-[var(--border)]">
                <p className="text-sm font-medium text-[var(--text-primary)] mb-2">{idx + 1}. {wordText}</p>
                <div className="answer-space bg-[var(--background-light)] rounded p-2">
                </div>
                {wordAnswer && (
                  <div className="answer-display mt-2 pt-2 border-t border-[var(--border-light)]">
                    <div>
                      <span className="font-bold text-sm">Sample Answer:</span> <span className="text-sm">{wordAnswer}</span>
                    </div>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      ) : (
        !question.instruction && !question.question && (
          <div className="p-3 bg-yellow-50 border border-yellow-200 rounded text-yellow-700 text-xs">
            ⚠️ Question content not generated properly. Please regenerate this exam.
          </div>
        )
      )}
    </>
  )

  const renderCreativeWriting = () => (
    <>
      {isEditing ? (
        <textarea
          value={editedQuestion.instruction || ''}
          onChange={(e) => onUpdateField('instruction', e.target.value)}
          className="w-full p-2 text-sm border border-[var(--border)] rounded-lg mb-2 min-h-[40px] resize-y"
          placeholder="Instruction (e.g. Write a short story on...)..."
        />
      ) : (
        question.instruction && (
          <p className="text-sm italic text-[var(--text-secondary)] mb-2">{question.instruction}</p>
        )
      )}
      <div className="mb-3">
        <p className="text-xs font-medium text-[var(--text-muted)] mb-1">Topic / Prompt:</p>
        {isEditing ? (
          <textarea
            value={editedQuestion.prompt || ''}
            onChange={(e) => onUpdateField('prompt', e.target.value)}
            className="w-full p-2 text-sm border border-[var(--border)] rounded-lg min-h-[50px] resize-y"
            placeholder="Enter the creative writing topic or prompt..."
          />
        ) : (
          <div className="p-3 bg-[var(--background-light)] rounded-lg border border-[var(--border)]">
            <p className="text-sm font-medium text-[var(--text-primary)]">{question.prompt || '—'}</p>
          </div>
        )}
      </div>
      {/* Vocabulary words */}
      {question.vocabulary_words && question.vocabulary_words.length > 0 && (
        <div className="mb-3 p-2 bg-amber-50 border border-amber-200 rounded-lg">
          <p className="text-xs font-semibold text-amber-700 mb-1">Word Bank:</p>
          <p className="text-sm text-amber-800">{(question.vocabulary_words as string[]).join('  |  ')}</p>
        </div>
      )}
      <div className="answer-space bg-[var(--background-light)] border border-[var(--border)] rounded-lg p-3 min-h-[80px]">
      </div>
      {question.answer && (
        <div className="answer-display mt-3 pt-3 border-t border-[var(--border-light)]">
          <div className="mb-2">
            <span className="font-bold text-sm">Sample Answer:</span>
          </div>
          <div className="p-3 bg-[var(--background-light)] rounded-lg">
            <p className="text-sm text-[var(--text-primary)] leading-relaxed">{question.answer}</p>
          </div>
        </div>
      )}
    </>
  )

  const renderPictureDescription = () => (
    <>
      {question.instruction && (
        <p className="text-sm italic text-[var(--text-secondary)] mb-3">{question.instruction}</p>
      )}

      {/* Image Upload Area */}
      <div className="mb-3">
        {questionImage ? (
          <div className="relative inline-block">
            <img
              src={questionImage}
              alt="Question picture"
              className="max-w-full max-h-[200px] rounded-lg border border-[var(--border)] object-contain"
            />
            <button
              onClick={() => onImageUpload && fileInputRef.current?.click()}
              className="no-print absolute bottom-2 right-2 px-2 py-1 bg-white/90 border border-[var(--border)] rounded text-xs text-[var(--text-secondary)] hover:bg-white transition-colors"
            >
              Change
            </button>
          </div>
        ) : (
          <div
            onClick={() => onImageUpload && fileInputRef.current?.click()}
            className={`border-2 border-dashed rounded-lg p-6 text-center transition-colors ${
              onImageUpload
                ? 'border-[var(--border)] hover:border-[var(--primary)] hover:bg-blue-50 cursor-pointer'
                : 'border-[var(--border-light)] bg-[var(--background-light)]'
            }`}
          >
            {onImageUpload ? (
              <>
                <Upload size={20} className="mx-auto mb-2 text-[var(--text-muted)]" />
                <p className="text-sm font-medium text-[var(--text-primary)]">Click to upload picture</p>
                <p className="text-xs text-[var(--text-muted)] mt-1">JPG, PNG, GIF supported</p>
              </>
            ) : (
              <p className="text-xs text-[var(--text-muted)] italic">
                {question.image_description || '[Picture placeholder]'}
              </p>
            )}
          </div>
        )}
        {onImageUpload && (
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0]
              if (file) onImageUpload(file)
            }}
          />
        )}
      </div>

      <div className="answer-space bg-[var(--background-light)] border border-[var(--border)] rounded-lg p-3 min-h-[60px]">
      </div>
      {question.answer && (
        <div className="answer-display mt-3 pt-3 border-t border-[var(--border-light)]">
          <div className="mb-2">
            <span className="font-bold text-sm">Sample Answer:</span>
          </div>
          <div className="p-3 bg-[var(--background-light)] rounded-lg">
            <p className="text-sm text-[var(--text-primary)] leading-relaxed">{question.answer}</p>
          </div>
        </div>
      )}
    </>
  )

  const renderComprehensionSubjective = () => {
    const q = isEditing ? editedQuestion : question
    const updateSubQ = (idx: number, field: string, val: any) => {
      const newSubs = [...(editedQuestion.sub_questions || [])]
      newSubs[idx] = { ...newSubs[idx], [field]: val }
      onUpdateField('sub_questions', newSubs)
    }
    return (
      <>
        {isEditing ? (
          <>
            <div className="mb-2">
              <label className="text-xs font-medium text-[var(--text-muted)] block mb-1">Instruction:</label>
              <textarea
                data-field="instruction"
                onFocus={trackTextarea}
                value={q.instruction || ''}
                onChange={(e) => onUpdateField('instruction', e.target.value)}
                className="w-full p-2 text-sm border border-[var(--border)] rounded-lg min-h-[40px] resize-y"
                placeholder="Instruction..."
              />
            </div>
            <div className="mb-3">
              <label className="text-xs font-medium text-[var(--text-muted)] block mb-1">Passage:</label>
              <textarea
                data-field="passage"
                onFocus={trackTextarea}
                value={q.passage || ''}
                onChange={(e) => onUpdateField('passage', e.target.value)}
                className="w-full p-2 text-sm border border-[var(--border)] rounded-lg min-h-[80px] resize-y"
              />
            </div>
          </>
        ) : (
          <>
            {q.instruction && <p className="text-sm italic text-[var(--text-secondary)] mb-3">{q.instruction}</p>}
            <div className="p-3 bg-[var(--background-light)] rounded-lg mb-3">
              <p className="text-sm text-[var(--text-primary)] leading-relaxed">{q.passage}</p>
            </div>
          </>
        )}
        <div className="space-y-3">
          {(q.sub_questions || []).map((subQ: any, idx: number) => (
            <div key={idx} className="pl-4 border-l-2 border-[var(--border)]">
              <div className="flex items-center gap-2 mb-1 flex-wrap">
                <p className="text-xs font-medium text-[var(--text-muted)]">{idx + 1}. ({subQ.marks} marks)</p>
                {subQ.sentences_required && (
                  <span className="text-xs bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded">{subQ.sentences_required} sentence{subQ.sentences_required > 1 ? 's' : ''}</span>
                )}
                {subQ.word_limit && (
                  <span className="text-xs bg-green-100 text-green-700 px-1.5 py-0.5 rounded">max {subQ.word_limit} words</span>
                )}
              </div>
              {isEditing ? (
                <>
                  <textarea
                    value={subQ.question || ''}
                    onChange={(e) => updateSubQ(idx, 'question', e.target.value)}
                    className="w-full p-1.5 text-sm border border-[var(--border)] rounded mb-2 min-h-[40px] resize-y"
                    placeholder="Sub-question..."
                  />
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-[var(--text-muted)]">Sample Answer:</span>
                    <textarea
                      value={subQ.answer || ''}
                      onChange={(e) => updateSubQ(idx, 'answer', e.target.value)}
                      className="flex-1 px-2 py-1 text-xs border border-[var(--border)] rounded min-h-[40px] resize-y"
                    />
                  </div>
                </>
              ) : (
                <>
                  <p className="text-sm text-[var(--text-primary)] mb-2">{subQ.question}</p>
                  <div className="answer-space bg-[var(--background-light)] rounded p-2 min-h-[40px]">
                    <span className="text-xs text-[var(--text-muted)]">Answer space</span>
                  </div>
                  {subQ.answer && (
                    <div className="answer-display mt-2 pt-2 border-t border-[var(--border-light)]">
                      <div className="mb-1"><span className="font-bold text-sm">Sample Answer:</span></div>
                      <p className="text-sm text-[var(--text-primary)]">{subQ.answer}</p>
                    </div>
                  )}
                </>
              )}
            </div>
          ))}
        </div>
      </>
    )
  }

  // Math question type renderers
  const renderFillInBlanksWordBank = () => (
    <>
      {isEditing ? (
        <>
          <SymbolPalette onInsert={insertSymbol} />
          <textarea
            data-field="blanks_sentence"
            onFocus={trackTextarea}
            value={editedQuestion.blanks_sentence}
            onChange={(e) => onUpdateField('blanks_sentence', e.target.value)}
            className="w-full p-2 text-sm border border-[var(--border)] rounded-lg mb-3 min-h-[50px] resize-y"
          />
        </>
      ) : (
        <p className="text-sm text-[var(--text-primary)] mb-3">{question.blanks_sentence}</p>
      )}
      {question.instruction && (
        <p className="text-xs italic text-[var(--text-secondary)] mb-2">{question.instruction}</p>
      )}
      {question.word_bank && (
        <div className="p-3 bg-[var(--background-light)] rounded-lg mb-3 border border-[var(--border)]">
          <p className="text-xs font-medium text-[var(--text-muted)] mb-2">Word Bank:</p>
          <div className="flex flex-wrap gap-2">
            {(isEditing ? editedQuestion.word_bank : question.word_bank).map((word: string, idx: number) => (
              <span key={idx} className="px-2 py-1 bg-white border border-[var(--border)] rounded text-sm text-[var(--text-primary)]">
                {word}
              </span>
            ))}
          </div>
        </div>
      )}
      <div className="answer-space bg-[var(--background-light)] border border-[var(--border)] rounded-lg p-3 min-h-[50px]">
      </div>
      {question.answer && (
        <div className="answer-display mt-3 pt-3 border-t border-[var(--border-light)]">
          <div className="mb-2">
            <span className="font-bold text-sm">Answer:</span>
          </div>
          <div className="p-3 bg-[var(--background-light)] rounded-lg">
            {Array.isArray(question.answer) ? (
              <div className="space-y-1">
                {question.answer.map((ans: string, idx: number) => (
                  <div key={idx} className="text-sm text-[var(--text-primary)]">
                    {question.answer.length > 1 ? `${idx + 1}. ${ans}` : ans}
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-[var(--text-primary)]">{question.answer}</p>
            )}
          </div>
        </div>
      )}
    </>
  )

  const renderShortPracticeQuestions = () => (
    <>
      {isEditing ? (
        <>
          <SymbolPalette onInsert={insertSymbol} />
          <textarea
            data-field="question"
            onFocus={trackTextarea}
            value={editedQuestion.question}
            onChange={(e) => onUpdateField('question', e.target.value)}
            className="w-full p-2 text-sm border border-[var(--border)] rounded-lg mb-3 min-h-[60px] resize-y"
          />
        </>
      ) : (
        <p className="text-sm text-[var(--text-primary)] mb-3">{question.question}</p>
      )}
      {question.partial_solution && (
        <div className="p-3 bg-[var(--background-light)] rounded-lg mb-3 border border-[var(--border)]">
          <p className="text-xs font-medium text-[var(--text-muted)] mb-2">Partial Solution:</p>
          <p className="text-sm text-[var(--text-primary)] font-mono">{question.partial_solution}</p>
        </div>
      )}
      <div className="answer-space bg-[var(--background-light)] border border-[var(--border)] rounded-lg p-3 min-h-[60px]">
        <span className="text-xs text-[var(--text-muted)]">Complete the solution</span>
      </div>
      {question.answer && (
        <div className="answer-display mt-3 pt-3 border-t border-[var(--border-light)]">
          <div className="mb-2">
            <span className="font-bold text-sm">Complete Solution:</span>
          </div>
          <div className="p-3 bg-[var(--background-light)] rounded-lg">
            <p className="text-sm text-[var(--text-primary)] font-mono leading-relaxed">{question.answer}</p>
          </div>
        </div>
      )}
    </>
  )

  const renderLabelFigures = () => (
    <>
      {isEditing ? (
        <>
          <div className="mb-2">
            <label className="text-xs font-medium text-[var(--text-muted)] block mb-1">Instruction:</label>
            <textarea
              data-field="instruction"
              onFocus={trackTextarea}
              value={editedQuestion.instruction || ''}
              onChange={(e) => onUpdateField('instruction', e.target.value)}
              className="w-full p-2 text-sm border border-[var(--border)] rounded-lg min-h-[40px] resize-y"
            />
          </div>
          <div className="mb-2">
            <label className="text-xs font-medium text-[var(--text-muted)] block mb-1">Figure Description:</label>
            <textarea
              data-field="figure_description"
              onFocus={trackTextarea}
              value={editedQuestion.figure_description || ''}
              onChange={(e) => onUpdateField('figure_description', e.target.value)}
              className="w-full p-2 text-sm border border-[var(--border)] rounded-lg min-h-[40px] resize-y"
            />
          </div>
        </>
      ) : (
        <>
          {question.instruction && <p className="text-sm italic text-[var(--text-secondary)] mb-3">{question.instruction}</p>}
          {question.figure_description && (
            <div className="p-3 bg-[var(--background-light)] rounded-lg mb-3 border border-[var(--border)]">
              <p className="text-xs font-medium text-[var(--text-muted)] mb-2">Figure:</p>
              <p className="text-sm text-[var(--text-primary)] italic leading-relaxed">{question.figure_description}</p>
            </div>
          )}
        </>
      )}
      {/* Image upload for figure */}
      <div className="mb-3">
        {questionImage ? (
          <div className="relative inline-block">
            <img src={questionImage} alt="Figure" className="max-w-full max-h-[200px] rounded-lg border border-[var(--border)] object-contain" />
            <button onClick={() => onImageUpload && fileInputRef.current?.click()} className="no-print absolute bottom-2 right-2 px-2 py-1 bg-white/90 border border-[var(--border)] rounded text-xs hover:bg-white transition-colors">Change</button>
          </div>
        ) : (
          <div onClick={() => onImageUpload && fileInputRef.current?.click()} className={`border-2 border-dashed rounded-lg p-4 text-center transition-colors ${onImageUpload ? 'border-[var(--border)] hover:border-[var(--primary)] hover:bg-blue-50 cursor-pointer' : 'border-[var(--border-light)] bg-[var(--background-light)]'}`}>
            {onImageUpload ? (
              <>
                <Upload size={18} className="mx-auto mb-1 text-[var(--text-muted)]" />
                <p className="text-xs font-medium text-[var(--text-primary)]">Click to upload figure / diagram</p>
                <p className="text-xs text-[var(--text-muted)] mt-0.5">JPG, PNG supported</p>
              </>
            ) : (
              <p className="text-xs text-[var(--text-muted)] italic">[Figure placeholder]</p>
            )}
          </div>
        )}
        {onImageUpload && <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={(e) => { const file = e.target.files?.[0]; if (file) onImageUpload(file) }} />}
      </div>
      <div className="answer-space bg-[var(--background-light)] border border-[var(--border)] rounded-lg p-3 min-h-[60px] flex items-center justify-center">
        <span className="text-xs text-[var(--text-muted)]">Label the figure</span>
      </div>
      {question.answer && (
        <div className="answer-display mt-3 pt-3 border-t border-[var(--border-light)]">
          <div className="mb-2"><span className="font-bold text-sm">Expected Labels:</span></div>
          <div className="p-3 bg-[var(--background-light)] rounded-lg">
            <p className="text-sm text-[var(--text-primary)] leading-relaxed">{question.answer}</p>
          </div>
        </div>
      )}
    </>
  )

  const renderPracticeQuestions = () => (
    <>
      {isEditing ? (
        <>
          {MATH_SYMBOL_TYPES.includes(typeId) && <SymbolPalette onInsert={insertSymbol} />}
          <textarea
            data-field="question"
            onFocus={trackTextarea}
            value={editedQuestion.question}
            onChange={(e) => onUpdateField('question', e.target.value)}
            className="w-full p-2 text-sm border border-[var(--border)] rounded-lg mb-3 min-h-[60px] resize-y"
          />
        </>
      ) : (
        <p className="text-sm text-[var(--text-primary)] mb-3">{question.question}</p>
      )}
      {/* Work space — grid lines for calculations */}
      <div className="border border-[var(--border)] rounded-lg overflow-hidden mb-1">
        <div className="px-3 py-1 bg-[var(--background-light)] border-b border-[var(--border)]">
          <span className="text-xs font-medium text-[var(--text-muted)]">Work Space</span>
        </div>
        <div className="p-2 min-h-[80px]" style={{ backgroundImage: 'repeating-linear-gradient(transparent, transparent 23px, var(--border) 23px, var(--border) 24px)', backgroundSize: '100% 24px' }}>
        </div>
      </div>
      {question.answer && (
        <div className="answer-display mt-3 pt-3 border-t border-[var(--border-light)]">
          <span className="font-bold text-sm">Sample Solution:</span>
          <div className="mt-2 p-3 bg-[var(--background-light)] rounded-lg">
            <p className="text-sm text-[var(--text-primary)] font-mono leading-relaxed whitespace-pre-wrap">{question.answer}</p>
          </div>
        </div>
      )}
    </>
  )

  const renderDrawingExercise = () => (
    <>
      {isEditing ? (
        <>
          <SymbolPalette onInsert={insertSymbol} />
          <textarea
            data-field="question"
            onFocus={trackTextarea}
            value={editedQuestion.question}
            onChange={(e) => onUpdateField('question', e.target.value)}
            className="w-full p-2 text-sm border border-[var(--border)] rounded-lg mb-3 min-h-[60px] resize-y"
          />
        </>
      ) : (
        <p className="text-sm text-[var(--text-primary)] mb-3">{question.question}</p>
      )}
      {/* Drawing box */}
      <div className="border-2 border-dashed border-[var(--border)] rounded-lg flex items-center justify-center mb-2" style={{ minHeight: 120 }}>
        <span className="text-xs text-[var(--text-muted)] italic">[ Drawing Space ]</span>
      </div>
      {question.answer && (
        <div className="answer-display mt-2 pt-2 border-t border-[var(--border-light)]">
          <span className="font-bold text-sm">Expected:</span>
          <p className="text-sm text-[var(--text-primary)] mt-1">{question.answer}</p>
        </div>
      )}
    </>
  )

  const renderRealLifeStoryProblems = () => (
    <>
      {isEditing ? (
        <textarea
          value={editedQuestion.question}
          onChange={(e) => onUpdateField('question', e.target.value)}
          className="w-full p-2 text-sm border border-[var(--border)] rounded-lg mb-3 min-h-[60px] resize-y"
        />
      ) : (
        <p className="text-sm text-[var(--text-primary)] mb-3">{question.question}</p>
      )}
      {question.context && (
        <div className="p-3 bg-[var(--background-light)] rounded-lg mb-3 border border-[var(--border)]">
          <p className="text-xs font-medium text-[var(--text-muted)] mb-2">Context:</p>
          <p className="text-sm text-[var(--text-primary)]">{question.context}</p>
        </div>
      )}
      <div className="answer-space bg-[var(--background-light)] border border-[var(--border)] rounded-lg p-3 min-h-[60px]">
        <span className="text-xs text-[var(--text-muted)]">Solution with working and units</span>
      </div>
      {question.answer && (
        <div className="answer-display mt-3 pt-3 border-t border-[var(--border-light)]">
          <div className="mb-2">
            <span className="font-bold text-sm">Sample Solution:</span>
          </div>
          <div className="p-3 bg-[var(--background-light)] rounded-lg">
            <p className="text-sm text-[var(--text-primary)] leading-relaxed">{question.answer}</p>
          </div>
        </div>
      )}
    </>
  )

  const renderGrammarCorrection = () => (
    <>
      <div className="mb-2">
        <p className="text-xs text-[var(--text-muted)] italic mb-3">{question.instruction}</p>
        <div className="space-y-3">
          {(question.sentences || []).map((sent: any, si: number) => (
            <div key={si} className="p-2 bg-[var(--background-light)] rounded-lg border border-[var(--border)]">
              <div className="flex items-start gap-2">
                <span className="text-xs font-medium text-[var(--text-secondary)] mt-0.5">({toRoman(si + 1)})</span>
                <div className="flex-1">
                  <p className="text-sm text-[var(--text-primary)] mb-1">
                    <span className="font-medium">Incorrect: </span>{sent.incorrect}
                  </p>
                  <div className="answer-display">
                    <p className="text-sm text-green-700">
                      <span className="font-medium">Correct: </span>{sent.answer}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </>
  )

  const renderPartsOfSpeech = () => (
    <>
      <div className="mb-2">
        <p className="text-xs text-[var(--text-muted)] italic mb-3">{question.instruction}</p>
        <div className="space-y-3">
          {(question.sentences || []).map((sent: any, si: number) => (
            <div key={si} className="p-2 bg-[var(--background-light)] rounded-lg border border-[var(--border)]">
              <div className="flex items-start gap-2">
                <span className="text-xs font-medium text-[var(--text-secondary)] mt-0.5">({toRoman(si + 1)})</span>
                <div className="flex-1">
                  <p className="text-sm text-[var(--text-primary)] mb-1">{sent.sentence}</p>
                  <div className="answer-display">
                    <p className="text-xs text-[var(--text-muted)]">
                      <span className="font-medium">Answer: </span>{sent.answer}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </>
  )

  return (
    <div className={`question-container border-b border-[var(--border-light)] last:border-0 pb-4 last:pb-0 mb-4 last:mb-0 ${!isSelected ? 'opacity-50' : ''}`}>
      <div className="flex items-start gap-3">
        <input
          type="checkbox"
          checked={isSelected}
          onChange={onToggleSelection}
          className="no-print mt-1 w-4 h-4 accent-[var(--primary)] shrink-0"
        />
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between mb-2">
            {/* Sub-part label: (i), (ii), (iii)... */}
            <span className="text-sm font-bold text-[var(--text-secondary)]">({toRoman(index + 1)})</span>
            <div className="flex items-center gap-2">
              {!isEditing && question.marks != null && (
                <span className="text-xs text-[var(--text-muted)] font-medium">[{question.marks} mark{question.marks !== 1 ? 's' : ''}]</span>
              )}
              {isEditing && (
                <div className="flex items-center gap-1">
                  <span className="text-xs text-[var(--text-muted)]">Marks:</span>
                  <input
                    type="number"
                    value={editedQuestion.marks}
                    onChange={(e) => onUpdateField('marks', parseFloat(e.target.value))}
                    className="w-16 h-7 px-2 text-xs border border-[var(--border)] rounded"
                    min="0"
                    step="0.5"
                  />
                </div>
              )}
              {!isEditing && (
                <button
                  onClick={onStartEditing}
                  className="no-print p-1 hover:bg-[var(--background-light)] rounded transition-colors"
                  title="Edit question"
                >
                  <Edit2 size={14} className="text-[var(--text-muted)]" />
                </button>
              )}
              {!isEditing && onDelete && (
                <button
                  onClick={onDelete}
                  className="no-print p-1 hover:bg-red-50 rounded transition-colors"
                  title="Delete this question"
                >
                  <Trash2 size={14} className="text-red-400 hover:text-red-600" />
                </button>
              )}
            </div>
          </div>

          {renderQuestionContent()}

          {isEditing && (
            <div className="no-print flex gap-2 mt-3">
              <button
                onClick={onSaveEditing}
                className="px-3 py-1.5 bg-[var(--primary)] text-white rounded-lg text-xs font-medium hover:bg-[var(--primary-dark)] transition-colors flex items-center gap-1"
              >
                <Save size={14} />
                Save
              </button>
              <button
                onClick={onCancelEditing}
                className="px-3 py-1.5 bg-[var(--background-light)] text-[var(--text-secondary)] rounded-lg text-xs font-medium hover:bg-[var(--border-light)] transition-colors flex items-center gap-1"
              >
                <X size={14} />
                Cancel
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
