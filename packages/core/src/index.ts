export { defineTemplate } from "./template/defineTemplate";
export { loadTemplate } from "./template/loadTemplate";
export { isBinaryFile } from "./render/isBinary";
export { renderText } from "./render/renderText";
export { shouldRender } from "./render/shouldRender";
export { buildPlan } from "./plan/buildPlan";
export { resolveConflict } from "./fs/policies";
export { writePlan } from "./fs/writePlan";

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
} from "./template/types";
export type { BuildPlanResult, PlanItem } from "./plan/types";
export type { BuildPlanGlobs } from "./plan/buildPlan";
export type { WritePolicy } from "./fs/policies";
