export function parseArgs(argv) {
  const result = {
    projectName: undefined,
    template: undefined,
    pm: undefined,
    git: undefined,
    skipInstall: false,
    yes: false,
    help: false,
  };

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
        break;
      case "--no-git":
        result.git = false;
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

  return result;
}
