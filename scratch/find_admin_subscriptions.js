const fs = require('fs');

const file = 'c:/Users/haris/OneDrive/Desktop/full stack/udtbusiness/frontend/src/app/superadmin/page.jsx';
const code = fs.readFileSync(file, 'utf8');
const lines = code.split('\n');

console.log('--- SEARCHING PLATFORM SUBSCRIPTIONS ---');
lines.forEach((line, index) => {
  if (line.toLowerCase().includes('platform') && line.toLowerCase().includes('subscription')) {
    console.log(`${index + 1}: ${line.trim()}`);
  }
});
