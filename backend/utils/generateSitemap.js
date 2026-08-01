const fs = require('fs');
const path = require('path');
const Business = require('../models/Business');
const Category = require('../models/Category');
const Blog = require('../models/Blog');
const Event = require('../models/Event');
const mongoose = require('mongoose');

async function generateSitemap() {
  try {
    console.log('[Sitemap Generator] Starting dynamic XML sitemap compilation...');

    // Initiate DB connection if run outside the server context
    if (mongoose.connection.readyState === 0) {
      console.log('[Sitemap Generator] Mongoose connection not active. Connecting...');
      await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/udtbusiness');
      console.log('[Sitemap Generator] Mongoose connected successfully.');
    }

    const baseDomain = 'https://udumalpet.business';
    const staticUrls = [
      { loc: '', changefreq: 'daily', priority: '1.0' },
      { loc: '/about', changefreq: 'monthly', priority: '0.6' },
      { loc: '/businesses', changefreq: 'daily', priority: '0.9' },
      { loc: '/categories', changefreq: 'weekly', priority: '0.8' },
      { loc: '/events', changefreq: 'daily', priority: '0.8' },
      { loc: '/blogs', changefreq: 'daily', priority: '0.8' },
      { loc: '/blood-donors', changefreq: 'weekly', priority: '0.7' },
      { loc: '/choose-plan', changefreq: 'monthly', priority: '0.5' },
      { loc: '/sitemap', changefreq: 'weekly', priority: '0.5' },
      { loc: '/login', changefreq: 'monthly', priority: '0.5' },
      { loc: '/register', changefreq: 'monthly', priority: '0.7' }
    ];

    const urls = [...staticUrls];

    // 1. Fetch approved Categories and build dynamic slugs (e.g. /hotels-in-udumalpet)
    const categories = await Category.find({});
    categories.forEach(cat => {
      if (cat.slug) {
        urls.push({
          loc: `/${cat.slug}`,
          changefreq: 'weekly',
          priority: '0.7'
        });
      } else if (cat.name) {
        const catSlug = cat.name.toLowerCase().replace(/[^a-z0-9]+/g, '-') + '-in-udumalpet';
        urls.push({
          loc: `/${catSlug}`,
          changefreq: 'weekly',
          priority: '0.7'
        });
      }
    });

    // 2. Fetch approved active Businesses
    const businesses = await Business.find({ status: 'Approved' });
    businesses.forEach(biz => {
      const bizSlug = biz.slug || biz._id.toString();
      urls.push({
        loc: `/${bizSlug}`,
        changefreq: 'weekly',
        priority: '0.8'
      });
      // Also index standard backup route
      urls.push({
        loc: `/businesses/${biz._id.toString()}`,
        changefreq: 'weekly',
        priority: '0.6'
      });
    });

    // 3. Fetch active Blogs
    const blogs = await Blog.find({ status: { $ne: 'Draft' } });
    blogs.forEach(blog => {
      const blogSlug = blog.slug || blog._id.toString();
      urls.push({
        loc: `/blogs/${blogSlug}`,
        changefreq: 'weekly',
        priority: '0.7'
      });
    });

    // 4. Fetch active Events
    const events = await Event.find({ status: { $ne: 'Draft' } });
    events.forEach(evt => {
      const evtSlug = evt.slug || evt._id.toString();
      urls.push({
        loc: `/events/${evtSlug}`,
        changefreq: 'weekly',
        priority: '0.7'
      });
    });

    // Format XML
    let xml = `<?xml version="1.0" encoding="UTF-8"?>\n`;
    xml += `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n`;
    
    urls.forEach(url => {
      xml += `  <url>\n`;
      xml += `    <loc>${baseDomain}${url.loc}</loc>\n`;
      xml += `    <changefreq>${url.changefreq}</changefreq>\n`;
      xml += `    <priority>${url.priority}</priority>\n`;
      xml += `  </url>\n`;
    });

    xml += `</urlset>\n`;

    // Write to frontend public sitemap.xml
    const publicPath = path.join(__dirname, '../../frontend/public/sitemap.xml');
    const distPath = path.join(__dirname, '../../frontend/dist/sitemap.xml');

    try {
      fs.writeFileSync(publicPath, xml, 'utf8');
      console.log(`✓ Sitemap XML successfully written to frontend public: ${publicPath}`);
    } catch (err) {
      console.warn(`[Sitemap Generator] Could not write sitemap.xml to frontend public (likely missing dir):`, err.message);
    }

    try {
      if (fs.existsSync(path.dirname(distPath))) {
        fs.writeFileSync(distPath, xml, 'utf8');
        console.log(`✓ Sitemap XML successfully written to frontend dist: ${distPath}`);
      }
    } catch (err) {
      console.warn(`[Sitemap Generator] Could not write sitemap.xml to frontend dist:`, err.message);
    }

  } catch (error) {
    console.error('Error generating dynamic sitemap:', error.message);
  }
}

module.exports = { generateSitemap };
