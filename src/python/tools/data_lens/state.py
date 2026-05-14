import gc

# Global state to store loaded dataframes
# Structure: { "table_name": dataframe }
DATA_STORE = {}

# Store raw JSON data for JSON viewer
# Structure: { "file_name": json_data }
JSON_STORE = {}

def get_data_store():
    return DATA_STORE

def get_json_store():
    return JSON_STORE

def clear_all():
    global DATA_STORE, JSON_STORE
    DATA_STORE.clear()
    JSON_STORE.clear()
    gc.collect()
