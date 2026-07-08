const Category = require('../models/Category');
const Business = require('../models/Business');

const escapeRegex = (string) => string.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&');

/**
 * Ensures that the parent category and subcategory exist in the Category collection
 * for an approved business. Automatically links the business to the new Category ID.
 */
const ensureCategoriesExist = async (business) => {
  try {
    let categories = business.categories;

    if (!categories || !Array.isArray(categories) || categories.length === 0) {
      if (business.category) {
        categories = [{
          category: business.category,
          type: business.type || business.category,
          customCategoryName: business.customCategoryName || '',
          categoryStatus: business.categoryStatus || 'Normal'
        }];
      } else {
        return;
      }
    }

    let needsSave = false;
    const updatedCategories = [];

    for (let entry of categories) {
      let subName = entry.type || entry.category;
      if (subName === 'Others') {
        subName = entry.customCategoryName;
      }
      if (!subName) continue;
      subName = subName.trim();

      let parentName = entry.category || 'Others';

      // 1. Ensure the parent category document exists in the Category collection
      let parentDoc = null;
      if (parentName.trim() !== 'Others' && parentName.trim() !== '') {
        parentDoc = await Category.findOne({ categoryName: { $regex: new RegExp(`^${escapeRegex(parentName.trim())}$`, 'i') } });
        if (!parentDoc) {
          parentDoc = await Category.create({
            categoryName: parentName.trim(),
            parentCategory: null,
            icon: 'Building',
            description: `Auto-created parent category for approved listing: ${business.name}`
          });
          console.log(`[CATEGORY SYNC] Auto-created parent category document: "${parentDoc.categoryName}"`);
        }
      }

      // 2. Ensure the subcategory document exists in the Category collection
      let subDoc = await Category.findOne({ categoryName: { $regex: new RegExp(`^${escapeRegex(subName.trim())}$`, 'i') } });
      const expectedParent = parentDoc ? parentDoc.categoryName : parentName.trim();
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

      // 3. Update entry fields
      const updatedEntry = {
        categoryId: subDoc._id,
        category: expectedParent,
        type: subDoc.categoryName,
        customCategoryName: '',
        categoryStatus: 'Normal'
      };

      if (!entry.categoryId || entry.categoryId.toString() !== subDoc._id.toString() || entry.category !== expectedParent || entry.type !== subDoc.categoryName || entry.customCategoryName !== '' || entry.categoryStatus !== 'Normal') {
        needsSave = true;
      }
      updatedCategories.push(updatedEntry);
    }

    if (needsSave || business.categories.length !== updatedCategories.length) {
      business.categories = updatedCategories;
      await business.save({ validateBeforeSave: false });
      console.log(`[CATEGORY SYNC] Linked business "${business.name}" to ${updatedCategories.length} categories.`);
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
