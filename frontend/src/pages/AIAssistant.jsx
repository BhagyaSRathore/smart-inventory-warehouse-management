import { useState } from 'react';
import { askAI } from '../services/api';

export default function AIAssistant() {
  const [messages, setMessages] = useState([
    {
      role: 'assistant',
      content: 'Hello! I\'m your AI Inventory Assistant. I can help you with inventory insights, stock predictions, and recommendations. How can I assist you today?'
    }
  ]);
  const [input, setInput] = useState('');

  const sampleQuestions = [
    'Which products are low in stock?',
    'What should I restock today?',
    'Which warehouse has the most stock?',
    'Which products may run out next week?',
    'Why is product M101 high risk?'
  ];

  const handleSendMessage = (question) => {
    const userMessage = question || input;
    if (!userMessage.trim()) return;

    setMessages(prev => [...prev, { role: 'user', content: userMessage }]);
    setInput('');

    setTimeout(() => {
      const response = askAI(userMessage);
      setMessages(prev => [...prev, { role: 'assistant', content: response }]);
    }, 500);
  };

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">🤖 AI Assistant</h1>
        <p className="page-subtitle">Get intelligent insights and recommendations</p>
      </div>

      <div className="grid grid-2">
        <div className="card" style={{ minHeight: '600px', display: 'flex', flexDirection: 'column' }}>
          <div className="card-header">
            <h3 className="card-title">Chat</h3>
          </div>

          <div style={{ flex: 1, overflowY: 'auto', padding: '16px', backgroundColor: '#f9fafb', borderRadius: '8px', marginBottom: '16px' }}>
            {messages.map((message, index) => (
              <div
                key={index}
                style={{
                  marginBottom: '16px',
                  display: 'flex',
                  justifyContent: message.role === 'user' ? 'flex-end' : 'flex-start'
                }}
              >
                <div
                  style={{
                    maxWidth: '80%',
                    padding: '12px 16px',
                    borderRadius: '12px',
                    backgroundColor: message.role === 'user' ? '#4f46e5' : 'white',
                    color: message.role === 'user' ? 'white' : '#1f2937',
                    boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
                    whiteSpace: 'pre-wrap',
                    lineHeight: '1.6',
                    fontSize: '14px'
                  }}
                >
                  {message.role === 'assistant' && <span style={{ marginRight: '8px' }}>🤖</span>}
                  {message.content}
                </div>
              </div>
            ))}
          </div>

          <div style={{ display: 'flex', gap: '8px' }}>
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
              placeholder="Ask me anything about inventory..."
              style={{
                flex: 1,
                padding: '12px 16px',
                border: '1px solid #e5e7eb',
                borderRadius: '8px',
                fontSize: '14px',
                outline: 'none'
              }}
            />
            <button onClick={() => handleSendMessage()} className="btn btn-primary">
              Send
            </button>
          </div>
        </div>

        <div className="card">
          <div className="card-header">
            <h3 className="card-title">Sample Questions</h3>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {sampleQuestions.map((question, index) => (
              <button
                key={index}
                onClick={() => handleSendMessage(question)}
                style={{
                  padding: '14px 16px',
                  border: '1px solid #e5e7eb',
                  borderRadius: '8px',
                  backgroundColor: 'white',
                  textAlign: 'left',
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                  fontSize: '14px'
                }}
                onMouseOver={(e) => {
                  e.target.style.backgroundColor = '#f9fafb';
                  e.target.style.borderColor = '#4f46e5';
                }}
                onMouseOut={(e) => {
                  e.target.style.backgroundColor = 'white';
                  e.target.style.borderColor = '#e5e7eb';
                }}
              >
                💬 {question}
              </button>
            ))}
          </div>

          <div style={{ marginTop: '24px', padding: '16px', backgroundColor: '#fef3c7', borderRadius: '8px', border: '1px solid #f59e0b' }}>
            <h4 style={{ fontSize: '14px', fontWeight: '600', color: '#78350f', marginBottom: '8px' }}>
              ℹ️ Demo Mode
            </h4>
            <p style={{ fontSize: '13px', color: '#78350f', lineHeight: '1.6', margin: 0 }}>
              This is a frontend demo. In production, responses will be powered by Google Gemini API integrated through the Node.js backend.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
