import path from "node:path";

import {
  buildPlan,
  loadTemplate,
  writeMetadata,
  writePlan,
  type BuildPlanResult,
} from "@templater/core";

import { promptQuestions } from "../ui/prompt";

export async function runCreateCommand(
  templatePath: string,
  targetDir: string,
): Promise<void> {
  const resolvedTemplatePath = path.resolve(templatePath);
  const resolvedTargetDir = path.resolve(targetDir);

  const template = await loadTemplate(resolvedTemplatePath);
  const answers = await promptQuestions(template.config.questions ?? []);
  const plan = await buildPlan(template, resolvedTargetDir, answers);

  await writePlan(plan, "fail");
  await writeMetadata(resolvedTargetDir, {
    template: template.config.name,
    version: template.config.version,
    generatedAt: new Date().toISOString(),
  });

  printSummary(template.config.name, resolvedTargetDir, plan);
}

function printSummary(
  templateName: string,
  targetDir: string,
  plan: BuildPlanResult,
): void {
  const writtenFiles = plan.items.filter((item) => item.action === "write").length;
  const copiedFiles = plan.items.filter((item) => item.action === "copy").length;

  console.log(`Generated "${templateName}" into ${targetDir}`);
  console.log(
    `Created ${plan.items.length} file(s): ${writtenFiles} rendered, ${copiedFiles} copied.`,
  );
}
