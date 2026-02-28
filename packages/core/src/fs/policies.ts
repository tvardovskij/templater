import { existsSync } from "node:fs";

export type WritePolicy = "fail" | "skip" | "overwrite";

export function resolveConflict(
  outAbs: string,
  policy: WritePolicy,
): "write" | "skip" | "error" {
  if (!existsSync(outAbs)) {
    return "write";
  }

  switch (policy) {
    case "overwrite":
      return "write";
    case "skip":
      return "skip";
    case "fail":
    default:
      return "error";
  }
}
