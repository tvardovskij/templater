import { copyFile, mkdir, writeFile } from "node:fs/promises";
import path from "node:path";

import type { BuildPlanResult, PlanItem } from "../plan/types.js";
import { resolveConflict, type WritePolicy } from "./policies.js";

export async function writePlan(
  plan: BuildPlanResult,
  policy: WritePolicy,
): Promise<void> {
  for (const item of plan.items) {
    const resolution = resolveConflict(item.outAbs, policy);

    if (resolution === "skip") {
      continue;
    }

    if (resolution === "error") {
      throw new Error(`Output file already exists: ${item.outAbs}`);
    }

    await mkdir(path.dirname(item.outAbs), { recursive: true });
    await applyPlanItem(item);
  }
}

async function applyPlanItem(item: PlanItem): Promise<void> {
  if (item.action === "copy") {
    await copyFile(item.srcAbs, item.outAbs);
    return;
  }

  await writeFile(item.outAbs, item.renderedContent ?? "", "utf8");
}
