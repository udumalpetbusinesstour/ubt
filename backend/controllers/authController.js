const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Business = require('../models/Business');
const Blog = require('../models/Blog');
const Event = require('../models/Event');
const { registerSchema, loginSchema } = require('../validations/userValidation');
const { sendSuccess, sendError } = require('../utils/responseHelper');

// Generate JWT Token
const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET || 'ubt_jwt_secret_token_123456', {
    expiresIn: '30d',
  });
};

/**
 * Register user
 */
const registerUser = async (req, res, next) => {
  try {
    // Validate request body
    const { error, value } = registerSchema.validate(req.body);
    if (error) {
      return sendError(res, 400, error.details[0].message);
    }

    const { name, fullName, email, phone, mobileNumber, password, role, referralCode, website, instagram, facebook } = value;
    const resolvedName = name || fullName;
    const resolvedPhone = phone || mobileNumber;

    // Test email bypass to allow re-registrations
    if (email && email.toLowerCase() === 'harishmitharamalingam@gmail.com') {
      const existingTestUsers = await User.find({
        $or: [
          { email: 'harishmitharamalingam@gmail.com' },
          { phone: resolvedPhone },
          { mobileNumber: resolvedPhone }
        ]
      });

      for (const u of existingTestUsers) {
        await Business.deleteMany({ ownerId: u._id });
        await User.deleteOne({ _id: u._id });
      }
    }

    // Check duplicate email
    const userExists = await User.findOne({ email });

    if (userExists) {
      return sendError(res, 400, 'Email address is already registered');
    }

    // Look up referrer if referral code provided
    let referrer = null;
    if (referralCode) {
      referrer = await User.findOne({ referralCode: referralCode.trim().toUpperCase() });
      if (!referrer) {
        return sendError(res, 400, 'Invalid referral code');
      }

      // Check self-referral
      if (referrer.email.toLowerCase() === email.toLowerCase()) {
        return sendError(res, 400, 'You cannot refer yourself');
      }
    }

    // Create new user
    const user = await User.create({
      name: resolvedName,
      fullName: resolvedName,
      email,
      phone: resolvedPhone,
      mobileNumber: resolvedPhone,
      password,
      role: role || 'owner', // Defaults to owner onboarding
      referredBy: referrer ? referrer._id : undefined,
      website: website || '',
      instagram: instagram || '',
      facebook: facebook || '',
    });

    // Create pending Referral record
    if (referrer) {
      const Referral = require('../models/Referral');
      await Referral.create({
        referrerId: referrer._id,
        referredUserId: user._id,
        status: 'pending',
        points: 10,
        antiFraudChecks: {
          selfReferral: false,
          duplicateMobile: false,
          duplicateGST: false,
          duplicateBusiness: false
        }
      });
    }

    return sendSuccess(res, 201, 'User registered successfully', {
      token: generateToken(user._id),
      user: {
        id: user._id,
        name: user.name,
        fullName: user.name,
        email: user.email,
        phone: user.phone,
        mobileNumber: user.phone,
        role: user.role,
        website: user.website,
        instagram: user.instagram,
        facebook: user.facebook,
      }
    });
  } catch (err) {
    next(err);
  }
};

/**
 * Login user
 */
const loginUser = async (req, res, next) => {
  try {
    const { error, value } = loginSchema.validate(req.body);
    if (error) {
      return sendError(res, 400, error.details[0].message);
    }

    const { email, password } = value;
    const user = await User.findOne({
      $or: [
        { email: email.toLowerCase() },
        { phone: email },
        { mobileNumber: email }
      ]
    });

    if (user && (await user.matchPassword(password))) {
      if (user.status === 'Suspended') {
        return sendError(res, 403, 'Your administrative account has been suspended due to system violations.');
      }

      const business = await Business.findOne({ ownerId: user._id });
      
      // A business is only considered an incomplete draft if it lacks essential completed listing fields
      const isDraft = business && (
        (!business.name && !business.businessName) ||
        !business.category ||
        !business.description ||
        !business.phone ||
        !business.pincode
      );
      
      const draftBusiness = (business && isDraft) ? business : null;

      return sendSuccess(res, 200, 'Authenticated successfully', {
        token: generateToken(user._id),
        user: {
          id: user._id,
          name: user.name,
          fullName: user.name,
          email: user.email,
          phone: user.phone,
          mobileNumber: user.phone,
          role: user.role,
          website: user.website,
          instagram: user.instagram,
          facebook: user.facebook,
        },
        draftBusiness
      });
    } else {
      return sendError(res, 401, 'Invalid email or password');
    }
  } catch (err) {
    next(err);
  }
};

/**
 * Get current profile
 */
const getMe = async (req, res, next) => {
  try {
    return sendSuccess(res, 200, 'User profile fetched', req.user);
  } catch (err) {
    next(err);
  }
};

/**
 * Update profile
 */
const updateProfile = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id);
    if (!user) {
      return sendError(res, 404, 'User account not found');
    }

    if (req.body.name || req.body.fullName) {
      const newName = req.body.name || req.body.fullName;
      user.name = newName;
      user.fullName = newName;
    }

    if (req.body.email) {
      const emailExists = await User.findOne({ email: req.body.email, _id: { $ne: user._id } });
      if (emailExists) {
        return sendError(res, 400, 'Email address already in use by another user');
      }
      user.email = req.body.email;
    }

    if (req.body.phone || req.body.mobileNumber) {
      const newPhone = req.body.phone || req.body.mobileNumber;
      user.phone = newPhone;
      user.mobileNumber = newPhone;
    }

    if (req.body.profileImage) {
      user.profileImage = req.body.profileImage;
    }

    if (req.body.website !== undefined) {
      user.website = req.body.website;
    }

    if (req.body.instagram !== undefined) {
      user.instagram = req.body.instagram;
    }

    if (req.body.facebook !== undefined) {
      user.facebook = req.body.facebook;
    }

    // Handle password update securely
    if (req.body.newPassword) {
      if (!req.body.currentPassword) {
        return sendError(res, 400, 'Current password is required to save a new password');
      }
      const isMatch = await user.matchPassword(req.body.currentPassword);
      if (!isMatch) {
        return sendError(res, 400, 'Current password does not match database record');
      }
      user.password = req.body.newPassword;
    }

    await user.save();

    return sendSuccess(res, 200, 'Profile credentials successfully updated', {
      id: user._id,
      name: user.name,
      fullName: user.name,
      email: user.email,
      phone: user.phone,
      mobileNumber: user.phone,
      role: user.role,
      profileImage: user.profileImage,
      website: user.website,
      instagram: user.instagram,
      facebook: user.facebook
    });
  } catch (err) {
    next(err);
  }
};

/**
 * Delete account
 */
const deleteAccount = async (req, res, next) => {
  try {
    const userId = req.user._id;

    // Cascade delete associated listings, blogs, and events
    await Business.deleteMany({ ownerId: userId });
    await Blog.deleteMany({ author: userId });
    await Event.deleteMany({ ownerId: userId });
    await User.deleteOne({ _id: userId });

    return sendSuccess(res, 200, 'Your registration and all associated listings, events, and blogs have been permanently deleted.');
  } catch (err) {
    next(err);
  }
};

/**
 * Authenticate or register via Google Sign-In
 */
const googleLogin = async (req, res, next) => {
  try {
    const { credential, isMock, email: mockEmail, name: mockName } = req.body;
    let email, name, picture;

    if (isMock) {
      // For local development / testing fallback
      email = mockEmail || 'google_partner_test@udumalpet.in';
      name = mockName || 'Google Partner Member';
      picture = '';
    } else {
      if (!credential) {
        return sendError(res, 400, 'Google credential token is required');
      }

      // Verify Google ID token via public API
      const googleVerifyRes = await fetch(`https://oauth2.googleapis.com/tokeninfo?id_token=${credential}`);
      if (!googleVerifyRes.ok) {
        return sendError(res, 400, 'Google token verification failed');
      }

      const payload = await googleVerifyRes.json();
      
      // Check client ID if configured
      const expectedClientId = process.env.GOOGLE_CLIENT_ID;
      if (expectedClientId && payload.aud !== expectedClientId) {
        return sendError(res, 400, 'Google Client ID mismatch');
      }

      email = payload.email;
      name = payload.name;
      picture = payload.picture;
    }

    if (!email) {
      return sendError(res, 400, 'Could not retrieve email from Google Account');
    }

    // Find user
    let user = await User.findOne({ email: email.toLowerCase() });
    
    if (!user) {
      // Register user dynamically
      user = await User.create({
        name: name,
        fullName: name,
        email: email.toLowerCase(),
        password: `oauth_pwd_${Math.random().toString(36).substring(2, 12)}`, // Secure dummy password
        role: 'owner', // Default role for registering business owners
        isVerified: true,
        status: 'Active',
        profileImage: picture || ''
      });
    }

    // Check suspension status
    if (user.status === 'Suspended') {
      return sendError(res, 403, 'Your account has been suspended due to system violations.');
    }

    // Generate JWT
    const token = generateToken(user._id);

    return sendSuccess(res, 200, 'Google authentication successful', {
      token,
      user: {
        id: user._id,
        name: user.name,
        fullName: user.fullName || user.name,
        email: user.email,
        phone: user.phone || user.mobileNumber,
        mobileNumber: user.phone || user.mobileNumber,
        role: user.role,
        profileImage: user.profileImage,
        isFoundingMember: user.isFoundingMember || false
      }
    });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  registerUser,
  loginUser,
  getMe,
  updateProfile,
  deleteAccount,
  googleLogin
};

