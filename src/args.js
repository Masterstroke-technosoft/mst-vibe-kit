export function parseArgs(argv) {
  const result = {
    projectName: undefined,
    template: undefined,
    pm: undefined,
    git: undefined,
    gitConflict: false,
    skipInstall: false,
    yes: false,
    help: false,
  };

  let sawGit = false;
  let sawNoGit = false;

  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];
    switch (arg) {
      case "-h":
      case "--help":
        result.help = true;
        break;
      case "-y":
      case "--yes":
        result.yes = true;
        break;
      case "--template":
        result.template = argv[++i];
        break;
      case "--pm":
        result.pm = argv[++i];
        break;
      case "--git":
        result.git = true;
        sawGit = true;
        break;
      case "--no-git":
        result.git = false;
        sawNoGit = true;
        break;
      case "--skip-install":
        result.skipInstall = true;
        break;
      default:
        if (!arg.startsWith("-") && !result.projectName) {
          result.projectName = arg;
        }
    }
  }

  // Both flags were passed — which one "wins" is ambiguous, so surface it
  // as a conflict instead of silently letting the last one take effect.
  result.gitConflict = sawGit && sawNoGit;

  return result;
}
