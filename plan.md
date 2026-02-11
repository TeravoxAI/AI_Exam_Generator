# Plan: Exam Paper Formatting (No Borders, Detailed Header, Answer Key)

## Goal
Transform the print output into a professional exam paper format with:
1.  **Professional Header:** Including Subject, Date, Name, Roll No, Section, and Marks.
2.  **Student Instructions:** "Note: Read questions carefully..."
3.  **Clean Layout:** No box borders around questions. Questions should have ample space for answers.
4.  **Separate Answer Key:** A distinct section at the end of the PDF containing the answers.

## Proposed Changes

### 1. Update `frontend/src/styles/index.css`

We will simplify the print styles to remove borders and manage visibility of answers.

```css
@media print {
  /* Reset page margins */
  @page { margin: 0; size: auto; }
  body { margin: 0; padding: 0; background: white; }

  /* Main Print Container with padding */
  .exam-print-area {
    padding: 40px;
    width: 100%;
  }

  /* layout - formatting */
  .category-section {
    border: none !important; /* REMOVE BORDERS */
    margin-bottom: 20px;
    page-break-inside: auto;
  }

  .category-header {
    font-weight: 800; /* Bold Categories */
    font-size: 16px;
    text-transform: uppercase;
    margin-bottom: 10px;
    border-bottom: 1px solid #000;
  }

  /* Hiding/Showing Logic */
  .screen-only { display: none !important; }
  .print-only { display: block !important; }

  /* Question Paper Specifics */
  .exam-paper-section .answer-display { display: none !important; } /* Hide answers in paper */
  .exam-paper-section .answer-space { display: block !important; } /* Show writing space */

  /* Answer Key Specifics */
  .answer-key-section {
    page-break-before: always;
    display: block !important;
  }
  .answer-key-section .answer-display { display: block !important; }
  .answer-key-section .answer-space { display: none !important; } /* Hide space in key */
  .answer-key-section .question-text { font-weight: normal; } /* Compact view */
}
```

### 2. Update `frontend/src/components/QuestionRenderer.tsx`

We need to identify the "Answer" part and the "Space" part so we can toggle them via CSS.

*   Wrap `Answer: ...` text in `<div className="answer-display ...">`.
*   Wrap blank spaces (inputs/textareas meant for writing) in `<div className="answer-space ...">`.

**Example Change:**
```tsx
// Old
<span className="text-xs font-medium text-[var(--primary)]">Answer: {question.answer}</span>

// New
<div className="answer-display mt-2 p-2 bg-gray-50 border-l-2 border-gray-500">
  <span className="font-bold">Answer:</span> {question.answer}
</div>
```

### 3. Update `frontend/src/pages/ExamGenerator.tsx`

Refactor the print output area to render **two** distinct sections.

#### A. The Header Component
Create a structured header matching the user's request.

```tsx
const ExamHeader = () => (
  <div className="mb-6 font-primary text-black">
    <div className="flex justify-between items-end mb-2 font-bold text-lg">
      <div className="flex items-center gap-4">
          <span className="uppercase">Subject:</span>
          <span className="font-normal border-b border-black w-48 block">{formData.subject}</span>
      </div>
      <div className="flex items-center gap-2">
          <span>Total Marks:</span>
          <span>{getTotalMarks()}</span>
      </div>
    </div>

    <div className="grid grid-cols-2 gap-x-8 gap-y-4 mb-4 text-sm font-semibold">
      <div className="flex items-center py-1">
        <span className="w-20 uppercase">Class:</span>
        <span className="border-b border-black flex-1 pl-1">{formData.grade}</span>
      </div>
      <div className="flex items-center py-1">
        <span className="w-20 uppercase">Date:</span>
        <span className="border-b border-black flex-1 pl-1">__________________</span>
      </div>
      <div className="flex items-center py-1 col-span-2">
        <span className="w-20 uppercase">Name:</span>
        <span className="border-b border-black flex-1 pl-1">__________________________________________________</span>
      </div>
      <div className="flex items-center py-1">
        <span className="w-20 uppercase">Roll No:</span>
        <span className="border-b border-black flex-1 pl-1">________</span>
      </div>
      <div className="flex items-center py-1">
        <span className="w-20 uppercase">Section:</span>
        <span className="border-b border-black flex-1 pl-1">________</span>
      </div>
    </div>

    <div className="py-2 border-y-2 border-black font-bold text-center italic mb-8">
      Note: Read questions carefully, don't overwrite and check your work.
    </div>
  </div>
);
```

#### B. The Render Loop
We will render the entire set of questions twice in the print area.

```tsx
<div className="exam-print-area hidden print:block">
    {/* 1. STUDENT EXAM PAPER */}
    <div className="exam-paper-section">
        <ExamHeader />
        {/* Render Questions (Objective + Subjective) */}
        {/* Reuse existing map logic but ensure wrappers have no borders */}
    </div>

    {/* 2. ANSWER KEY (Rubric) */}
    <div className="answer-key-section">
        <div className="text-center font-bold text-xl mb-6 underline uppercase tracking-wide">ANSWER KEY / RUBRIC</div>
        <div className="mb-8 border-b-2 border-dashed border-gray-400 pb-4">
            <span className="font-bold mr-2">Subject:</span> {formData.subject}
            <span className="font-bold mx-2">|</span>
            <span className="font-bold mr-2">Grade:</span> {formData.grade}
            <span className="font-bold mx-2">|</span>
            <span className="font-bold mr-2">Date Generated:</span> {new Date().toLocaleDateString()}
        </div>
        {/* Render Questions Again (CSS will show answers here) */}
    </div>
</div>
```

## Verification Plan

### Manual Verification
1.  **Generate Exam:** Create a generic exam.
2.  **Print Preview:**
    -   **Page 1:** Confirm Header matches the requirements (Subject, Name, Roll No fields present).
    -   **Page 1:** Confirm "Note: Read questions carefully..." is present.
    -   **Questions:** Confirm NO borders around questions.
    -   **Questions:** Confirm answers are HIDDEN.
    -   **Scroll to End:** find the **Answer Key** section on a new page.
    -   **Answer Key:** Confirm answers are VISIBLE.
