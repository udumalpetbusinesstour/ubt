const fs = require('fs');
const path = require('path');

function walk(dir) {
  let results = [];
  const list = fs.readdirSync(dir);
  list.forEach(file => {
    file = path.join(dir, file);
    const stat = fs.statSync(file);
    if (stat && stat.isDirectory()) {
      results = results.concat(walk(file));
    } else {
      if (file.endsWith('.js')) {
        results.push(file);
      }
    }
  });
  return results;
}

const root = 'c:/Users/haris/OneDrive/Desktop/full stack/udtbusiness/backend';
const files = walk(root);
files.forEach(file => {
  const code = fs.readFileSync(file, 'utf8');
  const relativePath = path.relative(root, file);
  if (code.includes('SMTP_HOST') || code.includes('nodemailer') || code.includes('sendMail') || code.includes('otp')) {
    const lines = code.split('\n');
    lines.forEach((line, index) => {
      if (line.includes('nodemailer') || line.includes('SMTP_') || line.includes('transport') || line.includes('otp')) {
        console.log(`${relativePath}:${index + 1}: ${line.trim()}`);
      }
    });
  }
});
