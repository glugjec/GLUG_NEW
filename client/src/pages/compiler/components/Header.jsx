import { Play, Loader2 } from 'lucide-react';
import LanguageSelector from './LanguageSelector';

export default function Header({ selectedLanguage, onLanguageChange, onRun, isRunning }) {
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
        <button
          className={`run-btn ${isRunning ? 'loading' : ''}`}
          onClick={onRun}
          disabled={isRunning}
          id="run-code-btn"
          title="Run code (Ctrl+Enter)"
        >
          {isRunning ? (
            <Loader2 className="run-icon" />
          ) : (
            <Play className="run-icon" />
          )}
          <span>{isRunning ? 'Running...' : 'Run Code'}</span>
        </button>
      </div>
    </header>
  );
}
