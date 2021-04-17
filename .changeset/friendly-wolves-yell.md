---
"@jstm/core": minor
---

Dependencies are now added directly to the project's package.json. This is to avoid hoisting issues where a dependency is not available from the top level and cannot be accessed by tools requiring it there (eg. ESLint plugins) or the binary cannot be used (eg. running `prettier` from the project's package.json).
