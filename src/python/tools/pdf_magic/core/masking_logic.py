import fitz
import re

def search_text_spans(file_bytes, pattern="", mode="word"):
    """
    Search for text matches on a page and return bounding boxes.
    modes: 'word' (case-insensitive), 'phrase' (exact), 'regex' (full regex)
    """
    try:
        # Explicitly convert to bytes to avoid Pyodide memoryView issues
        doc = fitz.open(stream=bytes(file_bytes), filetype="pdf")
        results = []
        
        # Prepare regex if needed
        regex = None
        if mode == "regex":
            try:
                # Support /pattern/flags format
                if pattern.startswith("/") and pattern.count("/") >= 2:
                    parts = pattern.split("/")
                    p = parts[1]
                    f_str = parts[2]
                    flags = 0
                    if "i" in f_str: flags |= re.IGNORECASE
                    if "m" in f_str: flags |= re.MULTILINE
                    regex = re.compile(p, flags)
                else:
                    regex = re.compile(pattern, re.IGNORECASE)
            except Exception as e:
                return {"error": f"Invalid regex: {str(e)}"}

        for page_index in range(len(doc)):
            page = doc[page_index]
            pW, pH = page.rect.width, page.rect.height
            
            # Using fitz search_for which is very robust
            # But if we need regex or complex phrase matching, 
            # we might need to extract text and then find offsets.
            
            matches = []
            words = page.get_text("words") # list of (x0, y0, x1, y1, "word", block_no, line_no, word_no)
            
            p_lower = pattern.lower().strip()
            
            if mode == "word":
                for w in words:
                    # Normalize word text - remove zero-width chars and weird spaces
                    w_text = w[4].replace('\u200b', '').replace('\u200c', '').replace('\u200d', '').replace('\ufeff', '').strip()
                    w_lower = w_text.lower()

                    if p_lower in w_lower:
                        rect = fitz.Rect(w[0], w[1], w[2], w[3])
                        # Extra check: avoid tiny or empty rects
                        if rect.is_empty or rect.width < 1: continue

                        matches.append({
                            "pageIndex": page_index,
                            "x": (rect.x0 / pW) * 100,
                            "y": (rect.y0 / pH) * 100,
                            "width": ((rect.x1 - rect.x0) / pW) * 100,
                            "height": ((rect.y1 - rect.y0) / pH) * 100,
                            "rect": [rect.x0, rect.y0, rect.x1, rect.y1]
                        })

            elif mode == "phrase":
                # Use fitz search_for for phrase matching - it handles multi-word phrases correctly
                rects = page.search_for(pattern)
                for r in rects:
                    rect = r if isinstance(r, fitz.Rect) else r.rect
                    # Extra check: avoid tiny or empty rects
                    if rect.is_empty or rect.width < 1: continue
                    matches.append({
                        "pageIndex": page_index,
                        "x": (rect.x0 / pW) * 100,
                        "y": (rect.y0 / pH) * 100,
                        "width": ((rect.x1 - rect.x0) / pW) * 100,
                        "height": ((rect.y1 - rect.y0) / pH) * 100,
                        "rect": [rect.x0, rect.y0, rect.x1, rect.y1]
                    })
            
            elif mode == "regex" and regex:
                # Same logic for regex but matching on word text
                for w in words:
                    if regex.search(w[4]):
                        rect = fitz.Rect(w[0], w[1], w[2], w[3])
                        matches.append({
                            "pageIndex": page_index,
                            "x": (rect.x0 / pW) * 100,
                            "y": (rect.y0 / pH) * 100,
                            "width": ((rect.x1 - rect.x0) / pW) * 100,
                            "height": ((rect.y1 - rect.y0) / pH) * 100,
                            "rect": [rect.x0, rect.y0, rect.x1, rect.y1]
                        })
            
            results.extend(matches)

        metadata = {
            "title": doc.metadata.get("title", ""),
            "pages": len(doc),
        }
        doc.close()
        return {"matches": results, "count": len(results), "debug": metadata}

    except Exception as e:
        import traceback
        return {"error": str(e), "trace": traceback.format_exc()}
