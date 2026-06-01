const fs = require('fs');
const content = fs.readFileSync('C:/Users/haris/OneDrive/Desktop/full stack/udtbusiness/frontend/src/app/dashboard/page.jsx', 'utf8');

const lines = content.split('\n');
console.log("Searching for blog view links in dashboard:");
lines.forEach((line, idx) => {
  if (line.includes('/blogs/') || line.includes('My Blogs')) {
    console.log(`${idx + 1}: ${line.trim()}`);
  }
});
