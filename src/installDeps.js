import { spawnSync } from "node:child_process";
import { SUPPORTED_PACKAGE_MANAGERS } from "./packageManager.js";

export function installDependencies(targetDir, packageManager) {
  if (!SUPPORTED_PACKAGE_MANAGERS.includes(packageManager)) {
    throw new Error(
      `Unsupported package manager "${packageManager}". Use ${SUPPORTED_PACKAGE_MANAGERS.join(", ")}.`
    );
  }

  // No `shell: true` — the executable is resolved explicitly (the `.cmd`
  // shim on Windows) and args are passed as an argv array, so there's
  // nothing for shell metacharacters to reach.
  const executable = process.platform === "win32" ? `${packageManager}.cmd` : packageManager;
  const result = spawnSync(executable, ["install"], {
    cwd: targetDir,
    stdio: "inherit",
    shell: false,
  });
  return result.status === 0;
}
