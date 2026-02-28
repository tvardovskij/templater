import { createInterface } from "node:readline/promises";
import { stdin as input, stdout as output } from "node:process";

import type {
  ConfirmQuestion,
  InputQuestion,
  Question,
  SelectQuestion,
} from "@templater/core";

export interface PromptOptions {
  readonly yes?: boolean;
}

export async function promptQuestions(
  questions: readonly Question[],
  options: PromptOptions = {},
): Promise<Record<string, unknown>> {
  if (questions.length === 0) {
    return {};
  }

  if (options.yes) {
    return buildDefaultAnswers(questions);
  }

  const answers: Record<string, unknown> = {};
  const rl = createInterface({ input, output });

  try {
    for (const question of questions) {
      answers[question.name] = await askQuestion(rl, question);
    }
  } finally {
    rl.close();
  }

  return answers;
}

function buildDefaultAnswers(questions: readonly Question[]): Record<string, unknown> {
  const answers: Record<string, unknown> = {};

  for (const question of questions) {
    answers[question.name] = getDefaultAnswer(question);
  }

  return answers;
}

function getDefaultAnswer(question: Question): unknown {
  switch (question.type) {
    case "input":
      return question.default ?? "";
    case "select":
      return question.default ?? question.options[0]?.value ?? "";
    case "confirm":
      return question.default ?? false;
    default:
      return assertNever(question);
  }
}

async function askQuestion(
  rl: ReturnType<typeof createInterface>,
  question: Question,
): Promise<unknown> {
  switch (question.type) {
    case "input":
      return askInputQuestion(rl, question);
    case "select":
      return askSelectQuestion(rl, question);
    case "confirm":
      return askConfirmQuestion(rl, question);
    default:
      return assertNever(question);
  }
}

async function askInputQuestion(
  rl: ReturnType<typeof createInterface>,
  question: InputQuestion,
): Promise<string> {
  const suffix = question.default !== undefined ? ` [${question.default}]` : "";
  const answer = await rl.question(`${question.message}${suffix}: `);

  if (answer.length === 0 && question.default !== undefined) {
    return question.default;
  }

  return answer;
}

async function askSelectQuestion(
  rl: ReturnType<typeof createInterface>,
  question: SelectQuestion,
): Promise<string> {
  const optionList = question.options
    .map((option, index) => `${index + 1}. ${option.label}`)
    .join("\n");

  const defaultIndex = question.default
    ? question.options.findIndex((option) => option.value === question.default)
    : -1;
  const suffix = defaultIndex >= 0 ? ` [${defaultIndex + 1}]` : "";

  while (true) {
    const answer = await rl.question(`${question.message}${suffix}\n${optionList}\n> `);
    const normalizedAnswer =
      answer.length === 0 && defaultIndex >= 0 ? String(defaultIndex + 1) : answer;
    const selectedIndex = Number.parseInt(normalizedAnswer, 10) - 1;
    const selectedOption = question.options[selectedIndex];

    if (selectedOption) {
      return selectedOption.value;
    }

    output.write("Select one of the listed options by number.\n");
  }
}

async function askConfirmQuestion(
  rl: ReturnType<typeof createInterface>,
  question: ConfirmQuestion,
): Promise<boolean> {
  const defaultValue = question.default ?? false;
  const suffix = defaultValue ? " [Y/n]" : " [y/N]";

  while (true) {
    const answer = (await rl.question(`${question.message}${suffix}: `))
      .trim()
      .toLowerCase();

    if (answer.length === 0) {
      return defaultValue;
    }

    if (answer === "y" || answer === "yes") {
      return true;
    }

    if (answer === "n" || answer === "no") {
      return false;
    }

    output.write("Enter y or n.\n");
  }
}

function assertNever(value: never): never {
  throw new Error(`Unsupported question type: ${JSON.stringify(value)}`);
}
