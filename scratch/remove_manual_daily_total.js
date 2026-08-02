const { google } = require('../backend/node_modules/googleapis');
const path = require('path');
const dotenv = require('../backend/node_modules/dotenv');
const fs = require('fs');
dotenv.config({ path: path.join(__dirname, '../backend/.env') });

async function removeDailyTotalRow() {
  try {
    const keyPath = path.join(__dirname, '../backend/config/google-indexing-key.json');
    let authConfig = {
      scopes: [
        'https://www.googleapis.com/auth/indexing',
        'https://www.googleapis.com/auth/spreadsheets'
      ]
    };

    if (process.env.GOOGLE_INDEXING_CREDENTIALS) {
      authConfig.credentials = JSON.parse(process.env.GOOGLE_INDEXING_CREDENTIALS);
    } else if (fs.existsSync(keyPath)) {
      authConfig.keyFile = keyPath;
    }

    const auth = new google.auth.GoogleAuth(authConfig);
    const sheets = google.sheets({ version: 'v4', auth: await auth.getClient() });
    const spreadsheetId = process.env.GOOGLE_SPREADSHEET_ID;
    const targetTab = 'Income Tracker(new)';

    const getRes = await sheets.spreadsheets.values.get({
      spreadsheetId,
      range: `'${targetTab}'!A:G`
    });

    const rows = getRes.data.values || [];
    console.log(`Total rows currently in Google Sheet: ${rows.length}`);

    // Remove row if it is a Daily Total row for today 20/07/2026
    const cleanedRows = rows.filter((row, index) => {
      const dateCell = row[0] || '';
      const bizCell = row[1] || '';
      if (bizCell.toLowerCase().includes('daily total') && (dateCell.includes('20/07/2026') || dateCell.includes('20/7/2026'))) {
        console.log(`Removing manually appended Daily Total row at line ${index + 1}`);
        return false;
      }
      return true;
    });

    if (cleanedRows.length < rows.length) {
      await sheets.spreadsheets.values.clear({
        spreadsheetId,
        range: `'${targetTab}'!A:G`
      });

      await sheets.spreadsheets.values.update({
        spreadsheetId,
        range: `'${targetTab}'!A1`,
        valueInputOption: 'USER_ENTERED',
        resource: {
          values: cleanedRows
        }
      });
      console.log(`Removed premature Daily Total row successfully. Remaining rows: ${cleanedRows.length}`);
    } else {
      console.log('No manual Daily Total row found for 20/07/2026.');
    }
  } catch (err) {
    console.error('Error removing Daily Total row:', err);
  }
}

removeDailyTotalRow();
