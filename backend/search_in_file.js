const fs = require('fs');

const filePath = process.argv[2];
const query = process.argv[3];

if (!filePath || !query) {
  console.log("Usage: node search_in_file.js <file_path> <query_string>");
  process.exit(1);
}

if (!fs.existsSync(filePath)) {
  console.log(`File not found: ${filePath}`);
  process.exit(1);
}

const content = fs.readFileSync(filePath, 'utf8');
const lines = content.split(/\r?\n/);
console.log(`\n=== Search Results in ${filePath} for "${query}" ===`);
let matches = 0;
for (let i = 0; i < lines.length; i++) {
  if (lines[i].toLowerCase().includes(query.toLowerCase())) {
    console.log(`Line ${i + 1}: ${lines[i].trim()}`);
    matches++;
    if (matches >= 40) {
      console.log("Truncated after 40 matches...");
      break;
    }
  }
}
