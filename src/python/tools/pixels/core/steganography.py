from PIL import Image
import io
import hashlib
import base64
import numpy as np


def _derive_key(password):
    """Derives a secure 32-byte key from the password using SHA-256."""
    if not password:
        return b""
    return hashlib.sha256(password.encode("utf-8")).digest()


def _xor_encrypt_decrypt(data, key):
    """Encrypts or decrypts data using XOR with the derived key (Stream Cipher)."""
    if not key:
        return data  # No encryption if key is empty/None

    key_len = len(key)
    # Use numpy for fast XOR if data is large, or simple loop for small text
    # Since text is usually small compared to image, simple loop is fine,
    # but let's use bytearray for mutable operations.
    result = bytearray(len(data))
    for i in range(len(data)):
        result[i] = data[i] ^ key[i % key_len]
    return result


def hide_text(data):
    """
    Hides text within an image using LSB steganography (NumPy Optimized).
    Args:
        data: dict containing 'image_data' (bytes), 'text' (str), and optional 'key' (str)
    Returns:
        bytes: The image with hidden text (PNG format).
    """
    try:
        image_bytes = bytes(data.get("image_data"))
        text = data.get("text", "")
        key = data.get("key", "")

        # Encryption logic
        if key:
            print(f"Encrypting with key (len={len(key)})...")
            text_bytes = text.encode("utf-8")
            derived_key = _derive_key(key)
            encrypted_bytes = _xor_encrypt_decrypt(text_bytes, derived_key)
            # Prefix with ENC: and create base64 string
            text = "ENC:" + base64.b64encode(encrypted_bytes).decode("utf-8")
        else:
            print("No encryption key provided. Hiding plaintext.")

        # Add delimiter
        text += "#####END#####"

        # Convert text to binary string
        binary_text = "".join(format(ord(char), "08b") for char in text)
        binary_len = len(binary_text)

        img = Image.open(io.BytesIO(image_bytes))

        # Ensure RGB or RGBA (preserve Alpha if present, usually better to stick to RGB for consistency in LSB)
        # But for full compatibility let's convert to RGB to ensure 3 channels per pixel
        # (RGBA handling is trickier with alpha transparency messing things up)
        if img.mode != "RGB":
            img = img.convert("RGB")

        # Convert to NumPy array
        arr = np.array(img)

        # Flatten the array to 1D (h * w * 3)
        flat_arr = arr.flatten()

        if binary_len > len(flat_arr):
            raise ValueError(
                f"Text too long. Max capacity: {len(flat_arr) // 8} bytes."
            )

        # Create a boolean mask for the bits we need to change
        # This is where we vectorize.
        # We need to set the LSB of the first N pixels to the bits of our secret.

        # Convert binary string to a numpy array of integers (0 or 1)
        # fast mapping: '0'->0, '1'->1
        secret_bits = np.array([int(b) for b in binary_text], dtype=np.uint8)

        # Get the pixel values that will be modified
        affected_pixels = flat_arr[:binary_len]

        # Clear LSB: bitwise AND with 11111110 (254)
        affected_pixels &= 254

        # Set LSB: bitwise OR with secret bits
        affected_pixels |= secret_bits

        # Put back into the flat array
        flat_arr[:binary_len] = affected_pixels

        # Reshape back to image dimensions
        new_arr = flat_arr.reshape(arr.shape)

        # Create image from array
        new_img = Image.fromarray(new_arr)

        output = io.BytesIO()
        new_img.save(
            output, format="PNG", compress_level=1
        )  # Low compression for speed, still lossless
        return output.getvalue()

    except Exception as e:
        import traceback

        traceback.print_exc()
        return str(e).encode("utf-8")


def reveal_text(data):
    """
    Reveals text hidden using LSB steganography (NumPy Optimized).
    Args:
        data: dict containing 'image_data' (bytes) and optional 'key' (str)
    Returns:
        str: The revealed text.
    """
    try:
        image_bytes = bytes(data.get("image_data"))
        key = data.get("key", "")

        img = Image.open(io.BytesIO(image_bytes))
        if img.mode != "RGB":
            img = img.convert("RGB")

        arr = np.array(img)
        flat_arr = arr.flatten()

        # Extract LSBs (bitwise AND 1)
        lsbs = flat_arr & 1

        # We need to find the delimiter "#####END#####"
        # Since we don't know the length, we could try to chunk it or convert all.
        # Converting ALL pixels to text is slow if image is large (millions of chars).
        # Optimization: Process in chunks of, say, 1024 characters (8192 bits) looking for the delimiter.

        delimiter = "#####END#####"
        delimiter_len = len(delimiter)
        chunk_size = 4096  # chars

        total_pixels = len(flat_arr)
        max_chars = total_pixels // 8

        decoded_text = ""
        found = False

        # Pack bits into bytes
        # np.packbits is very fast, but it packs 8 bits into a byte.
        # Our array is 0s and 1s.

        # Optimization: Pack the whole array at once?
        # If image is 1920x1080 = 2M pixels -> 2M bits -> 250KB text.
        # That's small enough to process all at once in JS, but Python string concat is slow.
        # bytearray is better.

        # Let's try to pack purely with numpy
        # bits are lsbs. We need to group them by 8.
        # Trim to multiple of 8
        num_bytes = total_pixels // 8
        trunc_lsbs = lsbs[: num_bytes * 8]

        # Reshape to (num_bytes, 8)
        bytes_as_bits = trunc_lsbs.reshape((num_bytes, 8))

        # Convert bits to bytes
        # Powers of 2: [128, 64, 32, 16, 8, 4, 2, 1]
        # BUT our previous encoding `format(ord(char), '08b')` puts MSB at index 0.
        # So we need to multiply by powers of 2.
        powers = np.array([128, 64, 32, 16, 8, 4, 2, 1], dtype=np.uint8)

        # dot product per row
        packed_bytes = np.dot(bytes_as_bits, powers)

        # Now we have a uint8 array of bytes. Convert to simple bytes object.
        raw_bytes = packed_bytes.tobytes()

        # Find delimiter efficiently in bytes
        delimiter_bytes = delimiter.encode("utf-8", errors="ignore")
        end_idx = raw_bytes.find(delimiter_bytes)

        if end_idx != -1:
            # Found it!
            extracted_bytes = raw_bytes[:end_idx]
            try:
                text = extracted_bytes.decode("utf-8")
            except UnicodeDecodeError:
                # If we found the delimiter but can't decode, encryption might clearly be the cause or random noise matching delimiter (rare)
                # But "ENC:" is ascii, so it should decode fine if it exists.
                return "Error decoding text. Data might be corrupted."

            # Check for encryption
            if text.startswith("ENC:"):
                if not key:
                    return "ERROR: Encrypted message detected.\n\nPlease enter the correct Decryption Key to view this message."

                try:
                    encrypted_b64 = text[4:]
                    encrypted_bytes = base64.b64decode(encrypted_b64)
                    derived_key = _derive_key(key)
                    decrypted_bytes = _xor_encrypt_decrypt(encrypted_bytes, derived_key)
                    return decrypted_bytes.decode("utf-8")
                except Exception:
                    return "ERROR: Decryption failed.\n\nThe key provided is incorrect."

            return text

        else:
            return "No hidden message found."

    except Exception as e:
        import traceback

        traceback.print_exc()
        return f"Error: {str(e)}"
