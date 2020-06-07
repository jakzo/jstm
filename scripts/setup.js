const {execSync}=require('child_process');
const path=require('path')

  try{

try{
execSync('yarn',{stdio:"inherit"})
}catch{
  // It is expected that this will fail
}

// Symlink the project directory into node_modules/@jakzo/project
execSync('yarn link',{stdio:"inherit"})
execSync('yarn link "@jakzo/project"',{stdio:"inherit"})

// Build to dist
execSync('yarn tsc -P ./src/config/tsconfig.json --outDir ./node_modules/@jakzo/project/dist',{stdio:"inherit"})

// Run `yarn install` again and the postinstall script should succeed
 execSync('yarn',{stdio:"inherit"})
}catch(err){
  console.error(err)
  process.exit(1)
}
