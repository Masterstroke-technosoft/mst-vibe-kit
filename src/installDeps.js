import { spawnSync } from "node:child_process";

const INSTALL_COMMANDS = {
  pnpm: ["pnpm", ["install"]],
  npm: ["npm", ["install"]],
  yarn: ["yarn", ["install"]],
};

export function installDependencies(targetDir, packageManager) {
  const [cmd, args] = INSTALL_COMMANDS[packageManager] ?? INSTALL_COMMANDS.npm;
  const result = spawnSync(cmd, args, {
    cwd: targetDir,
    stdio: "inherit",
    shell: process.platform === "win32",
  });
  return result.status === 0;
}
