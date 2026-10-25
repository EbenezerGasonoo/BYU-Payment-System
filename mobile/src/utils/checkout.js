import { Linking } from 'react-native';
import { studentAPI } from '../api/api';

// Opens the hosted checkout for a priced request: Paystack for naira, Hubtel for cedis.
// The payment is confirmed from the Card Status screen (and by Paystack's webhook).
export const openCheckout = async (request, user) => {
  if ((request.currency || 'GHS') === 'NGN') {
    const res = await studentAPI.initializePaystack(request.requestToken);
    if (!res.success || !res.authorizationUrl) throw new Error(res.message || 'Could not open Paystack.');
    await Linking.openURL(res.authorizationUrl);
    return;
  }
  const res = await studentAPI.initiateHubtelPayment({
    paymentReference: request.paymentReference,
    phoneNumber: user?.phone || '',
    studentName: user?.name || 'Student',
    studentEmail: user?.email || '',
  });
  if (!res.success || !res.data?.checkoutUrl) throw new Error(res.message || 'Could not open Hubtel.');
  await Linking.openURL(res.data.checkoutUrl);
};
