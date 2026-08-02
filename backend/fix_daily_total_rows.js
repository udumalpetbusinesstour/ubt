require('dotenv').config();
const { google } = require('googleapis');
const fs = require('fs');
const path = require('path');

const fixDailyTotals = async () => {
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

    const tabTitle = 'Income Tracker(new)';

    // Summary total rows to fix Column B to "Daily Total"
    const summaryRowsToFix = [20, 25, 36, 44, 48];

    console.log('Restoring Column B = "Daily Total" for summary total rows...');

    for (const r of summaryRowsToFix) {
      const cellRange = `'${tabTitle}'!B${r}`;
      console.log(`Fixing Row ${r}...`);
      await sheets.spreadsheets.values.update({
        spreadsheetId,
        range: cellRange,
        valueInputOption: 'USER_ENTERED',
        requestBody: {
          values: [['Daily Total']]
        }
      });
    }

    console.log('Daily Total summary rows successfully restored!');
    process.exit(0);
  } catch (err) {
    console.error('Error fixing summary rows:', err);
    process.exit(1);
  }
};

fixDailyTotals();
