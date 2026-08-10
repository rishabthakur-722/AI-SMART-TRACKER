const disposableDomains = new Set([
  '10minutemail.com',
  '10minutemail.net',
  'mailinator.com',
  'tempmail.com',
  'temp-mail.org',
  'guerrillamail.com',
  'yopmail.com',
  'getnada.com',
  'maildrop.cc',
  'sharklasers.com',
  'trashmail.com',
  'dispostable.com',
  'fakeinbox.com',
  'moakt.com',
  'mailnesia.com',
]);

const normalizeEmail = (email) => String(email || '').trim().toLowerCase();

const getEmailDomain = (email) => {
  const normalized = normalizeEmail(email);
  const atIndex = normalized.lastIndexOf('@');

  if (atIndex < 0) {
    return '';
  }

  return normalized.slice(atIndex + 1);
};

const isDisposableEmail = (email) => disposableDomains.has(getEmailDomain(email));

module.exports = { normalizeEmail, getEmailDomain, isDisposableEmail };