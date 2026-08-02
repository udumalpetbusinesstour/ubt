const fs = require('fs');

function processFile(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');
  let lines = content.split(/\r?\n/);
  let updatedLines = [];
  
  for (let i = 0; i < lines.length; i++) {
    let line = lines[i];
    
    // If we find the rename prompt line
    if (line.includes('Rename category:') && line.includes('cat.categoryName')) {
      // Find the <button line upwards
      let buttonLineIdx = -1;
      for (let j = i - 1; j >= Math.max(0, i - 10); j--) {
        if (lines[j].trim().startsWith('<button')) {
          buttonLineIdx = j;
          break;
        }
      }
      
      if (buttonLineIdx !== -1) {
        // Get the indent of the <button line
        const buttonLine = lines[buttonLineIdx];
        const indentMatch = buttonLine.match(/^(\s*)/);
        const indent = indentMatch ? indentMatch[1] : '';
        
        // Check if Move button is already inserted before this button
        const previousLine = lines[buttonLineIdx - 1] || '';
        if (!previousLine.includes('setMovingCategory')) {
          // Construct the Move button with correct indentation
          const moveButtonLines = [
            `${indent}<button`,
            `${indent}  onClick={() => setMovingCategory(cat)}`,
            `${indent}  className="h-7 px-2 rounded-lg border border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-900 flex items-center justify-center cursor-pointer text-slate-550 dark:text-slate-300 font-extrabold text-[9.5px]"`,
            `${indent}  title="Move"`,
            `${indent}>`,
            `${indent}  Move`,
            `${indent}</button>`
          ];
          
          // Insert the move button lines at buttonLineIdx
          lines.splice(buttonLineIdx, 0, ...moveButtonLines);
          // Adjust our outer loop index because we just inserted lines
          i += moveButtonLines.length;
          console.log(`Successfully added Move button in ${filePath} near line ${buttonLineIdx + 1}`);
        } else {
          console.log(`Move button already exists in ${filePath} near line ${buttonLineIdx + 1}`);
        }
      }
    }
  }
  
  fs.writeFileSync(filePath, lines.join('\n'), 'utf8');
}

processFile('frontend/src/app/superadmin/page.jsx');
processFile('frontend/src/app/admin/page.jsx');
console.log('Robust processing complete!');
