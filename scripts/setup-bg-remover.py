
import os
import urllib.request
import tarfile
import shutil
import glob
from urllib.error import HTTPError

PACKAGE_VERSION = "1.7.0"
PUBLIC_DIR = os.path.join(os.getcwd(), 'public', 'imgly')
TEMP_tgz = os.path.join(os.getcwd(), 'package.tgz')

# Primary URL for img.ly assets
# Note: Sometimes static.img.ly is preferred over staticimgly.com
URLS = [
    f"https://static.img.ly/background-removal-data/{PACKAGE_VERSION}/dist.tgz",
    f"https://static.img.ly/background-removal-data/{PACKAGE_VERSION}/package.tgz",
    f"https://staticimgly.com/@imgly/background-removal-data/{PACKAGE_VERSION}/package.tgz"
]

def setup_models():
    print("Setting up Background Removal Assets...")
    
    # 1. Check if assets already exist
    if os.path.exists(PUBLIC_DIR) and os.path.exists(os.path.join(PUBLIC_DIR, 'isnet.wasm')):
        print("Assets seem to be already installed in public/imgly.")
        # Optional: Force reinstall? For now, just return.
        # return

    if not os.path.exists(PUBLIC_DIR):
        os.makedirs(PUBLIC_DIR)

    # 2. Download
    success = False
    for url in URLS:
        print(f"Attempting download from {url}...")
        try:
            req = urllib.request.Request(
                url, 
                data=None, 
                headers={
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)'
                }
            )
            with urllib.request.urlopen(req) as response, open(TEMP_tgz, 'wb') as out_file:
                shutil.copyfileobj(response, out_file)
            print("Download successful.")
            success = True
            break
        except HTTPError as e:
            print(f"Failed: {e.code} {e.reason}")
        except Exception as e:
            print(f"Error: {e}")

    if not success:
        print("Could not download assets. Please check your internet connection.")
        return

    # 3. Extract
    print("Extracting...")
    try:
        with tarfile.open(TEMP_tgz, "r:gz") as tar:
            tar.extractall(path=os.getcwd()) # Extracts to 'package/dist' or 'dist' usually
    except Exception as e:
        print(f"Extraction failed: {e}")
        return

    # 4. Move to public/imgly
    # Check for 'package/dist' or 'dist'
    source_dir = os.path.join(os.getcwd(), 'package', 'dist')
    if not os.path.exists(source_dir):
        source_dir = os.path.join(os.getcwd(), 'dist')
        
    if os.path.exists(source_dir):
        files = glob.glob(os.path.join(source_dir, '*'))
        print(f"Moving {len(files)} files to {PUBLIC_DIR}...")
        for f in files:
            dest = os.path.join(PUBLIC_DIR, os.path.basename(f))
            if os.path.exists(dest):
                try:
                    os.remove(dest)
                except OSError:
                    pass # Ignore if can't remove
            try:
                shutil.move(f, PUBLIC_DIR)
            except Exception as e:
                print(f"Error moving {os.path.basename(f)}: {e}")
        
        # Cleanup source dir
        if 'package' in source_dir:
             shutil.rmtree(os.path.join(os.getcwd(), 'package'))
    else:
        print("Could not find extracted files.")

    # 5. Cleanup temp file
    if os.path.exists(TEMP_tgz):
        os.remove(TEMP_tgz)

    print("Setup complete.")

if __name__ == "__main__":
    setup_models()
