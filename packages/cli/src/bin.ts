#!/usr/bin/env node

async function main(): Promise<void> {
  const [, , command, ...args] = process.argv;

  if (command === "--help" || command === "-h" || command === undefined) {
    printUsage();
    return;
  }

  if (command === "create") {
    const [templatePath, targetDir] = args;

    if (!templatePath || !targetDir) {
      printUsage();
      process.exitCode = 1;
      return;
    }

    const { runCreateCommand } = await import("./commands/create.js");
    await runCreateCommand(templatePath, targetDir);
    return;
  }

  printUsage();
  process.exitCode = 1;
}

function printUsage(): void {
  console.error("Usage: templater create <templatePath> <targetDir>");
}

void main().catch((error: unknown) => {
  const message = error instanceof Error ? error.message : String(error);

  console.error(message);
  process.exitCode = 1;
});
