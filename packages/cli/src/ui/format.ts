import kleur from "kleur";
import path from "node:path";

const ICONS = {
  info: kleur.cyan("i"),
  success: kleur.green("+"),
  warn: kleur.yellow("!"),
  error: kleur.red("x"),
  debug: kleur.gray("."),
} as const;

export type LogLevel = keyof typeof ICONS;

export function formatLogLine(level: LogLevel, message: string): string {
  return `${ICONS[level]} ${message}`;
}

export function formatSuggestion(message: string): string {
  return `${kleur.gray("->")} ${kleur.gray(message)}`;
}

export function formatMuted(message: string): string {
  return kleur.gray(message);
}

export function formatDuration(durationMs: number): string {
  if (durationMs < 1000) {
    return `${durationMs}ms`;
  }

  if (durationMs < 10_000) {
    return `${(durationMs / 1000).toFixed(1)}s`;
  }

  return `${Math.round(durationMs / 1000)}s`;
}

export function formatRelativePath(targetPath: string, cwd: string = process.cwd()): string {
  const relativePath = path.relative(cwd, targetPath);

  return relativePath.length > 0 ? relativePath : ".";
}

export function formatTable(
  headers: readonly string[],
  rows: readonly (readonly string[])[],
): string {
  const widths = headers.map((header, index) =>
    Math.max(
      header.length,
      ...rows.map((row) => (row[index] ?? "").length),
    ),
  );

  const headerLine = headers
    .map((header, index) => header.padEnd(widths[index] ?? header.length))
    .join("  ");
  const separatorLine = widths.map((width) => "-".repeat(width)).join("  ");
  const rowLines = rows.map((row) =>
    row.map((cell, index) => cell.padEnd(widths[index] ?? cell.length)).join("  "),
  );

  return [headerLine, separatorLine, ...rowLines].join("\n");
}
