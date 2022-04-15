Hi! 👋 Contributions are welcome -- feel free to open a PR for small fixes or open an issue for bigger changes, discussion or if unsure about how to implement something.

## Dev Instructions

Before starting, install dependencies with:

```sh
yarn
```

Typical flow for making a change to a template is:

```sh
yarn test:watch # optional while making changes
# after making change to template file in src/generators
yarn lint:fix
yarn test # verify that snapshot changes match what you'd expect
git add -A
git commit -m "description of change"
git push # answer prompts to create changeset
git push
```

See [package.json](./package.json) for more commands.

## Updating Dependencies

- `yarn up '*'`
- `yarn up '@*/*'`
- Revert changes to `@jstm` dependencies (stub packages which should be `file:` deps)
- Revert changes to modules where latest is an ES module (`chalk`, `lint-staged`, `tempy`)
- `yarn set version stable`
- Update Yarn filename in `common.ts`
- Rename `.yarn/releases/yarn-VERSION.cjs` to `yarn-berry.cjs`
- Update Yarn version in `manifest.ts` to match `package.json`
- For each plugin in `.yarnrc.yml` run `yarn plugin import NAME`
- `yarn dlx @yarnpkg/sdks`
- `yarn dlx @yarnpkg/pnpify tsc`
