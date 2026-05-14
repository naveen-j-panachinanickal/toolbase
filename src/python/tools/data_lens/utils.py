import re
import numpy as np
import pandas as pd

def sanitize_table_name(filename):
    # Remove extension and special chars, make alphanumeric
    name = filename.rsplit(".", 1)[0]
    name = re.sub(r"\W+", "_", name)
    return name.lower()

def df_to_js(df):
    """
    Prepare a DataFrame for JavaScript transmission by handling:
    1. Datetime objects (convert to ISO strings)
    2. NaN/Inf values (convert to None/null)
    3. Non-string column names
    """
    if df is None:
        return None
    
    # Create a copy to avoid side effects
    result_df = df.copy()
    
    # Clean column names (must be strings)
    columns = [str(c) for c in result_df.columns]
    
    # Convert all object columns and datetime columns to serializable types
    data = []
    
    # Convert to list of lists manually to handle Timestamps, NaN/Inf, and Collections
    for row in result_df.itertuples(index=False, name=None):
        new_row = []
        for val in row:
            if hasattr(val, 'isoformat'): # Handles datetime, Timestamp
                new_row.append(val.isoformat())
            elif isinstance(val, (float, np.floating)):
                if np.isnan(val) or np.isinf(val):
                    new_row.append(None)
                else:
                    new_row.append(float(val))
            elif isinstance(val, (int, np.integer)):
                new_row.append(int(val))
            # Handle collection types (list, dict, ndarray) BEFORE checking pd.isna
            # to avoid 'Ambiguous truth value' errors
            elif isinstance(val, (list, dict, np.ndarray)):
                new_row.append(val)
            elif pd.isna(val):
                new_row.append(None)
            else:
                new_row.append(val)
        data.append(new_row)
        
    return {
        "columns": columns,
        "data": data,
        "rowCount": len(result_df)
    }
