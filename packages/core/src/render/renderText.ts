import Handlebars from "handlebars";

export function renderText(
  template: string,
  vars: Record<string, any>,
): string {
  return Handlebars.compile(template)(vars);
}
