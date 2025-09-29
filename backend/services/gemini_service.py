import os
import google.generativeai as genai
from typing import Dict, Any, List
import json
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

class GeminiService:
    """Service for integrating with Google Gemini API"""
    
    def __init__(self):
        self.api_key = os.getenv('API_KEY')
        print(f"DEBUG: API_KEY loaded: {self.api_key[:10]}..." if self.api_key else "DEBUG: No API_KEY found")
        if not self.api_key:
            raise ValueError("API_KEY not found in environment variables")
        
        try:
            # Configure the Google Generative AI client
            genai.configure(api_key=self.api_key)
            
            # Default model selection based on task complexity
            self.default_model = "gemini-2.5-flash"     # Balanced model for most tasks
            self.complex_model = "gemini-2.5-pro"      # For complex reasoning
            self.fast_model = "gemini-2.5-flash-lite"  # For simple/fast tasks
            
            # Initialize the model
            self.model = genai.GenerativeModel(self.default_model)
            print("DEBUG: Gemini client initialized successfully")
        except Exception as e:
            print(f"DEBUG: Gemini initialization failed: {e}")
            raise
    
    def generate_code_and_explanation(self, ast_dict: Dict[str, Any], 
                                    language: str) -> Dict[str, str]:
        """
        Generate code and explanation from AST using Gemini API
        
        Args:
            ast_dict: Dictionary representation of the AST
            language: Target programming language
        
        Returns:
            Dictionary containing generated code and explanation
        """
        try:
            # Create a detailed prompt for Gemini
            prompt = self._create_prompt(ast_dict, language)
            
            # Choose model based on complexity
            model_to_use = self.default_model
            if self._is_complex_program(str(ast_dict), language):
                model_to_use = self.complex_model
            
            print(f"DEBUG: Using model: {model_to_use}")
            
            # Create model instance for the specific task
            model = genai.GenerativeModel(model_to_use)
            
            # Generate response from Gemini
            response = model.generate_content(prompt)
            response_text = response.text
            
            # Parse the response
            return self._parse_response(response_text, language)
            
        except Exception as e:
            return {
                "code": f"// Error generating code: {str(e)}",
                "explanation": f"Error: Could not generate explanation due to: {str(e)}",
                "error": str(e)
            }
    
    def _create_prompt(self, ast_dict: Dict[str, Any], language: str) -> str:
        """Create a detailed prompt for Gemini API"""
        
        prompt = f"""
You are an expert programming teacher and compiler. I will provide you with an Abstract Syntax Tree (AST) representation of a visual program, and you need to:

1. Generate EXACT, CORRECT, and COMPLETE {language.upper()} code based on the AST
2. Provide a DETAILED, EDUCATIONAL explanation of the code

TARGET LANGUAGE: {language.upper()}

AST REPRESENTATION:
{json.dumps(ast_dict, indent=2)}

REQUIREMENTS:

1. CODE GENERATION:
   - Generate syntactically correct and complete {language.upper()} code
   - Include all necessary headers/imports
   - Follow proper {language.upper()} conventions and best practices
   - Ensure the code compiles and runs correctly
   - Add appropriate comments in the code

2. EXPLANATION (Be very detailed and educational):
   - Explain EVERY line of code and what it does
   - Describe the meaning and purpose of each keyword used
   - Explain the execution flow step by step
   - Describe variable declarations, assignments, and operations
   - Explain control structures (if, while, for) in detail
   - Make it suitable for beginners with zero programming knowledge
   - Use simple language and provide analogies where helpful

FORMAT YOUR RESPONSE EXACTLY AS FOLLOWS:

===CODE_START===
[Your complete {language.upper()} code here]
===CODE_END===

===EXPLANATION_START===
[Your detailed step-by-step explanation here]
===EXPLANATION_END===

IMPORTANT: 
- Make sure the code is complete and executable
- The explanation should be comprehensive enough for a complete beginner
- Focus on educational value - explain WHY things work the way they do
- Include execution flow and expected output
"""
        
        return prompt
    
    def _parse_response(self, response_text: str, language: str) -> Dict[str, str]:
        """Parse Gemini's response to extract code and explanation"""
        try:
            # Extract code section
            code_start = response_text.find("===CODE_START===")
            code_end = response_text.find("===CODE_END===")
            
            if code_start != -1 and code_end != -1:
                code = response_text[code_start + len("===CODE_START==="):code_end].strip()
            else:
                # Fallback: try to find code blocks
                import re
                code_blocks = re.findall(r'```(?:' + language + r')?\s*(.*?)\s*```', response_text, re.DOTALL | re.IGNORECASE)
                code = code_blocks[0] if code_blocks else response_text
            
            # Extract explanation section
            exp_start = response_text.find("===EXPLANATION_START===")
            exp_end = response_text.find("===EXPLANATION_END===")
            
            if exp_start != -1 and exp_end != -1:
                explanation = response_text[exp_start + len("===EXPLANATION_START==="):exp_end].strip()
            else:
                # Fallback: use everything after code or full response
                explanation = response_text[code_end + len("===CODE_END==="):].strip() if code_end != -1 else response_text
            
            return {
                "code": code,
                "explanation": explanation,
                "language": language
            }
            
        except Exception as e:
            # Fallback parsing
            return {
                "code": response_text,
                "explanation": f"Generated code in {language}. Please review the code above.",
                "language": language,
                "parse_error": str(e)
            }
    
    def _is_complex_program(self, ast_json: str, language: str) -> bool:
        """Determine if a program is complex enough to require the pro model"""
        try:
            # Check for complexity indicators
            complexity_indicators = [
                "class", "struct", "function", "method", "algorithm",
                "database", "api", "network", "multithreading",
                "recursion", "optimization", "data structure"
            ]
            
            # Count AST nodes (rough complexity measure)
            import json
            try:
                ast_data = json.loads(ast_json)
                node_count = len(str(ast_data))  # Simple approximation
                if node_count > 1000:  # Large program
                    return True
            except:
                pass
            
            # Check for complexity keywords
            text_content = ast_json.lower()
            complexity_count = sum(1 for indicator in complexity_indicators if indicator in text_content)
            
            return complexity_count >= 3
        except:
            return False
    
    def test_connection(self) -> bool:
        """Test if the Gemini API connection is working"""
        try:
            response = self.model.generate_content("Say 'Hello, I am working!' in a friendly way.")
            return "Hello" in response.text
        except Exception:
            return False