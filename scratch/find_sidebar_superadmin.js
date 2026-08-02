const fs = require('fs');
const code = fs.readFileSync('c:/Users/haris/OneDrive/Desktop/full stack/udtbusiness/frontend/src/app/superadmin/page.jsx', 'utf8');
const lines = code.split('\n');
lines.forEach((line, index) => {
  if (line.includes('setActiveTab') || line.includes('activeTab') || line.includes('<aside') || line.includes('searchParams.set')) {
    console.log(`${index + 1}: ${line.trim()}`);
  }
});
