import { readdir, readFile } from "node:fs/promises";
import path from "node:path";

import { renderText } from "../render/renderText.js";
import { shouldRender } from "../render/shouldRender.js";
import type { LoadedTemplate } from "../template/types.js";
import type { BuildPlanResult, PlanItem } from "./types.js";

const DEFAULT_IGNORED_NAMES = new Set(["node_modules", "dist", ".git", ".templater"]);

export interface BuildPlanGlobs {
  readonly include?: readonly string[];
  readonly exclude?: readonly string[];
}

export async function buildPlan(
  template: LoadedTemplate,
  targetDir: string,
  vars: Record<string, any>,
  globs?: BuildPlanGlobs,
): Promise<BuildPlanResult> {
  const resolvedTargetDir = path.resolve(targetDir);
  const items: PlanItem[] = [];

  await walkTemplateDir(
    template.filesDir,
    template.filesDir,
    resolvedTargetDir,
    vars,
    items,
    {
      include: coalescePatterns(globs?.include, template.config.files?.include),
      exclude: coalescePatterns(globs?.exclude, template.config.files?.exclude),
    },
  );

  return { items };
}

async function walkTemplateDir(
  currentDir: string,
  filesRootDir: string,
  targetDir: string,
  vars: Record<string, any>,
  items: PlanItem[],
  globs: BuildPlanGlobs,
): Promise<void> {
  const entries = await readdir(currentDir, { withFileTypes: true });

  for (const entry of entries) {
    if (DEFAULT_IGNORED_NAMES.has(entry.name)) {
      continue;
    }

    const absPath = path.join(currentDir, entry.name);
    const relativePath = toPosixPath(path.relative(filesRootDir, absPath));

    if (matchesAny(relativePath, globs.exclude)) {
      continue;
    }

    if (entry.isDirectory()) {
      await walkTemplateDir(absPath, filesRootDir, targetDir, vars, items, globs);
      continue;
    }

    if (entry.isFile()) {
      if (!shouldInclude(relativePath, globs.include)) {
        continue;
      }

      const outAbs = path.join(targetDir, relativePath);

      if (await shouldRender(absPath)) {
        const templateSource = await readFile(absPath, "utf8");

        items.push({
          srcAbs: absPath,
          outAbs,
          action: "write",
          renderedContent: renderText(templateSource, vars),
        });
        continue;
      }

      items.push({
        srcAbs: absPath,
        outAbs,
        action: "copy",
      });
    }
  }
}

function coalescePatterns(
  primary?: readonly string[],
  fallback?: readonly string[],
): readonly string[] | undefined {
  return primary ?? fallback;
}

function shouldInclude(
  relativePath: string,
  include?: readonly string[],
): boolean {
  if (!include || include.length === 0) {
    return true;
  }

  return matchesAny(relativePath, include);
}

function matchesAny(
  relativePath: string,
  patterns?: readonly string[],
): boolean {
  if (!patterns || patterns.length === 0) {
    return false;
  }

  return patterns.some((pattern) => matchPattern(relativePath, pattern));
}

function matchPattern(relativePath: string, pattern: string): boolean {
  const normalizedPattern = toPosixPath(pattern);

  if (normalizedPattern.length === 0) {
    return false;
  }

  if (normalizedPattern === relativePath) {
    return true;
  }

  if (!normalizedPattern.includes("*")) {
    return (
      relativePath.startsWith(`${normalizedPattern}/`) ||
      relativePath.endsWith(`/${normalizedPattern}`) ||
      path.posix.basename(relativePath) === normalizedPattern
    );
  }

  const escaped = normalizedPattern.replace(/[.+?^${}()|[\]\\]/g, "\\$&");
  const source = `^${escaped.replace(/\*/g, ".*")}$`;

  return new RegExp(source).test(relativePath);
}

function toPosixPath(filePath: string): string {
  return filePath.split(path.sep).join(path.posix.sep);
}
