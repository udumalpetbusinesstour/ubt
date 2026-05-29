const mongoose = require('mongoose');
const dotenv = require('dotenv');

dotenv.config();

const User = require('./models/User');
const Business = require('./models/Business');
const Blog = require('./models/Blog');
const Event = require('./models/Event');
const Review = require('./models/Review');
const SystemSetting = require('./models/SystemSetting');
const AdminAction = require('./models/AdminAction');

const mongoUri = process.env.MONGO_URI || 'mongodb://localhost:27017/udtbusiness';

async function runDiagnostics() {
  console.log('--- Udumalpet Business Tour (UBT) SuperAdmin Diagnostics ---');
  console.log('Connecting to database:', mongoUri);
  
  try {
    await mongoose.connect(mongoUri);
    console.log('✓ Successfully connected to MongoDB database.');

    // 1. Check schemas
    const userCount = await User.countDocuments();
    const bizCount = await Business.countDocuments();
    const blogCount = await Blog.countDocuments();
    const eventCount = await Event.countDocuments();
    const reviewCount = await Review.countDocuments();
    const actionCount = await AdminAction.countDocuments();
    const settingCount = await SystemSetting.countDocuments();

    console.log('\n--- Collection Statistics ---');
    console.log('• Users:', userCount);
    console.log('• Businesses:', bizCount);
    console.log('• Blogs:', blogCount);
    console.log('• Events:', eventCount);
    console.log('• Reviews:', reviewCount);
    console.log('• System Settings:', settingCount);
    console.log('• Admin Actions Log:', actionCount);

    // 2. Validate SuperAdmin User Exists
    let superAdmin = await User.findOne({ role: 'superadmin' });
    if (!superAdmin) {
      console.log('\nNo superadmin account found. Seeding a default one...');
      superAdmin = await User.create({
        fullName: 'Super Admin',
        name: 'Super Admin',
        email: 'superadmin@ubt.com',
        mobileNumber: '+91 90000 00000',
        phone: '+91 90000 00000',
        password: 'password123',
        role: 'superadmin',
        isVerified: true,
        status: 'Active'
      });
      console.log('✓ Successfully seeded SuperAdmin account: superadmin@ubt.com / password123');
    } else {
      console.log(`\n✓ SuperAdmin account exists: ${superAdmin.email} (${superAdmin.fullName || 'Admin'})`);
    }

    // 3. SystemSettings Verification
    let platformConfig = await SystemSetting.findOne({ key: 'platform_config' });
    if (!platformConfig) {
      console.log('\nCreating default platform configurations...');
      platformConfig = await SystemSetting.create({
        key: 'platform_config',
        banners: [
          { id: 'b1', title: 'Welcome to Udumalpet Business Tour', image: 'https://images.unsplash.com/photo-1621905251189-08b45d6a269e?w=800&q=80', subtitle: 'Explore the green wind farms, shops, and resorts of Udumalpet.', link: '/businesses', active: true }
        ]
      });
      console.log('✓ Seeded default SystemSettings config.');
    } else {
      console.log('\n✓ SystemSettings configuration loaded.');
      console.log('  Page layout style:', platformConfig.pageLayout?.directoryLayout || 'grid');
      console.log('  Accent color:', platformConfig.pageLayout?.themeAccent || 'emerald');
    }

    console.log('\nDiagnostics completed. Everything looks healthy!');

  } catch (error) {
    console.error('✗ Diagnostic error:', error.stack || error.message);
  } finally {
    await mongoose.connection.close();
    console.log('Database connection closed safely.');
  }
}

runDiagnostics();
