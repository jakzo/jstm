# @jstm/core

## 0.3.2

### Patch Changes

- ddd466c: Added explicit Prettier config. It is empty but now allows overrides from the ./config directory and stops Prettier from reading config from a parent directory.

## 0.3.1

### Patch Changes

- b95bebd: Fixed issue where added dependency versions were all `*` instead of their real versions.

## 0.3.0

### Minor Changes

- a3f8fbe: Dependencies are now added directly to the project's package.json. This is to avoid hoisting issues where a dependency is not available from the top level and cannot be accessed by tools requiring it there (eg. ESLint plugins) or the binary cannot be used (eg. running `prettier` from the project's package.json).

## 0.2.17

### Patch Changes

- 5801e85: Turned off ESLint rule: @typescript-eslint/no-non-null-assertion

## 0.2.16

### Patch Changes

- 68764a9: Fixed issue where ESLint plugins could not be loaded due to their node modules not being hoisted to the main node_modules folder

## 0.2.15

### Patch Changes

- da47f37: Added peer dependencies required by Jest/jsdom.

## 0.2.14

### Patch Changes

- e34e9f8: Fixed bug where generated scripts were not replacing custom scripts with the same name.

## 0.2.13

### Patch Changes

- 7ae2ca4: Fixed publish script.

## 0.2.12

### Patch Changes

- 12ba82c: Removed postinstall setup script.

## 0.2.11

### Patch Changes

- e8290f1: Fixed postinstall script.

## 0.2.10

### Patch Changes

- cfbf860: Final (tm) attempt at fixing changelog entries in GitHub releases.

## 0.2.9

### Patch Changes

- 8f38269: Yet another attempt at fixing changelog entries in GitHub releases.

## 0.2.8

### Patch Changes

- 9b52163: Yet another attempt at fixing changelog entries in GitHub releases.

## 0.2.7

### Patch Changes

- 9f17507: Another attempt at fixing changelog entries in GitHub releases.

## 0.2.6

### Patch Changes

- 220247a: Fixed changelog entries in GitHub releases.

## 0.2.5

### Patch Changes

- 87fe25d: Added a configuration system consisting of a /config/.jstmrc.json file and prompts to generate one if it doesn't exist.

## 0.2.4

### Patch Changes

- 3378d88: Fixed release pipeline and pre-push hook

## 0.2.3

### Patch Changes

- f7a1206: Fix release pipeline

## 0.2.2

### Patch Changes

- 117b8de: Fix release pipeline

## 0.2.1

### Patch Changes

- db8eb0c: Husky v6 added with linting on commit and changelog prompts on push
