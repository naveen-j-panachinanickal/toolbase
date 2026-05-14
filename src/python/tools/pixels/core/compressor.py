from PIL import Image
from .shared import load_image, save_image


def compress_image(data):
    """
    Compresses an image based on the provided parameters.
    Handles downscaling and format conversion.
    """
    try:
        image_bytes = bytes(data.get("image_data"))
        quality = int(data.get("quality", 80))
        target_format = data.get("format", "JPEG").upper()
        resize_factor = float(data.get("resize_factor", 1.0))

        img = load_image(image_bytes)

        # Resize if needed
        if resize_factor != 1.0:
            new_width = int(img.width * resize_factor)
            new_height = int(img.height * resize_factor)
            img = img.resize((new_width, new_height), Image.Resampling.LANCZOS)

        return save_image(img, target_format, quality)

    except Exception as e:
        return f"ERROR: {str(e)}"
