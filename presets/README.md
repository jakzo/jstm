All files in this directory refer to a preset and will be published as their own package. There are a few rules for files in this directory to make sure their packages can be generated correctly:

- Relative imports are not allowed. To import from the `core` directory you can use `@jstm/core`.
- Every file must have a default export which is of type `Preset`.
- Do not use external dependencies from node_modules. The generated package will not include any dependencies other than `@jstm/core`.
