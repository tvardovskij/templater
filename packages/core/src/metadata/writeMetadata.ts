import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";

import type { ProjectMetadata } from "./types.js";

const METADATA_DIR_NAME = ".templater";
const METADATA_FILE_NAME = "meta.json";

export async function writeMetadata(
  targetDir: string,
  metadata: ProjectMetadata,
): Promise<void> {
  const metadataDir = path.join(targetDir, METADATA_DIR_NAME);
  const metadataPath = path.join(metadataDir, METADATA_FILE_NAME);

  await mkdir(metadataDir, { recursive: true });
  await writeFile(metadataPath, `${JSON.stringify(metadata, null, 2)}\n`, "utf8");
}
