import io
from PIL import Image, ImageOps

# Disable decompression bomb error for large upscales
Image.MAX_IMAGE_PIXELS = None


def load_image(image_bytes):
    """
    Loads an image from bytes and handles EXIF orientation.
    """
    img = Image.open(io.BytesIO(image_bytes))
    img = ImageOps.exif_transpose(img)
    return img


def save_image(img, target_format, quality=80, **kwargs):
    """
    Saves an image to bytes with specified format and quality.
    """
    # Handle transparency for JPEG
    if target_format == "JPEG" and img.mode in ("RGBA", "P"):
        img = img.convert("RGB")

    output_buffer = io.BytesIO()
    save_args = {"quality": quality}

    if target_format == "WEBP":
        save_args["method"] = 6  # Best compression

    # Add any extra arguments (e.g. dpi)
    save_args.update(kwargs)

    img.save(output_buffer, format=target_format, **save_args)
    return output_buffer.getvalue()
