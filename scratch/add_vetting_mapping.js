const fs = require('fs');

function processVettingFile() {
  const filePath = 'frontend/src/app/superadmin/page.jsx';
  let content = fs.readFileSync(filePath, 'utf8');
  
  // 1. Declare customNewCategoryParent state
  const stateSearch = 'const [customNewCategoryIcon, setCustomNewCategoryIcon] = useState(\'Store\');';
  const stateReplace = 'const [customNewCategoryIcon, setCustomNewCategoryIcon] = useState(\'Store\');\n  const [customNewCategoryParent, setCustomNewCategoryParent] = useState(\'\');';
  content = content.replace(stateSearch, stateReplace);

  // 2. Sync state in useEffect
  const useEffectSearch = 'setCustomNewCategoryIcon(mapKeywordToIcon(customName));';
  const useEffectReplace = 'setCustomNewCategoryIcon(mapKeywordToIcon(customName));\n      setCustomNewCategoryParent(\'\');';
  content = content.replace(useEffectSearch, useEffectReplace);

  // 3. Update handleResolveCategory signature and payload
  const functionSearch = 'const handleResolveCategory = async (bizId, action, categoryId = null, newCategoryName = \'\', icon = \'\') => {\r\n    try {\r\n      const res = await fetch(\'http://localhost:5000/api/superadmin/category-review/resolve\', {\r\n        method: \'POST\',\r\n        headers: {\r\n          \'Content-Type\': \'application/json\',\r\n          \'Authorization\': `Bearer ${localStorage.getItem(\'ubt_token\')}`\r\n        },\r\n        body: JSON.stringify({\r\n          businessId: bizId,\r\n          action,\r\n          categoryId,\r\n          newCategoryName,\r\n          icon\r\n        })';
          
  const functionSearchLF = 'const handleResolveCategory = async (bizId, action, categoryId = null, newCategoryName = \'\', icon = \'\') => {\n    try {\n      const res = await fetch(\'http://localhost:5000/api/superadmin/category-review/resolve\', {\n        method: \'POST\',\n        headers: {\n          \'Content-Type\': \'application/json\',\n          \'Authorization\': `Bearer ${localStorage.getItem(\'ubt_token\')}`\n        },\n        body: JSON.stringify({\n          businessId: bizId,\n          action,\n          categoryId,\n          newCategoryName,\n          icon\n        })';

  const functionReplace = 'const handleResolveCategory = async (bizId, action, categoryId = null, newCategoryName = \'\', icon = \'\', parentCategory = \'\') => {\n    try {\n      const res = await fetch(\'http://localhost:5000/api/superadmin/category-review/resolve\', {\n        method: \'POST\',\n        headers: {\n          \'Content-Type\': \'application/json\',\n          \'Authorization\': `Bearer ${localStorage.getItem(\'ubt_token\')}`\n        },\n        body: JSON.stringify({\n          businessId: bizId,\n          action,\n          categoryId,\n          newCategoryName,\n          icon,\n          parentCategory\n        })';

  if (content.includes(functionSearch)) {
    content = content.replace(functionSearch, functionReplace);
  } else if (content.includes(functionSearchLF)) {
    content = content.replace(functionSearchLF, functionReplace);
  } else {
    // Fallback search replace for signature only
    content = content.replace('const handleResolveCategory = async (bizId, action, categoryId = null, newCategoryName = \'\', icon = \'\') =>', 
                              'const handleResolveCategory = async (bizId, action, categoryId = null, newCategoryName = \'\', icon = \'\', parentCategory = \'\') =>');
    content = content.replace('body: JSON.stringify({\n          businessId: bizId,\n          action,\n          categoryId,\n          newCategoryName,\n          icon\n        })',
                              'body: JSON.stringify({\n          businessId: bizId,\n          action,\n          categoryId,\n          newCategoryName,\n          icon,\n          parentCategory\n        })');
  }

  // 4. Inject parent category select selector in Vetting Panel (Option 2)
  const selectSnippet = `
                        <div className="flex flex-col gap-1 text-left mt-2">
                          <label className="text-[10px] font-bold text-slate-500 uppercase">Map to Main Category</label>
                          <select
                            value={customNewCategoryParent}
                            onChange={(e) => setCustomNewCategoryParent(e.target.value)}
                            className={\`w-full text-xs rounded-xl px-3 py-2 outline-none font-bold \${
                              themeMode === 'dark' ? 'bg-slate-900 border border-slate-800 text-white' : 'bg-white border border-slate-200 text-slate-800'
                            }\`}
                          >
                            <option value="">-- Choose Main Category --</option>
                            {Array.from(new Set(presetCategories.map(c => c.parentCategory).filter(Boolean))).sort().map(p => (
                              <option key={p} value={p}>{p}</option>
                            ))}
                            <option value="Others">Others</option>
                          </select>
                        </div>
  `;

  // Search button and insert selector before it
  const btnSearch = 'onClick={() => handleResolveCategory(selectedBiz._id, \'create\', null, customNewCategoryName, customNewCategoryIcon)}';
  const btnReplace = 'onClick={() => handleResolveCategory(selectedBiz._id, \'create\', null, customNewCategoryName, customNewCategoryIcon, customNewCategoryParent)}';
  content = content.replace(btnSearch, btnReplace);

  // We can insert selectSnippet right before the button block:
  const suggestedIconDivSearch = '<div className="flex items-center justify-between text-[10px] text-slate-500 font-bold px-1">\n                          <span className="flex items-center gap-1">\n                            Suggested Icon: \n                            <span className="text-amber-500 flex items-center gap-1 font-extrabold uppercase">\n                              {renderIconByName(customNewCategoryIcon, "h-3.5 w-3.5 inline")} \n                              {customNewCategoryIcon}\n                            </span>\n                          </span>\n                        </div>';
  
  const suggestedIconDivSearchCRLF = '<div className="flex items-center justify-between text-[10px] text-slate-500 font-bold px-1">\r\n                          <span className="flex items-center gap-1">\r\n                            Suggested Icon: \r\n                            <span className="text-amber-500 flex items-center gap-1 font-extrabold uppercase">\r\n                              {renderIconByName(customNewCategoryIcon, "h-3.5 w-3.5 inline")} \r\n                              {customNewCategoryIcon}\r\n                            </span>\r\n                          </span>\r\n                        </div>';

  if (content.includes(suggestedIconDivSearch)) {
    content = content.replace(suggestedIconDivSearch, suggestedIconDivSearch + '\n' + selectSnippet);
  } else if (content.includes(suggestedIconDivSearchCRLF)) {
    content = content.replace(suggestedIconDivSearchCRLF, suggestedIconDivSearchCRLF + '\r\n' + selectSnippet);
  }
  
  fs.writeFileSync(filePath, content, 'utf8');
  console.log('Successfully updated vetting parent mapping controls in superadmin/page.jsx');
}

processVettingFile();
