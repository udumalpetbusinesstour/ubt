const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const User = require('../models/User');
const Business = require('../models/Business');
const Blog = require('../models/Blog');
const Event = require('../models/Event');
const { registerSchema, loginSchema } = require('../validations/userValidation');
const { sendSuccess, sendError } = require('../utils/responseHelper');
const { sendEmail } = require('../utils/emailHelper');

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
      return sendError(res, 400, 'Already signed up. Login to proceed.');
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

    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const otpExpires = Date.now() + 10 * 60 * 1000; // 10 minutes

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
      isVerified: false,
      emailVerificationOtp: otp,
      emailVerificationOtpExpires: otpExpires
    });

    // Create pending Referral record
    if (referrer) {
      const Referral = require('../models/Referral');
      await Referral.create({
        referrerId: referrer._id,
        referredUserId: user._id,
        status: 'pending',
        points: 99,
        antiFraudChecks: {
          selfReferral: false,
          duplicateMobile: false,
          duplicateGST: false,
          duplicateBusiness: false
        }
      });
    }

    try {
      await sendEmail({
        to: email,
        subject: 'Email Verification OTP - UBT',
        text: `Hello ${resolvedName},\n\nWelcome to Udumalpet Business Tour!\n\nYour 6-digit verification code is: ${otp}\n\nIt is valid for 10 minutes.\n\nBest regards,\nUBT Team`,
        html: `<p>Hello <strong>${resolvedName}</strong>,</p><p>Welcome to Udumalpet Business Tour!</p><p>Your 6-digit verification code is: <strong style="font-size: 18px; color: #027244;">${otp}</strong></p><p>It is valid for 10 minutes.</p><p>Best regards,<br/>UBT Team</p>`
      });
    } catch (emailErr) {
      console.error('Failed to send verification email during registration:', emailErr);
    }

    return sendSuccess(res, 201, 'Verification OTP sent to your email. Please verify to complete registration.', {
      requiresVerification: true,
      email: user.email
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

      if (!user.isVerified) {
        const otp = Math.floor(100000 + Math.random() * 900000).toString();
        user.emailVerificationOtp = otp;
        user.emailVerificationOtpExpires = Date.now() + 10 * 60 * 1000; // 10 minutes
        await user.save();

        try {
          await sendEmail({
            to: user.email,
            subject: 'Email Verification OTP - UBT',
            text: `Your 6-digit verification code is: ${otp}. It will expire in 10 minutes.`,
            html: `<p>Your 6-digit verification code is: <strong style="font-size: 18px; color: #027244;">${otp}</strong></p><p>It will expire in 10 minutes.</p>`
          });
        } catch (emailErr) {
          console.error('Failed to send verification email during login:', emailErr);
        }

        return sendError(res, 403, 'Email verification required. A verification code has been sent to your email.', {
          requiresVerification: true,
          email: user.email
        });
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
          isPartnerRegistered: user.isPartnerRegistered || false,
          isPartnerApproved: user.isPartnerApproved || false,
          partnerStatus: user.partnerStatus || 'pending',
          aadhaarNumber: user.aadhaarNumber || '',
          address: user.address || '',
          referralCode: user.referralCode || '',
          referralPoints: user.referralPoints || 0
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

    if (req.body.aadhaarNumber !== undefined) {
      user.aadhaarNumber = req.body.aadhaarNumber;
    }

    if (req.body.address !== undefined) {
      user.address = req.body.address;
    }

    if (req.body.isPartnerRegistered !== undefined) {
      user.isPartnerRegistered = req.body.isPartnerRegistered;
      if (req.body.isPartnerRegistered === true) {
        user.isPartnerApproved = false;
        user.partnerStatus = 'pending';
        user.role = 'partner';
      }
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
      facebook: user.facebook,
      isPartnerRegistered: user.isPartnerRegistered || false,
      isPartnerApproved: user.isPartnerApproved || false,
      partnerStatus: user.partnerStatus || 'pending',
      aadhaarNumber: user.aadhaarNumber || '',
      address: user.address || ''
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
    const { credential, isMock, email: mockEmail, name: mockName, action } = req.body;
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
    
    if (user && (action === 'signup' || action === 'register')) {
      return sendError(res, 400, 'Already signed up. Login to proceed.');
    }
    
    const isPartnerTest = email.toLowerCase() === 'google_partner_test@udumalpet.in';

    if (user && isPartnerTest) {
      let updated = false;
      if (user.role !== 'partner') { user.role = 'partner'; updated = true; }
      if (!user.isPartnerRegistered) { user.isPartnerRegistered = true; updated = true; }
      if (!user.isPartnerApproved) { user.isPartnerApproved = true; user.partnerStatus = 'approved'; updated = true; }
      if (updated) { await user.save(); }
    }

    if (!user) {
      // Register user dynamically
      user = await User.create({
        name: name,
        fullName: name,
        email: email.toLowerCase(),
        password: `oauth_pwd_${Math.random().toString(36).substring(2, 12)}`, // Secure dummy password
        role: isPartnerTest ? 'partner' : (req.body.role || 'owner'), // Default role for registering business owners
        isVerified: true,
        status: 'Active',
        profileImage: picture || '',
        isPartnerRegistered: isPartnerTest ? true : false,
        isPartnerApproved: isPartnerTest ? true : false,
        partnerStatus: isPartnerTest ? 'approved' : 'pending'
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
        isFoundingMember: user.isFoundingMember || false,
        isPartnerRegistered: user.isPartnerRegistered || false,
        isPartnerApproved: user.isPartnerApproved || false,
        partnerStatus: user.partnerStatus || 'pending',
        aadhaarNumber: user.aadhaarNumber || '',
        address: user.address || ''
      }
    });
  } catch (err) {
    next(err);
  }
};

/**
 * Request password reset token
 */
const forgotPassword = async (req, res, next) => {
  try {
    const { email, origin } = req.body;
    if (!email) {
      return sendError(res, 400, 'Please provide an email address');
    }

    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) {
      return sendError(res, 404, 'No account found with this email address');
    }

    // Generate reset token
    const resetToken = crypto.randomBytes(20).toString('hex');

    // Hash token and set expire fields in DB (1 hour validity)
    const hashedToken = crypto.createHash('sha256').update(resetToken).digest('hex');
    user.resetPasswordToken = hashedToken;
    user.resetPasswordExpire = Date.now() + 3600000; // 1 hour

    await user.save();

    // Reset url (fallback to req.headers.origin or localhost frontend)
    let clientOrigin = origin || req.headers.origin;
    if (!clientOrigin && req.headers.referer) {
      try {
        clientOrigin = new URL(req.headers.referer).origin;
      } catch (err) {
        // ignore invalid referer urls
      }
    }

    const requestHost = req.get('host') || '';
    if (requestHost.includes('staging.udumalpet.business') || requestHost.includes('staging-api.udumalpet.business')) {
      clientOrigin = 'https://staging.udumalpet.business';
    } else if (requestHost.includes('udumalpet.business') || requestHost.includes('api.udumalpet.business')) {
      clientOrigin = 'https://udumalpet.business';
    }

    if (!clientOrigin || clientOrigin.includes('localhost') || clientOrigin.includes('127.0.0.1')) {
      if (requestHost.includes('staging')) {
        clientOrigin = 'https://staging.udumalpet.business';
      } else if (requestHost.includes('udumalpet') || requestHost.includes('business')) {
        clientOrigin = 'https://udumalpet.business';
      } else {
        clientOrigin = 'http://localhost:5173';
      }
    }
    const resetUrl = `${clientOrigin}/reset-password?token=${resetToken}`;

    const textMessage = `You are receiving this email because you (or someone else) have requested the reset of a password. Please click on the following link or paste it into your browser to complete the process:\n\n${resetUrl}\n\nThis link will expire in 1 hour. If you did not request this, please ignore this email.`;

    const htmlMessage = `
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 8px;">
        <h2 style="color: #027244;">Password Reset Request</h2>
        <p>You requested a password reset for your Udumalpet Business Tour (UBT) account.</p>
        <p>Please click the button below to reset your password. This link is valid for <strong>1 hour</strong>.</p>
        <div style="margin: 24px 0;">
          <a href="${resetUrl}" style="background-color: #027244; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block;">Reset Password</a>
        </div>
        <p style="color: #64748b; font-size: 12px;">If the button above doesn't work, copy and paste this URL into your browser:</p>
        <p style="color: #027244; font-size: 12px; word-break: break-all;">${resetUrl}</p>
        <hr style="border: 0; border-top: 1px solid #e2e8f0; margin: 20px 0;" />
        <p style="color: #64748b; font-size: 12px;">If you did not request a password reset, please ignore this email. Your password will remain unchanged.</p>
      </div>
    `;

    try {
      await sendEmail({
        to: user.email,
        subject: 'Password Reset Request - Udumalpet Business Tour',
        text: textMessage,
        html: htmlMessage
      });
      return sendSuccess(res, 200, 'Password reset email sent successfully');
    } catch (mailErr) {
      // Clear token fields on email dispatch failure
      user.resetPasswordToken = undefined;
      user.resetPasswordExpire = undefined;
      await user.save();
      return sendError(res, 500, 'Email could not be sent. Please try again.');
    }
  } catch (err) {
    next(err);
  }
};

/**
 * Reset password using token
 */
const resetPassword = async (req, res, next) => {
  try {
    const { token, password } = req.body;
    if (!token || !password) {
      return sendError(res, 400, 'Token and password are required');
    }

    if (password.length < 6) {
      return sendError(res, 400, 'Password must be at least 6 characters');
    }

    // Hash incoming token to match stored hash
    const hashedToken = crypto.createHash('sha256').update(token).digest('hex');

    const user = await User.findOne({
      resetPasswordToken: hashedToken,
      resetPasswordExpire: { $gt: Date.now() }
    });

    if (!user) {
      return sendError(res, 400, 'Invalid or expired reset token');
    }

    // Set new password
    user.password = password;
    user.resetPasswordToken = undefined;
    user.resetPasswordExpire = undefined;

    await user.save();

    return sendSuccess(res, 200, 'Password reset successful. You can now login with your new password.');
  } catch (err) {
    next(err);
  }
};

/**
 * Verify Email Verification OTP
 */
const verifyEmailOtp = async (req, res, next) => {
  try {
    const { email, otp } = req.body;
    if (!email || !otp) {
      return sendError(res, 400, 'Email and verification code are required.');
    }

    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) {
      return sendError(res, 404, 'User not found.');
    }

    if (user.isVerified) {
      return sendError(res, 400, 'Email is already verified.');
    }

    if (user.emailVerificationOtp !== otp) {
      return sendError(res, 400, 'Invalid verification code.');
    }

    if (user.emailVerificationOtpExpires && user.emailVerificationOtpExpires < new Date()) {
      return sendError(res, 400, 'Verification code has expired. Please request a new one.');
    }

    // Update user to verified
    user.isVerified = true;
    user.emailVerificationOtp = '';
    user.emailVerificationOtpExpires = undefined;
    await user.save();

    return sendSuccess(res, 200, 'Email verified successfully!', {
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
        isPartnerRegistered: user.isPartnerRegistered || false,
        isPartnerApproved: user.isPartnerApproved || false,
        partnerStatus: user.partnerStatus || 'pending',
        aadhaarNumber: user.aadhaarNumber || '',
        address: user.address || '',
        referralCode: user.referralCode || '',
        referralPoints: user.referralPoints || 0
      }
    });
  } catch (err) {
    next(err);
  }
};

/**
 * Resend Email Verification OTP
 */
const resendVerificationOtp = async (req, res, next) => {
  try {
    const { email } = req.body;
    if (!email) {
      return sendError(res, 400, 'Email is required.');
    }

    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) {
      return sendError(res, 404, 'User not found.');
    }

    if (user.isVerified) {
      return sendError(res, 400, 'Email is already verified.');
    }

    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    user.emailVerificationOtp = otp;
    user.emailVerificationOtpExpires = Date.now() + 10 * 60 * 1000; // 10 minutes
    await user.save();

    try {
      await sendEmail({
        to: user.email,
        subject: 'Email Verification OTP - UBT',
        text: `Your 6-digit verification code is: ${otp}. It will expire in 10 minutes.`,
        html: `<p>Your 6-digit verification code is: <strong style="font-size: 18px; color: #027244;">${otp}</strong></p><p>It will expire in 10 minutes.</p>`
      });
    } catch (emailErr) {
      console.error('Failed to send verification email:', emailErr);
    }

    return sendSuccess(res, 200, 'Verification OTP sent to your email.');
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
  googleLogin,
  forgotPassword,
  resetPassword,
  verifyEmailOtp,
  resendVerificationOtp
};

