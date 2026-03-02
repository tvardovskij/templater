#!/usr/bin/env node

import { readFileSync } from "node:fs";

import { Command, CommanderError, InvalidArgumentError } from "commander";

import type { WritePolicy } from "@templater/core";

import type { CreateCommandOptions } from "./commands/create.js";
import type { TemplatesAddCommandOptions } from "./commands/templates.js";
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

  const templatesCommand = new Command("templates")
    .description("Manage template aliases in the local registry.")
    .addHelpText(
      "after",
      [
        "",
        "Examples:",
        "  $ templater templates add app ./templates/app",
        "  $ templater templates list",
        "  $ templater templates remove app",
      ].join("\n"),
    );
  program.addCommand(templatesCommand);

  templatesCommand
    .command("add")
    .description("Add a template alias to the local registry.")
    .argument("<alias>", "Alias used to reference the template")
    .argument("<source>", "Local path, git source, or npm reference")
    .option("--type <type>", "Template source type: local, git, npm", parseTemplateType)
    .option("--ref <ref>", "Pinned branch, tag, or commit")
    .option("--notes <text>", "Optional notes stored with the template")
    .action(async (alias: string, source: string, options: TemplatesAddCommandOptions) => {
      const { runTemplatesAddCommand } = await import("./commands/templates.js");
      const logger = createLogger({ verbose: false });
      await runTemplatesAddCommand(alias, source, options, logger);
    });

  templatesCommand
    .command("list")
    .description("List template aliases from the local registry.")
    .action(async () => {
      const { runTemplatesListCommand } = await import("./commands/templates.js");
      const logger = createLogger({ verbose: false });
      await runTemplatesListCommand(logger);
    });

  templatesCommand
    .command("remove")
    .description("Remove a template alias from the local registry.")
    .argument("<alias>", "Alias to remove")
    .action(async (alias: string) => {
      const { runTemplatesRemoveCommand } = await import("./commands/templates.js");
      const logger = createLogger({ verbose: false });
      await runTemplatesRemoveCommand(alias, logger);
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

function parseTemplateType(value: string): "local" | "git" | "npm" {
  if (value === "local" || value === "git" || value === "npm") {
    return value;
  }

  throw new InvalidArgumentError(`invalid type "${value}" (expected local, git, or npm)`);
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
