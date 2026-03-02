import { formatLogLine, formatMuted, formatSuggestion } from "./format.js";

export interface Logger {
  info(message: string): void;
  success(message: string): void;
  warn(message: string): void;
  error(message: string): void;
  debug(message: string): void;
  suggestion(message: string): void;
  plain(message: string): void;
}

export function createLogger(options: { verbose: boolean }): Logger {
  return {
    info(message) {
      writeStdout(formatLogLine("info", message));
    },
    success(message) {
      writeStdout(formatLogLine("success", message));
    },
    warn(message) {
      writeStderr(formatLogLine("warn", message));
    },
    error(message) {
      writeStderr(formatLogLine("error", message));
    },
    debug(message) {
      if (!options.verbose) {
        return;
      }

      writeStdout(formatLogLine("debug", formatMuted(message)));
    },
    suggestion(message) {
      writeStderr(formatSuggestion(message));
    },
    plain(message) {
      writeStdout(message);
    },
  };
}

function writeStdout(message: string): void {
  process.stdout.write(`${message}\n`);
}

function writeStderr(message: string): void {
  process.stderr.write(`${message}\n`);
}
