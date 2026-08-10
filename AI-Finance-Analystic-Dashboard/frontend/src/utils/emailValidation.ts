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

export const normalizeEmail = (email: string) => email.trim().toLowerCase();

export const isValidEmailAddress = (email: string) =>
  /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());

export const isDisposableEmail = (email: string) => {
  const normalized = normalizeEmail(email);
  const atIndex = normalized.lastIndexOf('@');

  if (atIndex < 0) {
    return false;
  }

  return disposableDomains.has(normalized.slice(atIndex + 1));
};