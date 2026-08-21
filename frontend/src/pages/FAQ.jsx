import { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import './FAQ.css';

function FAQ() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [openItems, setOpenItems] = useState({ '0-0': true, '1-0': true }); // First questions open by default
  const [toastMessage, setToastMessage] = useState(null);
  const [helpfulVotes, setHelpfulVotes] = useState({});

  const handleVote = (key, isHelpful) => {
    setHelpfulVotes(prev => ({
      ...prev,
      [key]: isHelpful ? 'yes' : 'no'
    }));
    showToast(isHelpful ? 'Thank you for your feedback! 👍' : 'Feedback recorded. Let us know on the Contact page! 📝');
  };

  const rawFaqs = [
    {
      id: 'getting-started',
      category: 'Getting Started',
      icon: '🚀',
      questions: [
        {
          q: 'How do I register for a virtual card?',
          a: 'Go to the Register page, fill in your name, BYU ID, email, and phone number. After registration, you can immediately request a virtual card from the Request Card page.'
        },
        {
          q: 'What information do I need to register?',
          a: 'You need your full name, BYU Student ID (7-8 digits, e.g. 12345678), active @byupathway.edu email address, and Ghana phone / WhatsApp number.'
        },
        {
          q: 'Do I need to pay to register an account?',
          a: 'No! Registration is 100% free. You only pay when requesting and loading a virtual card for your school tuition fees.'
        }
      ]
    },
    {
      id: 'virtual-cards',
      category: 'Virtual Cards',
      icon: '💳',
      questions: [
        {
          q: 'How long does it take to receive my virtual card?',
          a: 'Once submitted, requests are processed by our automated system and verified by the admin team within 2-4 business hours. You receive card details via your registered email.'
        },
        {
          q: 'How long is my virtual card valid?',
          a: 'For security reasons, virtual cards are valid for 4-6 hours once issued. Please complete your tuition payment on the university portal promptly.'
        },
        {
          q: 'What card details will I receive?',
          a: 'You will receive a 16-digit Visa/Mastercard number, expiration date (MM/YY), and 3-digit CVV security code.'
        },
        {
          q: 'Can I request multiple cards at the same time?',
          a: 'Students can have one active card request per payment cycle. Once your card is used or expires, you can request another.'
        }
      ]
    },
    {
      id: 'payment-security',
      category: 'Payment & Security',
      icon: '🔒',
      questions: [
        {
          q: 'Which mobile money networks are supported?',
          a: 'We support all major Ghanaian Mobile Money providers including MTN MoMo, Telecel Cash, and AT Money via Hubtel Direct Debit.'
        },
        {
          q: 'Is this payment system secure?',
          a: 'Yes! ConnectPay uses 256-bit encryption, strict TLS protocols, and direct integration with accredited payment gateways in West Africa.'
        },
        {
          q: 'What happens if my card expires before I make payment?',
          a: 'If your card expires before you use it, simply visit your Student Dashboard and click "Request New Card" or reach out on our live WhatsApp desk.'
        },
        {
          q: 'How do I cancel a pending card request?',
          a: 'You can contact our support desk via live chat or WhatsApp with your Request Token to request an immediate cancellation.'
        }
      ]
    },
    {
      id: 'account-dashboard',
      category: 'Account & Dashboard',
      icon: '📊',
      questions: [
        {
          q: 'How do I check my card request status?',
          a: 'Navigate to the Dashboard page and enter your BYU ID. You will see real-time updates for all pending, active, and completed requests.'
        },
        {
          q: 'I forgot my request token. How can I find it?',
          a: 'No problem! Just enter your BYU Student ID on the Student Dashboard to view all previous tokens and card records linked to your student profile.'
        },
        {
          q: 'Can I update my email or phone number?',
          a: 'For security reasons, account credentials must be verified. If your information has changed, please submit a ticket on the Contact page.'
        }
      ]
    },
    {
      id: 'technical-help',
      category: 'Technical Issues',
      icon: '🛠️',
      questions: [
        {
          q: 'I didn\'t receive my email notification',
          a: 'Check your spam or junk folder. You can also view your active card details directly by entering your BYU ID in the Student Dashboard.'
        },
        {
          q: 'The portal page is not loading properly',
          a: 'Ensure you have an active internet connection. Try doing a hard refresh (Ctrl + F5 or Cmd + Shift + R) or clearing browser cache.'
        },
        {
          q: 'Can I use this on my mobile phone?',
          a: 'Yes! The platform is 100% mobile responsive and can be installed as a Progressive Web App (PWA) on your iOS or Android home screen.'
        }
      ]
    },
    {
      id: 'admin-support',
      category: 'Admin & Operations',
      icon: '👨‍💼',
      questions: [
        {
          q: 'How do administrators access the portal?',
          a: 'Go to the Admin page from the navigation bar and enter your authorized administrator secret key.'
        },
        {
          q: 'How are virtual cards assigned to students?',
          a: 'Admins review pending requests in the Admin Console and generate card details with automated email dispatch.'
        },
        {
          q: 'How does live student chat work for administrators?',
          a: 'Admins receive live real-time notifications via WebSockets whenever a student sends an inquiry through the portal live chat widget.'
        }
      ]
    }
  ];

  // Filter FAQs based on category & search query
  const filteredFaqs = useMemo(() => {
    return rawFaqs
      .filter(category => {
        if (selectedCategory === 'all') return true;
        return category.id === selectedCategory;
      })
      .map(category => {
        if (!searchQuery.trim()) return category;
        const query = searchQuery.toLowerCase();
        const matchedQuestions = category.questions.filter(
          item => item.q.toLowerCase().includes(query) || item.a.toLowerCase().includes(query)
        );
        return {
          ...category,
          questions: matchedQuestions
        };
      })
      .filter(category => category.questions.length > 0);
  }, [rawFaqs, selectedCategory, searchQuery]);

  const totalQuestionCount = useMemo(() => {
    return filteredFaqs.reduce((acc, cat) => acc + cat.questions.length, 0);
  }, [filteredFaqs]);

  const toggleQuestion = (catId, qIndex) => {
    const key = `${catId}-${qIndex}`;
    setOpenItems(prev => ({
      ...prev,
      [key]: !prev[key]
    }));
  };

  const handleExpandAll = () => {
    const newOpenState = {};
    filteredFaqs.forEach((cat, catIdx) => {
      cat.questions.forEach((_, qIdx) => {
        newOpenState[`${cat.id}-${qIdx}`] = true;
      });
    });
    setOpenItems(newOpenState);
  };

  const handleCollapseAll = () => {
    setOpenItems({});
  };

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 2500);
  };

  const handleCopyQuestion = (question, answer) => {
    navigator.clipboard.writeText(`Q: ${question}\nA: ${answer}`);
    showToast('Copied answer to clipboard! 📋');
  };

  return (
    <div className="faq-page-container">
      <div className="container">
        
        {/* Hero Section */}
        <div className="faq-hero">
          <div className="faq-pill-badge">
            <span>💡</span>
            CONNECTPAY KNOWLEDGE BASE
          </div>
          <h1>
            Frequently Asked <span className="highlight-text">Questions</span>
          </h1>
          <p className="subtitle">
            Find answers to common questions about BYU Pathway Ghana virtual cards, mobile money tuition payments, and account setup.
          </p>
        </div>

        {/* Search & Filter Controls */}
        <div className="faq-controls-bar">
          
          {/* Search Input */}
          <div className="faq-search-wrapper">
            <span className="faq-search-icon">🔍</span>
            <input
              type="text"
              className="faq-search-input"
              placeholder="Search by keyword (e.g., virtual card, mobile money, expiration, token)..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            {searchQuery && (
              <button 
                className="faq-clear-search"
                onClick={() => setSearchQuery('')}
                title="Clear search"
              >
                ✕
              </button>
            )}
          </div>

          {/* Category Filter Pills & Controls */}
          <div className="faq-filter-row">
            <div className="faq-category-pills">
              <button
                className={`faq-pill-btn ${selectedCategory === 'all' ? 'active' : ''}`}
                onClick={() => setSelectedCategory('all')}
              >
                <span>🌟</span> All Topics
              </button>
              {rawFaqs.map(cat => (
                <button
                  key={cat.id}
                  className={`faq-pill-btn ${selectedCategory === cat.id ? 'active' : ''}`}
                  onClick={() => setSelectedCategory(cat.id)}
                >
                  <span>{cat.icon}</span> {cat.category}
                </button>
              ))}
            </div>

            <div className="faq-actions-toggle">
              <span style={{ fontSize: '0.82rem', color: 'var(--cp-muted)', fontWeight: '600' }}>
                {totalQuestionCount} {totalQuestionCount === 1 ? 'article' : 'articles'}
              </span>
              <button className="faq-toggle-all-btn" onClick={handleExpandAll}>
                Expand All
              </button>
              <button className="faq-toggle-all-btn" onClick={handleCollapseAll}>
                Collapse All
              </button>
            </div>
          </div>

        </div>

        {/* ============================================================
            MASONRY GRID ARRANGEMENT
            ============================================================ */}
        {filteredFaqs.length === 0 ? (
          <div className="faq-empty-state">
            <div className="faq-empty-icon">🔍</div>
            <h3>No matching questions found</h3>
            <p>We couldn't find any results for "{searchQuery}". Try a different keyword or contact our support team.</p>
            <button 
              className="btn btn-primary"
              onClick={() => { setSearchQuery(''); setSelectedCategory('all'); }}
            >
              Reset Filters
            </button>
          </div>
        ) : (
          <div className="faq-masonry-container">
            {filteredFaqs.map((category) => (
              <div key={category.id} className="faq-masonry-card">
                
                {/* Category Header */}
                <div className="faq-card-header">
                  <div className="faq-card-title-group">
                    <span className="faq-card-icon">{category.icon}</span>
                    <h2>{category.category}</h2>
                  </div>
                  <span className="faq-card-badge">
                    {category.questions.length} Qs
                  </span>
                </div>

                {/* Questions Accordion in this Category */}
                <div className="faq-items-list">
                  {category.questions.map((item, qIdx) => {
                    const isOpen = !!openItems[`${category.id}-${qIdx}`];
                    return (
                      <div 
                        key={qIdx} 
                        className={`faq-item-card ${isOpen ? 'is-open' : ''}`}
                      >
                        <button
                          type="button"
                          className="faq-item-question-btn"
                          onClick={() => toggleQuestion(category.id, qIdx)}
                          aria-expanded={isOpen}
                        >
                          <span>{item.q}</span>
                          <span className="faq-item-toggle-icon">
                            {isOpen ? '−' : '+'}
                          </span>
                        </button>

                        {isOpen && (
                          <div className="faq-item-answer-box">
                            <p>{item.a}</p>
                            <div className="faq-item-footer">
                              <div className="faq-vote-group">
                                <span>Was this helpful?</span>
                                {helpfulVotes[`${category.id}-${qIdx}`] ? (
                                  <span className="faq-voted-badge">
                                    {helpfulVotes[`${category.id}-${qIdx}`] === 'yes' ? '✓ Helpful' : '✓ Recorded'}
                                  </span>
                                ) : (
                                  <div className="faq-vote-btns">
                                    <button
                                      type="button"
                                      className="faq-vote-btn"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        handleVote(`${category.id}-${qIdx}`, true);
                                      }}
                                      title="Yes, this was helpful"
                                    >
                                      👍
                                    </button>
                                    <button
                                      type="button"
                                      className="faq-vote-btn"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        handleVote(`${category.id}-${qIdx}`, false);
                                      }}
                                      title="No, I need more help"
                                    >
                                      👎
                                    </button>
                                  </div>
                                )}
                              </div>
                              <button 
                                type="button"
                                className="faq-copy-link-btn"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleCopyQuestion(item.q, item.a);
                                }}
                              >
                                Copy Answer 📋
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>

              </div>
            ))}
          </div>
        )}

        {/* Bottom CTA Banner */}
        <div className="faq-cta-banner">
          <div className="faq-cta-content">
            <h3>Still need assistance?</h3>
            <p>
              Our dedicated Ghana support team is ready to assist you with virtual cards, fee payments, or login questions.
            </p>
          </div>
          <div className="faq-cta-buttons">
            <Link to="/contact" className="faq-cta-btn-primary">
              Contact Support Desk →
            </Link>
            <a 
              href="https://wa.me/233543692272?text=Hello%20ConnectPay%20Support%2C%20I%20have%20a%20question%20about%20the%20BYU%20Pathway%20Virtual%20Card%20system."
              target="_blank"
              rel="noopener noreferrer"
              className="faq-cta-btn-whatsapp"
            >
              <span>WhatsApp Live Chat</span>
              <span>💬</span>
            </a>
          </div>
        </div>

      </div>

      {/* Floating Toast Alert */}
      {toastMessage && (
        <div className="faq-toast-alert">
          {toastMessage}
        </div>
      )}
    </div>
  );
}

export default FAQ;
