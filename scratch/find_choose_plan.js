const fs = require('fs');
const code = fs.readFileSync('c:/Users/haris/OneDrive/Desktop/full stack/udtbusiness/frontend/src/app/choose-plan/page.jsx', 'utf8');
const lines = code.split('\n');
lines.forEach((line, index) => {
  if (line.includes('monthly premium') || line.includes('Monthly') || line.includes('₹0') || line.includes('FAQ') || line.includes('Question') || line.includes('Get Started')) {
    console.log(`${index + 1}: ${line.trim()}`);
  }
});
