from enum import Enum
from typing import Dict, List, Any

class ProgrammingLanguage(Enum):
    C = "c"
    CPP = "cpp"
    PYTHON = "python"
    JAVA = "java"

class LanguageConfig:
    """Configuration for each programming language"""
    
    def __init__(self, name: str, extension: str, keywords: List[str], 
                 data_types: Dict[str, str], syntax: Dict[str, str]):
        self.name = name
        self.extension = extension
        self.keywords = keywords
        self.data_types = data_types
        self.syntax = syntax

# Language-specific configurations
LANGUAGE_CONFIGS = {
    ProgrammingLanguage.C: LanguageConfig(
        name="C",
        extension=".c",
        keywords=[
            "int", "float", "char", "double", "void", "if", "else", "while", 
            "for", "do", "break", "continue", "return", "switch", "case", 
            "default", "printf", "scanf", "main", "include", "stdio.h"
        ],
        data_types={
            "int": "int",
            "float": "float",
            "string": "char*",
            "boolean": "int",
            "array": "int[]"
        },
        syntax={
            "variable_declaration": "{type} {name}",
            "variable_assignment": "{name} = {value}",
            "print": "printf(\"{format}\", {args})",
            "input": "scanf(\"{format}\", &{variable})",
            "if": "if ({condition})",
            "while": "while ({condition})",
            "for": "for ({init}; {condition}; {increment})",
            "block_start": "{",
            "block_end": "}",
            "statement_end": ";",
            "main_function": "int main()",
            "return": "return 0;"
        }
    ),
    
    ProgrammingLanguage.CPP: LanguageConfig(
        name="C++",
        extension=".cpp",
        keywords=[
            "int", "float", "char", "double", "bool", "string", "void", "if", 
            "else", "while", "for", "do", "break", "continue", "return", 
            "switch", "case", "default", "cout", "cin", "endl", "using", 
            "namespace", "std", "main", "include", "iostream"
        ],
        data_types={
            "int": "int",
            "float": "float",
            "string": "string",
            "boolean": "bool",
            "array": "vector<int>"
        },
        syntax={
            "variable_declaration": "{type} {name}",
            "variable_assignment": "{name} = {value}",
            "print": "cout << {args} << endl",
            "input": "cin >> {variable}",
            "if": "if ({condition})",
            "while": "while ({condition})",
            "for": "for ({init}; {condition}; {increment})",
            "block_start": "{",
            "block_end": "}",
            "statement_end": ";",
            "main_function": "int main()",
            "return": "return 0;"
        }
    ),
    
    ProgrammingLanguage.PYTHON: LanguageConfig(
        name="Python",
        extension=".py",
        keywords=[
            "def", "if", "elif", "else", "while", "for", "in", "break", 
            "continue", "return", "class", "import", "from", "as", "try", 
            "except", "finally", "with", "lambda", "and", "or", "not", 
            "True", "False", "None", "print", "input", "len", "range"
        ],
        data_types={
            "int": "int",
            "float": "float",
            "string": "str",
            "boolean": "bool",
            "array": "list"
        },
        syntax={
            "variable_declaration": "{name}",
            "variable_assignment": "{name} = {value}",
            "print": "print({args})",
            "input": "{variable} = input(\"{prompt}\")",
            "if": "if {condition}:",
            "while": "while {condition}:",
            "for": "for {variable} in range({start}, {end}):",
            "block_start": "",
            "block_end": "",
            "statement_end": "",
            "main_function": "def main():",
            "return": "return"
        }
    ),
    
    ProgrammingLanguage.JAVA: LanguageConfig(
        name="Java",
        extension=".java",
        keywords=[
            "public", "private", "protected", "static", "void", "int", "float", 
            "double", "char", "boolean", "String", "if", "else", "while", 
            "for", "do", "break", "continue", "return", "switch", "case", 
            "default", "class", "main", "System", "out", "println", "Scanner", 
            "nextInt", "nextLine", "import", "java", "util"
        ],
        data_types={
            "int": "int",
            "float": "float",
            "string": "String",
            "boolean": "boolean",
            "array": "int[]"
        },
        syntax={
            "variable_declaration": "{type} {name}",
            "variable_assignment": "{name} = {value}",
            "print": "System.out.println({args})",
            "input": "{variable} = scanner.{method}()",
            "if": "if ({condition})",
            "while": "while ({condition})",
            "for": "for ({init}; {condition}; {increment})",
            "block_start": "{",
            "block_end": "}",
            "statement_end": ";",
            "main_function": "public static void main(String[] args)",
            "return": "return;"
        }
    )
}

def get_language_config(language: ProgrammingLanguage) -> LanguageConfig:
    """Get configuration for a specific programming language"""
    return LANGUAGE_CONFIGS[language]

def get_available_languages() -> List[Dict[str, str]]:
    """Get list of available programming languages"""
    return [
        {"id": lang.value, "name": config.name}
        for lang, config in LANGUAGE_CONFIGS.items()
    ]

def get_language_blocks(language: ProgrammingLanguage) -> List[Dict[str, Any]]:
    """Get available blocks for a specific language"""
    config = get_language_config(language)
    
    blocks = [
        {
            "id": "start",
            "name": "Start",
            "icon": "play",
            "category": "flow",
            "description": "Program starting point"
        },
        {
            "id": "end",
            "name": "End",
            "icon": "stop",
            "category": "flow",
            "description": "Program ending point"
        },
        {
            "id": "variable",
            "name": "Variable",
            "icon": "box",
            "category": "data",
            "description": "Declare a variable",
            "inputs": [
                {"name": "var_name", "type": "text", "placeholder": "Variable name"},
                {"name": "data_type", "type": "select", "options": list(config.data_types.keys())},
                {"name": "initial_value", "type": "text", "placeholder": "Initial value (optional)"}
            ]
        },
        {
            "id": "print",
            "name": "Print",
            "icon": "message-square",
            "category": "io",
            "description": "Display output",
            "inputs": [
                {"name": "text", "type": "text", "placeholder": "Text to print"},
                {"name": "variables", "type": "text", "placeholder": "Variables to print (comma separated)"}
            ]
        },
        {
            "id": "input",
            "name": "Input",
            "icon": "edit",
            "category": "io",
            "description": "Get user input",
            "inputs": [
                {"name": "prompt", "type": "text", "placeholder": "Input prompt"},
                {"name": "variable", "type": "text", "placeholder": "Variable to store input"}
            ]
        },
        {
            "id": "assign",
            "name": "Assign",
            "icon": "equal",
            "category": "data",
            "description": "Assign value to variable",
            "inputs": [
                {"name": "variable", "type": "text", "placeholder": "Variable name"},
                {"name": "expression", "type": "text", "placeholder": "Expression or value"}
            ]
        },
        {
            "id": "if",
            "name": "If",
            "icon": "git-branch",
            "category": "control",
            "description": "Conditional statement",
            "inputs": [
                {"name": "condition", "type": "text", "placeholder": "Condition (e.g., x > 5)"}
            ]
        },
        {
            "id": "while",
            "name": "While",
            "icon": "repeat",
            "category": "control",
            "description": "While loop",
            "inputs": [
                {"name": "condition", "type": "text", "placeholder": "Loop condition"}
            ]
        },
        {
            "id": "for",
            "name": "For",
            "icon": "rotate-cw",
            "category": "control",
            "description": "For loop",
            "inputs": [
                {"name": "init", "type": "text", "placeholder": "Initialization (e.g., i = 0)"},
                {"name": "condition", "type": "text", "placeholder": "Condition (e.g., i < 10)"},
                {"name": "increment", "type": "text", "placeholder": "Increment (e.g., i++)"}
            ]
        }
    ]
    
    return blocks