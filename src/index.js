import path from "node:path";
import fs from "node:fs";
import pc from "picocolors";
import { promptForOptions } from "./prompts.js";
import { getTemplate, TEMPLATES } from "./templates.js";
import { validateProjectName } from "./validate.js";
import { dirExistsAndNotEmpty } from "./fsUtils.js";
import { scaffoldProject } from "./copyTemplate.js";
import { installDependencies } from "./installDeps.js";
import { isGitAvailable, initGitRepo } from "./git.js";
import { parseArgs } from "./args.js";
import { pinPackageManager, isPackageManagerInstalled, SUPPORTED_PACKAGE_MANAGERS } from "./packageManager.js";

const HELP = `
${pc.bold("create-mst-app")} — scaffold a full-stack MST blockchain project

${pc.bold("Usage")}
  npx create-mst-app [project-name] [options]

${pc.bold("Options")}
  --template <name>     ${TEMPLATES.map((t) => t.id).join(", ")}
  --pm <manager>        pnpm | npm | yarn
  --git / --no-git      initialize a git repository
  --skip-install        skip dependency installation
  -y, --yes             accept defaults, skip prompts
  -h, --help            show this help
`;

export async function run(argv) {
  const args = parseArgs(argv);

  if (args.help) {
    console.log(HELP);
    return;
  }

  if (args.template && !getTemplate(args.template)) {
    throw new Error(
      `Unknown template "${args.template}". Choose one of: ${TEMPLATES.map((t) => t.id).join(", ")}`
    );
  }

  if (args.pm && !SUPPORTED_PACKAGE_MANAGERS.includes(args.pm)) {
    throw new Error(
      `Unsupported package manager "${args.pm}". Use ${SUPPORTED_PACKAGE_MANAGERS.join(", ")}.`
    );
  }

  const defaults = {
    projectName: args.projectName,
    templateId: args.template,
    packageManager: args.pm,
    git: args.git,
  };

  if (args.yes) {
    defaults.projectName ??= "my-mst-project";
    defaults.templateId ??= TEMPLATES[0].id;
    defaults.packageManager ??= "pnpm";
    defaults.git ??= true;
  }

  console.log(`\n${pc.bold(pc.cyan("⚡ create-mst-app"))}\n`);

  const opts = await promptForOptions(defaults);

  const nameCheck = validateProjectName(opts.projectName);
  if (!nameCheck.valid) {
    throw new Error(nameCheck.problem);
  }

  const targetDir = path.resolve(process.cwd(), opts.projectName);

  if (dirExistsAndNotEmpty(targetDir)) {
    throw new Error(
      `Directory "${opts.projectName}" already exists and is not empty. Choose a different name or remove it first.`
    );
  }

  console.log(`\nCreating a new MST project in ${pc.green(targetDir)}\n`);

  scaffoldProject({
    targetDir,
    projectName: path.basename(targetDir),
    templateId: opts.templateId,
    packageManager: opts.packageManager,
  });

  console.log(pc.green(`✓ Created project ${opts.projectName}`));

  fs.copyFileSync(path.join(targetDir, ".env.example"), path.join(targetDir, ".env.local"));
  pinPackageManager(targetDir, opts.packageManager);

  if (!args.skipInstall && opts.packageManager !== "npm" && !isPackageManagerInstalled(opts.packageManager)) {
    console.log(
      pc.yellow(
        `\n⚠ ${opts.packageManager} isn't installed (or isn't on PATH), so dependencies weren't installed.\n` +
          `  Install it first:\n\n` +
          `    npm install -g ${opts.packageManager}\n\n` +
          `  Then run:\n\n` +
          `    cd ${opts.projectName} && ${opts.packageManager} install\n`
      )
    );
  } else if (!args.skipInstall) {
    console.log(`\nInstalling dependencies with ${pc.bold(opts.packageManager)}...\n`);
    const ok = installDependencies(targetDir, opts.packageManager);
    if (ok) {
      console.log(pc.green("✓ Installed dependencies"));
    } else {
      console.log(
        pc.yellow(
          `⚠ Dependency installation failed. Run "${opts.packageManager} install" manually inside ${opts.projectName}.`
        )
      );
    }
  } else {
    console.log(pc.dim("Skipped dependency installation (--skip-install)."));
  }

  if (opts.git && isGitAvailable()) {
    initGitRepo(targetDir);
    console.log(pc.green("✓ Initialized git repository"));
  }

  console.log(`
${pc.bold("Next steps:")}

  cd ${opts.projectName}
  ${opts.packageManager === "npm" ? "npm run dev" : `${opts.packageManager} dev`}

Read ${pc.underline("QUICKSTART.md")} for the first deployment.
`);
}
