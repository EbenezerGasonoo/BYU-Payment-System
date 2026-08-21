import { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { studentAPI } from '../api/api';
import { useAuth } from '../utils/AuthContext';
import VirtualCardVisualizer from '../components/VirtualCardVisualizer';
import axios from 'axios';
import './StudentDashboard.css';

function StudentDashboard() {
  const { user } = useAuth();
  const [byuId, setByuId] = useState('');
  const [loading, setLoading] = useState(false);
  const [dashboardData, setDashboardData] = useState(null);
  const [error, setError] = useState('');
  const [activeFilter, setActiveFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [toastMsg, setToastMsg] = useState('');
  const [liveGhsRate, setLiveGhsRate] = useState(15.50);

  // Auto-fetch exchange rate
  useEffect(() => {
    fetch('https://open.er-api.com/v6/latest/USD')
      .then(res => res.json())
      .then(data => {
        if (data?.rates?.GHS) setLiveGhsRate(data.rates.GHS);
      })
      .catch(() => {});
  }, []);

  const showToast = (msg) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(''), 2500);
  };

  const fetchDashboard = async (idToFetch) => {
    const id = idToFetch || byuId;
    if (!id) return;
    setLoading(true);
    setError('');
    try {
      const response = await studentAPI.getDashboard(id.trim());
      setDashboardData(response.data);
      localStorage.setItem('hasViewedDashboard', 'true');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load your BYU-Pathway student dashboard');
    } finally {
      setLoading(false);
    }
  };

  // Auto-load on mount when user session or localStorage has BYU ID
  useEffect(() => {
    const targetId = user?.byuId || localStorage.getItem('userByuId');
    if (targetId) {
      setByuId(targetId);
      fetchDashboard(targetId);
    }
  }, [user]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    fetchDashboard(byuId);
  };

  const handleFreezeToggle = async (requestId) => {
    try {
      const response = await axios.post(`/api/students/cards/${requestId}/freeze`);
      if (response.data?.success) {
        setDashboardData(prev => {
          if (!prev) return prev;
          const updated = prev.cardRequests.map(req => {
            if (req.id === requestId || req._id === String(requestId)) {
              return { ...req, cardStatus: response.data.cardStatus };
            }
            return req;
          });
          return { ...prev, cardRequests: updated };
        });
        showToast(response.data.cardStatus === 'frozen' ? '❄️ Card frozen' : '⚡ Card un-frozen');
      }
    } catch (err) {
      showToast('❌ Failed to toggle card status');
    }
  };

  const copyToClipboard = (text, label) => {
    navigator.clipboard.writeText(text);
    showToast(`✓ Copied ${label || 'to clipboard'}!`);
  };

  const formatDate = (date) => {
    if (!date) return 'N/A';
    return new Date(date).toLocaleString(undefined, {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // ── Metrics Calculation ──
  const cardRequests = dashboardData?.cardRequests || [];
  const activeCards  = cardRequests.filter(r => r.status === 'assigned');
  const paidCards    = cardRequests.filter(r => r.status === 'paid');
  const pendingCards = cardRequests.filter(r => r.status === 'pending');

  const totalPaidUsd = paidCards.reduce((sum, r) => sum + (Number(r.amount) || 0), 0);
  const totalPaidGhs = paidCards.reduce((sum, r) => sum + (Number(r.totalPaidGHS) || Number(r.amount) * liveGhsRate), 0);

  // ── Filtered Transactions ──
  const filteredTransactions = useMemo(() => {
    let list = cardRequests;
    if (activeFilter !== 'all') {
      list = list.filter(r => r.status === activeFilter);
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      list = list.filter(r =>
        (r.requestToken && r.requestToken.toLowerCase().includes(q)) ||
        (r.amount && String(r.amount).includes(q)) ||
        (r.paymentMethod && r.paymentMethod.toLowerCase().includes(q))
      );
    }
    return list;
  }, [cardRequests, activeFilter, searchQuery]);

  const latestActiveCard = activeCards.length > 0 ? activeCards[0] : null;

  return (
    <div className="student-dashboard-wrapper">
      <div className="container">

        {/* ── Toast Notification ── */}
        {toastMsg && <div className="sd-toast">{toastMsg}</div>}

        {/* ── Top Profile / Welcome Header ── */}
        <div className="sd-header-card">
          <div className="sd-header-mesh" aria-hidden="true"></div>
          <div className="sd-header-content">
            <div className="sd-profile-info">
              <div className="sd-avatar">
                {dashboardData?.student?.name ? dashboardData.student.name.charAt(0).toUpperCase() : (user?.name?.charAt(0) || '🎓')}
              </div>
              <div className="sd-profile-details">
                <h1>
                  Welcome, {dashboardData?.student?.name || user?.name || 'BYU Student'} 👋
                </h1>
                <div className="sd-badges-row">
                  <span
                    className="sd-id-badge"
                    onClick={() => copyToClipboard(byuId, 'BYU ID')}
                    title="Click to copy BYU ID"
                  >
                    🆔 {byuId || 'No BYU ID'} 📋
                  </span>
                  <span className="sd-status-pill">
                    🟢 Enrolled Student • 🇬🇭 Ghana
                  </span>
                  {dashboardData?.student?.email && (
                    <span style={{ fontSize: '0.82rem', opacity: 0.85, color: '#e2e8f0' }}>
                      ✉️ {dashboardData.student.email}
                    </span>
                  )}
                </div>
              </div>
            </div>

            <div className="sd-header-actions">
              <Link to="/request" className="sd-btn-request" id="dash-request-card-btn">
                💳 Request Virtual Card →
              </Link>
              <button
                className="sd-btn-sync"
                onClick={() => fetchDashboard(byuId)}
                disabled={loading}
                title="Refresh student records from database"
              >
                {loading ? '⏳ Syncing…' : '🔄 Refresh'}
              </button>
            </div>
          </div>
        </div>

        {/* ── Manual Search Bar if BYU ID is missing or student wants to look up another ID ── */}
        {!dashboardData && !loading && (
          <div className="sd-section-card" style={{ marginBottom: '2rem', textAlign: 'center' }}>
            <h2 style={{ color: '#002E5D', marginBottom: '0.5rem' }}>Lookup Your Student Account</h2>
            <p style={{ color: '#64748b', marginBottom: '1.25rem' }}>Enter your BYU Student ID to load your active cards and fee history.</p>
            <form onSubmit={handleSearchSubmit} style={{ display: 'flex', gap: '0.75rem', maxWidth: 460, margin: '0 auto' }}>
              <input
                type="text"
                value={byuId}
                onChange={(e) => setByuId(e.target.value)}
                placeholder="Enter BYU ID (e.g. 123456789)"
                className="bento-input"
                style={{ flex: 1, padding: '0.85rem 1rem', borderRadius: 12, border: '1.5px solid #cbd5e1' }}
                required
              />
              <button type="submit" className="sd-btn-request" disabled={loading}>
                {loading ? 'Loading…' : 'Load Dashboard'}
              </button>
            </form>
          </div>
        )}

        {error && (
          <div className="alert alert-error" style={{ marginBottom: '1.5rem', borderRadius: 14 }}>
            ⚠️ {error}
          </div>
        )}

        {/* ── 4 KPI Metric Cards ── */}
        <div className="sd-kpi-grid">
          <div className="sd-kpi-card">
            <div className="sd-kpi-icon-box gold">💳</div>
            <div className="sd-kpi-info">
              <span className="sd-kpi-label">Active Virtual Cards</span>
              <span className="sd-kpi-value">{activeCards.length}</span>
              <span className="sd-kpi-sub">Ready to spend on BYU Portal</span>
            </div>
          </div>

          <div className="sd-kpi-card">
            <div className="sd-kpi-icon-box green">💰</div>
            <div className="sd-kpi-info">
              <span className="sd-kpi-label">Total Tuition Paid</span>
              <span className="sd-kpi-value">${totalPaidUsd.toFixed(2)}</span>
              <span className="sd-kpi-sub">≈ GH₵ {totalPaidGhs.toFixed(2)}</span>
            </div>
          </div>

          <div className="sd-kpi-card">
            <div className="sd-kpi-icon-box purple">⏳</div>
            <div className="sd-kpi-info">
              <span className="sd-kpi-label">Pending Requests</span>
              <span className="sd-kpi-value">{pendingCards.length}</span>
              <span className="sd-kpi-sub">In verification / processing</span>
            </div>
          </div>

          <div className="sd-kpi-card">
            <div className="sd-kpi-icon-box blue">📈</div>
            <div className="sd-kpi-info">
              <span className="sd-kpi-label">Live Tuition FX Rate</span>
              <span className="sd-kpi-value">GH₵ {liveGhsRate.toFixed(2)}</span>
              <span className="sd-kpi-sub">1 USD = 0% international fee</span>
            </div>
          </div>
        </div>

        {/* ── Main 2-Column Section: Active Card Spotlight + BYU Portal Guide ── */}
        <div className="sd-main-grid">

          {/* Left Column: Active Virtual Card Showcase */}
          <div className="sd-section-card">
            <div className="sd-section-header">
              <h2 className="sd-section-title">
                <span>💳</span> Active Virtual Tuition Card
              </h2>
              {latestActiveCard && (
                <span className="sd-badge active">● Live Card Active</span>
              )}
            </div>

            {latestActiveCard ? (
              <div className="sd-active-card-container">
                <div className="sd-card-timer-banner">
                  <span>⏰ Active Visa Card Valid</span>
                  <span>Expires: {formatDate(latestActiveCard.expiresAt)}</span>
                </div>

                <VirtualCardVisualizer
                  cardNumber={latestActiveCard.virtualCardNumber}
                  cardholderName={latestActiveCard.cardholderName || dashboardData?.student?.name || 'BYU STUDENT'}
                  expiryDate={latestActiveCard.cardExpiryDate}
                  cvv={latestActiveCard.cardCVV}
                  amountUsd={latestActiveCard.amount}
                  cardStatus={latestActiveCard.cardStatus || 'active'}
                  onFreezeToggle={() => handleFreezeToggle(latestActiveCard.id || latestActiveCard._id)}
                />

                {/* 1-Click Credential Copy Buttons */}
                <div className="sd-card-quick-actions">
                  <button
                    type="button"
                    className="sd-quick-copy-btn"
                    onClick={() => copyToClipboard(latestActiveCard.virtualCardNumber, 'Card Number')}
                  >
                    <span>📋 Number</span>
                    <small>Copy 16 Digits</small>
                  </button>
                  <button
                    type="button"
                    className="sd-quick-copy-btn"
                    onClick={() => copyToClipboard(latestActiveCard.cardExpiryDate, 'Expiry Date')}
                  >
                    <span>📅 Expiry</span>
                    <small>{latestActiveCard.cardExpiryDate}</small>
                  </button>
                  <button
                    type="button"
                    className="sd-quick-copy-btn"
                    onClick={() => copyToClipboard(latestActiveCard.cardCVV, 'CVV')}
                  >
                    <span>🔒 CVV</span>
                    <small>Copy 3 Digits</small>
                  </button>
                </div>

                <a
                  href="https://my.byupathway.edu"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="sd-byu-portal-link"
                >
                  Open BYU-Pathway Student Portal ↗
                </a>
              </div>
            ) : (
              <div className="sd-no-card-box">
                <div className="sd-no-card-icon">💳</div>
                <h3>No Active Virtual Card</h3>
                <p>
                  You don't currently have an active USD card. Generate a dedicated Virtual Visa card in minutes using your Ghana Mobile Money wallet.
                </p>
                <Link to="/request" className="sd-btn-request" style={{ display: 'inline-flex', margin: '0 auto' }}>
                  ⚡ Request Virtual Card Now
                </Link>
              </div>
            )}
          </div>

          {/* Right Column: Step-by-Step Settlement Guide */}
          <div className="sd-section-card">
            <div className="sd-section-header">
              <h2 className="sd-section-title">
                <span>🎓</span> How to Settle Tuition Fees
              </h2>
              <span className="sd-badge paid">4 Easy Steps</span>
            </div>

            <div className="sd-guide-list">
              <div className="sd-guide-item">
                <div className="sd-guide-num">1</div>
                <div className="sd-guide-text">
                  <h4>Copy Your Virtual Card</h4>
                  <p>Use the 1-click copy buttons on your active Visa card above.</p>
                </div>
              </div>

              <div className="sd-guide-item">
                <div className="sd-guide-num">2</div>
                <div className="sd-guide-text">
                  <h4>Log into BYU Portal</h4>
                  <p>Visit <strong>my.byupathway.edu</strong> ➔ Finances ➔ Make a Payment.</p>
                </div>
              </div>

              <div className="sd-guide-item">
                <div className="sd-guide-num">3</div>
                <div className="sd-guide-text">
                  <h4>Choose Debit/Credit Card</h4>
                  <p>Select Visa and paste the cardholder name, 16-digit card number, expiry, and CVV.</p>
                </div>
              </div>

              <div className="sd-guide-item">
                <div className="sd-guide-num">4</div>
                <div className="sd-guide-text">
                  <h4>Instant Confirmation</h4>
                  <p>Your BYU enrollment fee updates immediately with 0% foreign transaction markups.</p>
                </div>
              </div>
            </div>

            {/* Support Desk callout */}
            <div style={{ marginTop: '1.25rem', padding: '1rem', background: 'rgba(0, 46, 93, 0.05)', borderRadius: 14, border: '1px solid rgba(0, 46, 93, 0.12)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.35rem' }}>
                <span style={{ fontSize: '1.1rem' }}>💬</span>
                <strong style={{ color: '#002E5D', fontSize: '0.9rem' }}>Need Help Paying?</strong>
              </div>
              <p style={{ fontSize: '0.8rem', color: '#64748b', margin: '0 0 0.75rem 0' }}>
                Our student support desk in Accra is available via WhatsApp to guide your payment.
              </p>
              <Link to="/contact" style={{ fontSize: '0.82rem', fontWeight: 800, color: '#002E5D', textDecoration: 'none' }}>
                Open Support Desk →
              </Link>
            </div>
          </div>

        </div>

        {/* ── Transactions & Card Requests History ── */}
        <div className="sd-history-card">
          <div className="sd-section-header" style={{ flexWrap: 'wrap', gap: '1rem' }}>
            <div>
              <h2 className="sd-section-title">
                <span>📋</span> Card Request &amp; Payment History
              </h2>
              <p style={{ fontSize: '0.85rem', color: '#64748b', margin: '0.2rem 0 0 0' }}>
                All virtual card orders generated for this student account
              </p>
            </div>

            {/* Search Input */}
            <input
              type="text"
              placeholder="Search by token, amount..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{
                padding: '0.55rem 0.95rem',
                borderRadius: 10,
                border: '1px solid #cbd5e1',
                fontSize: '0.85rem',
                minWidth: 220
              }}
            />
          </div>

          {/* Filter Pills */}
          <div className="sd-filter-tabs">
            <button
              className={`sd-filter-tab ${activeFilter === 'all' ? 'active' : ''}`}
              onClick={() => setActiveFilter('all')}
            >
              All ({cardRequests.length})
            </button>
            <button
              className={`sd-filter-tab ${activeFilter === 'assigned' ? 'active' : ''}`}
              onClick={() => setActiveFilter('assigned')}
            >
              Active Cards ({activeCards.length})
            </button>
            <button
              className={`sd-filter-tab ${activeFilter === 'paid' ? 'active' : ''}`}
              onClick={() => setActiveFilter('paid')}
            >
              Settled / Paid ({paidCards.length})
            </button>
            <button
              className={`sd-filter-tab ${activeFilter === 'pending' ? 'active' : ''}`}
              onClick={() => setActiveFilter('pending')}
            >
              Pending ({pendingCards.length})
            </button>
          </div>

          {/* Table */}
          <div className="sd-table-container">
            {filteredTransactions.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '3rem 1rem', color: '#94a3b8' }}>
                <div style={{ fontSize: '2.5rem', marginBottom: '0.5rem' }}>📭</div>
                <p style={{ fontWeight: 600 }}>No transactions found {searchQuery ? `matching "${searchQuery}"` : ''}.</p>
              </div>
            ) : (
              <table className="sd-table">
                <thead>
                  <tr>
                    <th>Request Token</th>
                    <th>USD Amount</th>
                    <th>Local Amount (GHS)</th>
                    <th>Payment Method</th>
                    <th>Status</th>
                    <th>Created Date</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredTransactions.map((req) => (
                    <tr key={req._id || req.id}>
                      <td>
                        <span
                          className="sd-token-code"
                          onClick={() => copyToClipboard(req.requestToken, 'Request Token')}
                          title="Click to copy token"
                        >
                          {req.requestToken || 'N/A'} 📋
                        </span>
                      </td>
                      <td style={{ fontWeight: 800, color: '#002E5D' }}>
                        ${parseFloat(req.amount || 0).toFixed(2)} USD
                      </td>
                      <td style={{ fontWeight: 700, color: '#475569' }}>
                        GH₵ {parseFloat(req.totalPaidGHS || (req.amount * liveGhsRate) || 0).toFixed(2)}
                      </td>
                      <td>
                        <span style={{ fontSize: '0.82rem', textTransform: 'capitalize' }}>
                          📱 {req.paymentMethod ? req.paymentMethod.replace('_', ' ') : 'Mobile Money'}
                        </span>
                      </td>
                      <td>
                        <span className={`sd-badge ${req.status}`}>
                          {req.status === 'assigned' ? '● Active' : req.status}
                        </span>
                      </td>
                      <td style={{ fontSize: '0.82rem', color: '#64748b' }}>
                        {formatDate(req.createdAt)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}

export default StudentDashboard;
