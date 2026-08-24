import fs from "node:fs";
import path from "node:path";

export function dirExistsAndNotEmpty(dir) {
  if (!fs.existsSync(dir)) return false;
  return fs.readdirSync(dir).length > 0;
}

export function copyDir(src, dest) {
  fs.cpSync(src, dest, { recursive: true, force: true });
}

// npm has historically mishandled files literally named `.gitignore` inside
// published packages, so templates store it as `gitignore` and we rename it
// back to `.gitignore` once it lands in the generated project.
export function restoreGitignore(destDir) {
  const from = path.join(destDir, "gitignore");
  const to = path.join(destDir, ".gitignore");
  if (fs.existsSync(from)) {
    fs.renameSync(from, to);
  }
}
