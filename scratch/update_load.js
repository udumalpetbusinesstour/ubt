const fs = require('fs');

function updateFile(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');
  
  let lines = content.split('\n');
  let inUseEffect = false;
  let bracketsCount = 0;
  
  for (let i = 0; i < lines.length; i++) {
    let line = lines[i];
    
    if (line.includes('useEffect')) {
      inUseEffect = true;
      bracketsCount = 0;
    }
    
    if (inUseEffect) {
      bracketsCount += (line.match(/\{/g) || []).length;
      bracketsCount -= (line.match(/\}/g) || []).length;
      if (bracketsCount <= 0 && i > 0 && lines[i-1].includes('}')) {
        inUseEffect = false;
      }
    }
    
    if (line.includes('loadPlatformRealData()') && !inUseEffect && !line.includes('async')) {
      lines[i] = line.replace('loadPlatformRealData()', 'loadPlatformRealData(true)');
      console.log(`Updated ${filePath}:${i+1} -> loadPlatformRealData(true)`);
    }
  }
  
  fs.writeFileSync(filePath, lines.join('\n'), 'utf8');
}

updateFile('frontend/src/app/superadmin/page.jsx');
updateFile('frontend/src/app/admin/page.jsx');
console.log('Update complete!');
