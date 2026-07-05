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

const frontendFiles = getAllFiles('d:/Programming/fullstack/learncurve/learncurve-main/src').filter(f => f.match(/\.(js|jsx|ts|tsx)$/));
const backendFiles = getAllFiles('d:/Programming/fullstack/learncurve/learncurve-main/backend/src').filter(f => f.match(/\.(js|jsx|ts|tsx)$/));

function getUnused(files, baseDir, ignoreFiles) {
  const contents = files.map(f => fs.readFileSync(f, 'utf8'));
  const unused = [];
  
  for (const file of files) {
    if (ignoreFiles.some(ign => file.replace(/\\/g, '/').endsWith(ign))) continue;
    
    let baseName = path.basename(file, path.extname(file));
    if (baseName === 'index') continue;
    
    let isUsed = false;
    for (let i = 0; i < files.length; i++) {
      if (files[i] !== file) {
        if (contents[i].includes(baseName)) {
            isUsed = true;
            break;
        }
      }
    }
    
    if (!isUsed) unused.push(file.replace(path.normalize(baseDir), ''));
  }
  return unused;
}

const fUnused = getUnused(frontendFiles, 'd:/Programming/fullstack/learncurve/learncurve-main/src', ['main.jsx', 'App.jsx']);
const bUnused = getUnused(backendFiles, 'd:/Programming/fullstack/learncurve/learncurve-main/backend/src', ['server.ts', 'app.ts']);

fs.writeFileSync('scan_result.txt', 'Frontend Unused:\n' + fUnused.join('\n') + '\n\nBackend Unused:\n' + bUnused.join('\n'));
