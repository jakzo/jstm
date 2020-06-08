const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const main = async () => {
  try {
    // Symlink the project directory into node_modules/@jakzo/project
    execSync('yarn link', { stdio: 'inherit' });
    execSync('yarn link "@jakzo/project"', { stdio: 'inherit' });

    // Build to dist
    fs.writeFileSync(
      path.join(__dirname, '..', 'tsconfig.json'),
      JSON.stringify({
        extends: './src/generate/tsconfig.base.json',
        include: ['src', 'src/**/*.json'],
        exclude: ['**/__*__'],
        compilerOptions: {
          baseUrl: '.',
          rootDir: 'src',
          // TODO: Compile to temporary directory? There may be subtle differences in the builds...
          outDir: 'dist',
        },
      }),
    );
    execSync('yarn tsc', { stdio: 'inherit' });

    // Run `yarn install` again and the postinstall script should run like normal
    // TODO: Add protection against infinite loop of running this file
    execSync('yarn', { stdio: 'inherit' });
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
};

if (require.main === module) void main();

module.exports = { main };
