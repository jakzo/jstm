# @jakzo/project

_Javascript project tooling in a box._

## Usage

Start with a blank project (no `.gitignore` file, no tooling installed) then run:

```sh
yarn add -D @jakzo/project
```

**That's it!** All the tooling should now be set up. Note that you may need to restart your IDE for the integrations to pick up the changes.

### Why use this instead of Yeoman or even just copying a boilerplate folder?

For **free maintainence**. This package is more than just a template for code; all the tooling and configuration is inside a dependency which means that by running `yarn upgrade @jakzo/project --latest` your tooling will be updated to the current state-of-the-art JS project setup. Any bugs in tooling can be fixed and tool dependency versions upgraded. These upgrades can even be automated with a bot like [Renovate](https://github.com/renovatebot/renovate). With templates they help you get started quickly but leave all the maintenance to you. If you have many separate repositories, the maintenance time savings add up quickly.

### Why would I not want to use this?

If you require a unique tooling setup which the project's setup is not compatible with or you don't like my choice of tooling. Right now it only caters for a narrow set of projects but in the future I'd like to see it be made modular where you can create extensions which add new technologies and associated linting rules. You can always start off with it then eject when you need.

### How do I eject?

That's a manual process for now. The basic idea is to remove the dependency and add in all the tooling yourself. One way you could do this is by installing all the packages depended on by `@jakzo/project`, replacing all the config files with the config that they retrieve from `node_modules/@jakzo/project`, then run `yarn remove @jakzo/project`.
