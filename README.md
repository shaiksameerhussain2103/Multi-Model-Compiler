# Multi-Modal Visual Programming Compiler

A visual programming environment that teaches programming concepts through drag-and-drop blocks, generating code and explanations using AI.

## Setup Instructions

### 1. Clone and Navigate
```bash
cd Multi-Model-Compiler
```

### 2. Create Virtual Environment
Run the setup script:
```bash
setup.bat
```

Or manually:
```bash
python -m venv venv
venv\Scripts\activate
pip install -r requirements.txt
```

### 3. Environment Configuration
The `.env` file is already configured with the API key. Make sure it exists in the project root.

### 4. Run the Application
```bash
venv\Scripts\activate
python app.py
```

## Features

- **Language Selection**: Choose from C, C++, Python, or Java
- **Visual Programming**: Drag and drop blocks to create programs
- **AST Generation**: Converts visual blocks to Abstract Syntax Tree
- **Code Generation**: AI-powered code generation using Gemini API
- **Educational Explanations**: Step-by-step code explanations
- **Syntax Highlighting**: Beautiful code display with syntax highlighting
- **Undo/Redo**: Full editing history support

## Project Structure

```
Multi-Model-Compiler/
├── backend/
│   ├── models/          # Data models and AST definitions
│   ├── services/        # API services and Gemini integration
│   ├── compiler/        # Compiler pipeline components
├── frontend/
│   ├── static/
│   │   ├── css/        # Stylesheets
│   │   ├── js/         # JavaScript for drag-drop functionality
│   │   └── icons/      # Programming block icons
│   └── templates/       # HTML templates
├── requirements.txt     # Python dependencies
├── .env                # Environment variables
├── setup.bat           # Windows setup script
└── app.py              # Main Flask application
```

## Usage

1. Start the application and open http://localhost:5000
2. Select a programming language (C, C++, Python, or Java)
3. Drag blocks from the sidebar to the canvas
4. Connect blocks in logical order (Start → Logic → End)
5. Click "Generate Code" to see the resulting program
6. View the AI-generated explanation to learn programming concepts

## Technologies

- **Backend**: Python, Flask
- **Frontend**: HTML5, CSS3, JavaScript
- **AI Integration**: Google Gemini API
- **Drag & Drop**: HTML5 Drag and Drop API
- **Syntax Highlighting**: Pygments