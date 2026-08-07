const mongoose = require('mongoose');
const User = require('../models/User');
const Portfolio = require('../models/Portfolio');
const asyncHandler = require('../utils/asyncHandler');
const { sendSuccess } = require('../utils/apiResponse');
const localAuthStore = require('../services/localAuthStore');

const useMockDatabase = () => process.env.NODE_ENV !== 'production' && mongoose.connection.readyState !== 1;

const getSettings = asyncHandler(async (req, res) => {
  if (useMockDatabase()) {
    const user = localAuthStore.findUserById(String(req.user._id));
    return sendSuccess(res, 200, 'Settings loaded successfully', { user: user || req.user, portfolio: null });
  }

  const [user, portfolio] = await Promise.all([
    User.findById(req.user._id),
    Portfolio.findOne({ user: req.user._id }),
  ]);

  return sendSuccess(res, 200, 'Settings loaded successfully', { user, portfolio });
});

const updateProfile = asyncHandler(async (req, res) => {
  const updates = {};

  if (req.body.name !== undefined && req.body.name !== '') updates.name = req.body.name;
  if (req.body.avatar !== undefined && req.body.avatar !== '') updates.avatar = req.body.avatar;

  if (useMockDatabase()) {
    const user = localAuthStore.updateUser(String(req.user._id), updates) || req.user;
    return sendSuccess(res, 200, 'Profile updated successfully', user);
  }

  const user = await User.findByIdAndUpdate(req.user._id, updates, {
    new: true,
    runValidators: true,
  });

  if (!user) {
    res.status(404);
    throw new Error('User not found');
  }

  return sendSuccess(res, 200, 'Profile updated successfully', user);
});

const updatePreferences = asyncHandler(async (req, res) => {
  const updates = {};

  for (const key of ['currency', 'defaultMarket', 'riskProfile']) {
    if (req.body[key] !== undefined && req.body[key] !== '') {
      updates[`preferences.${key}`] = req.body[key];
    }
  }

  if (useMockDatabase()) {
    const user = localAuthStore.updateUser(String(req.user._id), updates) || req.user;
    return sendSuccess(res, 200, 'Preferences updated successfully', user);
  }

  const user = await User.findByIdAndUpdate(req.user._id, { $set: updates }, {
    new: true,
    runValidators: true,
  });

  if (!user) {
    res.status(404);
    throw new Error('User not found');
  }

  return sendSuccess(res, 200, 'Preferences updated successfully', user);
});

module.exports = { getSettings, updateProfile, updatePreferences };

