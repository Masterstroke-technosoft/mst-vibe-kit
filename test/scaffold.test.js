import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { scaffoldProject } from "../src/copyTemplate.js";
import { TEMPLATES } from "../src/templates.js";
import { validateProjectName } from "../src/validate.js";
import { parseArgs } from "../src/args.js";
import { dirExistsAndNotEmpty } from "../src/fsUtils.js";

function tmpDir() {
  return fs.mkdtempSync(path.join(os.tmpdir(), "create-mst-app-test-"));
}

for (const template of TEMPLATES) {
  test(`scaffolds the "${template.id}" template`, () => {
    const root = tmpDir();
    const targetDir = path.join(root, "my-mst-project");

    scaffoldProject({
      targetDir,
      projectName: "my-mst-project",
      templateId: template.id,
    });

    // common structure present
    for (const rel of [
      "package.json",
      "pnpm-workspace.yaml",
      "turbo.json",
      ".env.example",
      ".gitignore",
      "QUICKSTART.md",
      "packages/contracts/hardhat.config.ts",
      "packages/contracts/package.json",
      "packages/contracts/scripts/deploy.ts",
      "packages/contracts/scripts/verify.ts",
      "packages/contracts/deploy.config.ts",
      "packages/frontend/package.json",
      "packages/frontend/app/layout.tsx",
      "packages/frontend/app/page.tsx",
      "packages/frontend/lib/wagmi.ts",
      "packages/shared/src/contracts.ts",
      "packages/shared/src/constants.ts",
    ]) {
      assert.ok(fs.existsSync(path.join(targetDir, rel)), `missing ${rel}`);
    }

    // `gitignore` must be renamed to `.gitignore`, not left as-is
    assert.ok(!fs.existsSync(path.join(targetDir, "gitignore")));

    // placeholder substitution ran
    const pkg = JSON.parse(fs.readFileSync(path.join(targetDir, "package.json"), "utf8"));
    assert.equal(pkg.name, "my-mst-project");
    assert.ok(!JSON.stringify(pkg).includes("{{PROJECT_NAME}}"));

    const layout = fs.readFileSync(
      path.join(targetDir, "packages/frontend/app/layout.tsx"),
      "utf8"
    );
    assert.ok(!layout.includes("{{PROJECT_NAME}}"));
    assert.ok(layout.includes("my-mst-project"));

    // hardhat config carries the right chain ids / RPC urls
    const hardhatConfig = fs.readFileSync(
      path.join(targetDir, "packages/contracts/hardhat.config.ts"),
      "utf8"
    );
    assert.ok(hardhatConfig.includes("91562037"));
    assert.ok(hardhatConfig.includes("4646"));
    assert.ok(hardhatConfig.includes("testnetrpc.mstblockchain.com"));
    assert.ok(hardhatConfig.includes("mariorpc.mstblockchain.com"));

    fs.rmSync(root, { recursive: true, force: true });
  });
}

test("dirExistsAndNotEmpty detects a non-empty target directory", () => {
  const root = tmpDir();
  fs.writeFileSync(path.join(root, "keep.txt"), "hi");
  assert.equal(dirExistsAndNotEmpty(root), true);
  fs.rmSync(root, { recursive: true, force: true });
});

test("rejects invalid project names", () => {
  assert.equal(validateProjectName("My App").valid, false);
  assert.equal(validateProjectName("").valid, false);
  assert.equal(validateProjectName("my-app").valid, true);
});

test("parses CLI args", () => {
  const args = parseArgs(["my-app", "--template", "token", "--pm", "npm", "--no-git", "--yes"]);
  assert.equal(args.projectName, "my-app");
  assert.equal(args.template, "token");
  assert.equal(args.pm, "npm");
  assert.equal(args.git, false);
  assert.equal(args.yes, true);
});
