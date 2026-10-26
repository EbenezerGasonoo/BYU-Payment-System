/**
 * Manual issuer: the team sources a real card and an admin assigns it on the Assign screen.
 * Nothing can be issued, frozen or closed through an API, so card controls stay database-only
 * and expired cards are flagged for someone to close by hand.
 */

module.exports = {
  name: 'manual',
  isApi: false,
  credentialsFrom: () => ({}),
  isConfigured: () => true,
  issue: async () => ({ success: false, message: 'No card provider available; card must be assigned manually' }),
  setFrozen: async () => ({ success: false, manual: true }),
  terminate: async () => ({ success: false, manual: true })
};
