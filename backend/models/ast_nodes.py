from abc import ABC, abstractmethod
from typing import List, Dict, Any, Optional
from enum import Enum
import uuid

class BlockType(Enum):
    START = "start"
    END = "end"
    VARIABLE = "variable"
    PRINT = "print"
    IF = "if"
    WHILE = "while"
    FOR = "for"
    INPUT = "input"
    ASSIGN = "assign"
    MATH = "math"
    COMPARE = "compare"
    LOGICAL = "logical"

class DataType(Enum):
    INTEGER = "int"
    FLOAT = "float"
    STRING = "string"
    BOOLEAN = "boolean"
    ARRAY = "array"

class ASTNode(ABC):
    """Base class for all AST nodes"""
    
    def __init__(self, node_type: BlockType, position: Dict[str, int]):
        self.id = str(uuid.uuid4())
        self.type = node_type
        self.position = position  # x, y coordinates on canvas
        self.connections: List['ASTNode'] = []
        self.properties: Dict[str, Any] = {}
    
    @abstractmethod
    def validate(self) -> List[str]:
        """Validate the node and return list of errors"""
        pass
    
    @abstractmethod
    def to_dict(self) -> Dict[str, Any]:
        """Convert node to dictionary representation"""
        pass

class StartNode(ASTNode):
    def __init__(self, position: Dict[str, int]):
        super().__init__(BlockType.START, position)
    
    def validate(self) -> List[str]:
        errors = []
        # Allow Start node without connections for simple programs
        # This enables testing and simple program flows
        return errors
    
    def to_dict(self) -> Dict[str, Any]:
        return {
            "id": self.id,
            "type": self.type.value,
            "position": self.position,
            "connections": [conn.id for conn in self.connections]
        }

class EndNode(ASTNode):
    def __init__(self, position: Dict[str, int]):
        super().__init__(BlockType.END, position)
    
    def validate(self) -> List[str]:
        # End node doesn't need outgoing connections
        return []
    
    def to_dict(self) -> Dict[str, Any]:
        return {
            "id": self.id,
            "type": self.type.value,
            "position": self.position
        }

class VariableNode(ASTNode):
    def __init__(self, position: Dict[str, int], var_name: str = "", 
                 data_type: DataType = DataType.INTEGER, initial_value: str = ""):
        super().__init__(BlockType.VARIABLE, position)
        self.properties = {
            "var_name": var_name,
            "data_type": data_type.value,
            "initial_value": initial_value
        }
    
    def validate(self) -> List[str]:
        errors = []
        if not self.properties.get("var_name"):
            errors.append("Variable name is required")
        return errors
    
    def to_dict(self) -> Dict[str, Any]:
        return {
            "id": self.id,
            "type": self.type.value,
            "position": self.position,
            "properties": self.properties,
            "connections": [conn.id for conn in self.connections]
        }

class PrintNode(ASTNode):
    def __init__(self, position: Dict[str, int], text: str = "", variables: List[str] = None):
        super().__init__(BlockType.PRINT, position)
        self.properties = {
            "text": text,
            "variables": variables or []
        }
    
    def validate(self) -> List[str]:
        errors = []
        if not self.properties.get("text") and not self.properties.get("variables"):
            errors.append("Print statement must have text or variables")
        return errors
    
    def to_dict(self) -> Dict[str, Any]:
        return {
            "id": self.id,
            "type": self.type.value,
            "position": self.position,
            "properties": self.properties,
            "connections": [conn.id for conn in self.connections]
        }

class IfNode(ASTNode):
    def __init__(self, position: Dict[str, int], condition: str = ""):
        super().__init__(BlockType.IF, position)
        self.properties = {
            "condition": condition
        }
        self.true_branch: List[ASTNode] = []
        self.false_branch: List[ASTNode] = []
    
    def validate(self) -> List[str]:
        errors = []
        if not self.properties.get("condition"):
            errors.append("If statement must have a condition")
        return errors
    
    def to_dict(self) -> Dict[str, Any]:
        return {
            "id": self.id,
            "type": self.type.value,
            "position": self.position,
            "properties": self.properties,
            "true_branch": [node.id for node in self.true_branch],
            "false_branch": [node.id for node in self.false_branch],
            "connections": [conn.id for conn in self.connections]
        }

class WhileNode(ASTNode):
    def __init__(self, position: Dict[str, int], condition: str = ""):
        super().__init__(BlockType.WHILE, position)
        self.properties = {
            "condition": condition
        }
        self.body: List[ASTNode] = []
    
    def validate(self) -> List[str]:
        errors = []
        if not self.properties.get("condition"):
            errors.append("While loop must have a condition")
        return errors
    
    def to_dict(self) -> Dict[str, Any]:
        return {
            "id": self.id,
            "type": self.type.value,
            "position": self.position,
            "properties": self.properties,
            "body": [node.id for node in self.body],
            "connections": [conn.id for conn in self.connections]
        }

class ForNode(ASTNode):
    def __init__(self, position: Dict[str, int], init: str = "", condition: str = "", 
                 increment: str = ""):
        super().__init__(BlockType.FOR, position)
        self.properties = {
            "init": init,
            "condition": condition,
            "increment": increment
        }
        self.body: List[ASTNode] = []
    
    def validate(self) -> List[str]:
        errors = []
        if not all([self.properties.get("init"), self.properties.get("condition"), 
                   self.properties.get("increment")]):
            errors.append("For loop must have initialization, condition, and increment")
        return errors
    
    def to_dict(self) -> Dict[str, Any]:
        return {
            "id": self.id,
            "type": self.type.value,
            "position": self.position,
            "properties": self.properties,
            "body": [node.id for node in self.body],
            "connections": [conn.id for conn in self.connections]
        }

class InputNode(ASTNode):
    def __init__(self, position: Dict[str, int], prompt: str = "", variable: str = ""):
        super().__init__(BlockType.INPUT, position)
        self.properties = {
            "prompt": prompt,
            "variable": variable
        }
    
    def validate(self) -> List[str]:
        errors = []
        if not self.properties.get("variable"):
            errors.append("Input must specify a variable to store the value")
        return errors
    
    def to_dict(self) -> Dict[str, Any]:
        return {
            "id": self.id,
            "type": self.type.value,
            "position": self.position,
            "properties": self.properties,
            "connections": [conn.id for conn in self.connections]
        }

class AssignNode(ASTNode):
    def __init__(self, position: Dict[str, int], variable: str = "", expression: str = ""):
        super().__init__(BlockType.ASSIGN, position)
        self.properties = {
            "variable": variable,
            "expression": expression
        }
    
    def validate(self) -> List[str]:
        errors = []
        if not self.properties.get("variable"):
            errors.append("Assignment must specify a variable")
        if not self.properties.get("expression"):
            errors.append("Assignment must have an expression")
        return errors
    
    def to_dict(self) -> Dict[str, Any]:
        return {
            "id": self.id,
            "type": self.type.value,
            "position": self.position,
            "properties": self.properties,
            "connections": [conn.id for conn in self.connections]
        }

class AST:
    """Abstract Syntax Tree container"""
    
    def __init__(self):
        self.nodes: Dict[str, ASTNode] = {}
        self.start_node: Optional[StartNode] = None
        self.end_node: Optional[EndNode] = None
    
    def add_node(self, node: ASTNode):
        """Add a node to the AST"""
        self.nodes[node.id] = node
        
        if isinstance(node, StartNode):
            self.start_node = node
        elif isinstance(node, EndNode):
            self.end_node = node
    
    def connect_nodes(self, from_id: str, to_id: str):
        """Connect two nodes"""
        if from_id in self.nodes and to_id in self.nodes:
            from_node = self.nodes[from_id]
            to_node = self.nodes[to_id]
            if to_node not in from_node.connections:
                from_node.connections.append(to_node)
    
    def validate(self) -> List[str]:
        """Validate the entire AST"""
        errors = []
        
        # Validate each node
        for node in self.nodes.values():
            errors.extend(node.validate())
        
        return errors
    
    def get_warnings(self) -> List[str]:
        """Get warnings for the AST (non-critical issues)"""
        warnings = []
        
        # Check for start node (warning only)
        if not self.start_node:
            warnings.append("Consider adding a start node to define the program entry point")
        
        # Check for end node (warning only)
        if not self.end_node:
            warnings.append("Consider adding an end node to define the program exit point")
        
        return warnings
    
    def to_dict(self) -> Dict[str, Any]:
        """Convert AST to dictionary representation"""
        return {
            "nodes": {node_id: node.to_dict() for node_id, node in self.nodes.items()},
            "start_node_id": self.start_node.id if self.start_node else None,
            "end_node_id": self.end_node.id if self.end_node else None
        }