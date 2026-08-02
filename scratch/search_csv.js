const fs = require('fs');
const path = require('path');

const csvPath = path.join(__dirname, 'UBD_1832_FULL_SEMANTIC_AUDIT_SEO_CATEGORIES (1).csv');
const lines = fs.readFileSync(csvPath, 'utf8').split('\n');

const searchTerms = ['web', 'design', 'groc', 'temp', 'salon', 'barber', 'hear', 'bus', 'travel', 'gift'];

console.log('Search results in CSV:');
searchTerms.forEach(term => {
  console.log(`\n--- Matches for term: "${term}" ---`);
  const matches = [];
  lines.forEach((line, index) => {
    if (line.toLowerCase().includes(term)) {
      matches.push(`${index}: ${line.trim()}`);
    }
  });
  console.log(matches.slice(0, 15).join('\n'));
  if (matches.length > 15) console.log(`... and ${matches.length - 15} more matches.`);
});
