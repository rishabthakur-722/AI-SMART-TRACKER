const express = require('express');
const passport = require('../config/passport');
const { register, login, logout, getProfile, googleCallback } = require('../controllers/authController');
const { env } = require('../config/env');
const { protect } = require('../middleware/authMiddleware');
const { registerValidator, loginValidator } = require('../validators/authValidator');

const router = express.Router();
const googleOAuthReady = Boolean(env.googleClientId && env.googleClientSecret && env.googleCallbackUrl);

const requireGoogleOAuth = (req, res, next) => {
  if (!googleOAuthReady) {
    res.status(503);
    return next(new Error('Google OAuth is not configured'));
  }

  return next();
};

router.post('/register', registerValidator, register);
router.post('/login', loginValidator, login);
router.post('/logout', logout);
router.get('/profile', protect, getProfile);
router.get('/google', requireGoogleOAuth, passport.authenticate('google', { scope: ['profile', 'email'], session: false }));
router.get(
  '/google/callback',
  requireGoogleOAuth,
  (req, res, next) => {
    passport.authenticate('google', { session: false }, (err, user, info) => {
      if (err) {
        console.error('[Google OAuth Error]:', err.message, err.oauthError?.data || '');
        return res.redirect(`${env.clientUrl}/login?error=${encodeURIComponent(err.message || 'Google authentication failed')}`);
      }

      if (!user) {
        return res.redirect(`${env.clientUrl}/login?error=Authentication+failed`);
      }

      req.user = user;
      return googleCallback(req, res, next);
    })(req, res, next);
  }
);

module.exports = router;
