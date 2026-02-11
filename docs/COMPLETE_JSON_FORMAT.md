# Complete Teravox Exam JSON Format - ALL 14 Question Types

## 🔍 Important: Response Filtering

**How it works:**
1. **Internally**: LLM generates all 14 question types (for protocol compliance)
2. **Filtering**: Empty question types are automatically removed
3. **You receive**: ONLY the question types you requested

**Example:**
- You request: `objective: ["mcq", "true_false"]` and `subjective: ["short_answer"]`
- You receive: ONLY those 3 types, no empty arrays, no other types

---

## Full Example with All Question Types

(This shows what all 14 types LOOK LIKE when populated. Your actual response will contain only the types you request.)

```json
{
  "objective": {
    "mcq": {
      "questions": [
        {
          "question": "What do plants need to grow?",
          "options": ["Sunlight and water", "Only darkness", "Only salt", "Nothing at all"],
          "answer": "Sunlight and water",
          "marks": 1
        }
      ]
    },
    "true_false": {
      "questions": [
        {
          "statement": "Fish live in trees.",
          "answer": false,
          "marks": 1
        }
      ]
    },
    "fill_in_blanks": {
      "questions": [
        {
          "question": "The sun rises in the _______ and sets in the _______.",
          "answer": "east, west",
          "marks": 1
        }
      ]
    },
    "match_columns": {
      "questions": [
        {
          "instruction": "Match the animals in Column A with their habitats in Column B",
          "column_a": ["Fish", "Bird", "Lion"],
          "column_b": ["Nest", "Water", "Den"],
          "answer": {"Fish": "Water", "Bird": "Nest", "Lion": "Den"},
          "marks": 1.5
        }
      ]
    },
    "circle_correct_answer": {
      "questions": [
        {
          "question": "Which animal says 'Moo'?",
          "options": ["Cat", "Cow", "Dog", "Duck"],
          "answer": "Cow",
          "marks": 1
        }
      ]
    },
    "rearrange_sentences": {
      "questions": [
        {
          "instruction": "Rearrange the sentences to form a complete story",
          "sentences": [
            "Then he ate his lunch under a big tree.",
            "Ram went to the park in the morning.",
            "Finally, he played with his friends.",
            "He brought a lunch box with him."
          ],
          "answer": ["Ram went to the park in the morning.", "He brought a lunch box with him.", "Then he ate his lunch under a big tree.", "Finally, he played with his friends."],
          "marks": 2
        }
      ]
    },
    "unseen_comprehension_objective": {
      "questions": [
        {
          "instruction": "Read the passage and answer the questions",
          "passage": "Rina loves birds. She watches them every morning. She sees sparrows, crows, and pigeons. Rina puts seeds and water for them near her window. The birds come and eat. They are happy. Rina is happy too.",
          "sub_questions": [
            {
              "question": "What does Rina put near her window?",
              "options": ["Food and water", "Toys", "Books", "Stones"],
              "answer": "Food and water",
              "marks": 1
            },
            {
              "statement": "Rina watches birds in the evening.",
              "answer": false,
              "marks": 1
            },
            {
              "question": "Rina sees _______, crows, and pigeons.",
              "answer": "sparrows",
              "marks": 1
            }
          ],
          "marks": 3
        }
      ]
    }
  },
  "subjective": {
    "short_answer": {
      "questions": [
        {
          "question": "Why do plants need water?",
          "answer": "Plants need water to grow and stay healthy. Water helps them make food through photosynthesis.",
          "marks": 2
        }
      ]
    },
    "complete_sentences": {
      "questions": [
        {
          "instruction": "Complete the following sentences with appropriate words",
          "sentences": [
            {
              "incomplete": "If I water a plant every day, it will _______.",
              "answer": "grow",
              "marks": 1
            },
            {
              "incomplete": "My favorite animal is _______ because _______.",
              "answer": "cat, it is cute",
              "marks": 2
            }
          ],
          "marks": 3
        }
      ]
    },
    "make_sentences": {
      "questions": [
        {
          "instruction": "Make sentences using the following words. You can change the word form if needed.",
          "words": [
            {
              "word": "butterfly",
              "answer": "I saw a butterfly in the garden."
            },
            {
              "word": "happy",
              "answer": "I am happy today."
            }
          ],
          "marks": 2
        }
      ]
    },
    "long_answer": {
      "questions": [
        {
          "question": "Describe what you learned about how animals get food. Explain why different animals eat different foods.",
          "answer": "Some animals eat meat and some eat plants. Lions eat meat because they are hunters. Cows eat grass because they are herbivores. Different animals have different teeth for their food. Meat-eaters have sharp teeth and plant-eaters have flat teeth.",
          "marks": 4
        }
      ]
    },
    "unseen_creative_writing": {
      "questions": [
        {
          "instruction": "Write a story based on the prompt below",
          "prompt": "Your friend found a magical door in the classroom. Write a story about what happens when you open it.",
          "answer": "One day my friend found a magical door in the classroom. We opened the door and saw a beautiful garden with flying flowers. The flowers could talk to us and told us jokes. We played with the flowers for a long time. When the bell rang, we had to close the door and go back to the classroom.",
          "marks": 4
        }
      ]
    },
    "picture_description": {
      "questions": [
        {
          "instruction": "Look at the picture. Write sentences describing what you see.",
          "image_description": "A colorful illustration of a park with children playing. There is a slide, swing, and sandbox. Trees and clouds visible.",
          "answer": "In the picture, I can see a beautiful park. There are children playing on the swings and slides. There are trees and green grass all around. The sky is blue with white clouds. Everyone in the park looks very happy and is having fun.",
          "marks": 3
        }
      ]
    },
    "unseen_comprehension_subjective": {
      "questions": [
        {
          "instruction": "Read the passage and answer the questions",
          "passage": "Maya had a pet rabbit named Fluffy. One day, Fluffy got sick. Maya took her to the vet. The vet gave Fluffy medicine. Maya stayed with Fluffy every day. Soon Fluffy got better. Maya was so happy. She learned that taking care of pets is very important.",
          "sub_questions": [
            {
              "question": "Why did Maya take Fluffy to the vet?",
              "answer": "Because Fluffy was sick and needed help to feel better.",
              "marks": 2
            },
            {
              "question": "What did Maya learn from this experience?",
              "answer": "Maya learned that taking care of pets is very important.",
              "marks": 2
            }
          ],
          "marks": 4
        }
      ]
    }
  }
}
```

## Structure Summary

### OBJECTIVE Questions (Answers are fixed/right or wrong)
1. **mcq** - Multiple choice questions
   - `question`, `options[]`, `answer`, `marks`

2. **true_false** - True/False statements
   - `statement`, `answer` (true/false), `marks`

3. **fill_in_blanks** - Complete sentences with blanks
   - `question`, `answer`, `marks`

4. **match_columns** - Match Column A with Column B
   - `instruction`, `column_a[]`, `column_b[]`, `answer{}`, `marks`

5. **circle_correct_answer** - Circle the correct answer from 4 options
   - `question`, `options[]`, `answer`, `marks`

6. **rearrange_sentences** - Arrange sentences in correct order
   - `instruction`, `sentences[]`, `answer[]`, `marks`

7. **unseen_comprehension_objective** - Read passage, answer objective Qs
   - `instruction`, `passage`, `sub_questions[]`, `marks`

### SUBJECTIVE Questions (Answers vary/need explanation or creativity)
1. **short_answer** - 1-3 sentence answers
   - `question`, `answer`, `marks`

2. **complete_sentences** - Fill blanks with appropriate words
   - `instruction`, `sentences[]`, `marks`

3. **make_sentences** - Create original sentences using words
   - `instruction`, `words[]`, `marks`

4. **long_answer** - Extended response (3-5 sentences)
   - `question`, `answer`, `marks`

5. **unseen_creative_writing** - Write story/paragraph from prompt
   - `instruction`, `prompt`, `answer`, `marks`

6. **picture_description** - Describe provided images
   - `instruction`, `image_description`, `answer`, `marks`

7. **unseen_comprehension_subjective** - Read passage, answer subjective Qs
   - `instruction`, `passage`, `sub_questions[]`, `marks`

## Key Rules

✅ **DO Include:**
- `question` or `statement` (statement for true/false)
- `answer` (string or boolean or array or object depending on type)
- `marks` (number)
- `options` (for MCQ and circle_correct_answer)
- `instruction`, `passage`, `prompt` (where applicable)

❌ **DO NOT Include:**
- `id`, `type`, `difficulty`, `bloom_level`
- `success`, `metadata`, `model`, `provider`
- `is_correct`, `question_id`, `chapter`
- Any wrapper tokens

## Minimum Requirements

- **At least 5 questions** per question type requested
- Users can then select which to keep/discard
- Each question type can have 5-10 questions generated

## Example Curl Command

See `CURL_EXAMPLES.md` for complete testing examples.
