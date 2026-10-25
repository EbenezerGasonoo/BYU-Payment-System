// Countries students can pay from, and how money is shown for each.
// The backend prices every request; the rates here are only fallbacks for estimates.

export const COUNTRIES = {
  GH: {
    code: 'GH',
    name: 'Ghana',
    currency: 'GHS',
    currencyName: 'cedis',
    locale: 'en-GH',
    fallbackRate: 15.5,
    phoneLabel: 'Mobile Money number',
    phonePlaceholder: '024 000 0000',
    payWith: 'Mobile Money'
  },
  NG: {
    code: 'NG',
    name: 'Nigeria',
    currency: 'NGN',
    currencyName: 'naira',
    locale: 'en-NG',
    fallbackRate: 1520,
    phoneLabel: 'Phone number',
    phonePlaceholder: '0803 000 0000',
    payWith: 'card, bank transfer or USSD'
  }
};

export const COUNTRY_LIST = Object.values(COUNTRIES);

// Accounts created before country selection existed are Ghanaian
export const getCountry = (code) => COUNTRIES[String(code || '').toUpperCase()] || COUNTRIES.GH;

const LOCALE_BY_CURRENCY = { GHS: 'en-GH', NGN: 'en-NG' };

export const formatAmount = (value, currency = 'GHS') =>
  Number(value || 0).toLocaleString(LOCALE_BY_CURRENCY[currency] || 'en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  });

export const formatMoney = (value, currency = 'GHS') => `${currency} ${formatAmount(value, currency)}`;

// Older requests only have the cedi columns; newer ones carry currency + amountLocal (the total)
export const requestCurrency = (req) => req?.currency || 'GHS';
export const requestTotalLocal = (req) => req?.amountLocal ?? req?.totalPaidGHS ?? null;

export const formatRequestPaid = (req) => {
  const total = requestTotalLocal(req);
  return total ? formatMoney(total, requestCurrency(req)) : '—';
};
