const fs = require('fs');
const path = require('path');

const targetFile = path.join(__dirname, '../frontend/src/app/businesses/[id]/page.jsx');
const fileContent = fs.readFileSync(targetFile, 'utf8');

const lines = fileContent.split('\n');
lines.forEach((line, index) => {
  const lower = line.toLowerCase();
  if (lower.includes('active') && (lower.includes('tab') || lower.includes('menu') || lower.includes('product'))) {
    if (index > 500 && index < 900) {
      console.log(`${index + 1}: ${line.trim()}`);
    }
  }
});
