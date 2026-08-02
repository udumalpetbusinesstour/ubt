const fs = require('fs');

const file = 'c:/Users/haris/OneDrive/Desktop/full stack/udtbusiness/frontend/src/app/businesses/page.jsx';
const code = fs.readFileSync(file, 'utf8');
const lines = code.split('\n');

console.log('--- fetchBusinesses IN page.jsx ---');
let start = false;
lines.forEach((line, index) => {
  if (line.includes('const fetchBusinesses =')) {
    start = true;
  }
  if (start) {
    console.log(`${index + 1}: ${line}`);
    if (line.includes('const ') && !line.includes('const fetchBusinesses') || line.includes('return ') || line.includes('useEffect(')) {
      // stop after first inner const / return
    }
    if (line.includes('};') && line.trim() === '};') {
      start = false;
    }
  }
});
