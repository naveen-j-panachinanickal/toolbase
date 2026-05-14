import io
import fitz  # PyMuPDF
from PIL import Image

def compress_pdf_content(file_bytes, level="recommended"):
    """
    Compresses PDF by rasterizing pages to JPEG and rebuilding.
    """
    try:
        # Configuration
        if level == "extreme":
            quality, dpi = 30, 100
        elif level == "recommended":
            quality, dpi = 60, 150
        else:  # less
            quality, dpi = 85, 200

        src_doc = fitz.open(stream=file_bytes, filetype="pdf")
        new_doc = fitz.open()

        for page in src_doc:
            # Render page to pixmap
            # matrix=fitz.Matrix(dpi/72, dpi/72) controls resolution
            pix = page.get_pixmap(matrix=fitz.Matrix(dpi / 72, dpi / 72))

            # Convert to PIL for JPEG optimization
            img = Image.frombytes("RGB", [pix.width, pix.height], pix.samples)
            
            img_bytes_io = io.BytesIO()
            img.save(img_bytes_io, format="JPEG", quality=quality, optimize=True)
            
            # Create a new PDF page with the same dimensions
            new_page = new_doc.new_page(width=page.rect.width, height=page.rect.height)
            
            # OPTIMIZATION: Insert image stream directly rather than converting to PDF first
            new_page.insert_image(new_page.rect, stream=img_bytes_io.getvalue())

        # Save
        output = io.BytesIO()
        new_doc.save(output)
        result = output.getvalue()
        
        src_doc.close()
        new_doc.close()

        return list(result)

    except Exception as e:
        return {"error": str(e)}
