import React, { useState, useRef, useEffect } from 'react';
import './App.css';

function App() {
  const [file, setFile] = useState(null);
  const [tableData, setTableData] = useState([]);
  const [charts, setCharts] = useState({});
  const [totals, setTotals] = useState(null);
  const [holdings, setHoldings] = useState({});
  const [message, setMessage] = useState('');
  const [chatHistory, setChatHistory] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [chatLoading, setChatLoading] = useState(false);
  const [error, setError] = useState(null);
  const [isDarkTheme, setIsDarkTheme] = useState(true);
  const fileInputRef = useRef(null);

  // Clear errors after 5 seconds
  useEffect(() => {
    if (error) {
      const timer = setTimeout(() => setError(null), 5000);
      return () => clearTimeout(timer);
    }
  }, [error]);

  // Apply theme to document
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', isDarkTheme ? 'dark' : 'light');
  }, [isDarkTheme]);

  const handleFileChange = (e) => {
    setFile(e.target.files[0]);
    setError(null);
  };

  const handleUpload = async () => {
    if (!file) {
      setError('Please select a file first');
      return;
    }

    setIsLoading(true);
    setError(null);
    const formData = new FormData();
    formData.append('file', file);

    try {
      const response = await fetch('http://localhost:5000/api/upload', {
        method: 'POST',
        body: formData,
      });

      const responseText = await response.text();
      let data;
      try {
        data = JSON.parse(responseText);
      } catch (parseError) {
        console.error('Failed to parse JSON:', responseText);
        throw new Error('Invalid server response');
      }

      if (!response.ok) {
        throw new Error(data.error || 'Failed to process file');
      }

      if (data.success) {
        setTableData(data.table_data || []);
        setCharts(data.pie_charts || {});
        setTotals(data.totals || null);
        setHoldings(data.holdings || {});
      } else {
        throw new Error(data.error || 'Failed to process file');
      }
    } catch (error) {
      console.error('Upload error:', error);
      setError(error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSendMessage = async () => {
    const question = message.trim();
    if (!question) return;

    setChatLoading(true);
    setError(null);
    
    // Add user message to history
    const newHistory = [...chatHistory, { sender: 'user', message: question }];
    setChatHistory(newHistory);
    setMessage('');

    try {
      const response = await fetch('http://localhost:5000/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: question,
          chat_history: newHistory,
          portfolio_data: {
            totals,
            holdings
          }
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to get response');
      }

      // Add AI response to history
      setChatHistory([...newHistory, { 
        sender: 'ai', 
        message: data.response 
      }]);
      
    } catch (err) {
      setError(err.message);
    } finally {
      setChatLoading(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const formatCurrency = (value) => {
    if (value == null || isNaN(value)) return 'N/A';
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(value);
  };

  const getPnLColor = (value) => {
    if (value == null) return 'text-neutral';
    return value > 0 ? 'text-success' : value < 0 ? 'text-danger' : 'text-primary';
  };

  const toggleTheme = () => {
    setIsDarkTheme(!isDarkTheme);
  };

  return (
    <div className="app-container">
      {/* Error Toast */}
      {error && (
        <div className="error-toast">
          <div className="error-content">
            <svg className="error-icon" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
            </svg>
            {error}
          </div>
        </div>
      )}

      {/* Header */}
      <header className="app-header">
        <div className="header-content">
          <div className="header-text">
            <h1 className="main-title">
              <span className="title-icon">📊</span>
              AI Portfolio Advisor
            </h1>
            <p className="subtitle">Intelligent analysis for smarter investment decisions</p>
          </div>
          
          {/* Theme Toggle */}
          <button className="theme-toggle" onClick={toggleTheme} aria-label="Toggle theme">
            <div className="toggle-track">
              <div className="toggle-thumb">
                {isDarkTheme ? '🌙' : '☀️'}
              </div>
            </div>
          </button>
        </div>
      </header>

      <div className="main-content">
        {/* Portfolio Section */}
        <div className="portfolio-section">
          <div className="section-header">
            <h2 className="section-title">Portfolio Analysis</h2>
            <div className="section-divider"></div>
          </div>
          
          {/* File Upload */}
          <div className="upload-section">
            <label className="upload-label">Upload Portfolio CSV</label>
            <div className="upload-container">
              <div className="file-input-wrapper">
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileChange}
                  accept=".csv"
                  className="file-input"
                  id="file-upload"
                />
                <label htmlFor="file-upload" className="file-input-label">
                  <svg className="upload-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                  </svg>
                  {file ? file.name : 'Choose CSV file'}
                </label>
              </div>
              <button
                onClick={handleUpload}
                disabled={isLoading}
                className="analyze-btn"
              >
                <span className="btn-content">
                  {isLoading && <div className="spinner"></div>}
                  {isLoading ? 'Analyzing...' : 'Analyze Portfolio'}
                </span>
              </button>
            </div>
          </div>

          {/*Portfolio Charts*/}
          {charts.total && (
            <div className="portfolio-results">
              <div className="charts-grid">
                <div className="chart-card">
                  <h3 className="chart-title">Total Allocation</h3>
                  <div className="chart-container">
                    <img 
                      src={`data:image/png;base64,${charts.total}`} 
                      alt="Total Allocation" 
                      className="chart-image"
                    />
                  </div>
                </div>
                <div className="chart-card">
                  <h3 className="chart-title">Equity Holdings</h3>
                  <div className="chart-container">
                    <img 
                      src={`data:image/png;base64,${charts.equity}`} 
                      alt="Equity Breakdown" 
                      className="chart-image"
                    />
                  </div>
                </div>
                <div className="chart-card">
                  <h3 className="chart-title">Mutual Funds</h3>
                  <div className="chart-container">
                    <img 
                      src={`data:image/png;base64,${charts.mf}`} 
                      alt="MF Breakdown" 
                      className="chart-image"
                    />
                  </div>
                </div>
              </div>

              {/* Portfolio Summary */}
              {totals && (
                <div className="summary-card">
                  <h3 className="summary-title">Portfolio Summary</h3>
                  <div className="summary-grid">
                    <div className="summary-item">
                      <div className="summary-label">Total Invested</div>
                      <div className="summary-value">{formatCurrency(totals.total_investment)}</div>
                    </div>
                    <div className="summary-item">
                      <div className="summary-label">Current Value</div>
                      <div className={`summary-value ${getPnLColor(totals.current_value - totals.total_investment)}`}>
                        {formatCurrency(totals.current_value)}
                      </div>
                    </div>
                    <div className="summary-item">
                      <div className="summary-label">Total P&L</div>
                      <div className={`summary-value ${getPnLColor(totals.total_pnl)}`}>
                        {formatCurrency(totals.total_pnl)}
                        <span className="pnl-percent">({totals.pnl_percent?.toFixed(2)}%)</span>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Portfolio Table */}
              {tableData.length > 0 && (
                <div className="table-container">
                  <div className="table-wrapper">
                    <table className="portfolio-table">
                      <thead>
                        <tr>
                          <th>Stock</th>
                          <th>Qty</th>
                          <th>Avg Cost</th>
                          <th>LTP</th>
                          <th>Invested</th>
                          <th>Current</th>
                          <th>P&L</th>
                        </tr>
                      </thead>
                      <tbody>
                        {tableData.map((row, i) => (
                          <tr key={i}>
                            <td className="stock-name">{row.instrument}</td>
                            <td>{row.qty}</td>
                            <td>{formatCurrency(row.avg_cost)}</td>
                            <td>{formatCurrency(row.ltp)}</td>
                            <td>{formatCurrency(row.invested)}</td>
                            <td>{formatCurrency(row.current_value)}</td>
                            <td className={getPnLColor(row.pnl)}>
                              {formatCurrency(row.pnl)}
                              <span className="pnl-percent">({row.pnl_percent?.toFixed(2)}%)</span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Chat Advisor */}
        <div className="chat-section">
          <div className="section-header">
            <h2 className="section-title">AI Advisor</h2>
            <div className="section-divider"></div>
          </div>
          
          <div className="chat-container">
            <div className="chat-messages">
              {chatHistory.length === 0 ? (
                <div className="chat-empty">
                  <div className="empty-icon">🤖</div>
                  <p>Ask me anything about your portfolio or the stock market</p>
                  <div className="suggested-questions">
                    <span className="suggestion-chip">Portfolio analysis</span>
                    <span className="suggestion-chip">Risk assessment</span>
                    <span className="suggestion-chip">Market trends</span>
                  </div>
                </div>
              ) : (
                chatHistory.map((chat, i) => (
                  <div key={i} className={`message ${chat.sender === 'user' ? 'user-message' : 'ai-message'}`}>
                    <div className="message-avatar">
                      {chat.sender === 'user' ? '👤' : '🤖'}
                    </div>
                    <div className="message-content">
                      {chat.message.split('\n').map((para, j) => (
                        <p key={j}>{para}</p>
                      ))}
                    </div>
                  </div>
                ))
              )}
              {chatLoading && (
                <div className="message ai-message">
                  <div className="message-avatar">🤖</div>
                  <div className="message-content typing-indicator">
                    <div className="typing-dots">
                      <span></span>
                      <span></span>
                      <span></span>
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div className="chat-input-container">
              <div className="chat-input-wrapper">
                <textarea
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Ask about stocks, portfolio analysis, or market insights..."
                  className="chat-input"
                  rows="1"
                  disabled={chatLoading}
                />
                <button
                  onClick={handleSendMessage}
                  disabled={chatLoading || !message.trim()}
                  className="send-button"
                >
                  <svg className="send-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                  </svg>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;