import { useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { adminAPI } from '../api/api';
import { useAdminAuth } from '../utils/AdminAuthContext';
import { useImpersonation } from '../utils/ImpersonationContext';
import { useAuth } from '../utils/AuthContext';
import AdminChat from '../components/AdminChat';
import './AdminDashboard.css';

// West Africa country reference
const WEST_AFRICA_COUNTRIES = {
  GH: { name: 'Ghana',        flag: '🇬🇭', currency: 'GHS' },
  NG: { name: 'Nigeria',      flag: '🇳🇬', currency: 'NGN' },
  SN: { name: 'Senegal',      flag: '🇸🇳', currency: 'XOF' },
  CI: { name: 'Ivory Coast',  flag: '🇨🇮', currency: 'XOF' },
  CM: { name: 'Cameroon',     flag: '🇨🇲', currency: 'XAF' },
  TG: { name: 'Togo',         flag: '🇹🇬', currency: 'XOF' },
  BJ: { name: 'Benin',        flag: '🇧🇯', currency: 'XOF' },
  SL: { name: 'Sierra Leone', flag: '🇸🇱', currency: 'SLL' },
  LR: { name: 'Liberia',      flag: '🇱🇷', currency: 'LRD' },
  GM: { name: 'Gambia',       flag: '🇬🇲', currency: 'GMD' },
};

const countryLabel = (code) => {
  const c = WEST_AFRICA_COUNTRIES[code];
  return c ? `${c.flag} ${c.name}` : (code || '🌍 Unknown');
};

function AdminDashboard() {
  const { isAdmin, adminKey, adminLogout } = useAdminAuth();
  const { impersonate } = useImpersonation();
  const { login: studentLogin } = useAuth();
  const navigate = useNavigate();

  const [requests, setRequests] = useState([]);
  const [stats, setStats] = useState(null);
  const [countryStats, setCountryStats] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [filter, setFilter] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState('dashboard');
  const [users, setUsers] = useState([]);
  const [userFilter, setUserFilter] = useState('active');
  const [countryFilter, setCountryFilter] = useState('all');
  const [autoRefresh, setAutoRefresh] = useState(false);
  const [copiedId, setCopiedId] = useState(null);

  // Create Student Modal
  const [showCreateStudentModal, setShowCreateStudentModal] = useState(false);
  const [createStudentForm, setCreateStudentForm] = useState({
    name: '', byuId: '', email: '', phone: '', countryCode: 'GH', whatsappNumber: ''
  });
  const [createStudentLoading, setCreateStudentLoading] = useState(false);
  const [createStudentResult, setCreateStudentResult] = useState(null);

  // Manual card assignment modal
  const [showCardForm, setShowCardForm] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [cardDetails, setCardDetails] = useState({
    cardNumber: '',
    cardholderName: '',
    expiryDate: '',
    cvv: ''
  });

  const loadDashboard = useCallback(async () => {
    if (!adminKey) return;
    setLoading(true);
    setError('');
    try {
      const [requestsData, statsData, countryData] = await Promise.all([
        adminAPI.getRequests(adminKey, filter),
        adminAPI.getStats(adminKey),
        adminAPI.getCountryStats(adminKey)
      ]);
      setRequests(requestsData.data || []);
      setStats(statsData.data || null);
      setCountryStats(countryData.data || []);
    } catch (err) {
      const errorMessage = err.response?.data?.message || 'Failed to load dashboard data';
      setError(errorMessage);
      if (err.response?.status === 403) {
        adminLogout();
        navigate('/admin/login');
      }
    } finally {
      setLoading(false);
    }
  }, [adminKey, filter, adminLogout, navigate]);

  const loadUsers = useCallback(async () => {
    if (!adminKey) return;
    setLoading(true);
    try {
      const usersData = await adminAPI.getUsers(adminKey, userFilter === 'deleted' ? 'deleted' : '');
      setUsers(usersData.data || []);
    } catch (err) {
      console.error('Failed to load users:', err);
    } finally {
      setLoading(false);
    }
  }, [adminKey, userFilter]);

  // Redirect to login if not authenticated as admin
  useEffect(() => {
    if (!isAdmin) {
      navigate('/admin/login', { replace: true });
    }
  }, [isAdmin, navigate]);

  useEffect(() => {
    if (isAdmin && adminKey) {
      if (activeTab === 'users') {
        loadUsers();
      } else {
        loadDashboard();
      }
    }
  }, [filter, isAdmin, adminKey, activeTab, userFilter, loadDashboard, loadUsers]);

  // Auto-refresh interval (30s)
  useEffect(() => {
    if (!autoRefresh || !isAdmin) return;
    const interval = setInterval(() => {
      if (activeTab === 'users') {
        loadUsers();
      } else {
        loadDashboard();
      }
    }, 30000);
    return () => clearInterval(interval);
  }, [autoRefresh, isAdmin, activeTab, loadDashboard, loadUsers]);

  const filteredRequests = useMemo(() => {
    if (!searchQuery.trim()) return requests;
    const q = searchQuery.toLowerCase().trim();
    return requests.filter((r) => {
      const name = r.student?.name?.toLowerCase() || '';
      const byuId = r.student?.byuId?.toLowerCase() || '';
      const email = r.student?.email?.toLowerCase() || '';
      const token = r.requestToken?.toLowerCase() || '';
      return name.includes(q) || byuId.includes(q) || email.includes(q) || token.includes(q);
    });
  }, [requests, searchQuery]);

  const filteredUsers = useMemo(() => {
    let list = users;
    if (countryFilter !== 'all') {
      list = list.filter(u => (u.countryCode || 'GH') === countryFilter);
    }
    if (!searchQuery.trim()) return list;
    const q = searchQuery.toLowerCase().trim();
    return list.filter((u) => {
      const name = u.name?.toLowerCase() || '';
      const byuId = u.byuId?.toLowerCase() || '';
      const email = u.email?.toLowerCase() || '';
      const phone = u.phone?.toLowerCase() || '';
      return name.includes(q) || byuId.includes(q) || email.includes(q) || phone.includes(q);
    });
  }, [users, searchQuery, countryFilter]);

  const copyToClipboard = (text, id) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const exportRequestsToCSV = () => {
    if (!filteredRequests.length) return;
    const headers = ['Student Name', 'BYU ID', 'Email', 'Amount USD', 'Total Paid GHS', 'Payment Method', 'Payment Status', 'Card Status', 'Request Token', 'Date'];
    const rows = filteredRequests.map(r => [
      `"${r.student?.name || ''}"`,
      `"${r.student?.byuId || ''}"`,
      `"${r.student?.email || ''}"`,
      r.amount || 0,
      r.totalPaidGHS || 0,
      `"${r.paymentMethod || ''}"`,
      `"${r.paymentStatus || ''}"`,
      `"${r.status || ''}"`,
      `"${r.requestToken || ''}"`,
      `"${new Date(r.createdAt).toLocaleString()}"`
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const link = document.createElement('a');
    link.setAttribute('href', encodeURI(csvContent));
    link.setAttribute('download', `card_requests_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const exportUsersToCSV = () => {
    if (!filteredUsers.length) return;
    const headers = ['Full Name', 'BYU ID', 'Email', 'Phone', 'Status', 'Registration Date'];
    const rows = filteredUsers.map(u => [
      `"${u.name || ''}"`,
      `"${u.byuId || ''}"`,
      `"${u.email || ''}"`,
      `"${u.phone || ''}"`,
      `"${u.status || 'active'}"`,
      `"${new Date(u.createdAt).toLocaleString()}"`
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const link = document.createElement('a');
    link.setAttribute('href', encodeURI(csvContent));
    link.setAttribute('download', `students_${userFilter}_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleAssignMock = async (requestId) => {
    if (!window.confirm('Assign a mock card to this request?')) return;
    try {
      await adminAPI.assignMockCard(adminKey, requestId);
      alert('Mock card assigned successfully!');
      await loadDashboard();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to assign card');
    }
  };

  const openCardForm = (request) => {
    setSelectedRequest(request);
    setCardDetails({
      cardNumber: '',
      cardholderName: request.student?.name?.toUpperCase() || 'STUDENT NAME',
      expiryDate: '',
      cvv: ''
    });
    setShowCardForm(true);
  };

  const closeCardForm = () => {
    setShowCardForm(false);
    setSelectedRequest(null);
    setCardDetails({ cardNumber: '', cardholderName: '', expiryDate: '', cvv: '' });
  };

  const handleManualAssign = async (e) => {
    e.preventDefault();
    if (!cardDetails.cardNumber || !cardDetails.cardholderName || !cardDetails.expiryDate || !cardDetails.cvv) {
      alert('All card details are required');
      return;
    }
    try {
      await adminAPI.assignCard(adminKey, {
        requestId: selectedRequest._id || selectedRequest.id,
        ...cardDetails
      });
      alert('Card assigned successfully!');
      closeCardForm();
      await loadDashboard();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to assign card');
    }
  };

  const handleAction = async (requestId, action) => {
    if (!window.confirm(`Mark this request as ${action}?`)) return;
    try {
      await adminAPI.updateAction(adminKey, { requestId, action });
      alert(`Request marked as ${action}!`);
      await loadDashboard();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to update status');
    }
  };

  const handleDeleteUser = async (userId) => {
    if (!window.confirm('Delete this user? They will be moved to Deleted Users.')) return;
    try {
      await adminAPI.deleteUser(adminKey, userId);
      alert('User deleted');
      loadUsers();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to delete user');
    }
  };

  const handleRestoreUser = async (userId) => {
    if (!window.confirm('Restore this user account?')) return;
    try {
      await adminAPI.restoreUser(adminKey, userId);
      alert('User restored');
      loadUsers();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to restore user');
    }
  };

  // ── Impersonation: inject student into AuthContext then navigate ──
  const handleImpersonate = (student) => {
    impersonate(student);
    studentLogin({ byuId: student.byuId, name: student.name, email: student.email || '' });
    navigate('/dashboard');
  };

  const handleLogout = () => {
    adminLogout();
    navigate('/admin/login');
  };

  const handleCreateStudent = async (e) => {
    e.preventDefault();
    setCreateStudentLoading(true);
    setCreateStudentResult(null);
    try {
      const result = await adminAPI.createStudent(adminKey, createStudentForm);
      setCreateStudentResult({ success: true, tempPassword: result.data?.tempPassword, name: result.data?.name });
      setCreateStudentForm({ name: '', byuId: '', email: '', phone: '', countryCode: 'GH', whatsappNumber: '' });
      await loadUsers();
    } catch (err) {
      setCreateStudentResult({ success: false, message: err.response?.data?.message || 'Failed to create student' });
    } finally {
      setCreateStudentLoading(false);
    }
  };

  const closeCreateStudentModal = () => {
    setShowCreateStudentModal(false);
    setCreateStudentResult(null);
    setCreateStudentForm({ name: '', byuId: '', email: '', phone: '', countryCode: 'GH', whatsappNumber: '' });
  };

  const getStatusBadge = (status) => {
    const badges = {
      pending: 'bento-badge-amber',
      assigned: 'bento-badge-emerald',
      paid: 'bento-badge-indigo',
      expired: 'bento-badge-rose',
      declined: 'bento-badge-rose'
    };
    return badges[status] || 'bento-badge-gray';
  };

  const formatDate = (date) => {
    return new Date(date).toLocaleString(undefined, {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Redirect handled by useEffect above — show loading while redirecting
  if (!isAdmin) return null;

  // ── Real metrics from API ──
  const totalVolume = stats?.totalRevenue ?? 0;
  const totalStudents = stats?.totalStudents ?? 0;
  const totalRequests = stats?.totalRequests ?? 0;
  const paidCount = stats?.paidRequests ?? 0;
  const assignedCount = stats?.assignedRequests ?? 0;
  const pendingCount = stats?.pendingRequests ?? 0;
  const expiredCount = stats?.expiredRequests ?? 0;

  // Expenses estimated as sum of assigned card fees ($45 processing each)
  const totalExpenses = assignedCount * 45 + paidCount * 10;

  // Gauge rates (real percentages, 0 when no data)
  const issuanceRate = totalRequests > 0 ? Math.round((assignedCount / totalRequests) * 100) : 0;
  const settlementRate = totalRequests > 0 ? Math.round((paidCount / totalRequests) * 100) : 0;
  const pendingRate = totalRequests > 0 ? Math.round((pendingCount / totalRequests) * 100) : 0;

  // Donut circumference = 2πr = 2π×38 ≈ 238.76; scale each segment
  const CIRC = 238.76;
  const paidSeg   = totalRequests > 0 ? Math.round((paidCount / totalRequests) * CIRC) : 0;
  const assignSeg = totalRequests > 0 ? Math.round((assignedCount / totalRequests) * CIRC) : 0;
  const pendSeg   = totalRequests > 0 ? Math.round((pendingCount / totalRequests) * CIRC) : 0;
  const expSeg    = totalRequests > 0 ? Math.round((expiredCount / totalRequests) * CIRC) : 0;

  const paidOff   = 0;
  const assignOff = -(paidSeg);
  const pendOff   = -(paidSeg + assignSeg);
  const expOff    = -(paidSeg + assignSeg + pendSeg);

  const paidPct   = totalRequests > 0 ? Math.round((paidCount / totalRequests) * 100) : 0;
  const assignPct = totalRequests > 0 ? Math.round((assignedCount / totalRequests) * 100) : 0;
  const pendPct   = totalRequests > 0 ? Math.round((pendingCount / totalRequests) * 100) : 0;
  const expPct    = totalRequests > 0 ? Math.round((expiredCount / totalRequests) * 100) : 0;

  // Active virtual card balance estimate = assigned requests × avg $250
  const activeCardBalance = assignedCount * 250;

  // Wave chart tooltip value = total revenue
  const waveTooltipValue = `$${totalVolume.toLocaleString()}`;

  return (
    <div className="bento-app-container">
      {/* ── Left Sidebar Navigation ── */}
      <aside className="bento-sidebar">
        <div className="bento-sidebar-brand">
          <div className="brand-icon">⚡</div>
          <span className="brand-title">ConnectPay</span>
          <span className="brand-sub">Admin</span>
        </div>

        <nav className="bento-sidebar-nav">
          <button
            className={`nav-item ${activeTab === 'dashboard' ? 'active' : ''}`}
            onClick={() => setActiveTab('dashboard')}
          >
            <span className="nav-icon">📊</span>
            <span className="nav-text">Dashboard</span>
          </button>

          <button
            className={`nav-item ${activeTab === 'requests' ? 'active' : ''}`}
            onClick={() => setActiveTab('requests')}
          >
            <span className="nav-icon">💳</span>
            <span className="nav-text">Requests</span>
            {requests.length > 0 && <span className="nav-pill">{requests.length}</span>}
          </button>

          <button
            className={`nav-item ${activeTab === 'users' ? 'active' : ''}`}
            onClick={() => setActiveTab('users')}
          >
            <span className="nav-icon">👥</span>
            <span className="nav-text">Students</span>
          </button>

          <button
            className={`nav-item ${activeTab === 'chat' ? 'active' : ''}`}
            onClick={() => setActiveTab('chat')}
          >
            <span className="nav-icon">💬</span>
            <span className="nav-text">Live Chat</span>
          </button>

          <button
            className={`nav-item ${activeTab === 'analytics' ? 'active' : ''}`}
            onClick={() => setActiveTab('analytics')}
          >
            <span className="nav-icon">📈</span>
            <span className="nav-text">Analytics</span>
          </button>
        </nav>

        <div className="bento-sidebar-footer">
          <div className="auto-sync-box" onClick={() => setAutoRefresh(!autoRefresh)}>
            <span className={`sync-dot ${autoRefresh ? 'on' : ''}`}></span>
            <span>{autoRefresh ? 'Auto-Sync ON' : 'Auto-Sync OFF'}</span>
          </div>

          <button className="nav-item nav-signout" onClick={handleLogout}>
            <span className="nav-icon">🚪</span>
            <span className="nav-text">Sign out</span>
          </button>
        </div>
      </aside>

      {/* ── Main Content Area ── */}
      <main className="bento-main">
        {/* Top Header */}
        <header className="bento-header">
          <div className="bento-header-greeting">
            <h1>Hello, Admin welcome back</h1>
            <p>Real-time Virtual Card Operations & Payment Monitoring</p>
          </div>

          <div className="bento-header-right">
            <div className="bento-search-pill">
              <span className="search-icon-sm">🔍</span>
              <input
                type="text"
                placeholder="Search students, cards, IDs..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
              {searchQuery && (
                <button className="search-clear-sm" onClick={() => setSearchQuery('')}>✕</button>
              )}
            </div>

            <div className="bento-profile-pill">
              <div className="profile-avatar">🛡️</div>
              <div className="profile-info">
                <span className="profile-name">System Administrator</span>
                <span className="profile-role">Super Admin</span>
              </div>
              <span className="profile-status-dot"></span>
            </div>
          </div>
        </header>

        {error && <div className="bento-banner-error">⚠️ {error}</div>}

        {/* Dynamic Tab Switcher Content */}
        {activeTab === 'chat' ? (
          <div className="bento-card-full">
            <AdminChat adminKey={adminKey} />
          </div>
        ) : activeTab === 'users' ? (
          /* ── Students Tab ── */
          <div className="bento-card-full">
            <div className="bento-card-header">
              <h2>Student Roster & Verification</h2>
              <div className="bento-actions-group">
                <button
                  className={`bento-subtab ${userFilter === 'active' ? 'active' : ''}`}
                  onClick={() => setUserFilter('active')}
                >
                  Active
                </button>
                <button
                  className={`bento-subtab ${userFilter === 'deleted' ? 'active' : ''}`}
                  onClick={() => setUserFilter('deleted')}
                >
                  Deleted
                </button>

                {/* Country filter */}
                <select
                  value={countryFilter}
                  onChange={(e) => setCountryFilter(e.target.value)}
                  className="bento-select"
                >
                  <option value="all">🌍 All Countries</option>
                  {Object.entries(WEST_AFRICA_COUNTRIES).map(([code, c]) => (
                    <option key={code} value={code}>{c.flag} {c.name}</option>
                  ))}
                </select>

                <button onClick={exportUsersToCSV} className="bento-btn-sm btn-ghost">
                  📥 Export CSV
                </button>
                <button onClick={loadUsers} className="bento-btn-sm btn-indigo" disabled={loading}>
                  {loading ? '...' : '🔄 Refresh'}
                </button>
                <button
                  onClick={() => setShowCreateStudentModal(true)}
                  className="bento-btn-sm btn-indigo"
                  style={{ background: 'linear-gradient(135deg,#10b981,#059669)', fontWeight: 700 }}
                >
                  + Create Student
                </button>
              </div>
            </div>

            <div className="bento-table-wrapper">
              <table className="bento-table">
                <thead>
                  <tr>
                    <th>Student Name</th>
                    <th>BYU ID</th>
                    <th>Country</th>
                    <th>Pathway Email</th>
                    <th>Phone</th>
                    <th>Status</th>
                    <th>Joined</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredUsers.length === 0 ? (
                    <tr>
                      <td colSpan="8" className="bento-table-empty">
                        No student accounts found {searchQuery ? `matching "${searchQuery}"` : ''}.
                      </td>
                    </tr>
                  ) : (
                    filteredUsers.map((u) => (
                      <tr key={u._id || u.id}>
                        <td className="font-semibold text-white">{u.name}</td>
                        <td>
                          <code
                            className="bento-code-badge"
                            onClick={() => copyToClipboard(u.byuId, u._id || u.id)}
                          >
                            {u.byuId} {copiedId === (u._id || u.id) ? '✓' : '📋'}
                          </code>
                        </td>
                        <td>
                          <span className="country-pill">
                            {WEST_AFRICA_COUNTRIES[u.countryCode]?.flag || '🌍'} {countryLabel(u.countryCode || 'GH')}
                          </span>
                        </td>
                        <td>{u.email}</td>
                        <td>{u.phone}</td>
                        <td>
                          <span className={`bento-badge ${u.status === 'deleted' ? 'bento-badge-rose' : 'bento-badge-emerald'}`}>
                            {u.status || 'active'}
                          </span>
                        </td>
                        <td>{formatDate(u.createdAt)}</td>
                        <td>
                          <div style={{ display: 'flex', gap: '0.4rem', alignItems: 'center' }}>
                            {u.status !== 'deleted' && (
                              <button
                                onClick={() => handleImpersonate(u)}
                                className="bento-action-btn"
                                style={{ background: 'rgba(139,92,246,0.15)', color: '#a78bfa', border: '1px solid rgba(139,92,246,0.3)' }}
                                title="Impersonate this student for demo"
                              >
                                🎭 Demo
                              </button>
                            )}
                            {u.status === 'deleted' ? (
                              <button onClick={() => handleRestoreUser(u._id || u.id)} className="bento-action-btn green">Restore</button>
                            ) : (
                              <button onClick={() => handleDeleteUser(u._id || u.id)} className="bento-action-btn red">Delete</button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        ) : activeTab === 'requests' ? (
          /* ── Requests Detailed Tab ── */
          <div className="bento-card-full">
            <div className="bento-card-header">
              <h2>Virtual Card Applications ({filteredRequests.length})</h2>
              <div className="bento-actions-group">
                <select
                  value={filter}
                  onChange={(e) => setFilter(e.target.value)}
                  className="bento-select"
                >
                  <option value="">All Statuses</option>
                  <option value="pending">Pending</option>
                  <option value="assigned">Assigned</option>
                  <option value="paid">Paid</option>
                  <option value="expired">Expired</option>
                </select>
                <button onClick={exportRequestsToCSV} className="bento-btn-sm btn-ghost">
                  📥 Export CSV
                </button>
                <button onClick={loadDashboard} className="bento-btn-sm btn-indigo" disabled={loading}>
                  {loading ? '...' : '🔄 Refresh Data'}
                </button>
              </div>
            </div>

            <div className="bento-table-wrapper">
              <table className="bento-table">
                <thead>
                  <tr>
                    <th>Student & Country</th>
                    <th>Requested USD</th>
                    <th>Total Paid (GHS)</th>
                    <th>Payment Method</th>
                    <th>Card Status</th>
                    <th>Submitted</th>
                    <th>Action Controls</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredRequests.length === 0 ? (
                    <tr>
                      <td colSpan="7" className="bento-table-empty">
                        No requests found.
                      </td>
                    </tr>
                  ) : (
                    filteredRequests.map((r) => (
                      <tr key={r._id || r.id}>
                        <td>
                          <div className="table-name-bold">{r.student?.name || 'Unknown Student'}</div>
                          <div className="table-sub-info">
                            <span className="country-pill-xs">{countryLabel(r.student?.countryCode || 'GH')}</span>
                            <span className="sub-divider">•</span>
                            ID: <code>{r.student?.byuId || 'N/A'}</code>
                            <span className="sub-divider">•</span>
                            <span
                              className="token-click"
                              onClick={() => copyToClipboard(r.requestToken, r._id || r.id)}
                            >
                              {r.requestToken?.slice(0, 10)}... {copiedId === (r._id || r.id) ? '✓' : '📋'}
                            </span>
                          </div>
                        </td>
                        <td className="amount-highlight">${r.amount || 0} USD</td>
                        <td className="text-emerald">GHS {Number(r.totalPaidGHS || 0).toFixed(2)}</td>
                        <td>
                          <span className="bento-tag-purple">{(r.paymentMethod || 'momo-hubtel').toUpperCase()}</span>
                        </td>
                        <td>
                          <span className={`bento-badge ${getStatusBadge(r.status)}`}>
                            {(r.status || 'pending').toUpperCase()}
                          </span>
                        </td>
                        <td className="text-muted">{formatDate(r.createdAt)}</td>
                        <td>
                          <div className="bento-flex-actions">
                            {r.status === 'pending' && (
                              <>
                                <button onClick={() => openCardForm(r)} className="bento-action-btn indigo">Card</button>
                                <button onClick={() => handleAssignMock(r._id || r.id)} className="bento-action-btn cyan">Mock</button>
                                <button onClick={() => handleAction(r._id || r.id, 'declined')} className="bento-action-btn red">Decline</button>
                              </>
                            )}

                            {r.status === 'assigned' && (
                              <>
                                <button onClick={() => handleAction(r._id || r.id, 'paid')} className="bento-action-btn green">Paid</button>
                                <button onClick={() => handleAction(r._id || r.id, 'expired')} className="bento-action-btn amber">Expire</button>
                              </>
                            )}

                            {r.status === 'paid' && <span className="text-emerald font-semibold">✓ Completed</span>}
                            {r.status === 'expired' && <span className="text-rose font-semibold">⏰ Expired</span>}
                            {r.status === 'declined' && <span className="text-muted font-semibold">✗ Declined</span>}
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        ) : (
          /* ── Default Dashboard View (INSPIRED BENTO GRID) ── */
          <div className="bento-grid">

            {/* Bento Row 1: KPI Cards */}
            {/* KPI 1: Total Balance / Volume */}
            <div className="bento-card kpi-card">
              <div className="kpi-top">
                <span className="kpi-label">Total Volume Processed</span>
                <div className="bento-dropdown-pill">all time</div>
              </div>
              <div className="kpi-value">${totalVolume.toLocaleString()}</div>
              <div className="kpi-footer">
                <span className="kpi-trend green">↑ {paidCount} paid requests</span>
                {/* SVG Sparkline 1 */}
                <svg className="sparkline-svg" viewBox="0 0 120 30" preserveAspectRatio="none">
                  <defs>
                    <linearGradient id="gradViolet" x1="0%" y1="0%" x2="100%" y2="0%">
                      <stop offset="0%" stopColor="#8b5cf6" stopOpacity="1" />
                      <stop offset="100%" stopColor="#3b82f6" stopOpacity="1" />
                    </linearGradient>
                  </defs>
                  <path d="M0,25 Q15,5 30,20 T60,10 T90,18 T120,5" fill="none" stroke="url(#gradViolet)" strokeWidth="3" strokeLinecap="round" />
                </svg>
              </div>
            </div>

            {/* KPI 2: Total Expenses */}
            <div className="bento-card kpi-card">
              <div className="kpi-top">
                <span className="kpi-label">Processing Fees Est.</span>
                <div className="bento-dropdown-pill">all time</div>
              </div>
              <div className="kpi-value">${totalExpenses.toLocaleString()}</div>
              <div className="kpi-footer">
                <span className="kpi-trend" style={{ color: '#a78bfa' }}>↗ {totalStudents} students enrolled</span>
                {/* SVG Sparkline 2 */}
                <svg className="sparkline-svg" viewBox="0 0 120 30" preserveAspectRatio="none">
                  <defs>
                    <linearGradient id="gradPink" x1="0%" y1="0%" x2="100%" y2="0%">
                      <stop offset="0%" stopColor="#ec4899" stopOpacity="1" />
                      <stop offset="100%" stopColor="#8b5cf6" stopOpacity="1" />
                    </linearGradient>
                  </defs>
                  <path d="M0,10 Q20,25 40,15 T80,22 T120,8" fill="none" stroke="url(#gradPink)" strokeWidth="3" strokeLinecap="round" />
                </svg>
              </div>
            </div>

            {/* KPI 3: Active Virtual Card Widget */}
            <div className="bento-card card-widget-card">
              <div className="card-widget-top">
                <span className="kpi-label">Active Virtual Cards</span>
                <span className="view-all-link" onClick={() => setActiveTab('requests')}>view all</span>
              </div>
              <div className="mini-virtual-card">
                <div className="mini-card-top">
                  <span className="mini-card-bank">ConnectPay</span>
                  <span className="mini-card-logo">VISA</span>
                </div>
                <div className="mini-card-balance">
                  {assignedCount > 0 ? `${assignedCount} Active` : 'No Active Cards'}
                </div>
                <div className="mini-card-footer">
                  <span className="mini-card-num">{assignedCount} assigned</span>
                  <span className="mini-card-exp">{paidCount} paid</span>
                </div>
              </div>
            </div>

            {/* KPI 4: Request Status Categories Doughnut Chart */}
            <div className="bento-card doughnut-card">
              <div className="kpi-top">
                <span className="kpi-label">Request Breakdown</span>
                <div className="bento-dropdown-pill">{totalRequests} total</div>
              </div>
              <div className="doughnut-content">
                <div className="svg-donut-wrapper">
                  <svg viewBox="0 0 100 100" className="donut-svg">
                    <circle cx="50" cy="50" r="38" fill="none" stroke="#23253b" strokeWidth="12" />
                    {totalRequests === 0 ? (
                      <circle cx="50" cy="50" r="38" fill="none" stroke="#23253b" strokeWidth="12" strokeDasharray="238 0" />
                    ) : (
                      <>
                        {/* Paid Segment (Blue) */}
                        <circle cx="50" cy="50" r="38" fill="none" stroke="#3b82f6" strokeWidth="12"
                          strokeDasharray={`${paidSeg} ${CIRC - paidSeg}`} strokeDashoffset={paidOff} />
                        {/* Assigned Segment (Purple) */}
                        <circle cx="50" cy="50" r="38" fill="none" stroke="#8b5cf6" strokeWidth="12"
                          strokeDasharray={`${assignSeg} ${CIRC - assignSeg}`} strokeDashoffset={assignOff} />
                        {/* Pending Segment (Green) */}
                        <circle cx="50" cy="50" r="38" fill="none" stroke="#10b981" strokeWidth="12"
                          strokeDasharray={`${pendSeg} ${CIRC - pendSeg}`} strokeDashoffset={pendOff} />
                        {/* Expired Segment (Orange) */}
                        <circle cx="50" cy="50" r="38" fill="none" stroke="#f59e0b" strokeWidth="12"
                          strokeDasharray={`${expSeg} ${CIRC - expSeg}`} strokeDashoffset={expOff} />
                      </>
                    )}
                  </svg>
                  <div className="donut-center-text">
                    <span className="donut-num">{totalRequests}</span>
                    <span className="donut-sub">requests</span>
                  </div>
                </div>
                <div className="donut-legend">
                  <div className="legend-item"><span className="dot blue"></span> Paid {paidPct}% ({paidCount})</div>
                  <div className="legend-item"><span className="dot purple"></span> Assigned {assignPct}% ({assignedCount})</div>
                  <div className="legend-item"><span className="dot green"></span> Pending {pendPct}% ({pendingCount})</div>
                  <div className="legend-item"><span className="dot orange"></span> Expired {expPct}% ({expiredCount})</div>
                </div>
              </div>
            </div>

            {/* Bento Row 2: Dissection Bar Chart & Spending Gauges */}
            {/* Chart 1: Dissection Monthly Bar Chart */}
            <div className="bento-card bar-chart-card">
              <div className="kpi-top">
                <div className="bar-header-left">
                  <h3>Dissection & Trends</h3>
                  <div className="bar-legend-pills">
                    <span className="bar-pill purple"><span className="pill-dot"></span> Volume</span>
                    <span className="bar-pill blue"><span className="pill-dot"></span> Cards</span>
                  </div>
                </div>
                <div className="bento-dropdown-pill">last week ▾</div>
              </div>

              {/* Bar Chart Visual */}
              <div className="bar-chart-bars">
                {['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'].map((m, idx) => {
                  const h1 = [45, 65, 80, 50, 90, 75, 60, 85, 95, 70, 85, 60][idx];
                  const h2 = [30, 50, 60, 35, 70, 55, 45, 65, 75, 50, 65, 40][idx];
                  return (
                    <div key={m} className="bar-group">
                      <div className="bars-pair">
                        <div className="bar bar-purple" style={{ height: `${h1}%` }}></div>
                        <div className="bar bar-blue" style={{ height: `${h2}%` }}></div>
                      </div>
                      <span className="bar-month">{m}</span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Chart 2: Operational Parameters Radial Gauges */}
            <div className="bento-card gauges-card">
              <div className="kpi-top">
                <h3>Operational Parameters</h3>
                <div className="bento-dropdown-pill">last month ▾</div>
              </div>
              <div className="gauges-grid">
                {/* Gauge 1: Paid/Settlement Rate */}
                <div className="gauge-item">
                  <div className="gauge-ring-wrapper">
                    <svg viewBox="0 0 36 36" className="gauge-svg">
                      <path className="gauge-bg" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="#23253b" strokeWidth="3" />
                      <path className="gauge-fill green" strokeDasharray={`${settlementRate}, 100`} d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="#10b981" strokeWidth="3.5" />
                    </svg>
                    <span className="gauge-percent">{settlementRate}%</span>
                  </div>
                  <span className="gauge-label">Paid</span>
                </div>

                {/* Gauge 2: Assigned Rate */}
                <div className="gauge-item">
                  <div className="gauge-ring-wrapper">
                    <svg viewBox="0 0 36 36" className="gauge-svg">
                      <path className="gauge-bg" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="#23253b" strokeWidth="3" />
                      <path className="gauge-fill yellow" strokeDasharray={`${issuanceRate}, 100`} d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="#f59e0b" strokeWidth="3.5" />
                    </svg>
                    <span className="gauge-percent">{issuanceRate}%</span>
                  </div>
                  <span className="gauge-label">Assigned</span>
                </div>

                {/* Gauge 3: Pending Rate */}
                <div className="gauge-item">
                  <div className="gauge-ring-wrapper">
                    <svg viewBox="0 0 36 36" className="gauge-svg">
                      <path className="gauge-bg" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="#23253b" strokeWidth="3" />
                      <path className="gauge-fill pink" strokeDasharray={`${pendingRate}, 100`} d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="#ec4899" strokeWidth="3.5" />
                    </svg>
                    <span className="gauge-percent">{pendingRate}%</span>
                  </div>
                  <span className="gauge-label">Pending</span>
                </div>

                {/* Gauge 4: Total Students enrolled */}
                <div className="gauge-item">
                  <div className="gauge-ring-wrapper">
                    <svg viewBox="0 0 36 36" className="gauge-svg">
                      <path className="gauge-bg" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="#23253b" strokeWidth="3" />
                      <path className="gauge-fill cyan" strokeDasharray="99, 100" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="#06b6d4" strokeWidth="3.5" />
                    </svg>
                    <span className="gauge-percent">{totalStudents}</span>
                  </div>
                  <span className="gauge-label">Students</span>
                </div>
              </div>
            </div>

            {/* Bento Row 3: Recent Activity List & Income/Expenses Waves Chart */}
            {/* Activity List: Recent Card Requests */}
            <div className="bento-card activity-card">
              <div className="kpi-top">
                <h3>Recent Card Activity</h3>
                <div className="bento-dropdown-pill">last day ▾</div>
              </div>
              <div className="activity-list">
                {requests.slice(0, 4).map((r) => (
                  <div key={r._id || r.id} className="activity-item">
                    <div className="activity-icon-badge font-bold">
                      💳
                    </div>
                    <div className="activity-details">
                      <span className="activity-title">{r.student?.name || 'Student Request'}</span>
                      <span className="activity-sub">BYU ID: {r.student?.byuId || 'N/A'} • {formatDate(r.createdAt)}</span>
                    </div>
                    <div className="activity-right">
                      <span className="activity-amount">${r.amount || 0}</span>
                      <span className={`bento-badge ${getStatusBadge(r.status)}`}>{(r.status || 'pending').toUpperCase()}</span>
                    </div>
                  </div>
                ))}
                {requests.length === 0 && (
                  <div className="bento-table-empty" style={{ padding: '2rem' }}>No recent activity to display.</div>
                )}
              </div>
            </div>

            {/* Income & Expenses Dual Bezier Waves Chart */}
            <div className="bento-card waves-card">
              <div className="kpi-top">
                <div className="waves-header-left">
                  <h3>Income and Expenses</h3>
                  <div className="bar-legend-pills">
                    <span className="bar-pill purple"><span className="pill-dot"></span> Income</span>
                    <span className="bar-pill pink"><span className="pill-dot"></span> Expenses</span>
                  </div>
                </div>
                <div className="bento-dropdown-pill">last week ▾</div>
              </div>

              <div className="waves-svg-container">
                <svg className="waves-svg" viewBox="0 0 500 140" preserveAspectRatio="none">
                  <defs>
                    <linearGradient id="waveBlueGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#8b5cf6" stopOpacity="0.4" />
                      <stop offset="100%" stopColor="#8b5cf6" stopOpacity="0" />
                    </linearGradient>
                    <linearGradient id="wavePinkGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#ec4899" stopOpacity="0.4" />
                      <stop offset="100%" stopColor="#ec4899" stopOpacity="0" />
                    </linearGradient>
                  </defs>

                  {/* Grid Lines */}
                  <line x1="0" y1="20" x2="500" y2="20" stroke="#1c1e33" strokeDasharray="4 4" />
                  <line x1="0" y1="60" x2="500" y2="60" stroke="#1c1e33" strokeDasharray="4 4" />
                  <line x1="0" y1="100" x2="500" y2="100" stroke="#1c1e33" strokeDasharray="4 4" />

                  {/* Curve 1: Blue/Purple */}
                  <path d="M0,90 C80,30 150,110 230,40 C310,-10 380,100 500,30 L500,140 L0,140 Z" fill="url(#waveBlueGrad)" />
                  <path d="M0,90 C80,30 150,110 230,40 C310,-10 380,100 500,30" fill="none" stroke="#8b5cf6" strokeWidth="3" />

                  {/* Curve 2: Pink */}
                  <path d="M0,110 C90,60 170,120 250,70 C330,20 410,90 500,50 L500,140 L0,140 Z" fill="url(#wavePinkGrad)" />
                  <path d="M0,110 C90,60 170,120 250,70 C330,20 410,90 500,50" fill="none" stroke="#ec4899" strokeWidth="3" />

                  {/* Interactive Dot Tooltip – shows real total revenue */}
                  <circle cx="390" cy="42" r="6" fill="#8b5cf6" stroke="#ffffff" strokeWidth="2.5" />
                  <rect x="355" y="10" width="70" height="22" rx="11" fill="#6366f1" />
                  <text x="390" y="25" fill="#ffffff" fontSize="9" fontWeight="bold" textAnchor="middle">{waveTooltipValue}</text>
                </svg>

                <div className="waves-days">
                  <span>Monday</span>
                  <span>Tuesday</span>
                  <span>Wednesday</span>
                  <span>Thursday</span>
                  <span>Friday</span>
                  <span>Saturday</span>
                  <span>Sunday</span>
                </div>
              </div>
            </div>

            {/* Country Leaderboard Bento Card */}
            <div className="bento-card country-leaderboard-card">
              <div className="kpi-top">
                <h3>🌍 West Africa Leaderboard</h3>
                <div className="bento-dropdown-pill">by requests</div>
              </div>
              <div className="country-leaderboard-list">
                {countryStats.length === 0 ? (
                  <div className="bento-table-empty" style={{ padding: '1.5rem 0' }}>No country data yet.</div>
                ) : (
                  countryStats.slice(0, 6).map((c, i) => (
                    <div key={c.countryCode} className="country-row">
                      <span className="country-rank">#{i + 1}</span>
                      <span className="country-flag-name">
                        <span style={{ fontSize: '1.4rem' }}>{c.flag}</span>
                        <span className="country-name-text">{c.name}</span>
                      </span>
                      <div className="country-bar-wrap">
                        <div className="country-bar-fill" style={{ width: `${c.pct}%` }} />
                      </div>
                      <span className="country-count">{c.count}</span>
                    </div>
                  ))
                )}
              </div>
            </div>

          </div>
        )}
      </main>

      {/* Create Student Modal */}
      {showCreateStudentModal && (
        <div className="modal-overlay" onClick={closeCreateStudentModal}>
          <div className="bento-modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 480 }}>
            <div className="modal-header">
              <h2>🌍 Create Student</h2>
              <button className="modal-close" onClick={closeCreateStudentModal}>&times;</button>
            </div>

            {createStudentResult ? (
              <div style={{ padding: '1.5rem' }}>
                {createStudentResult.success ? (
                  <div style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>✅</div>
                    <h3 style={{ color: '#10b981', marginBottom: '.5rem' }}>Student Created!</h3>
                    <p style={{ color: '#94a3b8' }}>{createStudentResult.name} has been registered.</p>
                    <div style={{ background: '#1a1b2e', border: '1px solid #2d2f50', borderRadius: 12, padding: '1rem', margin: '1rem 0' }}>
                      <p style={{ color: '#a78bfa', margin: '0 0 .5rem' }}>Temporary Password</p>
                      <code style={{ color: '#fff', fontSize: '1.5rem', letterSpacing: 3 }}>{createStudentResult.tempPassword}</code>
                      <p style={{ color: '#64748b', fontSize: 12, marginTop: '.5rem' }}>Share this with the student so they can log in and change it.</p>
                    </div>
                    <button
                      className="bento-btn-primary"
                      onClick={closeCreateStudentModal}
                      style={{ marginTop: '.5rem' }}
                    >Done</button>
                  </div>
                ) : (
                  <div style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>❌</div>
                    <p style={{ color: '#f87171' }}>{createStudentResult.message}</p>
                    <button
                      className="bento-btn-sm btn-ghost"
                      onClick={() => setCreateStudentResult(null)}
                    >Try Again</button>
                  </div>
                )}
              </div>
            ) : (
              <form onSubmit={handleCreateStudent} className="modal-form">
                <div className="bento-form-row">
                  <div className="bento-input-group">
                    <label>Full Name *</label>
                    <input
                      type="text" required
                      value={createStudentForm.name}
                      onChange={(e) => setCreateStudentForm({ ...createStudentForm, name: e.target.value })}
                      placeholder="Kwame Mensah"
                    />
                  </div>
                  <div className="bento-input-group">
                    <label>BYU ID *</label>
                    <input
                      type="text" required
                      value={createStudentForm.byuId}
                      onChange={(e) => setCreateStudentForm({ ...createStudentForm, byuId: e.target.value })}
                      placeholder="123456789"
                    />
                  </div>
                </div>

                <div className="bento-input-group">
                  <label>Email *</label>
                  <input
                    type="email" required
                    value={createStudentForm.email}
                    onChange={(e) => setCreateStudentForm({ ...createStudentForm, email: e.target.value })}
                    placeholder="kwame@byupathway.org"
                  />
                </div>

                <div className="bento-form-row">
                  <div className="bento-input-group">
                    <label>Phone *</label>
                    <input
                      type="text" required
                      value={createStudentForm.phone}
                      onChange={(e) => setCreateStudentForm({ ...createStudentForm, phone: e.target.value })}
                      placeholder="+233 24 000 0000"
                    />
                  </div>
                  <div className="bento-input-group">
                    <label>WhatsApp</label>
                    <input
                      type="text"
                      value={createStudentForm.whatsappNumber}
                      onChange={(e) => setCreateStudentForm({ ...createStudentForm, whatsappNumber: e.target.value })}
                      placeholder="+233 24 000 0000"
                    />
                  </div>
                </div>

                <div className="bento-input-group">
                  <label>Country *</label>
                  <select
                    className="bento-select" required
                    value={createStudentForm.countryCode}
                    onChange={(e) => setCreateStudentForm({ ...createStudentForm, countryCode: e.target.value })}
                    style={{ width: '100%', padding: '10px 14px' }}
                  >
                    {Object.entries(WEST_AFRICA_COUNTRIES).map(([code, c]) => (
                      <option key={code} value={code}>{c.flag} {c.name} ({c.currency})</option>
                    ))}
                  </select>
                </div>

                <div className="modal-actions">
                  <button type="button" onClick={closeCreateStudentModal} className="bento-btn-sm btn-ghost">Cancel</button>
                  <button type="submit" className="bento-btn-primary" disabled={createStudentLoading}>
                    {createStudentLoading ? 'Creating...' : '🌍 Create Student →'}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      {/* Manual Card Assignment Modal */}
      {showCardForm && selectedRequest && (
        <div className="modal-overlay" onClick={closeCardForm}>
          <div className="bento-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>💳 Issue Virtual Card</h2>
              <button className="modal-close" onClick={closeCardForm}>&times;</button>
            </div>

            {/* Virtual Card Preview */}
            <div className="card-preview-wrapper">
              <div className="bento-virtual-card">
                <div className="card-preview-top">
                  <span className="card-chip"></span>
                  <span className="card-logo">VISA</span>
                </div>
                <div className="card-preview-num">
                  {cardDetails.cardNumber || '•••• •••• •••• ••••'}
                </div>
                <div className="card-preview-bot">
                  <div>
                    <span className="lbl">CARDHOLDER</span>
                    <span className="val">{cardDetails.cardholderName || 'STUDENT NAME'}</span>
                  </div>
                  <div>
                    <span className="lbl">EXPIRES</span>
                    <span className="val">{cardDetails.expiryDate || 'MM/YY'}</span>
                  </div>
                  <div>
                    <span className="lbl">CVV</span>
                    <span className="val">{cardDetails.cvv || '•••'}</span>
                  </div>
                </div>
              </div>
            </div>

            <form onSubmit={handleManualAssign} className="modal-form">
              <div className="bento-input-group">
                <label>16-Digit Card Number *</label>
                <input
                  type="text"
                  value={cardDetails.cardNumber}
                  onChange={(e) => {
                    const value = e.target.value.replace(/\s/g, '').replace(/\D/g, '');
                    const formatted = value.match(/.{1,4}/g)?.join(' ') || value;
                    setCardDetails({ ...cardDetails, cardNumber: formatted });
                  }}
                  placeholder="4111 2222 3333 4444"
                  maxLength="19"
                  required
                />
              </div>

              <div className="bento-input-group">
                <label>Cardholder Name *</label>
                <input
                  type="text"
                  value={cardDetails.cardholderName}
                  onChange={(e) => setCardDetails({ ...cardDetails, cardholderName: e.target.value.toUpperCase() })}
                  placeholder="JOHN DOE"
                  required
                />
              </div>

              <div className="bento-form-row">
                <div className="bento-input-group">
                  <label>Expiry (MM/YY) *</label>
                  <input
                    type="text"
                    value={cardDetails.expiryDate}
                    onChange={(e) => {
                      const value = e.target.value.replace(/\D/g, '');
                      let formatted = value;
                      if (value.length >= 2) formatted = value.slice(0, 2) + '/' + value.slice(2, 4);
                      setCardDetails({ ...cardDetails, expiryDate: formatted });
                    }}
                    placeholder="12/28"
                    maxLength="5"
                    required
                  />
                </div>

                <div className="bento-input-group">
                  <label>CVV *</label>
                  <input
                    type="text"
                    value={cardDetails.cvv}
                    onChange={(e) => {
                      const value = e.target.value.replace(/\D/g, '');
                      setCardDetails({ ...cardDetails, cvv: value });
                    }}
                    placeholder="789"
                    maxLength="4"
                    required
                  />
                </div>
              </div>

              <div className="modal-actions">
                <button type="button" onClick={closeCardForm} className="bento-btn-sm btn-ghost">Cancel</button>
                <button type="submit" className="bento-btn-primary">Confirm & Issue Card →</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default AdminDashboard;
