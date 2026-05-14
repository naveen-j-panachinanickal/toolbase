import os
import sys

# Change to the toolbase directory so we can import editor.py
sys.path.append(os.path.abspath('c:\\Users\\donbe\\Work\\OBN\\toolbase\\src\\python\\tools\\pdf_magic\\core'))

import editor
import fitz

# Create a blank PDF
doc = fitz.open()
page = doc.new_page(width=595, height=842) # A4
blank_pdf = doc.tobytes()
doc.close()

# Prepare edits mimicking JS
edits = [{
    "type": "text",
    "x": 10,
    "y": 10,
    "width": 80,
    "height": 10,
    "pageIndex": 0,
    "color": "#ff0000",
    "fontSize": 24,
    "fontFamily": "Inter",
    "textAlign": "center",
    "content": "TESTING NEW TEXT",
    "existing": False
}, {
    "type": "shape",
    "shapeType": "rectangle",
    "x": 20,
    "y": 40,
    "width": 60,
    "height": 10,
    "pageIndex": 0,
    "color": "#0000ff",
    "strokeWidth": 2,
    "existing": False
}]

print("Applying edits...")
result_bytes = editor.apply_pdf_edits(blank_pdf, edits)

if isinstance(result_bytes, dict) and "error" in result_bytes:
    print(f"Error returned: {result_bytes['error']}")
else:
    print(f"Success! Output bytes len: {len(result_bytes)}")
    # Verify the output PDF
    out_doc = fitz.open(stream=result_bytes, filetype="pdf")
    text = out_doc[0].get_text()
    print(f"Text in output PDF: {repr(text)}")
    
    # Are shapes there?
    drawings = out_doc[0].get_drawings()
    print(f"Drawings extracted: {len(drawings)}")
    out_doc.close()
