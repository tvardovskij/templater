import type { TemplateConfig } from "./types";

export function defineTemplate<T extends TemplateConfig>(cfg: T): T {
  return cfg;
}
