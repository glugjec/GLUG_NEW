import { useState, useRef, useEffect } from 'react';

export default function TerminalStdin({
  stdin,
  onChange,
  stdinOpen,
  setStdinOpen,
  height = 150,
  terminalHistory = [],
  onExecuteCommand
}) {
  const [isRaw, setIsRaw] = useState(false);
  const [currentInput, setCurrentInput] = useState('');
  const inputRef = useRef(null);
  const bodyRef = useRef(null);

  // Scroll to bottom of terminal body when history or input changes
  useEffect(() => {
    if (bodyRef.current) {
      bodyRef.current.scrollTop = bodyRef.current.scrollHeight;
    }
  }, [terminalHistory, currentInput, isRaw]);

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      // Execute command even if empty (to advance the prompt)
      onExecuteCommand && onExecuteCommand(currentInput);
      setCurrentInput('');
    }
  };

  const handleInputChange = (e) => {
    setCurrentInput(e.target.value);
  };

  const handleBodyClick = () => {
    if (!isRaw) {
      inputRef.current?.focus();
    }
  };

  const handleClear = () => {
    onExecuteCommand && onExecuteCommand('clear');
  };

  if (!stdinOpen) return null;

  return (
    <div className="terminal-window">
      {/* Terminal Header */}
      <div className="terminal-header">
        <div className="terminal-controls">
          <span 
            className="terminal-dot close" 
            title="Close Panel" 
            onClick={() => setStdinOpen(false)}
          />
          <span className="terminal-dot minimize" onClick={() => setStdinOpen(false)} />
          <span className="terminal-dot maximize" onClick={handleClear} title="Clear Terminal Log" />
        </div>
        <span className="terminal-title">stdin - bash - 80×24</span>
        <div className="terminal-actions">
          <button 
            className={`terminal-action-btn ${!isRaw ? 'active' : ''}`}
            onClick={() => setIsRaw(false)}
          >
            Terminal Mode
          </button>
          <button 
            className={`terminal-action-btn ${isRaw ? 'active' : ''}`}
            onClick={() => setIsRaw(true)}
          >
            Raw Mode (Stdin)
          </button>
        </div>
      </div>

      {/* Terminal Body */}
      <div className="terminal-body" ref={bodyRef} onClick={handleBodyClick} style={{ height: `${height}px` }}>
        {isRaw ? (
          <textarea
            className="terminal-raw-textarea"
            value={stdin}
            onChange={(e) => onChange && onChange(e.target.value)}
            placeholder="Type or paste raw stdin data here..."
            spellCheck="false"
          />
        ) : (
          <div className="terminal-interactive-container">
            {terminalHistory.map((line, idx) => {
              if (line.type === 'prompt') {
                return (
                  <div key={idx} className="terminal-line">
                    <span className="terminal-prompt">glug@compiler:~$</span>
                    <span className="terminal-line-content">{line.text}</span>
                  </div>
                );
              }
              if (line.type === 'error') {
                return (
                  <div key={idx} className="terminal-line error">
                    <span className="terminal-line-content" style={{ color: 'var(--accent-red)' }}>{line.text}</span>
                  </div>
                );
              }
              if (line.type === 'info') {
                return (
                  <div key={idx} className="terminal-line info">
                    <span className="terminal-line-content" style={{ color: 'var(--accent-orange)', opacity: 0.85 }}>{line.text}</span>
                  </div>
                );
              }
              // output / standard line
              return (
                <div key={idx} className="terminal-line output">
                  <span className="terminal-line-content">{line.text}</span>
                </div>
              );
            })}
            <div className="terminal-line active">
              <span className="terminal-prompt">glug@compiler:~$</span>
              <div className="terminal-input-wrap">
                <input
                  ref={inputRef}
                  type="text"
                  className="terminal-input-field"
                  value={currentInput}
                  onChange={handleInputChange}
                  onKeyDown={handleKeyDown}
                  autoComplete="off"
                  spellCheck="false"
                />
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
