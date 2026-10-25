import { WEST_AFRICA_COUNTRIES, SUPPORTED_COUNTRY_CODES } from '../theme/colors';

// Fallback USD rates for estimates only; the backend prices every request
export const FALLBACK_RATES = { GHS: 15.5, NGN: 1520 };
export const FEE_PERCENT = 5;

// Accounts created before country selection existed are Ghanaian
export const getStudentCountry = (code) => {
  const upper = String(code || '').toUpperCase();
  const resolved = SUPPORTED_COUNTRY_CODES.includes(upper) ? upper : 'GH';
  return { code: resolved, ...WEST_AFRICA_COUNTRIES[resolved] };
};

export const formatMoney = (value, currency = 'GHS') =>
  `${currency} ${Number(value || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

// Older requests only have the cedi columns; newer ones carry currency + amountLocal (the total)
export const requestCurrency = (req) => req?.currency || 'GHS';
export const formatRequestPaid = (req) => {
  const total = req?.amountLocal ?? req?.totalPaidGHS;
  return total ? formatMoney(total, requestCurrency(req)) : '—';
};

export const isAwaitingPayment = (req) =>
  Boolean(req) && req.status === 'pending' && !['paid', 'failed'].includes(req.paymentStatus);
