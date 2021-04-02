# @jstm/core

JavaScript Technology Manager -- project tooling in a box. Preconfigured tools like Webpack, TypeScript, Jest, Github Actions and more set up and upgraded with a single command.\_

## Usage

Create an empty directory for your new project then run:

```sh
yarn add --dev @jstm/preset-node && yarn project
```

**That's it!** All the tooling should now be set up. Note that you may need to restart your IDE for the integrations to pick up the changes to tooling (eg. for the VSCode ESLint plugin to read the newly created config).

### Existing projects

If you want to add this to an existing project you can run the same command to install all the tooling. Existing tooling files will be overwritten so make sure you're version control like Git so you can restore anything deleted if necessary. Carefully review all the changes which were made to make sure you don't lose anything. Some common things you will have to do are:

- Manually find and delete any conflicting files. For example if the tool creates a `.eslintrc.js` file but your project had a `.eslintrc.json` file it will not be overwritten and you will have to manually delete the old file.
- Modify your source code to pass tests and linting rules.
- Move overwritten custom package.json scripts (eg. `build`, `test`, etc.) to custom scripts (eg. `build:custom`, `test:custom`, etc.).
- Create a separate file for custom Github actions.

## Templates

There are multiple templates available. To use a particular template, simply install it as a dev dependency into your project then run `yarn project` and it will set itself up.

These packages are:

- `@jstm/preset-node` - Preconfigured tooling for Node.js projects.

## FAQ

### Why use this instead of Yeoman or even just copying a boilerplate folder?

For **free maintainence**. This tool is more than just a set of file templates; all the tooling and configuration is encapsulated inside a dependency which means that by running `yarn upgrade @jstm/preset-node --latest` your tooling will be updated to the current state-of-the-art JS project setup. These upgrades can even be automated with a bot like [Renovate](https://github.com/renovatebot/renovate). With file templates they help you get started quickly but leave all the maintenance to you. If you have many separate repositories, the maintenance time savings add up quickly.

### Why would I not want to use this?

If you require a unique tooling setup which is not compatible with any available project templates. Right now there is only a narrow set of templates with my preferred tooling setup (generally uses tools which are popular for OSS projects). However you can also:

- Add overrides for most config files with the `config` directory
- Build your own template using the API from `@jstm/core`

### How do I eject if I don't want to use this anymore?

This is a manual process for now. To do this you should:

- Install all the packages depended on by `@jstm/preset-node`
- Run `yarn remove @jstm/preset-node`
- Remove config files from `.gitignore`
- Remove all the "generated file, do not modify" warnings

## Contributing

See [CONTRIBUTING.md](./CONTRIBUTING.md) for instructions how to develop locally and make changes.
