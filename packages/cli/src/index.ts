export { runCreateCommand } from "./commands/create.js";
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
