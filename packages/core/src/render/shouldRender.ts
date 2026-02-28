import { isBinaryFile } from "./isBinary.js";

export async function shouldRender(absPath: string): Promise<boolean> {
  return !(await isBinaryFile(absPath));
}
