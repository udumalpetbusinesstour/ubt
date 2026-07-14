const mongoose = require('mongoose');

const SystemSettingSchema = new mongoose.Schema({
  key: {
    type: String,
    required: true,
    unique: true,
    default: 'platform_config'
  },
  pageLayout: {
    directoryLayout: { type: String, default: 'grid' },
    themeAccent: { type: String, default: 'emerald' },
    sidebarPosition: { type: String, default: 'left' },
    glassmorphism: { type: Boolean, default: true },
    fontFamily: { type: String, default: 'sans' }
  },
  submissionFields: {
    gstNumber: { label: { type: String, default: 'GST Number' }, required: { type: Boolean, default: false }, enabled: { type: Boolean, default: true } },
    yearEstablished: { label: { type: String, default: 'Year Established' }, required: { type: Boolean, default: true }, enabled: { type: Boolean, default: true } },
    employeeCount: { label: { type: String, default: 'Employee Count Range' }, required: { type: Boolean, default: false }, enabled: { type: Boolean, default: true } },
    languagesKnown: { label: { type: String, default: 'Languages Spoken' }, required: { type: Boolean, default: false }, enabled: { type: Boolean, default: true } },
    timings: { label: { type: String, default: 'Business Opening Hours' }, required: { type: Boolean, default: true }, enabled: { type: Boolean, default: true } },
    website: { label: { type: String, default: 'Website URL' }, required: { type: Boolean, default: false }, enabled: { type: Boolean, default: true } },
    brochure: { label: { type: String, default: 'Upload PDF Catalog/Brochure' }, required: { type: Boolean, default: false }, enabled: { type: Boolean, default: false } }
  },
  formGuidelines: {
    type: String,
    default: 'Submit clear commercial details, locality coordinates, and contact details to get audited. Approved businesses get standard indexing, and active subscribers receive verified badges.'
  },
  banners: [
    {
      title: String,
      image: String,
      subtitle: String,
      link: String,
      active: { type: Boolean, default: true }
    }
  ],
  permissionsMatrix: {
    superadmin: {
      businesses: { type: Boolean, default: true },
      blogs: { type: Boolean, default: true },
      events: { type: Boolean, default: true },
      subPlans: { type: Boolean, default: true },
      systemLogs: { type: Boolean, default: true },
      accessControl: { type: Boolean, default: true }
    },
    admin: {
      businesses: { type: Boolean, default: true },
      blogs: { type: Boolean, default: true },
      events: { type: Boolean, default: true },
      subPlans: { type: Boolean, default: false },
      systemLogs: { type: Boolean, default: false },
      accessControl: { type: Boolean, default: false }
    },
    owner: {
      businesses: { type: Boolean, default: false },
      blogs: { type: Boolean, default: false },
      events: { type: Boolean, default: false },
      subPlans: { type: Boolean, default: false },
      systemLogs: { type: Boolean, default: false },
      accessControl: { type: Boolean, default: false }
    }
  },
  aiPrompts: {
    descriptionSystemPrompt: {
      type: String,
      default: 'You are an AI copywriting agent specializing in writing engaging, professional, and high-converting business descriptions.'
    },
    descriptionUserPrompt: {
      type: String,
      default: 'Generate a professional business description for a business named "{name}" in the category: "{categories}".\n{hint}\nThe description must be 3 to 4 sentences long.\n\nReturn the output strictly as a JSON object matching this schema:\n{\n  "description": "text string"\n}'
    },
    highlightsSystemPrompt: {
      type: String,
      default: 'You are an AI marketing specialist agent specializing in writing concise, catchy, and high-impact highlights and features for businesses.'
    },
    highlightsUserPrompt: {
      type: String,
      default: 'Generate a list of 4 to 6 short highlights or features for a business named "{name}" in the category: "{categories}".\n{hint}\nHighlights must be short phrases. Return the output strictly as a JSON object containing a single string of comma-separated values (e.g. "On-time Service, Affordable Price, Expert Technicians"). Highlights must NOT contain any green tick or check emojis.\n\nReturn the output strictly as a JSON object matching this schema:\n{\n  "highlights": "comma-separated values string"\n}'
    },
    servicesSystemPrompt: {
      type: String,
      default: 'You are an AI business operations consultant agent specializing in listing precise and descriptive products and services offered by businesses.'
    },
    servicesUserPrompt: {
      type: String,
      default: 'Generate a list of 5 to 8 products or services offered by a business named "{name}" in the category: "{categories}".\n{hint}\nServices should be relevant and specific. Return the output strictly as a JSON object containing a single string of comma-separated values (e.g. "Home Delivery, AC Installation").\n\nReturn the output strictly as a JSON object matching this schema:\n{\n  "services": "comma-separated values string"\n}'
    }
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('SystemSetting', SystemSettingSchema);
