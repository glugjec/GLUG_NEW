import { Play, Square, Maximize2, Minimize2, Code2, Columns2, TerminalSquare, ZoomIn, ZoomOut } from 'lucide-react';
import LanguageSelector from './LanguageSelector';

export default function Header({
  selectedLanguage,
  onLanguageChange,
  onRun,
  onStop,
  isRunning,
  fontSize,
  onChangeFontSize,
  isFullscreen,
  onToggleFullscreen,
  mobileView,
  onChangeMobileView,
}) {
  const decreaseFontSize = () => {
    const current = Number(fontSize) || 14;
    const next = Math.max(12, current - 2);
    onChangeFontSize(String(next));
  };

  const increaseFontSize = () => {
    const current = Number(fontSize) || 14;
    const next = Math.min(24, current + 2);
    onChangeFontSize(String(next));
  };

  return (
    <header className="compiler-header">
      <div className="compiler-header-left">
        <div className="compiler-brand">
          <img src="/logo.png" alt="GLUG" className="compiler-brand-logo" />
          <div className="compiler-brand-info">
            <span className="compiler-brand-title">GLUG Compiler</span>
            <span className="compiler-brand-badge">IDE v2.0</span>
          </div>
        </div>

        <div className="compiler-header-separator" />

        <LanguageSelector
          selectedLanguage={selectedLanguage}
          onLanguageChange={onLanguageChange}
        />
      </div>

      <div className="compiler-header-center">
        <div className="mobile-view-tabs" role="tablist">
          <button
            type="button"
            className={`view-tab-btn ${mobileView === 'editor' ? 'active' : ''}`}
            onClick={() => onChangeMobileView('editor')}
            title="Code Editor View"
            role="tab"
            aria-selected={mobileView === 'editor'}
          >
            <Code2 size={14} />
            <span>Code</span>
          </button>
          <button
            type="button"
            className={`view-tab-btn ${mobileView === 'split' ? 'active' : ''}`}
            onClick={() => onChangeMobileView('split')}
            title="Split Screen View"
            role="tab"
            aria-selected={mobileView === 'split'}
          >
            <Columns2 size={14} />
            <span>Split</span>
          </button>
          <button
            type="button"
            className={`view-tab-btn ${mobileView === 'output' ? 'active' : ''}`}
            onClick={() => onChangeMobileView('output')}
            title="Console & Terminal View"
            role="tab"
            aria-selected={mobileView === 'output'}
          >
            <TerminalSquare size={14} />
            <span>Console</span>
          </button>
        </div>
      </div>

      <div className="compiler-header-right">
        <div className="font-size-stepper" title="Editor Font Size">
          <button
            type="button"
            className="font-stepper-btn"
            onClick={decreaseFontSize}
            title="Decrease font size"
            disabled={Number(fontSize) <= 12}
          >
            <ZoomOut size={13} />
          </button>
          <span className="font-size-label">{fontSize}px</span>
          <button
            type="button"
            className="font-stepper-btn"
            onClick={increaseFontSize}
            title="Increase font size"
            disabled={Number(fontSize) >= 24}
          >
            <ZoomIn size={13} />
          </button>
        </div>

        <button
          type="button"
          className="fullscreen-toggle-btn"
          onClick={onToggleFullscreen}
          title={isFullscreen ? 'Exit Fullscreen' : 'Enter Fullscreen'}
        >
          {isFullscreen ? <Minimize2 size={15} /> : <Maximize2 size={15} />}
        </button>

        <span className="compiler-keyboard-hint">Ctrl + Enter</span>

        {isRunning ? (
          <button
            type="button"
            className="compiler-stop-btn"
            onClick={onStop}
            id="stop-code-btn"
            title="Stop / Interrupt Execution"
          >
            <Square size={13} fill="currentColor" />
            <span>Stop</span>
          </button>
        ) : (
          <button
            type="button"
            className="compiler-run-btn"
            onClick={onRun}
            id="run-code-btn"
            title="Run Code (Ctrl+Enter)"
          >
            <Play size={14} fill="currentColor" />
            <span>Run</span>
          </button>
        )}
      </div>
    </header>
  );
}
