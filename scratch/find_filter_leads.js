const fs = require('fs');
const code = fs.readFileSync('c:/Users/haris/OneDrive/Desktop/full stack/udtbusiness/frontend/src/app/dashboard/page.jsx', 'utf8');
const lines = code.split('\n');
for (let i = 5450; i < 5520; i++) {
  console.log(`${i + 1}: ${lines[i]}`);
}
