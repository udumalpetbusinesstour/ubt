const fs = require('fs');
const content = fs.readFileSync('C:/Users/haris/OneDrive/Desktop/full stack/udtbusiness/frontend/src/app/superadmin/page.jsx', 'utf8');

const lines = content.split('\n');
console.log("Superadmin queries state and usage:");
lines.forEach((line, idx) => {
  if (line.includes('queries') || line.includes('Queries')) {
    console.log(`${idx + 1}: ${line.trim()}`);
  }
});
