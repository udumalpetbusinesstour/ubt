const mongoose = require('mongoose');
require('dotenv').config();

mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/udtbusiness').then(async () => {
  const Blog = require('./models/Blog');
  const Business = require('./models/Business');

  const allBlogs = await Blog.find({});
  console.log(`Found ${allBlogs.length} total blogs in DB.`);

  for (const blog of allBlogs) {
    console.log('-----------------------------------');
    console.log('Title:', blog.title);
    console.log('Status:', blog.status);
    console.log('businessId field:', blog.businessId);
    console.log('author field:', blog.author);

    if (blog.businessId) {
      const biz = await Business.findById(blog.businessId);
      if (biz) {
        console.log(`- Linked Business Name: "${biz.name}" (Slug: "${biz.slug}")`);
      } else {
        console.log(`- businessId reference not found in Business collection!`);
      }
    }
  }

  process.exit(0);
}).catch(err => {
  console.error(err);
  process.exit(1);
});
