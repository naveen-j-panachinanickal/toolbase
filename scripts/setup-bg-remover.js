
import fs from 'fs';
import path from 'path';
import { Readable } from 'stream';
import { finished } from 'stream/promises';
import { execSync } from 'child_process';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PACKAGE_VERSION = "1.7.0";
const ROOT_DIR = path.resolve(__dirname, '..');
const PUBLIC_DIR = path.join(ROOT_DIR, 'public', 'imgly');
const TEMP_TGZ = path.join(ROOT_DIR, 'package.tgz');

// URLs to try
const URLS = [
    `https://static.img.ly/background-removal-data/${PACKAGE_VERSION}/dist.tgz`,
    `https://static.img.ly/background-removal-data/${PACKAGE_VERSION}/package.tgz`,
    `https://staticimgly.com/@imgly/background-removal-data/${PACKAGE_VERSION}/package.tgz`
];

async function downloadFile(url, dest) {
    const res = await fetch(url);
    if (!res.ok) throw new Error(`Failed to fetch ${url}: ${res.statusText}`);
    const fileStream = fs.createWriteStream(dest);
    await finished(Readable.fromWeb(res.body).pipe(fileStream));
}

async function setup() {
    console.log("Setting up Background Removal Assets (Node.js)...");

    if (fs.existsSync(PUBLIC_DIR) && fs.existsSync(path.join(PUBLIC_DIR, 'isnet.wasm'))) {
        console.log("Assets appear to be already installed in public/imgly.");
        // Check if directory is empty or has enough files
        const files = fs.readdirSync(PUBLIC_DIR);
        if (files.length > 5) {
            return;
        }
    }

    if (!fs.existsSync(PUBLIC_DIR)) {
        fs.mkdirSync(PUBLIC_DIR, { recursive: true });
    }

    // 1. Download
    let downloaded = false;
    for (const url of URLS) {
        try {
            console.log(`Attempting download from ${url}...`);
            await downloadFile(url, TEMP_TGZ);
            console.log("Download successful.");
            downloaded = true;
            break;
        } catch (e) {
            console.error(`Failed to download from ${url}:`, e.message);
        }
    }

    if (!downloaded) {
        console.error("Could not download assets from any source.");
        process.exit(1);
    }

    // 2. Extract
    console.log("Extracting...");
    try {
        // Use system tar command (available on Windows 10+ and Linux/Mac)
        // Extract to current directory
        execSync(`tar -xf "${TEMP_TGZ}" -C "${ROOT_DIR}"`);
    } catch (e) {
        console.error("Extraction failed:", e.message);
        // Fallback or exit?
        process.exit(1);
    }

    // 3. Move files
    // The tar usually extracts to 'package/dist' or 'dist'
    let sourceDir = path.join(ROOT_DIR, 'package', 'dist');
    if (!fs.existsSync(sourceDir)) {
        sourceDir = path.join(ROOT_DIR, 'dist');
    }

    if (fs.existsSync(sourceDir)) {
        console.log(`Moving files from ${sourceDir} to ${PUBLIC_DIR}...`);
        const files = fs.readdirSync(sourceDir);
        for (const file of files) {
            const src = path.join(sourceDir, file);
            const dest = path.join(PUBLIC_DIR, file);

            // Remove dest if exists
            if (fs.existsSync(dest)) fs.rmSync(dest);

            fs.renameSync(src, dest);
        }

        // Cleanup empty dirs
        if (sourceDir.includes('package')) {
            fs.rmSync(path.join(ROOT_DIR, 'package'), { recursive: true, force: true });
        } else if (fs.existsSync(sourceDir)) {
            fs.rmSync(sourceDir, { recursive: true, force: true });
        }
    } else {
        console.error("Could not find extracted directory.");
    }

    // 4. Cleanup Zip
    if (fs.existsSync(TEMP_TGZ)) fs.rmSync(TEMP_TGZ);

    console.log("Setup complete.");
}

setup().catch(err => {
    console.error("Setup failed:", err);
    process.exit(1);
});
