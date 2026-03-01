import { mkdirSync } from "node:fs";
import os from "node:os";
import path from "node:path";

const TEMPLATER_HOME_DIRNAME = ".templater";
const TEMPLATES_CACHE_DIRNAME = "templates";
const REGISTRY_FILENAME = "config.json";

export function getTemplaterHomeDir(): string {
  const homeDir = path.join(os.homedir(), TEMPLATER_HOME_DIRNAME);

  mkdirSync(homeDir, { recursive: true });

  return homeDir;
}

export function getRegistryPath(): string {
  return path.join(getTemplaterHomeDir(), REGISTRY_FILENAME);
}

export function getTemplatesCacheDir(): string {
  const cacheDir = path.join(getTemplaterHomeDir(), TEMPLATES_CACHE_DIRNAME);

  mkdirSync(cacheDir, { recursive: true });

  return cacheDir;
}
