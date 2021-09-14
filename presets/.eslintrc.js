module.exports = {
  overrides: [
    {
      files: ["template/project.ts"],
      rules: {
        "import/no-extraneous-dependencies": "off",
      },
    },
  ],
};
