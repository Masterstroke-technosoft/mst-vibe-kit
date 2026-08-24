import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { copyDir, restoreGitignore } from "./fsUtils.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const TEMPLATES_ROOT = path.join(__dirname, "..", "templates");

const TEXT_EXTENSIONS = new Set([
  ".json",
  ".md",
  ".ts",
  ".tsx",
  ".js",
  ".jsx",
  ".sol",
  ".css",
  ".yml",
  ".yaml",
  "",
]);

function substitutePlaceholders(dir, replacements) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      substitutePlaceholders(full, replacements);
      continue;
    }
    const ext = path.extname(entry.name);
    if (!TEXT_EXTENSIONS.has(ext)) continue;

    let content = fs.readFileSync(full, "utf8");
    let changed = false;
    for (const [token, value] of Object.entries(replacements)) {
      if (content.includes(token)) {
        content = content.split(token).join(value);
        changed = true;
      }
    }
    if (changed) fs.writeFileSync(full, content);
  }
}

export function scaffoldProject({ targetDir, projectName, templateId }) {
  fs.mkdirSync(targetDir, { recursive: true });

  copyDir(path.join(TEMPLATES_ROOT, "base"), targetDir);
  copyDir(path.join(TEMPLATES_ROOT, "contracts", templateId), targetDir);

  restoreGitignore(targetDir);

  substitutePlaceholders(targetDir, {
    "{{PROJECT_NAME}}": projectName,
  });
}
