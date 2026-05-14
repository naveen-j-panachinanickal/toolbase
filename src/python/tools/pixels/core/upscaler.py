from PIL import Image, ImageEnhance, ImageFilter
from .shared import load_image, save_image


def upscale_image(data):
    """
    Upscales and enhances an image.
    """
    try:
        image_bytes = bytes(data.get("image_data"))
        quality = int(data.get("quality", 90))  # Higher default for upscale
        target_format = data.get("format", "JPEG").upper()
        resize_factor = float(data.get("resize_factor", 1.0))

        img = load_image(image_bytes)

        # Resize
        if resize_factor != 1.0:
            new_width = int(img.width * resize_factor)
            new_height = int(img.height * resize_factor)
            img = img.resize((new_width, new_height), Image.Resampling.LANCZOS)

        # Ensure RGBA for effects
        needs_effects = (
            data.get("denoise")
            or data.get("vibrant")
            or (data.get("enhance") and resize_factor > 1.0)
        )

        if needs_effects and img.mode not in ("RGB", "RGBA"):
            img = img.convert("RGBA")

        # Denoise
        if data.get("denoise"):
            img = img.filter(ImageFilter.MedianFilter(size=3))

        # Vibrant
        if data.get("vibrant"):
            color_enhancer = ImageEnhance.Color(img)
            img = color_enhancer.enhance(1.2)
            contrast_enhancer = ImageEnhance.Contrast(img)
            img = contrast_enhancer.enhance(1.05)

        # Enhance / Sharpen
        if data.get("enhance") and resize_factor > 1.0:
            if img.mode in ("RGBA", "LA") or (
                img.mode == "P" and "transparency" in img.info
            ):
                if img.mode != "RGBA":
                    try:
                        img = img.convert("RGBA")
                    except:
                        pass

                if img.mode == "RGBA":
                    source_bands = img.split()
                    rgb_img = Image.merge("RGB", source_bands[:3])
                    mask = source_bands[3]
                    enhancer = ImageEnhance.Sharpness(rgb_img)
                    sharpened_rgb = enhancer.enhance(1.5)
                    img = Image.merge("RGBA", (*sharpened_rgb.split(), mask))
            else:
                enhancer = ImageEnhance.Sharpness(img)
                img = enhancer.enhance(1.5)

        save_kwargs = {}
        if data.get("print_dpi") and target_format in ("JPEG", "JPG", "PNG"):
            save_kwargs["dpi"] = (300, 300)

        return save_image(img, target_format, quality, **save_kwargs)

    except Exception as e:
        return f"ERROR: {str(e)}"
