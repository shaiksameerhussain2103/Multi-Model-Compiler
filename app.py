import json
import os
from datetime import datetime
from flask import Flask, request, jsonify, render_template
from flask_cors import CORS
import os
import sys
import json
from datetime import datetime

# Add the current directory to the Python path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from backend.models import get_available_languages, get_language_blocks, ProgrammingLanguage
from backend.services import CompilerService

app = Flask(__name__, 
           template_folder='frontend/templates',
           static_folder='frontend/static')
CORS(app)

# Initialize services
compiler_service = CompilerService()

@app.route('/')
def home():
    """Home page with service selection"""
    return render_template('home.html')

@app.route('/visual-programming')
def visual_programming():
    """Visual programming interface"""
    return render_template('visual_programming.html')

@app.route('/compiler-design')
def compiler_design():
    """Compiler Design Resources Hub and Learning Tools"""
    return render_template('compiler_design.html')
def visual_programming():
    """Visual programming application page"""
    return render_template('index.html')

@app.route('/api/languages', methods=['GET'])
def get_languages():
    """Get available programming languages"""
    try:
        languages = get_available_languages()
        return jsonify({
            "success": True,
            "languages": languages
        })
    except Exception as e:
        return jsonify({
            "success": False,
            "error": str(e)
        }), 500

@app.route('/api/languages/<language_id>/blocks', methods=['GET'])
def get_language_specific_blocks(language_id):
    """Get blocks available for a specific language"""
    try:
        if language_id not in [lang.value for lang in ProgrammingLanguage]:
            return jsonify({
                "success": False,
                "error": "Invalid language ID"
            }), 400
        
        language = ProgrammingLanguage(language_id)
        blocks = get_language_blocks(language)
        
        return jsonify({
            "success": True,
            "language": language_id,
            "blocks": blocks
        })
    except Exception as e:
        return jsonify({
            "success": False,
            "error": str(e)
        }), 500

@app.route('/api/compile', methods=['POST'])
def compile_program():
    """Compile visual program to code"""
    try:
        data = request.get_json()
        
        if not data:
            return jsonify({
                "success": False,
                "error": "No data provided"
            }), 400
        
        blocks = data.get('blocks', [])
        connections = data.get('connections', [])
        language = data.get('language', 'python')
        
        if not blocks:
            return jsonify({
                "success": False,
                "error": "No blocks provided"
            }), 400
        
        # Compile the program
        result = compiler_service.compile_visual_program(blocks, connections, language)
        
        return jsonify(result)
        
    except Exception as e:
        return jsonify({
            "success": False,
            "error": f"Compilation failed: {str(e)}",
            "stage": "api"
        }), 500

@app.route('/api/validate', methods=['POST'])
def validate_program():
    """Validate visual program structure"""
    try:
        data = request.get_json()
        
        blocks = data.get('blocks', [])
        connections = data.get('connections', [])
        
        # Basic validation - more flexible approach
        start_blocks = [b for b in blocks if b.get('type') == 'start']
        end_blocks = [b for b in blocks if b.get('type') == 'end']
        
        errors = []
        warnings = []
        
        # Check for multiple start/end blocks
        if len(start_blocks) > 1:
            errors.append("Program can only have one Start block")
        
        if len(end_blocks) > 1:
            errors.append("Program can only have one End block")
        
        # Check if program has any blocks
        if len(blocks) == 0:
            errors.append("Program must have at least one block")
        
        # Warnings for missing start/end blocks (not errors)
        if len(start_blocks) == 0:
            warnings.append("Consider adding a Start block to clearly mark the beginning")
        
        if len(end_blocks) == 0:
            warnings.append("Consider adding an End block to clearly mark the end")
        
        # Check for blocks with missing properties
        for block in blocks:
            if not block.get('type'):
                errors.append("Found block without type")
            if not block.get('id'):
                errors.append("Found block without ID")
        
        return jsonify({
            "success": len(errors) == 0,
            "isValid": len(errors) == 0,
            "errors": errors,
            "warnings": warnings,
            "block_count": len(blocks),
            "connection_count": len(connections)
        })
        
    except Exception as e:
        return jsonify({
            "success": False,
            "error": str(e)
        }), 500

@app.route('/api/status', methods=['GET'])
def api_status():
    """Check API and service status"""
    try:
        # Test Gemini connection
        gemini_connected = compiler_service.gemini_service.test_connection()
        
        return jsonify({
            "status": "connected" if gemini_connected else "disconnected",
            "gemini_api": gemini_connected,
            "timestamp": datetime.now().isoformat()
        })
        
    except Exception as e:
        return jsonify({
            "status": "disconnected",
            "gemini_api": False,
            "error": str(e),
            "timestamp": datetime.now().isoformat()
        }), 500

@app.route('/api/test', methods=['GET'])
def test_api():
    """Test API connectivity"""
    try:
        # Test Gemini connection
        gemini_test = compiler_service.gemini_service.test_connection()
        
        return jsonify({
            "success": True,
            "message": "API is working",
            "gemini_connected": gemini_test,
            "available_languages": len(get_available_languages())
        })
        
    except Exception as e:
        return jsonify({
            "success": False,
            "error": str(e)
        }), 500

@app.route('/api/example', methods=['GET'])
def get_example_program():
    """Get an example program for testing"""
    example_program = {
        "blocks": [
            {
                "id": "start_1",
                "type": "start",
                "x": 100,
                "y": 100,
                "properties": {}
            },
            {
                "id": "var_1",
                "type": "variable",
                "x": 100,
                "y": 200,
                "properties": {
                    "var_name": "name",
                    "data_type": "string",
                    "initial_value": ""
                }
            },
            {
                "id": "input_1",
                "type": "input",
                "x": 100,
                "y": 300,
                "properties": {
                    "prompt": "Enter your name: ",
                    "variable": "name"
                }
            },
            {
                "id": "print_1",
                "type": "print",
                "x": 100,
                "y": 400,
                "properties": {
                    "text": "Hello, ",
                    "variables": "name"
                }
            },
            {
                "id": "end_1",
                "type": "end",
                "x": 100,
                "y": 500,
                "properties": {}
            }
        ],
        "connections": [
            {"from": "start_1", "to": "var_1"},
            {"from": "var_1", "to": "input_1"},
            {"from": "input_1", "to": "print_1"},
            {"from": "print_1", "to": "end_1"}
        ],
        "language": "python"
    }
    
    return jsonify({
        "success": True,
        "example": example_program
    })

@app.route('/api/canvas/save', methods=['POST'])
def save_canvas_state():
    """Save canvas state to JSON file"""
    try:
        data = request.get_json()
        if not data:
            return jsonify({
                "success": False,
                "error": "No data provided"
            }), 400
        
        # Create sessions directory if it doesn't exist
        sessions_dir = os.path.join(os.path.dirname(__file__), 'sessions')
        os.makedirs(sessions_dir, exist_ok=True)
        
        # Generate session ID or use provided one
        session_id = data.get('session_id', f"session_{int(datetime.now().timestamp())}")
        
        # Save state to file
        canvas_state = {
            "session_id": session_id,
            "timestamp": datetime.now().isoformat(),
            "blocks": data.get('blocks', []),
            "connections": data.get('connections', []),
            "zoom": data.get('zoom', 1),
            "panX": data.get('panX', 0),
            "panY": data.get('panY', 0),
            "language": data.get('language', 'python')
        }
        
        file_path = os.path.join(sessions_dir, f"{session_id}.json")
        with open(file_path, 'w', encoding='utf-8') as f:
            json.dump(canvas_state, f, indent=2, ensure_ascii=False)
        
        return jsonify({
            "success": True,
            "session_id": session_id,
            "message": "Canvas state saved successfully"
        })
        
    except Exception as e:
        return jsonify({
            "success": False,
            "error": str(e)
        }), 500

@app.route('/api/canvas/load/<session_id>', methods=['GET'])
def load_canvas_state(session_id):
    """Load canvas state from JSON file"""
    try:
        sessions_dir = os.path.join(os.path.dirname(__file__), 'sessions')
        file_path = os.path.join(sessions_dir, f"{session_id}.json")
        
        if not os.path.exists(file_path):
            return jsonify({
                "success": False,
                "error": "Session not found"
            }), 404
        
        with open(file_path, 'r', encoding='utf-8') as f:
            canvas_state = json.load(f)
        
        return jsonify({
            "success": True,
            "canvas_state": canvas_state
        })
        
    except Exception as e:
        return jsonify({
            "success": False,
            "error": str(e)
        }), 500

@app.route('/api/canvas/load', methods=['GET'])
def load_latest_canvas_state():
    """Load the most recent canvas state"""
    try:
        sessions_dir = os.path.join(os.path.dirname(__file__), 'sessions')
        
        if not os.path.exists(sessions_dir):
            return jsonify({
                "success": False,
                "message": "No saved sessions found"
            })
        
        # Find the most recent session file
        session_files = [f for f in os.listdir(sessions_dir) if f.endswith('.json')]
        if not session_files:
            return jsonify({
                "success": False,
                "message": "No saved sessions found"
            })
        
        # Get the most recent file
        latest_file = max(session_files, key=lambda f: os.path.getmtime(os.path.join(sessions_dir, f)))
        file_path = os.path.join(sessions_dir, latest_file)
        
        with open(file_path, 'r', encoding='utf-8') as f:
            canvas_state = json.load(f)
        
        return jsonify({
            "success": True,
            "canvas_state": canvas_state
        })
        
    except Exception as e:
        return jsonify({
            "success": False,
            "error": str(e)
        }), 500

# Compiler Design Module APIs
@app.route('/api/compiler-design/resources', methods=['GET'])
def get_compiler_resources():
    """Get compiler design learning resources"""
    try:
        # Load resources from JSON file
        resources_file = os.path.join(os.path.dirname(__file__), 'backend', 'data', 'compiler_resources.json')
        
        with open(resources_file, 'r', encoding='utf-8') as f:
            resources = json.load(f)
        
        return jsonify({
            "success": True,
            "resources": resources
        })
        
    except FileNotFoundError:
        return jsonify({
            "success": False,
            "error": "Resources file not found"
        }), 404
        
    except Exception as e:
        return jsonify({
            "success": False,
            "error": str(e)
        }), 500

@app.route('/api/compiler-design/qa', methods=['POST'])
def compiler_qa():
    """Answer compiler design questions using Gemini API"""
    try:
        data = request.get_json()
        if not data or 'question' not in data:
            return jsonify({
                "success": False,
                "error": "Question is required"
            }), 400
            
        question = data['question'].strip()
        if not question:
            return jsonify({
                "success": False,
                "error": "Question cannot be empty"
            }), 400
        
        # Create system prompt for compiler design Q&A
        system_prompt = """You are an expert Compiler Design tutor and professor. Your role is to help students understand compiler concepts clearly and thoroughly.

Guidelines for your responses:
1. Provide clear, educational explanations suitable for computer science students
2. Break down complex concepts into digestible parts
3. Include relevant examples, code snippets, or diagrams when helpful
4. Reference standard compiler design terminology and phases
5. For technical questions, provide both theoretical explanation and practical examples
6. If the question is about implementation, provide pseudocode or algorithm steps
7. Always maintain academic rigor while being accessible to students

Topics you should be expert in:
- Lexical Analysis (Tokenization, Regular Expressions, Finite Automata)
- Syntax Analysis (Parsing, CFG, Top-down/Bottom-up parsing, LR, LALR)
- Semantic Analysis (Symbol Tables, Type Checking, Scope Resolution)
- Intermediate Code Generation (Three-address code, AST, IR)
- Code Optimization (Local, Global, Peephole optimization)
- Code Generation (Target code, Register allocation)
- Error Handling and Recovery
- Compiler Tools (Lex, Yacc, ANTLR)

Format your response with:
- Clear section headers when appropriate
- Code examples in proper syntax highlighting format
- Step-by-step explanations for algorithms
- References to standard compiler design literature when relevant

Remember: You're helping students learn, so be patient, thorough, and encouraging."""

        user_prompt = f"Student Question: {question}\n\nPlease provide a comprehensive explanation that helps the student understand this compiler design concept."
        
        # Get response from Gemini
        response = compiler_service.generate_explanation(
            question, 
            system_prompt=system_prompt,
            user_prompt=user_prompt
        )
        
        return jsonify({
            "success": True,
            "question": question,
            "answer": response,
            "timestamp": datetime.now().isoformat()
        })
        
    except Exception as e:
        return jsonify({
            "success": False,
            "error": str(e)
        }), 500

@app.route('/api/compiler-design/analyze', methods=['POST'])
def analyze_code():
    """Perform lexical and syntax analysis on code snippets"""
    try:
        print("=== ANALYZE CODE API DEBUG START ===")
        data = request.get_json()
        print(f"Received data: {data}")
        
        if not data or 'code' not in data:
            print("ERROR: No code in request data")
            return jsonify({
                "success": False,
                "error": "Code is required"
            }), 400
            
        code = data.get('code', '').strip()
        print(f"Code to analyze: {repr(code)}")
        
        if not code:
            print("ERROR: Code is empty")
            return jsonify({
                "success": False,
                "error": "Code cannot be empty"
            }), 400
            
        analysis_type = data.get('analysis_type', 'lexical')  # lexical, syntax, or both
        print(f"Analysis type: {analysis_type}")
        
        # Create system prompt for code analysis
        system_prompt = """You are a compiler analysis tool that performs lexical and syntax analysis on code snippets.

For LEXICAL ANALYSIS:
- Identify and classify all tokens (keywords, identifiers, operators, literals, delimiters)
- Provide token type and lexeme for each token
- Handle whitespace and comments appropriately
- Identify any lexical errors

For SYNTAX ANALYSIS:
- Generate parse tree or AST representation
- Identify grammar productions used
- Show derivation steps for simple expressions
- Identify any syntax errors
- Explain the parsing process

Output format should be structured JSON with:
- tokens: array of {type, lexeme, position} for lexical analysis
- parse_tree: hierarchical structure for syntax analysis
- errors: array of any errors found
- explanation: human-readable explanation of the analysis

Be educational and explain each step of the analysis process."""

        user_prompt = f"""Analyze this code snippet:

```
{code}
```

Analysis type requested: {analysis_type}

Please provide a detailed {analysis_type} analysis with educational explanations."""
        
        print("Calling generate_explanation...")
        # Get analysis from Gemini
        response = compiler_service.generate_explanation(
            code,
            system_prompt=system_prompt,
            user_prompt=user_prompt
        )
        
        print(f"Generated response length: {len(response) if response else 0}")
        print(f"Response preview: {response[:100] if response else 'None'}...")
        
        result = {
            "success": True,
            "code": code,
            "analysis_type": analysis_type,
            "analysis": response,
            "timestamp": datetime.now().isoformat()
        }
        
        print("=== ANALYZE CODE API DEBUG END ===")
        return jsonify(result)
        
    except Exception as e:
        print(f"EXCEPTION in analyze_code: {e}")
        import traceback
        traceback.print_exc()
        return jsonify({
            "success": False,
            "error": f"Server error: {str(e)}"
        }), 500

if __name__ == '__main__':
    # Check if running in development mode
    debug_mode = os.getenv('FLASK_ENV') == 'development' or '--debug' in sys.argv
    
    print("🚀 Starting Multi-Modal Visual Programming Compiler")
    print(f"🌐 Access the application at: http://localhost:5000")
    print(f"🔧 Debug mode: {'ON' if debug_mode else 'OFF'}")
    
    app.run(host='0.0.0.0', port=5000, debug=debug_mode)