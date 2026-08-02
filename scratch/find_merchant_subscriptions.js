const fs = require('fs');

const file = 'c:/Users/haris/OneDrive/Desktop/full stack/udtbusiness/frontend/src/app/dashboard/page.jsx';
const code = fs.readFileSync(file, 'utf8');
const lines = code.split('\n');

console.log('--- MERCHANT SUBSCRIPTIONS IN DASHBOARD ---');
lines.forEach((line, index) => {
  if (line.includes('subscription') || line.includes('plan')) {
    if (line.includes('status') && (line.includes('active') || line.includes('pending') || line.includes('===') || line.includes('map('))) {
      console.log(`${index + 1}: ${line.trim()}`);
    }
  }
});
