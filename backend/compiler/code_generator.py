from typing import Dict, List, Any
from ..models import AST, ASTNode, StartNode, EndNode, VariableNode, PrintNode, IfNode, WhileNode, ForNode, InputNode, AssignNode
from ..models import ProgrammingLanguage, get_language_config

class CodeGenerator:
    """Generate code from AST for different programming languages"""
    
    def __init__(self, language: ProgrammingLanguage):
        self.language = language
        self.config = get_language_config(language)
        self.code_lines = []
        self.indent_level = 0
        self.declared_variables = set()
    
    def generate(self, ast: AST) -> str:
        """Generate code from AST"""
        self.code_lines = []
        self.indent_level = 0
        self.declared_variables = set()
        
        # Add language-specific headers
        self._add_headers()
        
        # Start with main function if needed
        if self.language in [ProgrammingLanguage.C, ProgrammingLanguage.CPP, ProgrammingLanguage.JAVA]:
            self._start_main_function()
        
        # Process the AST nodes in execution order
        self._process_execution_flow(ast)
        
        # End main function and add footers
        if self.language in [ProgrammingLanguage.C, ProgrammingLanguage.CPP, ProgrammingLanguage.JAVA]:
            self._end_main_function()
        
        return '\n'.join(self.code_lines)
    
    def _add_headers(self):
        """Add language-specific headers/imports"""
        if self.language == ProgrammingLanguage.C:
            self.code_lines.extend([
                '#include <stdio.h>',
                '#include <stdlib.h>',
                ''
            ])
        elif self.language == ProgrammingLanguage.CPP:
            self.code_lines.extend([
                '#include <iostream>',
                '#include <string>',
                '#include <vector>',
                'using namespace std;',
                ''
            ])
        elif self.language == ProgrammingLanguage.JAVA:
            self.code_lines.extend([
                'import java.util.Scanner;',
                '',
                'public class VisualProgram {',
            ])
            self.indent_level += 1
        elif self.language == ProgrammingLanguage.PYTHON:
            self.code_lines.extend([
                '# Visual Programming Compiler Generated Code',
                '# Generated for Python',
                ''
            ])
    
    def _start_main_function(self):
        """Start the main function"""
        if self.language == ProgrammingLanguage.JAVA:
            self._add_line('public static void main(String[] args) {')
            self._add_line('Scanner scanner = new Scanner(System.in);')
        else:
            self._add_line('int main() {')
        self.indent_level += 1
    
    def _end_main_function(self):
        """End the main function"""
        if self.language == ProgrammingLanguage.JAVA:
            self._add_line('scanner.close();')
        
        if self.language in [ProgrammingLanguage.C, ProgrammingLanguage.CPP]:
            self._add_line('return 0;')
        
        self.indent_level -= 1
        self._add_line('}')
        
        if self.language == ProgrammingLanguage.JAVA:
            self.indent_level -= 1
            self._add_line('}')  # End class
    
    def _process_execution_flow(self, ast: AST):
        """Process nodes in execution order"""
        if not ast.start_node:
            return
        
        visited = set()
        self._process_node(ast.start_node, ast, visited)
    
    def _process_node(self, node: ASTNode, ast: AST, visited: set):
        """Process a single node and its connections"""
        if node.id in visited:
            return
        
        visited.add(node.id)
        
        # Generate code for current node
        if isinstance(node, StartNode):
            self._add_line('// Program Start')
        elif isinstance(node, EndNode):
            self._add_line('// Program End')
            return
        elif isinstance(node, VariableNode):
            self._generate_variable_declaration(node)
        elif isinstance(node, PrintNode):
            self._generate_print_statement(node)
        elif isinstance(node, InputNode):
            self._generate_input_statement(node)
        elif isinstance(node, AssignNode):
            self._generate_assignment(node)
        elif isinstance(node, IfNode):
            self._generate_if_statement(node, ast, visited)
            return  # If statement handles its own flow
        elif isinstance(node, WhileNode):
            self._generate_while_loop(node, ast, visited)
            return  # While loop handles its own flow
        elif isinstance(node, ForNode):
            self._generate_for_loop(node, ast, visited)
            return  # For loop handles its own flow
        
        # Process connected nodes
        for connected_node in node.connections:
            self._process_node(connected_node, ast, visited)
    
    def _generate_variable_declaration(self, node: VariableNode):
        """Generate variable declaration"""
        var_name = node.properties.get('var_name', 'variable')
        data_type = node.properties.get('data_type', 'int')
        initial_value = node.properties.get('initial_value', '')
        
        # Map data type to language-specific type
        lang_type = self.config.data_types.get(data_type, 'int')
        
        if self.language == ProgrammingLanguage.PYTHON:
            if initial_value:
                self._add_line(f'{var_name} = {self._format_value(initial_value, data_type)}')
            else:
                # Python doesn't require explicit declaration
                self._add_line(f'# Variable: {var_name} ({data_type})')
        else:
            if initial_value:
                self._add_line(f'{lang_type} {var_name} = {self._format_value(initial_value, data_type)};')
            else:
                self._add_line(f'{lang_type} {var_name};')
        
        self.declared_variables.add(var_name)
    
    def _generate_print_statement(self, node: PrintNode):
        """Generate print statement"""
        text = node.properties.get('text', '')
        variables = node.properties.get('variables', [])
        
        if self.language == ProgrammingLanguage.PYTHON:
            output_parts = []
            if text:
                output_parts.append(f'"{text}"')
            if variables:
                output_parts.extend(variables)
            
            if output_parts:
                self._add_line(f'print({", ".join(output_parts)})')
            
        elif self.language == ProgrammingLanguage.C:
            if text and variables:
                var_placeholders = ['%d' if var in self.declared_variables else '%s' for var in variables]
                format_str = text + ' '.join(var_placeholders)
                self._add_line(f'printf("{format_str}\\n", {", ".join(variables)});')
            elif text:
                self._add_line(f'printf("{text}\\n");')
            elif variables:
                placeholders = ['%d' for _ in variables]  # Assume int for simplicity
                self._add_line(f'printf("{" ".join(placeholders)}\\n", {", ".join(variables)});')
                
        elif self.language == ProgrammingLanguage.CPP:
            output_parts = []
            if text:
                output_parts.append(f'"{text}"')
            if variables:
                output_parts.extend(variables)
            
            if output_parts:
                self._add_line(f'cout << {" << \" \" << ".join(output_parts)} << endl;')
                
        elif self.language == ProgrammingLanguage.JAVA:
            output_parts = []
            if text:
                output_parts.append(f'"{text}"')
            if variables:
                output_parts.extend(variables)
            
            if output_parts:
                self._add_line(f'System.out.println({" + \" \" + ".join(output_parts)});')
    
    def _generate_input_statement(self, node: InputNode):
        """Generate input statement"""
        prompt = node.properties.get('prompt', '')
        variable = node.properties.get('variable', 'input_var')
        
        if self.language == ProgrammingLanguage.PYTHON:
            if prompt:
                self._add_line(f'{variable} = input("{prompt}")')
            else:
                self._add_line(f'{variable} = input()')
                
        elif self.language == ProgrammingLanguage.C:
            if prompt:
                self._add_line(f'printf("{prompt}");')
            self._add_line(f'scanf("%d", &{variable});')
            
        elif self.language == ProgrammingLanguage.CPP:
            if prompt:
                self._add_line(f'cout << "{prompt}";')
            self._add_line(f'cin >> {variable};')
            
        elif self.language == ProgrammingLanguage.JAVA:
            if prompt:
                self._add_line(f'System.out.print("{prompt}");')
            self._add_line(f'int {variable} = scanner.nextInt();')
        
        self.declared_variables.add(variable)
    
    def _generate_assignment(self, node: AssignNode):
        """Generate assignment statement"""
        variable = node.properties.get('variable', 'var')
        expression = node.properties.get('expression', '0')
        
        if self.language == ProgrammingLanguage.PYTHON:
            self._add_line(f'{variable} = {expression}')
        else:
            self._add_line(f'{variable} = {expression};')
        
        self.declared_variables.add(variable)
    
    def _generate_if_statement(self, node: IfNode, ast: AST, visited: set):
        """Generate if statement with body"""
        condition = node.properties.get('condition', 'true')
        
        if self.language == ProgrammingLanguage.PYTHON:
            self._add_line(f'if {condition}:')
        else:
            self._add_line(f'if ({condition}) {{')
        
        self.indent_level += 1
        
        # Process true branch (connected nodes)
        for connected_node in node.connections:
            self._process_node(connected_node, ast, visited)
        
        self.indent_level -= 1
        
        if self.language != ProgrammingLanguage.PYTHON:
            self._add_line('}')
    
    def _generate_while_loop(self, node: WhileNode, ast: AST, visited: set):
        """Generate while loop with body"""
        condition = node.properties.get('condition', 'true')
        
        if self.language == ProgrammingLanguage.PYTHON:
            self._add_line(f'while {condition}:')
        else:
            self._add_line(f'while ({condition}) {{')
        
        self.indent_level += 1
        
        # Process loop body (connected nodes)
        for connected_node in node.connections:
            self._process_node(connected_node, ast, visited)
        
        self.indent_level -= 1
        
        if self.language != ProgrammingLanguage.PYTHON:
            self._add_line('}')
    
    def _generate_for_loop(self, node: ForNode, ast: AST, visited: set):
        """Generate for loop with body"""
        init = node.properties.get('init', 'i = 0')
        condition = node.properties.get('condition', 'i < 10')
        increment = node.properties.get('increment', 'i++')
        
        if self.language == ProgrammingLanguage.PYTHON:
            # Convert C-style for loop to Python range
            # This is a simplified conversion
            self._add_line(f'for i in range(10):  # {init}; {condition}; {increment}')
        else:
            self._add_line(f'for ({init}; {condition}; {increment}) {{')
        
        self.indent_level += 1
        
        # Process loop body (connected nodes)
        for connected_node in node.connections:
            self._process_node(connected_node, ast, visited)
        
        self.indent_level -= 1
        
        if self.language != ProgrammingLanguage.PYTHON:
            self._add_line('}')
    
    def _format_value(self, value: str, data_type: str) -> str:
        """Format value based on data type"""
        if data_type == 'string':
            if not value.startswith('"'):
                return f'"{value}"'
        elif data_type == 'boolean':
            if self.language == ProgrammingLanguage.PYTHON:
                return 'True' if value.lower() in ['true', '1'] else 'False'
            elif self.language == ProgrammingLanguage.JAVA:
                return 'true' if value.lower() in ['true', '1'] else 'false'
            else:
                return '1' if value.lower() in ['true', '1'] else '0'
        
        return value
    
    def _add_line(self, line: str):
        """Add a line with proper indentation"""
        if self.language == ProgrammingLanguage.PYTHON:
            indent = '    ' * self.indent_level
        else:
            indent = '    ' * self.indent_level
        
        self.code_lines.append(f'{indent}{line}' if line.strip() else '')