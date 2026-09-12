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
import { pinPackageManager } from "../src/packageManager.js";

function tmpDir() {
  return fs.mkdtempSync(path.join(os.tmpdir(), "create-mst-app-test-"));
}

// Files unique to each template overlay — proves the right contracts/hooks
// actually landed, not just the common base structure.
const TEMPLATE_SPECIFIC_FILES = {
  blank: [
    "packages/contracts/contracts/Hello.sol",
    "packages/contracts/test/Hello.test.ts",
    "packages/frontend/hooks/useHello.ts",
  ],
  token: [
    "packages/contracts/contracts/MyToken.sol",
    "packages/contracts/test/MyToken.test.ts",
    "packages/frontend/hooks/useToken.ts",
    "packages/frontend/hooks/useTransfer.ts",
  ],
  rwa: [
    "packages/contracts/contracts/RWAShareToken.sol",
    "packages/contracts/test/RWAShareToken.test.ts",
    "packages/frontend/hooks/useRWAToken.ts",
    "packages/frontend/hooks/useWhitelist.ts",
    "packages/frontend/hooks/useRedemption.ts",
  ],
  defi: [
    "packages/contracts/contracts/ProjectToken.sol",
    "packages/contracts/contracts/Staking.sol",
    "packages/contracts/contracts/Vesting.sol",
    "packages/contracts/test/Staking.test.ts",
    "packages/contracts/test/Vesting.test.ts",
    "packages/frontend/hooks/useStaking.ts",
    "packages/frontend/hooks/useVesting.ts",
  ],
};

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
      ".npmrc",
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

    // `gitignore`/`npmrc` must be renamed to their dotfile form, not left as-is
    assert.ok(!fs.existsSync(path.join(targetDir, "gitignore")));
    assert.ok(!fs.existsSync(path.join(targetDir, "npmrc")));

    const npmrc = fs.readFileSync(path.join(targetDir, ".npmrc"), "utf8");
    assert.match(npmrc, /link-workspace-packages\s*=\s*true/);

    // the internal `shared` package must be published under a project-scoped
    // name, not the bare "shared" — a real "shared" npm package exists (and
    // pulls in mongodb/bson), so a plain range on that name can silently
    // resolve to the registry instead of packages/shared.
    const sharedPkg = JSON.parse(
      fs.readFileSync(path.join(targetDir, "packages/shared/package.json"), "utf8")
    );
    assert.equal(sharedPkg.name, "my-mst-project-shared");

    const frontendPkg = JSON.parse(
      fs.readFileSync(path.join(targetDir, "packages/frontend/package.json"), "utf8")
    );
    assert.ok("my-mst-project-shared" in frontendPkg.dependencies);
    assert.ok(!("shared" in frontendPkg.dependencies));
    // npm rejects the `workspace:` protocol outright (EUNSUPPORTEDPROTOCOL);
    // this default (no packageManager passed) must produce an npm-safe range.
    assert.equal(frontendPkg.dependencies["my-mst-project-shared"], "*");

    const nextConfig = fs.readFileSync(
      path.join(targetDir, "packages/frontend/next.config.js"),
      "utf8"
    );
    assert.match(nextConfig, /transpilePackages:\s*\["my-mst-project-shared"\]/);

    // this template's own contracts/tests/hooks landed
    for (const rel of TEMPLATE_SPECIFIC_FILES[template.id] ?? []) {
      assert.ok(fs.existsSync(path.join(targetDir, rel)), `missing ${rel}`);
    }

    // every hook importing shared state must resolve to the scoped package
    // name, not the bare "shared" that collides with the registry package
    for (const rel of TEMPLATE_SPECIFIC_FILES[template.id] ?? []) {
      if (!rel.startsWith("packages/frontend/hooks/")) continue;
      const content = fs.readFileSync(path.join(targetDir, rel), "utf8");
      if (!content.includes("deployments")) continue;
      assert.ok(
        content.includes('from "my-mst-project-shared"'),
        `${rel} should import from the scoped shared package name`
      );
      assert.ok(!content.includes('from "shared"'), `${rel} still imports bare "shared"`);
    }

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

test("pnpm projects get the shared dependency pinned with workspace:*", () => {
  const root = tmpDir();
  const targetDir = path.join(root, "my-mst-project");

  scaffoldProject({
    targetDir,
    projectName: "my-mst-project",
    templateId: TEMPLATES[0].id,
    packageManager: "pnpm",
  });

  const frontendPkg = JSON.parse(
    fs.readFileSync(path.join(targetDir, "packages/frontend/package.json"), "utf8")
  );
  // plain "*" resolves against the public registry first on pnpm and, since
  // "my-mst-project-shared" doesn't exist there, install fails outright
  // (ERR_PNPM_MALFORMED_METADATA) instead of linking packages/shared.
  assert.equal(frontendPkg.dependencies["my-mst-project-shared"], "workspace:*");

  fs.rmSync(root, { recursive: true, force: true });
});

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

test("pinPackageManager writes a packageManager field turbo can resolve", () => {
  const root = tmpDir();
  const targetDir = path.join(root, "my-mst-project");
  scaffoldProject({ targetDir, projectName: "my-mst-project", templateId: TEMPLATES[0].id });

  // node is always on PATH in this test environment, but npm may not be
  // depending on how it was invoked — either way pinPackageManager must not
  // throw, and must fall back to a known-good version if detection fails.
  pinPackageManager(targetDir, "npm");

  const pkg = JSON.parse(fs.readFileSync(path.join(targetDir, "package.json"), "utf8"));
  assert.match(pkg.packageManager, /^npm@\d+\.\d+\.\d+$/);

  fs.rmSync(root, { recursive: true, force: true });
});

test("parses CLI args", () => {
  const args = parseArgs(["my-app", "--template", "token", "--pm", "npm", "--no-git", "--yes"]);
  assert.equal(args.projectName, "my-app");
  assert.equal(args.template, "token");
  assert.equal(args.pm, "npm");
  assert.equal(args.git, false);
  assert.equal(args.yes, true);
  assert.equal(args.gitConflict, false);
});

test("flags --git and --no-git used together as a conflict", () => {
  const args = parseArgs(["my-app", "--git", "--no-git"]);
  assert.equal(args.gitConflict, true);

  const reversed = parseArgs(["my-app", "--no-git", "--git"]);
  assert.equal(reversed.gitConflict, true);
});
