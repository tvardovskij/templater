export { runCreateCommand } from "./commands/create.js";
export {
  runTemplatesAddCommand,
  runTemplatesListCommand,
  runTemplatesRemoveCommand,
  type TemplatesAddCommandOptions,
} from "./commands/templates.js";
export {
  addTemplate,
  getTemplate,
  listTemplates,
  loadRegistry,
  removeTemplate,
  saveRegistry,
  type Registry,
  type RegistryTemplateEntry,
} from "./config/registry.js";
export {
  getRegistryPath,
  getTemplaterHomeDir,
  getTemplatesCacheDir,
} from "./config/paths.js";
