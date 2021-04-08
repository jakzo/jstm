import type { TemplateGenerator } from "../types";
import { mergeJson } from "../utils";
import { getDistDir, getNodeMinVersion, getSrcDir } from "./utils/config";

export const typescript: TemplateGenerator = {
  devDependencies: [
    "typescript",
    "ts-node",
    "ts-node-dev",
    "@types/node",
    "@types/jest",
  ],
  files: async ({ config }) => {
    const srcDir = await getSrcDir(config);
    const distDir = await getDistDir(config);
    const nodeMinVersion = await getNodeMinVersion(config);

    const targetEsVersion =
      nodeMinVersion < 6
        ? "ES6"
        : // node's semi-annual releases have been mostly compatible with the corresponding
          // yearly ECMAScript spec update since ES2015 and fully compatible since ES2019
          // https://node.green/#ES2019
          `ES${
            2015 +
            Math.floor((nodeMinVersion - 4 - (nodeMinVersion < 12 ? 1 : 0)) / 2)
          }`;
    return [
      {
        path: ["tsconfig.json"],
        isCheckedIn: true,
        contents: await mergeJson(
          "tsconfig.json",
          { extends: "./tsconfig.base.json" },
          true
        ),
      },
      {
        path: ["tsconfig.build.json"],
        contents: `
// DO NOT MODIFY
// This file is auto-generated (make changes to ./tsconfig.json instead)
{
  "extends": "./tsconfig.json",
  "include": ["./${srcDir}/**/*", "./${srcDir}/**/*.json"],
  "exclude": ["**/__*__/**/*"],
  "compilerOptions": {
    "noEmit": false,
    "rootDir": "./${srcDir}",
    "outDir": "./${distDir}",
    "types": ["node"]
  }
}
`,
      },
      {
        path: ["tsconfig.base.json"],
        contents: `
// DO NOT MODIFY
// This file is auto-generated (make changes to ./tsconfig.json instead)
{
  "include": ["**/*", "**/*.json"],
  "exclude": [
    "./${distDir}/**/*",
    "**/node_modules/**/*",
    "**/.git/**/*",
    "**/.*cache/**/*",
    "**/.jest/**/*",
    "**/.yarn/**/*",
    "**/.coverage/**/*"
  ],
  "compilerOptions": {
    "noEmit": true,
    "rootDir": "./",
    "baseUrl": "./",
    "target": "${targetEsVersion}",
    "module": "commonjs",
    "lib": ["${targetEsVersion}"],
    "types": ["node", "jest"],
    "jsx": "react",
    "allowJs": true,
    "resolveJsonModule": true,
    "composite": true,
    "skipLibCheck": true,
    "sourceMap": true,
    "declaration": true,
    "importHelpers": true,
    "removeComments": false,
    "stripInternal": false,
    "moduleResolution": "node",
    "allowSyntheticDefaultImports": true,
    "esModuleInterop": true,
    "emitDecoratorMetadata": true,
    "experimentalDecorators": true,
    "strict": true,
    "noImplicitAny": true,
    "allowUnreachableCode": true,
    "allowUnusedLabels": false,
    "alwaysStrict": true,
    "forceConsistentCasingInFileNames": true,
    "noFallthroughCasesInSwitch": true,
    "noImplicitReturns": true,
    "noImplicitThis": true,
    "noUnusedLocals": true,
    "noUnusedParameters": false,
    "strictFunctionTypes": false,
    "strictNullChecks": true,
    "strictPropertyInitialization": false
  }
}
`,
      },
    ];
  },
};
