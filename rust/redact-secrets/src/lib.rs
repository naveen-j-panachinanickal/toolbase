use regex::{Regex, RegexBuilder};
use serde::{Deserialize, Serialize};
use std::collections::{BTreeMap, BTreeSet};
use wasm_bindgen::prelude::*;

#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
struct UserHints {
    #[serde(default)]
    keys: Vec<String>,
    #[serde(default)]
    literal_texts: Vec<String>,
    #[serde(default)]
    regex_patterns: Vec<String>,
}

#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
struct CustomConfigurations {
    #[serde(default = "default_style")]
    style: String,
    #[serde(default)]
    user_hints: Option<UserHints>,
}

#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
struct RedactRequest {
    content: String,
    #[serde(default)]
    custom_configurations: Option<CustomConfigurations>,
}

#[derive(Debug, Serialize)]
#[serde(rename_all = "camelCase")]
struct RedactSummary {
    total_masked: usize,
    by_type: BTreeMap<String, usize>,
}

#[derive(Debug, Serialize)]
#[serde(rename_all = "camelCase")]
struct RedactResponse {
    masked_content: String,
    summary: RedactSummary,
    entities: Vec<serde_json::Value>,
}

fn default_style() -> String {
    "full".to_string()
}

fn mask_text(text: &str, style: &str) -> String {
    match style {
        "partial" => {
            if text.chars().count() <= 4 {
                return "*".repeat(text.chars().count());
            }
            let prefix: String = text.chars().take(2).collect();
            let suffix: String = text
                .chars()
                .rev()
                .take(2)
                .collect::<Vec<_>>()
                .into_iter()
                .rev()
                .collect();
            format!("{}...{}", prefix, suffix)
        }
        "hash" => {
            use sha2::{Digest, Sha256};
            let mut hasher = Sha256::new();
            hasher.update(text.as_bytes());
            let hash = format!("{:x}", hasher.finalize());
            format!("{}...", &hash[..12])
        }
        _ => "[REDACTED]".to_string(),
    }
}

fn apply_simple_regex_mask(text: &str, regex: &Regex, style: &str) -> (String, usize) {
    let mut count = 0usize;
    let out = regex
        .replace_all(text, |caps: &regex::Captures| {
            count += 1;
            mask_text(caps.get(0).map(|m| m.as_str()).unwrap_or_default(), style)
        })
        .to_string();
    (out, count)
}

fn scan_email(text: &str, style: &str) -> (String, usize) {
    let regex = Regex::new(r"[a-zA-Z0-9_.+-]+@[a-zA-Z0-9-]+\.[a-zA-Z0-9-.]+")
        .expect("email regex is valid");
    apply_simple_regex_mask(text, &regex, style)
}

fn scan_ipv4(text: &str, style: &str) -> (String, usize) {
    let regex = Regex::new(r"\b\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}\b")
        .expect("ipv4 regex is valid");
    apply_simple_regex_mask(text, &regex, style)
}

fn scan_generic_api_key(text: &str, style: &str, keys: &[String]) -> (String, usize) {
    let mut all_keys: Vec<String> = vec![
        "api_key".to_string(),
        "secret".to_string(),
        "password".to_string(),
        "token".to_string(),
        "auth".to_string(),
        "aws_access".to_string(),
        "aws_secret".to_string(),
    ];
    for key in keys {
        let trimmed = key.trim();
        if !trimmed.is_empty() {
            all_keys.push(regex::escape(trimmed));
        }
    }

    let pattern = format!(
        r#"({})\s*[:=]\s*["']?([a-zA-Z0-9_\-/+=]{{4,}})["']?"#,
        all_keys.join("|")
    );

    let regex = match RegexBuilder::new(&pattern).case_insensitive(true).build() {
        Ok(re) => re,
        Err(_) => return (text.to_string(), 0),
    };

    let mut count = 0usize;
    let out = regex
        .replace_all(text, |caps: &regex::Captures| {
            let full = caps.get(0).map(|m| m.as_str()).unwrap_or_default();
            let Some(value_match) = caps.get(2) else {
                return full.to_string();
            };
            let full_start = caps.get(0).map(|m| m.start()).unwrap_or(0);
            let rel = value_match.start().saturating_sub(full_start);
            count += 1;
            format!("{}{}", &full[..rel], mask_text(value_match.as_str(), style))
        })
        .to_string();

    (out, count)
}

fn shannon_entropy(token: &str) -> f64 {
    if token.is_empty() {
        return 0.0;
    }

    let mut freq = BTreeMap::<char, usize>::new();
    for ch in token.chars() {
        *freq.entry(ch).or_insert(0) += 1;
    }

    let len = token.chars().count() as f64;
    freq.values().fold(0.0, |acc, count| {
        let p = (*count as f64) / len;
        if p > 0.0 {
            acc - p * p.log2()
        } else {
            acc
        }
    })
}

fn scan_smart_entropy(text: &str, style: &str, keys: &[String]) -> (String, usize) {
    let token_regex = Regex::new(r"[\w/+=]{8,}").expect("token regex is valid");
    let mut tokens = BTreeSet::<String>::new();
    for m in token_regex.find_iter(text) {
        tokens.insert(m.as_str().to_string());
    }

    let mut out = text.to_string();
    let mut count = 0usize;

    let mut context_keywords = vec![
        "key".to_string(),
        "secret".to_string(),
        "token".to_string(),
        "password".to_string(),
        "aws".to_string(),
        "auth".to_string(),
        "credential".to_string(),
    ];
    for key in keys {
        let k = key.trim().to_lowercase();
        if !k.is_empty() {
            context_keywords.push(k);
        }
    }

    for token in tokens {
        let entropy = shannon_entropy(&token);
        if entropy <= 3.5 {
            continue;
        }

        let idx = out.find(&token).unwrap_or(0);
        let start = idx.saturating_sub(30);
        let context = out[start..idx].to_lowercase();
        let near_context = context_keywords.iter().any(|kw| context.contains(kw));

        if near_context || entropy > 4.5 {
            let masked = mask_text(&token, style);
            out = out.replace(&token, &masked);
            count += 1;
        }
    }

    (out, count)
}

fn scan_user_defined(text: &str, style: &str, literals: &[String]) -> (String, usize) {
    let escaped: Vec<String> = literals
        .iter()
        .map(|s| s.trim())
        .filter(|s| !s.is_empty())
        .map(regex::escape)
        .collect();

    if escaped.is_empty() {
        return (text.to_string(), 0);
    }

    let pattern = format!("({})", escaped.join("|"));
    let regex = match Regex::new(&pattern) {
        Ok(re) => re,
        Err(_) => return (text.to_string(), 0),
    };

    apply_simple_regex_mask(text, &regex, style)
}

fn scan_custom_regex(text: &str, style: &str, patterns: &[String]) -> (String, usize) {
    let mut out = text.to_string();
    let mut total = 0usize;

    for pattern in patterns {
        if pattern.trim().is_empty() {
            continue;
        }
        let Ok(regex) = Regex::new(pattern) else {
            continue;
        };
        let mut count = 0usize;
        out = regex
            .replace_all(&out, |caps: &regex::Captures| {
                count += 1;
                mask_text(caps.get(0).map(|m| m.as_str()).unwrap_or_default(), style)
            })
            .to_string();
        total += count;
    }

    (out, total)
}

fn apply_scanner(
    by_type: &mut BTreeMap<String, usize>,
    total_masked: &mut usize,
    text: String,
    scanner_name: &str,
    scanner: impl FnOnce(&str) -> (String, usize),
) -> String {
    let (out, count) = scanner(&text);
    if count > 0 {
        *total_masked += count;
        *by_type.entry(scanner_name.to_string()).or_insert(0) += count;
    }
    out
}

#[wasm_bindgen]
pub fn redact_json(request_json: String) -> Result<String, JsValue> {
    let req: RedactRequest = serde_json::from_str(&request_json)
        .map_err(|err| JsValue::from_str(&format!("Invalid request: {err}")))?;

    let configs = req.custom_configurations.unwrap_or(CustomConfigurations {
        style: default_style(),
        user_hints: None,
    });
    let style_owned = if configs.style.trim().is_empty() {
        "full".to_string()
    } else {
        configs.style
    };
    let style = style_owned.as_str();

    let hints = configs.user_hints.unwrap_or(UserHints {
        keys: Vec::new(),
        literal_texts: Vec::new(),
        regex_patterns: Vec::new(),
    });

    let mut total_masked = 0usize;
    let mut by_type = BTreeMap::<String, usize>::new();

    let mut text = req.content;

    text = apply_scanner(&mut by_type, &mut total_masked, text, "Email Address", |t| {
        scan_email(t, style)
    });
    text = apply_scanner(&mut by_type, &mut total_masked, text, "Generic API Key", |t| {
        scan_generic_api_key(t, style, &hints.keys)
    });
    text = apply_scanner(&mut by_type, &mut total_masked, text, "IPv4 Address", |t| {
        scan_ipv4(t, style)
    });
    text = apply_scanner(
        &mut by_type,
        &mut total_masked,
        text,
        "Smart Entropy Detector",
        |t| scan_smart_entropy(t, style, &hints.keys),
    );
    text = apply_scanner(&mut by_type, &mut total_masked, text, "User Defined", |t| {
        scan_user_defined(t, style, &hints.literal_texts)
    });
    text = apply_scanner(&mut by_type, &mut total_masked, text, "Custom Regex", |t| {
        scan_custom_regex(t, style, &hints.regex_patterns)
    });

    let response = RedactResponse {
        masked_content: text,
        summary: RedactSummary {
            total_masked,
            by_type,
        },
        entities: vec![],
    };

    serde_json::to_string(&response).map_err(|err| JsValue::from_str(&err.to_string()))
}
