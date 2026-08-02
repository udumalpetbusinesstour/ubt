const fs = require('fs');
const path = require('path');

const targetFile = path.join(__dirname, '../frontend/src/app/businesses/[id]/page.jsx');
const fileContent = fs.readFileSync(targetFile, 'utf8');

const lines = fileContent.split('\n');
lines.forEach((line, index) => {
  if (line.includes('const tabs =') || line.includes('tabs =') || (line.includes('SERVICES') && line.includes('tab'))) {
    console.log(`${index + 1}: ${line.trim()}`);
  }
});
