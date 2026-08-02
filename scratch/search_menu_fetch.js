const fs = require('fs');
const path = require('path');

const targetFile = path.join(__dirname, '../frontend/src/app/businesses/[id]/page.jsx');
const fileContent = fs.readFileSync(targetFile, 'utf8');

const lines = fileContent.split('\n');
lines.forEach((line, index) => {
  if (line.includes('api/menu') || line.includes('setMenuItems')) {
    console.log(`${index + 1}: ${line.trim()}`);
  }
});
