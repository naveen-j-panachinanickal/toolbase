import pandas as pd
import io
import json
from .state import DATA_STORE, JSON_STORE
from .utils import sanitize_table_name, df_to_js
import numpy as np

def load_file(data):
    try:
        content = data["content"]  # parsed from js Uint8Array
        file_type = data["type"]
        filename = data["filename"]

        # content is a PyProxy of Uint8Array or similar bytes-like object
        # Convert to bytes
        if hasattr(content, "to_py"):
            file_bytes = bytes(content.to_py())
        else:
            file_bytes = bytes(content)

        df = None
        tables_created = []
        base_table_name = sanitize_table_name(filename)

        if file_type == "csv":
            df = pd.read_csv(io.BytesIO(file_bytes))
            DATA_STORE[base_table_name] = df
            tables_created.append(base_table_name)

        elif file_type == "json":
            # Parse JSON to handle nested structures
            json_data = json.loads(file_bytes.decode("utf-8"))
            JSON_STORE[base_table_name] = json_data

            if isinstance(json_data, (list, dict)):
                # 1. Initial Flatten (objects)
                df = pd.json_normalize(json_data, sep="_")
                
                # 2. Aggressive Flatten (Arrays of Objects)
                # Look for columns that contain lists of dicts
                list_cols = []
                for col in df.columns:
                    if df[col].apply(lambda x: isinstance(x, list) and len(x) > 0).any():
                        # Peek at first non-null list item
                        sample = df[col].dropna().iloc[0] if not df[col].dropna().empty else []
                        if isinstance(sample, list) and len(sample) > 0 and isinstance(sample[0], dict):
                            list_cols.append(col)
                
                if list_cols:
                    # Explode the primary (first) array column
                    primary_col = list_cols[0] 
                    df = df.explode(primary_col)
                    
                    # Normalize the nested objects in the exploded column
                    mask = df[primary_col].notnull()
                    if mask.any():
                        nested_df = pd.json_normalize(df.loc[mask, primary_col], sep="_")
                        nested_df.index = df[mask].index
                        # Add prefix to exploded columns to show their source
                        nested_df.columns = [f"{primary_col}_{c}" for c in nested_df.columns]
                        df = df.drop(columns=[primary_col]).join(nested_df)
                
                # 3. Handle duplicate column names after all flattening
                new_cols = []
                counts = {}
                for col in df.columns:
                    if col in counts:
                        counts[col] += 1
                        new_cols.append(f"{col}_{counts[col]}")
                    else:
                        counts[col] = 0
                        new_cols.append(col)
                df.columns = new_cols
                
                DATA_STORE[base_table_name] = df
                tables_created.append(base_table_name)
            else:
                return {"success": False, "error": "Unsupported JSON structure"}

        elif file_type == "xlsx":
            df = pd.read_excel(io.BytesIO(file_bytes))
            DATA_STORE[base_table_name] = df
            tables_created.append(base_table_name)
        else:
            return {"success": False, "error": "Unsupported file type"}

        # Return the first/main table created
        main_table = tables_created[0] if tables_created else base_table_name
        main_df = DATA_STORE.get(main_table)

        return {
            "success": True,
            "table_name": main_table,
            "tables_created": tables_created,
            "rows": len(main_df) if main_df is not None else 0,
            "columns": list(main_df.columns) if main_df is not None else [],
        }
    except Exception as e:
        return {"success": False, "error": str(e)}

def get_schemas():
    schemas = []
    for name, df in DATA_STORE.items():
        cols = [{"name": str(c), "type": str(t)} for c, t in zip(df.columns, df.dtypes)]
        schemas.append({"table_name": name, "rows": len(df), "columns": cols})
    return {"success": True, "schemas": schemas}

def delete_table(data):
    """Delete a table from DATA_STORE."""
    table_name = data.get("table_name")
    if not table_name:
        return {"success": False, "error": "No table name provided"}

    if table_name not in DATA_STORE:
        return {"success": False, "error": f"Table '{table_name}' not found"}

    del DATA_STORE[table_name]
    return {"success": True, "message": f"Table '{table_name}' deleted successfully"}
