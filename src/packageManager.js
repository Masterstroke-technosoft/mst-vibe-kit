import { spawnSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";

// Turborepo 2.x refuses to resolve the workspace without a `packageManager`
// field (or devEngines.packageManager) in the root package.json, so we detect
// the actual installed version of whichever manager the user picked and pin
// it there. Falls back to a recent known-good version if detection fails
// (e.g. the manager isn't on PATH yet, or --skip-install was passed).
const FALLBACK_VERSIONS = {
  npm: "10.9.2",
  pnpm: "9.12.3",
  yarn: "1.22.22",
};

export function detectPackageManagerVersion(packageManager) {
  const result = spawnSync(packageManager, ["--version"], {
    encoding: "utf8",
    shell: process.platform === "win32",
  });
  const version = result.stdout?.trim();
  if (result.status === 0 && version) {
    return version;
  }
  return FALLBACK_VERSIONS[packageManager] ?? null;
}

// Writes the resolved `packageManager` field into the scaffolded project's
// root package.json. No-op if a version can't be resolved at all.
export function pinPackageManager(targetDir, packageManager) {
  const version = detectPackageManagerVersion(packageManager);
  if (!version) return;

  const pkgJsonPath = path.join(targetDir, "package.json");
  const pkgJson = JSON.parse(fs.readFileSync(pkgJsonPath, "utf8"));
  pkgJson.packageManager = `${packageManager}@${version}`;
  fs.writeFileSync(pkgJsonPath, JSON.stringify(pkgJson, null, 2) + "\n");
}
