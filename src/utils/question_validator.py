"""
Question Type Validator and Parser
Ensures all question data matches the canonical JSON schema
"""

from typing import Dict, Any, List, Optional, Union
import logging

logger = logging.getLogger(__name__)


class QuestionValidator:
    """Validates and normalizes question data according to the canonical schema"""

    # Define which field to use for the main question text per question type
    PRIMARY_FIELD_MAP = {
        # Types that use 'question'
        'mcq': 'question',
        'fill_in_blanks': 'question',
        'circle_correct_answer': 'question',
        'short_answer': 'question',
        'long_answer': 'question',
        'word_problems': 'question',
        'step_by_step': 'question',

        # Types that use 'statement'
        'true_false': 'statement',

        # Types that use 'instruction'
        'match_columns': 'instruction',
        'rearrange_sentences': 'instruction',
        'make_sentences': 'instruction',
        'complete_sentences': 'instruction',

        # Types that use 'prompt'
        'unseen_creative_writing': 'prompt',

        # Types that use 'passage'
        'unseen_comprehension_objective': 'passage',
        'unseen_comprehension_subjective': 'passage',
    }

    @staticmethod
    def validate_mcq(question: Dict[str, Any]) -> Dict[str, Any]:
        """Validate MCQ question structure"""
        errors = []

        # Required fields
        if 'question' not in question or not question['question']:
            errors.append("Missing or empty 'question' field")

        if 'options' not in question:
            errors.append("Missing 'options' field")
        elif not isinstance(question['options'], list):
            errors.append("'options' must be an array")
        elif len(question['options']) != 4:
            errors.append(f"'options' must have exactly 4 items, got {len(question['options'])}")

        if 'answer' not in question or not question['answer']:
            errors.append("Missing or empty 'answer' field")
        elif 'options' in question and question['answer'] not in question['options']:
            logger.warning(f"Answer '{question['answer']}' not in options: {question['options']}")

        if 'marks' not in question:
            errors.append("Missing 'marks' field")
            question['marks'] = 1  # Default

        if errors:
            logger.error(f"MCQ validation errors: {errors}")

        return question

    @staticmethod
    def validate_true_false(question: Dict[str, Any]) -> Dict[str, Any]:
        """Validate True/False question structure"""
        errors = []

        # Required fields
        if 'statement' not in question or not question['statement']:
            errors.append("Missing or empty 'statement' field")

        if 'answer' not in question:
            errors.append("Missing 'answer' field")
        elif not isinstance(question['answer'], bool):
            # Try to convert string to boolean
            if isinstance(question['answer'], str):
                if question['answer'].lower() in ['true', 'yes', '1']:
                    question['answer'] = True
                elif question['answer'].lower() in ['false', 'no', '0']:
                    question['answer'] = False
                else:
                    errors.append(f"'answer' must be boolean, got string: {question['answer']}")
            else:
                errors.append(f"'answer' must be boolean, got {type(question['answer'])}")

        if 'marks' not in question:
            question['marks'] = 1  # Default

        if errors:
            logger.error(f"True/False validation errors: {errors}")

        return question

    @staticmethod
    def validate_fill_in_blanks(question: Dict[str, Any]) -> Dict[str, Any]:
        """Validate Fill in Blanks question structure"""
        errors = []

        # Required fields
        if 'question' not in question or not question['question']:
            errors.append("Missing or empty 'question' field")
        elif '______' not in question['question']:
            logger.warning(f"Fill in blank question missing blank marker: {question['question']}")

        if 'answer' not in question or not question['answer']:
            errors.append("Missing or empty 'answer' field")

        if 'marks' not in question:
            question['marks'] = 1  # Default

        if errors:
            logger.error(f"Fill in Blanks validation errors: {errors}")

        return question

    @staticmethod
    def validate_match_columns(question: Dict[str, Any]) -> Dict[str, Any]:
        """Validate Match Columns question structure"""
        errors = []

        # Required fields
        if 'instruction' not in question or not question['instruction']:
            errors.append("Missing or empty 'instruction' field")

        if 'column_a' not in question:
            errors.append("Missing 'column_a' field")
        elif not isinstance(question['column_a'], list):
            errors.append("'column_a' must be an array")
        elif len(question['column_a']) != 4:
            errors.append(f"'column_a' must have exactly 4 items, got {len(question['column_a'])}")

        if 'column_b' not in question:
            errors.append("Missing 'column_b' field")
        elif not isinstance(question['column_b'], list):
            errors.append("'column_b' must be an array")
        elif len(question['column_b']) != 4:
            errors.append(f"'column_b' must have exactly 4 items, got {len(question['column_b'])}")

        if 'answer' not in question:
            errors.append("Missing 'answer' field")
        elif not isinstance(question['answer'], dict):
            errors.append(f"'answer' must be an object, got {type(question['answer'])}")
        else:
            # Validate answer has correct keys
            expected_keys = {'1', '2', '3', '4'}
            actual_keys = set(question['answer'].keys())
            if actual_keys != expected_keys:
                errors.append(f"'answer' must have keys 1,2,3,4, got {actual_keys}")

        if 'marks' not in question:
            question['marks'] = 4  # Default

        if errors:
            logger.error(f"Match Columns validation errors: {errors}")

        return question

    @staticmethod
    def validate_rearrange_sentences(question: Dict[str, Any]) -> Dict[str, Any]:
        """Validate Rearrange Sentences question structure"""
        errors = []

        # Required fields
        if 'instruction' not in question or not question['instruction']:
            errors.append("Missing or empty 'instruction' field")

        if 'sentences' not in question:
            errors.append("Missing 'sentences' field")
        elif not isinstance(question['sentences'], list):
            errors.append("'sentences' must be an array")
        elif not (3 <= len(question['sentences']) <= 5):
            logger.warning(f"'sentences' should have 3-5 items, got {len(question['sentences'])}")

        if 'answer' not in question:
            errors.append("Missing 'answer' field")
        elif not isinstance(question['answer'], list):
            errors.append(f"'answer' must be an array, got {type(question['answer'])}")

        if 'marks' not in question:
            question['marks'] = 3  # Default

        if errors:
            logger.error(f"Rearrange Sentences validation errors: {errors}")

        return question

    @staticmethod
    def validate_unseen_comprehension(question: Dict[str, Any], comprehension_type: str) -> Dict[str, Any]:
        """Validate Unseen Comprehension question structure (both objective and subjective)"""
        errors = []

        # Required fields
        if 'passage' not in question or not question['passage']:
            errors.append("Missing or empty 'passage' field")

        if 'instruction' not in question or not question['instruction']:
            errors.append("Missing or empty 'instruction' field")

        if 'sub_questions' not in question:
            errors.append("Missing 'sub_questions' field")
        elif not isinstance(question['sub_questions'], list):
            errors.append("'sub_questions' must be an array")
        elif not (4 <= len(question['sub_questions']) <= 5):
            logger.warning(f"'sub_questions' should have 4-5 items, got {len(question['sub_questions'])}")
        else:
            # Validate each sub-question
            for i, sub_q in enumerate(question['sub_questions']):
                if 'question' not in sub_q:
                    errors.append(f"sub_question {i+1} missing 'question' field")
                if 'answer' not in sub_q:
                    errors.append(f"sub_question {i+1} missing 'answer' field")
                if 'marks' not in sub_q:
                    sub_q['marks'] = 2  # Default for sub-questions

                # For objective, check for options
                if comprehension_type == 'objective':
                    if 'options' not in sub_q:
                        logger.warning(f"sub_question {i+1} missing 'options' field")
                    elif len(sub_q['options']) != 4:
                        logger.warning(f"sub_question {i+1} should have 4 options")

        if 'marks' not in question:
            # Calculate total marks from sub-questions
            total_marks = sum(sq.get('marks', 2) for sq in question.get('sub_questions', []))
            question['marks'] = total_marks or 10  # Default to 10

        if errors:
            logger.error(f"Unseen Comprehension ({comprehension_type}) validation errors: {errors}")

        return question

    @staticmethod
    def validate_make_sentences(question: Dict[str, Any]) -> Dict[str, Any]:
        """Validate Make Sentences question structure"""
        errors = []

        # Required fields
        if 'instruction' not in question or not question['instruction']:
            errors.append("Missing or empty 'instruction' field")

        if 'words' not in question:
            errors.append("Missing 'words' field")
        elif not isinstance(question['words'], list):
            errors.append("'words' must be an array")
        elif len(question['words']) != 3:
            logger.warning(f"'words' should have exactly 3 items, got {len(question['words'])}")

        if 'marks' not in question:
            question['marks'] = 3  # Default

        # NOTE: No 'answer' field expected for make_sentences

        if errors:
            logger.error(f"Make Sentences validation errors: {errors}")

        return question

    @staticmethod
    def validate_complete_sentences(question: Dict[str, Any]) -> Dict[str, Any]:
        """Validate Complete Sentences question structure"""
        errors = []

        # Required fields
        if 'instruction' not in question or not question['instruction']:
            errors.append("Missing or empty 'instruction' field")

        if 'sentences' not in question:
            errors.append("Missing 'sentences' field")
        elif not isinstance(question['sentences'], list):
            errors.append("'sentences' must be an array")
        elif not (3 <= len(question['sentences']) <= 5):
            logger.warning(f"'sentences' should have 3-5 items, got {len(question['sentences'])}")

        if 'marks' not in question:
            question['marks'] = len(question.get('sentences', [])) or 4  # Default based on count

        # NOTE: No 'answer' field expected - answers are in instruction word bank

        if errors:
            logger.error(f"Complete Sentences validation errors: {errors}")

        return question

    @staticmethod
    def validate_unseen_creative_writing(question: Dict[str, Any]) -> Dict[str, Any]:
        """Validate Unseen Creative Writing question structure"""
        errors = []

        # Required fields
        if 'instruction' not in question or not question['instruction']:
            errors.append("Missing or empty 'instruction' field")

        if 'prompt' not in question or not question['prompt']:
            errors.append("Missing or empty 'prompt' field")

        if 'answer' not in question or not question['answer']:
            logger.warning("Missing sample 'answer' for creative writing")

        if 'marks' not in question:
            question['marks'] = 5  # Default

        if errors:
            logger.error(f"Unseen Creative Writing validation errors: {errors}")

        return question

    @staticmethod
    def get_question_text(question: Dict[str, Any], question_type: str) -> str:
        """
        Get the main question text from a question object,
        checking the appropriate field based on question type
        """
        primary_field = QuestionValidator.PRIMARY_FIELD_MAP.get(question_type, 'question')

        # Try primary field first
        if primary_field in question and question[primary_field]:
            return question[primary_field]

        # Fallback chain
        for field in ['question', 'statement', 'instruction', 'passage', 'prompt']:
            if field in question and question[field]:
                return question[field]

        # Last resort
        return "[Question content unavailable]"

    @classmethod
    def validate_question(cls, question: Dict[str, Any], question_type: str) -> Dict[str, Any]:
        """
        Validate and normalize a question based on its type
        Returns the validated/normalized question
        """
        try:
            if question_type == 'mcq':
                return cls.validate_mcq(question)
            elif question_type == 'true_false':
                return cls.validate_true_false(question)
            elif question_type == 'fill_in_blanks':
                return cls.validate_fill_in_blanks(question)
            elif question_type == 'circle_correct_answer':
                return cls.validate_mcq(question)  # Same structure as MCQ
            elif question_type == 'match_columns':
                return cls.validate_match_columns(question)
            elif question_type == 'rearrange_sentences':
                return cls.validate_rearrange_sentences(question)
            elif question_type == 'unseen_comprehension_objective':
                return cls.validate_unseen_comprehension(question, 'objective')
            elif question_type == 'unseen_comprehension_subjective':
                return cls.validate_unseen_comprehension(question, 'subjective')
            elif question_type == 'make_sentences':
                return cls.validate_make_sentences(question)
            elif question_type == 'complete_sentences':
                return cls.validate_complete_sentences(question)
            elif question_type == 'unseen_creative_writing':
                return cls.validate_unseen_creative_writing(question)
            elif question_type in ['short_answer', 'long_answer']:
                # Simple validation for answer types
                if 'question' not in question:
                    logger.warning(f"{question_type} missing 'question' field")
                if 'answer' not in question:
                    logger.warning(f"{question_type} missing 'answer' field")
                if 'marks' not in question:
                    question['marks'] = 2 if question_type == 'short_answer' else 5
                return question
            elif question_type in ['word_problems', 'step_by_step']:
                # Math-specific types
                if 'question' not in question:
                    logger.warning(f"{question_type} missing 'question' field")
                if 'answer' not in question:
                    logger.warning(f"{question_type} missing 'answer' field")
                if 'marks' not in question:
                    question['marks'] = 3
                return question
            else:
                logger.warning(f"Unknown question type: {question_type}")
                return question

        except Exception as e:
            logger.error(f"Error validating {question_type} question: {e}")
            return question


def validate_exam_content(exam_content: Dict[str, Any]) -> Dict[str, Any]:
    """
    Validate entire exam content structure
    Ensures all questions match canonical schema
    """
    validated_content = {
        'objective': {},
        'subjective': {}
    }

    # Validate objective questions
    if 'objective' in exam_content:
        for question_type, questions in exam_content['objective'].items():
            if not isinstance(questions, list):
                logger.error(f"Objective {question_type} is not a list")
                continue

            validated_questions = []
            for i, question in enumerate(questions):
                try:
                    validated_q = QuestionValidator.validate_question(question, question_type)
                    validated_questions.append(validated_q)
                except Exception as e:
                    logger.error(f"Error validating objective {question_type} question {i}: {e}")
                    validated_questions.append(question)  # Keep original on error

            validated_content['objective'][question_type] = validated_questions

    # Validate subjective questions
    if 'subjective' in exam_content:
        for question_type, questions in exam_content['subjective'].items():
            if not isinstance(questions, list):
                logger.error(f"Subjective {question_type} is not a list")
                continue

            validated_questions = []
            for i, question in enumerate(questions):
                try:
                    validated_q = QuestionValidator.validate_question(question, question_type)
                    validated_questions.append(validated_q)
                except Exception as e:
                    logger.error(f"Error validating subjective {question_type} question {i}: {e}")
                    validated_questions.append(question)  # Keep original on error

            validated_content['subjective'][question_type] = validated_questions

    return validated_content
