const fs = require('fs');

const modalCode = `
      {/* Move Category Modal */}
      {movingCategory && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 max-w-sm w-full shadow-2xl flex flex-col gap-4 text-left font-sans">
            <div className="flex flex-col gap-1">
              <h3 className="font-extrabold text-sm uppercase tracking-wider text-[#027244] dark:text-emerald-500">Move Subcategory</h3>
              <span className="text-[10px] text-slate-400 font-bold">Re-associate category under a different main classification</span>
            </div>
            
            <div className="flex flex-col gap-2">
              <span className="text-xs font-bold text-slate-500">Subcategory to Move</span>
              <span className="text-sm font-extrabold text-slate-800 dark:text-white bg-slate-100 dark:bg-slate-900 px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800">
                {movingCategory.categoryName}
              </span>
            </div>

            <div className="flex flex-col gap-2">
              <label className="text-xs font-bold text-slate-500">Select New Main Category</label>
              <select
                value={movingCategory.parentCategory || ''}
                onChange={(e) => setMovingCategory({ ...movingCategory, parentCategory: e.target.value })}
                className="w-full text-xs rounded-xl px-3 py-2 outline-none font-bold bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-850 dark:text-white"
              >
                <option value="">-- Select Parent Category --</option>
                {Array.from(new Set(presetCategories.map(c => c.parentCategory).filter(Boolean))).sort().map(parent => (
                  <option key={parent} value={parent}>{parent}</option>
                ))}
                <option value="Others">Others</option>
              </select>
            </div>

            <div className="flex gap-2.5 mt-2 justify-end">
              <button
                type="button"
                onClick={() => setMovingCategory(null)}
                className="px-4 py-2 border border-slate-200 dark:border-slate-800 text-slate-550 dark:text-slate-300 font-extrabold text-[10.5px] rounded-xl cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-900 transition-colors uppercase tracking-wider"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={async () => {
                  const catId = movingCategory._id;
                  const newParent = movingCategory.parentCategory || 'Others';
                  try {
                    const res = await fetch(\`http://localhost:5000/api/categories/\${catId}\`, {
                      method: 'PUT',
                      headers: {
                        'Content-Type': 'application/json',
                        'Authorization': \`Bearer \${localStorage.getItem('ubt_token')}\`
                      },
                      body: JSON.stringify({ parentCategory: newParent })
                    });
                    const data = await res.json();
                    if (data.success) {
                      alert(\`Successfully moved "\${movingCategory.categoryName}" under "\${newParent}"!\`);
                      setMovingCategory(null);
                      loadPlatformRealData(true);
                    } else {
                      alert(data.message || 'Failed to move category.');
                    }
                  } catch (err) {
                    console.error(err);
                    alert('Network error moving category.');
                  }
                }}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-[10.5px] rounded-xl cursor-pointer transition-colors uppercase tracking-wider"
              >
                Confirm Move
              </button>
            </div>
          </div>
        </div>
      )}
`;

function processFile(filePath, isSuperadmin) {
  let content = fs.readFileSync(filePath, 'utf8');
  
  // 1. Add Move button in Accordion view
  const accordionMatch = isSuperadmin 
    ? 'Rename category:", cat.categoryName);\r\n                                                      if (!newName || newName === cat.categoryName) return;\r\n                                                      updatePresetCategory(cat._id, { categoryName: newName });\r\n                                                    }}'
    : 'Rename category:", cat.categoryName);\n                                                      if (!newName || newName === cat.categoryName) return;\n                                                      updatePresetCategory(cat._id, { categoryName: newName });\n                                                    }}';
  
  // Let's use a split and replace approach to find the buttons and insert Move button
  // Let's search for "Rename category:" button block
  const searchEditBtnGroup = isSuperadmin
    ? '<button\r\n                                                    onClick={async () => {\r\n                                                      const newName = await prompt("Rename category:", cat.categoryName);'
    : '<button\n                                                    onClick={async () => {\n                                                      const newName = await prompt("Rename category:", cat.categoryName);';
    
  const replaceEditBtnGroup = isSuperadmin
    ? '<button\r\n                                                    onClick={() => setMovingCategory(cat)}\r\n                                                    className="h-7 px-2 rounded-lg border border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-900 flex items-center justify-center cursor-pointer text-slate-550 dark:text-slate-300 font-extrabold text-[9.5px]"\r\n                                                    title="Move"\r\n                                                  >\r\n                                                    Move\r\n                                                  </button>\r\n                                                  <button\r\n                                                    onClick={async () => {\r\n                                                      const newName = await prompt("Rename category:", cat.categoryName);'
    : '<button\n                                                    onClick={() => setMovingCategory(cat)}\n                                                    className="h-7 px-2 rounded-lg border border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-900 flex items-center justify-center cursor-pointer text-slate-550 dark:text-slate-300 font-extrabold text-[9.5px]"\n                                                    title="Move"\n                                                  >\n                                                    Move\n                                                  </button>\n                                                  <button\n                                                    onClick={async () => {\n                                                      const newName = await prompt("Rename category:", cat.categoryName);';

  content = content.replace(searchEditBtnGroup, replaceEditBtnGroup);
  
  // 2. Add Move button in Flat List view
  const searchEditFlatGroup = isSuperadmin
    ? '<button\r\n                                              onClick={async () => {\r\n                                                const newName = await prompt("Rename category:", cat.categoryName);'
    : '<button\n                                              onClick={async () => {\n                                                const newName = await prompt("Rename category:", cat.categoryName);';
    
  const replaceEditFlatGroup = isSuperadmin
    ? '<button\r\n                                              onClick={() => setMovingCategory(cat)}\r\n                                              className="h-7 px-2 rounded-lg border border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-900 flex items-center justify-center cursor-pointer text-slate-550 dark:text-slate-300 font-extrabold text-[9.5px]"\r\n                                              title="Move"\r\n                                            >\r\n                                              Move\r\n                                            </button>\r\n                                            <button\r\n                                              onClick={async () => {\r\n                                                const newName = await prompt("Rename category:", cat.categoryName);'
    : '<button\n                                              onClick={() => setMovingCategory(cat)}\n                                              className="h-7 px-2 rounded-lg border border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-900 flex items-center justify-center cursor-pointer text-slate-550 dark:text-slate-300 font-extrabold text-[9.5px]"\n                                              title="Move"\n                                            >\n                                              Move\n                                            </button>\n                                            <button\n                                              onClick={async () => {\n                                                const newName = await prompt("Rename category:", cat.categoryName);';

  content = content.replace(searchEditFlatGroup, replaceEditFlatGroup);

  // 3. Add Move modal right before confirmModal
  const searchConfirmModal = isSuperadmin
    ? '{/* Confirm Modal Dialog */}'
    : '{/* Confirm Modal Dialog */}';
    
  const replaceConfirmModal = modalCode + '\n      ' + searchConfirmModal;
  content = content.replace(searchConfirmModal, replaceConfirmModal);
  
  fs.writeFileSync(filePath, content, 'utf8');
  console.log(`Processed ${filePath} buttons & modal.`);
}

// Check lines endings, normalize first if needed
processFile('frontend/src/app/superadmin/page.jsx', true);
processFile('frontend/src/app/admin/page.jsx', false);
console.log('Done!');
