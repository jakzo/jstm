declare module 'optionator' {
  interface Heading {
    /** `heading` a required string, the name of the heading */
    heading: string;
  }

  interface ConcatArraysOptions {
    /**
     * Only allows one array value per flag. This is useful if your potential values contain a
     * comma.
     */
    oneValuePerFlag?: boolean;
  }

  interface Option {
    /** `option` the required name of the option - use dash-case, without the leading dashes */
    option: string;
    /**
     * `alias` is an optional string or array of strings which specify any aliases for the option
     */
    alias?: string[] | string;
    /**
     * `type` is a required string in the [type check](https://github.com/gkz/type-check)
     * [format](https://github.com/gkz/type-check#type-format), this will be used to cast the
     * inputted value and validate it
     */
    type: Type;
    /**
     * `enum` is an optional array of strings, each string will be parsed by
     * [levn](https://github.com/gkz/levn) - the argument value must be one of the resulting
     * values - each potential value must validate against the specified `type`
     */
    enum?: string[];
    /**
     * `default` is a optional string, which will be parsed by
     * [levn](https://github.com/gkz/levn) and used as the default value if none is set -
     * the value must validate against the specified `type`
     */
    default?: string;
    /**
     * `restPositional` is an optional boolean - if set to `true`, everything after the option
     * will be taken to be a positional argument, even if it looks like a named argument
     */
    restPositional?: boolean;
    /**
     * `required` is an optional boolean - if set to `true`, the option parsing will fail if the
     * option is not defined
     */
    required?: boolean;
    /**
     * `overrideRequired` is a optional boolean - if set to `true` and the option is used,
     * and there is another option which is required but not set, it will override the need for
     * the required option and there will be no error - this is useful if you have required
     * options and want to use `--help` or `--version` flags
     */
    overrideRequired?: boolean;
    /**
     * `dependsOn` is an optional string or array of strings - if simply a string (the name of
     * another option), it will make sure that that other option is set, if an array of strings,
     * depending on whether `'and'` or `'or'` is first, it will either check whether all (`['and',
     * 'option-a', 'option-b']`), or at least one (`['or', 'option-a', 'option-b']`) other options
     * are set
     */
    dependsOn?: string[] | string;
    /**
     * `concatRepeatedArrays` is an optional boolean or tuple with boolean and options object
     * (defaults to `false`) - when set to `true` and an option contains an array value and is
     * repeated, the subsequent values for the flag will be appended rather than overwriting the
     * original value - eg. option `g` of type `[String]`: `-g a -g b -g c,d` will result in
     * `['a','b','c','d']`
     *
     * You can supply an options object by giving the following value: `[true, options]`. The one
     * currently supported option is `oneValuePerFlag`, this only allows one array value per flag.
     * This is useful if your potential values contain a comma.
     */
    concatRepeatedArrays?: boolean | [boolean, ConcatArraysOptions];
    /**
     * `mergeRepeatedObjects` is an optional boolean (defaults to `false`) - when set to `true` and
     * an option contains an object value and is repeated, the subsequent values for the flag will
     * be merged rather than overwriting the original value - eg. option `g` of type `Object`: `-g
     * a:1 -g b:2 -g c:3,d:4` will result in `{a: 1, b: 2, c: 3, d: 4}`
     */
    mergeRepeatedObjects?: boolean;
    /**
     * `description` is an optional string, which will be displayed next to the option in the help
     * text
     */
    description?: string;
    /**
     * `longDescription` is an optional string, it will be displayed instead of the `description`
     * when `generateHelpForOption` is used
     */
    longDescription?: string;
    /**
     * `example` is an optional string or array of strings with example(s) for the option - these
     * will be displayed when `generateHelpForOption` is used
     */
    example?: string[] | string;
  }

  interface HelpStyle {
    /**
     * `aliasSeparator` is an optional string, separates multiple names from each other - default: ' ,'
     */
    aliasSeparator?: string;
    /** `typeSeparator` is an optional string, separates the type from the names - default: ' ' */
    typeSeparator?: string;
    /**
     * `descriptionSeparator` is an optional string , separates the description from the padded name
     * and type - default: '  '
     */
    descriptionSeparator?: string;
    /** `initialIndent` is an optional int - the amount of indent for options - default: 2 */
    initialIndent?: number;
    /**
     * `secondaryIndent` is an optional int - the amount of indent if wrapped fully (in addition to
     * the initial indent) - default: 4
     */
    secondaryIndent?: number;
    /**
     * `maxPadFactor` is an optional number - affects the default level of padding for the
     * names/type, it is multiplied by the average of the length of the names/type - default: 1.5
     */
    maxPadFactor?: number;
  }

  interface Settings<O extends OptionsGeneric<S>, S extends string> {
    /** `prepend` is an optional string to be placed before the options in the help text */
    prepend?: string;
    /** `append` is an optional string to be placed after the options in the help text */
    append?: string;
    /**
     * `options` is a required array specifying your options and headings, the options and
     * headings will be displayed in the order specified
     */
    options: O;
    /**
     * `helpStyle` is an optional object which enables you to change the default appearance of
     * some aspects of the help text
     */
    helpStyle?: HelpStyle;
    /**
     * `mutuallyExclusive` is an optional array of arrays of either strings or arrays of strings.
     * The top level array is a list of rules, each rule is a list of elements - each element can
     * be either a string (the name of an option), or a list of strings (a group of option names)
     * - there will be an error if more than one element is present
     */
    mutuallyExclusive?: (string | string[])[][];
    /**
     * `concatRepeatedArrays` see description under the "Option Properties" heading -
     * use at the top level is deprecated, if you want to set this for all options, use the
     * `defaults` property
     *
     * @deprecated set in defaults object
     */
    concatRepeatedArrays?: boolean | [boolean, ConcatArraysOptions];
    /**
     * `mergeRepeatedObjects` see description under the "Option Properties" heading - use at
     * the top level is deprecated, if you want to set this for all options, use the `defaults`
     * property
     *
     * @deprecated set in defaults object
     */
    mergeRepeatedObjects?: boolean;
    /**
     * `positionalAnywhere` is an optional boolean (defaults to `true`) - when `true` it allows
     * positional arguments anywhere, when `false`, all arguments after the first positional one
     * are taken to be positional as well, even if they look like a flag. For example, with
     * `positionalAnywhere: false`, the arguments `--flag --boom 12 --crack` would have two
     * positional arguments: `12` and `--crack`
     */
    positionalAnywhere?: boolean;
    /**
     * `typeAliases` is an optional object, it allows you to set aliases for types, eg.
     * `{Path: 'String'}` would allow you to use the type `Path` as an alias for the type `String`
     */
    typeAliases?: Record<string, string>;
    /**
     * `defaults` is an optional object following the option properties format, which specifies
     * default values for all options. A default will be overridden if manually set. For example,
     * you can do `default: { type: "String" }` to set the default type of all options to `String`,
     * and then override that default in an individual option by setting the `type` property
     */
    defaults?: Option;
  }

  interface ParseOptions {
    /**
     * `slice` specifies how much to slice away from the beginning if the input is an array or
     * string - by default `0` for string, 2 for array (works with `process.argv`)
     */
    slice?: number;
  }

  /**
   * the parsed options, each key is a camelCase version of the option name
   * (specified in dash-case), and each value is the processed value for that option.
   * Positional values are in an array under the _ key.
   */
  type ParsedOptions<O extends OptionsGeneric<S>, S extends string> = {
    /** Positional arguments. */
    _: string[];
  } & OptionsToParsed<O>;

  interface HelpOptions {
    /**
     * `showHidden` specifies whether to show options with `hidden: true` specified, by default it
     * is `false`
     */
    showHidden?: boolean;
    /**
     * `interpolate` specify data to be interpolated in `prepend` and `append` text, `{{key}}` is
     * the format - eg. `generateHelp({interpolate:{version: '0.4.2'}})`, will change this `append`
     * text: `Version {{version}}` to `Version 0.4.2`
     */
    interpolate?: Record<string, string>;
  }

  interface Optionator<O extends OptionsGeneric<S>, S extends string> {
    /**
     * `parse` processes the `input` according to your settings, and returns an object with the
     * results.
     */
    parse(
      /** the input you wish to parse */
      input: string[] | Record<string, unknown> | string,
      parseOptions?: ParseOptions,
    ): ParsedOptions<O, S>;

    /**
     * `parseArgv` works exactly like `parse`, but only for array input and it slices off the first
     * two elements.
     */
    parseArgv(
      /** the input you wish to parse */
      input: string[],
    ): ParsedOptions<O, S>;

    /** `generateHelp` produces help text based on your settings. */
    generateHelp(helpOptions: HelpOptions): void;

    /**
     * `generateHelpForOption` produces expanded help text for the specified with `optionName`
     * option. If an `example` was specified for the option, it will be displayed,  and if a
     * `longDescription` was specified, it will display that instead of the `description`.
     */
    generateHelpForOption(
      /** the name of the option to display */
      optionName: string,
    ): string;
  }

  interface Main {
    <O extends OptionsGeneric<S>, S extends string>(settings: Settings<O, S>): Optionator<O, S>;
    /** the current version of the library as a string */
    VERSION: string;
  }
  const main: Main;
  export = main;

  // These should live in the types for the type-check module
  type Type = 'String' | '[String]' | 'Number' | '[Number]' | 'Boolean' | string;
  type TypeOf<T extends Type> = T extends 'String'
    ? string
    : T extends '[String]'
    ? string[]
    : T extends 'Number' | 'Int'
    ? number
    : T extends '[Number]' | '[Int]'
    ? number[]
    : T extends 'Boolean'
    ? boolean
    : unknown;

  // === TYPESCRIPT HACKS ===
  // `{ 0: ... }` is used to infer the type as a tuple
  type OptionsGeneric<S extends string> = OptionGeneric<S>[] & { 0: OptionGeneric<S> };
  // Generic `S` is used to infer the type of certain string values as literals
  type OptionGeneric<S extends string> =
    | Heading
    | (Option & { option: S; type: S; required?: boolean });
  // Converting option definitions to the parse result is quite convoluted
  // The idea is we first map over the options tuple and use `OptionToParsed` to convert each item
  // into a parse result object for just that option, then we get the intersection of all items in
  // the tuple which is done by boxing each item in a tuple (eg. `[1, 2, 3] -> [[1], [2], [3]]`),
  // getting all tuple values so we have a union of boxed items (eg. `[1] | [2] | [3]`),
  // converting the union to an intersection (eg. `[1] & [2] & [3]`) then finally unboxing the
  // items (eg. `1 & 2 & 3`)
  type OptionsToParsed<O extends OptionsGeneric<string>> = UnboxIntersection<
    UnionToIntersection<
      BoxedTupleTypes<{ [K in keyof O]: O[K] extends Option ? OptionToParsed<O[K]> : unknown }>
    >
  >;
  type OptionToParsed<O extends Option> = PartialIfFalse<
    { [K in O['option']]: TypeOf<O['type']> },
    O['required']
  >;
  type PartialIfFalse<T, P> = P extends true ? T : Partial<T>;
  type BoxedTupleTypes<T> = { [P in keyof T]: [T[P]] }[Exclude<keyof T, keyof unknown[]>];
  type UnionToIntersection<U> = (U extends unknown ? (k: U) => void : never) extends (
    k: infer I,
  ) => void
    ? I
    : never;
  type UnboxIntersection<T> = T extends { 0: infer U } ? U : never;
}
