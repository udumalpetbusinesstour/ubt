const fs = require('fs');
const path = require('path');

function walk(dir) {
  let results = [];
  const list = fs.readdirSync(dir);
  list.forEach(file => {
    file = path.join(dir, file);
    const stat = fs.statSync(file);
    if (stat && stat.isDirectory()) {
      results = results.concat(walk(file));
    } else {
      if (file.endsWith('.js') || file.endsWith('.jsx')) {
        results.push(file);
      }
    }
  });
  return results;
}

const root = 'c:/Users/haris/OneDrive/Desktop/full stack/udtbusiness/frontend/src';
const files = walk(root);
files.forEach(file => {
  const code = fs.readFileSync(file, 'utf8');
  const relativePath = path.relative(root, file);
  if (code.toLowerCase().includes('licenses') || code.toLowerCase().includes('payment transactions') || code.toLowerCase().includes('amount paid')) {
    const lines = code.split('\n');
    lines.forEach((line, index) => {
      if (line.toLowerCase().includes('licenses') || line.toLowerCase().includes('payment transactions') || line.toLowerCase().includes('amount paid')) {
        console.log(`${relativePath}:${index + 1}: ${line.trim()}`);
      }
    });
  }
});
