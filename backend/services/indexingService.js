const { google } = require('googleapis');
const path = require('path');
const fs = require('fs');

const keyPath = path.join(__dirname, '../config/google-indexing-key.json');

/**
 * Submit a URL to the Google Indexing API
 * @param {string} url The absolute page URL to index
 * @param {string} action The action: 'URL_UPDATED' (create/update/approve) or 'URL_DELETED' (suspend/delete)
 */
const submitToGoogleIndexing = async (url, action = 'URL_UPDATED') => {
  try {
    let authConfig = {
      scopes: ['https://www.googleapis.com/auth/indexing']
    };

    if (process.env.GOOGLE_INDEXING_CREDENTIALS) {
      try {
        const credentials = JSON.parse(process.env.GOOGLE_INDEXING_CREDENTIALS);
        authConfig.credentials = credentials;
      } catch (jsonErr) {
        console.error('[Google Indexing API] Failed to parse GOOGLE_INDEXING_CREDENTIALS env var:', jsonErr.message);
      }
    } else if (fs.existsSync(keyPath)) {
      authConfig.keyFile = keyPath;
    } else {
      console.warn('[Google Indexing API] Neither GOOGLE_INDEXING_CREDENTIALS env nor key file found. Skipping indexing.');
      return null;
    }

    const auth = new google.auth.GoogleAuth(authConfig);

    const authClient = await auth.getClient();
    const indexing = google.indexing({
      version: 'v3',
      auth: authClient
    });

    console.log(`[Google Indexing API] Sending request for: ${url} (Action: ${action})`);
    const res = await indexing.urlNotifications.publish({
      requestBody: {
        url: url,
        type: action
      }
    });

    console.log('[Google Indexing API] Success:', res.data);
    return res.data;
  } catch (error) {
    console.error('[Google Indexing API] Error submitting URL:', error.response ? error.response.data : error.message);
    return null;
  }
};

module.exports = {
  submitToGoogleIndexing
};
