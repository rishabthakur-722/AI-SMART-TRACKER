const { body } = require('express-validator');
const validateRequest = require('./validateRequest');

const profileValidator = [
  body('name')
    .optional({ nullable: true, checkFalsy: true })
    .trim()
    .isLength({ min: 2, max: 80 })
    .withMessage('Name must be between 2 and 80 characters'),
  body('avatar')
    .optional({ nullable: true, checkFalsy: true })
    .trim()
    .isURL({ require_protocol: true, protocols: ['http', 'https'] })
    .withMessage('Avatar must be a valid URL starting with http:// or https://'),
  validateRequest,
];

const preferencesValidator = [
  body('currency')
    .optional({ nullable: true, checkFalsy: true })
    .isIn(['INR', 'USD'])
    .withMessage('Currency must be INR or USD'),
  body('defaultMarket')
    .optional({ nullable: true, checkFalsy: true })
    .isIn(['IN', 'US', 'GLOBAL'])
    .withMessage('Default market must be IN, US, or GLOBAL'),
  body('riskProfile')
    .optional({ nullable: true, checkFalsy: true })
    .isIn(['conservative', 'balanced', 'aggressive'])
    .withMessage('Invalid risk profile'),
  validateRequest,
];

module.exports = { profileValidator, preferencesValidator };
