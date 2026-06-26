const fs = require('fs');
const path = require('path');

const srcDir = path.join(__dirname, '../frontend/src');

function walkDir(dir, callback) {
  fs.readdirSync(dir).forEach(f => {
    const dirPath = path.join(dir, f);
    const isDirectory = fs.statSync(dirPath).isDirectory();
    if (isDirectory) {
      walkDir(dirPath, callback);
    } else {
      callback(dirPath);
    }
  });
}

console.log('Starting container max-width expansion scan...');
let filesUpdated = 0;

walkDir(srcDir, filePath => {
  const ext = path.extname(filePath);
  if (ext === '.jsx' || ext === '.js') {
    let content = fs.readFileSync(filePath, 'utf8');
    if (content.includes('max-w-[1440px]')) {
      console.log(`Updating container width in: ${filePath}`);
      content = content.replace(/max-w-\[1440px\]/g, 'max-w-[1680px] 2xl:max-w-[1820px]');
      fs.writeFileSync(filePath, content, 'utf8');
      filesUpdated++;
    }
  }
});

console.log(`Scan complete. Successfully updated ${filesUpdated} files.`);
