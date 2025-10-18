import { useState, useEffect, useRef } from 'react';
import { io } from 'socket.io-client';

function LiveChat() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([]);
  const [inputMessage, setInputMessage] = useState('');
  const [userName, setUserName] = useState('');
  const [sessionId] = useState(() => `session-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`);
  const [connected, setConnected] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  
  const socketRef = useRef(null);
  const messagesEndRef = useRef(null);
  const typingTimeoutRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    // Get user name from localStorage or generate
    const savedName = localStorage.getItem('userByuId') || 
                       localStorage.getItem('userName') || 
                       `Student-${Math.floor(Math.random() * 1000)}`;
    setUserName(savedName);

    // Initialize socket connection
    const socket = io('http://localhost:3000', {
      transports: ['websocket', 'polling']
    });

    socketRef.current = socket;

    socket.on('connect', () => {
      console.log('✅ Connected to chat server');
      setConnected(true);
      socket.emit('join-chat', { sessionId, userName: savedName, isAdmin: false });
    });

    socket.on('disconnect', () => {
      console.log('❌ Disconnected from chat server');
      setConnected(false);
    });

    socket.on('previous-messages', (msgs) => {
      setMessages(msgs);
    });

    socket.on('new-message', (msg) => {
      setMessages(prev => [...prev, msg]);
      
      // Play sound for new messages
      if (msg.sender === 'admin' && !isOpen) {
        setUnreadCount(prev => prev + 1);
        playNotificationSound();
      }
    });

    socket.on('user-typing', ({ userName: typingUser, isTyping: typing }) => {
      setIsTyping(typing);
      if (typing) {
        setTimeout(() => setIsTyping(false), 3000);
      }
    });

    socket.on('message-error', (error) => {
      console.error('Message error:', error);
    });

    return () => {
      socket.disconnect();
    };
  }, []);

  const playNotificationSound = () => {
    // Simple beep sound
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

  const handleSendMessage = (e) => {
    e.preventDefault();
    
    if (!inputMessage.trim() || !connected) return;

    socketRef.current.emit('send-message', {
      sessionId,
      sender: 'user',
      senderName: userName,
      message: inputMessage.trim()
    });

    setInputMessage('');
    
    // Stop typing indicator
    socketRef.current.emit('typing', { sessionId, userName, isTyping: false });
  };

  const handleTyping = (e) => {
    setInputMessage(e.target.value);

    // Send typing indicator
    if (!typingTimeoutRef.current) {
      socketRef.current.emit('typing', { sessionId, userName, isTyping: true });
    }

    clearTimeout(typingTimeoutRef.current);
    typingTimeoutRef.current = setTimeout(() => {
      socketRef.current.emit('typing', { sessionId, userName, isTyping: false });
      typingTimeoutRef.current = null;
    }, 1000);
  };

  const toggleChat = () => {
    setIsOpen(!isOpen);
    if (!isOpen) {
      setUnreadCount(0);
    }
  };

  return (
    <>
      {/* Chat Button */}
      <button className="chat-button" onClick={toggleChat} title="Live Chat Support">
        <span className="chat-icon">💬</span>
        {unreadCount > 0 && (
          <span className="chat-badge">{unreadCount}</span>
        )}
      </button>

      {/* Chat Window */}
      {isOpen && (
        <div className="chat-window">
          {/* Chat Header */}
          <div className="chat-header">
            <div className="chat-header-info">
              <h3>Live Support</h3>
              <span className={`chat-status ${connected ? 'online' : 'offline'}`}>
                <span className="status-dot"></span>
                {connected ? 'Online' : 'Connecting...'}
              </span>
            </div>
            <button className="chat-close" onClick={toggleChat}>✕</button>
          </div>

          {/* Chat Messages */}
          <div className="chat-messages">
            {messages.length === 0 ? (
              <div className="chat-welcome">
                <div className="chat-welcome-icon">👋</div>
                <h4>Welcome to Live Support!</h4>
                <p>Hi {userName}! How can we help you today?</p>
              </div>
            ) : (
              messages.map((msg, index) => (
                <div 
                  key={msg._id || index} 
                  className={`chat-message ${msg.sender === 'user' ? 'user-message' : 'admin-message'}`}
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
              <div className="chat-message admin-message">
                <div className="message-bubble typing-indicator">
                  <span></span>
                  <span></span>
                  <span></span>
                </div>
              </div>
            )}
            
            <div ref={messagesEndRef} />
          </div>

          {/* Chat Input */}
          <form className="chat-input-form" onSubmit={handleSendMessage}>
            <input
              type="text"
              className="chat-input"
              value={inputMessage}
              onChange={handleTyping}
              placeholder="Type your message..."
              disabled={!connected}
            />
            <button 
              type="submit" 
              className="chat-send-btn"
              disabled={!connected || !inputMessage.trim()}
            >
              <span className="send-icon">➤</span>
            </button>
          </form>

          {/* Quick Replies */}
          <div className="chat-quick-replies">
            <button 
              className="quick-reply-btn"
              onClick={() => {
                setInputMessage('How do I register?');
                setTimeout(() => handleSendMessage({ preventDefault: () => {} }), 100);
              }}
            >
              How do I register?
            </button>
            <button 
              className="quick-reply-btn"
              onClick={() => {
                setInputMessage('When will I get my card?');
                setTimeout(() => handleSendMessage({ preventDefault: () => {} }), 100);
              }}
            >
              When will I get my card?
            </button>
          </div>
        </div>
      )}
    </>
  );
}

export default LiveChat;





