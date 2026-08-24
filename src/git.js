import { spawnSync } from "node:child_process";

export function isGitAvailable() {
  const result = spawnSync("git", ["--version"], { stdio: "ignore" });
  return result.status === 0;
}

export function initGitRepo(targetDir) {
  spawnSync("git", ["init"], { cwd: targetDir, stdio: "ignore" });
  spawnSync("git", ["add", "-A"], { cwd: targetDir, stdio: "ignore" });
  spawnSync("git", ["commit", "-m", "chore: initial commit from create-mst-app"], {
    cwd: targetDir,
    stdio: "ignore",
  });
}
