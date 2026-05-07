/**
 * ExamDocEditor — TipTap Google-Docs-style editor.
 * Fixes:
 *  - Image queue: pending images inserted once editor is ready
 *  - Page break: smart slicing finds nearest whitespace gap above each 1123px boundary
 *  - Resizable images with drag handle + alignment picker
 */
import { useEffect, useRef, useImperativeHandle, forwardRef, useState, useCallback } from 'react'
import { useEditor, EditorContent, NodeViewWrapper, NodeViewContent, ReactNodeViewRenderer } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import TextAlign from '@tiptap/extension-text-align'
import { TextStyle } from '@tiptap/extension-text-style'
import { Color } from '@tiptap/extension-color'
import { Node, mergeAttributes, Extension } from '@tiptap/core'
import { Table } from '@tiptap/extension-table'
import TableRow from '@tiptap/extension-table-row'
import TableCell from '@tiptap/extension-table-cell'
import TableHeader from '@tiptap/extension-table-header'
import Placeholder from '@tiptap/extension-placeholder'
import { jsPDF } from 'jspdf'
import html2canvas from 'html2canvas'
import {
  Bold, Italic, UnderlineIcon, AlignLeft, AlignCenter, AlignRight,
  Image as ImageIcon, Download, Trash2, Undo, Redo,
} from 'lucide-react'
import { examToTipTapDoc } from '../utils/examToTipTap'

// ── Resizable image node ──────────────────────────────────────────────────────

function ResizableImageView({ node, updateAttributes, selected }: any) {
  const [resizing, setResizing] = useState(false)
  const startRef = useRef<{ x: number; w: number; h: number } | null>(null)

  const w: number = node.attrs.width || 200
  const h: number = node.attrs.height || 150
  const align: 'left' | 'center' | 'right' = node.attrs.align || 'center'
  const justifyMap = { left: 'flex-start', center: 'center', right: 'flex-end' }

  const onMouseDown = (e: React.MouseEvent) => {
    e.preventDefault()
    setResizing(true)
    startRef.current = { x: e.clientX, w, h }
    const onMove = (ev: MouseEvent) => {
      if (!startRef.current) return
      const dx = ev.clientX - startRef.current.x
      const newW = Math.max(40, startRef.current.w + dx)
      const newH = Math.round(newW * (startRef.current.h / startRef.current.w))
      updateAttributes({ width: newW, height: newH })
    }
    const onUp = () => {
      setResizing(false)
      startRef.current = null
      window.removeEventListener('mousemove', onMove)
      window.removeEventListener('mouseup', onUp)
    }
    window.addEventListener('mousemove', onMove)
    window.addEventListener('mouseup', onUp)
  }

  return (
    <NodeViewWrapper>
      <div style={{ display: 'flex', justifyContent: justifyMap[align], margin: '6px 0', userSelect: resizing ? 'none' : 'auto' }}>
        <div style={{ position: 'relative', display: 'inline-block' }}>
          <img
            src={node.attrs.src}
            alt={node.attrs.alt || ''}
            draggable={false}
            style={{ width: w, height: h, display: 'block', objectFit: 'contain', outline: selected ? '2px solid #3b82f6' : 'none', cursor: 'pointer' }}
          />
          {selected && (
            <div style={{ position: 'absolute', top: -28, left: 0, display: 'flex', gap: 3, background: '#1e293b', borderRadius: 4, padding: '2px 5px', whiteSpace: 'nowrap' }}>
              {(['left', 'center', 'right'] as const).map(a => (
                <button key={a} onMouseDown={e => { e.preventDefault(); updateAttributes({ align: a }) }}
                  style={{ color: align === a ? '#60a5fa' : '#cbd5e1', fontSize: 11, background: 'none', border: 'none', cursor: 'pointer', padding: '0 3px', fontWeight: align === a ? 700 : 400 }}>
                  {a.charAt(0).toUpperCase()}
                </button>
              ))}
              <span style={{ color: '#475569', fontSize: 10, padding: '0 2px' }}>|</span>
              <span style={{ color: '#94a3b8', fontSize: 10 }}>{w}×{h}px</span>
            </div>
          )}
          {/* Resize handle */}
          <div onMouseDown={onMouseDown}
            style={{ position: 'absolute', right: -5, bottom: -5, width: 12, height: 12, background: '#3b82f6', borderRadius: 2, cursor: 'se-resize', opacity: selected ? 1 : 0, transition: 'opacity 0.15s', zIndex: 10 }} />
        </div>
      </div>
      <NodeViewContent style={{ display: 'none' }} />
    </NodeViewWrapper>
  )
}

const ResizableImage = Node.create({
  name: 'resizableImage',
  group: 'block',
  atom: true,
  draggable: true,
  addAttributes() {
    return {
      src: { default: null },
      alt: { default: '' },
      width: { default: 200 },
      height: { default: 150 },
      align: { default: 'center' },
    }
  },
  parseHTML() { return [{ tag: 'img[src]' }] },
  renderHTML({ HTMLAttributes }) { return ['img', mergeAttributes(HTMLAttributes)] },
  addNodeView() { return ReactNodeViewRenderer(ResizableImageView) },
})

// ── TrueFalseRow — renders "i)  statement          □ T   □ F" with right-aligned boxes ──────────

function TrueFalseRowView({ node }: any) {
  const idx: number = node.attrs.idx   // 0-based
  const text: string = node.attrs.text || ''
  const roman = ['i','ii','iii','iv','v','vi','vii','viii','ix','x','xi','xii','xiii','xiv','xv','xvi','xvii','xviii','xix','xx']
  const label = (idx >= 0 && idx < roman.length) ? roman[idx] : String(idx + 1)

  return (
    <NodeViewWrapper>
      <div style={{ display: 'flex', alignItems: 'baseline', marginBottom: 2, fontFamily: 'Helvetica, Arial, sans-serif', fontSize: 12.5 }}>
        {/* roman numeral — indent matches Q header text start */}
        <span style={{ minWidth: 28, flexShrink: 0, paddingLeft: 24 }}>{label})</span>
        {/* statement — grows to fill width */}
        <span style={{ flex: 1 }}>{text}</span>
        {/* T box */}
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, flexShrink: 0, paddingLeft: 16 }}>
          <span style={{ display: 'inline-block', width: 14, height: 14, border: '1.2px solid #222', verticalAlign: 'middle' }} />
          <span style={{ fontSize: 12 }}>T</span>
        </span>
        {/* F box */}
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, flexShrink: 0, paddingLeft: 14 }}>
          <span style={{ display: 'inline-block', width: 14, height: 14, border: '1.2px solid #222', verticalAlign: 'middle' }} />
          <span style={{ fontSize: 12 }}>F</span>
        </span>
      </div>
      <NodeViewContent style={{ display: 'none' }} />
    </NodeViewWrapper>
  )
}

const TrueFalseRowNode = Node.create({
  name: 'trueFalseRow',
  group: 'block',
  atom: true,
  addAttributes() {
    return {
      idx:  { default: 0 },
      text: { default: '' },
    }
  },
  parseHTML() { return [{ tag: 'div[data-type="true-false-row"]' }] },
  renderHTML({ HTMLAttributes }) {
    return ['div', mergeAttributes(HTMLAttributes, { 'data-type': 'true-false-row' })]
  },
  addNodeView() { return ReactNodeViewRenderer(TrueFalseRowView) },
})

// ── CustomParagraph — passes 'class' attr through so img-placeholder / drawing-box render correctly

const CustomParagraph = Extension.create({
  name: 'customParagraphClass',
  addGlobalAttributes() {
    return [{
      types: ['paragraph'],
      attributes: {
        class: {
          default: null,
          parseHTML: el => el.getAttribute('class'),
          renderHTML: attrs => attrs.class ? { class: attrs.class } : {},
        },
        'data-qid': {
          default: null,
          parseHTML: el => el.getAttribute('data-qid'),
          renderHTML: attrs => attrs['data-qid'] ? { 'data-qid': attrs['data-qid'] } : {},
        },
      },
    }]
  },
})


// ── Types ─────────────────────────────────────────────────────────────────────

export interface ExamDocEditorHandle {
  insertImage: (dataUrl: string) => void
  replaceImagePlaceholder: (questionId: string, dataUrl: string) => void
}

interface ExamDocEditorProps {
  exam: any
  selectedQuestions: Set<string>
  schoolName: string
  totalMarks: number
  timeAllowed: string
  grade: string
  subject: string
}

// ── Toolbar button ────────────────────────────────────────────────────────────

function TBtn({ onClick, active, title, children }: { onClick: () => void; active?: boolean; title: string; children: React.ReactNode }) {
  return (
    <button onMouseDown={e => { e.preventDefault(); onClick() }} title={title}
      className={`p-1.5 rounded transition-colors ${active ? 'bg-blue-100 text-blue-700' : 'hover:bg-gray-100 text-gray-700'}`}>
      {children}
    </button>
  )
}

// ── Smart page-break slicing ──────────────────────────────────────────────────
// Scans pixel rows near each A4 boundary, finds the closest all-white row above,
// and cuts there instead of mid-content.

function findBreakY(imageData: ImageData, nominalY: number, scanBack: number): number {
  const { width, data } = imageData
  const start = Math.max(0, nominalY - scanBack)
  // Scan backwards from nominalY to find a mostly-white row
  for (let y = nominalY; y >= start; y--) {
    let isWhite = true
    for (let x = 0; x < width; x += 4) {
      const idx = (y * width + x) * 4
      if (data[idx] < 240 || data[idx + 1] < 240 || data[idx + 2] < 240) {
        isWhite = false
        break
      }
    }
    if (isWhite) return y
  }
  return nominalY // fallback: cut at nominal
}

// ── Main component ────────────────────────────────────────────────────────────

export const ExamDocEditor = forwardRef<ExamDocEditorHandle, ExamDocEditorProps>(function ExamDocEditor(
  { exam, selectedQuestions, schoolName, totalMarks, timeAllowed, grade: _grade, subject: _subject },
  ref
) {
  const fileRef = useRef<HTMLInputElement>(null)
  const pageRef = useRef<HTMLDivElement>(null)
  const pendingImages = useRef<string[]>([])
  const [zoom, setZoom] = useState(100)

  const editor = useEditor({
    extensions: [
      StarterKit.configure({ heading: { levels: [1, 2, 3] } }),
      CustomParagraph,
      TextStyle,
      Color,
      TextAlign.configure({ types: ['heading', 'paragraph'] }),
      ResizableImage,
      TrueFalseRowNode,
      Table.configure({ resizable: true }),
      TableRow,
      TableHeader,
      TableCell,
      Placeholder.configure({ placeholder: 'Start editing your exam...' }),
    ],
    content: '',
    editorProps: { attributes: { class: 'outline-none min-h-full', spellcheck: 'false' } },
    onCreate: ({ editor: e }) => {
      // Flush any images that arrived before editor was ready
      if (pendingImages.current.length > 0) {
        pendingImages.current.forEach(dataUrl => insertImageIntoEditor(e, dataUrl))
        pendingImages.current = []
      }
    },
  })

  const insertImageIntoEditor = useCallback((ed: typeof editor, dataUrl: string) => {
    if (!ed) return
    const img = new window.Image()
    img.onload = () => {
      const maxW = 300
      const ratio = img.naturalHeight / img.naturalWidth
      const w = Math.min(maxW, img.naturalWidth)
      const h = Math.round(w * ratio)
      ed.chain().focus().insertContent({ type: 'resizableImage', attrs: { src: dataUrl, width: w, height: h, align: 'center' } }).run()
    }
    img.src = dataUrl
  }, [])

  const replaceImagePlaceholderInEditor = useCallback((ed: typeof editor, questionId: string, dataUrl: string) => {
    if (!ed) return
    const { state, view } = ed
    let found = false
    state.doc.descendants((node, pos) => {
      if (found) return false
      if (node.type.name === 'paragraph' && node.attrs['data-qid'] === questionId) {
        found = true
        const img = new window.Image()
        img.onload = () => {
          const maxW = 300
          const ratio = img.naturalHeight / img.naturalWidth
          const w = Math.min(maxW, img.naturalWidth)
          const h = Math.round(w * ratio)
          const imgNode = state.schema.nodes.resizableImage.create({ src: dataUrl, width: w, height: h, align: 'center' })
          const tr = state.tr.replaceWith(pos, pos + node.nodeSize, imgNode)
          view.dispatch(tr)
        }
        img.src = dataUrl
        return false
      }
    })
    // No placeholder found — just insert at cursor
    if (!found) insertImageIntoEditor(ed, dataUrl)
  }, [insertImageIntoEditor])

  // Expose insertImage — queues if editor not ready yet
  useImperativeHandle(ref, () => ({
    insertImage: (dataUrl: string) => {
      if (editor) {
        insertImageIntoEditor(editor, dataUrl)
      } else {
        pendingImages.current.push(dataUrl)
      }
    },
    replaceImagePlaceholder: (questionId: string, dataUrl: string) => {
      if (editor) {
        replaceImagePlaceholderInEditor(editor, questionId, dataUrl)
      } else {
        pendingImages.current.push(dataUrl)
      }
    },
  }), [editor, insertImageIntoEditor, replaceImagePlaceholderInEditor])

  // Sync content when exam / selection changes
  useEffect(() => {
    if (!editor || !exam) return
    const examData = exam?.exam_content
      ? exam
      : { exam_content: exam, subject: exam?.subject || '', grade: exam?.grade || '' }
    const doc = examToTipTapDoc(examData, selectedQuestions, { schoolName, totalMarks, timeAllowed })
    editor.commands.setContent(doc)
  }, [editor, exam, selectedQuestions, schoolName, totalMarks, timeAllowed])

  // Toolbar image insert
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = ev => {
      const dataUrl = ev.target?.result as string
      if (editor) insertImageIntoEditor(editor, dataUrl)
      else pendingImages.current.push(dataUrl)
    }
    reader.readAsDataURL(file)
    e.target.value = ''
  }

  // Export PDF — measures DOM element boundaries to avoid cutting mid-question
  const exportPDF = async () => {
    if (!pageRef.current) return
    const el = pageRef.current
    try {
      // ── Step 1: collect "avoid-break" boundaries from DOM ──────────────────
      // Each paragraph with class q-header marks start of a question block.
      // We collect the top offset of every such element so we can snap cuts above them.
      const elRect = el.getBoundingClientRect()
      const scrollTop = el.scrollTop || 0

      // Collect top Y (relative to pageRef top) of every block-start element
      const blockStartYs: number[] = []
      el.querySelectorAll('p.q-header, [data-type="true-false-row"]').forEach(node => {
        const r = (node as HTMLElement).getBoundingClientRect()
        blockStartYs.push(r.top - elRect.top + scrollTop)
      })

      // ── Step 2: render full canvas ─────────────────────────────────────────
      const canvas = await html2canvas(el, {
        scale: 2,
        backgroundColor: '#ffffff',
        useCORS: true,
        logging: false,
        scrollX: 0,
        scrollY: 0,
        width: el.offsetWidth,
        height: el.scrollHeight,
        windowWidth: el.offsetWidth,
        windowHeight: el.scrollHeight,
      })

      const scale = canvas.width / el.offsetWidth  // = 2 (retina)

      const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' })
      const a4W = 210
      const a4H = 297
      const pxPerMm = canvas.width / a4W         // canvas px per mm
      const nominalPagePx = a4H * pxPerMm        // canvas px per page

      // Scale blockStartYs from DOM px → canvas px
      const blockStartPx = blockStartYs.map(y => y * scale)

      let yPx = 0
      let firstPage = true

      while (yPx < canvas.height) {
        const nominalCut = yPx + nominalPagePx

        let cutY: number
        if (nominalCut >= canvas.height) {
          cutY = canvas.height
        } else {
          // Find the latest block-start that is BEFORE nominalCut and AFTER yPx.
          // Cut just before that block so the Q header starts on a fresh page.
          // Fallback: use findBreakY white-row scan.
          let bestSnap = -1
          for (const bY of blockStartPx) {
            if (bY > yPx + 50 && bY < nominalCut - 20) {
              if (bY > bestSnap) bestSnap = bY
            }
          }

          if (bestSnap > 0) {
            // Snap cut to 8px before the block header (lands in the margin gap)
            cutY = Math.max(yPx + 1, Math.floor(bestSnap) - 16)
          } else {
            // Fallback: white-row scan
            const ctx2d = canvas.getContext('2d')!
            const imgData = ctx2d.getImageData(0, 0, canvas.width, canvas.height)
            cutY = findBreakY(imgData, Math.floor(nominalCut), Math.round(40 * pxPerMm))
            if (cutY <= yPx) cutY = Math.floor(nominalCut)
          }
        }

        const sliceH = cutY - yPx
        const sc = document.createElement('canvas')
        sc.width = canvas.width
        sc.height = sliceH
        const sctx = sc.getContext('2d')!
        sctx.fillStyle = '#ffffff'
        sctx.fillRect(0, 0, sc.width, sc.height)
        sctx.drawImage(canvas, 0, yPx, canvas.width, sliceH, 0, 0, canvas.width, sliceH)

        const imgDataUrl = sc.toDataURL('image/jpeg', 0.92)
        if (!firstPage) pdf.addPage()
        pdf.addImage(imgDataUrl, 'JPEG', 0, 0, a4W, sliceH / pxPerMm)

        yPx = cutY
        firstPage = false
      }

      pdf.save(`exam_${new Date().toISOString().split('T')[0]}.pdf`)
    } catch (err) {
      console.error('PDF export error:', err)
      alert('PDF export failed. Please try again.')
    }
  }

  if (!editor) return null

  return (
    <div className="flex flex-col h-full" style={{ background: '#4b5563' }}>
      {/* Toolbar */}
      <div className="shrink-0 bg-white border-b border-gray-200 px-3 py-1.5 flex items-center gap-0.5 flex-wrap shadow-sm">
        <TBtn onClick={() => editor.chain().focus().undo().run()} title="Undo"><Undo size={15} /></TBtn>
        <TBtn onClick={() => editor.chain().focus().redo().run()} title="Redo"><Redo size={15} /></TBtn>
        <div className="w-px h-5 bg-gray-200 mx-1" />
        <TBtn onClick={() => editor.chain().focus().toggleBold().run()} active={editor.isActive('bold')} title="Bold"><Bold size={15} /></TBtn>
        <TBtn onClick={() => editor.chain().focus().toggleItalic().run()} active={editor.isActive('italic')} title="Italic"><Italic size={15} /></TBtn>
        <TBtn onClick={() => (editor.chain().focus() as any).toggleUnderline?.().run()} active={editor.isActive('underline')} title="Underline"><UnderlineIcon size={15} /></TBtn>
        <div className="w-px h-5 bg-gray-200 mx-1" />
        <TBtn onClick={() => editor.chain().focus().setTextAlign('left').run()} active={editor.isActive({ textAlign: 'left' })} title="Left"><AlignLeft size={15} /></TBtn>
        <TBtn onClick={() => editor.chain().focus().setTextAlign('center').run()} active={editor.isActive({ textAlign: 'center' })} title="Center"><AlignCenter size={15} /></TBtn>
        <TBtn onClick={() => editor.chain().focus().setTextAlign('right').run()} active={editor.isActive({ textAlign: 'right' })} title="Right"><AlignRight size={15} /></TBtn>
        <div className="w-px h-5 bg-gray-200 mx-1" />
        <select
          value={editor.isActive('heading',{level:1})?'1':editor.isActive('heading',{level:2})?'2':editor.isActive('heading',{level:3})?'3':'0'}
          onChange={e => {
            const v = parseInt(e.target.value)
            if (v === 0) editor.chain().focus().setParagraph().run()
            else editor.chain().focus().toggleHeading({ level: v as 1|2|3 }).run()
          }}
          className="text-xs border border-gray-200 rounded px-1.5 py-1 bg-white text-gray-700 focus:outline-none"
        >
          <option value="0">Normal</option>
          <option value="1">H1</option>
          <option value="2">H2</option>
          <option value="3">H3</option>
        </select>
        <div className="w-px h-5 bg-gray-200 mx-1" />
        <TBtn onClick={() => editor.chain().focus().deleteSelection().run()} title="Delete selection"><Trash2 size={15} /></TBtn>
        <TBtn onClick={() => fileRef.current?.click()} title="Insert image at cursor"><ImageIcon size={15} /></TBtn>
        <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleFileChange} />
        <div className="flex-1" />
        {/* Zoom controls */}
        <div className="flex items-center gap-1 mr-2">
          <button onMouseDown={e => { e.preventDefault(); setZoom(z => Math.max(50, z - 10)) }}
            className="w-6 h-6 flex items-center justify-center rounded hover:bg-gray-100 text-gray-700 font-bold text-sm leading-none">−</button>
          <select value={zoom} onChange={e => setZoom(Number(e.target.value))}
            className="text-xs border border-gray-200 rounded px-1 py-1 bg-white text-gray-700 focus:outline-none w-16 text-center">
            {[50,75,90,100,110,125,150,175,200].map(v => <option key={v} value={v}>{v}%</option>)}
          </select>
          <button onMouseDown={e => { e.preventDefault(); setZoom(z => Math.min(200, z + 10)) }}
            className="w-6 h-6 flex items-center justify-center rounded hover:bg-gray-100 text-gray-700 font-bold text-sm leading-none">+</button>
        </div>
        <button onClick={exportPDF}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded transition-colors">
          <Download size={13} />Export PDF
        </button>
      </div>

      {/* Scrollable document area — dark gray surround, white A4 page */}
      <div className="flex-1 overflow-auto" style={{ padding: '32px 20px' }}>
        {/* Outer wrapper sizes to zoomed dimensions so scrollbar reflects full size */}
        <div style={{ width: 794 * zoom / 100, minHeight: 1123 * zoom / 100, margin: '0 auto' }}>
        <div
          ref={pageRef}
          className="bg-white shadow-2xl"
          style={{
            width: 794,
            minHeight: 1123,
            padding: '56px 72px 80px',
            boxSizing: 'border-box',
            transformOrigin: 'top left',
            transform: `scale(${zoom / 100})`,
            backgroundImage: 'repeating-linear-gradient(to bottom, transparent 0px, transparent 1122px, #cbd5e1 1122px, #cbd5e1 1124px)',
          }}
        >
          <EditorContent editor={editor} />
        </div>
        </div>
      </div>

      <style>{`
        .ProseMirror { outline: none; font-family: Helvetica, Arial, sans-serif; }
        .ProseMirror > * { margin-bottom: 1px; }
        .ProseMirror p { margin: 1px 0; font-size: 12.5px; line-height: 1.7; white-space: pre-wrap; }
        .ProseMirror p.q-header { margin-top: 20px; margin-bottom: 4px; }
        .ProseMirror h1 { font-size: 18px; font-weight: 700; margin: 10px 0 3px; }
        .ProseMirror h2 { font-size: 15px; font-weight: 700; margin: 8px 0 2px; }
        .ProseMirror h3 { font-size: 13px; font-weight: 700; margin: 5px 0 2px; }
        .ProseMirror hr { border: none; border-top: 2.5px solid #111; margin: 5px 0 4px; }
        .ProseMirror table { border-collapse: collapse; width: 80%; margin: 6px 0 6px 40px; table-layout: fixed; }
        .ProseMirror td, .ProseMirror th { border: 1px solid #999; padding: 5px 10px; font-size: 12.5px; width: 50%; }
        .ProseMirror th { background: #f0f0f0; font-weight: 700; text-align: left; }
        .ProseMirror td p, .ProseMirror th p { margin: 0; white-space: normal; }
        .ProseMirror .is-empty::before { content: attr(data-placeholder); color: #aaa; pointer-events: none; float: left; height: 0; }

        /* Drawing box — wide bordered rectangle student draws inside */
        .ProseMirror p.drawing-box {
          border: 1.5px solid #333;
          min-height: 80px;
          width: 80%;
          margin: 6px auto 6px 40px;
          padding: 8px;
          color: #bbb;
          font-style: italic;
          font-size: 11px;
          display: block;
        }
        .ProseMirror p.drawing-box::before { content: 'Drawing Space'; display: block; text-align: center; color: #ccc; }

        /* Image placeholder — dashed bordered box */
        .ProseMirror p.img-placeholder {
          border: 1.5px dashed #999;
          min-height: 60px;
          width: 60%;
          margin: 6px auto 6px 40px;
          padding: 10px;
          text-align: center;
          color: #aaa;
          font-style: italic;
          font-size: 11px;
          display: block;
          background: #fafafa;
        }
      `}</style>
    </div>
  )
})
