import { stat } from "node:fs/promises";
import path from "node:path";
import { pathToFileURL } from "node:url";

import { ConfigLoadError, InvalidTemplateError, TemplateNotFoundError } from "../errors/errors.js";
import type { LoadedTemplate, TemplateConfig } from "./types.js";

const TEMPLATE_CONFIG_FILE = "templater.config.ts";

export async function loadTemplate(templateDir: string): Promise<LoadedTemplate> {
  const rootDir = path.resolve(templateDir);
  const rootStats = await getPathStats(rootDir, `Template directory not found: ${rootDir}`);

  if (!rootStats.isDirectory()) {
    throw new TemplateNotFoundError(`Template path is not a directory: ${rootDir}`);
  }

  const configPath = path.join(rootDir, TEMPLATE_CONFIG_FILE);
  const configStats = await getPathStats(configPath, `Template config not found: ${configPath}`);

  if (!configStats.isFile()) {
    throw new TemplateNotFoundError(`Template config is not a file: ${configPath}`);
  }

  const configModule = await importConfig(configPath, String(configStats.mtimeMs));
  const config = validateTemplateConfig(configModule.default, configPath);

  return {
    rootDir,
    config,
    filesDir: path.join(rootDir, config.files?.source ?? "files"),
  };
}

async function getPathStats(
  targetPath: string,
  missingMessage: string,
): Promise<Awaited<ReturnType<typeof stat>>> {
  try {
    return await stat(targetPath);
  } catch (error) {
    throw new TemplateNotFoundError(missingMessage, { cause: error });
  }
}

async function importConfig(configPath: string, cacheKey: string): Promise<{ default?: unknown }> {
  const configUrl = pathToFileURL(configPath);
  configUrl.searchParams.set("t", String(cacheKey));

  try {
    return (await import(configUrl.href)) as { default?: unknown };
  } catch (error) {
    throw new ConfigLoadError(`Failed to import template config: ${configPath}`, { cause: error });
  }
}

function validateTemplateConfig(value: unknown, configPath: string): TemplateConfig {
  if (value === undefined) {
    throw new InvalidTemplateError(`Template config must have a default export: ${configPath}`);
  }

  if (!isRecord(value)) {
    throw new InvalidTemplateError(
      `Template config default export must be an object: ${configPath}`,
    );
  }

  if (typeof value.name !== "string" || value.name.length === 0) {
    throw new InvalidTemplateError(
      `Template config must define a non-empty string "name": ${configPath}`,
    );
  }

  if (typeof value.version !== "string" || value.version.length === 0) {
    throw new InvalidTemplateError(
      `Template config must define a non-empty string "version": ${configPath}`,
    );
  }

  if (value.files !== undefined) {
    if (!isRecord(value.files)) {
      throw new InvalidTemplateError(
        `Template config "files" must be an object when provided: ${configPath}`,
      );
    }

    if (typeof value.files.source !== "string" || value.files.source.length === 0) {
      throw new InvalidTemplateError(
        `Template config "files.source" must be a non-empty string: ${configPath}`,
      );
    }
  }

  return value as unknown as TemplateConfig;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}
