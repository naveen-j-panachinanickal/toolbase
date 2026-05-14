import fitz
import base64
def detect_pdf_elements(file_bytes, page_index):
    """
    Detect text blocks and images on a specific page.
    Returns a list of elements with coordinates (PDF points) and page dimensions.
    Used for the 'Edit' mode to make static PDF elements interactive.
    """
    try:
        doc = fitz.open(stream=file_bytes, filetype="pdf")

        # Validate page index
        if page_index >= len(doc):
            return {"error": "Page index out of range"}

        page = doc[page_index]
        elements = []
        pW, pH = page.rect.width, page.rect.height

        # 1. Get Text Blocks using "dict" to extract styles
        page_dict = page.get_text("dict")
        blocks = page_dict.get("blocks", [])

        for b in blocks:
            # block_type 0 is text
            if b.get("type") == 0:
                text = ""
                font_size = 16
                color_val = 0
                font_name = "Helvetica"

                # Extract text and properties from spans
                lines = b.get("lines", [])
                x_starts = []
                for l in lines:
                    for s in l.get("spans", []):
                        text += s.get("text", "")
                        font_size = s.get("size", font_size)
                        color_val = s.get("color", color_val)
                        font_name = s.get("font", font_name)
                        x_starts.append(s.get("origin")[0])
                    text += "\n"

                # Guess alignment
                align = "left"
                if x_starts:
                    # If most lines start significantly far from the block's left edge,
                    # it might be centered or right-aligned.
                    block_x0 = b.get("bbox")[0]
                    block_width = b.get("bbox")[2] - block_x0
                    avg_offset = sum(x - block_x0 for x in x_starts) / len(x_starts)

                    if avg_offset > block_width * 0.3:
                        align = "center"
                    if avg_offset > block_width * 0.6:
                        align = "right"

                # Convert integer sRGB color to hex
                r = (color_val >> 16) & 255
                g = (color_val >> 8) & 255
                b_color = color_val & 255
                hex_color = f"#{r:02x}{g:02x}{b_color:02x}"

                elements.append(
                    {
                        "id": f"orig-text-{b.get('number', 0)}",
                        "type": "text",
                        "content": text.strip(),
                        "rect": b.get("bbox"),
                        "x": (b.get("bbox")[0] / pW) * 100,
                        "y": (b.get("bbox")[1] / pH) * 100,
                        "width": ((b.get("bbox")[2] - b.get("bbox")[0]) / pW) * 100,
                        "height": ((b.get("bbox")[3] - b.get("bbox")[1]) / pH) * 100,
                        "existing": True,
                        "fontSize": font_size,
                        "color": hex_color,
                        "fontFamily": font_name,
                        "textAlign": align,
                    }
                )

        # 2. Get Images
        image_list = page.get_image_info(xrefs=True)
        for i, img in enumerate(image_list):
            bbox = img["bbox"]
            xref = img.get("xref", 0)
            b64_img = ""
            try:
                pix = fitz.Pixmap(doc, xref)
                if pix.n - pix.alpha > 3:  # CMYK or other, convert to RGB
                    pix = fitz.Pixmap(fitz.csRGB, pix)
                img_data = pix.tobytes("png")
                b64_img = "data:image/png;base64," + base64.b64encode(img_data).decode("utf-8")
            except:
                pass

            elements.append(
                {
                    "id": f"orig-img-{i}",
                    "type": "image",
                    "rect": bbox,
                    "x": (bbox[0] / pW) * 100,
                    "y": (bbox[1] / pH) * 100,
                    "width": ((bbox[2] - bbox[0]) / pW) * 100,
                    "height": ((bbox[3] - bbox[1]) / pH) * 100,
                    "existing": True,
                    "content": b64_img,
                }
            )

        doc.close()
        return {"elements": elements, "width": pW, "height": pH}

    except Exception as e:
        return {"error": str(e)}
