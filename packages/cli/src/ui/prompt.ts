import { confirm, input, select } from "@inquirer/prompts";

import type {
  ConfirmQuestion,
  InputQuestion,
  Question,
  SelectQuestion,
} from "@templater/core";
import { formatLogLine } from "./format.js";

type ValidationResult = boolean | string | void;
type QuestionValidator<T> = (
  value: T,
  answers: Readonly<Record<string, unknown>>,
) => ValidationResult | Promise<ValidationResult>;

type PromptQuestion =
  | (InputQuestion & { readonly validate?: QuestionValidator<string> })
  | (SelectQuestion & { readonly validate?: QuestionValidator<string> })
  | (ConfirmQuestion & { readonly validate?: QuestionValidator<boolean> });

export interface PromptOptions {
  readonly yes?: boolean;
}

export class PromptCancelledError extends Error {
  constructor() {
    super("Prompt cancelled.");
    this.name = "PromptCancelledError";
  }
}

export async function promptQuestions(
  questions: readonly Question[],
  options: PromptOptions = {},
): Promise<Record<string, unknown>> {
  if (questions.length === 0) {
    return {};
  }

  const answers: Record<string, unknown> = {};

  for (const question of questions) {
    const promptQuestion = question as PromptQuestion;

    if (options.yes) {
      const autoAnswer = await tryGetAutoAnswer(promptQuestion, answers);

      if (autoAnswer.used) {
        answers[promptQuestion.name] = autoAnswer.value;
        continue;
      }
    }

    answers[promptQuestion.name] = await askQuestion(promptQuestion, answers);
  }

  return answers;
}

async function askQuestion(
  question: PromptQuestion,
  answers: Readonly<Record<string, unknown>>,
): Promise<unknown> {
  try {
    switch (question.type) {
      case "input":
        return askInputQuestion(question, answers);
      case "select":
        return askSelectQuestion(question, answers);
      case "confirm":
        return askConfirmQuestion(question, answers);
      default:
        return assertNever(question);
    }
  } catch (error) {
    if (isPromptCancellation(error)) {
      throw new PromptCancelledError();
    }

    throw error;
  }
}

async function askInputQuestion(
  question: InputQuestion & { readonly validate?: QuestionValidator<string> },
  answers: Readonly<Record<string, unknown>>,
): Promise<string> {
  return input({
    message: question.message,
    default: question.default,
    validate: (value) => runValidation(question.validate, value, answers),
  });
}

async function askSelectQuestion(
  question: SelectQuestion & { readonly validate?: QuestionValidator<string> },
  answers: Readonly<Record<string, unknown>>,
): Promise<string> {
  while (true) {
    const value = await select({
      message: question.message,
      default: question.default,
      choices: question.options.map((option) => ({
        name: option.label,
        value: option.value,
      })),
    });
    const validationResult = await runValidation(question.validate, value, answers);

    if (validationResult === true) {
      return value;
    }

    writePromptError(validationResult);
  }
}

async function askConfirmQuestion(
  question: ConfirmQuestion & { readonly validate?: QuestionValidator<boolean> },
  answers: Readonly<Record<string, unknown>>,
): Promise<boolean> {
  while (true) {
    const value = await confirm({
      message: question.message,
      default: question.default ?? false,
      theme: {
        prefix: "",
      },
      transformer: (answer) => (answer ? "y" : "n"),
    });
    const validationResult = await runValidation(question.validate, value, answers);

    if (validationResult === true) {
      return value;
    }

    writePromptError(validationResult);
  }
}

async function tryGetAutoAnswer(
  question: PromptQuestion,
  answers: Readonly<Record<string, unknown>>,
): Promise<{ readonly used: boolean; readonly value?: unknown }> {
  const candidate = getAutoAnswer(question);

  if (!candidate.used) {
    return candidate;
  }

  const validationResult = await runValidation(
    question.validate as QuestionValidator<unknown> | undefined,
    candidate.value,
    answers,
  );

  if (validationResult === true) {
    return candidate;
  }

  return { used: false };
}

function getAutoAnswer(
  question: PromptQuestion,
): { readonly used: boolean; readonly value?: unknown } {
  switch (question.type) {
    case "input":
      if (question.default !== undefined) {
        return { used: true, value: question.default };
      }

      return { used: false };
    case "select":
      return {
        used: true,
        value: question.default ?? question.options[0]?.value ?? "",
      };
    case "confirm":
      return {
        used: true,
        value: question.default ?? false,
      };
    default:
      return assertNever(question);
  }
}

async function runValidation<T>(
  validate: QuestionValidator<T> | undefined,
  value: T,
  answers: Readonly<Record<string, unknown>>,
): Promise<true | string> {
  if (!validate) {
    return true;
  }

  const result = await validate(value, answers);

  if (result === undefined || result === true) {
    return true;
  }

  if (result === false) {
    return "Invalid value.";
  }

  return result;
}

function isPromptCancellation(error: unknown): boolean {
  return (
    error instanceof Error &&
    (error.name === "ExitPromptError" ||
      error.name === "AbortPromptError" ||
      error.name === "PromptCancelledError")
  );
}

function writePromptError(message: string): void {
  process.stderr.write(`${formatLogLine("error", message)}\n`);
}

function assertNever(value: never): never {
  throw new Error(`Unsupported question type: ${JSON.stringify(value)}`);
}
