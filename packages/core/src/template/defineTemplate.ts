import type { TemplateConfig } from "./types.js";

export function defineTemplate<T extends TemplateConfig>(cfg: T): T {
  return cfg;
}
