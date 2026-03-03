"""
LLM Service for exam question generation.
Integrates with OpenRouter API for OpenAI GPT-5.1 model.
"""

import os
import json
import requests
import time
from typing import Dict

from src.prompts import get_system_prompt, get_question_generation_prompt
from src.utils import get_logger
from src.utils.question_validator import validate_exam_content, QuestionValidator

logger = get_logger(__name__)


class LLMService:
    """Service for generating exam questions using OpenRouter with OpenAI GPT-5.1"""

    def __init__(self):
        """Initialize LLM service with OpenRouter API key from environment"""
        self.api_key = os.getenv("OPENROUTER_API_KEY")
        if not self.api_key:
            raise ValueError(
                "OPENROUTER_API_KEY environment variable not set. "
                "Please set your OpenRouter API key in the environment."
            )
        self.api_base = "https://openrouter.ai/api/v1"
        self.model = "openai/gpt-5.1"  # OpenAI GPT-5.1 via OpenRouter

    def generate_exam_questions(
        self,
        content: str,
        subject: str,
        grade: str,
        question_types: Dict,
        total_marks: int = 100
    ) -> Dict:
        """
        Generate exam questions from content using GPT-5.1 via OpenRouter.

        Args:
            content: Aggregated textbook content
            subject: Subject name
            grade: Grade level
            question_types: Dict with question types (objective/subjective)
            total_marks: Total marks for the exam

        Returns:
            Structured exam JSON with generated questions
        """
        logger.info(f"📚 Starting exam generation")
        logger.info(f"   Subject: {subject}, Grade: {grade}")
        logger.info(f"   Content length: {len(content)} chars")
        logger.debug(f"   Question types: {question_types}")

        start_time = time.time()

        try:
            # Prepare prompts
            logger.debug("🔍 Preparing pedagogical prompts...")
            user_prompt = get_question_generation_prompt(
                content=content,
                subject=subject,
                grade=grade,
                question_types=question_types,
                total_marks=total_marks
            )
            system_prompt = get_system_prompt(subject=subject)
            logger.debug(f"✅ Pedagogical prompts prepared ({subject} subject)")

            # Prepare request
            logger.debug("🔐 Preparing API request...")
            headers = {
                "Authorization": f"Bearer {self.api_key}",
                "Content-Type": "application/json",
                "HTTP-Referer": "https://exam-generator.app",
                "X-Title": "Exam-Gen"
            }

            payload = {
                "model": self.model,
                "temperature": 0.7,
                "max_tokens": 25000,  # Increased for comprehensive exam responses with all question types
                "messages": [
                    {"role": "system", "content": system_prompt},
                    {"role": "user", "content": user_prompt}
                ]
            }
            logger.info(f"🚀 Calling OpenRouter API with model: {self.model}")
            logger.info(f"   Endpoint: {self.api_base}/chat/completions")
            logger.info(f"   Temperature: 0.7 | Max tokens: 25000")
            logger.debug(f"   System prompt length: {len(system_prompt)} chars")
            logger.debug(f"   User prompt length: {len(user_prompt)} chars")

            # Call OpenRouter API with timeout (120 seconds for large requests)
            api_start = time.time()
            logger.info("📡 Sending request to OpenRouter...")
            response = requests.post(
                f"{self.api_base}/chat/completions",
                headers=headers,
                json=payload,
                timeout=120  # 2 minutes timeout for exam generation
            )
            api_duration = time.time() - api_start
            logger.info(f"✅ OpenRouter responded in {api_duration:.2f}s")
            logger.info(f"   HTTP Status: {response.status_code}")
            logger.debug(f"   Response headers: {dict(response.headers)}")
            logger.debug(f"   Response body length: {len(response.text)} chars")

            # Handle errors
            if response.status_code != 200:
                logger.error(f"❌ OpenRouter API error: {response.status_code}")
                logger.error(f"   Response body: {response.text[:500]}")
                error_detail = response.text
                try:
                    error_json = response.json()
                    error_detail = error_json.get("error", {}).get("message", error_detail)
                except:
                    pass
                logger.error(f"   Error details: {error_detail}")
                return {
                    "success": False,
                    "error": f"OpenRouter API error ({response.status_code}): {error_detail}"
                }

            # Extract response and metadata
            logger.info("📝 Processing LLM response...")

            try:
                response_data = response.json()
                logger.info(f"   ✅ Parsed API response")

                choices = response_data.get("choices", [])
                logger.info(f"   Choices count: {len(choices)}")

                if not choices:
                    logger.error("❌ No choices in API response")
                    return {"success": False, "error": "No choices in LLM response"}

                first_choice = choices[0]
                message = first_choice.get("message", {})
                response_text = message.get("content", "")

                # Extract cost and usage metadata from OpenRouter
                llm_metadata = self._extract_llm_metadata(response_data, response, api_duration)
                logger.info(f"✅ Cost metadata extracted: {llm_metadata.get('cost', {}).get('total_cost', 0)} USD")

                logger.info(f"   Content length: {len(response_text)} chars")
                if response_text:
                    logger.info(f"   Content preview: {response_text[:100]}...")
                else:
                    logger.error("❌ Empty content in message")

            except Exception as e:
                logger.error(f"❌ Failed to parse response JSON: {str(e)}")
                logger.error(f"   Raw text: {response.text[:500]}")
                raise

            if not response_text or not response_text.strip():
                logger.error("❌ Empty response from LLM - no content in message")
                logger.error(f"   Full response: {response.text}")
                return {"success": False, "error": "Empty response from LLM"}

            logger.info(f"✅ Response received ({len(response_text)} chars)")

            # Extract and validate JSON
            logger.info("🔍 Extracting JSON from response...")
            try:
                exam_questions = self._extract_json(response_text)
                logger.info("✅ JSON extracted successfully")
            except json.JSONDecodeError as e:
                logger.error(f"❌ JSON extraction failed: {str(e)}")
                logger.error(f"   Response text: {response_text[:500]}")
                raise

            logger.debug("✔️ Validating exam structure...")
            validated_exam = self._validate_exam_structure(exam_questions)
            logger.debug("✅ Exam structure validated")

            # Apply comprehensive question validation
            logger.info("🔍 Applying comprehensive question validation...")
            validated_exam = validate_exam_content(validated_exam)
            logger.info("✅ Comprehensive validation completed")

            # Pedagogical review pass for Grade 1-3 (rewrites grade-inappropriate questions)
            validated_exam = self._run_pedagogical_review(validated_exam, grade, subject)

            total_duration = time.time() - start_time
            logger.info(f"✅ Exam generation completed in {total_duration:.2f}s")

            return {
                "success": True,
                "exam": validated_exam,
                "metadata": llm_metadata  # Cost, tokens, and performance metrics
            }

        except json.JSONDecodeError as e:
            logger.error(f"❌ JSON parsing failed: {str(e)}")
            return {
                "success": False,
                "error": f"Failed to parse LLM response as JSON: {str(e)}",
                "raw_response": locals().get("response_text")
            }
        except requests.exceptions.RequestException as e:
            logger.error(f"❌ API request failed: {str(e)}")
            return {"success": False, "error": f"OpenRouter API request failed: {str(e)}"}
        except Exception as e:
            logger.error(f"❌ Unexpected error: {str(e)}", exc_info=True)
            return {"success": False, "error": f"LLM generation failed: {str(e)}"}

    def _extract_json(self, text: str) -> Dict:
        """Extract JSON from LLM response, handling markdown wrapping"""
        if not text or not text.strip():
            raise json.JSONDecodeError("Empty response text", text or "", 0)

        text = text.strip()

        # Try direct parse
        try:
            return json.loads(text)
        except json.JSONDecodeError:
            logger.debug("Direct JSON parse failed, trying extraction methods...")

        # Try markdown code blocks
        for marker in ["```json", "```"]:
            if marker in text:
                start = text.find(marker) + len(marker)
                end = text.find("```", start)
                if end > start:
                    json_str = text[start:end].strip()
                    try:
                        return json.loads(json_str)
                    except json.JSONDecodeError:
                        logger.debug(f"Failed to parse JSON from {marker} block")

        # Try finding JSON object (from first { to last })
        start = text.find("{")
        end = text.rfind("}") + 1
        if start != -1 and end > start:
            json_str = text[start:end]
            try:
                result = json.loads(json_str)
                logger.info(f"✅ Extracted JSON from position {start} to {end}")
                return result
            except json.JSONDecodeError as e:
                logger.error(f"Failed to parse extracted JSON: {e}")
                logger.error(f"Extracted text preview: {json_str[:200]}...")

        # Last resort: try to find and parse line by line
        logger.error(f"All JSON extraction methods failed")
        logger.error(f"Response text length: {len(text)}")
        logger.error(f"First 200 chars: {text[:200]}")
        logger.error(f"Last 200 chars: {text[-200:]}")

        raise json.JSONDecodeError("Could not extract valid JSON from response", text, 0)

    def _run_pedagogical_review(self, exam_json: Dict, grade: str, subject: str) -> Dict:
        """
        Second-pass LLM review: checks grade-appropriateness and fixes violations.
        Focused, fast call — rewrites only flagged questions.
        """
        grade_num = int(grade) if grade.isdigit() else 0
        if grade_num > 3:
            # Only run review for Grades 1-3 where strict simplicity is critical
            return exam_json

        review_system = (
            f"You are a strict pedagogical reviewer for Grade {grade} ({subject}) assessments. "
            f"Grade {grade} students are aged {5 + grade_num}-{6 + grade_num}. "
            "Your job: identify and rewrite any questions that violate grade-appropriateness rules, "
            "then return the corrected full exam JSON.\n\n"
            f"GRADE {grade} RULES (NON-NEGOTIABLE):\n"
            "1. NEVER ask students to DEFINE, EXPLAIN, DESCRIBE, or JUSTIFY concepts\n"
            "2. Questions must be DO/IDENTIFY/CALCULATE/DRAW/CIRCLE/TICK — action-based only\n"
            f"3. Maximum sentence length: {8 + grade_num * 2} words per question\n"
            "4. No compound sentences. No abstract vocabulary.\n"
            "5. Match columns: items must be SHORT (2-5 words each, no long sentences)\n"
            "6. Story problems: max 2 short sentences of context + 1 question\n"
            "7. No question should require more than 2 steps of reasoning\n"
            "8. Each concept tested at most TWICE across all question types\n\n"
            "TASK:\n"
            "- Review every question\n"
            "- Rewrite any that violate the rules above (keep the same structure/fields)\n"
            "- Do NOT change questions that already comply\n"
            "- Return the COMPLETE corrected exam JSON\n"
            "- Return ONLY valid JSON — no markdown, no explanations"
        )

        review_user = (
            f"Grade: {grade}\nSubject: {subject}\n\n"
            f"EXAM TO REVIEW:\n{json.dumps(exam_json, ensure_ascii=False)}\n\n"
            "Return the corrected exam JSON with grade-inappropriate questions rewritten. "
            "Return ONLY valid JSON."
        )

        try:
            headers = {
                "Authorization": f"Bearer {self.api_key}",
                "Content-Type": "application/json",
                "HTTP-Referer": "https://exam-generator.app",
                "X-Title": "Exam-Gen"
            }
            payload = {
                "model": self.model,
                "temperature": 0.3,  # Low temperature for conservative corrections
                "max_tokens": 20000,
                "messages": [
                    {"role": "system", "content": review_system},
                    {"role": "user", "content": review_user}
                ]
            }
            logger.info(f"🎓 Running pedagogical review for Grade {grade}...")
            resp = requests.post(
                f"{self.api_base}/chat/completions",
                headers=headers,
                json=payload,
                timeout=90
            )
            if resp.status_code != 200:
                logger.warning(f"⚠️ Pedagogical review API error {resp.status_code} — using original")
                return exam_json

            reviewed_text = resp.json()["choices"][0]["message"]["content"]
            reviewed_exam = self._extract_json(reviewed_text)
            logger.info("✅ Pedagogical review completed — questions corrected for grade-appropriateness")
            return reviewed_exam
        except Exception as e:
            logger.warning(f"⚠️ Pedagogical review failed ({e}) — using original exam")
            return exam_json

    def _extract_llm_metadata(self, response_data: Dict, response: requests.Response, api_duration: float) -> Dict:
        """
        Extract cost and usage metadata from OpenRouter API response.

        Args:
            response_data: Parsed JSON response from OpenRouter
            response: Raw response object for headers
            api_duration: Time taken for API call in seconds

        Returns:
            Dict with cost, tokens, model, and performance information
        """
        metadata = {
            "model": self.model,
            "provider": "openrouter",
            "api_latency_ms": int(api_duration * 1000),
        }

        # Extract usage information
        usage = response_data.get("usage", {})
        if usage:
            metadata["usage"] = {
                "prompt_tokens": usage.get("prompt_tokens", 0),
                "completion_tokens": usage.get("completion_tokens", 0),
                "total_tokens": usage.get("total_tokens", 0),
            }
            logger.info(
                f"📊 Tokens used - Input: {usage.get('prompt_tokens', 0)}, "
                f"Output: {usage.get('completion_tokens', 0)}, "
                f"Total: {usage.get('total_tokens', 0)}"
            )

        # Extract finish reason
        if response_data.get("choices"):
            finish_reason = response_data["choices"][0].get("finish_reason", "unknown")
            metadata["finish_reason"] = finish_reason
            logger.info(f"🏁 Finish reason: {finish_reason}")

        # Extract cost from OpenRouter headers
        # OpenRouter includes cost information in headers or response
        try:
            # Try to get from headers first (common with OpenRouter)
            cost_header = response.headers.get("x-cost", None)
            if cost_header:
                metadata["cost"] = {
                    "total_cost": float(cost_header),
                    "input_cost": 0,  # Individual costs not in headers
                    "output_cost": 0,
                }
                logger.info(f"💰 Total cost: ${cost_header} USD")
            else:
                # Calculate from usage if available (OpenRouter pricing)
                # These are approximate rates - adjust based on your OpenRouter plan
                usage_data = metadata.get("usage", {})
                input_tokens = usage_data.get("prompt_tokens", 0)
                output_tokens = usage_data.get("completion_tokens", 0)

                # GPT-5.1 pricing (adjust based on current rates)
                # These are example rates per 1M tokens
                input_cost_per_million = 0.001  # $0.001 per 1K tokens
                output_cost_per_million = 0.002  # $0.002 per 1K tokens

                input_cost = (input_tokens / 1000) * input_cost_per_million
                output_cost = (output_tokens / 1000) * output_cost_per_million
                total_cost = input_cost + output_cost

                metadata["cost"] = {
                    "input_cost": round(input_cost, 6),
                    "output_cost": round(output_cost, 6),
                    "total_cost": round(total_cost, 6),
                }
                logger.info(
                    f"💰 Estimated cost - Input: ${input_cost:.6f}, "
                    f"Output: ${output_cost:.6f}, Total: ${total_cost:.6f}"
                )
        except Exception as e:
            logger.warning(f"⚠️ Could not extract cost information: {str(e)}")
            metadata["cost"] = {
                "total_cost": 0,
                "input_cost": 0,
                "output_cost": 0,
            }

        return metadata

    def _validate_exam_structure(self, exam: Dict) -> Dict:
        """Validate and clean the exam structure - accept LLM response as-is"""
        if not isinstance(exam, dict):
            raise ValueError("Exam response must be a dictionary")

        # If response has objective/subjective at top level, use as-is (LLM format)
        if "objective" in exam or "subjective" in exam:
            exam_data = exam
        else:
            # Fallback for wrapped response
            exam_data = exam.get("exam", exam)

        # Ensure both sections exist (even if empty)
        exam_data.setdefault("objective", {})
        exam_data.setdefault("subjective", {})

        # Remove empty question type arrays (questions array is empty)
        exam_data = self._remove_empty_question_types(exam_data)

        return exam_data

    def _remove_empty_question_types(self, exam: Dict) -> Dict:
        """
        Remove question types with empty questions arrays.
        LLM generates all 14 types for compliance, but we only keep requested ones.
        """
        cleaned = {}

        for section, question_types in exam.items():
            if not isinstance(question_types, dict):
                cleaned[section] = question_types
                continue

            cleaned_types = {}
            for qtype, qdata in question_types.items():
                # Keep the question type only if it has questions
                if isinstance(qdata, dict):
                    questions = qdata.get("questions", [])
                    if questions and len(questions) > 0:
                        # Unwrap the questions array from the nested structure
                        cleaned_types[qtype] = questions
                        logger.debug(f"✅ Keeping {section}/{qtype}: {len(questions)} questions")
                    else:
                        logger.debug(f"⏭️  Skipping {section}/{qtype}: no questions (empty)")
                elif isinstance(qdata, list):
                    # Questions are already in array format
                    if len(qdata) > 0:
                        cleaned_types[qtype] = qdata
                        logger.debug(f"✅ Keeping {section}/{qtype}: {len(qdata)} questions")
                else:
                    cleaned_types[qtype] = qdata

            # Only include section if it has question types
            if cleaned_types:
                cleaned[section] = cleaned_types

        logger.info(f"📊 Cleaned exam: Removed empty question types, kept {sum(len(v) for v in cleaned.values())} types")
        return cleaned

    def _validate_question(self, question: Dict, section_type: str) -> None:
        """Validate individual question fields"""
        required = ["question", "marks"]
        if section_type == "objective":
            required.append("answer")
        else:
            required.append("sample_answer")

        for field in required:
            question.setdefault(field, None)

        question.setdefault("difficulty", "medium")
        question.setdefault("bloom_level", "understand")


def get_llm_service() -> LLMService:
    """Get or create LLM service instance"""
    return LLMService()
