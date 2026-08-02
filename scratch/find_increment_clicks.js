const fs = require('fs');
const code = fs.readFileSync('c:/Users/haris/OneDrive/Desktop/full stack/udtbusiness/backend/routes/businesses.js', 'utf8');
const lines = code.split('\n');
lines.forEach((line, index) => {
  if (line.includes('increment-clicks') || line.includes('click') || line.includes('Lead')) {
    console.log(`${index + 1}: ${line.trim()}`);
  }
});
