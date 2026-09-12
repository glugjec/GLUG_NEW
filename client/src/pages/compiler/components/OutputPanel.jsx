import { useState, useRef, useEffect } from 'react';
import {
  Terminal as TerminalIcon,
  AlertTriangle,
  Clock,
  HardDrive,
  Copy,
  Check,
  CircleAlert,
  CheckCircle2,
  Trash2,
  CornerDownLeft,
  FileInput,
  Sparkles,
} from 'lucide-react';

export default function OutputPanel({
  terminalLogs = [],
  isRunning = false,
  isWaitingForInput = false,
  inputPrompt = '',
  onSendInput = () => {},
  onClearTerminal = () => {},
  result = null,
  stdin = '',
  onStdinChange = () => {},
  activeTab = 'terminal',
  setActiveTab = () => {},
  errorLines = [],
  onSelectErrorLine = () => {},
  language = 'python',
}) {
  const [inputValue, setInputValue] = useState('');
  const [copied, setCopied] = useState(false);
  const [inputHistory, setInputHistory] = useState([]);
  const [historyIndex, setHistoryIndex] = useState(-1);

  const inputRef = useRef(null);
  const terminalBottomRef = useRef(null);

  const hasError = (result && !result.success) || errorLines.length > 0;
  const errorCount = errorLines.length || (result && !result.success ? 1 : 0);

  useEffect(() => {
    if (activeTab === 'terminal') {
      terminalBottomRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [terminalLogs, isWaitingForInput, activeTab]);

  useEffect(() => {
    if (isWaitingForInput && activeTab === 'terminal') {
      inputRef.current?.focus();
    }
  }, [isWaitingForInput, activeTab]);

  useEffect(() => {
    if (hasError && terminalLogs.length === 0 && activeTab === 'terminal') {
      setActiveTab('errors');
    }
  }, [hasError, terminalLogs.length, activeTab, setActiveTab]);

  const handleSendInput = (e) => {
    if (e) e.preventDefault();
    const trimmed = inputValue;

    if (trimmed.trim()) {
      setInputHistory((prev) => [...prev, trimmed]);
    }
    setHistoryIndex(-1);

    onSendInput(trimmed);
    setInputValue('');
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleSendInput();
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      if (inputHistory.length > 0) {
        const nextIndex = historyIndex === -1 ? inputHistory.length - 1 : Math.max(0, historyIndex - 1);
        setHistoryIndex(nextIndex);
        setInputValue(inputHistory[nextIndex]);
      }
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      if (historyIndex !== -1) {
        const nextIndex = historyIndex + 1;
        if (nextIndex < inputHistory.length) {
          setHistoryIndex(nextIndex);
          setInputValue(inputHistory[nextIndex]);
        } else {
          setHistoryIndex(-1);
          setInputValue('');
        }
      }
    }
  };

  const handleCopy = async () => {
    let textToCopy = '';
    if (activeTab === 'terminal') {
      textToCopy = terminalLogs.map((log) => log.text).join('');
    } else if (activeTab === 'errors') {
      textToCopy = result?.error || '';
    } else if (activeTab === 'stdin') {
      textToCopy = stdin;
    }

    if (!textToCopy) return;

    try {
      await navigator.clipboard.writeText(textToCopy);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      const textarea = document.createElement('textarea');
      textarea.value = textToCopy;
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand('copy');
      document.body.removeChild(textarea);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="output-panel">
      <div className="output-tabs-container">
        <div className="output-tabs">
          <button
            type="button"
            className={`output-tab ${activeTab === 'terminal' ? 'active' : ''}`}
            onClick={() => setActiveTab('terminal')}
            id="terminal-tab-btn"
          >
            <TerminalIcon size={14} className="tab-icon" />
            <span>Terminal</span>
            {isWaitingForInput && <span className="tab-pulse-dot" title="Waiting for input" />}
          </button>

          <button
            type="button"
            className={`output-tab ${activeTab === 'stdin' ? 'active' : ''}`}
            onClick={() => setActiveTab('stdin')}
            id="stdin-tab-btn"
          >
            <FileInput size={14} className="tab-icon" />
            <span>Stdin</span>
            {stdin.trim() && <span className="tab-dot" />}
          </button>

          <button
            type="button"
            className={`output-tab ${activeTab === 'errors' ? 'active' : ''}`}
            onClick={() => setActiveTab('errors')}
            id="errors-tab-btn"
          >
            <AlertTriangle size={14} className="tab-icon" />
            <span>Errors</span>
            {errorCount > 0 && <span className="tab-badge">{errorCount}</span>}
          </button>
        </div>

        <div className="terminal-actions">
          {activeTab === 'terminal' && terminalLogs.length > 0 && (
            <button
              type="button"
              className="term-icon-btn"
              onClick={onClearTerminal}
              title="Clear Terminal"
              id="clear-terminal-btn"
            >
              <Trash2 size={13} />
              <span>Clear</span>
            </button>
          )}

          <button
            type="button"
            className="term-icon-btn"
            onClick={handleCopy}
            title="Copy Content"
            id="copy-output-btn"
          >
            {copied ? <Check size={13} className="text-emerald" /> : <Copy size={13} />}
            <span>{copied ? 'Copied' : 'Copy'}</span>
          </button>
        </div>
      </div>

      <div className="output-content">
        {activeTab === 'terminal' ? (
          <div className="terminal-container">
            {terminalLogs.length === 0 && !isRunning && !isWaitingForInput ? (
              <div className="output-empty">
                <div className="empty-icon-wrap">
                  <TerminalIcon className="empty-icon" size={28} />
                  <Sparkles className="empty-sparkle" size={14} />
                </div>
                <h3>Console Ready</h3>
                <p>
                  Press <strong>Run</strong> or hit <strong>Ctrl + Enter</strong> to compile and execute your code.
                </p>
                <div className="empty-hints">
                  <span className="hint-pill">Interactive inputs and prompts supported</span>
                  <span className="hint-pill">Multi-language standard streams</span>
                </div>
              </div>
            ) : (
              <div className="terminal-stream">
                {terminalLogs.map((log) => (
                  <div key={log.id} className={`terminal-line terminal-line-${log.type}`}>
                    {log.type === 'stdin' && <span className="terminal-prompt-sym">❯ </span>}
                    <span className="terminal-line-text">{log.text}</span>
                  </div>
                ))}

                {isWaitingForInput && (
                  <div className="terminal-waiting-banner">
                    <span className="waiting-pulse" />
                    <span>{inputPrompt ? `Waiting for input: "${inputPrompt}"` : 'Program waiting for input...'}</span>
                  </div>
                )}

                {isRunning && !isWaitingForInput && (
                  <div className="terminal-running-indicator">
                    <div className="small-spinner" />
                    <span>Executing program...</span>
                  </div>
                )}

                {result?.isInputMissing && (
                  <div className="terminal-input-prompt-box">
                    <AlertTriangle size={14} className="input-missing-icon" />
                    <div>
                      <strong>Standard input required:</strong> This program expects input via stdin.
                      <div className="input-missing-sub">Type your input below or configure the Batch Input tab.</div>
                    </div>
                  </div>
                )}

                <div ref={terminalBottomRef} />
              </div>
            )}

            <div className={`terminal-input-bar ${isWaitingForInput ? 'waiting' : ''}`}>
              <div className="prompt-indicator">
                <span className="prompt-arrow">❯</span>
              </div>
              <input
                ref={inputRef}
                type="text"
                className="terminal-input-field"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder={
                  isWaitingForInput
                    ? (inputPrompt ? `Enter value for: ${inputPrompt}` : 'Type input and press Enter...')
                    : isRunning
                    ? 'Send input to process...'
                    : 'Interactive input prompt...'
                }
                id="interactive-terminal-input"
                autoComplete="off"
                spellCheck="false"
              />
              <button
                type="button"
                className="terminal-send-btn"
                onClick={handleSendInput}
                disabled={!inputValue && !isWaitingForInput}
                title="Send Input (Enter)"
                id="terminal-send-btn"
              >
                <CornerDownLeft size={14} />
                <span>Send</span>
              </button>
            </div>
          </div>
        ) : activeTab === 'stdin' ? (
          <div className="batch-stdin-container">
            <div className="batch-stdin-header">
              <div>
                <h4>Standard Input Buffer (stdin)</h4>
                <p>Pre-fill multiline text input for competitive programming or test cases.</p>
              </div>
              {stdin && (
                <button type="button" className="clear-link-btn" onClick={() => onStdinChange('')}>
                  Clear
                </button>
              )}
            </div>
            <textarea
              className="batch-stdin-textarea"
              value={stdin}
              onChange={(e) => onStdinChange(e.target.value)}
              placeholder="Paste or type multiline inputs here...&#10;Line 1&#10;Line 2"
              id="batch-stdin-input"
              spellCheck="false"
            />
            <div className="batch-stdin-footer">
              <span className="char-count">{stdin.length} characters • {stdin.split('\n').filter(Boolean).length} lines</span>
              <span className="batch-hint">Supplied to the program on execution.</span>
            </div>
          </div>
        ) : (
          <div className="errors-container">
            {hasError ? (
              <div className="output-error">
                <div className="error-header">
                  <AlertTriangle className="error-icon" size={16} />
                  <span className="error-type">{result?.statusDescription || 'Execution Error'}</span>
                </div>
                <div className="error-body">{result?.error || 'Execution encountered an error.'}</div>
                {errorLines && errorLines.length > 0 && (
                  <div className="error-lines">
                    <span className="error-lines-label">Jump to line:</span>
                    {errorLines.map((line) => (
                      <button
                        type="button"
                        key={line}
                        className="error-line-badge clickable"
                        onClick={() => onSelectErrorLine(line)}
                        title={`Jump to line ${line}`}
                      >
                        <CircleAlert size={12} />
                        Line {line}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            ) : (
              <div className="output-empty">
                <CheckCircle2 className="empty-icon text-emerald" size={28} />
                <h3>No Errors</h3>
                <p>Program executed cleanly without syntax or runtime issues.</p>
              </div>
            )}
          </div>
        )}
      </div>

      {result && !isRunning && (
        <div className="output-footer">
          <div className="output-meta">
            <span className={`status-badge ${result.success ? 'success' : 'error'}`}>
              {result.success ? (
                <>
                  <CheckCircle2 size={12} /> {result.statusDescription || 'Accepted'}
                </>
              ) : (
                <>
                  <AlertTriangle size={12} /> {result.statusDescription || 'Error'}
                </>
              )}
            </span>
            {result.time && (
              <span className="meta-item" title="Execution Time">
                <Clock size={12} className="meta-icon" />
                {result.time}
              </span>
            )}
            {result.memory && (
              <span className="meta-item" title="Memory Usage">
                <HardDrive size={12} className="meta-icon" />
                {result.memory}
              </span>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
