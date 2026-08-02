const fs = require('fs');
const path = require('path');

const targetFile = path.join(__dirname, '../frontend/src/components/ReviewsReputationTab.jsx');
const fileContent = fs.readFileSync(targetFile, 'utf8');

const lines = fileContent.split('\n');
lines.forEach((line, index) => {
  if (line.includes('.map') || line.includes('authorName') || line.includes('rating') || line.includes('text') || line.includes('reviewText')) {
    console.log(`${index + 1}: ${line.trim()}`);
  }
});
