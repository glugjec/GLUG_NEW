import { Router } from 'express';
import { body, validationResult } from 'express-validator';
import { OAuth2Client } from 'google-auth-library';
import { User } from '../models/User.js';
import { signToken, requireAuth } from '../middleware/auth.js';

const router = Router();
const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

// Automatic Admin Email List
const ADMIN_EMAILS = ['glug.jec@gmail.com', 'admin@glug.dev'];

const validate = (validations) => {
  return async (req, res, next) => {
    await Promise.all(validations.map((v) => v.run(req)));
    const errors = validationResult(req);
    if (errors.isEmpty()) return next();
    return res.status(400).json({ error: errors.array()[0].msg });
  };
};

// @route   POST /api/auth/register
// @desc    Register a new user with email and password
router.post(
  '/register',
  validate([
    body('username')
      .trim()
      .isLength({ min: 3, max: 30 })
      .withMessage('Username must be between 3 and 30 characters')
      .matches(/^[a-zA-Z0-9_]+$/)
      .withMessage('Username can only contain letters, numbers, and underscores'),
    body('email').trim().isEmail().withMessage('Please provide a valid email'),
    body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
  ]),
  async (req, res) => {
    const { username, email, password } = req.body;
    const cleanEmail = email.toLowerCase().trim();

    try {
      const existing = await User.findOne({
        $or: [{ email: cleanEmail }, { username: username.trim() }],
      });

      if (existing) {
        if (existing.email === cleanEmail) {
          return res.status(409).json({ error: 'Email already registered' });
        }
        return res.status(409).json({ error: 'Username already taken' });
      }

      const role = ADMIN_EMAILS.includes(cleanEmail) ? 'admin' : 'student';
      const passwordHash = await User.hashPassword(password);
      const user = await User.create({
        username: username.trim(),
        email: cleanEmail,
        passwordHash,
        role,
      });

      const token = signToken(user);
      return res.status(201).json({ user: user.toJSON(), token });
    } catch (err) {
      console.error('[Auth Register Error]', err);
      return res.status(500).json({ error: 'Failed to create account' });
    }
  }
);

// @route   POST /api/auth/login
// @desc    Log in an existing user
router.post(
  '/login',
  validate([
    body('email').trim().isEmail().withMessage('Please provide a valid email'),
    body('password').notEmpty().withMessage('Password is required'),
  ]),
  async (req, res) => {
    const { email, password } = req.body;
    const cleanEmail = email.toLowerCase().trim();

    try {
      const user = await User.findOne({ email: cleanEmail });
      if (!user) {
        return res.status(401).json({ error: 'Invalid email or password' });
      }

      const isMatch = await user.comparePassword(password);
      if (!isMatch) {
        return res.status(401).json({ error: 'Invalid email or password' });
      }

      if (ADMIN_EMAILS.includes(cleanEmail) && user.role !== 'admin') {
        user.role = 'admin';
        await user.save();
      }

      const token = signToken(user);
      return res.json({ user: user.toJSON(), token });
    } catch (err) {
      console.error('[Auth Login Error]', err);
      return res.status(500).json({ error: 'Authentication failed' });
    }
  }
);

// @route   POST /api/auth/google
// @desc    Google OAuth Sign-In / Sign-Up
router.post('/google', async (req, res) => {
  const { credential } = req.body;

  if (!credential) {
    return res.status(400).json({ error: 'Google credential token is required' });
  }

  try {
    let payload;

    if (process.env.GOOGLE_CLIENT_ID) {
      const ticket = await googleClient.verifyIdToken({
        idToken: credential,
        audience: process.env.GOOGLE_CLIENT_ID,
      });
      payload = ticket.getPayload();
    } else {
      const parts = credential.split('.');
      if (parts.length === 3) {
        payload = JSON.parse(Buffer.from(parts[1], 'base64').toString('utf-8'));
      } else {
        return res.status(400).json({ error: 'Invalid token structure' });
      }
    }

    if (!payload || !payload.email) {
      return res.status(400).json({ error: 'Unable to extract profile from Google token' });
    }

    const { email, sub: googleId, picture } = payload;
    const cleanEmail = email.toLowerCase().trim();
    const isSpecialAdmin = ADMIN_EMAILS.includes(cleanEmail);

    let user = await User.findOne({
      $or: [{ googleId }, { email: cleanEmail }],
    });

    if (user) {
      let modified = false;
      if (isSpecialAdmin && user.role !== 'admin') {
        user.role = 'admin';
        modified = true;
      }
      if (!user.googleId) {
        user.googleId = googleId;
        modified = true;
      }
      if (!user.avatar && picture) {
        user.avatar = picture;
        modified = true;
      }
      if (modified) await user.save();
    } else {
      let baseUsername = (cleanEmail.split('@')[0] || 'student')
        .replace(/[^a-zA-Z0-9_]/g, '_')
        .slice(0, 20);

      if (baseUsername.length < 3) baseUsername = `${baseUsername}_user`;

      let uniqueUsername = baseUsername;
      let counter = 1;
      while (await User.findOne({ username: uniqueUsername })) {
        uniqueUsername = `${baseUsername}_${counter}`;
        counter++;
      }

      user = await User.create({
        username: uniqueUsername,
        email: cleanEmail,
        googleId,
        avatar: picture || '',
        role: isSpecialAdmin ? 'admin' : 'student',
      });
    }

    const token = signToken(user);
    return res.json({ user: user.toJSON(), token });
  } catch (err) {
    console.error('[Google Auth Error]', err);
    return res.status(401).json({ error: 'Google authentication failed: ' + (err.message || 'Invalid token') });
  }
});

// @route   GET /api/auth/me
// @desc    Get current user profile
router.get('/me', requireAuth, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    return res.json({ user: user.toJSON() });
  } catch (err) {
    console.error('[Auth /me Error]', err);
    return res.status(500).json({ error: 'Failed to retrieve profile' });
  }
});

// @route   PUT /api/auth/me
router.put('/me', requireAuth, async (req, res) => {
  const { username, bio, skills, avatar, socials, preferences, currentPassword, newPassword } = req.body;

  try {
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    if (typeof username === 'string' && username.trim() && username.trim() !== user.username) {
      const cleanUsername = username.trim();
      if (!/^[a-zA-Z0-9_]{3,30}$/.test(cleanUsername)) {
        return res.status(400).json({ error: 'Username must be 3-30 characters (letters, numbers, underscore)' });
      }
      const existing = await User.findOne({ username: cleanUsername, _id: { $ne: user._id } });
      if (existing) {
        return res.status(409).json({ error: 'Username already taken' });
      }
      user.username = cleanUsername;
    }

    if (typeof bio === 'string') user.bio = bio;
    if (Array.isArray(skills)) user.skills = skills.map((s) => String(s).trim()).filter(Boolean);
    if (typeof avatar === 'string') user.avatar = avatar;

    if (socials && typeof socials === 'object') {
      user.socials = {
        github: typeof socials.github === 'string' ? socials.github.trim() : (user.socials?.github || ''),
        linkedin: typeof socials.linkedin === 'string' ? socials.linkedin.trim() : (user.socials?.linkedin || ''),
        website: typeof socials.website === 'string' ? socials.website.trim() : (user.socials?.website || ''),
        twitter: typeof socials.twitter === 'string' ? socials.twitter.trim() : (user.socials?.twitter || ''),
      };
    }

    if (preferences && typeof preferences === 'object') {
      user.preferences = {
        emailNotifs: preferences.emailNotifs !== undefined ? !!preferences.emailNotifs : (user.preferences?.emailNotifs ?? true),
        replyNotifs: preferences.replyNotifs !== undefined ? !!preferences.replyNotifs : (user.preferences?.replyNotifs ?? true),
        eventNotifs: preferences.eventNotifs !== undefined ? !!preferences.eventNotifs : (user.preferences?.eventNotifs ?? true),
        theme: typeof preferences.theme === 'string' ? preferences.theme : (user.preferences?.theme || 'dark'),
      };
    }

    if (newPassword) {
      if (user.passwordHash) {
        if (!currentPassword) {
          return res.status(400).json({ error: 'Current password is required to set a new password' });
        }
        const isMatch = await user.comparePassword(currentPassword);
        if (!isMatch) {
          return res.status(400).json({ error: 'Current password does not match' });
        }
      }
      if (newPassword.length < 6) {
        return res.status(400).json({ error: 'New password must be at least 6 characters' });
      }
      user.passwordHash = await User.hashPassword(newPassword);
    }

    await user.save();
    return res.json({ user: user.toJSON() });
  } catch (err) {
    console.error('[Auth Update Profile Error]', err);
    return res.status(500).json({ error: 'Failed to update profile' });
  }
});

export default router;

