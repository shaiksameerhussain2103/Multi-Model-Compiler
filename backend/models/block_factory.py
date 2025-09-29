from typing import Dict, Any, Optional
from .ast_nodes import (
    ASTNode, StartNode, EndNode, VariableNode, PrintNode, IfNode, 
    WhileNode, ForNode, InputNode, AssignNode, BlockType, DataType
)

class BlockFactory:
    """Factory class for creating AST nodes from block definitions"""
    
    @staticmethod
    def create_node(block_type: str, position: Dict[str, int], 
                   properties: Dict[str, Any] = None) -> Optional[ASTNode]:
        """
        Create an AST node based on block type and properties
        
        Args:
            block_type: Type of block to create
            position: Position on canvas (x, y)
            properties: Block-specific properties
        
        Returns:
            Created AST node or None if invalid type
        """
        properties = properties or {}
        
        try:
            if block_type == BlockType.START.value:
                return StartNode(position)
            
            elif block_type == BlockType.END.value:
                return EndNode(position)
            
            elif block_type == BlockType.VARIABLE.value:
                data_type_str = properties.get("data_type", "int")
                data_type = DataType(data_type_str) if data_type_str in [dt.value for dt in DataType] else DataType.INTEGER
                return VariableNode(
                    position=position,
                    var_name=properties.get("var_name", ""),
                    data_type=data_type,
                    initial_value=properties.get("initial_value", "")
                )
            
            elif block_type == BlockType.PRINT.value:
                variables = []
                if properties.get("variables"):
                    variables = [v.strip() for v in properties["variables"].split(",") if v.strip()]
                return PrintNode(
                    position=position,
                    text=properties.get("text", ""),
                    variables=variables
                )
            
            elif block_type == BlockType.INPUT.value:
                return InputNode(
                    position=position,
                    prompt=properties.get("prompt", ""),
                    variable=properties.get("variable", "")
                )
            
            elif block_type == BlockType.ASSIGN.value:
                return AssignNode(
                    position=position,
                    variable=properties.get("variable", ""),
                    expression=properties.get("expression", "")
                )
            
            elif block_type == BlockType.IF.value:
                return IfNode(
                    position=position,
                    condition=properties.get("condition", "")
                )
            
            elif block_type == BlockType.WHILE.value:
                return WhileNode(
                    position=position,
                    condition=properties.get("condition", "")
                )
            
            elif block_type == BlockType.FOR.value:
                return ForNode(
                    position=position,
                    init=properties.get("init", ""),
                    condition=properties.get("condition", ""),
                    increment=properties.get("increment", "")
                )
            
            else:
                return None
                
        except Exception as e:
            print(f"Error creating node: {e}")
            return None
    
    @staticmethod
    def update_node_properties(node: ASTNode, properties: Dict[str, Any]) -> bool:
        """
        Update properties of an existing node
        
        Args:
            node: AST node to update
            properties: New properties
        
        Returns:
            True if update successful, False otherwise
        """
        try:
            if isinstance(node, VariableNode):
                if "var_name" in properties:
                    node.properties["var_name"] = properties["var_name"]
                if "data_type" in properties:
                    node.properties["data_type"] = properties["data_type"]
                if "initial_value" in properties:
                    node.properties["initial_value"] = properties["initial_value"]
            
            elif isinstance(node, PrintNode):
                if "text" in properties:
                    node.properties["text"] = properties["text"]
                if "variables" in properties:
                    if isinstance(properties["variables"], str):
                        node.properties["variables"] = [
                            v.strip() for v in properties["variables"].split(",") if v.strip()
                        ]
                    else:
                        node.properties["variables"] = properties["variables"]
            
            elif isinstance(node, InputNode):
                if "prompt" in properties:
                    node.properties["prompt"] = properties["prompt"]
                if "variable" in properties:
                    node.properties["variable"] = properties["variable"]
            
            elif isinstance(node, AssignNode):
                if "variable" in properties:
                    node.properties["variable"] = properties["variable"]
                if "expression" in properties:
                    node.properties["expression"] = properties["expression"]
            
            elif isinstance(node, (IfNode, WhileNode)):
                if "condition" in properties:
                    node.properties["condition"] = properties["condition"]
            
            elif isinstance(node, ForNode):
                if "init" in properties:
                    node.properties["init"] = properties["init"]
                if "condition" in properties:
                    node.properties["condition"] = properties["condition"]
                if "increment" in properties:
                    node.properties["increment"] = properties["increment"]
            
            return True
            
        except Exception as e:
            print(f"Error updating node properties: {e}")
            return False