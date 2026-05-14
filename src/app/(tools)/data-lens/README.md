# DataLens

## Overview

DataLens is a powerful, privacy-focused data analytics tool that runs entirely in your browser. It transforms your CSV, Excel, and JSON files into an interactive SQL database and Python playground, allowing you to query, visualize, and manipulate data without sending it to a server.

## Features

- **File Support**: Drag & drop CSV, Excel (`.xlsx`), and JSON files.
- **SQL Engine**: Run standard SQL queries (powered by SQLite via Python) on your data.
- **Python Sandbox**: Execute Python pandas code directly on your tables.
- **JSON Explorer**: Visualize complex nested JSON structures.
- **Charts**: Generate instant visualizations.
- **Data Export**: Export processed results to CSV/JSON.

## Privacy Guarantee

- **Local Processing**: Pyodide + SQLite WASM ensures 100% of data processing stays in your browser tab.
- **No Persistence**: Data is cleared when you refresh the page.

## Architecture

- **Frontend**: React (Next.js)
- **Engine**: Python (Pandas + SQLite) running in a dedicated Web Worker (`data-lens.worker.ts`).
- **Communication**: Message passing between UI and Worker.

## Usage

1. Import a dataset (CSV/Excel/JSON).
2. Use the **Data Tab** to view and filter the raw table.
3. Use **SQL Tab** to run queries like `SELECT * FROM table WHERE price > 100`.
4. Use **Python Tab** to run complex logic: `result = df.describe()`.
5. Use **Charts Tab** to visualize headers.
