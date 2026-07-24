/**
 * OG Meta Proxy — Dynamic Open Graph tag generator for social bots
 *
 * Social media crawlers (WhatsApp, Facebook, Twitter/X, LinkedIn, Telegram)
 * do NOT execute JavaScript in SPAs. This endpoint intercepts requests from
 * known crawlers for business, blog and event URLs, fetches data from the DB,
 * and returns a minimal HTML shell with correct OG meta tags.
 *
 * Non-bot traffic is redirected instantly to the React SPA.
 */

const express = require('express');
const router = express.Router();

// ── Known Social / SEO Bot User-Agents ────────────────────────────────────────
const SOCIAL_BOT_REGEX = /facebookexternalhit|Twitterbot|WhatsApp|LinkedInBot|TelegramBot|Googlebot|bingbot|DuckDuckBot|Slackbot|discordbot|Applebot|pinterest|Baiduspider|ia_archiver|redditbot|Embedly|quora link preview|outbrain|vkShare|W3C_Validator/i;

const isCrawler = (ua = '') => SOCIAL_BOT_REGEX.test(ua);

// ── Helpers ───────────────────────────────────────────────────────────────────
const SITE_NAME = 'Udumalpet Business Tour';
const SITE_URL = process.env.FRONTEND_URL || 'https://udumalpet.business';
const API_BASE_URL = process.env.BACKEND_URL || 'http://localhost:5000';
const DEFAULT_IMAGE = `${SITE_URL}/logo.jpg`;
const DEFAULT_TITLE = 'Featured Business in Udumalpet | Local Business Directory';
const DEFAULT_DESC = 'Discover featured businesses in Udumalpet. Find trusted shops, services, restaurants and professionals with reviews, contact details and offers.';

/** Resolve an image URL — handles relative /uploads/ paths */
const resolveImageUrl = (url) => {
  if (!url) return DEFAULT_IMAGE;
  if (url.startsWith('http')) return url;
  // Relative path hosted on the backend
  return `${API_BASE_URL}${url.startsWith('/') ? '' : '/'}${url}`;
};

/** Strip HTML tags from rich-text content */
const stripHtml = (html = '') => html.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();

/** Build the OG HTML shell */
const buildOgHtml = ({ title, description, image, url, type = 'website' }) => {
  const safeTitle = (title || DEFAULT_TITLE).replace(/"/g, '&quot;');
  const safeDesc = (description || DEFAULT_DESC).replace(/"/g, '&quot;');
  const safeImage = image || DEFAULT_IMAGE;
  const safeUrl = url || SITE_URL;

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${safeTitle}</title>
  <meta name="description" content="${safeDesc}" />

  <!-- Open Graph -->
  <meta property="og:type"        content="${type}" />
  <meta property="og:site_name"   content="${SITE_NAME}" />
  <meta property="og:title"       content="${safeTitle}" />
  <meta property="og:description" content="${safeDesc}" />
  <meta property="og:image"       content="${safeImage}" />
  <meta property="og:image:width"  content="1200" />
  <meta property="og:image:height" content="630" />
  <meta property="og:url"         content="${safeUrl}" />

  <!-- Twitter Card -->
  <meta name="twitter:card"        content="summary_large_image" />
  <meta name="twitter:title"       content="${safeTitle}" />
  <meta name="twitter:description" content="${safeDesc}" />
  <meta name="twitter:image"       content="${safeImage}" />

  <!-- WhatsApp / iMessage prefer og:image, already set above -->

  <!-- Redirect non-crawlers to the SPA -->
  <script>window.location.replace("${safeUrl}");</script>
</head>
<body>
  <p><a href="${safeUrl}">${safeTitle}</a></p>
</body>
</html>`;
};

// ── Business slug route — /meta/:slug ─────────────────────────────────────────
router.get('/:slug', async (req, res) => {
  const ua = req.headers['user-agent'] || '';
  const slug = req.params.slug;

  // Always redirect non-bot traffic to the SPA immediately
  if (!isCrawler(ua)) {
    return res.redirect(302, `${SITE_URL}/${slug}`);
  }

  try {
    const mongoose = require('mongoose');
    const isValidId = mongoose.isValidObjectId(slug);
    const lowerSlug = slug.toLowerCase();

    // ── 1. Check Events ──────────────────────────────────────────────────────
    const Event = require('./models/Event');
    const event = isValidId
      ? await Event.findById(slug).lean()
      : await Event.findOne({ slug: lowerSlug }).lean();

    if (event) {
      const pageUrl = `${SITE_URL}/${event.slug || event._id}`;
      const image = resolveImageUrl(event.coverImageUrl || event.bannerImage || '');
      const desc = stripHtml(event.description || `${event.title} — ${event.venue || ''}`).substring(0, 160);

      return res.send(buildOgHtml({
        title: `${event.title} | ${SITE_NAME}`,
        description: desc,
        image,
        url: pageUrl,
        type: 'article'
      }));
    }

    // ── 2. Check Blogs ───────────────────────────────────────────────────────
    const Blog = require('./models/Blog');
    const blog = isValidId
      ? await Blog.findById(slug).lean()
      : await Blog.findOne({ slug: lowerSlug }).lean();

    if (blog) {
      const pageUrl = `${SITE_URL}/${blog.slug || blog._id}`;
      const image = resolveImageUrl(blog.coverImage || blog.thumbnail || '');
      // Strip HTML from blog content for a plain-text excerpt
      const rawText = stripHtml(blog.content || '');
      const desc = (rawText.substring(0, 160) + (rawText.length > 160 ? '…' : ''));

      return res.send(buildOgHtml({
        title: `${blog.title} | ${SITE_NAME}`,
        description: desc,
        image,
        url: pageUrl,
        type: 'article'
      }));
    }

    // ── 3. Check Businesses ──────────────────────────────────────────────────
    const Business = require('./models/Business');
    const business = isValidId
      ? await Business.findById(slug).lean()
      : await Business.findOne({ slug: lowerSlug }).lean();

    if (business) {
      const pageUrl = `${SITE_URL}/${business.slug || business._id}`;

      // Image priority: logo → cover image → default
      const image = resolveImageUrl(
        business.logoUrl || business.coverImageUrl || ''
      );

      // Description from business description / about field
      const rawDesc = business.description || business.about || `${business.name} — ${business.category || ''} in Udumalpet.`;
      const desc = (rawDesc.substring(0, 160) + (rawDesc.length > 160 ? '…' : ''));

      return res.send(buildOgHtml({
        title: `${business.name} | ${SITE_NAME}`,
        description: desc,
        image,
        url: pageUrl,
        type: 'business.business'
      }));
    }

    // ── 4. Not found — serve generic OG ─────────────────────────────────────
    return res.send(buildOgHtml({
      title: DEFAULT_TITLE,
      description: DEFAULT_DESC,
      image: DEFAULT_IMAGE,
      url: `${SITE_URL}/${slug}`
    }));

  } catch (err) {
    console.error('[OG Meta] Error:', err);
    return res.send(buildOgHtml({
      title: DEFAULT_TITLE,
      description: DEFAULT_DESC,
      image: DEFAULT_IMAGE,
      url: SITE_URL
    }));
  }
});

module.exports = router;
