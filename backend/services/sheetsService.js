const { google } = require('googleapis');
const path = require('path');
const fs = require('fs');

const keyPath = path.join(__dirname, '../config/google-indexing-key.json');

// Helper to parse date string or month name to extract month index and year
const parseMonthYear = (str) => {
  if (!str) return null;
  const parts = str.split(' ');
  if (parts.length === 2) {
    const monthIndex = [
      'january', 'february', 'march', 'april', 'may', 'june',
      'july', 'august', 'september', 'october', 'november', 'december'
    ].indexOf(parts[0].toLowerCase());
    const year = parseInt(parts[1]);
    if (monthIndex !== -1 && !isNaN(year)) {
      return { month: monthIndex, year };
    }
  }

  let d = null;
  if (str.includes('/')) {
    const [day, month, year] = str.split('/').map(Number);
    if (!isNaN(day) && !isNaN(month) && !isNaN(year)) {
      d = new Date(year, month - 1, day);
    }
  } else if (str.includes('-')) {
    const [year, month, day] = str.split('-').map(Number);
    if (!isNaN(day) && !isNaN(month) && !isNaN(year)) {
      d = new Date(year, month - 1, day);
    }
  }

  if (d && !isNaN(d.getTime())) {
    return { month: d.getMonth(), year: d.getFullYear() };
  }

  return null;
};

// Prepend Month Name separator if the month changed since the last row
const checkAndAppendMonthHeader = async (sheets, spreadsheetId, targetTab, localDate) => {
  try {
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId,
      range: `${targetTab}!A2:A1000`
    });

    const rows = response.data.values || [];
    let lastDateVal = null;
    
    for (let i = rows.length - 1; i >= 0; i--) {
      if (rows[i] && rows[i][0] && rows[i][0].trim()) {
        lastDateVal = rows[i][0].trim();
        break;
      }
    }

    const currentMonth = localDate.getMonth();
    const currentYear = localDate.getFullYear();
    const monthNames = [
      'January', 'February', 'March', 'April', 'May', 'June',
      'July', 'August', 'September', 'October', 'November', 'December'
    ];
    const currentMonthHeader = `${monthNames[currentMonth]} ${currentYear}`;

    let needsHeader = false;
    if (!lastDateVal) {
      needsHeader = true;
    } else {
      const lastMonthYear = parseMonthYear(lastDateVal);
      if (lastMonthYear) {
        if (lastMonthYear.month !== currentMonth || lastMonthYear.year !== currentYear) {
          needsHeader = true;
        }
      } else {
        needsHeader = true;
      }
    }

    if (needsHeader) {
      console.log(`[Google Sheets API] Month changed! Appending month header: ${currentMonthHeader}`);
      const appendResponse = await sheets.spreadsheets.values.append({
        spreadsheetId,
        range: `${targetTab}!A2`,
        valueInputOption: 'RAW',
        resource: {
          values: [
            [currentMonthHeader, '', '', '', '', '', '']
          ]
        }
      });

      const updatedRange = appendResponse.data.updates.updatedRange;
      const match = updatedRange.match(/A(\d+):G\d+/);
      if (match) {
        const rowIndex = parseInt(match[1]) - 1;
        const meta = await sheets.spreadsheets.get({ spreadsheetId });
        const targetSheet = meta.data.sheets.find(s => s.properties.title === targetTab);
        if (targetSheet) {
          const sheetId = targetSheet.properties.sheetId;
          await sheets.spreadsheets.batchUpdate({
            spreadsheetId,
            resource: {
              requests: [
                {
                  repeatCell: {
                    range: {
                      sheetId,
                      startRowIndex: rowIndex,
                      endRowIndex: rowIndex + 1,
                      startColumnIndex: 0,
                      endColumnIndex: 7
                    },
                    cell: {
                      userEnteredFormat: {
                        backgroundColor: {
                          red: 0.87,
                          green: 0.92,
                          blue: 0.97
                        },
                        textFormat: {
                          bold: true,
                          fontSize: 11
                        },
                        horizontalAlignment: 'CENTER',
                        verticalAlignment: 'MIDDLE',
                        numberFormat: {
                          type: 'TEXT'
                        }
                      }
                    },
                    fields: 'userEnteredFormat(backgroundColor,textFormat,horizontalAlignment,verticalAlignment,numberFormat)'
                  }
                },
                {
                  mergeCells: {
                    range: {
                      sheetId,
                      startRowIndex: rowIndex,
                      endRowIndex: rowIndex + 1,
                      startColumnIndex: 0,
                      endColumnIndex: 7
                    },
                    mergeType: 'MERGE_ALL'
                  }
                }
              ]
            }
          });
        }
      }
    }
  } catch (err) {
    console.warn('[Google Sheets API] Could not check or append month header:', err.message);
  }
};

/**
 * Append transaction data to the Income Tracker Google Sheet
 */
const appendToIncomeTracker = async ({ businessId, businessName, monthlyPaid = 0, yearlyPaid = 0, eventPaid = 0, addPaid = 0, sheetName = '' }) => {
  try {
    let finalBusinessName = businessName;
    if (!finalBusinessName || finalBusinessName === 'Unknown Business') {
      if (businessId) {
        try {
          const Business = require('../models/Business');
          const biz = await Business.findById(businessId);
          if (biz) {
            finalBusinessName = biz.name || biz.businessName;
          }
        } catch (bizErr) {
          console.error('[Google Sheets API] Fallback business name fetch failed:', bizErr.message);
        }
      }
    }
    if (!finalBusinessName) {
      finalBusinessName = 'Unknown Business';
    }

    let authConfig = {
      scopes: [
        'https://www.googleapis.com/auth/indexing',
        'https://www.googleapis.com/auth/spreadsheets'
      ]
    };

    if (process.env.GOOGLE_INDEXING_CREDENTIALS) {
      try {
        const credentials = JSON.parse(process.env.GOOGLE_INDEXING_CREDENTIALS);
        authConfig.credentials = credentials;
      } catch (jsonErr) {
        console.error('[Google Sheets API] Failed to parse GOOGLE_INDEXING_CREDENTIALS env var:', jsonErr.message);
      }
    } else if (fs.existsSync(keyPath)) {
      authConfig.keyFile = keyPath;
    } else {
      console.warn('[Google Sheets API] Google credentials not found. Skipping entry.');
      return;
    }

    const auth = new google.auth.GoogleAuth(authConfig);
    const authClient = await auth.getClient();
    const sheets = google.sheets({ version: 'v4', auth: authClient });
    
    const spreadsheetId = process.env.GOOGLE_SPREADSHEET_ID;
    if (!spreadsheetId) {
      console.warn('[Google Sheets API] GOOGLE_SPREADSHEET_ID env variable is not set. Skipping entry.');
      return;
    }

    let targetTab = sheetName || 'Income Tracker New';
    try {
      const meta = await sheets.spreadsheets.get({ spreadsheetId });
      const sheetsList = meta.data.sheets.map(s => s.properties.title);
      
      const findTabIgnoreCase = (list, name) => {
        const normalizedName = name.toLowerCase().replace(/[\s\(\)\-_]/g, '');
        return list.find(s => s.toLowerCase().replace(/[\s\(\)\-_]/g, '') === normalizedName) || null;
      };
      
      let matchedTab = findTabIgnoreCase(sheetsList, targetTab);
      if (!matchedTab && targetTab === 'Autopay') {
        matchedTab = findTabIgnoreCase(sheetsList, 'Income Tracker Autopay');
      }
      
      if (matchedTab) {
        targetTab = matchedTab;
      } else {
        if (targetTab === 'Income Tracker New') {
          const matchedFallback = findTabIgnoreCase(sheetsList, 'Income Tracker');
          if (matchedFallback) {
            targetTab = matchedFallback;
          } else if (sheetsList.length > 0) {
            targetTab = sheetsList[0];
          }
        } else if (sheetsList.length > 0) {
          targetTab = sheetsList[0];
        }
      }
    } catch (metaErr) {
      console.warn('[Google Sheets API] Could not fetch sheets list metadata, using fallback range:', metaErr.message);
    }

    const range = `${targetTab}!A:G`;
    const localDate = new Date(new Date().toLocaleString('en-US', { timeZone: 'Asia/Kolkata' }));
    const year = localDate.getFullYear();
    const month = String(localDate.getMonth() + 1).padStart(2, '0');
    const day = String(localDate.getDate()).padStart(2, '0');
    const dateStr = `${year}-${month}-${day}`;

    const totalPaid = monthlyPaid + yearlyPaid + eventPaid + addPaid;

    // Automated month header insertion check
    await checkAndAppendMonthHeader(sheets, spreadsheetId, targetTab, localDate);

    console.log(`[Google Sheets API] Appending transaction for: ${finalBusinessName} (M: ${monthlyPaid}, Y: ${yearlyPaid}, E: ${eventPaid}, A: ${addPaid}, Total: ${totalPaid})`);

    const response = await sheets.spreadsheets.values.append({
      spreadsheetId,
      range,
      valueInputOption: 'USER_ENTERED',
      resource: {
        values: [
          [
            dateStr,
            finalBusinessName,
            totalPaid,
            monthlyPaid,
            yearlyPaid,
            eventPaid,
            addPaid
          ]
        ]
      }
    });

    // Format the date cell to dd/mm/yyyy display and align everything to center/middle
    try {
      const updatedRange = response.data.updates.updatedRange;
      const match = updatedRange.match(/A(\d+):G\d+/);
      if (match) {
        const rowIndex = parseInt(match[1]) - 1; // 0-indexed row
        const meta = await sheets.spreadsheets.get({ spreadsheetId });
        const targetSheet = meta.data.sheets.find(s => s.properties.title === targetTab);
        if (targetSheet) {
          const sheetId = targetSheet.properties.sheetId;
          await sheets.spreadsheets.batchUpdate({
            spreadsheetId,
            resource: {
              requests: [
                {
                  repeatCell: {
                    range: {
                      sheetId,
                      startRowIndex: rowIndex,
                      endRowIndex: rowIndex + 1,
                      startColumnIndex: 0,
                      endColumnIndex: 7
                    },
                    cell: {
                      userEnteredFormat: {
                        horizontalAlignment: 'CENTER',
                        verticalAlignment: 'MIDDLE'
                      }
                    },
                    fields: 'userEnteredFormat(horizontalAlignment,verticalAlignment)'
                  }
                },
                {
                  repeatCell: {
                    range: {
                      sheetId,
                      startRowIndex: rowIndex,
                      endRowIndex: rowIndex + 1,
                      startColumnIndex: 0,
                      endColumnIndex: 1
                    },
                    cell: {
                      userEnteredFormat: {
                        numberFormat: {
                          type: 'DATE',
                          pattern: 'dd/mm/yyyy'
                        }
                      }
                    },
                    fields: 'userEnteredFormat.numberFormat'
                  }
                }
              ]
            }
          });
        }
      }
    } catch (formatErr) {
      console.warn('[Google Sheets API] Failed to format date cell pattern:', formatErr.message);
    }

    console.log(`[Google Sheets API] Recorded transaction successfully for "${businessName}"`);
  } catch (error) {
    console.error('[Google Sheets API] Error appending transaction to Google Sheet:', error.message);
  }
};

const appendDailyTotalForTab = async (sheets, spreadsheetId, targetTab, paymentsList, localDate, dateStr) => {
  let monthlySum = 0;
  let yearlySum = 0;
  let eventSum = 0;
  let addSum = 0;

  for (const payment of paymentsList) {
    const amt = payment.amount || 0;
    if (payment.isSponsoredAd || payment.promotionId) {
      addSum += amt;
    } else if (payment.eventId) {
      eventSum += amt;
    } else if (payment.subscriptionId) {
      const sub = payment.subscriptionId;
      const planStr = (sub.plan || sub.planName || '').toLowerCase();
      if (planStr.includes('monthly') || planStr.includes('plan_tb0vazlqupuhx8') || amt === 99) {
        monthlySum += amt;
      } else {
        yearlySum += amt;
      }
    } else {
      if (amt === 99) monthlySum += 99;
      else if (amt === 999) yearlySum += 999;
      else monthlySum += amt;
    }
  }

  // Automated month header insertion check
  await checkAndAppendMonthHeader(sheets, spreadsheetId, targetTab, localDate);

  console.log(`[Google Sheets API] Appending Daily Total to sheet "${targetTab}": [M: ${monthlySum}, Y: ${yearlySum}, E: ${eventSum}, A: ${addSum}]`);

   const overallTotal = monthlySum + yearlySum + eventSum + addSum;

  // Append row
  const response = await sheets.spreadsheets.values.append({
    spreadsheetId,
    range: `${targetTab}!A2`,
    valueInputOption: 'USER_ENTERED',
    resource: {
      values: [
        [
          dateStr,
          'Daily Total',
          overallTotal,
          monthlySum,
          yearlySum,
          eventSum,
          addSum
        ]
      ]
    }
  });

  // Format the daily total row (Grey background, bold text)
  const updatedRange = response.data.updates.updatedRange;
  const match = updatedRange.match(/A(\d+):G\d+/);
  if (match) {
    const rowIndex = parseInt(match[1]) - 1; // 0-indexed row
    const meta = await sheets.spreadsheets.get({ spreadsheetId });
    const targetSheet = meta.data.sheets.find(s => s.properties.title === targetTab);
    if (targetSheet) {
      const sheetId = targetSheet.properties.sheetId;
      await sheets.spreadsheets.batchUpdate({
        spreadsheetId,
        resource: {
          requests: [
            {
              repeatCell: {
                range: {
                  sheetId,
                  startRowIndex: rowIndex,
                  endRowIndex: rowIndex + 1,
                  startColumnIndex: 0,
                  endColumnIndex: 7
                },
                cell: {
                  userEnteredFormat: {
                    backgroundColor: {
                      red: 0.94,
                      green: 0.94,
                      blue: 0.94
                    },
                    textFormat: {
                      bold: true,
                      fontSize: 10
                    },
                    horizontalAlignment: 'CENTER',
                    verticalAlignment: 'MIDDLE'
                  }
                },
                fields: 'userEnteredFormat(backgroundColor,textFormat,horizontalAlignment,verticalAlignment)'
              }
            },
            {
              repeatCell: {
                range: {
                  sheetId,
                  startRowIndex: rowIndex,
                  endRowIndex: rowIndex + 1,
                  startColumnIndex: 0,
                  endColumnIndex: 1
                },
                cell: {
                  userEnteredFormat: {
                    numberFormat: {
                      type: 'DATE',
                      pattern: 'dd/mm/yyyy'
                    }
                  }
                },
                fields: 'userEnteredFormat.numberFormat'
              }
            }
          ]
        }
      });
    }
  }
};

const appendDailyTotal = async () => {
  try {
    const Payment = require('../models/Payment');
    const Subscription = require('../models/Subscription');
    const Event = require('../models/Event');
    const Business = require('../models/Business');

    // 1. Fetch today's payments in Kolkata timezone (12:00:00 AM to 11:59:59 PM)
    const localDate = new Date(new Date().toLocaleString('en-US', { timeZone: 'Asia/Kolkata' }));
    const year = localDate.getFullYear();
    const month = String(localDate.getMonth() + 1).padStart(2, '0');
    const day = String(localDate.getDate()).padStart(2, '0');
    const dateStr = `${year}-${month}-${day}`;

    // Define search bounds in UTC corresponding to Kolkata day boundaries
    const startOfDay = new Date(`${dateStr}T00:00:00+05:30`);
    const endOfDay = new Date(`${dateStr}T23:59:59+05:30`);

    console.log(`[Google Sheets API] Auditing daily totals for date ${dateStr} (Kolkata) from ${startOfDay.toISOString()} to ${endOfDay.toISOString()}`);

    const payments = await Payment.find({
      $or: [
        { status: { $in: ['Paid', 'captured'] } },
        { paymentStatus: 'Paid' }
      ],
      paidAt: { $gte: startOfDay, $lte: endOfDay }
    }).populate('subscriptionId');

    // 2. Authenticate
    let authConfig = {
      scopes: [
        'https://www.googleapis.com/auth/indexing',
        'https://www.googleapis.com/auth/spreadsheets'
      ]
    };

    if (process.env.GOOGLE_INDEXING_CREDENTIALS) {
      try {
        const credentials = JSON.parse(process.env.GOOGLE_INDEXING_CREDENTIALS);
        authConfig.credentials = credentials;
      } catch (jsonErr) {
        console.error('[Google Sheets API] Failed to parse GOOGLE_INDEXING_CREDENTIALS env var:', jsonErr.message);
      }
    } else if (fs.existsSync(keyPath)) {
      authConfig.keyFile = keyPath;
    } else {
      console.warn('[Google Sheets API] Google credentials not found. Skipping entry.');
      return;
    }

    const auth = new google.auth.GoogleAuth(authConfig);
    const authClient = await auth.getClient();
    const sheets = google.sheets({ version: 'v4', auth: authClient });

    const spreadsheetId = process.env.GOOGLE_SPREADSHEET_ID;
    if (!spreadsheetId) {
      console.warn('[Google Sheets API] GOOGLE_SPREADSHEET_ID is not set.');
      return;
    }

    const meta = await sheets.spreadsheets.get({ spreadsheetId });
    const sheetsList = meta.data.sheets.map(s => s.properties.title);

    const findTabIgnoreCase = (list, name) => {
      const normalizedName = name.toLowerCase().replace(/[\s\(\)\-_]/g, '');
      return list.find(s => s.toLowerCase().replace(/[\s\(\)\-_]/g, '') === normalizedName) || null;
    };

    // Split payments: autopay payments are renewals (have razorpaySubscriptionId and are NOT the first payment for that subscription)
    const newPayments = [];
    const autopayPayments = [];

    for (const p of payments) {
      if (p.razorpaySubscriptionId) {
        // Check if there is an older paid payment in the database for this subscription
        const olderPayment = await Payment.findOne({
          razorpaySubscriptionId: p.razorpaySubscriptionId,
          status: 'Paid',
          createdAt: { $lt: p.createdAt }
        });
        if (olderPayment) {
          autopayPayments.push(p);
        } else {
          newPayments.push(p);
        }
      } else {
        newPayments.push(p);
      }
    }

    // 3. Process first sheet: 'Income Tracker New'
    const matchedNewTab = findTabIgnoreCase(sheetsList, 'Income Tracker New');
    if (matchedNewTab) {
      await appendDailyTotalForTab(sheets, spreadsheetId, matchedNewTab, newPayments, localDate, dateStr);
    } else {
      const matchedFallback = findTabIgnoreCase(sheetsList, 'Income Tracker');
      if (matchedFallback) {
        await appendDailyTotalForTab(sheets, spreadsheetId, matchedFallback, newPayments, localDate, dateStr);
      } else if (sheetsList.length > 0) {
        await appendDailyTotalForTab(sheets, spreadsheetId, sheetsList[0], newPayments, localDate, dateStr);
      }
    }

    // 4. Process second sheet: 'Autopay'
    const matchedAutopayTab = findTabIgnoreCase(sheetsList, 'Income Tracker Autopay') || findTabIgnoreCase(sheetsList, 'Autopay');
    if (matchedAutopayTab) {
      await appendDailyTotalForTab(sheets, spreadsheetId, matchedAutopayTab, autopayPayments, localDate, dateStr);
    }

    console.log(`[Google Sheets API] Daily Totals successfully processed for date ${dateStr}`);
  } catch (error) {
    console.error('[Google Sheets API] Error processing daily totals:', error.message);
  }
};

/**
 * Append weekly total to Expense Tracker sheet
 */
const appendExpenseWeeklyTotal = async () => {
  try {
    let authConfig = {
      scopes: ['https://www.googleapis.com/auth/spreadsheets']
    };

    if (process.env.GOOGLE_INDEXING_CREDENTIALS) {
      try {
        const credentials = JSON.parse(process.env.GOOGLE_INDEXING_CREDENTIALS);
        authConfig.credentials = credentials;
      } catch (jsonErr) {
        console.error('[Google Sheets API] Failed to parse credentials:', jsonErr.message);
      }
    } else if (fs.existsSync(keyPath)) {
      authConfig.keyFile = keyPath;
    } else {
      console.warn('[Google Sheets API] Google credentials not found. Skipping entry.');
      return;
    }

    const auth = new google.auth.GoogleAuth(authConfig);
    const authClient = await auth.getClient();
    const sheets = google.sheets({ version: 'v4', auth: authClient });

    const spreadsheetId = process.env.GOOGLE_EXPENSE_SPREADSHEET_ID || process.env.GOOGLE_SPREADSHEET_ID;
    if (!spreadsheetId) {
      console.warn('[Google Sheets API] GOOGLE_EXPENSE_SPREADSHEET_ID is not set.');
      return;
    }

    let targetTab = 'Expense Tracker';
    try {
      const meta = await sheets.spreadsheets.get({ spreadsheetId });
      const sheetsList = meta.data.sheets.map(s => s.properties.title);
      const found = sheetsList.find(name => name.toLowerCase() === 'expense tracker');
      if (found) {
        targetTab = found;
      }
    } catch (metaErr) {
      console.warn('[Google Sheets API] Could not fetch sheets list for Expense Tracker, using default:', metaErr.message);
    }

    // 1. Fetch values
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId,
      range: `${targetTab}!A2:D1000`
    });

    const rows = response.data.values || [];
    
    // 2. Find the last Weekly Total row index
    let lastWeeklyTotalIdx = -1;
    for (let i = rows.length - 1; i >= 0; i--) {
      if (rows[i] && rows[i][1] === 'Weekly Total') {
        lastWeeklyTotalIdx = i;
        break;
      }
    }

    // 3. Sum new manual entries after lastWeeklyTotalIdx
    let weeklySum = 0;
    let newEntriesCount = 0;
    for (let i = lastWeeklyTotalIdx + 1; i < rows.length; i++) {
      if (rows[i] && rows[i][2]) {
        // Parse Amount value
        const amt = parseFloat(rows[i][2].toString().replace(/,/g, '').trim());
        if (!isNaN(amt)) {
          weeklySum += amt;
        }
        newEntriesCount++;
      }
    }

    if (newEntriesCount === 0) {
      console.log('[Google Sheets API] No new expense entries since last weekly total. Skipping.');
      return;
    }

    // 4. Append Weekly Total row
    const localDate = new Date(new Date().toLocaleString('en-US', { timeZone: 'Asia/Kolkata' }));
    const year = localDate.getFullYear();
    const month = String(localDate.getMonth() + 1).padStart(2, '0');
    const day = String(localDate.getDate()).padStart(2, '0');
    const dateStr = `${year}-${month}-${day}`;

    console.log(`[Google Sheets API] Appending Weekly Total to Expense Tracker: Sum = ${weeklySum}`);
    
    const appendResponse = await sheets.spreadsheets.values.append({
      spreadsheetId,
      range: `${targetTab}!A2`,
      valueInputOption: 'USER_ENTERED',
      resource: {
        values: [
          [dateStr, 'Weekly Total', '', weeklySum]
        ]
      }
    });

    // 5. Style the weekly total row (Grey background #E2E8F0, Bold text)
    const updatedRange = appendResponse.data.updates.updatedRange;
    const match = updatedRange.match(/A(\d+):D\d+/);
    if (match) {
      const rowIndex = parseInt(match[1]) - 1;
      const meta = await sheets.spreadsheets.get({ spreadsheetId });
      const targetSheet = meta.data.sheets.find(s => s.properties.title === targetTab);
      if (targetSheet) {
        const sheetId = targetSheet.properties.sheetId;
        await sheets.spreadsheets.batchUpdate({
          spreadsheetId,
          resource: {
            requests: [
              {
                repeatCell: {
                  range: {
                    sheetId,
                    startRowIndex: rowIndex,
                    endRowIndex: rowIndex + 1,
                    startColumnIndex: 0,
                    endColumnIndex: 4
                  },
                  cell: {
                    userEnteredFormat: {
                      backgroundColor: {
                        red: 0.88,
                        green: 0.91,
                        blue: 0.94
                      },
                      textFormat: {
                        bold: true,
                        fontSize: 10
                      },
                      horizontalAlignment: 'CENTER',
                      verticalAlignment: 'MIDDLE'
                    }
                  },
                  fields: 'userEnteredFormat(backgroundColor,textFormat,horizontalAlignment,verticalAlignment)'
                }
              },
              {
                repeatCell: {
                  range: {
                    sheetId,
                    startRowIndex: rowIndex,
                    endRowIndex: rowIndex + 1,
                    startColumnIndex: 0,
                    endColumnIndex: 1
                  },
                  cell: {
                    userEnteredFormat: {
                      numberFormat: {
                        type: 'DATE',
                        pattern: 'dd/mm/yyyy'
                      }
                    }
                  },
                  fields: 'userEnteredFormat.numberFormat'
                }
              },
              {
                autoResizeDimensions: {
                  dimensions: {
                    sheetId,
                    dimension: 'COLUMNS',
                    startIndex: 0,
                    endIndex: 4
                  }
                }
              }
            ]
          }
        });
      }
    }

    console.log('[Google Sheets API] Expense Weekly Total appended and styled successfully.');
  } catch (error) {
    console.error('[Google Sheets API] Error appending weekly expense total:', error.message);
  }
};

module.exports = { appendToIncomeTracker, appendDailyTotal, appendExpenseWeeklyTotal };
