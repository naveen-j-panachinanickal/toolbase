from .loaders import load_file, get_schemas, delete_table
from .sql_engine import run_sql
from .python_engine import run_python
from .json_engine import get_raw_json, query_json
from .state import clear_all


def handle_request(action, data):
    """
    Main entry point for DataLens worker.
    """
    try:
        if action == "load_file":
            return load_file(data)
        elif action == "get_schemas":
            return get_schemas()
        elif action == "run_sql":
            return run_sql(data)
        elif action == "run_python":
            return run_python(data)
        elif action == "delete_table":
            return delete_table(data)
        elif action == "get_raw_json":
            return get_raw_json(data)
        elif action == "query_json":
            return query_json(data)
        elif action == "clear_all":
            clear_all()
            return {"success": True}
    except Exception as e:
        return {"success": False, "error": str(e)}
