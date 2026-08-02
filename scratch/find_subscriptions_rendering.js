const fs = require('fs');

const file = 'c:/Users/haris/OneDrive/Desktop/full stack/udtbusiness/frontend/src/app/superadmin/page.jsx';
const code = fs.readFileSync(file, 'utf8');
const lines = code.split('\n');

console.log('--- SUBSCRIPTIONS TAB IN SUPERADMIN ---');
lines.forEach((line, index) => {
  if (line.includes('PLATFORM SUBSCRIPTIONS') || line.includes('PLATFORM_SUBSCRIPTIONS') || line.includes('activeTab ===') || line.includes('subscriptions') || line.includes('sub.status')) {
    if (line.includes('map(') || line.includes('fetch(') || line.includes('const ') || line.includes('status') || line.includes('className=')) {
      if (index > 4000) {
        console.log(`${index + 1}: ${line.trim()}`);
      }
    }
  }
});
