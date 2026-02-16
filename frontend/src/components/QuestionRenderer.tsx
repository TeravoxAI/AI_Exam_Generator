import { Edit2, Save, X } from 'lucide-react'

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
}

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
}: QuestionProps) {
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
        return renderShortLongAnswer()
      case 'real_life_story_problems':
        return renderRealLifeStoryProblems()
      default:
        return <div className="text-xs text-[var(--text-muted)]">Unknown question type: {typeId}</div>
    }
  }

  const renderMCQ = () => (
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
      {question.options && (
        <div className="space-y-2">
          {(isEditing ? editedQuestion.options : question.options).map((option: string, idx: number) => (
            <div key={idx} className="flex items-start gap-2">
              <span className="text-xs font-medium text-[var(--text-secondary)] min-w-[20px] mt-1">
                {String.fromCharCode(65 + idx)}.
              </span>
              {isEditing ? (
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
              ) : (
                <span className="text-sm text-[var(--text-secondary)]">{option}</span>
              )}
            </div>
          ))}
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
        <textarea
          value={editedQuestion.question}
          onChange={(e) => onUpdateField('question', e.target.value)}
          className="w-full p-2 text-sm border border-[var(--border)] rounded-lg mb-3 min-h-[60px] resize-y"
        />
      ) : (
        <p className="text-sm text-[var(--text-primary)] mb-3">{question.question}</p>
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
              className="flex-1 px-2 py-1 text-xs border border-[var(--border)] rounded"
            />
          </div>
        ) : (
          <div>
            <span className="font-bold text-sm">Answer:</span> <span className="text-sm">{question.answer}</span>
          </div>
        )}
      </div>
    </>
  )

  const renderMatchColumns = () => (
    <>
      {question.instruction && (
        <p className="text-sm italic text-[var(--text-secondary)] mb-3">{question.instruction}</p>
      )}
      <div className="grid grid-cols-2 gap-4 mb-3">
        <div>
          <p className="text-xs font-medium text-[var(--text-muted)] mb-2">Column A</p>
          <div className="space-y-1">
            {question.column_a?.map((item: string, idx: number) => (
              <div key={idx} className="text-sm text-[var(--text-primary)]">
                {idx + 1}. {item}
              </div>
            ))}
          </div>
        </div>
        <div>
          <p className="text-xs font-medium text-[var(--text-muted)] mb-2">Column B</p>
          <div className="space-y-1">
            {question.column_b?.map((item: string, idx: number) => (
              <div key={idx} className="text-sm text-[var(--text-primary)]">
                {String.fromCharCode(65 + idx)}. {item}
              </div>
            ))}
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

  const renderComprehensionObjective = () => (
    <>
      {question.instruction && (
        <p className="text-sm italic text-[var(--text-secondary)] mb-3">{question.instruction}</p>
      )}
      <div className="p-3 bg-[var(--background-light)] rounded-lg mb-3">
        <p className="text-sm text-[var(--text-primary)] leading-relaxed">{question.passage}</p>
      </div>
      <div className="space-y-3">
        {question.sub_questions?.map((subQ: any, idx: number) => (
          <div key={idx} className="pl-4 border-l-2 border-[var(--border)]">
            <p className="text-xs font-medium text-[var(--text-muted)] mb-1">{idx + 1}. ({subQ.marks} marks)</p>
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
            {subQ.answer && (
              <div className="answer-display mt-2">
                <div>
                  <span className="font-bold text-sm">Answer:</span> <span className="text-sm">{typeof subQ.answer === 'boolean' ? (subQ.answer ? 'True' : 'False') : subQ.answer}</span>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </>
  )

  const renderShortLongAnswer = () => (
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
      {question.instruction && (
        <p className="text-sm italic text-[var(--text-secondary)] mb-3">{question.instruction}</p>
      )}
      {question.prompt && (
        <div className="p-3 bg-[var(--background-light)] rounded-lg mb-3">
          <p className="text-sm font-medium text-[var(--text-primary)]">{question.prompt}</p>
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
      {question.image_description && (
        <div className="p-3 bg-[var(--background-light)] rounded-lg mb-3 border border-[var(--border)]">
          <p className="text-xs font-medium text-[var(--text-muted)] mb-1">Image:</p>
          <p className="text-sm text-[var(--text-primary)] italic">{question.image_description}</p>
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

  const renderComprehensionSubjective = () => (
    <>
      {question.instruction && (
        <p className="text-sm italic text-[var(--text-secondary)] mb-3">{question.instruction}</p>
      )}
      <div className="p-3 bg-[var(--background-light)] rounded-lg mb-3">
        <p className="text-sm text-[var(--text-primary)] leading-relaxed">{question.passage}</p>
      </div>
      <div className="space-y-3">
        {question.sub_questions?.map((subQ: any, idx: number) => (
          <div key={idx} className="pl-4 border-l-2 border-[var(--border)]">
            <p className="text-xs font-medium text-[var(--text-muted)] mb-1">{idx + 1}. ({subQ.marks} marks)</p>
            <p className="text-sm text-[var(--text-primary)] mb-2">{subQ.question}</p>
            <div className="answer-space bg-[var(--background-light)] rounded p-2 min-h-[40px]">
              <span className="text-xs text-[var(--text-muted)]">Answer space</span>
            </div>
            {subQ.answer && (
              <div className="answer-display mt-2 pt-2 border-t border-[var(--border-light)]">
                <div className="mb-1">
                  <span className="font-bold text-sm">Sample Answer:</span>
                </div>
                <p className="text-sm text-[var(--text-primary)]">{subQ.answer}</p>
              </div>
            )}
          </div>
        ))}
      </div>
    </>
  )

  // Math question type renderers
  const renderFillInBlanksWordBank = () => (
    <>
      {isEditing ? (
        <textarea
          value={editedQuestion.blanks_sentence}
          onChange={(e) => onUpdateField('blanks_sentence', e.target.value)}
          className="w-full p-2 text-sm border border-[var(--border)] rounded-lg mb-3 min-h-[50px] resize-y"
        />
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
        <textarea
          value={editedQuestion.question}
          onChange={(e) => onUpdateField('question', e.target.value)}
          className="w-full p-2 text-sm border border-[var(--border)] rounded-lg mb-3 min-h-[60px] resize-y"
        />
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
      {question.instruction && (
        <p className="text-sm italic text-[var(--text-secondary)] mb-3">{question.instruction}</p>
      )}
      {question.figure_description && (
        <div className="p-3 bg-[var(--background-light)] rounded-lg mb-3 border border-[var(--border)]">
          <p className="text-xs font-medium text-[var(--text-muted)] mb-2">Figure:</p>
          <p className="text-sm text-[var(--text-primary)] italic leading-relaxed">{question.figure_description}</p>
        </div>
      )}
      <div className="answer-space bg-[var(--background-light)] border border-[var(--border)] rounded-lg p-3 min-h-[80px] flex items-center justify-center">
        <span className="text-xs text-[var(--text-muted)]">Label the figure</span>
      </div>
      {question.answer && (
        <div className="answer-display mt-3 pt-3 border-t border-[var(--border-light)]">
          <div className="mb-2">
            <span className="font-bold text-sm">Expected Labels:</span>
          </div>
          <div className="p-3 bg-[var(--background-light)] rounded-lg">
            <p className="text-sm text-[var(--text-primary)] leading-relaxed">{question.answer}</p>
          </div>
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

  return (
    <div className={`question-container border-b border-[var(--border-light)] last:border-0 pb-4 last:pb-0 mb-4 last:mb-0 ${!isSelected ? 'not-selected' : ''}`}>
      <div className="flex items-start gap-3 print:block">
        <input
          type="checkbox"
          checked={isSelected}
          onChange={onToggleSelection}
          className="no-print mt-1 w-4 h-4 accent-[var(--primary)]"
        />
        <div className="flex-1">
          <div className="flex items-center justify-between mb-2 print:mb-3">
            <span className="text-sm font-semibold text-[var(--text-primary)]">Question {index + 1}</span>
            <div className="flex items-center gap-2">
              {isEditing ? (
                <input
                  type="number"
                  value={editedQuestion.marks}
                  onChange={(e) => onUpdateField('marks', parseInt(e.target.value))}
                  className="w-16 h-7 px-2 text-xs border border-[var(--border)] rounded"
                  min="1"
                />
              ) : (
                <span className="text-xs text-[var(--text-muted)] print:text-[var(--text-primary)]">{question.marks} marks</span>
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
