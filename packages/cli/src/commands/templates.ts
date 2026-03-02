import path from "node:path";

import {
  addTemplate,
  getTemplate,
  listTemplates,
  removeTemplate,
  type RegistryTemplateEntry,
} from "../config/registry.js";
import { formatTable } from "../ui/format.js";
import type { Logger } from "../ui/logger.js";

export interface TemplatesAddCommandOptions {
  readonly type?: "local" | "git" | "npm";
  readonly ref?: string;
  readonly notes?: string;
}

export async function runTemplatesAddCommand(
  alias: string,
  source: string,
  options: TemplatesAddCommandOptions,
  logger: Logger,
): Promise<void> {
  const entryType = options.type ?? inferTemplateType(source);
  const normalizedSource = entryType === "local" ? path.resolve(source) : source;
  const entry: RegistryTemplateEntry = {
    source: normalizedSource,
    addedAt: new Date().toISOString(),
    type: entryType,
    ...(options.ref ? { pinnedRef: options.ref } : {}),
    ...(options.notes ? { notes: options.notes } : {}),
  };

  await addTemplate(alias, entry);

  logger.success(`Added template "${alias}".`);
  logger.info(`Type: ${entry.type}`);
  logger.info(`Source: ${entry.source}`);
  if (entry.pinnedRef) {
    logger.info(`Ref: ${entry.pinnedRef}`);
  }
}

export async function runTemplatesListCommand(logger: Logger): Promise<void> {
  const templates = await listTemplates();

  if (templates.length === 0) {
    logger.info("No templates registered.");
    logger.suggestion('Add one with: templater templates add <alias> <source>');
    return;
  }

  const rows = templates.map(({ alias, entry }) => [
    alias,
    entry.type,
    entry.source,
    entry.pinnedRef ?? "-",
  ]);

  logger.info("Registered templates:");
  logger.plain(formatTable(["alias", "type", "source", "pinnedRef"], rows));
}

export async function runTemplatesRemoveCommand(
  alias: string,
  logger: Logger,
): Promise<void> {
  const existingEntry = await getTemplate(alias);

  if (!existingEntry) {
    logger.warn(`Template "${alias}" was not found.`);
    return;
  }

  await removeTemplate(alias);

  logger.success(`Removed template "${alias}".`);
}

function inferTemplateType(source: string): "local" | "git" | "npm" {
  if (source.startsWith("github:") || source.includes("://")) {
    return "git";
  }

  if (source.startsWith("@") || source.endsWith(".tgz")) {
    return "npm";
  }

  return "local";
}
