export { defineTemplate } from "./template/defineTemplate";
export { loadTemplate } from "./template/loadTemplate";
export { isBinaryFile } from "./render/isBinary";
export { renderText } from "./render/renderText";
export { shouldRender } from "./render/shouldRender";

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
