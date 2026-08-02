const fs = require('fs');
const path = require('path');

const csvPath = path.join(__dirname, 'UBD_1832_FULL_SEMANTIC_AUDIT_SEO_CATEGORIES (1).csv');
const content = fs.readFileSync(csvPath, 'utf8');
const lines = content.split('\n');

const newSubcategories = [];
lines.slice(1).forEach(line => {
  const parts = line.split(',');
  if (parts[1]) {
    newSubcategories.push(parts[1].trim().toLowerCase());
  }
});

const oldCategories = [
  'website designing',
  'grocery stores',
  'bakeries',
  'temples',
  'restaurants',
  'schools',
  'salons & barbers',
  'electricians',
  'poultry farms',
  'hearing center',
  'driving schools',
  'bus operators',
  'gift shops'
];

console.log('Finding matches in CSV:');
oldCategories.forEach(old => {
  const directMatches = newSubcategories.filter(sub => sub === old);
  const partialMatches = newSubcategories.filter(sub => sub.includes(old) || old.includes(sub));
  console.log(`\nOld Category: "${old}"`);
  console.log('Direct matches:', directMatches);
  console.log('Partial/Fuzzy matches:', partialMatches.slice(0, 10));
});
