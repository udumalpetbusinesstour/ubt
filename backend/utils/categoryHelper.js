const Category = require('../models/Category');
const Business = require('../models/Business');

const escapeRegex = (string) => string.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&');

/**
 * Ensures that the parent category and subcategory exist in the Category collection
 * for an approved business. Automatically links the business to the new Category ID.
 */
const ensureCategoriesExist = async (business) => {
  try {
    let { requestedParentCategory, category, customCategoryName } = business;

    if (!category) return;

    // Force governmental subcategories to always be nested under "Governmental organisations" unless requested parent category is "Public Sector"
    const govSubcategories = ['taluk office', 'municipality', 'police stations', 'police station', 'hospitals', 'hospital', 'banks', 'bank', 'schools', 'school'];
    const subNameClean = (category === 'Others' ? customCategoryName : category)?.trim();
    if (subNameClean && govSubcategories.includes(subNameClean.toLowerCase()) && requestedParentCategory !== 'Public Sector') {
      requestedParentCategory = 'Governmental organisations';
      business.requestedParentCategory = 'Governmental organisations';
    }

    if (!requestedParentCategory) return;

    // 1. Ensure the parent category document exists in the Category collection
    let parentDoc = null;
    if (requestedParentCategory.trim() !== 'Others' && requestedParentCategory.trim() !== '') {
      parentDoc = await Category.findOne({ categoryName: { $regex: new RegExp(`^${escapeRegex(requestedParentCategory.trim())}$`, 'i') } });
      if (!parentDoc) {
        parentDoc = await Category.create({
          categoryName: requestedParentCategory.trim(),
          parentCategory: null,
          icon: 'Building',
          description: `Auto-created parent category for approved listing: ${business.name}`
        });
        console.log(`[CATEGORY SYNC] Auto-created parent category document: "${parentDoc.categoryName}"`);
      }
    }

    // 2. Ensure the subcategory document exists in the Category collection
    const subName = (category === 'Others' ? customCategoryName : category);
    if (subName && subName.trim() !== '' && subName.trim() !== 'Others') {
      let subDoc = await Category.findOne({ categoryName: { $regex: new RegExp(`^${escapeRegex(subName.trim())}$`, 'i') } });
      const expectedParent = parentDoc ? parentDoc.categoryName : requestedParentCategory.trim();
      if (!subDoc) {
        subDoc = await Category.create({
          categoryName: subName.trim(),
          parentCategory: expectedParent,
          icon: 'Store',
          description: `Auto-created subcategory for approved listing: ${business.name}`
        });
        console.log(`[CATEGORY SYNC] Auto-created subcategory document: "${subDoc.categoryName}" under parent "${subDoc.parentCategory}"`);
      } else if (subDoc.parentCategory !== expectedParent) {
        subDoc.parentCategory = expectedParent;
        await subDoc.save();
        console.log(`[CATEGORY SYNC] Corrected parent category of existing subcategory "${subDoc.categoryName}" to "${expectedParent}"`);
      }

      // 3. Link the business to this concrete category in the database
      let needsSave = false;
      if (!business.categoryId || business.categoryId.toString() !== subDoc._id.toString()) {
        business.categoryId = subDoc._id;
        needsSave = true;
      }
      if (business.category !== subDoc.categoryName) {
        business.category = subDoc.categoryName;
        needsSave = true;
      }
      if (business.customCategoryName !== '') {
        business.customCategoryName = '';
        needsSave = true;
      }
      if (business.categoryStatus !== 'Normal') {
        business.categoryStatus = 'Normal';
        needsSave = true;
      }

      if (needsSave) {
        await business.save({ validateBeforeSave: false });
        console.log(`[CATEGORY SYNC] Linked business "${business.name}" to category "${subDoc.categoryName}" (ID: ${subDoc._id})`);
      }
    }
  } catch (err) {
    console.error('Error in ensureCategoriesExist helper:', err);
  }
};

/**
 * Migration helper to sync all currently approved listings' custom categories.
 */
const syncAllApprovedCategories = async () => {
  try {
    // Proactively clean up subscriptionStatus for all approved listings to prevent locking
    const subsResult = await Business.updateMany(
      { status: 'Approved', subscriptionStatus: { $in: ['none', null, '', 'suspended'] } },
      { $set: { subscriptionStatus: 'active' } }
    );
    if (subsResult.modifiedCount > 0) {
      console.log(`[SUBSCRIPTION SYNC] Activated subscription status for ${subsResult.modifiedCount} approved businesses that were previously inactive.`);
    }

    console.log(`[CATEGORY SYNC] Startup categories sync bypassed.`);
  } catch (err) {
    console.error('Error syncing all approved categories:', err);
  }
};

module.exports = {
  ensureCategoriesExist,
  syncAllApprovedCategories
};
