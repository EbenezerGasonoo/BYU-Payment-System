// Facts shown across the public site. Keep these in one place so the
// pages never disagree with each other.

export const SUPPORT = {
  whatsappDisplay: '+233 54 369 2272',
  whatsappUrl: 'https://wa.me/233543692272',
  phoneUrl: 'tel:+233543692272',
  email: 'iamknightrae@gmail.com',
  hours: 'Monday to Friday, 9:00 to 17:00 GMT'
};

export const SERVICE = {
  feePercent: 5,
  processingTime: '2 to 4 business hours',
  cardValidity: '4 to 6 hours',
  networks: ['MTN MoMo', 'Telecel Cash', 'AT Money'],
  fallbackGhsRate: 15.5
};

// Support desk is open on weekdays, 9:00–17:00 GMT (Ghana time)
export const isSupportOpen = (now = new Date()) => {
  const day = now.getUTCDay();
  const hour = now.getUTCHours();
  return day >= 1 && day <= 5 && hour >= 9 && hour < 17;
};
