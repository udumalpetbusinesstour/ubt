const fs = require('fs');

const file = 'c:/Users/haris/OneDrive/Desktop/full stack/udtbusiness/frontend/src/app/admin/page.jsx';
const code = fs.readFileSync(file, 'utf8');
const lines = code.split('\n');

console.log('--- ADMIN SUBSCRIPTIONS FETCH ---');
lines.forEach((line, index) => {
  if (line.includes('const [subscriptions') || line.includes('setSubscriptions') || line.includes('/api/subscriptions')) {
    console.log(`${index + 1}: ${line.trim()}`);
  }
});
