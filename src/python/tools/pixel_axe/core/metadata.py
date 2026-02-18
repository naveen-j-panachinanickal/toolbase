import io
from PIL import Image, ImageOps


def get_image_info(data):
    """
    Extracts metadata from an image.

    Args:
        data (dict): Contains 'image_data' (bytes).

    Returns:
        dict: Image metadata (format, width, height, mode).
    """
    try:
        image_bytes = bytes(data.get("image_data"))
        img = Image.open(io.BytesIO(image_bytes))

        original_format = img.format  # Capture format before any operations

        # Bake EXIF orientation for correct dimensions
        # This returns a new image if transposed, or the original if not
        transposed_img = ImageOps.exif_transpose(img)
        if transposed_img:
            img = transposed_img

        return {
            "format": original_format,
            "width": img.width,
            "height": img.height,
            "mode": img.mode,
            "size_bytes": len(image_bytes),
        }
    except Exception as e:
        return {"error": str(e)}
