const fs = require('fs');
const path = require('path');

function getAllFiles(dirPath, arrayOfFiles) {
  if (!fs.existsSync(dirPath)) return arrayOfFiles || [];
  const files = fs.readdirSync(dirPath);
  arrayOfFiles = arrayOfFiles || [];
  files.forEach(function(file) {
    if (fs.statSync(path.join(dirPath, file)).isDirectory()) {
      arrayOfFiles = getAllFiles(path.join(dirPath, file), arrayOfFiles);
    } else {
      arrayOfFiles.push(path.join(dirPath, file));
    }
  });
  return arrayOfFiles;
}

function findUnused(baseDir, entryPoints) {
  const allFiles = getAllFiles(baseDir).filter(f => f.match(/\.(js|jsx|ts|tsx)$/));
  const fileContents = allFiles.map(f => ({
    path: f,
    content: fs.readFileSync(f, 'utf8')
  }));

  const unused = [];
  
  for (const file of allFiles) {
    // skip entry points
    if (entryPoints.some(ep => file.replace(/\\/g, '/').endsWith(ep))) continue;
    
    // get the base name without extension
    const baseName = path.basename(file).split('.')[0];
    
    // Check if the baseName is mentioned in ANY other file.
    // Extremely simplistic check: if the filename (without extension) isn't in any other file's content
    let isUsed = false;
    for (const otherFile of fileContents) {
      if (otherFile.path !== file) {
        // Need to be careful about generic names like 'index'. Let's check for imports
        if (otherFile.content.includes(baseName)) {
            isUsed = true;
            break;
        }
      }
    }
    
    if (!isUsed) {
      unused.push(file.replace(baseDir, ''));
    }
  }
  return unused;
}

const frontendUnused = findUnused('d:/Programming/fullstack/learncurve/learncurve-main/src', ['main.jsx', 'index.js']);
console.log("--- Frontend Potential Unused ---");
console.log(frontendUnused.join('\n'));

const backendUnused = findUnused('d:/Programming/fullstack/learncurve/learncurve-main/backend/src', ['app.ts', 'server.ts', 'index.ts']);
console.log("\n--- Backend Potential Unused ---");
console.log(backendUnused.join('\n'));
