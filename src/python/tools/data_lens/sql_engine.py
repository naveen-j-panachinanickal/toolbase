import json
import sqlite3
import pandas as pd
from .state import DATA_STORE
from .utils import df_to_js


def prepare_df_for_sql(df):
    """
    Prepare a DataFrame for SQLite by converting unsupported types to strings.
    SQLite doesn't support list, dict, or complex object types.
    """
    df_copy = df.copy()
    for col in df_copy.columns:
        # Check if any value in the column is a list or dict
        sample_values = df_copy[col].dropna().head(10)
        needs_conversion = False
        for val in sample_values:
            if isinstance(val, (list, dict)):
                needs_conversion = True
                break

        if needs_conversion:
            # Convert the entire column to JSON strings
            df_copy[col] = df_copy[col].apply(
                lambda x: json.dumps(x) if isinstance(x, (list, dict)) else x
            )
    return df_copy


def run_sql(data):
    """
    Execute SQL query on the data.
    Supports SELECT, CREATE TABLE, INSERT, UPDATE, DELETE, etc.
    Automatically synchronizes changes back to the global DATA_STORE.
    """
    query = data.get("query", "").strip()
    if not query:
        return {"success": False, "error": "No query provided"}

    try:
        conn = sqlite3.connect(":memory:")

        # Track which columns contain JSON data for better error messages
        json_columns = {}

        for name, df in DATA_STORE.items():
            # Prepare dataframe for SQL (convert lists/dicts to JSON strings)
            sql_df = prepare_df_for_sql(df)
            sql_df.to_sql(name, conn, index=False)

            # Track JSON columns
            for col in df.columns:
                sample_values = df[col].dropna().head(5)
                for val in sample_values:
                    if isinstance(val, (list, dict)):
                        if name not in json_columns:
                            json_columns[name] = []
                        json_columns[name].append(col)
                        break

        # Detect the type of query
        query_lower = query.lower()
        is_select = query_lower.startswith(
            ("select", "with", "show", "describe", "explain", "pragma")
        )

        if is_select:
            # For data fetching (queries with results)
            result_df = pd.read_sql_query(query, conn)
            conn.close()
            js_result = df_to_js(result_df)
            return {
                "success": True,
                **js_result,
                "json_columns": json_columns,
            }
        else:
            # For data modification (DDL/DML)
            conn.execute(query)
            conn.commit()

            # SYNC BACK: Detect all existing tables in SQLite memory
            cursor = conn.cursor()
            cursor.execute("SELECT name FROM sqlite_master WHERE type='table'")
            sqlite_tables = [row[0] for row in cursor.fetchall()]

            updated_tables = []
            for table_name in sqlite_tables:
                # Skip internal internal tables
                if table_name.startswith("sqlite_"):
                    continue
                # Read table back into DataFrame and update DATA_STORE
                new_df = pd.read_sql_query(f'SELECT * FROM "{table_name}"', conn)
                DATA_STORE[table_name] = new_df
                updated_tables.append(table_name)

            # Handle dropped tables: remove from DATA_STORE if not in sqlite_tables
            for name in list(DATA_STORE.keys()):
                if name not in sqlite_tables:
                    del DATA_STORE[name]

            conn.close()
            return {
                "success": True,
                "message": f"Operation successful. Tables updated: {', '.join(updated_tables)}",
                "schemas_updated": True,
            }

    except Exception as e:
        error_msg = str(e)

        # Provide helpful hints for common JSON query issues
        hint = ""
        if "no such function: json_extract" in error_msg.lower():
            hint = "\n\nHint: SQLite JSON functions might not be available. Try accessing flattened columns directly (e.g., customer_name instead of json_extract)."
        elif "json" in query.lower() and json_columns:
            hint = f"\n\nHint: Available JSON columns: {json_columns}"

        return {"success": False, "error": error_msg + hint}
