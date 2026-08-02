const fs = require('fs');

const file = 'c:/Users/haris/OneDrive/Desktop/full stack/udtbusiness/frontend/src/app/admin/page.jsx';
const code = fs.readFileSync(file, 'utf8');
const lines = code.split('\n');

console.log('--- ADMIN SUBTABS RENDER ---');
for (let i = 3990; i < 4060; i++) {
  if (lines[i]) {
    console.log(`${i + 1}: ${lines[i]}`);
  }
}
