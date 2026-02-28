import path from "node:path";

import {
  buildPlan,
  loadTemplate,
  resolveConflict,
  writeMetadata,
  writePlan,
  type BuildPlanResult,
  type PlanItem,
  type WritePolicy,
} from "@templater/core";
import ora from "ora";

import { formatDuration, formatRelativePath } from "../ui/format.js";
import type { Logger } from "../ui/logger.js";
import { promptQuestions } from "../ui/prompt.js";

export interface CreateCommandOptions {
  readonly dryRun: boolean;
  readonly policy: WritePolicy;
  readonly verbose: boolean;
  readonly yes: boolean;
}

export async function runCreateCommand(
  templatePath: string,
  targetDir: string,
  options: CreateCommandOptions,
  logger: Logger,
): Promise<void> {
  const startedAt = Date.now();
  const resolvedTemplatePath = path.resolve(templatePath);
  const resolvedTargetDir = path.resolve(targetDir);

  logger.debug(`Template path: ${resolvedTemplatePath}`);
  logger.debug(`Target path: ${resolvedTargetDir}`);
  const template = await runWithSpinner(
    "Loading template",
    () => loadTemplate(resolvedTemplatePath),
    logger,
  );
  logger.debug(`Loaded template "${template.config.name}" v${template.config.version}`);

  if (options.yes) {
    logger.info("Using default answers where possible.");
  } else if ((template.config.questions?.length ?? 0) > 0) {
    logger.info(`Collecting ${template.config.questions?.length ?? 0} template answer(s).`);
  }

  const answers = await promptQuestions(template.config.questions ?? [], {
    yes: options.yes,
  });
  logger.debug(`Collected ${Object.keys(answers).length} answer value(s).`);

  const plan = await runWithSpinner(
    "Building generation plan",
    () => buildPlan(template, resolvedTargetDir, answers),
    logger,
  );
  logger.debug(`Plan contains ${plan.items.length} item(s).`);
  const summary = summarizePlan(plan, options.policy);

  if (options.dryRun) {
    logger.warn(`Dry run enabled. No files will be written. Policy: ${options.policy}.`);
    printDryRunPreview(summary, resolvedTargetDir, options, logger);
    printSummary(
      template.config.name,
      resolvedTargetDir,
      summary,
      options,
      logger,
      Date.now() - startedAt,
    );
    return;
  }

  if (summary.conflicts.length > 0) {
    throw new Error(
      `Found ${summary.conflicts.length} file conflict(s) in ${formatRelativePath(resolvedTargetDir)}. Use --policy skip or --policy overwrite.`,
    );
  }

  await runWithSpinner(
    `Writing files with "${options.policy}" policy`,
    () => writePlan(plan, options.policy),
    logger,
  );
  await runWithSpinner(
    "Writing project metadata",
    () =>
      writeMetadata(resolvedTargetDir, {
        template: template.config.name,
        version: template.config.version,
        generatedAt: new Date().toISOString(),
      }),
    logger,
  );

  printSummary(
    template.config.name,
    resolvedTargetDir,
    summary,
    options,
    logger,
    Date.now() - startedAt,
  );
}

function printSummary(
  templateName: string,
  targetDir: string,
  summary: PlanSummary,
  options: CreateCommandOptions,
  logger: Logger,
  durationMs: number,
): void {
  const modeLabel = options.dryRun ? "Previewed" : "Generated";
  const summaryParts = [
    `${summary.writes.length} rendered`,
    `${summary.copies.length} copied`,
    `${summary.skips.length} skipped`,
    `${summary.conflicts.length} conflicts`,
  ];

  logger.success(
    `${modeLabel} "${templateName}" ${options.dryRun ? "for" : "into"} ${formatRelativePath(targetDir)} in ${formatDuration(durationMs)}.`,
  );
  logger.info(summaryParts.join(", "));
}

function printDryRunPreview(
  summary: PlanSummary,
  targetDir: string,
  options: CreateCommandOptions,
  logger: Logger,
): void {
  logger.info(`Preview for ${formatRelativePath(targetDir)}:`);

  const groups: readonly PreviewGroup[] = [
    { label: "Write", items: summary.writes },
    { label: "Copy", items: summary.copies },
    { label: "Skip", items: summary.skips },
    { label: "Conflict", items: summary.conflicts },
  ];

  const previewLimit = options.verbose ? Number.POSITIVE_INFINITY : 10;
  let remaining = previewLimit;

  for (const group of groups) {
    if (group.items.length === 0) {
      continue;
    }

    logger.info(`${group.label}: ${group.items.length}`);
    const itemsToShow = options.verbose ? group.items : group.items.slice(0, remaining);

    for (const item of itemsToShow) {
      logger.info(`  ${formatOutputPath(item.outAbs, targetDir)}`);
    }

    remaining = Math.max(0, remaining - itemsToShow.length);
  }

  if (!options.verbose) {
    const hiddenCount =
      summary.writes.length +
      summary.copies.length +
      summary.skips.length +
      summary.conflicts.length -
      Math.min(
        previewLimit,
        summary.writes.length +
          summary.copies.length +
          summary.skips.length +
          summary.conflicts.length,
      );

    if (hiddenCount > 0) {
      logger.suggestion(`Showing first ${previewLimit} planned file(s). Run with --verbose for the full list.`);
    }
  }
}

function summarizePlan(plan: BuildPlanResult, policy: WritePolicy): PlanSummary {
  const writes: PlanItem[] = [];
  const copies: PlanItem[] = [];
  const skips: PlanItem[] = [];
  const conflicts: PlanItem[] = [];

  for (const item of plan.items) {
    const resolution = resolveConflict(item.outAbs, policy);

    if (resolution === "skip") {
      skips.push(item);
      continue;
    }

    if (resolution === "error") {
      conflicts.push(item);
      continue;
    }

    if (item.action === "write") {
      writes.push(item);
      continue;
    }

    copies.push(item);
  }

  return { writes, copies, skips, conflicts };
}

async function runWithSpinner<T>(
  text: string,
  task: () => Promise<T>,
  logger: Logger,
): Promise<T> {
  const spinner = ora({
    text,
    isEnabled: process.stdout.isTTY && !process.env.CI,
  }).start();

  try {
    const result = await task();

    spinner.succeed(text);
    return result;
  } catch (error) {
    spinner.fail(text);
    logger.debug(error instanceof Error ? error.message : String(error));
    throw error;
  }
}

function formatOutputPath(outAbs: string, targetDir: string): string {
  const relativePath = path.relative(targetDir, outAbs);

  return relativePath.length > 0 ? relativePath : path.basename(outAbs);
}

interface PlanSummary {
  readonly writes: PlanItem[];
  readonly copies: PlanItem[];
  readonly skips: PlanItem[];
  readonly conflicts: PlanItem[];
}

interface PreviewGroup {
  readonly label: string;
  readonly items: readonly PlanItem[];
}
