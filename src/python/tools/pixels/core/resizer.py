from PIL import Image
from .shared import load_image, save_image


def resize_image(data):
    """
    Resizes an image to specific dimensions.
    """
    try:
        image_bytes = bytes(data.get("image_data"))

        # Get target dimensions
        # Frontend ensures these are valid integers
        target_width = int(data.get("width"))
        target_height = int(data.get("height"))

        quality = int(data.get("quality", 90))
        target_format = data.get("format", "JPEG").upper()

        img = load_image(image_bytes)

        # Resize Logic
        mode = data.get("mode", "stretch")  # stretch | contain (fit with padding)
        fill_color = data.get("fill_color", "transparent")  # hex or transparent

        if mode == "contain" and (
            target_width != img.width or target_height != img.height
        ):
            # Calculate aspect ratio preserving size
            img_ratio = img.width / img.height
            target_ratio = target_width / target_height

            if img_ratio > target_ratio:
                # Image is wide, fit width
                new_w = target_width
                new_h = int(target_width / img_ratio)
            else:
                # Image is tall, fit height
                new_h = target_height
                new_w = int(target_height * img_ratio)

            resized_img = img.resize((new_w, new_h), Image.Resampling.LANCZOS)

            # Create background
            if fill_color == "transparent":
                bg = Image.new("RGBA", (target_width, target_height), (0, 0, 0, 0))
                # Ensure resized_img is RGBA
                if resized_img.mode != "RGBA":
                    resized_img = resized_img.convert("RGBA")
            else:
                # Handle hex color
                if fill_color.startswith("#"):
                    fill_color = fill_color.lstrip("#")
                    # Convert hex to RGB tuple
                    rgb = tuple(int(fill_color[i : i + 2], 16) for i in (0, 2, 4))
                    bg = Image.new("RGB", (target_width, target_height), rgb)
                    # Use RGB for non-transparent background
                else:
                    # Fallback to white if invalid
                    bg = Image.new(
                        "RGB", (target_width, target_height), (255, 255, 255)
                    )

            # Paste centered
            x = (target_width - new_w) // 2
            y = (target_height - new_h) // 2

            bg.paste(
                resized_img, (x, y), resized_img if resized_img.mode == "RGBA" else None
            )
            img = bg

        else:
            # Standard resize (Stretch)
            img = img.resize((target_width, target_height), Image.Resampling.LANCZOS)

        return save_image(img, target_format, quality)

    except Exception as e:
        return f"ERROR: {str(e)}"
