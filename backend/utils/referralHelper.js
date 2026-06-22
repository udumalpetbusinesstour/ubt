const Referral = require('../models/Referral');
const User = require('../models/User');
const Business = require('../models/Business');
const Notification = require('../models/Notification');

/**
 * Checks all pending referrals where the given userId is the referrer.
 * Called when a user's subscription becomes active, allowing them to claim
 * any pending referral points for invitees who already subscribed.
 */
const checkPendingReferralsForReferrer = async (referrerId) => {
  try {
    const pendingReferrals = await Referral.find({
      referrerId: referrerId,
      status: 'pending'
    });

    for (const ref of pendingReferrals) {
      // Find the referred user's business
      const referredBusiness = await Business.findOne({ ownerId: ref.referredUserId });
      if (referredBusiness) {
        await checkAndCompleteReferralByBusiness(referredBusiness._id);
      }
    }
  } catch (error) {
    console.error(`[Referral Error] failed checkPendingReferralsForReferrer:`, error);
  }
};

/**
 * Checks if all referral criteria are met for a business listing.
 * If yes, updates the referral status to completed and credits points to the referrer.
 * 
 * Criteria:
 * - Business is Approved
 * - Business subscriptionStatus is active
 * - Referral is currently in 'pending' status
 * - Referrer itself has an active subscription
 */
const checkAndCompleteReferralByBusiness = async (businessId) => {
  try {
    const business = await Business.findById(businessId);
    if (!business) {
      console.log(`[Referral Check] Business not found: ${businessId}`);
      return null;
    }

    // Find a pending referral for this business or owner
    const referral = await Referral.findOne({
      referredUserId: business.ownerId,
      status: 'pending'
    });

    if (!referral) {
      // If there is no pending referral for this business, it might be that this business owner
      // is a referrer who just activated their subscription. Check if they have pending referrals to claim!
      await checkPendingReferralsForReferrer(business.ownerId);
      return null;
    }

    // Associate businessId to referral if not already linked
    if (!referral.referredBusinessId) {
      referral.referredBusinessId = business._id;
      await referral.save();
    }

    const isBusinessApproved = business.status === 'Approved' || business.verificationStatus === 'approved';
    const isSubscriptionActive = business.subscriptionStatus === 'active';

    const Payment = require('../models/Payment');
    const hasPaid = await Payment.exists({
      businessId: business._id,
      status: { $in: ['Paid', 'captured'] }
    });

    if (isBusinessApproved && isSubscriptionActive && hasPaid) {
      // Credit points to the referrer only if the referrer is subscribed
      const referrer = await User.findById(referral.referrerId);
      if (!referrer) {
        return null;
      }

      // Referrer must be admin/superadmin OR have an active subscribed business
      const referrerBusiness = await Business.findOne({ ownerId: referrer._id, subscriptionStatus: 'active' });
      const isReferrerSubscribed = referrer.role === 'admin' || referrer.role === 'superadmin' || !!referrerBusiness;

      if (!isReferrerSubscribed) {
        console.log(`[Referral Check] Referrer ${referrer.email} is not subscribed. Skipping completion.`);
        return null;
      }

      // Complete referral
      referral.status = 'completed';
      await referral.save();

      referrer.referralPoints = (referrer.referralPoints || 0) + referral.points;
      await referrer.save();

      // Create platform notification for referrer
      await Notification.create({
        userId: referrer._id,
        title: 'Referral Points Awarded!',
        message: `Congratulations! Your referral for "${business.name}" is successful. You have earned ${referral.points} points.`,
        type: 'referral_bonus'
      });

      console.log(`[Referral Success] Referrer ${referrer.email} awarded ${referral.points} points for business ${business.name}`);

      // Now trigger check for the newly activated referred business owner as a referrer
      await checkPendingReferralsForReferrer(business.ownerId);

      return referral;
    }

    return null;
  } catch (error) {
    console.error(`[Referral Error] failed check:`, error);
    return null;
  }
};

module.exports = {
  checkAndCompleteReferralByBusiness,
  checkPendingReferralsForReferrer
};
