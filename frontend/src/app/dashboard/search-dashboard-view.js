const fs = require('fs');
const content = fs.readFileSync('c:/Users/haris/OneDrive/Desktop/full stack/udtbusiness/frontend/src/app/dashboard/page.jsx', 'utf8');
const lines = content.split('\n');
lines.forEach((line, idx) => {
  if (line.toLowerCase().includes('view') || line.toLowerCase().includes('detail')) {
    if (line.includes('button') || line.includes('<a') || line.includes('click') || line.includes('onClick')) {
      console.log(`${idx + 1}: ${line.trim()}`);
    }
  }
});
