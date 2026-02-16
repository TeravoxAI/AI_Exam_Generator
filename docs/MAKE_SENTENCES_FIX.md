# Make Sentences Question Type - Issue & Fix

## The Problem

"Make Sentences" questions are displaying incorrectly:
- Question text shows as empty (just "Q1.", "Q2.", etc.)
- Sample answers show as "N/A"
- No actual question content visible

### Why This Happens

There's a **mismatch between the prompt specification and LLM output**:

**Expected Format (from prompt):**
```json
{
  "instruction": "Make sentences from the following words",
  "words": ["bird", "nest", "home"],
  "sample_answer": "A nest is a home for a bird.",
  "marks": 2
}
```

**Actual LLM Output:**
```json
{
  "question": "",  // Empty!
  "marks": 2
}
```

The LLM is ignoring the `instruction` and `words` field requirements and generating minimal content instead.

---

## Root Causes

### 1. **LLM Prompt Not Explicit Enough**
The system prompt specifies the format, but the LLM isn't following it strictly.

**Current Prompt Says:**
```
make_sentences - Create original sentences from words
- Fields: instruction, words[], marks
```

**Problem:** This is too vague. The LLM doesn't know exactly what to put in `instruction` or how to structure `words[]`.

### 2. **No JSON Schema Enforcement**
The prompt doesn't provide a JSON example for this question type, so the LLM guesses.

### 3. **Validation Missing**
The backend doesn't validate that generated questions have all required fields.

---

## Solutions Implemented

### Frontend Fix (Immediate)
✅ **Updated QuestionRenderer.tsx** to handle missing data gracefully:
- If `instruction` and `words` are missing, falls back to showing `question` field
- Shows warning message if all fields are empty
- Prevents complete blank questions

### What This Means
Users will now see:
- "Question content not generated properly" warning instead of blank space
- Can still see partial data if available
- Identifies which exams need regeneration

---

## Long-term Fixes Needed

### 1. **Improve LLM Prompt** (RECOMMENDED)
Update `system_prompts.py` to provide explicit JSON examples for `make_sentences`:

```python
make_sentences_example = {
    "instruction": "Make sentences using the following words",
    "words": [
        {"word": "bird", "hint": "a flying animal"},
        {"word": "nest", "hint": "a home made of twigs"},
        {"word": "tree", "hint": "a tall plant"}
    ],
    "sample_answer": "A bird builds a nest in the tree.",
    "marks": 2
}
```

**File to Update:** `src/prompts/system_prompts.py`

### 2. **Add Response Validation** (RECOMMENDED)
After LLM generation, validate that all required fields exist:

```python
def validate_question_structure(question, question_type):
    """Validate that question has required fields"""
    if question_type == 'make_sentences':
        required = ['instruction', 'words', 'sample_answer', 'marks']
        for field in required:
            if field not in question or not question[field]:
                return False
    return True
```

**File to Update:** `src/services/llm_service.py`

### 3. **Regenerate Existing Exams**
After fixing the prompt, users should:
- Regenerate exams that have empty questions
- Use the corrected LLM prompt
- Exams will have properly formatted make_sentences questions

---

## Testing

### Before Fix
```
Make Sentences
Q1.
Marks: 2
Sample Answer: N/A
```

### After Frontend Fix
```
Make Sentences
Q1.
⚠️ Question content not generated properly. Please regenerate this exam.
Marks: 2
```

### After Full Fix (with improved prompt)
```
Make Sentences
Instruction: Make sentences from the following words
1. bird (a flying animal)
2. nest (a home made of twigs)

Answer Space: _______________

Sample Answer: A bird builds a nest.
Marks: 2
```

---

## Affected Question Types

Similar issues may exist for other question types with complex structures:
- ✅ `complete_sentences` - May have similar issues
- ✅ `unseen_creative_writing` - May be affected
- ✅ `picture_description` - May not have full content
- ✅ `rearrange_sentences` - May need validation

---

## Implementation Steps

### Immediate (Already Done)
- [x] Updated frontend renderer to handle missing data
- [x] Added warning messages for incomplete questions
- [x] Prevents complete blank display

### Short-term (Recommended Next)
- [ ] Improve LLM prompt with explicit JSON examples
- [ ] Add validation function in llm_service.py
- [ ] Test with new exam generation
- [ ] Regenerate exams with improved prompt

### Long-term
- [ ] Add comprehensive validation for all question types
- [ ] Create admin tool to batch-regenerate exams
- [ ] Add UI indicator for questions that need regeneration
- [ ] Log all validation failures for monitoring

---

## Files to Update

1. **`src/prompts/system_prompts.py`**
   - Add detailed JSON examples for make_sentences
   - Make instruction, words[], marks explicit
   - Provide hint examples for word objects

2. **`src/services/llm_service.py`**
   - Add `validate_question_structure()` function
   - Check required fields after LLM response
   - Log validation failures

3. **`frontend/src/components/QuestionRenderer.tsx`** ✅
   - Already updated to handle missing data gracefully
   - Shows warning messages
   - Fallback to question field if needed

---

## Example Fix for system_prompts.py

```python
# In get_question_generation_prompt()

# For make_sentences question type:
make_sentences_guidelines = """
For "make_sentences" questions, ALWAYS generate:
{
  "instruction": "Make sentences using the following words",
  "words": [
    {
      "word": "actual_word_here",
      "hint": "optional hint about the word (optional)",
      "sample_sentence": "example sentence using this word (optional)"
    },
    ...
  ],
  "sample_answer": "A complete sample sentence using all or most words",
  "marks": 2,
  "difficulty": "medium",
  "bloom_level": "create"
}

IMPORTANT: The "instruction" field is REQUIRED. The "words" field is a list with at least 3 items.
"""
```

---

## Why This Matters

- **User Experience:** Users see a warning instead of blank questions
- **Data Quality:** Identifies which exams need regeneration
- **LLM Behavior:** Helps debug when the LLM isn't following format specs
- **Quality Assurance:** Prevents low-quality exams from being used

---

## Status

| Task | Status | Notes |
|------|--------|-------|
| Frontend graceful handling | ✅ Done | Shows warnings for missing content |
| Improve LLM prompt | ⏳ Todo | Need to add explicit JSON examples |
| Add validation function | ⏳ Todo | Check required fields after generation |
| Regenerate affected exams | ⏳ Todo | After prompt improvement |
| Test with new generation | ⏳ Todo | Verify fixed prompt works |

---

## Quick Fix Instructions

**For Users:**
1. If you see "Question content not generated properly" warning
2. Go back to Exam Generator
3. Generate a new exam with the same parameters
4. The new exam should have properly formatted questions

**For Developers:**
1. Edit `src/prompts/system_prompts.py`
2. Add explicit JSON examples for make_sentences
3. Add validation in `src/services/llm_service.py`
4. Rebuild and test with new exam generation
