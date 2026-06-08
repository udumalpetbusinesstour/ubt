const fs = require('fs');
const content = fs.readFileSync('C:/Users/haris/OneDrive/Desktop/full stack/udtbusiness/frontend/src/app/add-business/page.jsx', 'utf8');

const lines = content.split('\n');
console.log("Searching in add-business/page.jsx:");
lines.forEach((line, idx) => {
  if (line.includes('highlights')) {
    console.log(`${idx + 1}: ${line.trim()}`);
  }
});





