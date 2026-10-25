import { Link } from 'react-router-dom';
import { SERVICE, SUPPORT } from '../utils/siteInfo';

const GROUPS = [
  {
    title: 'Getting started',
    items: [
      {
        q: 'Who can use ConnectPay?',
        a: [
          'BYU-Pathway students in Ghana or Nigeria with a BYU Student ID and an active @byupathway.edu email address.',
          `In Ghana you pay in cedis by Mobile Money. In Nigeria you pay in naira through Paystack by ${SERVICE.nigeriaMethods.join(', ')}. More countries are coming.`
        ]
      },
      {
        q: 'How do I create an account?',
        a: [
          'Go to Create account and enter your name, country, BYU Student ID, phone number, Pathway email and a password.',
          'We email a confirmation link to your Pathway address. You need to confirm it before you can request a card.'
        ]
      },
      {
        q: 'I had an account before passwords were added. How do I sign in?',
        a: [
          'Use Forgot password with your BYU Student ID or Pathway email. We email you a 6-digit code, and you can then choose a password.'
        ]
      },
      {
        q: 'Does it cost anything to sign up?',
        a: ['No. You only pay when you request a card: the card amount plus the service fee.']
      }
    ]
  },
  {
    title: 'Paying and fees',
    items: [
      {
        q: 'How much does it cost?',
        a: [
          `A ${SERVICE.feePercent}% service fee on top of the card amount. For a $150 card, you pay the cedi or naira value of $150 plus ${SERVICE.feePercent}%.`,
          'The total in your currency is shown before you pay. There are no other charges.'
        ]
      },
      {
        q: 'Which exchange rate do you use?',
        a: ['The market USD to GHS (Ghana) or USD to NGN (Nigeria) rate at the moment you submit your request. The amount is then fixed for that request.']
      },
      {
        q: 'How can I pay?',
        a: [
          `In Ghana: ${SERVICE.networks.join(', ')}. Payments go through Hubtel, and you approve the prompt on your phone.`,
          `In Nigeria: ${SERVICE.nigeriaMethods.join(', ')} through Paystack. You pay on the Paystack page and are brought back to ConnectPay.`
        ]
      },
      {
        q: 'What amount should I request?',
        a: ['The exact amount shown in USD on your BYU-Pathway payment page. The card is loaded with that amount only.']
      }
    ]
  },
  {
    title: 'Your card',
    items: [
      {
        q: 'How long does it take to get my card?',
        a: [
          `Usually ${SERVICE.processingTime} after your payment is confirmed, during support hours (${SUPPORT.hours}).`,
          'You can follow the status in your dashboard.'
        ]
      },
      {
        q: 'Where do I find the card details?',
        a: ['In your dashboard after you sign in, and in an email to your Pathway address. You get the card number, expiry date and CVV.']
      },
      {
        q: 'How long is the card valid?',
        a: [
          `${SERVICE.cardValidity} after it is issued. This protects the balance from being used by anyone else.`,
          'Request your card when you are ready to pay, with your BYU-Pathway payment page open.'
        ]
      },
      {
        q: 'My card expired before I used it. What now?',
        a: [
          `Message support on WhatsApp (${SUPPORT.whatsappDisplay}) straight away with your request reference from the dashboard.`
        ]
      },
      {
        q: 'Can I have more than one card at a time?',
        a: ['No. You can have one open request at a time. Once a card is used or expires, you can request another.']
      }
    ]
  },
  {
    title: 'Account and problems',
    items: [
      {
        q: 'I did not get an email from ConnectPay.',
        a: [
          'Check the spam or junk folder of your Pathway inbox. Card details are also shown in your dashboard.',
          'If you still cannot find it, contact support.'
        ]
      },
      {
        q: 'How do I change my email or phone number?',
        a: ['Contact support from the Contact page. We confirm your identity before changing account details.']
      },
      {
        q: 'Is ConnectPay part of BYU-Pathway?',
        a: [
          'No. ConnectPay is an independent service that helps students in Ghana and Nigeria pay BYU-Pathway fees. It is not affiliated with or endorsed by BYU-Pathway Worldwide.'
        ]
      }
    ]
  }
];

function FAQ() {
  return (
    <>
      <div className="cp-pagehead">
        <div className="cp-container">
          <span className="cp-eyebrow">Help</span>
          <h1 className="cp-h1">Frequently asked questions</h1>
          <p className="cp-lead">
            Can't find your answer? <Link to="/contact">Contact support</Link> or message us on{' '}
            <a href={SUPPORT.whatsappUrl} target="_blank" rel="noopener noreferrer">WhatsApp</a>.
          </p>
        </div>
      </div>

      <section className="cp-section--tight" style={{ paddingTop: 8, paddingBottom: 80 }}>
        <div className="cp-container" style={{ maxWidth: 820 }}>
          {GROUPS.map((group) => (
            <div key={group.title} className="cp-faq__group">
              <h2 className="cp-h3">{group.title}</h2>
              <div className="cp-faq">
                {group.items.map((item) => (
                  <details key={item.q}>
                    <summary>{item.q}</summary>
                    <div>{item.a.map((para) => <p key={para}>{para}</p>)}</div>
                  </details>
                ))}
              </div>
            </div>
          ))}
        </div>
      </section>
    </>
  );
}

export default FAQ;
