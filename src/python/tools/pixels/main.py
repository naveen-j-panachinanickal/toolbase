from .core.compressor import compress_image
from .core.upscaler import upscale_image
from .core.resizer import resize_image
from .core.steganography import hide_text, reveal_text
from .core.metadata import get_image_info


def handle_request(action, data):
    """
    Main entry point for the Pixels tool.
    Routes requests to appropriate modules based on action and parameters.

    Args:
        action (str): The action to perform ('compress', 'get_info', 'hide_text', 'reveal_text').
        data (dict): The input data containing image bytes and parameters.

    Returns:
        dict|bytes|str: The result of the action (info dict, image bytes, or error string).
    """
    if action == "compress":
        # Determine if this is a simple compression or an upscale/enhancement task
        resize_factor = float(data.get("resize_factor", 1.0))
        has_effects = (
            data.get("enhance")
            or data.get("denoise")
            or data.get("vibrant")
            or data.get("print_dpi")
        )

        if resize_factor > 1.0 or has_effects:
            return upscale_image(data)
        else:
            return compress_image(data)

    elif action == "resize":
        # Check required params
        if "width" not in data or "height" not in data:
            return "ERROR: Missing width/height for resize."

        return resize_image(data)

    elif action == "hide_text":
        return hide_text(data)

    elif action == "reveal_text":
        return reveal_text(data)

    elif action == "get_info":
        return get_image_info(data)
    else:
        raise ValueError(f"Unknown action: {action}")
