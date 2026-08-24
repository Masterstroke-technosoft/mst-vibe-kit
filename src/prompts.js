import prompts from "prompts";
import { TEMPLATES } from "./templates.js";
import { validateProjectName } from "./validate.js";

export async function promptForOptions(defaults) {
  const onCancel = () => {
    console.log("\nAborted.");
    process.exit(1);
  };

  const questions = [];

  if (!defaults.projectName) {
    questions.push({
      type: "text",
      name: "projectName",
      message: "Project name",
      initial: "my-mst-project",
      validate: (value) => {
        const { valid, problem } = validateProjectName(value);
        return valid ? true : problem;
      },
    });
  }

  if (!defaults.templateId) {
    questions.push({
      type: "select",
      name: "templateId",
      message: "Template",
      choices: TEMPLATES.map((t) => ({
        title: t.title,
        description: `${t.standard !== "—" ? t.standard + " · " : ""}${t.description}`,
        value: t.id,
      })),
      initial: 0,
    });
  }

  if (!defaults.packageManager) {
    questions.push({
      type: "select",
      name: "packageManager",
      message: "Package manager",
      choices: [
        { title: "pnpm", description: "fast, strict (recommended)", value: "pnpm" },
        { title: "npm", value: "npm" },
        { title: "yarn", value: "yarn" },
      ],
      initial: 0,
    });
  }

  if (defaults.git === undefined) {
    questions.push({
      type: "confirm",
      name: "git",
      message: "Initialize a git repository?",
      initial: true,
    });
  }

  const answers = await prompts(questions, { onCancel });
  return { ...defaults, ...answers };
}
