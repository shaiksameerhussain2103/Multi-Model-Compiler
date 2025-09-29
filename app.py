from flask import Flask, render_template, request, jsonify
from flask_cors import CORS
import os
import sys

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
def index():
    """Main application page"""
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

if __name__ == '__main__':
    # Check if running in development mode
    debug_mode = os.getenv('FLASK_ENV') == 'development' or '--debug' in sys.argv
    
    print("🚀 Starting Multi-Modal Visual Programming Compiler")
    print(f"🌐 Access the application at: http://localhost:5000")
    print(f"🔧 Debug mode: {'ON' if debug_mode else 'OFF'}")
    
    app.run(host='0.0.0.0', port=5000, debug=debug_mode)