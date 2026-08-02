const fs = require('fs');

const file = 'c:/Users/haris/OneDrive/Desktop/full stack/udtbusiness/frontend/src/app/superadmin/page.jsx';
const code = fs.readFileSync(file, 'utf8');
const lines = code.split('\n');

console.log('--- SEARCHING BUSINESS LICENSES ---');
lines.forEach((line, index) => {
  if (line.toLowerCase().includes('licenses') || line.toLowerCase().includes('payment transactions') || line.toLowerCase().includes('amount paid')) {
    console.log(`${index + 1}: ${line.trim()}`);
  }
});
