const fs = require('fs');
const path = require('path');

const targetFile = path.join(__dirname, '../backend/models/Business.js');
const fileContent = fs.readFileSync(targetFile, 'utf8');

const lines = fileContent.split('\n');
lines.forEach((line, index) => {
  if (line.includes('menuLabel')) {
    console.log(`${index + 1}: ${line.trim()}`);
  }
});
