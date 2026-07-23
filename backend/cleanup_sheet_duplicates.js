require('dotenv').config();
const { google } = require('googleapis');
const fs = require('fs');
const path = require('path');

const cleanupDuplicates = async () => {
  try {
    let authConfig = {
      scopes: ['https://www.googleapis.com/auth/spreadsheets']
    };

    const keyPath1 = path.join(__dirname, 'config', 'google-indexing-key.json');
    if (process.env.GOOGLE_INDEXING_CREDENTIALS) {
      authConfig.credentials = JSON.parse(process.env.GOOGLE_INDEXING_CREDENTIALS);
    } else if (fs.existsSync(keyPath1)) {
      authConfig.keyFile = keyPath1;
    } else {
      console.error('Google Credentials key not found.');
      process.exit(1);
    }

    const auth = new google.auth.GoogleAuth(authConfig);
    const authClient = await auth.getClient();
    const sheets = google.sheets({ version: 'v4', auth: authClient });
    const spreadsheetId = process.env.GOOGLE_SPREADSHEET_ID;

    if (!spreadsheetId) {
      console.error('GOOGLE_SPREADSHEET_ID is not set in environment.');
      process.exit(1);
    }

    console.log(`Fetching spreadsheet metadata for ${spreadsheetId}...`);
    const meta = await sheets.spreadsheets.get({ spreadsheetId });
    
    // We will audit tabs like 'Income Tracker(new)', 'Income tracker(autopay)'
    const targetTabs = ['Income Tracker(new)', 'Income tracker(autopay)', 'Income Tracker New', 'Income Tracker', 'Autopay', 'Income Tracker Autopay'];
    const activeTabs = meta.data.sheets.filter(s => 
      targetTabs.some(t => t.toLowerCase() === s.properties.title.toLowerCase())
    );

    for (const tabObj of activeTabs) {
      const tabTitle = tabObj.properties.title;
      const sheetId = tabObj.properties.sheetId;
      console.log(`\n--- Auditing Tab: "${tabTitle}" (sheetId: ${sheetId}) ---`);

      const res = await sheets.spreadsheets.values.get({
        spreadsheetId,
        range: `${tabTitle}!A:G`
      });

      const rows = res.data.values;
      if (!rows || rows.length === 0) {
        console.log(`No rows found in tab "${tabTitle}". Skipping.`);
        continue;
      }

      console.log(`Read ${rows.length} rows from tab "${tabTitle}".`);

      const seenTransactions = new Set();
      const seenDailyTotals = new Set();
      const rowsToDelete = []; // 0-indexed row numbers to delete

      for (let i = 0; i < rows.length; i++) {
        const row = rows[i];
        if (!row || row.length === 0) continue;

        const date = (row[0] || '').trim();
        const businessName = (row[1] || '').trim();
        const total = (row[2] || '').trim();

        if (!date) continue; // Skip empty rows or header blocks

        // Skip Month Header rows (e.g. "July 2026")
        if (businessName === '' && total === '' && date.includes(' ')) {
          continue;
        }
        
        // Skip Main Columns Header row
        if (date.toLowerCase() === 'date' && businessName.toLowerCase() === 'business name') {
          continue;
        }

        if (businessName.toLowerCase() === 'daily total') {
          // If it is a Daily Total row, check if we already saw a Daily Total for this date
          const dailyTotalKey = `${date}_daily_total`;
          if (seenDailyTotals.has(dailyTotalKey)) {
            console.log(`Found duplicate Daily Total row at line ${i + 1}: Date = ${date}, Row =`, row);
            rowsToDelete.push(i);
          } else {
            seenDailyTotals.add(dailyTotalKey);
          }
        } else if (businessName) {
          // It is a standard transaction row
          const transactionKey = `${date}_${businessName.toLowerCase()}_${total}`;
          if (seenTransactions.has(transactionKey)) {
            console.log(`Found duplicate transaction row at line ${i + 1}: Date = ${date}, Name = ${businessName}, Total = ${total}`);
            rowsToDelete.push(i);
          } else {
            seenTransactions.add(transactionKey);
          }
        }
      }

      if (rowsToDelete.length === 0) {
        console.log(`No duplicates found in tab "${tabTitle}".`);
        continue;
      }

      console.log(`Identified ${rowsToDelete.length} duplicate rows to delete in tab "${tabTitle}".`);

      // Sort row indices in descending order so that deleting higher indices first doesn't shift the lower indices!
      rowsToDelete.sort((a, b) => b - a);

      // Group consecutive rows to delete or send individual delete dimension requests
      const requests = rowsToDelete.map(rowIndex => ({
        deleteDimension: {
          range: {
            sheetId,
            dimension: 'ROWS',
            startIndex: rowIndex,
            endIndex: rowIndex + 1
          }
        }
      }));

      // Execute batches in chunks of 50 to avoid API limits if there are many duplicates
      const chunkSize = 50;
      for (let k = 0; k < requests.length; k += chunkSize) {
        const batchRequests = requests.slice(k, k + chunkSize);
        console.log(`Sending batch delete request for rows ${k + 1} to ${Math.min(k + chunkSize, requests.length)}...`);
        await sheets.spreadsheets.batchUpdate({
          spreadsheetId,
          requestBody: {
            requests: batchRequests
          }
        });
      }

      console.log(`Deduplication for tab "${tabTitle}" completed successfully!`);
    }

    console.log('\n--- All requested Google Sheets tabs cleaned up successfully! ---');
    process.exit(0);
  } catch (err) {
    console.error('Error during Google Sheets cleanup:', err);
    process.exit(1);
  }
};

cleanupDuplicates();
