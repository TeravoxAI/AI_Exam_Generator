/**
 * PDFPreview — live A4 HTML render that mirrors the jsPDF output.
 * Shows every selected question in exam-paper layout.
 * Each image slot shows the uploaded image with resize handles.
 */
import { useRef, useState } from 'react'
import { Upload, X, ZoomIn, ZoomOut } from 'lucide-react'
import type { ImageAttachment, ImageStore } from '../utils/imageStore'

// ─── helpers ────────────────────────────────────────────────────────────────

const toRoman = (n: number) => {
  const r = ['i','ii','iii','iv','v','vi','vii','viii','ix','x','xi','xii','xiii','xiv','xv','xvi','xvii','xviii','xix','xx']
  return n >= 1 && n <= 20 ? r[n - 1] : String(n)
}

const gradeToRoman = (g: string) => {
  const n = parseInt(g)
  if (isNaN(n)) return g
  const r = ['I','II','III','IV','V','VI','VII','VIII','IX','X','XI','XII']
  return n >= 1 && n <= 12 ? r[n - 1] : g
}

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

// ─── ImageSlot — uploadable, resizable image cell ───────────────────────────

interface ImageSlotProps {
  slotKey: string
  label?: string
  attachment?: ImageAttachment
  onUpload: (key: string, file: File) => void
  onUpdate: (key: string, patch: Partial<ImageAttachment>) => void
  onRemove: (key: string) => void
  compact?: boolean
}

function ImageSlot({ slotKey, label, attachment, onUpload, onUpdate, onRemove, compact }: ImageSlotProps) {
  const fileRef = useRef<HTMLInputElement>(null)
  const [showControls, setShowControls] = useState(false)

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0]
    if (f) onUpload(slotKey, f)
    e.target.value = ''
  }

  if (!attachment) {
    return (
      <div
        onClick={() => fileRef.current?.click()}
        className={`border-2 border-dashed border-gray-300 rounded flex flex-col items-center justify-center cursor-pointer hover:border-green-500 hover:bg-green-50 transition-colors group ${compact ? 'h-16 w-24' : 'h-24 w-full'}`}
      >
        <Upload size={compact ? 12 : 16} className="text-gray-400 group-hover:text-green-500 mb-0.5" />
        <span className="text-xs text-gray-400 group-hover:text-green-600 text-center px-1">{label || 'Upload image'}</span>
        <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleFile} />
      </div>
    )
  }

  return (
    <div
      className="relative inline-block group"
      onMouseEnter={() => setShowControls(true)}
      onMouseLeave={() => setShowControls(false)}
      style={{ width: attachment.widthMm * 2.5, maxWidth: '100%' }}
    >
      <img
        src={attachment.dataUrl}
        alt="attached"
        className="rounded border border-gray-200 object-contain block"
        style={{ width: '100%', height: attachment.heightMm * 2.5 }}
      />

      {/* Overlay controls */}
      {showControls && (
        <div className="absolute inset-0 bg-black/40 rounded flex flex-col items-center justify-center gap-1 p-1">
          <button
            onClick={() => onRemove(slotKey)}
            className="absolute top-1 right-1 bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs hover:bg-red-600"
          >
            <X size={10} />
          </button>

          <div className="flex flex-col gap-1 w-full px-2">
            <div className="flex items-center gap-1">
              <span className="text-white text-xs w-10 shrink-0">W mm</span>
              <input
                type="range" min="20" max="120" step="5"
                value={attachment.widthMm}
                onChange={e => onUpdate(slotKey, { widthMm: +e.target.value })}
                className="flex-1 h-1.5 accent-green-400"
                onClick={e => e.stopPropagation()}
              />
              <span className="text-white text-xs w-7 text-right">{attachment.widthMm}</span>
            </div>
            <div className="flex items-center gap-1">
              <span className="text-white text-xs w-10 shrink-0">H mm</span>
              <input
                type="range" min="15" max="100" step="5"
                value={attachment.heightMm}
                onChange={e => onUpdate(slotKey, { heightMm: +e.target.value })}
                className="flex-1 h-1.5 accent-green-400"
                onClick={e => e.stopPropagation()}
              />
              <span className="text-white text-xs w-7 text-right">{attachment.heightMm}</span>
            </div>
            <div className="flex gap-1 justify-center mt-0.5">
              {(['left','center','right'] as const).map(a => (
                <button
                  key={a}
                  onClick={e => { e.stopPropagation(); onUpdate(slotKey, { alignment: a }) }}
                  className={`text-xs px-1.5 py-0.5 rounded ${attachment.alignment === a ? 'bg-green-500 text-white' : 'bg-white/20 text-white hover:bg-white/40'}`}
                >
                  {a[0].toUpperCase()}
                </button>
              ))}
            </div>
          </div>

          <button
            onClick={() => fileRef.current?.click()}
            className="text-xs bg-white/20 text-white px-2 py-0.5 rounded hover:bg-white/40 mt-0.5"
          >
            Change
          </button>
          <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleFile} />
        </div>
      )}
    </div>
  )
}

// ─── Blank answer lines ──────────────────────────────────────────────────────

function AnswerLines({ count = 3 }: { count?: number }) {
  return (
    <div className="mt-2 space-y-2">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="flex items-end gap-1">
          {i === 0 && <span className="text-xs font-bold text-gray-500 shrink-0">Ans:</span>}
          <div className="flex-1 border-b border-gray-400 h-4" />
        </div>
      ))}
    </div>
  )
}

// ─── Question type renderers ─────────────────────────────────────────────────

interface QRenderProps {
  q: any
  typeId: string
  qIdx: number  // original index in array
  subIdxDisplay: number  // 1-based display index (after filter)
  category: 'obj' | 'subj'
  images: ImageStore
  onUpload: (key: string, file: File) => void
  onUpdate: (key: string, patch: Partial<ImageAttachment>) => void
  onRemove: (key: string) => void
}

function QuestionItem({ q, typeId, qIdx, subIdxDisplay, category, images, onUpload, onUpdate, onRemove }: QRenderProps) {
  const baseKey = `${category}-${typeId}-${qIdx}`

  const imgSlot = (key: string, label?: string, compact?: boolean) => (
    <ImageSlot
      slotKey={key}
      label={label}
      attachment={images[key]}
      onUpload={onUpload}
      onUpdate={onUpdate}
      onRemove={onRemove}
      compact={compact}
    />
  )

  const renderContent = () => {
    switch (typeId) {
      case 'mcq':
      case 'circle_correct_answer': {
        return (
          <div>
            <p className="text-xs leading-relaxed mb-1">{q.question || q.statement}</p>
            {imgSlot(baseKey, 'Add image')}
            {q.options && (
              <div className="grid grid-cols-2 gap-x-4 mt-1 ml-2">
                {q.options.map((opt: string, oi: number) => (
                  <div key={oi} className="flex items-start gap-1">
                    <span className="text-xs text-gray-500">{String.fromCharCode(97 + oi)})</span>
                    <span className="text-xs">{opt}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )
      }

      case 'true_false':
        return <p className="text-xs font-sans">{q.statement}</p>

      case 'fill_in_blanks': {
        const parts = (q.question || '').split(/_{3,}/)
        return (
          <div>
            <p className="text-xs leading-relaxed">
              {parts.map((seg: string, si: number) => (
                <span key={si}>
                  {seg}
                  {si < parts.length - 1 && (
                    <span className="inline-block border-b border-gray-600 w-20 mx-1" />
                  )}
                </span>
              ))}
            </p>
            {imgSlot(baseKey, 'Add image')}
          </div>
        )
      }

      case 'fill_in_blanks_from_word_bank': {
        const parts2 = (q.blanks_sentence || '').split(/_{3,}/)
        return (
          <div>
            {q.word_bank && q.word_bank.length > 0 && (
              <div className="border border-gray-300 rounded px-2 py-1 mb-1.5 text-xs">
                <span className="font-semibold">Word Bank: </span>{q.word_bank.join('   |   ')}
              </div>
            )}
            <p className="text-xs leading-relaxed">
              {parts2.map((seg: string, si: number) => (
                <span key={si}>
                  {seg}
                  {si < parts2.length - 1 && (
                    <span className="inline-block border-b border-gray-600 w-20 mx-1" />
                  )}
                </span>
              ))}
            </p>
          </div>
        )
      }

      case 'match_columns': {
        const colA: string[] = q.column_a || []
        const colB: string[] = q.column_b || []
        return (
          <div>
            <div className="grid grid-cols-2 gap-4 mt-1">
              <div>
                <p className="text-xs font-semibold text-gray-500 mb-1">Column A</p>
                {colA.map((item: string, ri: number) => (
                  <div key={ri} className="mb-2">
                    <p className="text-xs">{ri + 1}. {item.replace(/^\d+[\.\)]\s*/, '')}</p>
                    {imgSlot(`${baseKey}-colA-${ri}`, '+ Pic', true)}
                  </div>
                ))}
              </div>
              <div>
                <p className="text-xs font-semibold text-gray-500 mb-1">Column B</p>
                {colB.map((item: string, ri: number) => (
                  <div key={ri} className="mb-2">
                    <p className="text-xs">{String.fromCharCode(65 + ri)}. {item.replace(/^[A-Z][\.\)]\s*/, '')}</p>
                    {imgSlot(`${baseKey}-colB-${ri}`, '+ Pic', true)}
                  </div>
                ))}
              </div>
            </div>
          </div>
        )
      }

      case 'rearrange_sentences': {
        return (
          <div className="space-y-1 mt-0.5">
            {(q.sentences || []).map((s: string, si: number) => (
              <p key={si} className="text-xs">{si + 1}. {s}</p>
            ))}
            <AnswerLines count={1} />
          </div>
        )
      }

      case 'unseen_comprehension_objective':
      case 'unseen_comprehension_subjective': {
        return (
          <div>
            {q.passage && (
              <div className="border border-gray-200 rounded p-2 bg-gray-50 mb-2">
                <p className="text-xs font-semibold text-gray-500 mb-1">Passage:</p>
                <p className="text-xs leading-relaxed italic">{q.passage}</p>
              </div>
            )}
            {(q.sub_questions || []).map((sq: any, si: number) => (
              <div key={si} className="mb-2 pl-2 border-l-2 border-gray-200">
                <p className="text-xs">{toRoman(si + 1)}) {sq.question}</p>
                {sq.options && (
                  <div className="grid grid-cols-2 gap-x-3 mt-0.5 ml-2">
                    {sq.options.map((opt: string, oi: number) => (
                      <span key={oi} className="text-xs text-gray-600">{String.fromCharCode(97 + oi)}) {opt}</span>
                    ))}
                  </div>
                )}
                {typeId === 'unseen_comprehension_subjective' && <AnswerLines count={2} />}
              </div>
            ))}
          </div>
        )
      }

      case 'short_answer': {
        return (
          <div>
            <p className="text-xs leading-relaxed">{q.question}</p>
            {imgSlot(baseKey, 'Add image')}
            <AnswerLines count={3} />
          </div>
        )
      }

      case 'long_answer': {
        return (
          <div>
            <p className="text-xs leading-relaxed">{q.question}</p>
            {imgSlot(baseKey, 'Add image')}
            <AnswerLines count={5} />
          </div>
        )
      }

      case 'complete_sentences': {
        return (
          <div>
            {q.instruction && <p className="text-xs italic text-gray-500 mb-1">{q.instruction}</p>}
            <div className="space-y-1.5">
              {(q.sentences || []).map((sent: any, si: number) => {
                const text = typeof sent === 'object' ? (sent.incomplete || sent.sentence) : sent
                const parts = (text || '').split(/_{3,}/)
                return (
                  <p key={si} className="text-xs">
                    {toRoman(si + 1)}) {parts.map((seg: string, pi: number) => (
                      <span key={pi}>
                        {seg}
                        {pi < parts.length - 1 && <span className="inline-block border-b border-gray-600 w-16 mx-1" />}
                      </span>
                    ))}
                  </p>
                )
              })}
            </div>
          </div>
        )
      }

      case 'make_sentences': {
        return (
          <div>
            {q.instruction && <p className="text-xs italic text-gray-500 mb-1">{q.instruction}</p>}
            <div className="space-y-1.5">
              {(q.words || []).map((w: any, wi: number) => {
                const word = typeof w === 'object' ? w.word : w
                return (
                  <div key={wi}>
                    <p className="text-xs font-semibold">{toRoman(wi + 1)}) {word}:</p>
                    <div className="border-b border-gray-400 mt-1 mb-0.5 w-full" />
                  </div>
                )
              })}
            </div>
          </div>
        )
      }

      case 'unseen_creative_writing': {
        return (
          <div>
            {q.instruction && <p className="text-xs italic text-gray-500 mb-1">{q.instruction}</p>}
            {q.prompt && (
              <div className="border border-amber-200 bg-amber-50 rounded px-2 py-1 mb-1.5">
                <p className="text-xs font-medium text-amber-800">Topic: {q.prompt}</p>
              </div>
            )}
            {q.vocabulary_words && q.vocabulary_words.length > 0 && (
              <div className="border border-gray-200 rounded px-2 py-1 mb-1.5 text-xs">
                <span className="font-semibold">Word Bank: </span>{q.vocabulary_words.join('   |   ')}
              </div>
            )}
            <AnswerLines count={6} />
          </div>
        )
      }

      case 'picture_description': {
        const picKey = baseKey
        return (
          <div>
            {q.instruction && <p className="text-xs italic text-gray-500 mb-1.5">{q.instruction}</p>}
            <div className={`flex ${images[picKey]?.alignment === 'left' ? 'justify-start' : images[picKey]?.alignment === 'right' ? 'justify-end' : 'justify-center'} mb-2`}>
              {imgSlot(picKey, 'Upload picture for this question')}
            </div>
            <AnswerLines count={4} />
          </div>
        )
      }

      case 'label_figures': {
        const figKey = baseKey
        return (
          <div>
            {q.instruction && <p className="text-xs italic text-gray-500 mb-1">{q.instruction}</p>}
            <div className={`flex ${images[figKey]?.alignment === 'left' ? 'justify-start' : images[figKey]?.alignment === 'right' ? 'justify-end' : 'justify-center'} mb-2`}>
              {imgSlot(figKey, 'Upload figure')}
            </div>
            <div className="border-b border-gray-400 mt-1 w-full" />
          </div>
        )
      }

      case 'drawing_exercise': {
        return (
          <div>
            <p className="text-xs leading-relaxed mb-2">{q.question || q.instruction}</p>
            <div className="border-2 border-dashed border-gray-300 rounded flex items-center justify-center" style={{ height: 80 }}>
              <span className="text-xs text-gray-400 italic">[ Drawing Space ]</span>
            </div>
          </div>
        )
      }

      case 'short_practice_questions_missing_solution': {
        return (
          <div>
            <p className="text-xs leading-relaxed">{q.question}</p>
            {q.partial_solution && (
              <p className="text-xs italic text-gray-500 mt-0.5 ml-2">{q.partial_solution}</p>
            )}
            {imgSlot(baseKey, 'Add image')}
            <div className="border border-gray-200 rounded mt-1.5" style={{ height: 48 }}>
              <div className="h-full" style={{ backgroundImage: 'repeating-linear-gradient(transparent, transparent 15px, #ddd 15px, #ddd 16px)' }} />
            </div>
          </div>
        )
      }

      case 'practice_questions_by_topic': {
        return (
          <div>
            <p className="text-xs leading-relaxed">{q.question}</p>
            {imgSlot(baseKey, 'Add image')}
            <div className="border border-gray-200 rounded mt-1.5" style={{ height: 64 }}>
              <div className="h-full" style={{ backgroundImage: 'repeating-linear-gradient(transparent, transparent 15px, #ddd 15px, #ddd 16px)' }} />
            </div>
          </div>
        )
      }

      case 'real_life_story_problems': {
        return (
          <div>
            {q.context && <p className="text-xs italic text-gray-600 mb-0.5">{q.context}</p>}
            <p className="text-xs font-medium">{q.question}</p>
            {imgSlot(baseKey, 'Add image')}
            {(q.solution_steps || []).map((step: string, si: number) => (
              <div key={si} className="flex items-end gap-1 mt-1">
                <span className="text-xs font-bold text-gray-600 shrink-0">{step}</span>
                <div className="flex-1 border-b border-gray-400 h-4" />
              </div>
            ))}
          </div>
        )
      }

      case 'grammar_correction': {
        return (
          <div>
            {q.instruction && <p className="text-xs italic text-gray-500 mb-1">{q.instruction}</p>}
            <div className="space-y-2">
              {(q.sentences || []).map((sent: any, si: number) => (
                <div key={si}>
                  <p className="text-xs">{toRoman(si + 1)}) {sent.incorrect}</p>
                  <div className="border-b border-gray-400 mt-1 w-full" />
                </div>
              ))}
            </div>
          </div>
        )
      }

      case 'parts_of_speech': {
        return (
          <div>
            {q.instruction && <p className="text-xs italic text-gray-500 mb-1">{q.instruction}</p>}
            <div className="space-y-2">
              {(q.sentences || []).map((sent: any, si: number) => (
                <div key={si}>
                  <p className="text-xs">{toRoman(si + 1)}) {sent.sentence}</p>
                  <div className="border-b border-gray-400 mt-1 w-full" />
                </div>
              ))}
            </div>
          </div>
        )
      }

      default:
        return <p className="text-xs text-gray-500">{q.question || q.statement || q.instruction || '[content]'}</p>
    }
  }

  // true_false needs special inline layout: prefix + statement + boxes all on same row
  if (typeId === 'true_false') {
    return (
      <div className="flex items-center justify-between gap-2 mb-1.5">
        <div className="flex items-start gap-1 flex-1">
          <span className="text-xs font-sans text-gray-700 shrink-0">({toRoman(subIdxDisplay)})</span>
          <p className="text-xs leading-snug font-sans">{q.statement}</p>
        </div>
        <div className="flex shrink-0" style={{ gap: 12 }}>
          <div className="w-4 h-4 border border-gray-800" />
          <div className="w-4 h-4 border border-gray-800" />
        </div>
      </div>
    )
  }

  return (
    <div className="mb-1.5">
      <div className="flex items-start gap-1">
        <span className="text-xs font-sans text-gray-700 shrink-0">({toRoman(subIdxDisplay)})</span>
        <div className="flex-1">{renderContent()}</div>
      </div>
    </div>
  )
}

// ─── PDFPreview main component ───────────────────────────────────────────────

interface PDFPreviewProps {
  exam: any
  selectedQuestions: Set<string>
  schoolName: string
  totalMarks: number
  timeAllowed: string
  grade: string
  subject: string
  images: ImageStore
  onUpload: (key: string, file: File) => void
  onUpdate: (key: string, patch: Partial<ImageAttachment>) => void
  onRemove: (key: string) => void
}

export function PDFPreview({
  exam,
  selectedQuestions,
  schoolName,
  totalMarks,
  timeAllowed,
  grade,
  subject,
  images,
  onUpload,
  onUpdate,
  onRemove,
}: PDFPreviewProps) {
  const [zoom, setZoom] = useState(0.75)
  const [page, setPage] = useState<'exam' | 'key'>('exam')

  const examContent = exam?.exam_content || exam

  // Build Q-number map (typeId → Q number)
  const qNumMap: Record<string, number> = {}
  let qn = 0
  const addSection = (section: Record<string, any>) => {
    Object.entries(section).forEach(([typeId, qs]) => {
      if (Array.isArray(qs) && qs.length > 0) { qn++; qNumMap[typeId] = qn }
    })
  }
  if (examContent?.objective) addSection(examContent.objective)
  if (examContent?.subjective) addSection(examContent.subjective)

  const displayName = (schoolName?.trim() || 'SCHOOL NAME').toUpperCase()
  const displayGrade = gradeToRoman(String(grade || '').replace(/^class\s*/i, ''))

  const renderSection = (section: Record<string, any> | undefined, catPrefix: 'obj' | 'subj') => {
    if (!section) return null
    return Object.entries(section).map(([typeId, qs]) => {
      const arr = Array.isArray(qs) ? qs : []
      if (arr.length === 0) return null
      const filteredIdxs = arr.map((_: any, i: number) => i).filter((i: number) => selectedQuestions.has(`${catPrefix}-${typeId}-${i}`))
      if (filteredIdxs.length === 0) return null
      const totalTypeMarks = filteredIdxs.reduce((s: number, i: number) => s + (arr[i]?.marks || 0), 0)
      const perItem = filteredIdxs.length > 0 ? arr[filteredIdxs[0]]?.marks : 0
      const uniform = perItem && filteredIdxs.every((i: number) => arr[i]?.marks === perItem)
      const marksStr = uniform
        ? `[${perItem}×${filteredIdxs.length}= /${totalTypeMarks}]`
        : `[   /${totalTypeMarks}]`
      const label = TYPE_LABELS[typeId] || typeId.split('_').map((w: string) => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')

      // Compute indent: width of "Q.N.  " prefix to align (i) under label text
      const qPrefix = `Q.${qNumMap[typeId]}.  `
      // approximate: each char ~6.5px at text-sm(14px), but we use em-based indent
      const prefixChars = qPrefix.length
      const indentPx = prefixChars * 6.5  // rough px indent matching PDF ix

      return (
        <div key={typeId} className="mb-3">
          {/* Q header — no underline, bold, marks right-aligned */}
          <div className="flex justify-between items-baseline mb-1">
            <span className="text-sm font-bold font-sans">{qPrefix}{label}</span>
            <span className="text-xs font-semibold font-sans text-gray-700">{marksStr}</span>
          </div>

          {/* Items — indented under label text */}
          <div style={{ paddingLeft: indentPx }}>
            {/* True/False: T F column headers right-aligned, above boxes */}
            {typeId === 'true_false' && (
              <div className="flex justify-end mb-0.5 pr-0" style={{ gap: 12 }}>
                <span className="text-xs font-bold font-sans w-4 text-center">T</span>
                <span className="text-xs font-bold font-sans w-4 text-center">F</span>
              </div>
            )}

            {/* Special: circle_correct_answer with all images → horizontal grid */}
            {typeId === 'circle_correct_answer' && filteredIdxs.length >= 2 && filteredIdxs.every((i: number) => images[`${catPrefix}-${typeId}-${i}`]) ? (
              <div className={`grid gap-3`} style={{ gridTemplateColumns: `repeat(${filteredIdxs.length}, 1fr)` }}>
                {filteredIdxs.map((origIdx: number, di: number) => {
                  const q = arr[origIdx]
                  const k = `${catPrefix}-${typeId}-${origIdx}`
                  return (
                    <div key={origIdx} className="flex flex-col items-center gap-1">
                      <ImageSlot slotKey={k} attachment={images[k]} onUpload={onUpload} onUpdate={onUpdate} onRemove={onRemove} compact />
                      <p className="text-xs text-center">{toRoman(di + 1)}) {q.question || q.statement}</p>
                      {q.options && (
                        <div className="flex flex-wrap gap-1 justify-center">
                          {q.options.map((o: string, oi: number) => (
                            <span key={oi} className="text-xs flex items-center gap-0.5">
                              <span className="w-3 h-3 border border-gray-500 rounded-sm inline-block" />{o}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            ) : (
              filteredIdxs.map((origIdx: number, di: number) => (
                <QuestionItem
                  key={origIdx}
                  q={arr[origIdx]}
                  typeId={typeId}
                  qIdx={origIdx}
                  subIdxDisplay={di + 1}
                  category={catPrefix}
                  images={images}
                  onUpload={onUpload}
                  onUpdate={onUpdate}
                  onRemove={onRemove}
                />
              ))
            )}
          </div>
        </div>
      )
    })
  }

  const renderAnswerKey = () => {
    if (!examContent) return null
    let akQ = 0
    const sections = [
      { section: examContent.objective, cat: 'obj' as const },
      { section: examContent.subjective, cat: 'subj' as const },
    ]
    return sections.map(({ section, cat }) => {
      if (!section) return null
      return Object.entries(section).map(([typeId, qs]) => {
        const arr = Array.isArray(qs) ? qs : []
        const filteredIdxs = arr.map((_: any, i: number) => i).filter((i: number) => selectedQuestions.has(`${cat}-${typeId}-${i}`))
        if (filteredIdxs.length === 0) return null
        akQ++
        const label = TYPE_LABELS[typeId] || typeId
        return (
          <div key={`${cat}-${typeId}`} className="mb-3">
            <p className="text-xs font-bold border-b border-gray-300 pb-0.5 mb-1">Q{akQ}. {label}</p>
            {filteredIdxs.map((origIdx: number, di: number) => {
              const q = arr[origIdx]
              const ans = q.answer ?? q.sample_answer
              const formatAns = (a: any): string => {
                if (typeof a === 'boolean') return a ? 'True' : 'False'
                if (!a || a === '') return 'N/A'
                if (typeof a === 'object' && !Array.isArray(a)) return Object.entries(a).map(([k, v]) => `${k} → ${v}`).join(', ')
                if (Array.isArray(a)) return a.join(', ')
                return String(a)
              }
              if (q.sub_questions) {
                return (
                  <div key={origIdx} className="ml-2 mb-1">
                    {q.sub_questions.map((sq: any, si: number) => (
                      <p key={si} className="text-xs text-gray-700">{toRoman(si + 1)}) {formatAns(sq.answer)} <span className="text-gray-400">({sq.marks}m)</span></p>
                    ))}
                  </div>
                )
              }
              if (typeId === 'make_sentences') {
                return (
                  <div key={origIdx} className="ml-2">
                    {(q.words || []).map((w: any, wi: number) => {
                      const word = typeof w === 'object' ? w.word : w
                      const sample = typeof w === 'object' && w.answer ? w.answer : "(student's own)"
                      return <p key={wi} className="text-xs">{toRoman(wi + 1)}) {word}: {sample}</p>
                    })}
                  </div>
                )
              }
              if (typeId === 'grammar_correction') {
                return <div key={origIdx} className="ml-2">
                  {(q.sentences || []).map((s: any, si: number) => (
                    <p key={si} className="text-xs">{toRoman(si + 1)}) {s.answer}</p>
                  ))}
                </div>
              }
              if (typeId === 'parts_of_speech') {
                return <div key={origIdx} className="ml-2">
                  {(q.sentences || []).map((s: any, si: number) => (
                    <p key={si} className="text-xs">{toRoman(si + 1)}) {s.answer}</p>
                  ))}
                </div>
              }
              return (
                <p key={origIdx} className="text-xs ml-2 text-gray-700">
                  {toRoman(di + 1)}) {formatAns(ans)} <span className="text-gray-400">({q.marks}m)</span>
                </p>
              )
            })}
          </div>
        )
      })
    })
  }

  if (!examContent) {
    return (
      <div className="flex items-center justify-center h-full text-gray-400 text-sm">
        Generate an exam to see preview
      </div>
    )
  }

  return (
    <div className="flex flex-col h-full bg-gray-200">
      {/* Toolbar */}
      <div className="flex items-center justify-between px-3 py-2 bg-gray-800 text-white shrink-0">
        <div className="flex items-center gap-1">
          <button
            onClick={() => setPage('exam')}
            className={`px-3 py-1 text-xs rounded ${page === 'exam' ? 'bg-white text-gray-800 font-semibold' : 'text-gray-300 hover:text-white'}`}
          >
            Exam Paper
          </button>
          <button
            onClick={() => setPage('key')}
            className={`px-3 py-1 text-xs rounded ${page === 'key' ? 'bg-white text-gray-800 font-semibold' : 'text-gray-300 hover:text-white'}`}
          >
            Answer Key
          </button>
        </div>
        <div className="flex items-center gap-1">
          <button onClick={() => setZoom(z => Math.max(0.4, z - 0.1))} className="p-1 hover:bg-gray-600 rounded">
            <ZoomOut size={14} />
          </button>
          <span className="text-xs w-10 text-center">{Math.round(zoom * 100)}%</span>
          <button onClick={() => setZoom(z => Math.min(1.4, z + 0.1))} className="p-1 hover:bg-gray-600 rounded">
            <ZoomIn size={14} />
          </button>
        </div>
      </div>

      {/* A4 canvas area */}
      <div className="flex-1 overflow-auto p-4">
        <div
          className="origin-top mx-auto"
          style={{ transform: `scale(${zoom})`, transformOrigin: 'top center', width: 794 / zoom, minWidth: 794 / zoom }}
        >
          {/* A4 page */}
          <div
            className="bg-white shadow-2xl mx-auto font-serif text-gray-900"
            style={{ width: 794, minHeight: 1123, padding: '40px 56px' }}
          >
            {page === 'exam' ? (
              <>
                {/* ── Cover — matches sample paper exactly ── */}
                <div className="text-center mb-2">
                  <p className="font-bold font-sans" style={{ fontSize: 15 }}>{displayName}</p>
                </div>

                {/* Subject | Total Marks */}
                <div className="flex justify-between font-sans mb-1" style={{ fontSize: 12 }}>
                  <span><b>Subject:</b> {subject}</span>
                  <span><b>Total Marks: [&nbsp;&nbsp;&nbsp;/{totalMarks}]</b></span>
                </div>

                {/* Class | Date | Time */}
                <div className="flex justify-between font-sans mb-1" style={{ fontSize: 12 }}>
                  <span><b>Class:</b> {displayGrade}</span>
                  <span><b>Date:</b>&nbsp;<span className="inline-block border-b border-gray-700" style={{ width: 80 }} /></span>
                  <span><b>Time:</b>&nbsp;{timeAllowed ? <span>{timeAllowed}</span> : <span className="inline-block border-b border-gray-700" style={{ width: 70 }} />}</span>
                </div>

                {/* Name | Roll No | Section */}
                <div className="flex gap-3 font-sans mb-2" style={{ fontSize: 12 }}>
                  <span><b>Name:</b>&nbsp;<span className="inline-block border-b border-gray-700" style={{ width: 140 }} /></span>
                  <span><b>Roll No.</b>&nbsp;<span className="inline-block border-b border-gray-700" style={{ width: 60 }} /></span>
                  <span><b>Section:</b>&nbsp;<span className="inline-block border-b border-gray-700" style={{ width: 55 }} /></span>
                </div>

                {/* Double rule */}
                <div style={{ borderTop: '3px solid #111', marginBottom: 2 }} />
                <div style={{ borderTop: '1px solid #444', marginBottom: 8 }} />

                {/* Note */}
                <p className="font-sans mb-3" style={{ fontSize: 11 }}>
                  <b>Note:</b> Read questions carefully, don't over write and check your work.
                </p>

                {/* Questions */}
                {renderSection(examContent.objective, 'obj')}
                {renderSection(examContent.subjective, 'subj')}
              </>
            ) : (
              <>
                {/* ── Answer Key ── */}
                <div className="text-center mb-3">
                  <p className="text-sm font-bold tracking-widest uppercase underline">ANSWER KEY / MARKING SCHEME</p>
                  <div className="border-t border-gray-400 mt-1 mb-2" />
                  <p className="text-xs text-gray-600">Subject: {subject}  |  Class: {displayGrade}  |  Date: {new Date().toLocaleDateString()}</p>
                </div>
                {renderAnswerKey()}
              </>
            )}

            {/* Page footer */}
            <div className="text-center mt-8">
              <p className="text-xs text-gray-400">Page 1</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
