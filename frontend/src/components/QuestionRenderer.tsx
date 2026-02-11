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
  questionId,
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
          <div className="mt-3 pt-3 border-t border-[var(--border-light)]">
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
              <span className="text-xs font-medium text-[var(--primary)]">Answer: {question.answer}</span>
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
      <div className="mt-3 pt-3 border-t border-[var(--border-light)]">
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
          <span className="text-xs font-medium text-[var(--primary)]">
            Answer: {question.answer ? 'True' : 'False'}
          </span>
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
      <div className="mt-3 pt-3 border-t border-[var(--border-light)]">
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
          <span className="text-xs font-medium text-[var(--primary)]">Answer: {question.answer}</span>
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
      {question.answer && (
        <div className="mt-3 pt-3 border-t border-[var(--border-light)]">
          <p className="text-xs font-medium text-[var(--primary)] mb-2">Answer Key:</p>
          <div className="space-y-1">
            {Object.entries(question.answer).map(([key, value]: [string, any], idx: number) => (
              <div key={idx} className="text-xs text-[var(--text-secondary)]">
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
      {question.answer && Array.isArray(question.answer) && (
        <div className="mt-3 pt-3 border-t border-[var(--border-light)]">
          <p className="text-xs font-medium text-[var(--primary)] mb-2">Correct Order:</p>
          <div className="space-y-1">
            {question.answer.map((sentence: string, idx: number) => (
              <div key={idx} className="text-xs text-[var(--text-secondary)]">
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
            {subQ.answer && (
              <div className="mt-2">
                <span className="text-xs font-medium text-[var(--primary)]">
                  Answer: {typeof subQ.answer === 'boolean' ? (subQ.answer ? 'True' : 'False') : subQ.answer}
                </span>
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
      <div className="bg-[var(--background-light)] border border-[var(--border)] rounded-lg p-3 min-h-[60px]">
        <span className="text-xs text-[var(--text-muted)]">Answer space provided for student</span>
      </div>
      {question.answer && (
        <div className="mt-3 pt-3 border-t border-[var(--border-light)]">
          <p className="text-xs font-medium text-[var(--primary)] mb-2">Sample Answer:</p>
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

          return (
            <div key={idx} className="pl-4 border-l-2 border-[var(--border)]">
              <p className="text-xs font-medium text-[var(--text-muted)] mb-1">
                {idx + 1}. {sentenceMarks && `(${sentenceMarks} marks)`}
              </p>
              <p className="text-sm text-[var(--text-primary)] mb-2">{sentenceText}</p>
              <div className="bg-[var(--background-light)] rounded p-2">
                <span className="text-xs text-[var(--text-muted)]">Answer space</span>
              </div>
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
      <div className="space-y-3">
        {question.words?.map((wordItem: any, idx: number) => {
          // Handle both formats: string or object with word/answer
          const isObject = typeof wordItem === 'object' && wordItem !== null
          const wordText = isObject ? wordItem.word : wordItem

          return (
            <div key={idx} className="pl-4 border-l-2 border-[var(--border)]">
              <p className="text-sm font-medium text-[var(--text-primary)] mb-2">{idx + 1}. {wordText}</p>
              <div className="bg-[var(--background-light)] rounded p-2">
                <span className="text-xs text-[var(--text-muted)]">Sentence space</span>
              </div>
            </div>
          )
        })}
      </div>
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
      <div className="bg-[var(--background-light)] border border-[var(--border)] rounded-lg p-3 min-h-[80px]">
        <span className="text-xs text-[var(--text-muted)]">Writing space provided for student</span>
      </div>
      {question.answer && (
        <div className="mt-3 pt-3 border-t border-[var(--border-light)]">
          <p className="text-xs font-medium text-[var(--primary)] mb-2">Sample Answer:</p>
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
      <div className="bg-[var(--background-light)] border border-[var(--border)] rounded-lg p-3 min-h-[60px]">
        <span className="text-xs text-[var(--text-muted)]">Description space provided for student</span>
      </div>
      {question.answer && (
        <div className="mt-3 pt-3 border-t border-[var(--border-light)]">
          <p className="text-xs font-medium text-[var(--primary)] mb-2">Sample Answer:</p>
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
            <div className="bg-[var(--background-light)] rounded p-2 min-h-[40px]">
              <span className="text-xs text-[var(--text-muted)]">Answer space</span>
            </div>
            {subQ.answer && (
              <div className="mt-2 p-2 bg-[var(--background-light)] rounded border-l-2 border-[var(--primary)]">
                <p className="text-xs font-medium text-[var(--primary)] mb-1">Sample Answer:</p>
                <p className="text-sm text-[var(--text-primary)]">{subQ.answer}</p>
              </div>
            )}
          </div>
        ))}
      </div>
    </>
  )

  return (
    <div className="border-b border-[var(--border-light)] last:border-0 pb-4 last:pb-0 mb-4 last:mb-0">
      <div className="flex items-start gap-3">
        <input
          type="checkbox"
          checked={isSelected}
          onChange={onToggleSelection}
          className="mt-1 w-4 h-4 accent-[var(--primary)]"
        />
        <div className="flex-1">
          <div className="flex items-center justify-between mb-2">
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
                <span className="text-xs text-[var(--text-muted)]">{question.marks} marks</span>
              )}
              {!isEditing && (
                <button
                  onClick={onStartEditing}
                  className="p-1 hover:bg-[var(--background-light)] rounded transition-colors"
                  title="Edit question"
                >
                  <Edit2 size={14} className="text-[var(--text-muted)]" />
                </button>
              )}
            </div>
          </div>

          {renderQuestionContent()}

          {isEditing && (
            <div className="flex gap-2 mt-3">
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
