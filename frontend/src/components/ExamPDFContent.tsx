interface ExamPDFContentProps {
  exam: any
  selectedQuestions: Set<string>
}

export function ExamPDFContent({ exam, selectedQuestions }: ExamPDFContentProps) {
  console.log('📋 ExamPDFContent rendering...')
  console.log('Exam:', exam)
  console.log('Selected questions count:', selectedQuestions.size)
  console.log('Exam content:', exam?.exam_content)

  const getQuestionTypeLabel = (typeId: string) => {
    return typeId
      .split('_')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ')
  }

  const getTotalMarks = () => {
    let total = 0
    selectedQuestions.forEach(id => {
      const [category, type, index] = id.split('-')
      const questions = category === 'obj'
        ? exam.exam_content?.objective?.[type]
        : exam.exam_content?.subjective?.[type]

      const questionArray = Array.isArray(questions) ? questions : []
      if (questionArray && questionArray[parseInt(index)]) {
        total += questionArray[parseInt(index)].marks || 0
      }
    })
    return total
  }

  return (
    <div style={{ backgroundColor: '#fff', fontFamily: 'Arial, sans-serif', fontSize: '11pt', color: '#000' }}>
      {/* PAGE 1: EXAM COVER PAGE */}
      <div style={{ padding: '20mm', pageBreakAfter: 'always' }}>
        {/* School Header */}
        <div style={{ textAlign: 'center', marginBottom: '30px', borderBottom: '3px solid #000', paddingBottom: '20px' }}>
          <h1 style={{ fontSize: '20pt', fontWeight: 'bold', margin: '0 0 10px 0', letterSpacing: '2px' }}>
            ARMY PUBLIC SCHOOL (APS)
          </h1>
          <h2 style={{ fontSize: '14pt', fontWeight: 'bold', margin: '0', letterSpacing: '1px' }}>
            EXAMINATION PAPER
          </h2>
        </div>

        {/* Exam Info */}
        <div style={{ marginBottom: '30px' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <tbody>
              <tr>
                <td style={{ padding: '8px', fontWeight: 'bold', width: '50%' }}>Subject:</td>
                <td style={{ padding: '8px', borderBottom: '1px solid #000' }}>{exam.subject}</td>
              </tr>
              <tr>
                <td style={{ padding: '8px', fontWeight: 'bold' }}>Grade/Class:</td>
                <td style={{ padding: '8px', borderBottom: '1px solid #000' }}>{exam.grade}</td>
              </tr>
              <tr>
                <td style={{ padding: '8px', fontWeight: 'bold' }}>Total Marks:</td>
                <td style={{ padding: '8px', borderBottom: '1px solid #000' }}>{getTotalMarks()}</td>
              </tr>
              <tr>
                <td style={{ padding: '8px', fontWeight: 'bold' }}>Total Questions:</td>
                <td style={{ padding: '8px', borderBottom: '1px solid #000' }}>{selectedQuestions.size}</td>
              </tr>
              <tr>
                <td style={{ padding: '8px', fontWeight: 'bold' }}>Date:</td>
                <td style={{ padding: '8px', borderBottom: '1px solid #000' }}>&nbsp;</td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* Student Info */}
        <div style={{ marginTop: '40px', padding: '15px', border: '2px solid #000' }}>
          <h3 style={{ margin: '0 0 15px 0', fontSize: '12pt', fontWeight: 'bold' }}>STUDENT INFORMATION:</h3>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <tbody>
              <tr>
                <td style={{ padding: '6px', fontWeight: 'bold', width: '30%' }}>Name:</td>
                <td style={{ padding: '6px', borderBottom: '1px solid #000' }}>&nbsp;</td>
              </tr>
              <tr>
                <td style={{ padding: '6px', fontWeight: 'bold' }}>Roll No:</td>
                <td style={{ padding: '6px', borderBottom: '1px solid #000' }}>&nbsp;</td>
              </tr>
              <tr>
                <td style={{ padding: '6px', fontWeight: 'bold' }}>Section:</td>
                <td style={{ padding: '6px', borderBottom: '1px solid #000' }}>&nbsp;</td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* Instructions */}
        <div style={{ marginTop: '40px', padding: '15px', border: '1px solid #000', backgroundColor: '#f5f5f5', textAlign: 'center' }}>
          <p style={{ margin: '0', fontWeight: 'bold', fontStyle: 'italic' }}>
            INSTRUCTIONS: Read all questions carefully. Write your answers neatly. Check your work before submitting.
          </p>
        </div>
      </div>

      {/* PAGE 2+: OBJECTIVE QUESTIONS */}
      {exam.exam_content?.objective && Object.keys(exam.exam_content.objective).length > 0 && (
        <div style={{ padding: '15mm 20mm', pageBreakBefore: 'always' }}>
          <h2 style={{ fontSize: '16pt', fontWeight: 'bold', marginBottom: '20px', textAlign: 'center', textDecoration: 'underline' }}>
            SECTION A: OBJECTIVE QUESTIONS
          </h2>

          {Object.entries(exam.exam_content.objective).map(([typeId, questions]: [string, any]) => {
            const questionArray = Array.isArray(questions) ? questions : []
            if (questionArray.length === 0) return null

            const filteredQuestions = questionArray.filter((_, idx) =>
              selectedQuestions.has(`obj-${typeId}-${idx}`)
            )
            if (filteredQuestions.length === 0) return null

            return (
              <div key={typeId} style={{ marginBottom: '25px', pageBreakInside: 'avoid' }}>
                <h3 style={{ fontSize: '13pt', fontWeight: 'bold', marginBottom: '12px', borderBottom: '2px solid #000', paddingBottom: '5px' }}>
                  {getQuestionTypeLabel(typeId)}
                </h3>

                {questionArray.map((question: any, idx: number) => {
                  const questionId = `obj-${typeId}-${idx}`
                  if (!selectedQuestions.has(questionId)) return null

                  return (
                    <div key={idx} style={{ marginBottom: '20px', pageBreakInside: 'avoid' }}>
                      <p style={{ fontWeight: 'bold', marginBottom: '8px' }}>
                        Q{idx + 1}. {question.question} <span style={{ fontStyle: 'italic', fontSize: '9pt' }}>({question.marks || 0} marks)</span>
                      </p>
                      {question.options && (
                        <div style={{ marginLeft: '20px', marginBottom: '10px' }}>
                          {question.options.map((option: string, optIdx: number) => (
                            <p key={optIdx} style={{ margin: '4px 0' }}>
                              {String.fromCharCode(65 + optIdx)}) {option}
                            </p>
                          ))}
                        </div>
                      )}
                      <div style={{ marginTop: '8px', borderBottom: '1px solid #ccc', paddingBottom: '15px' }}>
                        <p style={{ fontStyle: 'italic', fontSize: '9pt', color: '#666' }}>Answer: __________________</p>
                      </div>
                    </div>
                  )
                })}
              </div>
            )
          })}
        </div>
      )}

      {/* SUBJECTIVE QUESTIONS */}
      {exam.exam_content?.subjective && Object.keys(exam.exam_content.subjective).length > 0 && (
        <div style={{ padding: '15mm 20mm', pageBreakBefore: 'always' }}>
          <h2 style={{ fontSize: '16pt', fontWeight: 'bold', marginBottom: '20px', textAlign: 'center', textDecoration: 'underline' }}>
            SECTION B: SUBJECTIVE QUESTIONS
          </h2>

          {Object.entries(exam.exam_content.subjective).map(([typeId, questions]: [string, any]) => {
            const questionArray = Array.isArray(questions) ? questions : []
            if (questionArray.length === 0) return null

            const filteredQuestions = questionArray.filter((_, idx) =>
              selectedQuestions.has(`subj-${typeId}-${idx}`)
            )
            if (filteredQuestions.length === 0) return null

            return (
              <div key={typeId} style={{ marginBottom: '25px', pageBreakInside: 'avoid' }}>
                <h3 style={{ fontSize: '13pt', fontWeight: 'bold', marginBottom: '12px', borderBottom: '2px solid #000', paddingBottom: '5px' }}>
                  {getQuestionTypeLabel(typeId)}
                </h3>

                {questionArray.map((question: any, idx: number) => {
                  const questionId = `subj-${typeId}-${idx}`
                  if (!selectedQuestions.has(questionId)) return null

                  return (
                    <div key={idx} style={{ marginBottom: '30px', pageBreakInside: 'avoid' }}>
                      <p style={{ fontWeight: 'bold', marginBottom: '8px' }}>
                        Q{idx + 1}. {question.question} <span style={{ fontStyle: 'italic', fontSize: '9pt' }}>({question.marks || 0} marks)</span>
                      </p>
                      <div style={{ marginTop: '10px', borderBottom: '1px solid #ccc', minHeight: '60px', paddingBottom: '10px' }}>
                        <p style={{ fontStyle: 'italic', fontSize: '9pt', color: '#666' }}>
                          _____________________________________________________________________________
                          <br/>_____________________________________________________________________________
                          <br/>_____________________________________________________________________________
                        </p>
                      </div>
                    </div>
                  )
                })}
              </div>
            )
          })}
        </div>
      )}

      {/* ANSWER KEY */}
      <div style={{ padding: '15mm 20mm', pageBreakBefore: 'always' }}>
        <h1 style={{ fontSize: '18pt', fontWeight: 'bold', marginBottom: '20px', textAlign: 'center', textDecoration: 'underline' }}>
          ANSWER KEY / RUBRIC
        </h1>
        <p style={{ textAlign: 'center', marginBottom: '20px', fontSize: '10pt', fontStyle: 'italic' }}>
          Subject: {exam.subject} | Grade: {exam.grade} | Generated: {new Date().toLocaleDateString()}
        </p>

        {/* Objective Answers */}
        {exam.exam_content?.objective && (
          <div style={{ marginBottom: '30px' }}>
            <h2 style={{ fontSize: '14pt', fontWeight: 'bold', marginBottom: '15px' }}>Objective Questions</h2>
            {Object.entries(exam.exam_content.objective).map(([typeId, questions]: [string, any]) => {
              const questionArray = Array.isArray(questions) ? questions : []
              const filteredQuestions = questionArray.filter((_, idx) =>
                selectedQuestions.has(`obj-${typeId}-${idx}`)
              )
              if (filteredQuestions.length === 0) return null

              return (
                <div key={typeId} style={{ marginBottom: '20px' }}>
                  <h3 style={{ fontSize: '12pt', fontWeight: 'bold', marginBottom: '10px' }}>{getQuestionTypeLabel(typeId)}</h3>
                  {questionArray.map((question: any, idx: number) => {
                    if (!selectedQuestions.has(`obj-${typeId}-${idx}`)) return null
                    return (
                      <p key={idx} style={{ margin: '6px 0', padding: '6px', backgroundColor: '#f0f0f0' }}>
                        <strong>Q{idx + 1}:</strong> Answer: {question.answer} <span style={{ fontStyle: 'italic' }}>({question.marks} marks)</span>
                      </p>
                    )
                  })}
                </div>
              )
            })}
          </div>
        )}

        {/* Subjective Answers */}
        {exam.exam_content?.subjective && (
          <div>
            <h2 style={{ fontSize: '14pt', fontWeight: 'bold', marginBottom: '15px' }}>Subjective Questions</h2>
            {Object.entries(exam.exam_content.subjective).map(([typeId, questions]: [string, any]) => {
              const questionArray = Array.isArray(questions) ? questions : []
              const filteredQuestions = questionArray.filter((_, idx) =>
                selectedQuestions.has(`subj-${typeId}-${idx}`)
              )
              if (filteredQuestions.length === 0) return null

              return (
                <div key={typeId} style={{ marginBottom: '20px' }}>
                  <h3 style={{ fontSize: '12pt', fontWeight: 'bold', marginBottom: '10px' }}>{getQuestionTypeLabel(typeId)}</h3>
                  {questionArray.map((question: any, idx: number) => {
                    if (!selectedQuestions.has(`subj-${typeId}-${idx}`)) return null
                    return (
                      <div key={idx} style={{ margin: '10px 0', padding: '10px', backgroundColor: '#f0f0f0', borderLeft: '4px solid #275441' }}>
                        <p style={{ fontWeight: 'bold', margin: '0 0 5px 0' }}>Q{idx + 1}:</p>
                        <p style={{ margin: '0' }}><strong>Sample Answer:</strong> {question.sample_answer || question.answer}</p>
                        <p style={{ margin: '5px 0 0 0', fontStyle: 'italic', fontSize: '9pt' }}>Marks: {question.marks}</p>
                      </div>
                    )
                  })}
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
