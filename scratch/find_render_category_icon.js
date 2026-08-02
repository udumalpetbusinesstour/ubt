const fs = require('fs');

const file = 'c:/Users/haris/OneDrive/Desktop/full stack/udtbusiness/frontend/src/app/businesses/page.jsx';
const code = fs.readFileSync(file, 'utf8');
const lines = code.split('\n');

console.log('--- renderCategoryIcon IN page.jsx ---');
lines.forEach((line, index) => {
  if (line.includes('renderCategoryIcon')) {
    console.log(`${index + 1}: ${line.trim()}`);
  }
});
