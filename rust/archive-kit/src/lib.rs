use std::io::{Cursor, Read, Write};

use base64::engine::general_purpose::STANDARD as B64;
use base64::Engine as _;
use flate2::read::GzDecoder;
use flate2::write::GzEncoder;
use flate2::Compression;
use serde::{Deserialize, Serialize};
use tar::{Archive as TarArchive, Builder as TarBuilder, Header as TarHeader};
use wasm_bindgen::prelude::*;
use zip::AesMode;
use zip::write::SimpleFileOptions;
use zip::{CompressionMethod, ZipArchive, ZipWriter};

#[derive(Debug, Deserialize)]
struct InputFile {
    name: String,
    bytes_b64: String,
}

#[derive(Debug, Deserialize)]
struct CreateOptions {
    zip_compression: Option<String>,
    password: Option<String>,
}

#[derive(Debug, Deserialize, Default)]
struct ExtractOptions {
    password: Option<String>,
}

#[derive(Debug, Serialize)]
struct Entry {
    name: String,
    size: usize,
    compressed_size: usize,
    is_directory: bool,
    format: String,
}

#[derive(Debug, Serialize)]
struct OutputFile {
    name: String,
    bytes_b64: String,
}

fn to_js_err<E: std::fmt::Display>(err: E) -> JsValue {
    JsValue::from_str(&err.to_string())
}

fn parse_files_json(files_json: &str) -> Result<Vec<(String, Vec<u8>)>, JsValue> {
    let files: Vec<InputFile> = serde_json::from_str(files_json).map_err(to_js_err)?;
    let mut decoded = Vec::with_capacity(files.len());
    for file in files {
        let bytes = B64.decode(file.bytes_b64.as_bytes()).map_err(to_js_err)?;
        decoded.push((file.name, bytes));
    }
    Ok(decoded)
}

fn create_zip(
    files: &[(String, Vec<u8>)],
    zip_compression: Option<&str>,
    password: Option<&str>,
) -> Result<Vec<u8>, JsValue> {
    let mut out = Cursor::new(Vec::<u8>::new());
    let mut zip = ZipWriter::new(&mut out);
    let mut options = match zip_compression.unwrap_or("store") {
        "store" => SimpleFileOptions::default().compression_method(CompressionMethod::Stored),
        "fast" => SimpleFileOptions::default()
            .compression_method(CompressionMethod::Deflated)
            .compression_level(Some(1)),
        "best" => SimpleFileOptions::default()
            .compression_method(CompressionMethod::Deflated)
            .compression_level(Some(9)),
        _ => SimpleFileOptions::default().compression_method(CompressionMethod::Stored),
    };
    if let Some(pwd) = password.filter(|p| !p.is_empty()) {
        options = options.with_aes_encryption(AesMode::Aes256, pwd);
    }

    for (name, bytes) in files {
        zip.start_file(name, options).map_err(to_js_err)?;
        zip.write_all(bytes).map_err(to_js_err)?;
    }
    zip.finish().map_err(to_js_err)?;
    Ok(out.into_inner())
}

fn create_tar(files: &[(String, Vec<u8>)]) -> Result<Vec<u8>, JsValue> {
    let mut out = Vec::<u8>::new();
    {
        let mut tar = TarBuilder::new(&mut out);
        for (name, bytes) in files {
            let mut header = TarHeader::new_gnu();
            header.set_size(bytes.len() as u64);
            header.set_mode(0o644);
            header.set_cksum();
            tar.append_data(&mut header, name, &bytes[..]).map_err(to_js_err)?;
        }
        tar.finish().map_err(to_js_err)?;
    }
    Ok(out)
}

fn create_tgz(files: &[(String, Vec<u8>)]) -> Result<Vec<u8>, JsValue> {
    let tar_bytes = create_tar(files)?;
    let mut encoder = GzEncoder::new(Vec::<u8>::new(), Compression::default());
    encoder.write_all(&tar_bytes).map_err(to_js_err)?;
    encoder.finish().map_err(to_js_err)
}

fn list_tar_entries_from_reader<R: Read>(reader: R, format: &str) -> Result<Vec<Entry>, JsValue> {
    let mut out = Vec::<Entry>::new();
    let mut tar = TarArchive::new(reader);
    let entries_iter = tar.entries().map_err(to_js_err)?;
    for item in entries_iter {
        let entry = item.map_err(to_js_err)?;
        let path = entry
            .path()
            .map_err(to_js_err)?
            .to_string_lossy()
            .to_string();
        let size = entry.size() as usize;
        let is_directory = entry.header().entry_type().is_dir() || path.ends_with('/');
        out.push(Entry {
            name: path,
            size,
            compressed_size: size,
            is_directory,
            format: format.to_string(),
        });
    }
    Ok(out)
}

fn extract_tar_files_from_reader<R: Read>(reader: R) -> Result<Vec<OutputFile>, JsValue> {
    let mut out = Vec::<OutputFile>::new();
    let mut tar = TarArchive::new(reader);
    let entries_iter = tar.entries().map_err(to_js_err)?;
    for item in entries_iter {
        let mut entry = item.map_err(to_js_err)?;
        let path = entry
            .path()
            .map_err(to_js_err)?
            .to_string_lossy()
            .to_string();
        if entry.header().entry_type().is_dir() || path.ends_with('/') {
            continue;
        }
        let mut buf = Vec::<u8>::new();
        entry.read_to_end(&mut buf).map_err(to_js_err)?;
        out.push(OutputFile {
            name: path,
            bytes_b64: B64.encode(buf),
        });
    }
    Ok(out)
}

#[wasm_bindgen]
pub fn create_archive_json(
    format: String,
    files_json: String,
    options_json: Option<String>,
) -> Result<String, JsValue> {
    let files = parse_files_json(&files_json)?;
    let options = options_json
        .as_deref()
        .map(|raw| serde_json::from_str::<CreateOptions>(raw).map_err(to_js_err))
        .transpose()?
        .unwrap_or(CreateOptions {
            zip_compression: Some("store".to_string()),
            password: None,
        });
    let bytes = match format.as_str() {
        "zip" => create_zip(
            &files,
            options.zip_compression.as_deref(),
            options.password.as_deref(),
        )?,
        "tar" => create_tar(&files)?,
        "tgz" => create_tgz(&files)?,
        _ => return Err(JsValue::from_str("Unsupported archive format")),
    };
    Ok(B64.encode(bytes))
}

#[wasm_bindgen]
pub fn list_archive_json(format: String, archive_bytes_b64: String) -> Result<String, JsValue> {
    let bytes = B64.decode(archive_bytes_b64.as_bytes()).map_err(to_js_err)?;
    list_archive_v2(format, bytes)
}

#[wasm_bindgen]
pub fn extract_archive_json(
    format: String,
    archive_bytes_b64: String,
    options_json: Option<String>,
) -> Result<String, JsValue> {
    let bytes = B64.decode(archive_bytes_b64.as_bytes()).map_err(to_js_err)?;
    let res = extract_archive_v2(format, bytes, options_json)?;
    // extract_archive_v2 returns a JSON string as JsValue
    Ok(res.as_string().unwrap_or_default())
}

#[wasm_bindgen]
pub fn create_archive_v2(
    format: String,
    names: Vec<String>,
    all_bytes: Vec<u8>,
    byte_offsets: Vec<u32>, // [end1, end2, end3, ...]
    options_json: Option<String>,
) -> Result<Vec<u8>, JsValue> {
    if names.len() != byte_offsets.len() {
        return Err(JsValue::from_str("Names and offsets count mismatch"));
    }

    let options = options_json
        .as_deref()
        .map(|raw| serde_json::from_str::<CreateOptions>(raw).map_err(to_js_err))
        .transpose()?
        .unwrap_or(CreateOptions {
            zip_compression: Some("store".to_string()),
            password: None,
        });

    let mut staged = Vec::with_capacity(names.len());
    let mut last_offset = 0;
    for (i, name) in names.into_iter().enumerate() {
        let offset = byte_offsets[i] as usize;
        if offset < last_offset || offset > all_bytes.len() {
            return Err(JsValue::from_str("Invalid byte offset"));
        }
        staged.push((name, all_bytes[last_offset..offset].to_vec()));
        last_offset = offset;
    }

    let bytes = match format.as_str() {
        "zip" => create_zip(
            &staged,
            options.zip_compression.as_deref(),
            options.password.as_deref(),
        )?,
        "tar" => create_tar(&staged)?,
        "tgz" => create_tgz(&staged)?,
        _ => return Err(JsValue::from_str("Unsupported archive format")),
    };
    Ok(bytes)
}

#[wasm_bindgen]
pub fn list_archive_v2(format: String, bytes: Vec<u8>) -> Result<String, JsValue> {
    let entries = match format.as_str() {
        "zip" => {
            let mut zip = ZipArchive::new(Cursor::new(bytes)).map_err(to_js_err)?;
            let mut out = Vec::<Entry>::with_capacity(zip.len());
            for i in 0..zip.len() {
                let file = zip.by_index(i).map_err(to_js_err)?;
                out.push(Entry {
                    name: file.name().to_string(),
                    size: file.size() as usize,
                    compressed_size: file.compressed_size() as usize,
                    is_directory: file.is_dir(),
                    format: "zip".to_string(),
                });
            }
            out
        }
        "tar" => {
            list_tar_entries_from_reader(Cursor::new(bytes), "tar")?
        }
        "tgz" => list_tar_entries_from_reader(GzDecoder::new(Cursor::new(bytes)), "tgz")?,
        _ => return Err(JsValue::from_str("Unsupported archive format")),
    };

    serde_json::to_string(&entries).map_err(to_js_err)
}

#[wasm_bindgen]
pub fn extract_archive_v2(
    format: String,
    archive_bytes: Vec<u8>,
    options_json: Option<String>,
) -> Result<JsValue, JsValue> {
    let extract_options = options_json
        .as_deref()
        .map(|raw| serde_json::from_str::<ExtractOptions>(raw).map_err(to_js_err))
        .transpose()?
        .unwrap_or_default();
    let password = extract_options
        .password
        .as_deref()
        .filter(|p| !p.is_empty())
        .map(|p| p.as_bytes());

    match format.as_str() {
        "zip" => {
            let mut zip = ZipArchive::new(Cursor::new(archive_bytes)).map_err(to_js_err)?;
            let mut out = Vec::<OutputFile>::new();
            for i in 0..zip.len() {
                let mut file = match password {
                    Some(pwd) => zip.by_index_decrypt(i, pwd).map_err(to_js_err)?,
                    None => zip.by_index(i).map_err(to_js_err)?,
                };
                if file.is_dir() {
                    continue;
                }
                let mut buf = Vec::<u8>::new();
                file.read_to_end(&mut buf).map_err(to_js_err)?;
                out.push(OutputFile {
                    name: file.name().to_string(),
                    bytes_b64: B64.encode(buf),
                });
            }
            let res = serde_json::to_string(&out).map_err(to_js_err)?;
            Ok(JsValue::from_str(&res))
        }
        "tar" => {
            let files = extract_tar_files_from_reader(Cursor::new(archive_bytes))?;
            Ok(JsValue::from_str(&serde_json::to_string(&files).map_err(to_js_err)?))
        }
        "tgz" => {
            let files = extract_tar_files_from_reader(GzDecoder::new(Cursor::new(archive_bytes)))?;
            Ok(JsValue::from_str(&serde_json::to_string(&files).map_err(to_js_err)?))
        }
        _ => Err(JsValue::from_str("Unsupported archive format")),
    }
}



