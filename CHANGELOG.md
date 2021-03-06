# @jstm/core

## 0.4.3

### Patch Changes

- 67d6b3e: Keeps TSConfig paths added manually.

## 0.4.2

### Patch Changes

- 3e28b5e: Fixed TSConfig bugs.

## 0.4.1

### Patch Changes

- 34bc5c6: Removed postinstall script.

## 0.4.0

### Minor Changes

- d956efb: Updated dependency versions.

## 0.3.35

### Patch Changes

- 3fb9032: Fixed CI.

## 0.3.34

### Patch Changes

- afeb1a2: Upgraded dependencies.

## 0.3.33

### Patch Changes

- 141c6e8: Added React to ESLint import rule.

## 0.3.32

### Patch Changes

- 8ddb11c: update yarn

## 0.3.31

### Patch Changes

- 97c3211: fix publish

## 0.3.30

### Patch Changes

- b861197: Fix Yarn 2 auth.

## 0.3.29

### Patch Changes

- 1c3ce58: Fixing monorepo setup.

## 0.3.28

### Patch Changes

- c97ed00: Fix monorepo publishing.

## 0.3.27

### Patch Changes

- 5a89894: Fixing publish in monorepos.

## 0.3.26

### Patch Changes

- a49931a: Fixed issue where monorepo package TSConfig paths didn't work because they were missing baseUrl.

## 0.3.25

### Patch Changes

- 1c71f46: Fixed Jest module name maps.

## 0.3.24

### Patch Changes

- 6efdebe: TSConfig improvements and fixes.

## 0.3.23

### Patch Changes

- 987ddbd: Improvements to TSConfig setup which fixes some bugs.

## 0.3.22

### Patch Changes

- 818e924: Fix monorepo workspace references.

## 0.3.21

### Patch Changes

- 61da5c3: Fixed monorepo TSConfig reference paths.

## 0.3.20

### Patch Changes

- 4a87c9e: Fix generator.

## 0.3.19

### Patch Changes

- c0c6e8a: Fixes generator.

## 0.3.18

### Patch Changes

- 73e4910: Fixed issue where Yarn plugins and SDK files were not included after running project for the first time

## 0.3.17

### Patch Changes

- 1920d96: Fixed dependencies.

## 0.3.16

### Patch Changes

- ac353dc: Added isMonorepo config option.

## 0.3.15

### Patch Changes

- 60d0db7: Added isMonorepo config option.

## 0.3.14

### Patch Changes

- 2df146e: Fixed npm publish (for real).

## 0.3.13

### Patch Changes

- 2147a52: Fixed npm publish in CI.

## 0.3.12

### Patch Changes

- dcd10d4: Fixed issue with publish registry not being correctly used.

## 0.3.11

### Patch Changes

- 3ab9a25: No changes (retrying publish)

## 0.3.10

### Patch Changes

- 98e7819: Fixed pre-push script for unusually hoisted node_modules structures.

## 0.3.9

### Patch Changes

- a837ffd: Fixed GitHub CI changelog script.

## 0.3.8

### Patch Changes

- 7655d03: Attempt to fix issue with postinstall script not working.

## 0.3.7

### Patch Changes

- dc095c0: Project command will now be run automatically when the preset package is installed.

## 0.3.6

### Patch Changes

- dfe49a4: Allowed customization of package registry to be used for the project when installing dependencies and publishing.

## 0.3.5

### Patch Changes

- 35caf09: You can now create a ./config/.github/workflows/ci.yml file and its contents will be merged with the generated ci.yml file.

## 0.3.4

### Patch Changes

- 2061464: When a jstm preset requires a certain version of a dev dependency and the dependency is already included in the project as a regular dependency the existing dependency's version will be updated to the one required by the preset.

## 0.3.3

### Patch Changes

- 46281ee: Removed generated dev script from package.json since a lot of projects have different ways to run in dev mode rather than just running `index.ts`.

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
