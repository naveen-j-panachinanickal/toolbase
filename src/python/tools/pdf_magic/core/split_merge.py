import fitz


def split_pdf(file_bytes, page_ranges):
    """
    Splits a PDF into multiple parts based on page ranges.
    Returns a dictionary with a 'data' key containing a list of PDF byte arrays.
    """
    try:
        doc = fitz.open(stream=bytes(file_bytes), filetype="pdf")
        num_pages = len(doc)

        # Parse page_ranges "1-3,5,7-9" -> [[0,1,2], [4], [6,7,8]]
        if not page_ranges:
            groups = [[i] for i in range(num_pages)]
        else:
            groups = []
            for part in page_ranges.split(","):
                part = part.strip()
                if "-" in part:
                    start, end = map(int, part.split("-"))
                    groups.append(
                        [i - 1 for i in range(start, min(end, num_pages) + 1)]
                    )
                else:
                    groups.append([int(part) - 1])

        results = []
        for group in groups:
            new_doc = fitz.open()
            for p in group:
                if 0 <= p < num_pages:
                    new_doc.insert_pdf(doc, from_page=p, to_page=p)

            # Save the new document to a byte array
            results.append(new_doc.write())
            new_doc.close()

        doc.close()
        return {"data": results}
    except Exception as e:
        return {"error": str(e)}


def merge_pdfs(files_bytes):
    """
    Merges multiple PDFs into a single document.
    """
    try:
        result_doc = fitz.open()
        for f_bytes in files_bytes:
            # Open each byte array as a PDF
            doc = fitz.open(stream=bytes(f_bytes), filetype="pdf")
            result_doc.insert_pdf(doc)
            doc.close()

        final_bytes = result_doc.write()
        result_doc.close()
        return final_bytes
    except Exception as e:
        return {"error": str(e)}
