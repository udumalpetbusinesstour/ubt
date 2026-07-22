const dotenv = require('dotenv');
// Load environment variables immediately before loading other backend modules
dotenv.config();

const mongoose = require('mongoose');
const connectDB = require('./config/db');
const app = require('./app');
const { startSubscriptionCron } = require('./cron/subscriptionCron');
const { startGoogleReviewsCron } = require('./cron/googleReviewsCron');
const { startDailyTotalCron } = require('./cron/dailyTotalCron');
const { startWeeklyExpenseCron } = require('./cron/weeklyExpenseCron');
const { startIncompleteRegistrationsCleanupCron } = require('./cron/incompleteRegistrationsCleanupCron');
const { seedDefaultPlans } = require('./routes/plans');

// Seeder routine for UBT administrative credentials
const seedAdministrativeCredentials = async () => {
  try {
    const User = require('./models/User');
    
    // 1. Purge old default superadmin and demote other superadmins to admin
    await User.deleteOne({ email: 'superadmin@gmail.com' });
    await User.updateMany(
      { email: { $ne: 'udumalpetbusinesstour@gmail.com' }, role: 'superadmin' },
      { role: 'admin' }
    );
    
    // 2. Seed Super Admin: udumalpetbusinesstour@gmail.com / 123456
    const superadminExists = await User.findOne({ email: 'udumalpetbusinesstour@gmail.com' });
    if (!superadminExists) {
      await User.create({
        name: 'UBT Super Administrator',
        fullName: 'UBT Super Administrator',
        email: 'udumalpetbusinesstour@gmail.com',
        phone: '+91 99999 99999',
        mobileNumber: '+91 99999 99999',
        password: '123456', // Automatically hashes pre-save
        role: 'superadmin',
        isVerified: true,
        status: 'Active'
      });
      console.log('--- Seed SUCCESS: Superadmin console enabled (udumalpetbusinesstour@gmail.com / 123456) ---');
    } else if (superadminExists.role !== 'superadmin') {
      superadminExists.role = 'superadmin';
      await superadminExists.save();
      console.log('--- Role synced: udumalpetbusinesstour@gmail.com set to superadmin ---');
    }

    // 2. Seed Standard Admin: admin@gmail.com / 123456
    const adminExists = await User.findOne({ email: 'admin@gmail.com' });
    if (!adminExists) {
      await User.create({
        name: 'UBT Administrator',
        fullName: 'UBT Administrator',
        email: 'admin@gmail.com',
        phone: '+91 88888 88888',
        mobileNumber: '+91 88888 88888',
        password: '123456', // Automatically hashes pre-save
        role: 'admin',
        isVerified: true,
        status: 'Active'
      });
      console.log('--- Seed SUCCESS: Admin console enabled (admin@gmail.com / 123456) ---');
    }

    // 3. Seed Mock Partner: google_partner_test@udumalpet.in
    const partnerExists = await User.findOne({ email: 'google_partner_test@udumalpet.in' });
    if (!partnerExists) {
      await User.create({
        name: 'Google Partner Member',
        fullName: 'Google Partner Member',
        email: 'google_partner_test@udumalpet.in',
        phone: '+91 77777 77777',
        mobileNumber: '+91 77777 77777',
        password: 'password123', // Automatically hashes pre-save
        role: 'partner',
        isVerified: true,
        status: 'Active',
        isPartnerRegistered: true,
        isPartnerApproved: true,
        partnerStatus: 'approved'
      });
      console.log('--- Seed SUCCESS: Google Partner mock console enabled (google_partner_test@udumalpet.in) ---');
    }
  } catch (error) {
    console.error('Error during administrative seeder routine execution:', error.message);
  }
};

// Database Migration routine: generate missing URL slugs for events & blogs
const migrateSlugs = async () => {
  try {
    const Blog = require('./models/Blog');
    const Event = require('./models/Event');

    // 1. Migrate Blogs
    const blogsToMigrate = await Blog.find({ $or: [{ slug: { $exists: false } }, { slug: '' }] });
    for (const blog of blogsToMigrate) {
      if (blog.title) {
        blog.slug = blog.title
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, '-')
          .replace(/(^-|-$)+/g, '');
        await blog.save();
        console.log(`[Slug Migration] Migrated blog: "${blog.title}" -> "${blog.slug}"`);
      }
    }

    // 2. Migrate Events
    const eventsToMigrate = await Event.find({ $or: [{ slug: { $exists: false } }, { slug: '' }] });
    for (const event of eventsToMigrate) {
      if (event.title) {
        event.slug = event.title
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, '-')
          .replace(/(^-|-$)+/g, '');
        await event.save();
        console.log(`[Slug Migration] Migrated event: "${event.title}" -> "${event.slug}"`);
      }
    }
  } catch (err) {
    console.error('[Slug Migration] Error:', err.message);
  }
};

// Connect to Database and initiate routines sequentially
const initializeServer = async () => {
  try {
    // 1. Connect MongoDB
    await connectDB();

    // 2. Seed Administrative Users
    await seedAdministrativeCredentials();

    // 3. Seed Subscription Plans (₹69/₹690)
    await seedDefaultPlans();

    // 3.5. Run Slug migration
    await migrateSlugs();

    // 4. Initialize Background Expiry Sweep Cron Tasks
    startSubscriptionCron();

    // 5. Initialize Weekly Google Reviews Sync Cron
    startGoogleReviewsCron();

    // Initialize Daily Sheets Revenue Total Cron
    startDailyTotalCron();

    // Initialize Weekly Sheets Expense Total Cron
    startWeeklyExpenseCron();

    // Initialize Incomplete Registrations 10-day Cleanup Cron
    startIncompleteRegistrationsCleanupCron();

    // 6. Seed and sync default categories on boot
    console.log('[Boot] Seeding and syncing category systems...');
    const { seedDefaultCategories } = require('./models/Category');
    await seedDefaultCategories();
    const { syncAllApprovedCategories } = require('./utils/categoryHelper');
    await syncAllApprovedCategories();

    // 6.5. System self-repair: Align branch ownerIds with parent ownerIds
    try {
      console.log('[Boot] Auditing and fixing branch owner associations...');
      const Business = require('./models/Business');
      const branchesToFix = await Business.find({ parentBusinessId: { $ne: null } });
      let fixedCount = 0;
      for (let branch of branchesToFix) {
        const parent = await Business.findById(branch.parentBusinessId);
        if (parent && String(branch.ownerId) !== String(parent.ownerId)) {
          branch.ownerId = parent.ownerId;
          await branch.save();
          fixedCount++;
        }
      }
      if (fixedCount > 0) {
        console.log(`[REPAIR SYSTEM] Fixed ownerId on ${fixedCount} branches to match their parents.`);
      } else {
        console.log('[REPAIR SYSTEM] All branch owner associations are correct.');
      }
    } catch (repairErr) {
      console.error('[REPAIR SYSTEM] Error during branch owner audit:', repairErr.message);
    }

    console.log('UBT Backend Subsystems initialized and synced successfully.');
  } catch (error) {
    console.error('API bootloader initialization sequence failed:', error.message);
  }
};

initializeServer();

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`[Boot] UBT Express Server listening on port ${PORT} in ${process.env.NODE_ENV || 'development'} mode.`);
});
