require('dotenv').config();
const { google } = require('googleapis');
const fs = require('fs');
const path = require('path');

const deleteDuplicates = async () => {
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

    // Get sheet metadata to find sheetId for 'Income Tracker(new)'
    const meta = await sheets.spreadsheets.get({ spreadsheetId });
    const sheetObj = meta.data.sheets.find(s => s.properties.title === 'Income Tracker(new)');

    if (!sheetObj) {
      console.error('Sheet tab Income Tracker(new) not found');
      process.exit(1);
    }

    const sheetId = sheetObj.properties.sheetId;

    console.log(`Deleting duplicate rows 58 (AGRI SQUARE duplicate) and 4 (Crystal Code Labs duplicate) from sheetId ${sheetId}...`);

    // Delete row 58 first (higher index first to prevent index shift), then row 4
    await sheets.spreadsheets.batchUpdate({
      spreadsheetId,
      requestBody: {
        requests: [
          {
            deleteDimension: {
              range: {
                sheetId,
                dimension: 'ROWS',
                startIndex: 57, // Row 58 (0-indexed 57)
                endIndex: 58
              }
            }
          },
          {
            deleteDimension: {
              range: {
                sheetId,
                dimension: 'ROWS',
                startIndex: 3, // Row 4 (0-indexed 3)
                endIndex: 4
              }
            }
          }
        ]
      }
    });

    console.log('Duplicate rows successfully deleted from Google Sheets!');
    process.exit(0);
  } catch (err) {
    console.error('Error deleting duplicate rows:', err);
    process.exit(1);
  }
};

deleteDuplicates();
