import sys

# Ensure the local directory is in path for imports
sys.path.append(".")

from .core import compressor, security, extractor, editor, converter, split_merge, masking_logic

# Action Registry
ACTIONS = {
    "compress": compressor.compress_pdf_content,
    "protect": security.protect_pdf,
    "unlock": security.unlock_pdf,
    "detect": extractor.detect_pdf_elements,
    "apply_edits": editor.apply_pdf_edits,
    "pdf_to_word": converter.pdf_to_word,
    "pdf_to_images": converter.pdf_to_images,
    "images_to_pdf": converter.images_to_pdf,
    "html_to_pdf": converter.html_to_pdf,
    "split": split_merge.split_pdf,
    "merge": split_merge.merge_pdfs,
    "search": masking_logic.search_text_spans,
}


def handle_request(action, data):
    """
    Main entry point for WASM/Next.js.
    """
    if action not in ACTIONS:
        return {"error": f"Unknown action: {action}"}

    # Extract arguments specific to the function signature could be automated,
    # but explicit mapping is safer for an API boundary.
    try:
        func = ACTIONS[action]
        file_bytes = data.get("file_bytes")

        # Dispatch with specific args based on action
        if action == "compress":
            return func(file_bytes, data.get("level", "recommended"))

        elif action == "protect":
            return func(
                file_bytes,
                data.get("password"),
                data.get("owner_password"),
                data.get("permissions"),
            )

        elif action == "detect":
            return func(file_bytes, data.get("page_index", 0))

        elif action == "apply_edits":
            return func(file_bytes, data.get("edits", []))

        elif action == "pdf_to_word":
            return func(file_bytes)

        elif action == "pdf_to_images":
            return func(file_bytes, data.get("dpi", 150), data.get("format", "JPEG"))

        elif action == "images_to_pdf":
            return func(data.get("files_bytes", []))

        elif action == "html_to_pdf":
            return func(file_bytes)

        elif action == "split":
            return func(file_bytes, data.get("page_ranges", ""))

        elif action == "merge":
            return func(data.get("files_bytes", []))

        elif action == "unlock":
            return func(file_bytes, data.get("password", ""))

        elif action == "search":
            return func(file_bytes, data.get("pattern", ""), data.get("mode", "word"))

    except Exception as e:
        return {"error": str(e)}
