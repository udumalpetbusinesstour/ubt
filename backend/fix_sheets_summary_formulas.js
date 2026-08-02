require('dotenv').config();
const { google } = require('googleapis');
const fs = require('fs');
const path = require('path');

const fixSummaryTable = async () => {
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

    // Update summary formulas in J5, K5, J6, K6
    // Row 5: Monthly Premium
    // J5 (Revenue): =SUMIFS(D2:D998, B2:B998, "<>Daily Total", B2:B998, "<>Weekly Total", B2:B998, "<>Accounts Consultancy", B2:B998, "<>Mallis Home care")
    // K5 (Count): =COUNTIFS(B2:B998, "<>Daily Total", B2:B998, "<>Weekly Total", D2:D998, ">0")

    console.log('Updating summary formulas for Monthly & Yearly Premium...');

    await sheets.spreadsheets.values.update({
      spreadsheetId,
      range: `'${tabTitle}'!J5:K6`,
      valueInputOption: 'USER_ENTERED',
      requestBody: {
        values: [
          [
            '=SUMIFS(D2:D998, B2:B998, "<>Daily Total", B2:B998, "<>Weekly Total")',
            '=COUNTIFS(B2:B998, "<>Daily Total", B2:B998, "<>Weekly Total", D2:D998, ">0")'
          ],
          [
            '=SUMIFS(E2:E998, B2:B998, "<>Daily Total", B2:B998, "<>Weekly Total")',
            '=COUNTIFS(B2:B998, "<>Daily Total", B2:B998, "<>Weekly Total", E2:E998, ">0")'
          ]
        ]
      }
    });

    console.log('Summary formulas successfully updated!');
    process.exit(0);
  } catch (err) {
    console.error('Error updating summary formulas:', err);
    process.exit(1);
  }
};

fixSummaryTable();
