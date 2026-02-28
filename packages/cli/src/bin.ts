#!/usr/bin/env node

import { readFileSync } from "node:fs";

import { Command, CommanderError, InvalidArgumentError } from "commander";

import type { WritePolicy } from "@templater/core";

import type { CreateCommandOptions } from "./commands/create.js";
import { createLogger } from "./ui/logger.js";
import { PromptCancelledError } from "./ui/prompt.js";

const packageJson = JSON.parse(
  readFileSync(new URL("../package.json", import.meta.url), "utf8"),
) as { version: string };

async function main(): Promise<void> {
  const program = new Command();

  program
    .name("templater")
    .description("Generate projects from local templates.")
    .configureOutput({
      writeErr: () => {},
    })
    .helpOption("-h, --help", "Show help")
    .version(packageJson.version, "--version", "Show version")
    .exitOverride();

  program.addHelpText(
    "after",
    [
      "",
      "Examples:",
      "  $ templater --help",
      "  $ templater --version",
      "  $ templater create ./templates/app ./my-app",
      "  $ templater create ./templates/app ./my-app --policy overwrite",
    ].join("\n"),
  );

  program
    .command("create")
    .description("Generate a project from a template directory.")
    .argument("<templatePath>", "Path to the template directory")
    .argument("<targetDir>", "Path to the output directory")
    .option(
      "--policy <policy>",
      "Conflict policy: fail, skip, overwrite",
      parsePolicy,
      "fail",
    )
    .option("--dry-run", "Build the generation plan without writing files")
    .option("--yes", "Accept defaults and skip interactive prompts where possible")
    .option("--verbose", "Print stack traces for errors")
    .addHelpText(
      "after",
      [
        "",
        "Examples:",
        "  $ templater create ./templates/app ./my-app",
        "  $ templater create ../template ./out --policy overwrite",
        "  $ templater create ./template ./out --dry-run --yes --verbose",
      ].join("\n"),
    )
    .action(async (templatePath: string, targetDir: string, options: CreateCommandOptions) => {
      const { runCreateCommand } = await import("./commands/create.js");
      const logger = createLogger({ verbose: options.verbose });
      await runCreateCommand(templatePath, targetDir, options, logger);
    });

  try {
    await program.parseAsync(process.argv);
  } catch (error) {
    handleCliError(error, process.argv.includes("--verbose"));
  }
}

function parsePolicy(value: string): WritePolicy {
  if (value === "fail" || value === "skip" || value === "overwrite") {
    return value;
  }

  throw new InvalidArgumentError(`invalid policy "${value}" (expected fail, skip, or overwrite)`);
}

function handleCliError(error: unknown, verbose: boolean): never | void {
  const logger = createLogger({ verbose });

  if (error instanceof CommanderError) {
    if (error.exitCode === 0) {
      return;
    }

    logger.error(error.message);
    logger.suggestion("Run with --help to see available commands and options.");
    process.exitCode = error.exitCode;
    return;
  }

  if (error instanceof Error) {
    if (error instanceof PromptCancelledError) {
      logger.warn("Prompt cancelled.");
      process.exitCode = 130;
      return;
    }

    logger.error(error.message);
    if (verbose && error.stack) {
      logger.debug(error.stack);
    } else {
      logger.suggestion("Run with --verbose for details.");
    }
  } else {
    logger.error(String(error));
    logger.suggestion("Run with --verbose for details.");
  }

  process.exitCode = 1;
}

void main();
