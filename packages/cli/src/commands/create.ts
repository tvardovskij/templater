import path from "node:path";

import {
  buildPlan,
  loadTemplate,
  writeMetadata,
  writePlan,
  type BuildPlanResult,
  type WritePolicy,
} from "@templater/core";

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
): Promise<void> {
  const resolvedTemplatePath = path.resolve(templatePath);
  const resolvedTargetDir = path.resolve(targetDir);

  const template = await loadTemplate(resolvedTemplatePath);
  const answers = await promptQuestions(template.config.questions ?? [], {
    yes: options.yes,
  });
  const plan = await buildPlan(template, resolvedTargetDir, answers);

  if (!options.dryRun) {
    await writePlan(plan, options.policy);
    await writeMetadata(resolvedTargetDir, {
      template: template.config.name,
      version: template.config.version,
      generatedAt: new Date().toISOString(),
    });
  }

  printSummary(template.config.name, resolvedTargetDir, plan, options);
}

function printSummary(
  templateName: string,
  targetDir: string,
  plan: BuildPlanResult,
  options: CreateCommandOptions,
): void {
  const writtenFiles = plan.items.filter((item) => item.action === "write").length;
  const copiedFiles = plan.items.filter((item) => item.action === "copy").length;
  const modeLabel = options.dryRun ? "Planned" : "Generated";

  console.log(`${modeLabel} "${templateName}" into ${targetDir}`);
  console.log(
    `${options.dryRun ? "Would create" : "Created"} ${plan.items.length} file(s): ${writtenFiles} rendered, ${copiedFiles} copied.`,
  );
  if (options.dryRun) {
    console.log(`Dry run only. No files were written. Policy: ${options.policy}.`);
  }
}
