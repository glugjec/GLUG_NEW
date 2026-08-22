import { useState } from 'react';
import {
  Terminal,
  AlertTriangle,
  Clock,
  HardDrive,
  Copy,
  Check,
  CircleAlert,
  CheckCircle2,
} from 'lucide-react';

export default function OutputPanel({ result, isRunning }) {
  const [activeTab, setActiveTab] = useState('output');
  const [copied, setCopied] = useState(false);

  const hasError = result && !result.success;
  const hasOutput = result && result.success && result.output;
  const errorCount = result?.errorLines?.length || 0;

  // Auto-switch to errors tab when errors occur
  const effectiveTab = hasError && activeTab === 'output' && !hasOutput ? 'errors' : activeTab;

  const handleCopy = async () => {
    const textToCopy = hasError ? result.error : result?.output || '';
    if (!textToCopy) return;

    try {
      await navigator.clipboard.writeText(textToCopy);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback
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
      {/* Tabs */}
      <div className="output-tabs">
        <button
          className={`output-tab ${effectiveTab === 'output' ? 'active' : ''}`}
          onClick={() => setActiveTab('output')}
          id="output-tab-btn"
        >
          Output
        </button>
        <button
          className={`output-tab ${effectiveTab === 'errors' ? 'active' : ''}`}
          onClick={() => setActiveTab('errors')}
          id="errors-tab-btn"
        >
          Errors
          {errorCount > 0 && <span className="tab-badge">{errorCount}</span>}
        </button>
      </div>

      {/* Content */}
      <div className="output-content">
        {isRunning ? (
          <div className="output-loading">
            <div className="loading-spinner" />
            <span className="loading-text">Compiling & executing...</span>
          </div>
        ) : !result ? (
          <div className="output-empty">
            <Terminal className="empty-icon" />
            <h3>No output yet</h3>
            <p>
              Write your code and click <strong>Run Code</strong> or press{' '}
              <strong>Ctrl + Enter</strong> to see the results here.
            </p>
          </div>
        ) : effectiveTab === 'output' ? (
          result.success ? (
            <div className="output-success">{result.output || '(No output)'}</div>
          ) : (
            <div className="output-error">
              <div className="error-header">
                <AlertTriangle className="error-icon" />
                <span className="error-type">{result.statusDescription}</span>
              </div>
              <div className="error-body">{result.error || result.output || 'Unknown error'}</div>
              {result.errorLines && result.errorLines.length > 0 && (
                <div className="error-lines">
                  {result.errorLines.map((line) => (
                    <span key={line} className="error-line-badge">
                      <CircleAlert size={12} />
                      Line {line}
                    </span>
                  ))}
                </div>
              )}
            </div>
          )
        ) : (
          // Errors tab
          <>
            {hasError ? (
              <div className="output-error">
                <div className="error-header">
                  <AlertTriangle className="error-icon" />
                  <span className="error-type">{result.statusDescription}</span>
                </div>
                <div className="error-body">{result.error || 'Unknown error'}</div>
                {result.errorLines && result.errorLines.length > 0 && (
                  <div className="error-lines">
                    {result.errorLines.map((line) => (
                      <span key={line} className="error-line-badge">
                        <CircleAlert size={12} />
                        Line {line}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            ) : (
              <div className="output-empty">
                <CheckCircle2 className="empty-icon" style={{ color: 'var(--accent-green)', opacity: 1 }} />
                <h3>No errors</h3>
                <p>Your code compiled and ran successfully!</p>
              </div>
            )}
          </>
        )}
      </div>

      {/* Footer */}
      {result && !isRunning && (
        <div className="output-footer">
          <div className="output-meta">
            <span className={`status-badge ${result.success ? 'success' : 'error'}`}>
              {result.success ? (
                <>
                  <CheckCircle2 size={12} /> {result.statusDescription}
                </>
              ) : (
                <>
                  <AlertTriangle size={12} /> {result.statusDescription}
                </>
              )}
            </span>
            {result.time && (
              <span className="meta-item">
                <Clock className="meta-icon" />
                {result.time}
              </span>
            )}
            {result.memory && (
              <span className="meta-item">
                <HardDrive className="meta-icon" />
                {result.memory}
              </span>
            )}
          </div>
          <button className="copy-btn" onClick={handleCopy} id="copy-output-btn">
            {copied ? <Check className="copy-icon" /> : <Copy className="copy-icon" />}
            {copied ? 'Copied!' : 'Copy'}
          </button>
        </div>
      )}
    </div>
  );
}
