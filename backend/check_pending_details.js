const mongoose = require('mongoose');
const dotenv = require('dotenv');

dotenv.config();

const Business = require('./models/Business');
const Blog = require('./models/Blog');
const Event = require('./models/Event');
const Testimonial = require('./models/Testimonial');
const Category = require('./models/Category');
const User = require('./models/User');

const mongoUri = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/udtbusiness';

async function checkPending() {
  console.log('Connecting to database:', mongoUri);
  try {
    await mongoose.connect(mongoUri);
    console.log('Connected to MongoDB.\n');

    const pendingBiz = await Business.find({ status: { $in: ['Pending Verification', 'Under Review'] } });
    console.log(`Pending/UnderReview Businesses (${pendingBiz.length}):`);
    pendingBiz.forEach(b => console.log(`- ${b.name} (${b.status})`));

    const pendingBlogs = await Blog.find({ status: { $in: ['Pending Approval', 'Needs Revision'] } });
    console.log(`\nPending/NeedsRevision Blogs (${pendingBlogs.length}):`);
    pendingBlogs.forEach(b => console.log(`- ${b.title} (${b.status})`));

    const pendingEvents = await Event.find({ status: { $in: ['Pending Review', 'Pending Verification'] } });
    console.log(`\nPending Events (${pendingEvents.length}):`);
    pendingEvents.forEach(e => console.log(`- ${e.title} (${e.status})`));

    const pendingTestimonials = await Testimonial.find({ status: 'Pending' });
    console.log(`\nPending Testimonials (${pendingTestimonials.length}):`);
    pendingTestimonials.forEach(t => console.log(`- ${t.name || t.authorName} (${t.status})`));

    const pendingCategories = await Category.find({ status: 'Pending' });
    console.log(`\nPending Categories (${pendingCategories.length}):`);
    pendingCategories.forEach(c => console.log(`- ${c.categoryName || c.name} (${c.status})`));

    const pendingPartners = await User.find({ isPartnerRegistered: true, isPartnerApproved: false });
    console.log(`\nPending Partners (${pendingPartners.length}):`);
    pendingPartners.forEach(p => console.log(`- ${p.name || p.fullName} (${p.email})`));

    await mongoose.disconnect();
  } catch (err) {
    console.error('Error checking database:', err);
  }
}

checkPending();
