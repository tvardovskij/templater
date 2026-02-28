export { defineTemplate } from "./template/defineTemplate.js";
export { loadTemplate } from "./template/loadTemplate.js";
export { isBinaryFile } from "./render/isBinary.js";
export { renderText } from "./render/renderText.js";
export { shouldRender } from "./render/shouldRender.js";
export { buildPlan } from "./plan/buildPlan.js";
export { resolveConflict } from "./fs/policies.js";
export { writePlan } from "./fs/writePlan.js";
export { writeMetadata } from "./metadata/writeMetadata.js";

export type {
  ConfirmQuestion,
  FilesConfig,
  Hook,
  HookContext,
  Hooks,
  InputQuestion,
  LoadedTemplate,
  Question,
  SelectOption,
  SelectQuestion,
  TemplateConfig,
} from "./template/types.js";
export type { BuildPlanResult, PlanItem } from "./plan/types.js";
export type { ProjectMetadata } from "./metadata/types.js";
export type { BuildPlanGlobs } from "./plan/buildPlan.js";
export type { WritePolicy } from "./fs/policies.js";
