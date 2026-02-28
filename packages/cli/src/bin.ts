#!/usr/bin/env node

import path from "node:path";
import { registerHooks } from "node:module";

async function main(): Promise<void> {
  const [, , command, ...args] = process.argv;

  if (command === "create") {
    const [templatePath, targetDir] = args;

    if (!templatePath || !targetDir) {
      printUsage();
      process.exitCode = 1;
      return;
    }

    registerEsmExtensionHook();
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

function registerEsmExtensionHook(): void {
  registerHooks({
    resolve(specifier, context, nextResolve) {
      try {
        return nextResolve(specifier, context);
      } catch (error) {
        if (!shouldAppendJsExtension(specifier, error)) {
          throw error;
        }

        return nextResolve(`${specifier}.js`, context);
      }
    },
  });
}

function shouldAppendJsExtension(specifier: string, error: unknown): boolean {
  if (!(error instanceof Error) || !("code" in error) || error.code !== "ERR_MODULE_NOT_FOUND") {
    return false;
  }

  if (specifier.startsWith("node:")) {
    return false;
  }

  if (path.extname(specifier).length > 0) {
    return false;
  }

  return specifier.startsWith(".") || specifier.startsWith("/") || specifier.startsWith("file:");
}

void main().catch((error: unknown) => {
  const message = error instanceof Error ? error.message : String(error);

  console.error(message);
  process.exitCode = 1;
});
