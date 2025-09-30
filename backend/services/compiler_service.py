from typing import Dict, Any, List, Tuple
from ..models import AST, BlockFactory, ProgrammingLanguage, get_language_config
from .gemini_service import GeminiService

class CompilerService:
    """Service for compiling visual programs into code"""
    
    def __init__(self):
        self.gemini_service = GeminiService()
    
    def compile_visual_program(self, blocks_data: List[Dict[str, Any]], 
                             connections: List[Dict[str, str]], 
                             language: str) -> Dict[str, Any]:
        """
        Compile a visual program into code and explanation
        
        Args:
            blocks_data: List of block definitions with positions and properties
            connections: List of connections between blocks
            language: Target programming language
        
        Returns:
            Dictionary containing compilation results
        """
        try:
            # Step 1: Build AST from visual blocks
            ast = self._build_ast_from_blocks(blocks_data, connections)
            
            # Step 2: Validate AST
            validation_errors = ast.validate()
            warnings = ast.get_warnings()
            
            if validation_errors:
                return {
                    "success": False,
                    "errors": validation_errors,
                    "warnings": warnings,
                    "stage": "validation"
                }
            
            # Step 3: Perform semantic analysis
            semantic_errors = self._perform_semantic_analysis(ast, language)
            if semantic_errors:
                return {
                    "success": False,
                    "errors": semantic_errors,
                    "stage": "semantic_analysis"
                }
            
            # Step 4: Convert AST to dictionary for Gemini
            ast_dict = ast.to_dict()
            
            # Step 5: Generate code using Gemini API
            generation_result = self.gemini_service.generate_code_and_explanation(
                ast_dict, language
            )
            
            if "error" in generation_result:
                return {
                    "success": False,
                    "errors": [generation_result["error"]],
                    "stage": "code_generation"
                }
            
            return {
                "success": True,
                "code": generation_result["code"],
                "explanation": generation_result["explanation"],
                "language": language,
                "ast": ast_dict,
                "warnings": warnings
            }
            
        except Exception as e:
            return {
                "success": False,
                "errors": [f"Compilation error: {str(e)}"],
                "stage": "compilation"
            }
    
    def _build_ast_from_blocks(self, blocks_data: List[Dict[str, Any]], 
                              connections: List[Dict[str, str]]) -> AST:
        """Build AST from visual blocks data"""
        ast = AST()
        
        # Create nodes from blocks
        for block_data in blocks_data:
            position = {"x": block_data.get("x", 0), "y": block_data.get("y", 0)}
            properties = block_data.get("properties", {})
            
            node = BlockFactory.create_node(
                block_type=block_data["type"],
                position=position,
                properties=properties
            )
            
            if node:
                ast.add_node(node)
        
        # Create connections
        for connection in connections:
            ast.connect_nodes(connection["from"], connection["to"])
        
        return ast
    
    def _perform_semantic_analysis(self, ast: AST, language: str) -> List[str]:
        """Perform semantic analysis on the AST"""
        errors = []
        
        try:
            # Get language configuration
            lang_enum = ProgrammingLanguage(language.lower())
            config = get_language_config(lang_enum)
            
            # Check if we have any nodes at all
            if len(ast.nodes) == 0:
                errors.append("Program must have at least one block")
                return errors
            
            # Start and End blocks are optional - just warn if missing
            # (We'll let Gemini handle code structure)
            
            # Variable tracking for semantic analysis
            declared_variables = set()
            
            # Analyze each node
            for node in ast.nodes.values():
                node_errors = self._analyze_node_semantics(node, declared_variables, config)
                errors.extend(node_errors)
            
        except ValueError:
            errors.append(f"Unsupported language: {language}")
        except Exception as e:
            errors.append(f"Semantic analysis error: {str(e)}")
        
        return errors
    
    def _analyze_node_semantics(self, node, declared_variables: set, config) -> List[str]:
        """Analyze semantic correctness of a single node"""
        errors = []
        
        try:
            from ..models import VariableNode, InputNode, AssignNode, PrintNode
            
            if isinstance(node, VariableNode):
                var_name = node.properties.get("var_name")
                if var_name:
                    if var_name in declared_variables:
                        errors.append(f"Variable '{var_name}' is already declared")
                    else:
                        declared_variables.add(var_name)
                        
            elif isinstance(node, (InputNode, AssignNode)):
                var_name = node.properties.get("variable")
                if var_name and var_name not in declared_variables:
                    # For input/assignment, we can auto-declare variables
                    declared_variables.add(var_name)
                    
            elif isinstance(node, PrintNode):
                # Check if printed variables are declared
                variables = node.properties.get("variables", [])
                for var in variables:
                    if var and var not in declared_variables:
                        errors.append(f"Variable '{var}' used in print but not declared")
        
        except Exception as e:
            errors.append(f"Error analyzing node {node.id}: {str(e)}")
        
        return errors
    
    def get_intermediate_representation(self, ast: AST) -> Dict[str, Any]:
        """Generate intermediate representation of the AST"""
        try:
            ir = {
                "nodes": [],
                "control_flow": [],
                "data_flow": []
            }
            
            # Convert nodes to IR
            for node in ast.nodes.values():
                ir_node = {
                    "id": node.id,
                    "type": node.type.value,
                    "properties": node.properties,
                    "connections": [conn.id for conn in node.connections]
                }
                ir["nodes"].append(ir_node)
            
            return ir
            
        except Exception as e:
            return {"error": f"IR generation failed: {str(e)}"}
    
    def test_compilation_pipeline(self) -> Dict[str, Any]:
        """Test the compilation pipeline with a simple program"""
        try:
            # Create a simple test program
            test_blocks = [
                {
                    "type": "start",
                    "x": 100,
                    "y": 100,
                    "properties": {}
                },
                {
                    "type": "print",
                    "x": 100,
                    "y": 200,
                    "properties": {
                        "text": "Hello, World!"
                    }
                },
                {
                    "type": "end",
                    "x": 100,
                    "y": 300,
                    "properties": {}
                }
            ]
            
            test_connections = []  # No connections needed for this simple test
            
            result = self.compile_visual_program(test_blocks, test_connections, "python")
            return result
            
        except Exception as e:
            return {
                "success": False,
                "error": f"Test failed: {str(e)}"
            }
    
    def generate_explanation(self, question: str, system_prompt: str = "", user_prompt: str = "") -> str:
        """
        Generate explanation for compiler design questions using Gemini API
        
        Args:
            question: The question to answer
            system_prompt: System prompt for context
            user_prompt: User prompt for specific formatting
        
        Returns:
            Generated explanation as string
        """
        try:
            # Use the provided prompts or create a default one
            if not user_prompt:
                user_prompt = f"Please explain this compiler design concept: {question}"
            
            # Create the full prompt
            full_prompt = f"{system_prompt}\n\n{user_prompt}" if system_prompt else user_prompt
            
            # Generate response using Gemini
            response = self.gemini_service.model.generate_content(full_prompt)
            
            if response and response.text:
                return response.text
            else:
                return "I apologize, but I couldn't generate an explanation for your question. Please try rephrasing your question."
                
        except Exception as e:
            print(f"Error generating explanation: {e}")
            return f"I encountered an error while generating the explanation: {str(e)}. Please try again."