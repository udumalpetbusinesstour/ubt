const fs = require('fs');
const path = require('path');

const fileAdmin = 'c:/Users/haris/OneDrive/Desktop/full stack/udtbusiness/frontend/src/app/admin/page.jsx';
const fileSuperadmin = 'c:/Users/haris/OneDrive/Desktop/full stack/udtbusiness/frontend/src/app/superadmin/page.jsx';

function searchFile(file, label) {
  if (!fs.existsSync(file)) return;
  const code = fs.readFileSync(file, 'utf8');
  const lines = code.split('\n');
  console.log(`--- REVENUE IN ${label} ---`);
  lines.forEach((line, index) => {
    if (line.toLowerCase().includes('revenue') || line.toLowerCase().includes('earnings') || line.toLowerCase().includes('totalrev')) {
      console.log(`${index + 1}: ${line.trim()}`);
    }
  });
}

searchFile(fileAdmin, 'ADMIN');
searchFile(fileSuperadmin, 'SUPERADMIN');
