import path from "path";

import * as fse from "fs-extra";
import inquirer, { QuestionMap } from "inquirer";

import type { Formatter } from "./types";
import { readFileOr } from "./utils";

const JSTM_CONFIG_FILENAME = ".jstmrc.json";

const hasProp = (obj: unknown, property: string): boolean =>
  Object.prototype.hasOwnProperty.call(obj, property);

interface ConfigType<T> {
  _T: T;
  inquirerType: keyof QuestionMap;
  isSensitive: boolean;
  guard: (value: unknown) => value is T;
}

const createConfigType = <T extends unknown>(
  jsType: string,
  inquirerType: keyof QuestionMap,
  isSensitive = false
): ConfigType<T> =>
  ({
    inquirerType,
    isSensitive,
    guard: (value: unknown): value is T => typeof value === jsType,
  } as ConfigType<T>);

const configTypes = {
  string: createConfigType<string>("string", "input"),
  password: createConfigType<string>("string", "password", true),
  number: createConfigType<number>("number", "number"),
  boolean: createConfigType<boolean>("boolean", "confirm"),
};

export type ConfigTypeNames = keyof typeof configTypes;
export type ConfigTypeOf<
  T extends ConfigTypeNames
> = typeof configTypes[T]["_T"];

export type ConfigOpts<T extends ConfigTypeNames> = Partial<{
  defaultValue: ConfigTypeOf<T>;
  /** If true, value will not be saved in project config (since it will not be needed later).
   *  An example of this is the `author` email address used in the package.json.
   *  Any value of type `password` will not be saved and does not need this to be set. */
  shouldNotSave: boolean;
}>;

export class Config {
  hasPromptedForValues = false;
  useDefaultInsteadOfPrompt = false;
  doNotSave = new Set<string>();

  constructor(
    public projectPath: string,
    public formatter: Formatter,
    public data?: Record<string, unknown>
  ) {}

  async readProjectConfig(): Promise<Record<string, unknown>> {
    const configPath = path.join(
      this.projectPath,
      "config",
      JSTM_CONFIG_FILENAME
    );
    const contents = await readFileOr(configPath, undefined);
    if (!contents) return {};

    // If a config file is present we should not prompt for values missing from
    // it which contain a default, since it is implied that the defaults were
    // used when the config was initialized
    this.useDefaultInsteadOfPrompt = true;
    return JSON.parse(contents) as Record<string, unknown>;
  }

  async saveProjectConfig(): Promise<void> {
    if (!this.data) return;
    const configPath = path.join(
      this.projectPath,
      "config",
      JSTM_CONFIG_FILENAME
    );
    const dataToSave = Object.fromEntries(
      Object.entries(this.data).filter(([key]) => !this.doNotSave.has(key))
    );
    return fse.writeFile(
      configPath,
      this.formatter(JSTM_CONFIG_FILENAME, JSON.stringify(dataToSave, null, 2))
    );
  }

  async get<T extends ConfigTypeNames>(
    key: string,
    type: T,
    opts: ConfigOpts<T> = {}
  ): Promise<ConfigTypeOf<T>> {
    if (!this.data) this.data = await this.readProjectConfig();
    const { inquirerType, guard, isSensitive } = configTypes[type];
    if (isSensitive || opts.shouldNotSave) this.doNotSave.add(key);

    if (hasProp(this.data, key)) {
      const value = this.data[key];
      if (guard(value)) return value;
      throw new Error(
        [
          `Multiple conflicting types required for config value: ${key}`,
          `Type required is '${type}' but previously used value was: ${value}`,
        ].join("\n")
      );
    }

    if (this.useDefaultInsteadOfPrompt && opts.defaultValue)
      return opts.defaultValue;

    if (!this.hasPromptedForValues) {
      console.log(
        "Please enter values for the following configuration options:"
      );
      this.hasPromptedForValues = true;
    }
    const { value } = await inquirer.prompt<{ value: ConfigTypeOf<T> }>([
      {
        name: "value",
        message: key,
        type: inquirerType,
        default: opts.defaultValue,
      },
    ]);
    this.data[key] = value;
    if (value === opts.defaultValue) this.doNotSave.add(key);
    return value;
  }
}
