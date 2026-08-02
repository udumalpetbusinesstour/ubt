const fs = require('fs');

const file = 'c:/Users/haris/OneDrive/Desktop/full stack/udtbusiness/frontend/src/App.jsx';
const code = fs.readFileSync(file, 'utf8');
const lines = code.split('\n');

console.log('--- SlugRouteWrapper IN App.jsx ---');
let start = false;
lines.forEach((line, index) => {
  if (line.includes('function SlugRouteWrapper')) {
    start = true;
  }
  if (start) {
    console.log(`${index + 1}: ${line}`);
    if (line.includes('export default') || line.trim() === '}') {
      start = false;
    }
  }
});
