# Question Type JSON Schema - Complete Reference

This document defines the **exact JSON structure** for ALL question types in the AI Exam Generator system.

**CRITICAL**: All components (LLM prompts, backend parsers, frontend renderers) MUST follow these exact structures.

---

## Table of Contents

1. [English Question Types](#english-question-types)
2. [Mathematics Question Types](#mathematics-question-types)
3. [Field Naming Conventions](#field-naming-conventions)
4. [Validation Rules](#validation-rules)

---

## English Question Types

### 1. Multiple Choice Questions (mcq)

```json
{
  "question": "What is a nest a home for?",
  "options": [
    "a bird",
    "a bee",
    "a rabbit",
    "a child"
  ],
  "answer": "a bird",
  "marks": 1,
  "difficulty": "easy",
  "bloom_level": "remember"
}
```

**Required Fields:**
- `question` (string): The question text
- `options` (array of strings): Exactly 4 options
- `answer` (string): Must match one of the options exactly
- `marks` (number): Point value

**Optional Fields:**
- `difficulty` (string): easy, medium, hard
- `bloom_level` (string): Bloom's taxonomy level

---

### 2. True/False (true_false)

```json
{
  "statement": "A hive is a home for a bee.",
  "answer": true,
  "marks": 1,
  "difficulty": "easy",
  "bloom_level": "remember"
}
```

**Required Fields:**
- `statement` (string): The statement to evaluate
- `answer` (boolean): true or false
- `marks` (number): Point value

**IMPORTANT:** Use `statement`, NOT `question`!

---

### 3. Fill in the Blanks (fill_in_blanks)

```json
{
  "question": "A nest is a home for a ______.",
  "answer": "bird",
  "marks": 1,
  "difficulty": "easy",
  "bloom_level": "remember"
}
```

**Required Fields:**
- `question` (string): Question with blank(s) marked as ______
- `answer` (string): The word(s) that fill the blank
- `marks` (number): Point value

**Note:** Question must contain at least one `______` (6 underscores)

---

### 4. Match Columns (match_columns)

```json
{
  "instruction": "Match the animal to its home.",
  "column_a": [
    "1. Bird",
    "2. Bee",
    "3. Rabbit",
    "4. Me"
  ],
  "column_b": [
    "A. Hive",
    "B. House",
    "C. Hole",
    "D. Nest"
  ],
  "answer": {
    "1": "D",
    "2": "A",
    "3": "C",
    "4": "B"
  },
  "marks": 4,
  "difficulty": "medium",
  "bloom_level": "understand"
}
```

**Required Fields:**
- `instruction` (string): Instructions for matching
- `column_a` (array of strings): Left column items (numbered 1, 2, 3, 4)
- `column_b` (array of strings): Right column items (lettered A, B, C, D)
- `answer` (object): Map of number keys to letter values
- `marks` (number): Point value (typically 4)

**IMPORTANT:** Use `instruction`, NOT `question`!

---

### 5. Rearrange Sentences (rearrange_sentences)

```json
{
  "instruction": "Put the sentences in the correct order to tell the story.",
  "sentences": [
    "I climb the ladder to the tree house.",
    "I see a big tree in the garden.",
    "There is a wooden tree house in the tree."
  ],
  "answer": [
    "I see a big tree in the garden.",
    "There is a wooden tree house in the tree.",
    "I climb the ladder to the tree house."
  ],
  "marks": 3,
  "difficulty": "medium",
  "bloom_level": "understand"
}
```

**Required Fields:**
- `instruction` (string): Instructions for rearranging
- `sentences` (array of strings): Sentences in scrambled order (3-5 sentences)
- `answer` (array of strings): Same sentences in correct order
- `marks` (number): Point value

**IMPORTANT:**
- Use `instruction`, NOT `question`!
- `answer` is an array, NOT a string!

---

### 6. Circle Correct Answer (circle_correct_answer)

```json
{
  "question": "Circle the correct answer: A hive is a home for a _____.",
  "options": [
    "bird",
    "bee",
    "rabbit",
    "child"
  ],
  "answer": "bee",
  "marks": 1,
  "difficulty": "easy",
  "bloom_level": "remember"
}
```

**Required Fields:**
- `question` (string): Question with instruction to circle
- `options` (array of strings): 4 options
- `answer` (string): Must match one option exactly
- `marks` (number): Point value

**Note:** This is essentially MCQ with different wording

---

### 7. Unseen Comprehension Objective (unseen_comprehension_objective)

```json
{
  "passage": "Sam visits his cousin who lives in a tall building in the city. The building has many floors and shiny glass walls. To get to his cousin's home, Sam goes up in a lift. From the window, he can see many other tall skyscrapers around him.",
  "instruction": "Read the passage carefully and answer the questions.",
  "sub_questions": [
    {
      "question": "Where does Sam's cousin live?",
      "options": [
        "In a cave home",
        "In a beehive house",
        "In a tall building in the city",
        "In a stilt house"
      ],
      "answer": "In a tall building in the city",
      "marks": 1
    },
    {
      "question": "How does Sam get to his cousin's home?",
      "options": [
        "He climbs a ladder.",
        "He goes up in a lift.",
        "He rides in a boat.",
        "He walks up a hill."
      ],
      "answer": "He goes up in a lift.",
      "marks": 1
    }
  ],
  "marks": 4,
  "difficulty": "medium",
  "bloom_level": "understand"
}
```

**Required Fields:**
- `passage` (string): Reading passage
- `instruction` (string): Instructions for the comprehension
- `sub_questions` (array of objects): 4-5 sub-questions
  - Each sub-question has: `question`, `options`, `answer`, `marks`
- `marks` (number): Total marks for all sub-questions

**CRITICAL:** This has `sub_questions`, NOT a single `question`!

---

### 8. Short Answer (short_answer)

```json
{
  "question": "Name two kinds of animal homes from the poem.",
  "answer": "Two kinds of animal homes from the poem are a nest and a hive.",
  "marks": 2,
  "difficulty": "medium",
  "bloom_level": "remember"
}
```

**Required Fields:**
- `question` (string): The question text
- `answer` (string): Sample answer
- `marks` (number): Point value (typically 2)

---

### 9. Long Answer (long_answer)

```json
{
  "question": "Describe the tree house near Mia's home using the words roof, ladder, and railing.",
  "answer": "The tree house near Mia's home is built in a big tree. It has a roof to cover it and walls with windows. There is a ladder that children climb to get up to the tree house. Around the edge there is a railing, so they can stand and look down safely from the balcony.",
  "marks": 5,
  "difficulty": "hard",
  "bloom_level": "create"
}
```

**Required Fields:**
- `question` (string): The question text
- `answer` (string): Detailed sample answer (3-5 sentences)
- `marks` (number): Point value (typically 5)

---

### 10. Make Sentences (make_sentences)

```json
{
  "instruction": "Use each word to make a sentence about homes or animals.",
  "words": [
    "nest",
    "rabbit",
    "tree house"
  ],
  "marks": 3,
  "difficulty": "medium",
  "bloom_level": "apply"
}
```

**Required Fields:**
- `instruction` (string): Instructions for making sentences
- `words` (array of strings): 3 words to use
- `marks` (number): Point value (typically 3)

**IMPORTANT:**
- Use `instruction`, NOT `question`!
- No `answer` field - this is student-generated

---

### 11. Complete Sentences (complete_sentences)

```json
{
  "instruction": "Complete the sentences with words from the box: nest, hive, hole, house.",
  "sentences": [
    "A ______ is a home for a bird.",
    "A ______ is a home for a bee.",
    "A ______ is a home for a rabbit.",
    "A ______ is a home for me."
  ],
  "marks": 4,
  "difficulty": "medium",
  "bloom_level": "apply"
}
```

**Required Fields:**
- `instruction` (string): Instructions with word bank
- `sentences` (array of strings): Sentences with blanks (3-5 sentences)
- `marks` (number): Point value

**IMPORTANT:**
- Use `instruction`, NOT `question`!
- No `answer` field - answers are in the instruction

---

### 12. Unseen Creative Writing (unseen_creative_writing)

```json
{
  "instruction": "Write a short paragraph (3–4 sentences).",
  "prompt": "Imagine you have your own tree house. Describe what it looks like and what you do there.",
  "answer": "My tree house is high up in a big green tree. It has a strong roof and walls with two little windows. I climb a wooden ladder to get inside and sit by the railing. I read books, eat bananas from my basket and watch the birds in their nest.",
  "marks": 5,
  "difficulty": "hard",
  "bloom_level": "create"
}
```

**Required Fields:**
- `instruction` (string): General instruction (word count, format)
- `prompt` (string): Specific writing prompt
- `answer` (string): Sample response
- `marks` (number): Point value (typically 5)

**IMPORTANT:** Uses `prompt` for the main question!

---

### 13. Unseen Comprehension Subjective (unseen_comprehension_subjective)

```json
{
  "passage": "Rita and her brother play near a big tree in their garden. High in the branches, their father has built a small tree house. It has a roof, walls and a little window. A long ladder reaches from the ground to the door. On one branch, a bird has made a neat nest.",
  "instruction": "Read the passage carefully and answer the questions in sentences.",
  "sub_questions": [
    {
      "question": "Where do Rita and her brother play?",
      "answer": "Rita and her brother play near a big tree in their garden.",
      "marks": 2
    },
    {
      "question": "Who built the tree house and where is it?",
      "answer": "Their father built the tree house high in the branches of the tree.",
      "marks": 2
    },
    {
      "question": "Name two parts of the tree house from the passage.",
      "answer": "The tree house has a roof and walls, and it also has a little window.",
      "marks": 2
    }
  ],
  "marks": 10,
  "difficulty": "hard",
  "bloom_level": "analyze"
}
```

**Required Fields:**
- `passage` (string): Reading passage
- `instruction` (string): Instructions for comprehension
- `sub_questions` (array of objects): 5 sub-questions
  - Each sub-question has: `question`, `answer`, `marks` (typically 2 each)
- `marks` (number): Total marks (typically 10)

**CRITICAL:** This has `sub_questions`, NOT a single `question`!

---

## Mathematics Question Types

### 1. Multiple Choice Questions (mcq)

```json
{
  "question": "What is 5 + 3?",
  "options": [
    "6",
    "7",
    "8",
    "9"
  ],
  "answer": "8",
  "marks": 1,
  "difficulty": "easy",
  "bloom_level": "remember"
}
```

**Same structure as English MCQ**

---

### 2. True/False (true_false)

```json
{
  "statement": "The sum of 2 + 2 equals 5.",
  "answer": false,
  "marks": 1,
  "difficulty": "easy",
  "bloom_level": "remember"
}
```

**Same structure as English True/False**

---

### 3. Fill in the Blanks (fill_in_blanks)

```json
{
  "question": "5 + ______ = 12",
  "answer": "7",
  "marks": 1,
  "difficulty": "easy",
  "bloom_level": "apply"
}
```

**Same structure as English Fill in Blanks**

---

### 4. Match Columns (match_columns)

```json
{
  "instruction": "Match the operation to its result.",
  "column_a": [
    "1. 2 + 3",
    "2. 4 + 1",
    "3. 3 + 2",
    "4. 1 + 4"
  ],
  "column_b": [
    "A. 5",
    "B. 5",
    "C. 5",
    "D. 5"
  ],
  "answer": {
    "1": "A",
    "2": "B",
    "3": "C",
    "4": "D"
  },
  "marks": 4,
  "difficulty": "medium",
  "bloom_level": "understand"
}
```

**Same structure as English Match Columns**

---

### 5. Word Problems (word_problems)

```json
{
  "question": "Sara has 5 apples. Her friend gives her 3 more apples. How many apples does Sara have now?",
  "answer": "8",
  "solution": "5 + 3 = 8. Sara has 8 apples.",
  "marks": 3,
  "difficulty": "medium",
  "bloom_level": "apply"
}
```

**Required Fields:**
- `question` (string): Word problem text
- `answer` (string): Final answer
- `solution` (string): Step-by-step solution
- `marks` (number): Point value (typically 3)

---

### 6. Step by Step (step_by_step)

```json
{
  "question": "Solve: 25 + 17",
  "steps": [
    "Step 1: Add the ones place: 5 + 7 = 12. Write 2, carry 1.",
    "Step 2: Add the tens place: 2 + 1 + 1 (carried) = 4.",
    "Step 3: Write the final answer: 42"
  ],
  "answer": "42",
  "marks": 3,
  "difficulty": "medium",
  "bloom_level": "apply"
}
```

**Required Fields:**
- `question` (string): Problem to solve
- `steps` (array of strings): Solution steps
- `answer` (string): Final answer
- `marks` (number): Point value

---

### 7. Short Answer (short_answer)

```json
{
  "question": "What is the place value of 5 in the number 527?",
  "answer": "The place value of 5 in 527 is hundreds.",
  "marks": 2,
  "difficulty": "medium",
  "bloom_level": "understand"
}
```

**Same structure as English Short Answer**

---

### 8. Long Answer (long_answer)

```json
{
  "question": "Explain how to add two 2-digit numbers with regrouping. Use an example to show your answer.",
  "answer": "To add two 2-digit numbers with regrouping, first add the ones place. If the sum is 10 or more, write the ones digit and carry the tens digit to the tens column. Then add the tens place including the carried digit. For example: 27 + 18 = 45. First, 7 + 8 = 15, so write 5 and carry 1. Then 2 + 1 + 1 = 4. The answer is 45.",
  "marks": 5,
  "difficulty": "hard",
  "bloom_level": "evaluate"
}
```

**Same structure as English Long Answer**

---

## Field Naming Conventions

### Primary Question Field

Different question types use different primary fields:

| Question Type | Primary Field |
|--------------|---------------|
| MCQ, Fill in Blanks, Circle Correct, Short Answer, Long Answer, Word Problems, Step by Step | `question` |
| True/False | `statement` |
| Match Columns, Rearrange Sentences, Make Sentences, Complete Sentences | `instruction` |
| Unseen Creative Writing | `prompt` (+ `instruction`) |
| Unseen Comprehension (Objective/Subjective) | `passage` (+ `instruction` + `sub_questions`) |

### Answer Field

Different question types use different answer structures:

| Question Type | Answer Field Type |
|--------------|-------------------|
| MCQ, Circle Correct, Fill in Blanks, Short Answer, Long Answer, Word Problems, Step by Step | `answer` (string) |
| True/False | `answer` (boolean) |
| Match Columns | `answer` (object: {"1": "A", "2": "B", ...}) |
| Rearrange Sentences | `answer` (array of strings) |
| Unseen Comprehension | `sub_questions[].answer` (string per sub-question) |
| Make Sentences, Complete Sentences | NO answer field |

---

## Validation Rules

### 1. Required Fields (All Question Types)

- `marks` (number, must be > 0)

### 2. String Fields

- Must be non-empty strings
- No leading/trailing whitespace
- Case-sensitive matching for answers

### 3. Array Fields

- `options`: Must have exactly 4 items for MCQ
- `column_a`, `column_b`: Must have exactly 4 items for Match Columns
- `sentences`: Must have 3-5 items for Rearrange Sentences
- `words`: Must have 3 items for Make Sentences
- `sub_questions`: Must have 4-5 items for Unseen Comprehension

### 4. Object Fields

- `answer` for Match Columns: Must have keys "1", "2", "3", "4" mapping to "A", "B", "C", "D"

### 5. Boolean Fields

- `answer` for True/False: Must be exactly `true` or `false` (not strings)

---

## Error Handling

### Case Sensitivity

- Field names are **case-sensitive**: `question` ✓, `Question` ✗
- Answer values should match case from options/passage

### Missing Fields

**Fallback Priority:**
1. Try `question`
2. Try `statement`
3. Try `instruction`
4. Try `passage`
5. Try `prompt`
6. Show "[Question content unavailable]"

### Malformed Data

- Invalid JSON → Return error, don't generate exam
- Missing required fields → Skip question, log warning
- Type mismatch → Attempt conversion, fallback to string

---

## Complete Example: Full English Exam Structure

```json
{
  "objective": {
    "mcq": [...],
    "true_false": [...],
    "fill_in_blanks": [...],
    "match_columns": [...],
    "rearrange_sentences": [...],
    "circle_correct_answer": [...],
    "unseen_comprehension_objective": [...]
  },
  "subjective": {
    "short_answer": [...],
    "long_answer": [...],
    "make_sentences": [...],
    "complete_sentences": [...],
    "unseen_creative_writing": [...],
    "unseen_comprehension_subjective": [...]
  }
}
```

## Complete Example: Full Mathematics Exam Structure

```json
{
  "objective": {
    "mcq": [...],
    "true_false": [...],
    "fill_in_blanks": [...],
    "match_columns": [...]
  },
  "subjective": {
    "word_problems": [...],
    "step_by_step": [...],
    "short_answer": [...],
    "long_answer": [...]
  }
}
```

---

**Last Updated:** February 16, 2026
**Version:** 1.0
**Status:** ✅ CANONICAL REFERENCE - ALL SYSTEMS MUST COMPLY
