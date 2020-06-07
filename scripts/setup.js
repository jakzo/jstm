const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

try {
  try {
    execSync('yarn', { stdio: 'inherit' });
  } catch {
    console.log('^ a "MODULE_NOT_FOUND" error for project.js is expected');
  }

  // Symlink the project directory into node_modules/@jakzo/project
  execSync('yarn link', { stdio: 'inherit' });
  execSync('yarn link "@jakzo/project"', { stdio: 'inherit' });

  // Build to dist
  fs.copyFileSync(
    path.join(__dirname, '..', 'src', 'config', 'tsconfig.json'),
    path.join(__dirname, '..', 'tsconfig.json'),
  );
  execSync('yarn tsc', { stdio: 'inherit' });

  // Run `yarn install` again and the postinstall script should succeed
  execSync('yarn', { stdio: 'inherit' });
} catch (err) {
  console.error(err);
  process.exit(1);
}
