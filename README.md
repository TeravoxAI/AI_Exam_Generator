# Teravox - AI-Powered Exam Generation System

**Production-Grade Pedagogically-Grounded Question Generation**

---

## 🚀 Quick Start

```bash
# 1. Configure environment
cp .env.example .env
# Add your OpenRouter API key to .env

# 2. Start server
python app.py

# 3. Generate exam
python test_endpoints/test_generate_exam_questions.py
```

---

## 📋 Documentation

| Document | Purpose |
|----------|---------|
| **TECHNICAL_DESIGN.md** | Complete system architecture & specifications |
| **QUICKSTART.md** | 3-step setup guide |
| **exam_schema.json** | JSON structure for all question types |

---

## 🏗️ Professional Code Organization

```
src/
├── core/           # FastAPI application & endpoints
├── models/         # Request/Response data models
├── services/       # Business logic (LLM, Database)
└── prompts/        # Pedagogical system prompts
```

**Entry Point:** `app.py`

---

## 📡 API Endpoints

### POST `/generate-exam-questions` ⭐

**Complete pipeline:** Fetch content + Generate questions

```json
{
  "subject": "English",
  "grade": "2",
  "course_page_range": "110-113",
  "question_types": {
    "objective": {"mcq": 5, "true_false": 3},
    "subjective": {"short_answer": 2}
  }
}
```

**Returns:** 100 marks of pedagogically-aligned questions

---

## 🧠 Key Features

✅ **Model:** OpenAI GPT-5.1 via OpenRouter
✅ **Bloom's Taxonomy:** 6-level cognitive alignment
✅ **Mark Distribution:** Intelligent allocation
✅ **Question Types:** 15 supported types
✅ **Production Ready:** Error handling, validation, logging
✅ **Professionally Organized:** Clean code structure

---

## ⚡ Performance

- **Setup:** 1 minute
- **First Exam:** 20-30 seconds
- **Subsequent:** 15-30 seconds
- **Cost:** ~$0.05-0.15 per exam

---

## 🛠️ Technology Stack

- **Framework:** FastAPI
- **LLM:** OpenAI GPT-5.1 (via OpenRouter)
- **Frontend:** React + TypeScript + Tailwind CSS
- **Database:** Supabase (PostgreSQL)
- **Validation:** Pydantic
- **Server:** Uvicorn

---

## 📖 See Also

- `TECHNICAL_DESIGN.md` - Complete architecture
- `exam_schema.json` - Question structure
- `src/` - Professional code organization
- `test_endpoints/` - Working examples

---

**Ready to generate exams!** 🎓
