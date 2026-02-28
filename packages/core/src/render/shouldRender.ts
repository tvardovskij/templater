import { isBinaryFile } from "./isBinary";

export async function shouldRender(absPath: string): Promise<boolean> {
  return !(await isBinaryFile(absPath));
}
