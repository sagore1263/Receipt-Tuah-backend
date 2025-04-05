// Create a new component ChatAssistant.js
import { useState } from 'react';
import './App';

const ChatAssistant = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [message, setMessage] = useState('');
  const [conversation, setConversation] = useState([]);
  const [loading, setLoading] = useState(false);
  const API_KEY = 'AIzaSyCaAEMD3UyCQEPwEaRL6cQwR3bc5kwgWzk';
  const API_URL = 'http://127.0.0.1:8000/ai';

  const handleSend = async () => {
    if (!message.trim() || loading) return;

    try {
      setLoading(true);
      // Add user message to conversation
      setConversation(prev => [...prev, { type: 'user', content: message }]);
      
      const response = await fetch(`${API_URL}?subject=${encodeURIComponent(message)}`, {
        headers: {
          'Authorization': `Bearer ${API_KEY}`,
          'Content-Type': 'application/json'
        }
      });

      // Convert headers to object
      const headers = {};
      response.headers.forEach((value, name) => {
        headers[name] = value;
      });

      // Add API response to conversation
      setConversation(prev => [...prev, { 
        type: 'response', 
        content: headers 
      }]);
      
      setMessage('');
    } catch (error) {
      setConversation(prev => [...prev, { 
        type: 'error', 
        content: 'Failed to get response from API'
      }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={`chat-container ${isOpen ? 'open' : ''}`}>
      <div 
        className="chat-icon"
        onClick={() => setIsOpen(!isOpen)}
      >
        🤖
      </div>
      
      {isOpen && (
        <div className="chat-window">
          <div className="chat-header">
            <h3>AI Assistant</h3>
            <button 
              className="close-btn"
              onClick={() => setIsOpen(false)}
            >
              ×
            </button>
          </div>
          
          <div className="chat-messages">
            {conversation.map((msg, index) => (
              <div key={index} className={`message ${msg.type}`}>
                {msg.type === 'user' && <div className="user-msg">{msg.content}</div>}
                {msg.type === 'response' && (
                  <div className="response-msg">
                    <h4>Response Headers:</h4>
                    <pre>{JSON.stringify(msg, null, 2)}</pre>
                  </div>
                )}
                {msg.type === 'error' && (
                  <div className="error-msg">{msg.content}</div>
                )}
              </div>
            ))}
            {loading && <div className="loading">Loading...</div>}
          </div>
          
          <div className="chat-input">
            <input
              type="text"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleSend()}
              placeholder="Type your message..."
            />
            <button onClick={handleSend} disabled={loading}>
              Send
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default ChatAssistant;