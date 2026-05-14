import fitz
import io
import base64


def _hex_to_rgb(hex_str):
    """
    Helper: Convert hex color string to RGB tuple (0.0 - 1.0).
    """
    if not hex_str:
        return (0, 0, 0)
    hex_str = hex_str.lstrip("#")
    return tuple(int(hex_str[i : i + 2], 16) / 255.0 for i in (0, 2, 4))


def _to_pdf_rect(el, page_width, page_height):
    """
    Helper: Convert percentage-based coordinates to PDF points.
    Now expects x, y to be top-left.
    """
    w = (el["width"] / 100) * page_width
    h = (el["height"] / 100) * page_height
    x = (el["x"] / 100) * page_width
    y = (el["y"] / 100) * page_height

    # Clamp to page boundaries
    x = max(0, min(page_width - 1, x))
    y = max(0, min(page_height - 1, y))
    w = min(page_width - x, w)
    h = min(page_height - y, h)

    # Add a small buffer for redaction/masking to ensure full coverage
    if el.get("type") == "whiteout" or el.get("redact"):
        return fitz.Rect(x - 1, y - 1, x + w + 1, y + h + 1)

    return fitz.Rect(x, y, x + w, y + h)


def apply_pdf_edits(file_bytes, edits):
    """
    Apply a list of edits (additions, drawings, redactions) to a PDF.
    Expects percentages for x, y, width, height (0-100) to support responsive UI.
    """
    try:
        # Cast file_bytes to bytes to avoid memoryview or proxy issues in fitz
        _bytes = bytes(file_bytes)
        doc = fitz.open(stream=_bytes, filetype="pdf")

        # Group edits by page to minimize page loading operations
        page_edits = {}
        for edit in edits:
            # We explicitly do getattr/getter to bypass strictly JSProxy vs Dict differences
            p_idx = (
                edit.get("pageIndex")
                if hasattr(edit, "get")
                else getattr(edit, "pageIndex", 0)
            )
            if p_idx is None:
                p_idx = 0
            if p_idx not in page_edits:
                page_edits[p_idx] = []
            page_edits[p_idx].append(edit)

        for p_idx, p_list in page_edits.items():
            if p_idx >= len(doc):
                continue

            page = doc[p_idx]
            pW, pH = page.rect.width, page.rect.height

            # 1. Handle Existing Content Removal (Redactions)
            for edit in p_list:
                # Helper to safely get properties whether dict or JsProxy
                def get_val(item, key, default=None):
                    if hasattr(item, "get"):
                        return item.get(key, default)
                    return getattr(item, key, default)

                is_existing = get_val(edit, "existing", False)
                is_redact = (
                    get_val(edit, "redact", False)
                    or get_val(edit, "moved", False)
                    or get_val(edit, "content_changed", False)
                )

                if is_existing and is_redact:
                    orig = get_val(edit, "originalRect")
                    if orig:
                        # Convert to list to avoid proxy sequence issues
                        orig = list(orig)
                        # Add slight padding to mask for extra safety
                        r = fitz.Rect(orig)
                        padded_rect = fitz.Rect(
                            r.x0 - 0.5, r.y0 - 0.5, r.x1 + 0.5, r.y1 + 0.5
                        )
                        page.draw_rect(
                            padded_rect, color=(1, 1, 1), fill=(1, 1, 1), overlay=True
                        )
                elif edit["type"] == "whiteout":
                    page.draw_rect(
                        _to_pdf_rect(edit, pW, pH),
                        color=(1, 1, 1),
                        fill=(1, 1, 1),
                        overlay=True,
                    )

            # 2. Handle New Additions or Repositioned Content
            for edit in p_list:
                is_redact_only = get_val(edit, "redact") and not get_val(edit, "moved")
                if is_redact_only:
                    continue

                if (
                    get_val(edit, "existing")
                    and not get_val(edit, "moved")
                    and not get_val(edit, "content_changed")
                ):
                    # Check if content actually changed if it's "existing"
                    if get_val(edit, "content") == get_val(edit, "originalContent"):
                        continue

                # Ensure rect parsing works
                el_width = get_val(edit, "width", 10)
                el_height = get_val(edit, "height", 10)
                el_x = get_val(edit, "x", 0)
                el_y = get_val(edit, "y", 0)
                el_type = get_val(edit, "type")

                w = (el_width / 100) * pW
                h = (el_height / 100) * pH
                x = (el_x / 100) * pW
                y = (el_y / 100) * pH
                x = max(0, min(pW - 1, x))
                y = max(0, min(pH - 1, y))
                w = min(pW - x, w)
                h = min(pH - y, h)
                rect = fitz.Rect(x, y, x + w, y + h)

                color = _hex_to_rgb(get_val(edit, "color", "#000000"))
                opacity = get_val(edit, "opacity", 1.0)

                # 3. Handle Redactions (Masks) - Using fitz Redaction API for permanent erasure
                if el_type == "whiteout" or get_val(edit, "is_masked"):
                    # Add redaction annotation (burns in)
                    page.add_redact_annot(rect, fill=color)
                    page.apply_redactions()
                    
                    # Add label if present
                    label = get_val(edit, "label", "")
                    if label:
                        # Centered white text on black background usually
                        text_color = (1, 1, 1) if sum(color)/3 < 0.5 else (0, 0, 0)
                        # Estimate font size to fit rect
                        f_size = min(rect.height * 0.6, 10) 
                        if f_size > 4: # Only draw if it's large enough to see
                            page.insert_textbox(
                                rect, 
                                label, 
                                fontsize=f_size, 
                                color=text_color, 
                                align=1, # center
                                fontname="helv"
                            )
                    continue

                if el_type == "text":
                    text_rect = fitz.Rect(
                        rect.x0, rect.y0, rect.x1, max(rect.y1, rect.y0 + 1000)
                    )

                    text_content = str(get_val(edit, "content", ""))
                    f_size = get_val(edit, "fontSize", 12)

                    if not isinstance(f_size, (int, float)) or f_size <= 0:
                        f_size = 12

                    font_family = str(get_val(edit, "fontFamily", ""))
                    font_to_use = "helv"  # Default fallback

                    if font_family:
                        normalized = font_family.lower()
                        if "times" in normalized or "serif" in normalized:
                            font_to_use = "tiro"
                        elif "courier" in normalized or "mono" in normalized:
                            font_to_use = "cour"
                        elif "symbol" in normalized:
                            font_to_use = "symb"
                        elif "zapf" in normalized:
                            font_to_use = "zabd"

                    align_map = {"left": 0, "center": 1, "right": 2}
                    align_val = align_map.get(get_val(edit, "textAlign", "left"), 0)

                    page.insert_textbox(
                        text_rect,
                        text_content,
                        fontsize=f_size,
                        color=color,
                        fontname=font_to_use,
                        align=align_val,
                    )

                elif el_type in ["image", "drawing"]:
                    try:
                        content = get_val(edit, "content", "")
                        if "," in content:
                            img_data = content.split(",")[1]
                        else:
                            img_data = content

                        img_bytes = base64.b64decode(img_data)

                        # Get rotation angle (default to 0)
                        rotation = get_val(edit, "rotation", 0)

                        if rotation and rotation != 0:
                            # For rotated images, we need to handle the transformation
                            # PyMuPDF uses clockwise rotation, so we convert our rotation
                            page.insert_image(rect, stream=img_bytes, rotate=rotation)
                        else:
                            page.insert_image(rect, stream=img_bytes)
                    except Exception as img_e:
                        print(f"Error inserting image: {img_e}")
                        pass

                elif el_type == "shape":
                    shape_type = get_val(edit, "shapeType")
                    stroke_width = get_val(edit, "strokeWidth", 1)

                    if shape_type == "rectangle":
                        page.draw_rect(rect, color=color, width=stroke_width)
                    elif shape_type == "circle":
                        page.draw_oval(rect, color=color, width=stroke_width)

        output = io.BytesIO()
        doc.save(output, garbage=4, deflate=True) # garbage=4 helps clean up deleted objects

        # We must return the raw bytes to JS. In the worker we will extract JS Uint8Array
        result = output.getvalue()
        doc.close()

        # Converting 1MB+ PDF to Python list can OOM and is very slow.
        # Using bytes directly is better for Pyodide, it maps to Uint8Array safely.
        return result

    except Exception as e:
        import traceback

        traceback.print_exc()
        return {"error": str(e)}
