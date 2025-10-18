import { useState } from 'react';

function FAQ() {
  const [openIndex, setOpenIndex] = useState(null);

  const faqs = [
    {
      category: 'Getting Started',
      icon: '🚀',
      questions: [
        {
          q: 'How do I register for a virtual card?',
          a: 'Go to the Register page, fill in your name, BYU ID, email, and phone number. After registration, you can request a virtual card from the Request Card page.'
        },
        {
          q: 'What information do I need to register?',
          a: 'You need your full name, BYU ID (e.g., BYU12345), email address, and phone number. Make sure your email is active as you\'ll receive card details there.'
        },
        {
          q: 'Do I need to pay to register?',
          a: 'No! Registration is completely free. You only specify the amount when requesting a virtual card for school fees.'
        }
      ]
    },
    {
      category: 'Virtual Cards',
      icon: '💳',
      questions: [
        {
          q: 'How long does it take to get my virtual card?',
          a: 'Once you submit a request, the admin is notified immediately. Cards are typically assigned within a few hours during business hours. You\'ll receive an email when your card is ready.'
        },
        {
          q: 'How long is my virtual card valid?',
          a: 'Virtual cards are valid for 4-6 hours after being assigned. This ensures security. If you need more time, you can submit a new request.'
        },
        {
          q: 'What details will I receive?',
          a: 'You\'ll receive the card number, expiry date, and CVV code via email. Use these details to make your payment immediately.'
        },
        {
          q: 'Can I request multiple cards?',
          a: 'You can only have one active request at a time. After your current card is used or expires, you can submit a new request.'
        }
      ]
    },
    {
      category: 'Payment & Security',
      icon: '🔒',
      questions: [
        {
          q: 'Is this system secure?',
          a: 'Yes! This is an educational demo platform. All card numbers are mock/temporary. For real payments, a production system would integrate with actual payment processors with full encryption.'
        },
        {
          q: 'What happens if my card expires before I use it?',
          a: 'You\'ll receive an expiry notification via email. Simply submit a new card request, and the admin will assign a new card.'
        },
        {
          q: 'Can I cancel a request?',
          a: 'Contact support or wait for the admin to process it. Admins can mark requests as declined if needed.'
        }
      ]
    },
    {
      category: 'Account & Dashboard',
      icon: '📊',
      questions: [
        {
          q: 'How do I check my card status?',
          a: 'Go to the Dashboard page and enter your BYU ID. You\'ll see all your requests with their current status (pending, assigned, paid, or expired).'
        },
        {
          q: 'I forgot my request token. What should I do?',
          a: 'No worries! Just go to the Dashboard, enter your BYU ID, and you\'ll see all your requests with their tokens and statuses.'
        },
        {
          q: 'Can I update my registration information?',
          a: 'Currently, you cannot edit your profile. If you need to change your information, please contact support.'
        }
      ]
    },
    {
      category: 'Technical Issues',
      icon: '🛠️',
      questions: [
        {
          q: 'I didn\'t receive an email notification',
          a: 'Check your spam/junk folder. If email notifications are disabled on the server, you can still check your status on the Dashboard.'
        },
        {
          q: 'The website is not loading',
          a: 'Make sure you have a stable internet connection. Try refreshing the page or clearing your browser cache. If the issue persists, contact support.'
        },
        {
          q: 'Can I use this on my mobile phone?',
          a: 'Yes! This platform is fully responsive and works on all devices. You can even install it as an app on your phone for easier access.'
        }
      ]
    },
    {
      category: 'For Admins',
      icon: '👨‍💼',
      questions: [
        {
          q: 'How do I access the admin dashboard?',
          a: 'Go to the Admin page and enter your admin key. Contact the system administrator if you don\'t have the key.'
        },
        {
          q: 'How do I assign a card to a student?',
          a: 'In the admin dashboard, find the pending request and click "Assign Mock Card". The system will generate card details and email the student automatically.'
        },
        {
          q: 'What if I accidentally assign the wrong card?',
          a: 'You can mark the request as expired and the student can submit a new request.'
        }
      ]
    }
  ];

  const toggleQuestion = (categoryIndex, questionIndex) => {
    const index = `${categoryIndex}-${questionIndex}`;
    setOpenIndex(openIndex === index ? null : index);
  };

  return (
    <div className="container">
      <div className="faq-container">
        <div className="faq-header">
          <h1>Frequently Asked Questions</h1>
          <p className="subtitle">Find answers to common questions about the BYU Pathway Ghana Virtual Card system</p>
        </div>

        <div className="faq-categories">
          {faqs.map((category, catIndex) => (
            <div key={catIndex} className="faq-category">
              <h2 className="faq-category-title">
                <span className="faq-category-icon">{category.icon}</span>
                {category.category}
              </h2>
              
              <div className="faq-questions">
                {category.questions.map((item, qIndex) => {
                  const isOpen = openIndex === `${catIndex}-${qIndex}`;
                  return (
                    <div key={qIndex} className={`faq-item ${isOpen ? 'open' : ''}`}>
                      <button
                        className="faq-question"
                        onClick={() => toggleQuestion(catIndex, qIndex)}
                      >
                        <span className="faq-q-text">{item.q}</span>
                        <span className="faq-toggle">{isOpen ? '−' : '+'}</span>
                      </button>
                      {isOpen && (
                        <div className="faq-answer">
                          <p>{item.a}</p>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>

        <div className="faq-contact">
          <div className="faq-contact-card">
            <h3>Still have questions?</h3>
            <p>Can't find what you're looking for? Contact our support team.</p>
            <a href="/contact" className="btn btn-primary">Contact Support</a>
          </div>
        </div>
      </div>
    </div>
  );
}

export default FAQ;



