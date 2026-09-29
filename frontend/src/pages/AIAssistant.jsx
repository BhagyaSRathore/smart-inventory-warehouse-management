import { useState, useRef, useEffect } from 'react';
import { askAI } from '../services/api';

export default function AIAssistant() {
  const [messages, setMessages] = useState([
    {
      role: 'assistant',
      content: "Hello! I'm your AI Inventory Assistant. I can help you with inventory insights, stock predictions, and recommendations. How can I assist you today?"
    }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const chatEndRef = useRef(null);

  const sampleQuestions = [
    'Which products are low in stock?',
    'What should I restock today?',
    'Which warehouse has the most stock?',
    'Which products may run out next week?',
    'Why is product M101 high risk?'
  ];

  const scrollToBottom = () => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading]);

  const handleSendMessage = async (question) => {
    if (isLoading) return;

    const userMessage = question || input;
    if (!userMessage.trim()) {
      setError('Please enter a message before sending.');
      return;
    }

    setMessages(prev => [...prev, { role: 'user', content: userMessage }]);
    setInput('');
    setError('');
    setIsLoading(true);

    try {
      const data = await askAI(userMessage.trim());
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: data.response || 'The AI returned an empty response.'
      }]);
    } catch (requestError) {
      const responseMessage = requestError.status === 401
        ? 'Please sign in again to use the AI assistant.'
        : requestError.data?.message || requestError.message || 'The AI assistant is temporarily unavailable. Please try again.';

      setMessages(prev => [...prev, { role: 'assistant', content: responseMessage }]);
    } finally {
      setIsLoading(false);
    }
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

          <div style={{ flex: 1, overflowY: 'auto', padding: '16px', backgroundColor: '#f9fafb', borderRadius: '8px', marginBottom: '16px' }} aria-live="polite">
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
                    maxWidth: '85%',
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

            {isLoading && (
              <div style={{ marginBottom: '16px', display: 'flex', justifyContent: 'flex-start' }}>
                <div
                  style={{
                    maxWidth: '80%',
                    padding: '12px 16px',
                    borderRadius: '12px',
                    backgroundColor: 'white',
                    color: '#6b7280',
                    boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
                    fontSize: '14px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px'
                  }}
                >
                  <span>🤖</span>
                  <span>AI is thinking & analyzing warehouse data...</span>
                </div>
              </div>
            )}
            <div ref={chatEndRef} />
          </div>

          {error && (
            <div role="alert" style={{ marginBottom: '12px', color: '#b91c1c', fontSize: '13px' }}>
              {error}
            </div>
          )}

          <div style={{ display: 'flex', gap: '8px' }}>
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
              disabled={isLoading}
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
            <button onClick={() => handleSendMessage()} className="btn btn-primary" disabled={isLoading}>
              {isLoading ? 'Thinking...' : 'Send'}
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
                disabled={isLoading}
                style={{
                  padding: '14px 16px',
                  border: '1px solid #e5e7eb',
                  borderRadius: '8px',
                  backgroundColor: 'white',
                  textAlign: 'left',
                  cursor: isLoading ? 'not-allowed' : 'pointer',
                  opacity: isLoading ? 0.6 : 1,
                  transition: 'all 0.2s',
                  fontSize: '14px'
                }}
                onMouseOver={(e) => {
                  if (!isLoading) {
                    e.currentTarget.style.backgroundColor = '#f9fafb';
                    e.currentTarget.style.borderColor = '#4f46e5';
                  }
                }}
                onMouseOut={(e) => {
                  e.currentTarget.style.backgroundColor = 'white';
                  e.currentTarget.style.borderColor = '#e5e7eb';
                }}
              >
                💬 {question}
              </button>
            ))}
          </div>

          <div style={{ marginTop: '24px', padding: '16px', backgroundColor: '#ecfdf5', borderRadius: '8px', border: '1px solid #a7f3d0' }}>
            <h4 style={{ fontSize: '14px', fontWeight: '600', color: '#047857', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span>✓</span> Connected Backend AI
            </h4>
            <p style={{ fontSize: '13px', color: '#065f46', lineHeight: '1.6', margin: 0 }}>
              Responses are powered by live warehouse inventory data and the Google Gemini & Gemma intelligence engine.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
