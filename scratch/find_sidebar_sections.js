const fs = require('fs');
const code = fs.readFileSync('c:/Users/haris/OneDrive/Desktop/full stack/udtbusiness/frontend/src/app/superadmin/page.jsx', 'utf8');
const lines = code.split('\n');
let start = -1;
lines.forEach((line, index) => {
  if (line.includes('const sidebarSections')) {
    start = index;
  }
});
if (start !== -1) {
  for (let i = start; i < start + 60; i++) {
    console.log(`${i + 1}: ${lines[i]}`);
  }
}
