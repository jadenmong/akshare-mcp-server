#!/usr/bin/env python3
"""
Python bridge for AKShare MCP server
Provides Python functionality to be called from the Node.js MCP server
"""

import json
import sys
import argparse
import akshare as ak
import pandas as pd
from typing import Dict, Any, Optional

def call_akshare_function(function_name: str, params: Dict[str, Any]) -> Dict[str, Any]:
    """
    Call an AKShare function with the given parameters

    Args:
        function_name: Name of the AKShare function to call
        params: Parameters to pass to the function

    Returns:
        Result of the function call as a dictionary
    """
    try:
        # Get the function from akshare module
        if not hasattr(ak, function_name):
            return {
                "error": f"Function '{function_name}' not found in akshare"
            }

        func = getattr(ak, function_name)

        # Filter out None values
        filtered_params = {k: v for k, v in params.items() if v is not None and v != ''}

        # Call the function
        result = func(**filtered_params)

        # Convert pandas DataFrame to JSON serializable format
        if hasattr(result, 'to_dict'):
            result = result.to_dict('records')
        elif hasattr(result, 'to_json'):
            result = json.loads(result.to_json())
        elif hasattr(result, '__dict__'):
            result = result.__dict__
        elif isinstance(result, (list, tuple)):
            result = list(result)
        elif isinstance(result, pd.Series):
            result = result.to_dict()
        elif hasattr(result, 'values') and hasattr(result, 'index'):
            result = dict(zip(result.index, result.values))

        return {
            "success": True,
            "data": result,
            "function": function_name,
            "params": filtered_params
        }

    except Exception as e:
        return {
            "error": str(e),
            "function": function_name,
            "params": params
        }

def main():
    """Main function to handle command line arguments"""
    parser = argparse.ArgumentParser(description='AKShare Python Bridge')
    parser.add_argument('--function', required=True, help='AKShare function name')
    parser.add_argument('--params', required=False, help='Parameters as JSON string')

    args = parser.parse_args()

    try:
        # Parse parameters
        params = {}
        if args.params:
            params = json.loads(args.params)

        # Call the function
        result = call_akshare_function(args.function, params)

        # Output result as JSON
        print(json.dumps(result, ensure_ascii=False, indent=2))

    except Exception as e:
        error_result = {
            "error": f"Bridge error: {str(e)}"
        }
        print(json.dumps(error_result, ensure_ascii=False), file=sys.stderr)
        sys.exit(1)

if __name__ == "__main__":
    main()