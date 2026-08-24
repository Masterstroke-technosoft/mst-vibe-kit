const NAME_RE = /^(?:@[a-z0-9-*~][a-z0-9-*._~]*\/)?[a-z0-9-~][a-z0-9-._~]*$/;

export function validateProjectName(name) {
  if (!name || !name.trim()) {
    return { valid: false, problem: "Project name cannot be empty." };
  }
  if (name.length > 214) {
    return { valid: false, problem: "Project name must be shorter than 214 characters." };
  }
  if (!NAME_RE.test(name)) {
    return {
      valid: false,
      problem:
        "Project name may only contain lowercase letters, numbers, hyphens, underscores, and periods.",
    };
  }
  return { valid: true };
}
