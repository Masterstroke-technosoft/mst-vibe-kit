import fs from "node:fs";
import path from "node:path";

export function dirExistsAndNotEmpty(dir) {
  if (!fs.existsSync(dir)) return false;
  return fs.readdirSync(dir).length > 0;
}

export function copyDir(src, dest) {
  fs.cpSync(src, dest, { recursive: true, force: true });
}

// npm has historically mishandled files literally named `.gitignore` and
// `.npmrc` inside published packages, so templates store them without the
// leading dot and we rename them back once they land in the generated
// project.
const DOTFILES_TO_RESTORE = ["gitignore", "npmrc"];

export function restoreDotfiles(destDir) {
  for (const name of DOTFILES_TO_RESTORE) {
    const from = path.join(destDir, name);
    const to = path.join(destDir, `.${name}`);
    if (fs.existsSync(from)) {
      fs.renameSync(from, to);
    }
  }
}
