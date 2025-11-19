import { useState, useEffect, useRef } from 'react';
import { io } from 'socket.io-client';
import './AdminChat.css';

function AdminChat({ adminKey }) {
  const [socket, setSocket] = useState(null);
  const [activeSessions, setActiveSessions] = useState([]);
  const [selectedSession, setSelectedSession] = useState(null);
  const [messages, setMessages] = useState([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [connected, setConnected] = useState(false);
  const [unreadCounts, setUnreadCounts] = useState({});
  
  const messagesEndRef = useRef(null);
  const typingTimeoutRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    // Connect to Socket.io server
    const API_BASE = import.meta.env.VITE_API_URL || 
      (window.location.hostname === 'localhost' ? 'http://localhost:3000' : 'https://byupay.up.railway.app');
    
    const newSocket = io(API_BASE, {
      transports: ['websocket', 'polling']
    });

    newSocket.on('connect', () => {
      console.log('✅ Admin connected to chat server');
      setConnected(true);
      
      // Join as admin
      newSocket.emit('join-chat', { 
        sessionId: 'admin-all', 
        userName: 'Admin', 
        isAdmin: true 
      });

      // Request active chats
      newSocket.emit('get-active-chats');
    });

    newSocket.on('disconnect', () => {
      console.log('❌ Admin disconnected from chat server');
      setConnected(false);
    });

    newSocket.on('new-chat-session', ({ sessionId, userName }) => {
      console.log('🆕 New chat session:', sessionId, userName);
      setActiveSessions(prev => {
        if (!prev.find(s => s.sessionId === sessionId)) {
          return [...prev, { sessionId, userName }];
        }
        return prev;
      });
      
      // Increment unread count
      setUnreadCounts(prev => ({
        ...prev,
        [sessionId]: (prev[sessionId] || 0) + 1
      }));

      // Play notification sound
      playNotificationSound();
    });

    newSocket.on('new-user-message', ({ sessionId, senderName, message }) => {
      console.log('💬 New message from user:', sessionId);
      
      // If not viewing this session, increment unread
      if (selectedSession?.sessionId !== sessionId) {
        setUnreadCounts(prev => ({
          ...prev,
          [sessionId]: (prev[sessionId] || 0) + 1
        }));
        playNotificationSound();
      } else {
        // If viewing, add to messages
        setMessages(prev => [...prev, message]);
      }
    });

    newSocket.on('active-chats', (sessions) => {
      console.log('📋 Active chats:', sessions);
      // Convert to session objects
      const sessionObjects = sessions.map(sessionId => ({
        sessionId,
        userName: sessionId.split('-')[0] || 'User'
      }));
      setActiveSessions(sessionObjects);
    });

    newSocket.on('previous-messages', (msgs) => {
      setMessages(msgs);
    });

    newSocket.on('new-message', (msg) => {
      setMessages(prev => [...prev, msg]);
    });

    newSocket.on('user-typing', ({ userName, isTyping: typing }) => {
      setIsTyping(typing);
      if (typing) {
        setTimeout(() => setIsTyping(false), 3000);
      }
    });

    setSocket(newSocket);

    return () => {
      newSocket.disconnect();
    };
  }, []);

  const playNotificationSound = () => {
    const audioContext = new (window.AudioContext || window.webkitAudioContext)();
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();
    
    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);
    
    oscillator.frequency.value = 800;
    oscillator.type = 'sine';
    
    gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.5);
    
    oscillator.start(audioContext.currentTime);
    oscillator.stop(audioContext.currentTime + 0.5);
  };

  const selectSession = (session) => {
    setSelectedSession(session);
    setMessages([]);
    
    // Clear unread count
    setUnreadCounts(prev => ({
      ...prev,
      [session.sessionId]: 0
    }));
    
    // Join this specific session
    if (socket) {
      socket.emit('join-chat', {
        sessionId: session.sessionId,
        userName: 'Admin',
        isAdmin: true
      });
    }
  };

  const handleSendMessage = (e) => {
    e.preventDefault();
    
    if (!inputMessage.trim() || !socket || !selectedSession) return;

    socket.emit('send-message', {
      sessionId: selectedSession.sessionId,
      sender: 'admin',
      senderName: 'Admin',
      message: inputMessage.trim()
    });

    setInputMessage('');
    
    // Stop typing indicator
    socket.emit('typing', { 
      sessionId: selectedSession.sessionId, 
      userName: 'Admin', 
      isTyping: false 
    });
  };

  const handleTyping = (e) => {
    setInputMessage(e.target.value);

    if (!socket || !selectedSession) return;

    // Send typing indicator
    if (!typingTimeoutRef.current) {
      socket.emit('typing', { 
        sessionId: selectedSession.sessionId, 
        userName: 'Admin', 
        isTyping: true 
      });
    }

    clearTimeout(typingTimeoutRef.current);
    typingTimeoutRef.current = setTimeout(() => {
      socket.emit('typing', { 
        sessionId: selectedSession.sessionId, 
        userName: 'Admin', 
        isTyping: false 
      });
      typingTimeoutRef.current = null;
    }, 1000);
  };

  const sendQuickReply = (message) => {
    if (!socket || !selectedSession) return;

    socket.emit('send-message', {
      sessionId: selectedSession.sessionId,
      sender: 'admin',
      senderName: 'Admin',
      message: message
    });
  };

  return (
    <div className="admin-chat-container">
      <div className="admin-chat-header">
        <h2>💬 Live Support</h2>
        <span className={`admin-chat-status ${connected ? 'online' : 'offline'}`}>
          <span className="status-dot"></span>
          {connected ? 'Online' : 'Connecting...'}
        </span>
      </div>

      <div className="admin-chat-layout">
        {/* Sessions List */}
        <div className="admin-chat-sessions">
          <h3>Active Chats ({activeSessions.length})</h3>
          {activeSessions.length === 0 ? (
            <div className="no-sessions">
              <p>No active chats</p>
              <small>Students will appear here when they start a chat</small>
            </div>
          ) : (
            <div className="sessions-list">
              {activeSessions.map((session) => (
                <div
                  key={session.sessionId}
                  className={`session-item ${selectedSession?.sessionId === session.sessionId ? 'active' : ''}`}
                  onClick={() => selectSession(session)}
                >
                  <div className="session-avatar">👤</div>
                  <div className="session-info">
                    <div className="session-name">{session.userName}</div>
                    <div className="session-id">{session.sessionId}</div>
                  </div>
                  {unreadCounts[session.sessionId] > 0 && (
                    <span className="session-unread">{unreadCounts[session.sessionId]}</span>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Chat Window */}
        <div className="admin-chat-window">
          {selectedSession ? (
            <>
              <div className="chat-window-header">
                <div className="chat-user-info">
                  <div className="chat-avatar">👤</div>
                  <div>
                    <div className="chat-user-name">{selectedSession.userName}</div>
                    <div className="chat-session-id">{selectedSession.sessionId}</div>
                  </div>
                </div>
              </div>

              <div className="admin-chat-messages">
                {messages.length === 0 ? (
                  <div className="no-messages">
                    <p>No messages yet</p>
                    <small>Start the conversation</small>
                  </div>
                ) : (
                  messages.map((msg, index) => (
                    <div 
                      key={msg._id || index} 
                      className={`chat-message ${msg.sender === 'admin' ? 'admin-message' : 'user-message'}`}
                    >
                      <div className="message-bubble">
                        <div className="message-sender">{msg.senderName}</div>
                        <div className="message-text">{msg.message}</div>
                        <div className="message-time">
                          {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </div>
                      </div>
                    </div>
                  ))
                )}
                
                {isTyping && (
                  <div className="chat-message user-message">
                    <div className="message-bubble typing-indicator">
                      <span></span>
                      <span></span>
                      <span></span>
                    </div>
                  </div>
                )}
                
                <div ref={messagesEndRef} />
              </div>

              <div className="admin-quick-replies">
                <button onClick={() => sendQuickReply('Hello! How can I help you today?')}>
                  👋 Greeting
                </button>
                <button onClick={() => sendQuickReply('I\'m checking your payment status now...')}>
                  💳 Checking Payment
                </button>
                <button onClick={() => sendQuickReply('Your card will be assigned within 24 hours.')}>
                  ⏰ 24hr Response
                </button>
                <button onClick={() => sendQuickReply('Thank you for contacting us!')}>
                  ✅ Thank You
                </button>
              </div>

              <form className="admin-chat-input-form" onSubmit={handleSendMessage}>
                <input
                  type="text"
                  className="admin-chat-input"
                  value={inputMessage}
                  onChange={handleTyping}
                  placeholder="Type your message..."
                  disabled={!connected}
                />
                <button 
                  type="submit" 
                  className="admin-chat-send-btn"
                  disabled={!connected || !inputMessage.trim()}
                >
                  <span className="send-icon">➤</span>
                </button>
              </form>
            </>
          ) : (
            <div className="no-session-selected">
              <div className="empty-state-icon">💬</div>
              <h3>Select a chat to start</h3>
              <p>Choose a student from the list to view and respond to their messages</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default AdminChat;

