require('dotenv').config();
const { google } = require('googleapis');
const fs = require('fs');
const path = require('path');

const inspectRows = async () => {
  try {
    let authConfig = {
      scopes: ['https://www.googleapis.com/auth/spreadsheets']
    };

    const keyPath1 = path.join(__dirname, 'config', 'google-indexing-key.json');
    if (process.env.GOOGLE_INDEXING_CREDENTIALS) {
      authConfig.credentials = JSON.parse(process.env.GOOGLE_INDEXING_CREDENTIALS);
    } else if (fs.existsSync(keyPath1)) {
      authConfig.keyFile = keyPath1;
    }

    const auth = new google.auth.GoogleAuth(authConfig);
    const authClient = await auth.getClient();
    const sheets = google.sheets({ version: 'v4', auth: authClient });
    const spreadsheetId = process.env.GOOGLE_SPREADSHEET_ID;

    const res = await sheets.spreadsheets.values.get({
      spreadsheetId,
      range: `'Income Tracker(new)'!A1:G100`,
      valueRenderOption: 'FORMATTED_VALUE'
    });

    const rows = res.data.values || [];
    console.log(`Total rows in sheet: ${rows.length}\n`);

    let monthlyCount = 0;
    let yearlyCount = 0;

    for (let r = 0; r < rows.length; r++) {
      const row = rows[r];
      if (!row || row.length < 2) continue;

      const dateCol = (row[0] || '').trim();
      const nameCol = (row[1] || '').trim();
      const monthlyVal = Number(row[3]) || 0;
      const yearlyVal = Number(row[4]) || 0;

      const isSummary = nameCol.toLowerCase().includes('total') || dateCol.toLowerCase().includes('total');

      if (monthlyVal > 0) {
        console.log(`Row ${r + 1} | Date: ${dateCol} | Name: "${nameCol}" | Monthly: ₹${monthlyVal} ${isSummary ? '[SUMMARY ROW]' : '[TRANSACTION]'}`);
        if (!isSummary) monthlyCount++;
      }
      if (yearlyVal > 0) {
        console.log(`Row ${r + 1} | Date: ${dateCol} | Name: "${nameCol}" | Yearly: ₹${yearlyVal} ${isSummary ? '[SUMMARY ROW]' : '[TRANSACTION]'}`);
        if (!isSummary) yearlyCount++;
      }
    }

    console.log(`\nActual Non-Summary Row Counts:`);
    console.log(`Monthly Transactions: ${monthlyCount}`);
    console.log(`Yearly Transactions: ${yearlyCount}`);

    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
};

inspectRows();
