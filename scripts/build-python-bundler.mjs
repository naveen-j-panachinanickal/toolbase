import fs from "fs";
import path from "path";

const ROOT = process.cwd();
const TOOLS_DIR = path.join(ROOT, "src/python/tools");
const OUTPUT_DIR = path.join(ROOT, "src/python/bundles");

function getAllPythonFiles(dir) {
  let results = [];
  if (!fs.existsSync(dir)) return results;

  const list = fs.readdirSync(dir);
  list.forEach((file) => {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);
    if (stat && stat.isDirectory()) {
      results = results.concat(getAllPythonFiles(filePath));
    } else if (file.endsWith(".py")) {
      results.push(filePath);
    }
  });
  return results;
}

function buildBundle() {
  if (!fs.existsSync(TOOLS_DIR)) {
    console.warn(`Tools directory not found: ${TOOLS_DIR}`);
    return;
  }

  const tools = fs.readdirSync(TOOLS_DIR).filter((file) => {
    return fs.statSync(path.join(TOOLS_DIR, file)).isDirectory();
  });

  for (const tool of tools) {
    const toolDir = path.join(TOOLS_DIR, tool);
    const pythonFiles = getAllPythonFiles(toolDir);
    const filesRecord = {};

    for (const fullPath of pythonFiles) {
      let relativePath = path.relative(path.join(ROOT, "src/python"), fullPath);
      relativePath = relativePath.replace(/\\/g, "/").replace(/-/g, "_");
      const code = fs.readFileSync(fullPath, "utf8");
      filesRecord[relativePath] = code;
    }

    const tsOutput = `/**
 * ⚠️ AUTO-GENERATED FILE
 * DO NOT EDIT MANUALLY
 */

export const PYTHON_FILES: Record<string, string> = ${JSON.stringify(filesRecord, null, 2)};

export const PYTHON_RUNTIME = Object.values(PYTHON_FILES).join("\\n\\n");
`;

    const outputFileName = `${tool}.bundle.ts`;
    const outputPath = path.join(OUTPUT_DIR, outputFileName);

    fs.mkdirSync(OUTPUT_DIR, { recursive: true });
    fs.writeFileSync(outputPath, tsOutput, "utf8");

    console.log(`✓ ${tool} bundle generated (${pythonFiles.length} files) -> ${outputFileName}`);
  }
}

buildBundle();

