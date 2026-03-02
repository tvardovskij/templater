import { readFile, writeFile } from "node:fs/promises";

import { getRegistryPath, getTemplaterHomeDir } from "./paths.js";

const REGISTRY_VERSION = 1;

export interface RegistryTemplateEntry {
  readonly source: string;
  readonly addedAt: string;
  readonly type: "local" | "git" | "npm";
  readonly pinnedRef?: string;
  readonly notes?: string;
}

export interface Registry {
  readonly version: 1;
  readonly templates: Record<string, RegistryTemplateEntry>;
}

export class RegistryError extends Error {
  constructor(message: string, options?: ErrorOptions) {
    super(message, options);
    this.name = "RegistryError";
  }
}

export async function loadRegistry(): Promise<Registry> {
  const registryPath = getRegistryPath();

  try {
    const raw = await readFile(registryPath, "utf8");
    return parseRegistry(raw, registryPath);
  } catch (error) {
    if (isMissingFileError(error)) {
      const defaultRegistry = createDefaultRegistry();

      await saveRegistry(defaultRegistry);
      return defaultRegistry;
    }

    if (error instanceof RegistryError) {
      throw error;
    }

    throw new RegistryError(
      `Failed to read templater registry at ${registryPath}.`,
      { cause: error },
    );
  }
}

export async function saveRegistry(reg: Registry): Promise<void> {
  const normalized = normalizeRegistry(reg);

  getTemplaterHomeDir();
  await writeFile(getRegistryPath(), `${JSON.stringify(normalized, null, 2)}\n`, "utf8");
}

export async function addTemplate(
  alias: string,
  entry: RegistryTemplateEntry,
): Promise<void> {
  const normalizedAlias = normalizeAlias(alias);
  const registry = await loadRegistry();

  if (registry.templates[normalizedAlias]) {
    throw new RegistryError(`Template alias already exists: ${normalizedAlias}`);
  }

  await saveRegistry({
    ...registry,
    templates: {
      ...registry.templates,
      [normalizedAlias]: normalizeEntry(entry, normalizedAlias),
    },
  });
}

export async function removeTemplate(alias: string): Promise<void> {
  const normalizedAlias = normalizeAlias(alias);
  const registry = await loadRegistry();

  if (!registry.templates[normalizedAlias]) {
    return;
  }

  const { [normalizedAlias]: _removed, ...remainingTemplates } = registry.templates;

  await saveRegistry({
    ...registry,
    templates: remainingTemplates,
  });
}

export async function listTemplates(): Promise<
  Array<{ alias: string; entry: RegistryTemplateEntry }>
> {
  const registry = await loadRegistry();

  return Object.entries(registry.templates)
    .sort(([leftAlias], [rightAlias]) => leftAlias.localeCompare(rightAlias))
    .map(([alias, entry]) => ({
      alias,
      entry,
    }));
}

export async function getTemplate(
  alias: string,
): Promise<RegistryTemplateEntry | null> {
  const normalizedAlias = normalizeAlias(alias);
  const registry = await loadRegistry();

  return registry.templates[normalizedAlias] ?? null;
}

function createDefaultRegistry(): Registry {
  return {
    version: REGISTRY_VERSION,
    templates: {},
  };
}

function parseRegistry(raw: string, registryPath: string): Registry {
  let parsed: unknown;

  try {
    parsed = JSON.parse(raw);
  } catch (error) {
    throw new RegistryError(
      `Templater registry is corrupted: ${registryPath}. Fix or remove the file and try again.`,
      { cause: error },
    );
  }

  return normalizeRegistry(parsed);
}

function normalizeRegistry(value: unknown): Registry {
  if (!isRecord(value)) {
    throw new RegistryError("Templater registry must be a JSON object.");
  }

  if (value.version !== REGISTRY_VERSION) {
    throw new RegistryError(
      `Unsupported templater registry version: ${String(value.version)}.`,
    );
  }

  if (!isRecord(value.templates)) {
    throw new RegistryError('Templater registry "templates" must be an object.');
  }

  const templates: Record<string, RegistryTemplateEntry> = {};

  for (const [alias, entry] of Object.entries(value.templates)) {
    const normalizedAlias = normalizeAlias(alias);
    templates[normalizedAlias] = normalizeEntry(entry, normalizedAlias);
  }

  return {
    version: REGISTRY_VERSION,
    templates,
  };
}

function normalizeEntry(value: unknown, alias: string): RegistryTemplateEntry {
  if (!isRecord(value)) {
    throw new RegistryError(`Registry entry "${alias}" must be an object.`);
  }

  if (typeof value.source !== "string" || value.source.trim().length === 0) {
    throw new RegistryError(`Registry entry "${alias}" must define a non-empty "source".`);
  }

  if (typeof value.addedAt !== "string" || !isIsoDate(value.addedAt)) {
    throw new RegistryError(`Registry entry "${alias}" must define a valid ISO "addedAt".`);
  }

  if (value.type !== "local" && value.type !== "git" && value.type !== "npm") {
    throw new RegistryError(
      `Registry entry "${alias}" must define "type" as local, git, or npm.`,
    );
  }

  if (value.pinnedRef !== undefined && typeof value.pinnedRef !== "string") {
    throw new RegistryError(`Registry entry "${alias}" has an invalid "pinnedRef".`);
  }

  if (value.notes !== undefined && typeof value.notes !== "string") {
    throw new RegistryError(`Registry entry "${alias}" has invalid "notes".`);
  }

  return {
    source: value.source,
    addedAt: value.addedAt,
    type: value.type,
    ...(value.pinnedRef !== undefined ? { pinnedRef: value.pinnedRef } : {}),
    ...(value.notes !== undefined ? { notes: value.notes } : {}),
  };
}

function normalizeAlias(alias: string): string {
  const normalizedAlias = alias.trim();

  if (normalizedAlias.length === 0) {
    throw new RegistryError("Template alias must not be empty.");
  }

  if (!/^[a-z0-9][a-z0-9._-]*$/i.test(normalizedAlias)) {
    throw new RegistryError(
      `Invalid template alias "${alias}". Use letters, numbers, ".", "_" or "-".`,
    );
  }

  return normalizedAlias;
}

function isIsoDate(value: string): boolean {
  const parsed = Date.parse(value);

  return Number.isFinite(parsed) && new Date(parsed).toISOString() === value;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function isMissingFileError(error: unknown): error is NodeJS.ErrnoException {
  return error instanceof Error && "code" in error && error.code === "ENOENT";
}
