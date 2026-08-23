import { Play, Square } from 'lucide-react';
import LanguageSelector from './LanguageSelector';

export default function Header({
  selectedLanguage,
  onLanguageChange,
  onRun,
  onStop,
  isRunning,
}) {
  return (
    <header className="header">
      <div className="header-left">
        <div className="logo">
          <span className="logo-text">GLUG Compiler</span>
        </div>

        <div className="header-divider" />

        <LanguageSelector
          selectedLanguage={selectedLanguage}
          onLanguageChange={onLanguageChange}
        />
      </div>

      <div className="header-right">
        <span className="keyboard-hint">Ctrl + Enter</span>

        {isRunning ? (
          <button
            className="stop-btn"
            onClick={onStop}
            id="stop-code-btn"
            title="Stop / Interrupt Execution"
          >
            <Square className="stop-icon" size={14} fill="currentColor" />
            <span>Stop</span>
          </button>
        ) : (
          <button
            className="run-btn"
            onClick={onRun}
            id="run-code-btn"
            title="Run code (Ctrl+Enter)"
          >
            <Play className="run-icon" size={15} fill="currentColor" />
            <span>Run Code</span>
          </button>
        )}
      </div>
    </header>
  );
}
