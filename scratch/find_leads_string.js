const fs = require('fs');
const code = fs.readFileSync('c:/Users/haris/OneDrive/Desktop/full stack/udtbusiness/frontend/src/app/dashboard/page.jsx', 'utf8');
const lines = code.split('\n');
lines.forEach((line, index) => {
  if (line.includes('No customer leads') || line.includes('No customer') || line.includes('leadsList')) {
    console.log(`${index + 1}: ${line.trim()}`);
  }
});
