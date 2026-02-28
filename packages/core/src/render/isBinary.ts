import { open } from "node:fs/promises";

const BINARY_SAMPLE_BYTES = 8000;

export async function isBinaryFile(absPath: string): Promise<boolean> {
  const fileHandle = await open(absPath, "r");

  try {
    const buffer = Buffer.alloc(BINARY_SAMPLE_BYTES);
    const { bytesRead } = await fileHandle.read(buffer, 0, BINARY_SAMPLE_BYTES, 0);

    for (let index = 0; index < bytesRead; index += 1) {
      if (buffer[index] === 0x00) {
        return true;
      }
    }

    return false;
  } finally {
    await fileHandle.close();
  }
}
