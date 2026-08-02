const fs = require('fs');

const file = 'c:/Users/haris/OneDrive/Desktop/full stack/udtbusiness/frontend/src/App.jsx';
const code = fs.readFileSync(file, 'utf8');
const lines = code.split('\n');

console.log('--- ROUTE DEFINITION FOR businesses IN App.jsx ---');
lines.forEach((line, index) => {
  if (line.includes('businesses') || line.includes('SlugRouteWrapper')) {
    console.log(`${index + 1}: ${line.trim()}`);
  }
});
