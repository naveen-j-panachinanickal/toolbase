import pandas as pd
from .state import DATA_STORE
from .utils import df_to_js


def run_python(data):
    code = data.get("code")
    if not code:
        return {"success": False, "error": "No code provided"}

    try:
        # Create execution environment
        # We allow access to 'pd' and all dataframes in DATA_STORE
        local_env = {"pd": pd, "result": None}
        # Add dataframes as variables
        for name, df in DATA_STORE.items():
            local_env[name] = df

        # We expect the user to assign something to 'result' variable,
        # or we capture the last expression if possible (but exec doesn't return).
        # Requirement: "allow pandas expressions" -> "return results to grid"

        full_code = code + "\n"
        exec(full_code, {}, local_env)

        result = local_env.get("result")

        # Smart Fallback: If 'result' is not set, try to find a newly created DataFrame
        if result is None:
            # Common names first
            for candidate in ["df", "res", "output", "out"]:
                if candidate in local_env and isinstance(local_env[candidate], pd.DataFrame):
                    result = local_env[candidate]
                    break
            
            # If still None, look for ANY DataFrame other than the ones in DATA_STORE
            if result is None:
                for key, val in local_env.items():
                    if key not in DATA_STORE and key not in ["pd", "DATA_STORE", "result"] and isinstance(val, pd.DataFrame):
                        result = val
                        break

        if result is None:
            return {
                "success": True,
                "message": "Code executed but the 'result' variable was not set. \n\nTip: Assign your final DataFrame to 'result' (e.g., result = df) to display it in the grid.",
            }

        if isinstance(result, pd.DataFrame):
            js_result = df_to_js(result)
            return {
                "success": True,
                **js_result
            }
        elif isinstance(result, (list, dict, str, int, float, bool)):
            # Wrap scalar/simple results
            return {
                "success": True,
                "columns": ["Result"],
                "data": [[str(result)]],
                "rowCount": 1,
            }
        else:
            return {"success": True, "columns": ["Result"], "data": [[str(result)]]}

    except Exception as e:
        return {"success": False, "error": str(e)}
