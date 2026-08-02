const fs = require('fs');
const path = require('path');

const targetFile = path.join(__dirname, '../frontend/src/app/businesses/[id]/page.jsx');
const fileContent = fs.readFileSync(targetFile, 'utf8');

const lines = fileContent.split('\n');
lines.forEach((line, index) => {
  if (line.includes('fetch(') || line.includes('get(') || line.includes('axios') || line.includes('setBusiness(')) {
    console.log(`${index + 1}: ${line.trim()}`);
  }
});
