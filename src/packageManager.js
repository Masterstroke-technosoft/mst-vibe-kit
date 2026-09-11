import { spawnSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";

export const SUPPORTED_PACKAGE_MANAGERS = ["npm", "pnpm", "yarn"];

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

// On Windows, npm/pnpm/yarn are installed as `.cmd` shims; `child_process`
// can only launch those directly (no shell) by naming the shim explicitly.
// Resolving the executable name this way lets every call here run with
// `shell: false` — args are passed as an argv array, never concatenated
// into a shell command line, so there's nothing for shell metacharacters
// in a package/project name to inject into.
function resolveExecutable(command) {
  return process.platform === "win32" ? `${command}.cmd` : command;
}

// Runs `<packageManager> --version` and reports both the version string and
// whether the manager was actually found on PATH, so callers can tell "it's
// installed, we just couldn't read its version" apart from "not installed".
export function checkPackageManager(packageManager) {
  const result = spawnSync(resolveExecutable(packageManager), ["--version"], {
    encoding: "utf8",
    shell: false,
  });
  const version = result.stdout?.trim();
  const installed = result.error === undefined && result.status === 0 && Boolean(version);
  return { installed, version: installed ? version : null };
}

export function isPackageManagerInstalled(packageManager) {
  return checkPackageManager(packageManager).installed;
}

export function detectPackageManagerVersion(packageManager) {
  const { version } = checkPackageManager(packageManager);
  return version ?? FALLBACK_VERSIONS[packageManager] ?? null;
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
