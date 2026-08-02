require('dotenv').config();
const { google } = require('googleapis');
const fs = require('fs');
const path = require('path');

const inspectJ1J2 = async () => {
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
      range: `'Income Tracker(new)'!I1:K10`,
      valueRenderOption: 'FORMATTED_VALUE'
    });

    console.log('--- CELLS I1:K10 FORMATTED VALUES ---');
    console.log(res.data.values);

    const resRaw = await sheets.spreadsheets.values.get({
      spreadsheetId,
      range: `'Income Tracker(new)'!I1:K10`,
      valueRenderOption: 'UNFORMATTED_VALUE'
    });

    console.log('--- CELLS I1:K10 RAW UNFORMATTED VALUES ---');
    console.log(resRaw.data.values);

    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
};

inspectJ1J2();
