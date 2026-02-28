export interface HookContext {
  readonly answers: Readonly<Record<string, unknown>>;
  readonly templateDir?: string;
  readonly targetDir?: string;
}

export type Hook = (context: HookContext) => void | Promise<void>;

export interface Hooks {
  readonly beforeGenerate?: Hook | readonly Hook[];
  readonly afterGenerate?: Hook | readonly Hook[];
}

interface BaseQuestion<Name extends string = string> {
  readonly name: Name;
  readonly message: string;
}

export interface InputQuestion<Name extends string = string> extends BaseQuestion<Name> {
  readonly type: "input";
  readonly default?: string;
}

export interface SelectOption<Value extends string = string> {
  readonly label: string;
  readonly value: Value;
}

export interface SelectQuestion<
  Name extends string = string,
  Value extends string = string,
> extends BaseQuestion<Name> {
  readonly type: "select";
  readonly options: readonly SelectOption<Value>[];
  readonly default?: Value;
}

export interface ConfirmQuestion<Name extends string = string> extends BaseQuestion<Name> {
  readonly type: "confirm";
  readonly default?: boolean;
}

export type Question = InputQuestion | SelectQuestion | ConfirmQuestion;

export interface FilesConfig {
  readonly source: string;
  readonly include?: readonly string[];
  readonly exclude?: readonly string[];
}

export interface TemplateConfig {
  readonly name: string;
  readonly version: string;
  readonly questions?: readonly Question[];
  readonly files?: FilesConfig;
  readonly hooks?: Hooks;
}

export interface LoadedTemplate {
  readonly rootDir: string;
  readonly config: TemplateConfig;
  readonly filesDir: string;
}
