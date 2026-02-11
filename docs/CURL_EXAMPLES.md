# Curl Examples for Testing All Question Types

## 🎯 Latest API Format (Feb 10, 2026)

**The endpoint now uses simple arrays for question types!**

Instead of:
```json
{"objective": {"mcq": 5, "true_false": 5}}  // ❌ Old format
```

Use:
```json
{"objective": ["mcq", "true_false"]}  // ✅ New format (5 questions per type by default)
```

---

## 🎯 SINGLE COMPREHENSIVE REQUEST - All 14 Question Types

```bash
curl -X POST http://localhost:8000/generate-exam-questions \
  -H "Content-Type: application/json" \
  -d '{
    "subject": "Science",
    "grade": "2",
    "course_page_range": "110-113",
    "question_types": {
      "objective": [
        "mcq",
        "true_false",
        "fill_in_blanks",
        "match_columns",
        "circle_correct_answer",
        "rearrange_sentences",
        "unseen_comprehension_objective"
      ],
      "subjective": [
        "short_answer",
        "complete_sentences",
        "make_sentences",
        "long_answer",
        "unseen_creative_writing",
        "picture_description",
        "unseen_comprehension_subjective"
      ]
    }
  }' | jq .
```

## Save Response to File

```bash
curl -X POST http://localhost:8000/generate-exam-questions \
  -H "Content-Type: application/json" \
  -d '{
    "subject": "Science",
    "grade": "2",
    "course_page_range": "110-113",
    "question_types": {
      "objective": [
        "mcq",
        "true_false",
        "fill_in_blanks",
        "match_columns",
        "circle_correct_answer",
        "rearrange_sentences",
        "unseen_comprehension_objective"
      ],
      "subjective": [
        "short_answer",
        "complete_sentences",
        "make_sentences",
        "long_answer",
        "unseen_creative_writing",
        "picture_description",
        "unseen_comprehension_subjective"
      ]
    }
  }' | jq . > exam_all_types.json && echo "✅ Response saved to exam_all_types.json"
```

## Only Objective Questions (7 types)

```bash
curl -X POST http://localhost:8000/generate-exam-questions \
  -H "Content-Type: application/json" \
  -d '{
    "subject": "English",
    "grade": "3",
    "activity_page_range": "25-30",
    "question_types": {
      "objective": [
        "mcq",
        "true_false",
        "fill_in_blanks",
        "match_columns",
        "circle_correct_answer",
        "rearrange_sentences",
        "unseen_comprehension_objective"
      ]
    }
  }' | jq .
```

## Only Subjective Questions (7 types)

```bash
curl -X POST http://localhost:8000/generate-exam-questions \
  -H "Content-Type: application/json" \
  -d '{
    "subject": "English",
    "grade": "3",
    "activity_page_range": "25-30",
    "question_types": {
      "subjective": [
        "short_answer",
        "complete_sentences",
        "make_sentences",
        "long_answer",
        "unseen_creative_writing",
        "picture_description",
        "unseen_comprehension_subjective"
      ]
    }
  }' | jq .
```

## Test Individual Question Types

### Just MCQ

```bash
curl -X POST http://localhost:8000/generate-exam-questions \
  -H "Content-Type: application/json" \
  -d '{
    "subject": "Math",
    "grade": "4",
    "course_page_range": "45-50",
    "question_types": {
      "objective": ["mcq"]
    }
  }' | jq .
```

### Just True/False

```bash
curl -X POST http://localhost:8000/generate-exam-questions \
  -H "Content-Type: application/json" \
  -d '{
    "subject": "Science",
    "grade": "2",
    "course_page_range": "110-113",
    "question_types": {
      "objective": ["true_false"]
    }
  }' | jq .
```

### Just Fill in Blanks

```bash
curl -X POST http://localhost:8000/generate-exam-questions \
  -H "Content-Type: application/json" \
  -d '{
    "subject": "Math",
    "grade": "3",
    "course_page_range": "40-45",
    "question_types": {
      "objective": ["fill_in_blanks"]
    }
  }' | jq .
```

### Just Match Columns

```bash
curl -X POST http://localhost:8000/generate-exam-questions \
  -H "Content-Type: application/json" \
  -d '{
    "subject": "Science",
    "grade": "3",
    "course_page_range": "50-55",
    "question_types": {
      "objective": ["match_columns"]
    }
  }' | jq .
```

### Just Circle Correct Answer

```bash
curl -X POST http://localhost:8000/generate-exam-questions \
  -H "Content-Type: application/json" \
  -d '{
    "subject": "English",
    "grade": "1",
    "activity_page_range": "10-15",
    "question_types": {
      "objective": ["circle_correct_answer"]
    }
  }' | jq .
```

### Just Rearrange Sentences

```bash
curl -X POST http://localhost:8000/generate-exam-questions \
  -H "Content-Type: application/json" \
  -d '{
    "subject": "English",
    "grade": "2",
    "course_page_range": "35-40",
    "question_types": {
      "objective": ["rearrange_sentences"]
    }
  }' | jq .
```

### Just Unseen Comprehension (Objective)

```bash
curl -X POST http://localhost:8000/generate-exam-questions \
  -H "Content-Type: application/json" \
  -d '{
    "subject": "English",
    "grade": "3",
    "course_page_range": "60-65",
    "question_types": {
      "objective": ["unseen_comprehension_objective"]
    }
  }' | jq .
```

### Just Short Answer

```bash
curl -X POST http://localhost:8000/generate-exam-questions \
  -H "Content-Type: application/json" \
  -d '{
    "subject": "English",
    "grade": "3",
    "activity_page_range": "20-25",
    "question_types": {
      "subjective": ["short_answer"]
    }
  }' | jq .
```

### Just Long Answer

```bash
curl -X POST http://localhost:8000/generate-exam-questions \
  -H "Content-Type: application/json" \
  -d '{
    "subject": "Science",
    "grade": "4",
    "course_page_range": "55-60",
    "question_types": {
      "subjective": ["long_answer"]
    }
  }' | jq .
```

### Just Creative Writing

```bash
curl -X POST http://localhost:8000/generate-exam-questions \
  -H "Content-Type: application/json" \
  -d '{
    "subject": "English",
    "grade": "3",
    "activity_page_range": "30-35",
    "question_types": {
      "subjective": ["unseen_creative_writing"]
    }
  }' | jq .
```

### Just Complete Sentences

```bash
curl -X POST http://localhost:8000/generate-exam-questions \
  -H "Content-Type: application/json" \
  -d '{
    "subject": "English",
    "grade": "2",
    "course_page_range": "25-30",
    "question_types": {
      "subjective": ["complete_sentences"]
    }
  }' | jq .
```

### Just Make Sentences

```bash
curl -X POST http://localhost:8000/generate-exam-questions \
  -H "Content-Type: application/json" \
  -d '{
    "subject": "English",
    "grade": "3",
    "activity_page_range": "40-45",
    "question_types": {
      "subjective": ["make_sentences"]
    }
  }' | jq .
```

### Just Picture Description

```bash
curl -X POST http://localhost:8000/generate-exam-questions \
  -H "Content-Type: application/json" \
  -d '{
    "subject": "English",
    "grade": "1",
    "course_page_range": "15-20",
    "question_types": {
      "subjective": ["picture_description"]
    }
  }' | jq .
```

### Just Unseen Comprehension (Subjective)

```bash
curl -X POST http://localhost:8000/generate-exam-questions \
  -H "Content-Type: application/json" \
  -d '{
    "subject": "English",
    "grade": "3",
    "course_page_range": "70-75",
    "question_types": {
      "subjective": ["unseen_comprehension_subjective"]
    }
  }' | jq .
```

## Different Subjects and Grades

### Math Grade 5

```bash
curl -X POST http://localhost:8000/generate-exam-questions \
  -H "Content-Type: application/json" \
  -d '{
    "subject": "Mathematics",
    "grade": "5",
    "course_page_range": "80-90",
    "question_types": {
      "objective": ["mcq", "fill_in_blanks"],
      "subjective": ["long_answer"]
    }
  }' | jq .
```

### Science Grade 1

```bash
curl -X POST http://localhost:8000/generate-exam-questions \
  -H "Content-Type: application/json" \
  -d '{
    "subject": "Science",
    "grade": "1",
    "activity_page_range": "10-15",
    "question_types": {
      "objective": ["circle_correct_answer", "true_false"],
      "subjective": ["picture_description"]
    }
  }' | jq .
```

## Prerequisites

### 1. Start the server
```bash
cd /home/salman/Desktop/Projects/Teravox
python src/core/app.py
```

### 2. Install jq (optional, for pretty JSON)
```bash
# Ubuntu/Debian
sudo apt-get install jq

# macOS
brew install jq

# Windows (use curl without jq)
curl ... (without | jq .)
```

### 3. Set environment variables
Make sure `.env` file has:
```
OPENROUTER_API_KEY=your_key_here
SUPABASE_URL=your_url_here
SUPABASE_KEY=your_key_here
```

## Expected Response

### Success Response
```json
{
  "success": true,
  "exam": {
    "objective": {
      "mcq": {
        "questions": [...]
      }
    },
    "subjective": {
      "short_answer": {
        "questions": [...]
      }
    }
  }
}
```

**Important:** Response contains ONLY the question types you requested.
- If you request `objective: ["mcq", "true_false"]`, response will have ONLY those 2 types
- NO empty arrays for unrequested types
- NO other question types in response

### Files Created
- Response JSON: `/responses/exam_YYYYMMDD_HHMMSS_subject_grade.json` (clean, only requested types)
- Database: Exam saved to `generated_exams` table with cost metadata
- Logs: `/logs/teravox_YYYYMMDD_HHMMSS.log`

## Testing Checklist

After running curl command, verify:

- [ ] HTTP status 200 (success)
- [ ] Response has `objective` and `subjective` keys
- [ ] Only requested question types are present
- [ ] Each question type has a `questions` array with items
- [ ] MCQ questions have 4 options
- [ ] True/False uses `statement` key
- [ ] All questions have `answer` and `marks` fields
- [ ] NO id, difficulty, bloom_level, or type fields
- [ ] Response file created in `/responses/`
- [ ] Logs show all steps in `/logs/`

## Troubleshooting

### Connection Refused
```
curl: (7) Failed to connect to localhost port 8000: Connection refused
```
**Fix:** Start server with `python src/core/app.py`

### jq not found
```
jq: command not found
```
**Fix:** Install jq or remove `| jq .` from curl command

### Empty Response
**Fix:** Check logs in `/logs/` for errors

### API Error
**Fix:** Check `.env` file has correct credentials

## Quick One-Liners

**All 14 types (no line breaks):**
```bash
curl -X POST http://localhost:8000/generate-exam-questions -H "Content-Type: application/json" -d '{"subject":"Science","grade":"2","course_page_range":"110-113","question_types":{"objective":["mcq","true_false","fill_in_blanks","match_columns","circle_correct_answer","rearrange_sentences","unseen_comprehension_objective"],"subjective":["short_answer","complete_sentences","make_sentences","long_answer","unseen_creative_writing","picture_description","unseen_comprehension_subjective"]}}' | jq .
```

**Just MCQ and True/False (no line breaks):**
```bash
curl -X POST http://localhost:8000/generate-exam-questions -H "Content-Type: application/json" -d '{"subject":"English","grade":"2","course_page_range":"110-113","question_types":{"objective":["mcq","true_false"]}}' | jq .
```
