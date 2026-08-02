const fs = require('fs');

function findLogoInput(filePath) {
  const code = fs.readFileSync(filePath, 'utf8');
  const lines = code.split('\n');
  console.log(`=== LOGO IN ${filePath} ===`);
  lines.forEach((line, index) => {
    if (line.includes('logoUrl') || line.includes('Logo') || line.includes('upload') || line.includes('file')) {
      if (line.includes('input') || line.includes('label') || line.includes('Upload') || line.includes('Choose') || line.includes('File')) {
        console.log(`${index + 1}: ${line.trim()}`);
      }
    }
  });
}

findLogoInput('c:/Users/haris/OneDrive/Desktop/full stack/udtbusiness/frontend/src/app/add-business/page.jsx');
findLogoInput('c:/Users/haris/OneDrive/Desktop/full stack/udtbusiness/frontend/src/app/dashboard/page.jsx');
