const fs = require('fs');
const path = require('path');

const root = 'c:/Users/haris/OneDrive/Desktop/full stack/udtbusiness/backend';
function walk(dir) {
  let results = [];
  const list = fs.readdirSync(dir);
  list.forEach(file => {
    file = path.join(dir, file);
    const stat = fs.statSync(file);
    if (stat && stat.isDirectory()) {
      results = results.concat(walk(file));
    } else {
      if (file.endsWith('.js')) {
        results.push(file);
      }
    }
  });
  return results;
}

const files = walk(root);
files.forEach(file => {
  const code = fs.readFileSync(file, 'utf8');
  if (code.toLowerCase().includes('revenue') || code.toLowerCase().includes('paymentslog')) {
    const relativePath = path.relative(root, file);
    const lines = code.split('\n');
    lines.forEach((line, index) => {
      if (line.toLowerCase().includes('revenue') || line.toLowerCase().includes('paymentslog') || line.toLowerCase().includes('mock')) {
        if (line.includes('const') || line.includes('function') || line.includes('router.') || line.includes('res.json') || line.includes('let') || line.includes('mock')) {
          console.log(`${relativePath}:${index + 1}: ${line.trim()}`);
        }
      }
    });
  }
});
