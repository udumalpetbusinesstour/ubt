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
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('SystemSetting', SystemSettingSchema);
